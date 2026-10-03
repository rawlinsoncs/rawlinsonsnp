# HS price service

A vendor adapter that answers "what does Healthy Selections currently sell,
at what price?" over HTTP, so menu-planning runs can cost a week of snacks
without scraping a login-gated storefront.

Spec: `.scratch/hs-price-service/spec.md`. Read decision:
`docs/adr/0002-hs-catalog-reads-are-anonymous.md`.

## Endpoints

Both are `GET`, both return JSON, and both are **localhost-only** (no auth,
so the bind is loopback).

### `GET /health`

```json
{ "status": "ok", "lastAttemptAt": "...", "lastSuccessAt": "..." }
```

`status` is `ok` or `upstream_error`, and reports the **last attempt** — a
service that answered once and is now failing reports `upstream_error`, not
`ok`, with `lastSuccessAt` still on record. `login_expired` is part of the
contract for future session-based adapters and is never emitted here: this
adapter has no session (ADR 0002). Both timestamps are `null` until the first
read.

### `GET /catalog`

```json
{
  "fetchedAt": "2026-09-30T14:27:11.204Z",
  "source": "healthyselections.ca",
  "items": [
    {
      "title": "Shire's Halloween Sprinkle Cookies (120 Units per Case)",
      "variantTitle": "Default Title",
      "priceCad": 108,
      "sku": null,
      "bodyText": "PRE-ORDER YOUR HALLOWEEN COOKIES !! ..."
    }
  ]
}
```

- One item **per variant** — case sizes are separate variants with separate
  prices, and the menu builder prices each pack size separately.
- `title` and `variantTitle` are **raw vendor naming**. The menu builder owns
  canonical names; the sheet is the vocabulary owner.
- `bodyText` is `body_html` with tags stripped (entities decoded).
- `sku` is `null` for HS — the storefront does not populate SKUs. The field
  stays in the contract because other suppliers do.
- `fetchedAt` is the time of the real upstream read, not the request time, so
  a cached answer is honestly labelled. Cache TTL is 15 minutes by default.

Failures return `502` with `{ "status": "upstream_error", "detail": "...",
"remedy": "..." }`. This is how a closed gate surfaces if HS ever locks
`/products.json` (the risk ADR 0002 accepts).

## Running it

```bash
# Tests (no network; a recorded fixture stands in for the vendor)
npm test

# Live, on the host
node server.mjs                    # http://127.0.0.1:8787

# In a container
docker compose up -d --build       # from this directory
./smoke.sh                         # hits the running service
docker compose logs -f
```

`smoke.sh` is the deploy check: it fails if the service is unhealthy,
`/catalog` errors, or the catalog comes back without prices. A gate looks
exactly like an empty or priceless catalog, so that assertion is the point.

## Configuration

Read from the environment; defaults in parentheses. The wizard's `.env` in the
repo root stays the place these are recorded.

| Variable | Default | Meaning |
| --- | --- | --- |
| `PORT` | `8787` | localhost port to listen on |
| `CACHE_TTL_MS` | `900000` | how long a fetched catalog stays fresh (15 min) |
| `BIND_HOST` | `127.0.0.1` | override only if you know why you'd expose it |

## Layout

- `reader.mjs` — everything vendor-specific: the anonymous
  `products.json` fetch, pagination, and normalization to the item shape.
  All other suppliers will need their own reader.
- `server.mjs` — the vendor-agnostic HTTP contract, cache, and failure
  mapping. Do not put vendor knowledge here.
- `test/service.test.mjs` — the tests. One seam, at the HTTP API: the real
  server and real parser, with only the network stubbed.
- `test/fixtures/products.json` — a trimmed capture of a real
  `/products.json` response (recorded 2026-09-30; 3 products, 6 variants).
  Refresh it with
  `curl -fsS 'https://healthyselections.ca/products.json?limit=250'`.
- `setup.sh` + `verify-login.cjs` — the dormant Chromium login path. Not used
  by this adapter; kept per ADR 0002 as the fallback if the endpoint is ever
  gated. See the ADR before touching it.

## When the endpoint is ever gated

`/catalog` answers `502 upstream_error`, `/health` says `upstream_error`, and
menu runs fall back to the degraded path (gap list, no prices, flagged). Then:

1. Run `services/hs-prices/setup.sh` to log a coordinator into Chromium.
2. Either read prices through that profile, or — if the gate is permanent —
   revisit ADR 0002 and record a new decision.
