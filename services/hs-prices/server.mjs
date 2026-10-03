// HS price service: the vendor-adapter HTTP contract.
// Spec: .scratch/hs-price-service/spec.md. Contract rationale: ADR 0002.
//
// GET /health  -> { status, lastAttemptAt, lastSuccessAt }
//   status: "ok" | "login_expired" | "upstream_error". This adapter has no
//   session, so "login_expired" is contract-reserved for session-based
//   adapters and is never emitted here (see spec, Failure semantics).
//
// GET /catalog -> { fetchedAt, source, items: [{ title, variantTitle,
//                 priceCad, sku, bodyText }] }
//
// Read path: anonymous GET of healthyselections.ca/products.json (ADR 0002),
// cached in memory so a menu run can ask freely without hammering the vendor.

import { createServer } from 'node:http';
import { readCatalog, UpstreamError } from './reader.mjs';

const SOURCE = 'healthyselections.ca';
const DEFAULT_PORT = 8787;
const DEFAULT_CACHE_TTL_MS = 15 * 60 * 1000;

export function createApp({ reader = readCatalog, cacheTtlMs = DEFAULT_CACHE_TTL_MS } = {}) {
  // Nothing persisted: prices are live vendor data, and history accrues from
  // order-confirmation emails, not from here.
  const state = { fetchedAt: null, items: null, lastAttemptAt: null, lastSuccessAt: null, status: 'ok' };
  let inflight = null;

  async function catalog() {
    if (cacheIsFresh()) return { fetchedAt: state.fetchedAt, source: SOURCE, items: state.items };
    // One upstream read at a time, however many callers arrive.
    inflight ??= (async () => {
      state.lastAttemptAt = new Date().toISOString();
      try {
        const { items } = await reader();
        state.items = items;
        state.fetchedAt = new Date().toISOString();
        state.lastSuccessAt = state.fetchedAt;
        state.status = 'ok';
      } catch (error) {
        state.status = 'upstream_error';
        throw error;
      } finally {
        inflight = null;
      }
    })();
    try {
      await inflight;
    } catch (cause) {
      throw new UpstreamError(cause.message);
    }
    return { fetchedAt: state.fetchedAt, source: SOURCE, items: state.items };
  }

  function cacheIsFresh() {
    return state.fetchedAt !== null && Date.now() - Date.parse(state.fetchedAt) < cacheTtlMs;
  }

  function health() {
    // status reports the last *attempt*: a service that answered once and is
    // now failing is not "ok" even though lastSuccessAt is still on record.
    return {
      status: state.status,
      lastAttemptAt: state.lastAttemptAt,
      lastSuccessAt: state.lastSuccessAt,
    };
  }

  const server = createServer((req, res) => {
    const path = (req.url ?? '').split('?')[0].replace(/\/$/, '') || '/';
    if (req.method !== 'GET') return send(res, 405, { error: 'method_not_allowed' });

    if (path === '/health') return send(res, 200, health());

    if (path === '/catalog') {
      return catalog().then(
        (body) => send(res, 200, body),
        (error) => {
          console.error(`[hs-prices] catalog read failed: ${error.message}`);
          return send(res, 502, {
            status: 'upstream_error',
            detail: error.message,
            remedy: 'retry later; if HS gated /products.json, see docs/adr/0002-hs-catalog-reads-are-anonymous.md',
          });
        },
      );
    }

    return send(res, 404, { error: 'not_found', endpoints: ['/health', '/catalog'] });
  });

  return { server, catalog, health };
}

function send(res, status, body) {
  const json = JSON.stringify(body, null, 2);
  res.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'content-length': Buffer.byteLength(json),
  });
  res.end(json);
}

if (import.meta.main) {
  const port = Number(process.env.PORT ?? DEFAULT_PORT);
  const cacheTtlMs = Number(process.env.CACHE_TTL_MS ?? DEFAULT_CACHE_TTL_MS);
  // Localhost by default: no auth, so a plain `node server.mjs` must not be
  // reachable from the LAN. In a container we bind 0.0.0.0 and let compose
  // publish that as 127.0.0.1-only, which keeps the same guarantee.
  const host = process.env.BIND_HOST ?? '127.0.0.1';
  const { server } = createApp({ cacheTtlMs });
  server.listen(port, host, () => {
    console.log(`[hs-prices] listening on http://${host}:${port} (cache ${cacheTtlMs}ms)`);
  });
}
