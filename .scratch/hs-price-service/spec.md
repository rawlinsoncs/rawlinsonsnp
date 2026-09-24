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

## Solution

A small Dockerized HTTP service on the program machine that serves the
current HS catalog as JSON on demand. It reuses the persistent authenticated
browser profile provisioned by the setup wizard (ticket 01): on request, it
launches headless Chromium against the mounted profile, pulls the catalog,
and returns items with prices and a freshness timestamp. Login expiry is a
first-class, machine-checkable signal so the menu builder's degraded mode
(gap list only, no prices) triggers on evidence. This is the first vendor
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

## Implementation Decisions

- Placement: `services/hs-prices/` in this repo (decided with the
  coordinator). Hugo is unaffected — it builds `content/` only.
- Stack: Node + Playwright in a single container, matching the machine's
  existing Node-based container precedent (the Baileys WhatsApp bot). Each
  fetch launches headless Chromium against the mounted persistent profile
  (`services/hs-prices/profile`, created by the wizard), reads the catalog
  in-session, and exits. No always-on browser, no cross-container CDP; the
  profile lock is safe because the wizard stops its container on exit and
  fetches are short-lived.
- Endpoint contract (the vendor-adapter shape; future suppliers implement
  the same):
  - `GET /health` → `{ status: "ok" | "login_expired" | "upstream_error",
    lastAttemptAt, lastSuccessAt }`
  - `GET /catalog` → `{ fetchedAt, source: "healthyselections.ca",
    items: [{ title, variantTitle, priceCad, sku, bodyText }] }`
  - Failure semantics: `503` + `{ status: "login_expired", remedy: "re-run
    services/hs-prices/setup.sh" }` when the session is dead; `502` on other
    upstream failures. `fetchedAt` is always the real fetch time.
- Catalog read mechanism: prefer Shopify's structured product JSON; if the
  gate blocks it, read product pages inside the authenticated browser
  context — either way the HTTP contract above is unchanged. **The spike
  (blocked by ticket 01) verifies which path works and captures the response
  fixtures used by the tests.**
- Freshness: in-memory cache with a short TTL (default 15 minutes,
  env-configurable) — "real time as needed" without repeated vendor hits.
- No persistence and no database: nothing is written except the shared
  profile volume. Prices are never stored in the knowledge bundle; historic
  prices accrue from order-confirmation emails via the extraction service.
- The delivery-date banner stays out of this service: it is public and the
  menu builder fetches it directly.
- Binds localhost only; no auth on the endpoints, so no LAN exposure.
- Config comes from the same `.env` the wizard writes (profile path, port,
  cache TTL); `.env` remains gitignored.
- Canonical-name mapping is the menu builder's job, not the service's: the
  service returns raw vendor naming (per the trial's finding that the sheet
  is the vocabulary owner).

## Testing Decisions

- Exactly one seam, at the highest point: the service's HTTP API. Tests feed
  the upstream reader stubbed fixtures — recorded during the spike from real
  responses (a logged-in catalog page and a logged-out redirect) — and
  assert endpoint behavior: `200` with normalized items + freshness;
  login-expired fixture → `503 login_expired`; malformed upstream → `502`.
- Only external behavior is tested: no tests of browser wiring or parsing
  internals; parsing correctness is covered fixture-in → JSON-out at the
  seam.
- A live smoke script (not CI): hits the real service on the machine; run
  after deploys and re-logins.
- Prior art: none — this is the first code in the repo. The AGENTS.md
  verification bar (clean hugo build, zero validate.sh FAIL lines) is
  unaffected because the service lives outside `content/` and `knowledge/`.
  The stack's standard runner (`node:test`) is introduced with the service.

## Out of Scope

- The setup wizard (ticket 01 — its own spec; this service is blocked by it).
- The spike (blocked by ticket 01; this service is informed by it).
- The menu builder prompt (exists at `knowledge/prompts/generate-menu.md`).
- Other vendor adapters (Costco, future suppliers) — the contract
  anticipates them; they are not built here.
- The public delivery-date banner (the builder fetches it directly).
- Historic price storage — superseded by this live service; history accrues
  via extraction of order-confirmation emails.
- Calendar publisher, WhatsApp digest integration, Millennium ordering
  automation.

## Further Notes

- Blocking edges: ticket 01 (setup wizard → the authenticated profile) and
  the spike (verifies the authenticated catalog read and captures fixtures).
- Session expiry cadence is empirical (~weeks); the wizard is the re-login
  path and `/health` makes expiry observable to the coordinator's existing
  dashboard.
- If the machine's services are compose-managed, ship a compose file with a
  restart policy matching the other containers.
- Publishing note: `gh` auth on this machine holds an invalid token
  (HTTP 401), so this spec landed on the local tracker. Run `gh auth login`
  and it can be mirrored to GitHub Issues with the `ready-for-agent` label.
