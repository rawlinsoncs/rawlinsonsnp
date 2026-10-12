# CI checks and build timezone Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Put the OKF knowledge validator and the HS price-service tests in CI, give the service package a lockfile so `npm ci` works, correct the build timezone to `America/Toronto`, and document the deliberate manual-smoke gap.

**Architecture:** One new workflow, `.github/workflows/checks.yml`, holds two independent jobs that report status but never block the Pages deploy. `pages.yml` gains a one-line timezone correction and nothing else. `services/hs-prices/` gains a committed lockfile. The service README gains one paragraph recording that the live upstream check is not automated.

**Tech Stack:** GitHub Actions, Node 24.12.0 (`node --test`), Bash (`knowledge/validate.sh`).

## Global Constraints

- Node is pinned to **24.12.0** in every workflow, matching `.tool-versions` and `pages.yml`.
- **`checks.yml` must never block the Pages deploy.** No `needs:` from any `pages.yml` job to any `checks.yml` job. Ever.
- **`smoke.sh` stays a manual command.** Do not add it to CI, do not schedule it.
- **`checks.yml` sets no `TZ` and no cache.** `validate.sh` reads `date -u`; the adapter tests use `Date.now()` / `Date.parse()`, which are absolute epoch milliseconds.
- **NEVER run `hugo --gc` in this working tree.** `resources/_gen/` is intentionally committed (AGENTS.md "Repo quirks") and `--gc` prunes it. If a Hugo build is needed, use `--destination` without `--gc`, or build inside a copy.
- Preserve the existing house style: two-space YAML indent, `actions/checkout@v5`, `actions/setup-node@v4`, `defaults.run.shell: bash`.

## File Structure

| File | Action | Responsibility |
| --- | --- | --- |
| `services/hs-prices/package-lock.json` | create | Pins the dependency set (currently empty) so `npm ci` is valid |
| `.github/workflows/checks.yml` | create | Runs the knowledge validator and the adapter tests on push/PR |
| `.github/workflows/pages.yml:25` | modify | Corrects `TZ` to `America/Toronto` |
| `AGENTS.md:20` | modify | Stops documenting the removed Oslo timezone as fact |
| `services/hs-prices/README.md` | modify | Records that the live upstream check is manual, not CI |

---

### Task 1: Commit a lockfile for the price service

`services/hs-prices/package.json` declares no dependencies, so it shipped no `package-lock.json` — which makes `npm ci` fail outright. The failure is reproducible right now, so this task has a genuine red-to-green cycle.

**Files:**
- Create: `services/hs-prices/package-lock.json`

**Interfaces:**
- Consumes: nothing from other tasks.
- Produces: a valid lockfile at `services/hs-prices/package-lock.json`, which Task 2's `npm ci` step depends on.

- [ ] **Step 1: Confirm the failure exists**

Run:

```bash
cd services/hs-prices && npm ci
```

Expected: FAIL with

```
npm error code EUSAGE
npm error The `npm ci` command can only install with an existing
npm error package-lock.json with lockfileVersion >= 1.
```

- [ ] **Step 2: Generate the lockfile**

Run:

```bash
cd services/hs-prices && npm install
```

Expected: exit 0. `npm install` writes `package-lock.json` with `"lockfileVersion": 3` and a `packages` object containing only the root `""` entry — no dependencies.

- [ ] **Step 3: Confirm it now works**

Run:

```bash
cd services/hs-prices && npm ci
```

Expected: exit 0, no output beyond npm's own notices.

- [ ] **Step 4: Confirm the tests still pass**

Run:

```bash
cd services/hs-prices && npm test
```

Expected: `ℹ tests 12`, `ℹ pass 12`, `ℹ fail 0`.

- [ ] **Step 5: Confirm no stray files were created**

Run:

```bash
cd services/hs-prices && ls -a
git status --short
```

Expected: `package-lock.json` present; `node_modules/` is NOT created (there is nothing to install); `git status` shows only the new lockfile.

- [ ] **Step 6: Commit**

```bash
git add services/hs-prices/package-lock.json
git commit -m "Commit a lockfile for the HS price service

The package declares no dependencies but shipped no lockfile, which makes
npm ci fail with EUSAGE. Empty lockfileVersion 3: pins nothing today, but
makes the CI install step valid and means the first commit that adds a
dependency is already pinned by CI."
```

