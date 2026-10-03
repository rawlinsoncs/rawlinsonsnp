---
type: Process
title: HS Price Service
description: Vendor adapter serving the Healthy Selections catalog and prices over HTTP from an anonymous read of the Shopify products.json endpoint.
tags: [snp, automation, service, healthy-selections, prices]
status: stable
generated: { by: opencode/glm-5.3, at: 2026-09-30T14:40:00Z }
stale_after: 2027-03-30T00:00:00Z
sources:
  - id: adr-0002
    resource: ../../docs/adr/0002-hs-catalog-reads-are-anonymous.md
    title: ADR 0002 — HS catalog reads are anonymous
  - id: service-readme
    resource: ../../services/hs-prices/README.md
    title: HS price service endpoints and operations
  - id: adr-0001
    resource: ../../docs/adr/0001-spreadsheet-as-integration-bus.md
    title: ADR 0001 — The pantry spreadsheet is the integration bus
---

# HS Price Service

The price service answers "what does Healthy Selections currently sell, and at
what price?" over HTTP, so [Menu Building](./menu-building.md) can cost a week
of gap-fill orders without scraping a login-gated storefront. It is a vendor
adapter: the first implementation of the adapter contract that future
suppliers (Costco, and others) will follow.

- Runs on the program machine as a container, `hs-prices`, localhost-only
  (`:8787`) — no authentication, so the bind never leaves loopback.
- `GET /catalog` → `{ fetchedAt, source, items: [{ title, variantTitle,
  priceCad, sku, bodyText }] }`, one item per variant, 15-minute in-memory
  cache.
- `GET /health` → `{ status, lastAttemptAt, lastSuccessAt }`.

## Where the prices come from

A plain anonymous HTTPS GET of
`https://healthyselections.ca/products.json` (ADR 0002). No browser, no login,
no session. The vendor's own naming is passed through untouched — the sheet is
the vocabulary owner, so canonical-name mapping stays with the
[menu builder](./menu-building.md).

The coordinator's Chromium login profile (`services/hs-prices/setup.sh`) is
kept on disk but **dormant**: it is the fallback if the endpoint is ever
gated.

## When it fails

`/catalog` returns `502 { status: "upstream_error" }` and `/health` reports
`upstream_error` if the vendor read fails. That includes the case HS closes
`/products.json` — a real, accepted risk in ADR 0002. The menu builder then
runs degraded (gap list, no prices, flagged). Recovery is either a retry or,
if the gate is permanent, running the setup wizard to log a human in.

Full endpoint contract, config, test and deploy notes: the
[service README](../../services/hs-prices/README.md). Verify after any deploy
with `services/hs-prices/smoke.sh`.