# AGENTS.md

Hugo + Docsy documentation site for the Rawlinson Student Nutrition Program (SNP), deployed to GitHub Pages at `https://rawlinsoncs.github.io/rawlinsonsnp/` (note the subpath). Also hosts an OKF knowledge bundle in `knowledge/`.

## Commands

- Dev server (drafts included): `hugo server -D`
- CI-parity build check: `hugo --gc --minify --baseURL "http://localhost/"` — keep the `baseURL` flag; the site is served from a subpath, and CI passes an explicit base URL too
- Validate the knowledge bundle: `bash knowledge/validate.sh knowledge` — exit code = number of failures; `W*` lines are advisory warnings
- There is no test suite. A clean `hugo` build plus zero `validate.sh` FAIL lines is the verification bar.

## Toolchain

Pinned in `.tool-versions` (asdf) and in CI: Hugo **Extended** 0.153.2, Dart Sass 1.97.1, Go 1.25.5, Node 24.12.0. `hugo`/`sass` may not be on PATH — install them with `asdf install` or fetch the exact versions manually. Hugo must be the *extended* build (SCSS pipeline); verify with `hugo version`.

## Repo quirks

- `node_modules/` and `resources/_gen/` are intentionally committed (vendored PostCSS toolchain for Docsy's asset pipeline, and Hugo's generated asset cache). Do not add them to `.gitignore`, prune, or "clean them up".
- Docsy is a Hugo module (`go.mod`), not a git submodule — `.gitmodules` is empty. Update with `hugo mod get -u` (requires Go).
- CI (`.github/workflows/pages.yml`) builds and deploys on every push to `main`; there is no other deploy path. Assume anything merged/pushed to `main` goes live immediately. CI builds with `TZ: Europe/Oslo`.
- Goldmark `unsafe = true` in `hugo.toml`, so raw HTML in Markdown is allowed.

## Layout

- `content/` — public pages. `content/docs/community.md` is the family guide; `content/docs/teachers.md` is teacher guidance and embeds the Snack Program Calendar via the `hp5` iframe shortcode (layouts/shortcodes/hp5.html). Docs pages use TOML front matter (`+++`); the homepage uses YAML (`---`) — match whichever the file you're editing already uses.
- `layouts/` and `assets/scss/` — Docsy overrides; project files win over the theme when placed at the same path. Brand colors are the school palette in `assets/scss/_variables_project.scss`.
- `knowledge/` — OKF v0.2 bundle. Follow the maintenance workflow in `knowledge/README.md`: non-reserved `.md` files need YAML frontmatter with a non-empty `type`; update `generated` (and `verified` only when a human actually reviewed); add a dated entry to `log.md` (newest first); then run `validate.sh`. Load the repo-local `okf-open-knowledge-format` skill before doing OKF work.
- `CONTEXT.md` — the domain vocabulary (Menu, Snack, Donation, Gap-fill Purchase, Donor vs Supplier, Distribution Volunteer). Use these exact terms in site content and avoid the "Avoid" alternatives listed there.

## Content conventions

- Filenames lowercase and hyphenated; sentence-case titles.
- Keep external links (Google Forms, TFSS, TDSB) exactly as written unless asked to change them — several are live program infrastructure (volunteer signup, donation, teacher reporting form).