---

### Task 2: Add the checks workflow

**Files:**
- Create: `.github/workflows/checks.yml`

**Interfaces:**
- Consumes: `services/hs-prices/package-lock.json` from Task 1 (required by the `npm ci` step) and `knowledge/validate.sh` which already exists.
- Produces: check runs named `validate-knowledge` and `hs-prices` on push-to-main, pull requests, and manual dispatch.

- [ ] **Step 1: Create the workflow**

Create `.github/workflows/checks.yml` with exactly this content:

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

- [ ] **Step 2: Verify the validator command the job runs**

Run:

```bash
bash knowledge/validate.sh knowledge; echo "exit=$?"
```

Expected:

```
PASS: 23 concept files valid | FAIL: 0
exit=0
```

- [ ] **Step 3: Verify the adapter commands the job runs**

Run:

```bash
cd services/hs-prices && npm ci && npm test
```

Expected: `npm ci` exits 0 and `npm test` reports `ℹ pass 12`, `ℹ fail 0`.

- [ ] **Step 4: Verify the YAML parses**

Run:

```bash
python3 -c "import yaml,sys; d=yaml.safe_load(open('.github/workflows/checks.yml')); print(sorted(d['jobs']))"
```

Expected: `['hs-prices', 'validate-knowledge']`.

If PyYAML is unavailable, verify by eye: two top-level keys under `jobs`, correct indentation, no tabs.

- [ ] **Step 5: Confirm the deploy is still ungated**

Run:

```bash
grep -n "needs:" .github/workflows/pages.yml
```

Expected: no output. `pages.yml` must not reference `checks.yml`, and `checks.yml` must not reference `pages.yml`. The two workflows stay independent — a red check does not stop a deploy.

- [ ] **Step 6: Commit**

```bash
git add .github/workflows/checks.yml
git commit -m "Add CI checks for the knowledge bundle and HS price service

Only the Hugo site ran in CI; the adapter tests and the OKF validator were
manual, so neither protected a commit.

Two independent jobs on push to main and on pull requests. They report
status and never block the Pages deploy, so a broken bundle or a failing
test cannot stop a content-only fix from shipping.

The adapter job runs the hermetic suite only. The live smoke test against
healthyselections.ca stays manual: depending on a third party's uptime
would report their outage as our failure."
```

---

### Task 3: Correct the build timezone

`.github/workflows/pages.yml` builds with `TZ: Europe/Oslo` while both content pages carry `-05:00` (Eastern) frontmatter dates, and `hugo.toml` sets no `timeZone` — so Hugo was rendering a Toronto school site in Oslo time. The change is verified output-neutral: full builds under both timezones are byte-identical (`diff -rq` returns zero differing files).

**Files:**
- Modify: `.github/workflows/pages.yml:25`
- Modify: `AGENTS.md:20`

**Interfaces:**
- Consumes: nothing from other tasks.
- Produces: CI builds in `America/Toronto`; `AGENTS.md` no longer documents a timezone that does not exist in the workflow.

- [ ] **Step 1: Change the workflow timezone**

In `.github/workflows/pages.yml`, replace line 25:

```yaml
      TZ: Europe/Oslo
```

with:

```yaml
      TZ: America/Toronto
```

Leave every other line of `pages.yml` untouched, including its `pages.yml`-specific jobs and permissions.

- [ ] **Step 2: Update AGENTS.md, which documents the old value as fact**

In `AGENTS.md`, replace line 20:

```
- CI (`.github/workflows/pages.yml`) builds and deploys on every push to `main`; there is no other deploy path. Assume anything merged/pushed to `main` goes live immediately. CI builds with `TZ: Europe/Oslo`.
```

with:

```
- CI (`.github/workflows/pages.yml`) builds and deploys on every push to `main`; there is no other deploy path. Assume anything merged/pushed to `main` goes live immediately. CI builds with `TZ: America/Toronto`. A separate `.github/workflows/checks.yml` validates the knowledge bundle and runs the price-service tests; it reports status but never blocks the deploy.
```

- [ ] **Step 3: Verify no stale references remain**

Run:

```bash
grep -rn "Europe/Oslo" . --exclude-dir=node_modules --exclude-dir=public --exclude-dir=resources --exclude-dir=.git
```

