# CI checks and build timezone

- **Date:** 2026-10-12
- **Status:** design approved by coordinator; awaiting implementation plan
- **Problem owner:** repo maintainer

## Problem

Two gaps surfaced by the tooling inventory
(`docs/research/2026-10-12-snp-tooling-inventory.md`):

1. **Only the Hugo site is in CI.** `.github/workflows/pages.yml` builds
   and deploys, and does nothing else. The HS price service's tests and
   the OKF knowledge validator both run by hand, so neither protects a
   commit. A regression in the adapter, or a knowledge file that breaks
   its bundle, reaches `main` silently.
2. **CI builds in the wrong timezone.** `pages.yml` sets
   `TZ: Europe/Oslo`, but both content pages carry
   `date = '2025-12-27T11:17:30-05:00'` — Eastern. `hugo.toml` sets no
   `timeZone`, so Hugo falls back to the build machine's zone and the
   `TZ` env var steers it. A Toronto school site was being built in Oslo
   time. `AGENTS.md` documents the Oslo value as fact, so the error was
   load-bearing.

## Decisions (maintainer, 2026-10-12)

- **New `checks.yml`, separate from `pages.yml`.** Checks report status;
  they never block the Pages deploy. A broken knowledge bundle or adapter
  test must not stop a content-only fix from shipping.
- **Adapter CI is the hermetic suite only** — `npm test` (12 cases,
  network stubbed). The live `smoke.sh` check against
  `healthyselections.ca` stays a manual call. Rationale: a CI job that
  depends on a third party's uptime reports their outage as our failure.
- **Add a lockfile to `services/hs-prices/`** so `npm ci` is valid and
  both Node packages in the repo follow the same convention.
- **`TZ` becomes `America/Toronto`**, matching the offsets the content
  actually uses.

## Change 1 — `services/hs-prices/package-lock.json` (new)

`services/hs-prices/` declares no dependencies but also shipped no
lockfile, which makes `npm ci` fail outright:

```
npm error code EUSAGE
npm error The `npm ci` command can only install with an existing
npm error package-lock.json with lockfileVersion >= 1.
```

Generate it with `npm install` in that directory and commit the result
(`lockfileVersion: 3`, empty dependency set).

A zero-dependency lockfile pins nothing today. It is worth committing
anyway: it is the canonical state for a Node package, and it means the
first commit that adds a dependency is already pinned by CI rather than
resolved fresh on the runner.

## Change 2 — `.github/workflows/checks.yml` (new)

```yaml
name: Checks
on:
  push:
    branches: [main]
  pull_request:
  workflow_dispatch:
permissions:
  contents: read
defaults:
  run:
    shell: bash

jobs:
  validate-knowledge:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v5
      - name: Validate OKF bundle
        run: bash knowledge/validate.sh knowledge

  hs-prices:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v5
      - uses: actions/setup-node@v4
        with:
          node-version: 24.12.0
      - name: Install dependencies
        run: npm ci
        working-directory: services/hs-prices
      - name: Run adapter tests
        run: npm test
        working-directory: services/hs-prices
```

Notes on the shape:

- **Failure semantics come free.** `validate.sh` exits with the *number*
  of failures, so any real problem fails the step. Its `W*` advisory
  warnings print but do not fail. No filtering needed.
- **No `TZ`.** `validate.sh` reads `date -u` (explicit UTC) and the
  adapter tests use `Date.now()` / `Date.parse()`, which are absolute
  epoch milliseconds. Copying `pages.yml`'s `TZ` here would be
  meaningless.
- **No caching.** `node --test` runs in ~430 ms.
- **Node pinned to 24.12.0**, matching `.tool-versions` and `pages.yml`.
- **No concurrency group.** The jobs take seconds; serialising them buys
  nothing.

## Change 3 — `TZ: Europe/Oslo` → `TZ: America/Toronto`

- `.github/workflows/pages.yml:25`
- `AGENTS.md:20`, which states the Oslo value as fact.

**Verified output-neutral.** Two full builds were run with the CI-parity
flags, one per timezone, into separate destinations:

```
TZ=Europe/Oslo    hugo --gc --minify --baseURL "http://localhost/" --destination /tmp/opencode/tz-oslo
TZ=America/Toronto hugo --gc --minify --baseURL "http://localhost/" --destination /tmp/opencode/tz-toronto
diff -rq tz-oslo tz-toronto   # -> 0 differing files
```

Both builds succeeded and the trees are byte-identical, so this change
cannot affect the deployed site. It removes a latent off-by-one-day bug:
a future frontmatter date such as `2026-03-28T23:00:00-05:00` renders as
March 28 in Toronto but would have rendered as March 29 in Oslo.

## Change 4 — document the manual smoke gap

`services/hs-prices/README.md` gains a short note: the live upstream
check is deliberately manual, CI runs only the hermetic tests, and a
re-gated `/products.json` will not turn CI red. Without it, a future
maintainer reasonably assumes CI covers the failure mode the service
exists to prevent.

`smoke.sh` already carries the hint in its own header comment ("Live smoke
test (not CI)"), which is why this is a README paragraph rather than a
behaviour change.

## Out of scope

- **Branch protection.** Status checks only matter if something requires
  them; configuring branch protection is a repository-settings action,
  not a workflow change.
- **Smoke test on a schedule.** Deferred. Revisit if the upstream-gating
  risk is ever realised.
- **Running the validator as part of the deploy.** Explicitly rejected —
  it would couple the site's release to unrelated checks.
- **Fixing the pantry-sheet anomalies** (the `2026-03-35` date, undated
  Waste rows, the swapped `Notes` / `Delivery Date` CSV column order in
  `extract-delivery.md`). These are real but separate; the column-order
  bug is the only one fixable inside this repo.