// One seam, at the highest point: the HTTP API. Tests drive the real server
// and the real reader/parser, with only the network stubbed by a fetchImpl
// that serves recorded fixtures. Parsing correctness is therefore covered
// fixture-in -> JSON-out without testing internals (spec, Testing Decisions).

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { once } from 'node:events';
import { createApp } from '../server.mjs';
import { readCatalog } from '../reader.mjs';

const fixture = JSON.parse(
  await readFile(new URL('./fixtures/products.json', import.meta.url), 'utf8'),
);

// Boots the service on an ephemeral port; returns a fetch wrapper for it.
async function withService({ cacheTtlMs, reader, fetchImpl } = {}, run) {
  const { server } = createApp({
    cacheTtlMs,
    reader: reader ?? (() => readCatalog({ fetchImpl })),
  });
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const base = `http://127.0.0.1:${server.address().port}`;
  try {
    await run(base);
  } finally {
    server.close();
    await once(server, 'close');
  }
}

// Recorded anonymous capture, served as a 200 JSON response.
const serveFixture = async () => ({
  ok: true,
  status: 200,
  async json() {
    return fixture;
  },
});

const asHtml = () => ({ ok: true, status: 200, async json() { throw new SyntaxError('Unexpected token <'); } });
const asGated = () => ({ ok: false, status: 401, async json() { return {}; } });

test('GET /catalog returns 200 with normalized items and freshness', async () => {
  await withService({ fetchImpl: serveFixture }, async (base) => {
    const before = Date.now();
    const res = await fetch(`${base}/catalog`);
    const body = await res.json();

    assert.equal(res.status, 200);
    assert.equal(body.source, 'healthyselections.ca');
    assert.ok(Date.parse(body.fetchedAt) >= before, 'fetchedAt is the real fetch time');
    assert.ok(body.items.length > 0);

    // Contract shape, exactly: no browser-specific fields leak through.
    for (const item of body.items) {
      assert.deepEqual(Object.keys(item).sort(), [
        'bodyText',
        'priceCad',
        'sku',
        'title',
        'variantTitle',
      ]);
      assert.equal(typeof item.title, 'string');
      assert.equal(typeof item.variantTitle, 'string');
      assert.ok(item.priceCad === null || typeof item.priceCad === 'number');
    }
  });
});

test('prices are numbers and HTML is reduced to text', async () => {
  await withService({ fetchImpl: serveFixture }, async (base) => {
    const { items } = await (await fetch(`${base}/catalog`)).json();
    const priced = items.filter((item) => item.priceCad !== null);
    assert.ok(priced.length > 0, 'the real capture has prices');
    assert.ok(priced.every((item) => Number.isFinite(item.priceCad)));
    // Raw vendor naming survives: the menu builder owns canonical names.
    assert.ok(items.some((item) => /Case|Jar|Combo/i.test(item.title)));
    for (const item of items) {
      assert.ok(!item.bodyText.includes('<'), 'body_html is stripped to text');
    }
  });
});

test('a multi-variant product yields one item per variant', async () => {
  await withService({ fetchImpl: serveFixture }, async (base) => {
    const { items } = await (await fetch(`${base}/catalog`)).json();
    const expected = fixture.products.reduce((n, p) => n + p.variants.length, 0);
    assert.equal(items.length, expected);
  });
});

test('cache serves repeats without another upstream read, and refetches once stale', async () => {
  let calls = 0;
  const counting = async () => {
    calls += 1;
    return serveFixture();
  };

  await withService({ cacheTtlMs: 60_000, fetchImpl: counting }, async (base) => {
    const first = await (await fetch(`${base}/catalog`)).json();
    const second = await (await fetch(`${base}/catalog`)).json();
    assert.equal(calls, 1, 'second call served from cache');
    assert.equal(second.fetchedAt, first.fetchedAt, 'fetchedAt is the fetch, not the request');
  });

  await withService({ cacheTtlMs: 0, fetchImpl: counting }, async (base) => {
    await fetch(`${base}/catalog`);
    await fetch(`${base}/catalog`);
    assert.equal(calls, 3, 'a zero TTL refetches every time');
  });
});

test('concurrent callers share a single upstream read', async () => {
  let calls = 0;
  const slow = async () => {
    calls += 1;
    await new Promise((r) => setTimeout(r, 20));
    return serveFixture();
  };

  await withService({ cacheTtlMs: 60_000, fetchImpl: slow }, async (base) => {
    const responses = await Promise.all(
      Array.from({ length: 5 }, () => fetch(`${base}/catalog`)),
    );
    assert.ok(responses.every((r) => r.status === 200));
    assert.equal(calls, 1);
  });
});

test('malformed upstream body is 502 upstream_error', async () => {
  await withService({ fetchImpl: asHtml }, async (base) => {
    const res = await fetch(`${base}/catalog`);
    const body = await res.json();
    assert.equal(res.status, 502);
    assert.equal(body.status, 'upstream_error');
    assert.ok(body.remedy, 'the failure names what to do next');
  });
});

test('a gated endpoint (HS closing /products.json) surfaces as 502', async () => {
  await withService({ fetchImpl: asGated }, async (base) => {
    const res = await fetch(`${base}/catalog`);
    assert.equal(res.status, 502);
    assert.equal((await res.json()).status, 'upstream_error');
  });
});

test('an unreachable vendor is 502, and health says upstream_error', async () => {
  const down = async () => {
    throw new Error('ECONNREFUSED');
  };
  await withService({ fetchImpl: down }, async (base) => {
    const res = await fetch(`${base}/catalog`);
    assert.equal(res.status, 502);

    const health = await (await fetch(`${base}/health`)).json();
    assert.equal(health.status, 'upstream_error');
    assert.ok(health.lastAttemptAt, 'the failed attempt is still recorded');
    assert.equal(health.lastSuccessAt, null);
  });
});

test('login_expired is never emitted by this session-less adapter', async () => {
  await withService({ fetchImpl: asGated }, async (base) => {
    const health = await (await fetch(`${base}/health`)).json();
    assert.notEqual(health.status, 'login_expired');
  });
});

test('GET /health before any read is ok with null timestamps', async () => {
  await withService({ fetchImpl: serveFixture }, async (base) => {
    const health = await (await fetch(`${base}/health`)).json();
    assert.deepEqual(health, { status: 'ok', lastAttemptAt: null, lastSuccessAt: null });
  });
});

test('a successful read then a failure leaves the last good answer on record', async () => {
  let mode = 'good';
  const flaky = async () => {
    if (mode === 'good') return serveFixture();
    throw new Error('boom');
  };

  await withService({ cacheTtlMs: 0, fetchImpl: flaky }, async (base) => {
    const ok = await (await fetch(`${base}/catalog`)).json();
    const succeededAt = ok.fetchedAt;

    mode = 'bad';
    assert.equal((await fetch(`${base}/catalog`)).status, 502);

    const health = await (await fetch(`${base}/health`)).json();
    assert.equal(health.status, 'upstream_error');
    assert.equal(health.lastSuccessAt, succeededAt, 'last success is remembered');
    assert.ok(health.lastAttemptAt > succeededAt, 'the failed attempt is newer');
  });
});

test('unknown paths 404 with the endpoint list; non-GET 405s', async () => {
  await withService({ fetchImpl: serveFixture }, async (base) => {
    const missing = await fetch(`${base}/prices`);
    assert.equal(missing.status, 404);
    assert.deepEqual((await missing.json()).endpoints, ['/health', '/catalog']);

    const posted = await fetch(`${base}/catalog`, { method: 'POST' });
    assert.equal(posted.status, 405);
  });
});