Expected: no output.

- [ ] **Step 4: Verify the site still builds**

Run — note the deliberate absence of `--gc`, see Global Constraints:

```bash
TZ=America/Toronto hugo --minify --baseURL "http://localhost/" --destination /tmp/opencode/tz-verify
```

Expected: exit 0, "Total in" summary printed.

Then confirm the cache was not disturbed:

```bash
git status --short
```

Expected: only `.github/workflows/pages.yml` and `AGENTS.md` modified. **If `resources/_gen/` shows deletions, restore immediately** with `git checkout -- resources/_gen/` and report it — that means something ran `--gc`.

- [ ] **Step 5: Commit**

```bash
git add .github/workflows/pages.yml AGENTS.md
git commit -m "Build in America/Toronto, not Europe/Oslo

pages.yml set TZ: Europe/Oslo while both content pages carry -05:00
frontmatter dates, and hugo.toml sets no timeZone, so Hugo fell back to
the build machine's zone and rendered a Toronto site in Oslo time.

Verified output-neutral: full builds under both timezones are
byte-identical. Removes a latent off-by-one-day bug -- a date such as
2026-03-28T23:00:00-05:00 renders as March 28 in Toronto but would have
rendered as March 29 in Oslo.

AGENTS.md documented the Oslo value as fact; corrected, and extended to
mention checks.yml."
```

---

### Task 4: Document the manual smoke gap

CI runs only the hermetic tests, so the failure mode the service exists to prevent — Healthy Selections re-gating `/products.json` behind a login — will not turn CI red. Without a note, a future maintainer reasonably assumes CI covers it. `smoke.sh` hints at this in its own header comment ("Live smoke test (not CI)"), but the README is where someone lands.

**Files:**
- Modify: `services/hs-prices/README.md` (insert after line 77, at the end of the "Running it" section)

**Interfaces:**
- Consumes: nothing from other tasks.
- Produces: documentation only. No behaviour change.

- [ ] **Step 1: Add the note**

In `services/hs-prices/README.md`, find the paragraph that ends the "Running it" section:

```
`smoke.sh` is the deploy check: it fails if the service is unhealthy,
`/catalog` errors, or the catalog comes back without prices. A gate looks
exactly like an empty or priceless catalog, so that assertion is the point.
```

Append one blank line and then this paragraph, hard-wrapped to 80 columns
to match the rest of the file:

```markdown
CI runs `npm test` only — a recorded fixture stands in for the vendor,
so nothing upstream can make it red. That means a re-gated
`/products.json` will not turn CI red either; it surfaces as
`upstream_error` at the next menu run. `./smoke.sh` against a running
service remains the only check that exercises the live vendor, so run it
after deploying.
```

- [ ] **Step 2: Verify the placement and rendering**

Run:

```bash
sed -n '70,92p' services/hs-prices/README.md
```

Expected: the new paragraph appears immediately after the existing
`smoke.sh` paragraph and before the `## Configuration` heading. Confirm
there is exactly one blank line between the paragraph and `##
Configuration`, and that every line of the new paragraph is 80 columns
or fewer:

```bash
awk 'NR>=78 && NR<=85 {print length($0)": "$0}' services/hs-prices/README.md
```

- [ ] **Step 3: Confirm nothing else changed**

Run:

```bash
git diff --stat
```

Expected: `services/hs-prices/README.md` only, a small insertion.

- [ ] **Step 4: Commit**

```bash
git add services/hs-prices/README.md
git commit -m "Document that the live smoke check is manual, not CI

CI runs the hermetic suite only, so a re-gated /products.json will not
turn CI red; it surfaces as upstream_error at the next menu run. Stated
in the README so a maintainer does not assume CI covers the failure mode
the service exists to prevent."
```

---

## Final verification

Run after all four tasks:

- [ ] `bash knowledge/validate.sh knowledge` → `PASS: 23 concept files valid | FAIL: 0`
- [ ] `cd services/hs-prices && npm ci && npm test` → 12 pass, 0 fail
- [ ] `grep -rn "Europe/Oslo" . --exclude-dir=node_modules --exclude-dir=public --exclude-dir=resources --exclude-dir=.git` → no output
- [ ] `git status --short` → clean
- [ ] `git log --oneline -4` → the four task commits, on top of the spec commit