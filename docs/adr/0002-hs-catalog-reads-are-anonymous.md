# HS catalog reads are anonymous (products.json), Chromium login retained as fallback

Status: accepted (2026-09-30)

The HS price service spec assumed the Healthy Selections catalog was
login-gated, because an anonymous fetch of the storefront page
(`/collections/all`) returns nothing. While testing the setup wizard on
2026-09-30 we found that Shopify's structured endpoint
`/products.json?limit=250` returns the full catalog — 190 products with
variant prices, SKUs, and descriptions — **anonymously**. The gate covers
the HTML storefront, not the product JSON.

Decision: the price service reads `/products.json` anonymously. No browser,
no authenticated profile, no login-expiry mode in its runtime path. The
Chromium profile and setup wizard built for ticket 01 are **retained, not
deleted**: they are the documented fallback if the endpoint is ever gated,
and the wizard remains the re-login procedure.

The coordinator explicitly accepted the open risks: anonymous prices are not
verified to match account pricing (any drift surfaces later, when
order-confirmation emails are extracted into actual paid prices), and HS
could gate the endpoint at any time (the service reports `upstream_error`;
the menu builder already degrades to a gap list).

## Considered options

- **Authenticated browser profile (original spec)** — built and verified
  working (wizard run 2026-09-30), but it solves a gate the read path doesn't
  face. Kept dormant as the fallback.
- **Anonymous products.json** — chosen: the endpoint contract
  (`title, variantTitle, priceCad, sku, bodyText`) is satisfied by the fields
  Shopify returns, and the service shrinks to fetch-and-cache.
- **Primary anonymous + automatic profile fallback in the service** —
  rejected: double the machinery for a hypothetical gate. If the endpoint
  ever locks, the response is to re-run the wizard and revisit the spec, not
  to silently swap readers.

## Consequences

- The service carries no Playwright/Chromium dependency, no profile volume
  mount, and no login-expiry state; `login_expired` stays in the `/health`
  contract as a reserved value for future session-based vendor adapters
  (this adapter emits only `ok` / `upstream_error`).
- Per ADR 0001 this remains an adapter carrying reference data; the
  storefront login, being dormant, is nobody's state to babysit — if it
  expires unused, nothing notices and nothing breaks.
- Test fixtures for the service are captured with a plain anonymous `curl`
  of `/products.json`; no logged-in fixture is needed.
- If HS ever gates the JSON endpoint: re-run `services/hs-prices/setup.sh`
  to re-establish the login, then revive the profile-based reader (the
  wizard's `verify-login.cjs` already demonstrates the CDP read).
