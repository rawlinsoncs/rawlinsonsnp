# Spec: HS price service

Status: ready-for-agent

## Problem Statement

Menu planning needs current Healthy Selections prices and catalog items: the
menu builder drafts the week's gap-fill order and reports cost per child per
day, and both require knowing what HS sells, in what pack sizes, at what
price, *this week*. The HS catalog is login-gated (verified: anonymous fetch
returns nothing), so no agent can read it without the program's credentials —
and copying prices off the site by hand every week defeats the coordinator's
phone-first constraint. The program machine already runs a fleet of Docker
services; today there is no endpoint anywhere that answers "what does HS
currently sell, at what price?"

> **2026-09-30 update (ADR 0002):** only the HTML storefront is gated;
> `/products.json` answers anonymously with the full catalog. The problem
> stands; the assumed constraint does not.

## Solution

A small Dockerized HTTP service on the program machine that serves the
current HS catalog as JSON on demand. Its read path is the anonymous Shopify
`/products.json` endpoint (found readable without a login during the ticket
01 verification run — see ADR 0002): on request, it fetches the endpoint,
normalizes the result, and returns items with prices and a freshness
timestamp. The Chromium profile + wizard from ticket 01 are retained as the
documented fallback if the endpoint is ever gated. This is the first vendor
adapter under ADR 0001: adapters carry reference data (prices), the sheet
carries state (orders, inventory) — the two never mix.

## User Stories

1. As the menu-builder agent, I want the current HS catalog as JSON at run
   time, so my suggested orders reflect this week's real prices.
2. As the menu-builder agent, I want per-item price and pack/serving detail,
   so case rounding and cost per child per day can be computed.
3. As the menu-builder agent, I want a freshness timestamp on every response,
   so I can flag how stale the pricing is.
4. As the menu-builder agent, I want login expiry reported distinctly from
   other failures, so degraded mode is triggered by evidence, not guesswork.
5. As the menu-builder agent, I want a stable, documented JSON shape, so the
   prompt's instructions stay simple across runs.
6. As the menu-builder agent, I want raw vendor item names in responses, so
   mapping to the sheet's canonical Item names stays my job and the sheet
   remains the vocabulary owner.
7. As the coordinator, I want the service to run as a Docker container like
   my other services, so it fits the machine's existing conventions.
8. As the coordinator, I want no credentials in the repo, so git history
   stays clean — the login lives only in the wizard's profile volume.
9. As the coordinator, I want an expiry error that names its remedy (re-run
   the setup wizard), so a stale login is a two-minute fix.
10. As the coordinator, I want prices pulled in real time as needed — but
    with a short cache, so repeated runs don't hammer the vendor's site.
11. As the coordinator, I want a low resource footprint, so the busy machine
    (signoz, immich, announcements, …) is unaffected.
12. As the coordinator, I want the service code in this repo beside its ADR
    and the prompt docs, so there is one source of truth.
13. As the coordinator, I want nothing persisted by the service, so there is
    no database to babysit — price history accrues from order-confirmation
    emails via extraction, not here.
14. As the coordinator, I want a health endpoint showing last-success and
    login state, so I can hang it on the existing monitoring/dashboard.
15. As the coordinator, I want redeploy to be one command, so updates are
    trivial.
16. As a future maintainer, I want the endpoint contract documented, so the
    next vendor adapter (Costco, others) can match its shape.
17. As the coordinator, I want the service bound to localhost only, so the
    gated catalog is never exposed to the network unauthenticated.
18. As the menu-builder agent, I want the service absent to be survivable,
    so a downed container degrades the run to a gap list rather than
    blocking menu planning.

> **2026-09-30 update (ADR 0002):** the read path is anonymous; stories 4,
> 9, and the login half of 14 are superseded — there is no session to expire
> in this adapter. The wizard remains as the dormant fallback's re-login
> path.

## Implementation Decisions

- Placement: `services/hs-prices/` in this repo (decided with the
  coordinator). Hugo is unaffected — it builds `content/` only.
