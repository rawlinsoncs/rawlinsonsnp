# AGENTS.md

Hugo + Docsy documentation site for the Rawlinson Student Nutrition Program (SNP), deployed to GitHub Pages at `https://rawlinsoncs.github.io/rawlinsonsnp/` (note the subpath). Also hosts an OKF knowledge bundle in `knowledge/`.

## Commands

- Dev server (drafts included): `hugo server -D`
- CI-parity build check: `hugo --gc --minify --baseURL "http://localhost/"` — keep the `baseURL` flag; the site is served from a subpath, and CI passes an explicit base URL too. **Never run `--gc` in the working tree**: `resources/_gen/` is committed and `--gc` prunes it. Drop `--gc` (and consider `--destination` outside the repo) for local builds.
- Validate the knowledge bundle: `bash knowledge/validate.sh knowledge` — exit code = number of failures; `W*` lines are advisory warnings
- Price-service tests: `cd services/hs-prices && npm test` — hermetic, a recorded fixture stands in for the vendor
- The Hugo site has no test suite. Its verification bar is a clean `hugo` build plus zero `validate.sh` FAIL lines; `npm test` covers the price service. `checks.yml` runs both the validator and the adapter tests on every push and pull request.

## Toolchain

Pinned in `.tool-versions` (asdf) and in CI: Hugo **Extended** 0.153.2, Dart Sass 1.97.1, Go 1.25.5, Node 24.12.0. `hugo`/`sass` may not be on PATH — install them with `asdf install` or fetch the exact versions manually. Hugo must be the *extended* build (SCSS pipeline); verify with `hugo version`.

## Repo quirks

- `node_modules/` and `resources/_gen/` are intentionally committed (vendored PostCSS toolchain for Docsy's asset pipeline, and Hugo's generated asset cache). Do not add them to `.gitignore`, prune, or "clean them up".
- Docsy is a Hugo module (`go.mod`), not a git submodule — `.gitmodules` is empty. Update with `hugo mod get -u` (requires Go).
- CI (`.github/workflows/pages.yml`) builds and deploys on every push to `main`; there is no other deploy path. Assume anything merged/pushed to `main` goes live immediately. CI builds with `TZ: America/Toronto`. A separate `.github/workflows/checks.yml` validates the knowledge bundle and runs the price-service tests; it reports status but never blocks the deploy.
- Goldmark `unsafe = true` in `hugo.toml`, so raw HTML in Markdown is allowed.

## Layout

- `content/` — public pages. `content/docs/community.md` is the family guide; `content/docs/teachers.md` is teacher guidance and embeds the Snack Program Calendar via the `hp5` iframe shortcode (layouts/shortcodes/hp5.html). Docs pages use TOML front matter (`+++`); the homepage uses YAML (`---`) — match whichever the file you're editing already uses.
- `layouts/` and `assets/scss/` — Docsy overrides; project files win over the theme when placed at the same path. Brand colors are the school palette in `assets/scss/_variables_project.scss`.
- `knowledge/` — OKF v0.2 bundle. Follow the maintenance workflow in `knowledge/README.md`: non-reserved `.md` files need YAML frontmatter with a non-empty `type`; update `generated` (and `verified` only when a human actually reviewed); add a dated entry to `log.md` (newest first); then run `validate.sh`. Load the repo-local `okf-open-knowledge-format` skill before doing OKF work.
- `docs/adr/` — architecture decisions (ADR 0001: the pantry spreadsheet is the integration bus between the program's services).
- `docs/research/` — findings from primary-source research, cited claim by claim. `2026-10-12-snp-tooling-inventory.md` inventories what tooling exists for ordering, delivery, and volunteer management; read it before proposing new tools. `docs/superpowers/specs/` and `docs/superpowers/plans/` hold dated design specs and their implementation plans. All use `YYYY-MM-DD-kebab-case.md`.
- `services/` — Docker services for the program machine (not part of the Hugo build). `services/hs-prices/` is the HS price service: `node server.mjs` (or `docker compose up -d --build`) serves `GET /catalog` and `GET /health` on `127.0.0.1:8787` from the anonymous `products.json` read (ADR 0002); `npm test` runs its seam tests, `./smoke.sh` verifies a live deploy. `services/hs-prices/setup.sh` is the rerunnable wizard that captures the pantry CSV URL and provisions the Healthy Selections login profile (dormant fallback — the service reads the catalog anonymously); specs live in `.scratch/hs-price-service/`.
- `CONTEXT.md` — the domain vocabulary (Menu, Snack, Donation, Gap-fill Purchase, Donor vs Supplier, Distribution Volunteer). Use these exact terms in site content and avoid the "Avoid" alternatives listed there.

## Menu planning runs

Requests like "suggest next week's order" fire the `menu` skill, which runs `knowledge/prompts/generate-menu.md` — read it first; it encodes coordinator rules you cannot guess: the **Distribution window** (five hand-typed cutoff dates on the `AvailableAsOf` tab, columns I–M; runs are coordinator-dictated and read whatever window is stored), **next-day availability** (blank `Available from` override = next day; the coordinator marks same-day exceptions), the slot model (per day per component, one item at 540 for grades 1–8 plus one at 180 for kindergarten; partial lots are delta-filled, never pooled; stranded remainders are written off and flagged), coverage scope (ask which weeks before the window are already covered — never assume either way), stock before purchasing, ask-don't-assume on unknown perishability windows and disposals, and the two-day shelf-stable safety-stock floor (granola bars; raisins or apple squeeze packs) that is off-limits for planning.

- Pantry sheet: fetch the publish-to-web **CSV** form (`pub?gid=...&single=true&output=csv`); the `pubhtml` URL is JS-rendered and fetches as an empty page. **Follow redirects** (`curl -L`): the publish URL answers `307` with a 0-byte body, so a non-redirect-following fetch silently yields an empty sheet. The coordinator supplies the URL.
- HS prices come from a Docker price service on `http://127.0.0.1:8787` (`GET /catalog`, `GET /health`) that reads Shopify's `/products.json` anonymously — see [ADR 0002](docs/adr/0002-hs-catalog-reads-are-anonymous.md) and `services/hs-prices/README.md`. If it is down or answers `upstream_error`, run `services/hs-prices/smoke.sh` to see why; menu runs must degrade (gap list, no prices, flagged) rather than guess. The next-delivery banner at https://healthyselections.ca/ is public, as is the Millennium menu at https://www.millenniumbakehouse.com/menu.
- Placed orders return to the sheet as future-dated rows — that is the pending-supply record the next run reads.

## Content conventions

- Filenames lowercase and hyphenated; sentence-case titles.
- Keep external links (Google Forms, TFSS, TDSB) exactly as written unless asked to change them — several are live program infrastructure (volunteer signup, donation, teacher reporting form).