- Stack: Node in a single container, matching the machine's existing
  Node-based container precedent (the Baileys WhatsApp bot). Each fetch is a
  plain HTTPS GET of `https://healthyselections.ca/products.json?limit=250`
  — no browser, no Playwright, no profile volume. (The wizard-provisioned
  Chromium profile stays on disk as the fallback reader per ADR 0002; the
  wizard's `verify-login.cjs` demonstrates that read.)
- Endpoint contract (the vendor-adapter shape; future suppliers implement
  the same):
  - `GET /health` → `{ status: "ok" | "login_expired" | "upstream_error",
    lastAttemptAt, lastSuccessAt }`
  - `GET /catalog` → `{ fetchedAt, source: "healthyselections.ca",
    items: [{ title, variantTitle, priceCad, sku, bodyText }] }`
  - Failure semantics: `503` + `{ status: "login_expired", remedy: "re-run
    services/hs-prices/setup.sh" }` is **reserved for session-based
    adapters** — this adapter has no session and never emits it; it answers
    `502` + `{ status: "upstream_error" }` on fetch/parse failures (including
    the endpoint becoming gated, which is how a tightened gate surfaces).
    `fetchedAt` is always the real fetch time.
- Catalog read mechanism: **decided 2026-09-30 (ADR 0002)** — anonymous
  `/products.json` fetch, verified during the ticket 01 run (190 products,
  prices present, no login). The login-gated assumption came from probing
  the HTML storefront (`/collections/all`), which is gated; the JSON
  endpoint is not.
- Freshness: in-memory cache with a short TTL (default 15 minutes,
  env-configurable) — "real time as needed" without repeated vendor hits.
- No persistence and no database: nothing is written. Prices are never
  stored in the knowledge bundle; historic prices accrue from
  order-confirmation emails via the extraction service.
- The delivery-date banner stays out of this service: it is public and the
  menu builder fetches it directly.
- Binds localhost only; no auth on the endpoints, so no LAN exposure.
- Config comes from the same `.env` the wizard writes (port, cache TTL);
  `.env` remains gitignored.
- Canonical-name mapping is the menu builder's job, not the service's: the
  service returns raw vendor naming (per the trial's finding that the sheet
  is the vocabulary owner).

## Testing Decisions

- Exactly one seam, at the highest point: the service's HTTP API. Tests feed
  the upstream reader stubbed fixtures — a real `/products.json` capture
  (anonymous `curl`, no login needed) plus a malformed-body case — and
  assert endpoint behavior: `200` with normalized items + freshness;
  malformed/upstream-down → `502 upstream_error`. (The `503 login_expired`
  path is contract-reserved and untested here — this adapter has no
  session.)
- Only external behavior is tested: no tests of fetch or parsing internals;
  parsing correctness is covered fixture-in → JSON-out at the seam.
- A live smoke script (not CI): hits the real service on the machine; run
  after deploys.
- Prior art: none — this is the first code in the repo. The AGENTS.md
  verification bar (clean hugo build, zero validate.sh FAIL lines) is
  unaffected because the service lives outside `content/` and `knowledge/`.
  The stack's standard runner (`node:test`) is introduced with the service.

## Out of Scope

- The setup wizard (ticket 01 — its own spec; done 2026-09-30).
- The spike (resolved by ADR 0002: the read path is anonymous
  `/products.json`; no browser-based reader is built).
- The menu builder prompt (exists at `knowledge/prompts/generate-menu.md`).
- Other vendor adapters (Costco, future suppliers) — the contract
  anticipates them; they are not built here.
- The public delivery-date banner (the builder fetches it directly).
- Historic price storage — superseded by this live service; history accrues
  via extraction of order-confirmation emails.
- Calendar publisher, WhatsApp digest integration, Millennium ordering
  automation.

## Further Notes

- Blocking edges: **resolved.** Ticket 01 done (wizard run 2026-09-30,
  profile provisioned and verified); the spike's mechanism question is
  settled by ADR 0002 (anonymous `/products.json`), so no spike gates this
  build — fixtures are an anonymous `curl` away.
- The dormant login profile will expire unused (~weeks); nothing depends on
  it, and re-running the wizard revives it if the endpoint is ever gated.
- If the machine's services are compose-managed, ship a compose file with a
  restart policy matching the other containers.
- Publishing note: `gh` auth on this machine holds an invalid token
  (HTTP 401), so this spec landed on the local tracker. Run `gh auth login`
  and it can be mirrored to GitHub Issues with the `ready-for-agent` label.
