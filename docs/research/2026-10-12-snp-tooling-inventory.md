# SNP Tooling Inventory — 2026-10-12

What tools exist today in the rawlinsonsnp repository to assist with ordering, delivery/distribution, and volunteer management in the Rawlinson Student Nutrition Program.

## 1. Scope & method

**What I read.** Every file cited by AGENTS.md, CONTEXT.md, and the knowledge bundle as owning a tool or workflow: the service code under `services/hs-prices/` (server.mjs, reader.mjs, compose.yml, Dockerfile, setup.sh, smoke.sh, verify-login.cjs, tests), all knowledge entries under `knowledge/` (automation, operations, communication, program, prompts, research), the two ADRs under `docs/adr/`, the published content pages (`content/docs/community.md`, `content/docs/teachers.md`), the `hp5` shortcode (`layouts/shortcodes/hp5.html`), the CI workflow (`.github/workflows/pages.yml`), and the skill definitions (`.agents/skills/menu/SKILL.md`). I ran `bash knowledge/validate.sh knowledge` — it reported 0 FAIL, 23 concept files valid.

**What I could not verify.** The `.scratch/hs-price-service/` directory referenced in AGENTS.md (line 29) holds `spec.md` (status: implemented 2026-09-30) and `issues/01-setup-wizard.md` — these are design records for the already-implemented price service, not additional tooling. The ZK source note (`/Users/aaron/workspace/zettelkasten/20260915000000_research_student_nutrition_program.md`) is on the author's local machine and not in this repo. All external URLs (Google Forms, Google Sheets, Healthy Selections, Millennium Bakery, TFSS, TDSB) are recorded as "external — not verifiable from this repo" and taken at face value from how the repo references them. The WhatsApp bot container `aaronromeo/announcements` is mentioned in the knowledge bundle but no container image, compose file, or code for it exists in this repo.

---

## 2. Tool inventory

### 2.1 Pantry Spreadsheet (Google Sheets)

| Aspect | Detail |
|--------|--------|
| **Where it lives** | External Google Sheets document; the published CSV URL is captured by the setup wizard and stored in `.env` as `PANTRY_AVAILABLEASOF_CSV_URL` (`services/hs-prices/setup.sh:278`) |
| **What it actually does** | Eight sheets form the central integration bus (ADR 0001): `Deliveries` (vendor deliveries, 335 rows with Item/Unit/PackSize/Category/Vendor/Delivery Date/Notes plus computed columns), `Distributions` (361 logged distributions), `Waste` (~50 entries, many undated), `AvailableBreakdown` (auto-aggregated totals), `Available` (current stock snapshot), `AvailableAsOf` (time-sliced view with the five window columns I–M that the menu builder reads), `HealthySelections spend` (21 order records), `Vendor Analysis` (pivot summary). The sheet's formulas compute ServingsReceived, Remaining, and ServingsProjected per row (`knowledge/research/pantry-spreadsheet-analysis.md:117-149`) |
| **How to invoke** | Humans edit via Google Sheets UI. Agents fetch the published `AvailableAsOf` CSV via the coordinator-supplied URL (`curl -L`) — `knowledge/prompts/generate-menu.md:97-106` |
| **Inputs** | CSV rows pasted from the Extract Delivery prompt output (5 columns: Item, Unit, PackSize, Delivery Date, Notes) into columns A/B/C/J/K; manual entry of Category (H) and Vendor (I); future-dated rows added when orders are placed |
| **Outputs** | Computed availability figures consumed by the menu builder and by the Available/AvailableAsOf views |
| **Maturity** | **Live** — the primary data store, shared via Google Sheets (`knowledge/research/pantry-spreadsheet-analysis.md:29-30`) |
| **Citations** | `docs/adr/0001-spreadsheet-as-integration-bus.md` (entire file); `knowledge/research/pantry-spreadsheet-analysis.md` (full analysis); `knowledge/prompts/extract-delivery.md:78-106` (CSV schema) |

### 2.2 HS Price Service

| Aspect | Detail |
|--------|--------|
| **Where it lives** | `services/hs-prices/` — server.mjs, reader.mjs, compose.yml, Dockerfile, package.json |
| **What it actually does** | A Node.js HTTP service (no framework, no dependencies) that answers `GET /catalog` and `GET /health` on `127.0.0.1:8787`. It fetches `https://healthyselections.ca/products.json` anonymously (no browser, no login, no session — ADR 0002), parses the Shopify paginated JSON into one item per variant with `{ title, variantTitle, priceCad, sku, bodyText }`, caches in memory with a 15-minute TTL, and returns JSON. On failure it returns `502 { status: "upstream_error" }`. The service binds loopback only; compose uses `network_mode: host` so the LAN cannot reach it (`services/hs-prices/compose.yml:6-20`) |
| **How to invoke** | `node server.mjs` (host), or `docker compose up -d --build` (container). Health check at `/health`. Smoke test at `services/hs-prices/smoke.sh`. Unit tests via `npm test` (`node --test`) |
| **Inputs** | None from the user; reads upstream Shopify JSON anonymously |
| **Outputs** | JSON catalog of products with CAD prices, one per variant |
| **Dependencies** | Node 24+; Docker for container deployment; `curl` and `jq` for smoke tests |
| **Maturity** | **Live** — running code with tests (12 test cases in `services/hs-prices/test/service.test.mjs`), Dockerfile, compose.yml, smoke.sh, and a Docker Hub-ready image. The service has no runtime dependencies beyond the Node stdlib |
| **Citations** | `services/hs-prices/server.mjs` (entire file); `services/hs-prices/reader.mjs`; `services/hs-prices/compose.yml`; `services/hs-prices/README.md`; `services/hs-prices/smoke.sh`; `docs/adr/0002-hs-catalog-reads-are-anonymous.md` |

### 2.3 HS Setup Wizard (dormant login path)

| Aspect | Detail |
|--------|--------|
| **Where it lives** | `services/hs-prices/setup.sh` (398 lines) and `services/hs-prices/verify-login.cjs` (144 lines) |
| **What it actually does** | An interactive bash wizard (three stages) that: (1) captures and validates the pantry CSV URL, (2) launches a Chromium container (`linuxserver/chromium:latest`) on a persistent profile volume so a human can log into healthyselections.ca via phone/desktop, and (3) verifies the login by connecting over CDP (port 9222) and reading the catalog through the session. The Chromium login profile it provisions is **dormant** — the running price service does not use it (ADR 0002: the service reads anonymously). It is the documented fallback if `/products.json` is ever gated |
| **How to invoke** | `services/hs-prices/setup.sh` — interactive, requires Docker |
| **Maturity** | **Live but dormant** — the code is verified working (setup ran successfully 2026-09-30), the profile directory exists on disk (`services/hs-prices/profile/`), but the price service never invokes it in its normal path. It is the re-login procedure for session expiry if the endpoint is ever gated |
| **Citations** | `services/hs-prices/setup.sh:187-398`; `services/hs-prices/verify-login.cjs`; `docs/adr/0002-hs-catalog-reads-are-anonymous.md:15-17` |

### 2.4 Menu Building (Generate Menu prompt)

| Aspect | Detail |
|--------|--------|
| **Where it lives** | `knowledge/prompts/generate-menu.md` (343 lines) — the "executable spec"; invoked via the `menu` skill (`.agents/skills/menu/SKILL.md`) |
| **What it actually does** | An agent prompt that builds a draft Menu for one Distribution window (five coordinator-set dates from the AvailableAsOf sheet's columns I–M). It consumes the pantry CSV, HS price service catalog, the public Millennium menu, and the TDSB school calendar. It produces: (1) a menu draft table (per day, per component, per population), (2) a gap analysis, (3) suggested gap-fill orders (Millennium for grains, HS for fruit/vegetables, with prices and cost-per-child-per-day), (4) flags (freshness, holidays, waste, double-ordering), (5) a distribution schedule, and (6) a paste-ready TSV block. It is allergen-blind, does not parse vendor emails, and does not publish to the calendar. The slot model is 540 (grades 1–8) + 180 (kindergarten) = 720 per component per day |
| **How to invoke** | An LLM agent loaded with the prompt; triggered by the `menu` skill when the user asks for a menu run. The agent must fetch the pantry CSV URL (coordinator supplies) and query `http://127.0.0.1:8787/catalog` |
| **Inputs** | AvailableAsOf CSV, HS catalog JSON, Millennium menu HTML, TDSB calendar, coordinator answers on coverage/perishability/disposals |
| **Outputs** | Markdown menu draft, gap analysis, suggested orders, flags, distribution schedule, TSV block for pasting back into the sheet |
| **Maturity** | **Live** — trialed against real data on 2026-09-21 (`knowledge/automation/menu-building.md:28`). The prompt is a stable, versioned document with a stale_after date of 2027-04-07 |
| **Citations** | `knowledge/prompts/generate-menu.md` (entire file); `.agents/skills/menu/SKILL.md`; `knowledge/automation/menu-building.md`; `docs/adr/0001-spreadsheet-as-integration-bus.md:9-10` |

### 2.5 Extract Delivery (email-to-CSV prompt)

| Aspect | Detail |
|--------|--------|
| **Where it lives** | `knowledge/prompts/extract-delivery.md` (241 lines) |
| **What it actually does** | An agent prompt that parses vendor order-confirmation emails (three known formats: Costco, TFSS, Healthy Selections) and extracts line items into RFC 4180 CSV with columns: Item, Unit, PackSize, Delivery Date, Notes. It normalizes item names to the spreadsheet's canonical vocabulary, filters non-food rows, and produces a file suitable for pasting into the Deliveries sheet's columns A/B/C/J/K. It has a strict no-fabrication rule and halts if no email content is provided |
| **How to invoke** | An LLM agent loaded with the prompt; the user pastes or attaches emails; the agent outputs a CSV file |
| **Inputs** | One or more vendor emails (.eml, RFC 822 text, or pasted content) |
| **Outputs** | CSV file (`Item,Unit,PackSize,Delivery Date,Notes`) for manual paste into the Deliveries sheet |
| **Maturity** | **Live (prompt only)** — the prompt is stable and versioned, but there is no automated pipeline that wires it to an email inbox. A human must fetch emails, feed them to the agent, and paste the output. This is the "current pain point" identified in `knowledge/automation/delivery-extraction.md:20-22` |
| **Citations** | `knowledge/prompts/extract-delivery.md`; `knowledge/automation/delivery-extraction.md` |

### 2.6 TFSS Data Extraction and Formatting (prompt)

| Aspect | Detail |
|--------|--------|
| **Where it lives** | `knowledge/prompts/tfss-extraction-formatting.md` (72 lines) |
| **What it actually does** | An agent prompt that takes structured TFSS delivery data and produces: (1) ICS calendar events for each Week Cycle delivery, and (2) a tab-delimited list matching the Deliveries sheet columns with inferred categories (Fruit/Grain/Protein/Alternative) and Vendor = TFSS |
| **How to invoke** | An LLM agent loaded with the prompt; the user supplies the structured TFSS data |
| **Maturity** | **Live (prompt only)** — same situation as Extract Delivery: a prompt with no automated pipeline |
| **Citations** | `knowledge/prompts/tfss-extraction-formatting.md`; `knowledge/automation/delivery-extraction.md:27` |

### 2.7 Snack Program Calendar (embedded Google Calendar)

| Aspect | Detail |
|--------|--------|
| **Where it lives** | Embedded on the teacher guidance page via the `hp5` shortcode (`content/docs/teachers.md:113`); shortcode at `layouts/shortcodes/hp5.html` |
| **What it actually does** | Renders an `<iframe>` embedding a Google Calendar (`src=fbaec2a93869...@group.calendar.google.com`). The calendar shows planned snack distributions and vendor deliveries. It is informational only, not a commitment |
| **How to invoke** | Visit `https://rawlinsoncs.github.io/rawlinsonsnp/docs/teachers/` — the calendar renders automatically |
| **Maturity** | **Live** — the shortcode is trivial HTML passthrough; the calendar exists and is embedded. There is **no calendar publisher tool** in this repo: ADR 0001 defers calendar publication to a "separate future tool" (`docs/adr/0001-spreadsheet-as-integration-bus.md:11`), and `knowledge/automation/opportunities.md:30-33` lists it as a remaining opportunity |
| **Citations** | `content/docs/teachers.md:113`; `layouts/shortcodes/hp5.html`; `docs/adr/0001-spreadsheet-as-integration-bus.md:20-23` |

### 2.8 Public Documentation Site (Hugo + Docsy)

| Aspect | Detail |
|--------|--------|
| **Where it lives** | `content/docs/community.md` (Family Guide), `content/docs/teachers.md` (Teacher Guidance); built by `.github/workflows/pages.yml` and deployed to GitHub Pages |
| **What it actually does** | A static site at `https://rawlinsoncs.github.io/rawlinsonsnp/` hosting the Family Guide (program overview, nutrition standards, dietary accommodations, volunteer signup links, donation links) and Teacher Guidance (reporting form link, embedded calendar, FAQ). It links to three external Google Forms: Volunteer Intake Form, Teacher Reporting Form, and general feedback form. It links to the TFSS donation page (`https://tfss.ca/donate/schoolsites-snp/`) |
| **How to invoke** | CI auto-deploys on every push to `main`; local dev via `hugo server -D` |
| **Maturity** | **Live** — the site is the program's public face, deployed continuously |
| **Citations** | `content/docs/community.md`; `content/docs/teachers.md`; `.github/workflows/pages.yml`; `knowledge/communication/documentation-site.md` |

### 2.9 Volunteer Intake Form (Google Form)

| Aspect | Detail |
|--------|--------|
| **Where it lives** | External Google Form; linked from `content/docs/community.md:136,187,236` and `knowledge/operations/volunteer-workflows.md:22` |
| **What it actually does** | Captures volunteer sign-ups for the program. URL: `https://docs.google.com/forms/d/e/1FAIpQLSc9vXzS8igf1ctnruGFHIYfP6KN_mPStFYAoPrZKV8o9Lds9g/viewform?usp=header` |
| **Maturity** | **Live (external)** — the form exists and is linked; no automation processes its responses within this repo |
| **Citations** | `content/docs/community.md:136`; `knowledge/operations/volunteer-workflows.md:14` |

### 2.10 Teacher Reporting Form (Google Form)

| Aspect | Detail |
|--------|--------|
| **Where it lives** | External Google Form; linked from `content/docs/teachers.md:21,45` and `knowledge/communication/teacher-reporting-form.md:11` |
| **What it actually does** | Teachers report dietary updates, quantity adjustments, field trip holds, and waste feedback. URL: `https://docs.google.com/forms/d/e/1FAIpQLScRoEtHOad9SSLyxjuC_P0UjtdTEw9Yn8sncGmdXfXXrlgtTw/viewform?usp=header` (note: the URL in teachers.md line 21 has a typo — `ScRo` vs `Sc9v` in the knowledge bundle; they may be different forms) |
| **Maturity** | **Live (external)** — form responses are reviewed manually; `knowledge/automation/opportunities.md:19-22` lists webhook triage as a remaining opportunity |
| **Citations** | `content/docs/teachers.md:21`; `knowledge/communication/teacher-reporting-form.md` |

### 2.11 WhatsApp Volunteer Coordination

| Aspect | Detail |
|--------|--------|
| **Where it lives** | External WhatsApp group; documented in `knowledge/communication/whatsapp-coordination.md` and `knowledge/operations/volunteer-workflows.md:25` |
| **What it actually does** | Coordinators post daily task digests, schedules, and tag assigned volunteers using `@phone_number` mentions. This is the primary channel for coordinating who does what on which day |
| **Maturity** | **Live (external, manual)** — the group exists; drafting digests is manual. `knowledge/automation/whatsapp-digest-automation.md` describes the automation opportunity |
| **Citations** | `knowledge/communication/whatsapp-coordination.md`; `knowledge/automation/whatsapp-digest-automation.md` |

### 2.12 WhatsApp Digest Automation (documented opportunity)

| Aspect | Detail |
|--------|--------|
| **Where it lives** | `knowledge/automation/whatsapp-digest-automation.md` |
| **What it actually does (if anything)** | Described as a "self-hosted WhatsApp bot (via Baileys Web API container `aaronromeo/announcements`) exposed via REST API, automatically posting daily schedules and tagging scheduled volunteers." **No code, compose file, or container configuration for this bot exists in this repo.** The container image `aaronromeo/announcements` is external and was identified during the original ZK research. The prompt `knowledge/prompts/whatsapp-style-guide.md` exists and defines the message format |
| **Maturity** | **Documented-only / speculative** — the opportunity is recorded, the style guide prompt exists, but no bot implementation, deployment config, or integration code is in this repo |
| **Citations** | `knowledge/automation/whatsapp-digest-automation.md`; `knowledge/prompts/whatsapp-style-guide.md` (read during glob, not shown in full above) |

### 2.13 Volunteer Workflows (documented procedures)

| Aspect | Detail |
|--------|--------|
| **Where it lives** | `knowledge/operations/volunteer-workflows.md` |
| **What it actually does** | Documents the onboarding requirements (TDSB Police Reference Check, training), the daily morning snack distribution procedure (8:20 AM arrival, bin setup, snack retrieval, portioning, dietary substitution bagging, bin delivery by 9:15 AM, cleanup), and the separate delivery-moving role (heavy cases up to 45 lbs from main floor entry to storage). It also documents the day-of perishable failure fallback (draw from safety stock, report in WhatsApp) |
| **Maturity** | **Documented-only** — the procedures are recorded in the knowledge bundle but no tooling automates them |
| **Citations** | `knowledge/operations/volunteer-workflows.md`; `content/docs/community.md:153-226` (published version for families) |

---

## 3. By capability

### 3.1 Ordering

| Tool | Coverage | Maturity |
|------|----------|----------|
| Pantry Spreadsheet (Deliveries sheet) | Records all deliveries (received and future-dated/pending) | Live |
| Generate Menu prompt | Drafts menus and suggests gap-fill orders (HS, Millennium) with prices | Live (agent-driven) |
| HS Price Service | Provides current HS catalog + prices for gap-fill costing | Live (HTTP service) |
| Extract Delivery prompt | Parses vendor confirmation emails into CSV for the sheet | Live (prompt only, no pipeline) |
| TFSS Extraction prompt | Converts TFSS delivery data to ICS + tab-delimited | Live (prompt only) |
| Millennium menu (external) | Public page for cross-referencing grain gap-fill options | External |
| Costco (external) | Bulk purchases, email confirmations only — **no tooling drafts Costco orders** | External |

**Ordering assessment:** The menu builder is the strongest tool: it reads real availability, prices from the HS service, and produces concrete gap-fill suggestions with costs. However, it requires a human agent to run it and manually paste results back. The email extraction prompts reduce manual entry but still require a human to fetch emails and run the agent. Costco ordering is entirely manual — no tooling drafts Costco orders (`knowledge/prompts/generate-menu.md:253`: "note it as a manual alternative, but never draft a Costco order").

### 3.2 Delivery / Distribution

| Tool | Coverage | Maturity |
|------|----------|----------|
| Pantry Spreadsheet (Deliveries + AvailableAsOf) | Tracks deliveries, computes availability, shows pending supply | Live |
| Snack Program Calendar | Public display of planned distributions | Live (embedded, no publisher tool) |
| Pantry Spreadsheet (Distributions sheet) | Logs what was actually distributed | Live |
| Volunteer Workflows doc | Documents the daily distribution procedure | Documented-only |

**Delivery/distribution assessment:** The spreadsheet is the backbone — it tracks what arrived, what was distributed, and what is pending. The calendar shows plans publicly but there is **no calendar publisher tool** to automatically update it from menu approvals. The distribution procedure is well-documented but entirely manual. The day-of perishable failure fallback (safety stock drawdown) is documented but relies on WhatsApp reporting.

### 3.3 Volunteer Management

| Tool | Coverage | Maturity |
|------|----------|----------|
| Volunteer Intake Form (Google Form) | Captures new volunteer sign-ups | Live (external, no processing automation) |
| WhatsApp Group | Shift scheduling and coordination | Live (external, manual) |
| Teacher Reporting Form (Google Form) | Teachers report changes affecting distribution | Live (external, manual triage) |
| Volunteer Workflows doc | Documents onboarding requirements and daily procedures | Documented-only |
| WhatsApp Digest Automation | Auto-posting daily schedules | **Speculative only** — no code in repo |

**Volunteer management assessment:** This is the **thinnest capability**. There is no tool in this repo that:
- Processes volunteer intake form submissions
- Tracks volunteer availability or schedules
- Automates shift assignment
- Sends reminders or confirmations
- Processes teacher form submissions to adjust packing lists

The WhatsApp group is the de facto scheduling tool, and coordinators manually draft and post digests. The WhatsApp bot is documented as an opportunity but not implemented. Teacher form triage and classroom packing list recalculation are also listed as opportunities (`knowledge/automation/opportunities.md:19-22`).

---

## 4. Integration seams

**Pantry spreadsheet as integration bus** (ADR 0001, `docs/adr/0001-spreadsheet-as-integration-bus.md`). All tools connect through the Google Sheets document, not directly to each other:

```
Vendor emails → Extract Delivery prompt → CSV → (manual paste) → Deliveries sheet
                                                              ↓
HS Price Service ←→ Menu Building prompt ←→ AvailableAsOf CSV → (agent reads)
                                                              ↓
Millennium menu (external, read directly by menu builder)    ↓
                                                              ↓
Menu draft + suggested orders → (coordinator approves) → placed orders
                                                              ↓
                                                   Future-dated rows → Deliveries sheet
                                                              ↓
                                                   Snack Program Calendar (future publisher tool)
```

**HS Price Service** runs on `127.0.0.1:8787` on the program machine. The menu builder queries it at run time (`knowledge/prompts/generate-menu.md:107-112`). The service reads `https://healthyselections.ca/products.json` anonymously (ADR 0002). If it fails, the menu builder runs degraded with no prices, flagged.

**No direct service-to-service communication.** ADR 0001 explicitly rejects menu-builder-to-email parsing and menu-builder-to-calendar publication, keeping each transformation as a separate step through the sheet.

**CI** (`.github/workflows/pages.yml`) only builds and deploys the Hugo site. It does not run the HS price service, the knowledge validator, or any agent prompts. The site is the only thing CI touches.

---

## 5. Gaps & risks

### 5.1 Single points of failure

- **The pantry spreadsheet is the single integration bus.** If Google Sheets goes down or the publish URL changes, the menu builder cannot run. The CSV URL is stored in `.env` but is supplied by the coordinator — there is no fallback URL discovery.
- **The HS price service runs on one machine at 127.0.0.1:8787.** If the program machine is unavailable, menu runs cannot price gap-fill orders. The service degrades gracefully (no prices, flagged), but the coordinator still needs availability data from the sheet.
- **CI only deploys the documentation site.** There is no CI pipeline for the HS price service, the knowledge bundle validator, or any agent prompts. Service deployment is a manual `docker compose up -d --build` on the program machine.

### 5.2 Manual steps

- **Email extraction:** A human must fetch vendor confirmation emails, feed them to the Extract Delivery agent, and paste the CSV into the Deliveries sheet. There is no email inbox webhook or automated pipeline.
- **Menu runs:** A human agent must load the Generate Menu prompt, supply the pantry URL, answer coordinator questions, and paste the TSV output back into the sheet.
- **Category and Vendor columns:** After CSV import, a human must manually fill Category (H) and Vendor (I) in the Deliveries sheet. Both are automatable (Vendor from email source, Category from item name) but currently require manual entry (`knowledge/research/pantry-spreadsheet-analysis.md:447`).
- **Order placement:** The menu builder suggests orders; the coordinator places them manually (HS website, Millennium website, Costco website). Placed orders are then manually added as future-dated rows.
- **Calendar updates:** The Snack Program Calendar is updated manually; there is no publisher tool.

### 5.3 Things that only work on one machine

- **HS Price Service** — bound to 127.0.0.1 on the program machine. No remote access.
- **Setup wizard** — requires Docker, a browser, and the coordinator's physical presence to log in via the Chromium container.
- **Menu runs** — require the agent to be able to reach `http://127.0.0.1:8787`, so they must run on the same machine as the price service (or the coordinator must provide the catalog data).

### 5.4 Missing automation

- **Volunteer scheduling** — no tool processes intake forms, tracks availability, or assigns shifts.
- **Teacher form triage** — no webhook on teacher form submissions to auto-recalculate packing lists.
- **Calendar publisher** — deferred tool, not yet built.
- **Allergy label generation** — listed as an opportunity in `knowledge/automation/opportunities.md:24-27`.
- **Inventory threshold alerts** — no automated alerts when stock is low or near expiration.
- **Costco order drafting** — the menu builder explicitly does not draft Costco orders.

### 5.5 Data quality risks

- The Waste sheet has mostly undated entries (only 4 of ~50 have dates) — waste tracking is incomplete.
- The Distributions sheet contains an impossible date (`2026-03-35`) — `knowledge/research/pantry-spreadsheet-analysis.md:254`.
- The "Rebalance" entries in Deliveries (rows 132, 138) have column mismatches (Vendor and Delivery Date swapped) — `knowledge/research/pantry-spreadsheet-analysis.md:259-262`.
- The canonical item vocabulary in the Extract Delivery prompt does not include all 45 items found in the spreadsheet (7 items missing: Banana, Banana Bread, Applesauce (Strawberry-Kiwi), Cheese Portions Marble, MadeGood Granola Bars Mix berry, MadeGood Granola Bars Strawberry, Yogurt Cups Danone) — `knowledge/research/pantry-spreadsheet-analysis.md:296-306`.

---

## 6. Source index

| Claim | Source |
|-------|--------|
| Pantry spreadsheet is the integration bus | `docs/adr/0001-spreadsheet-as-integration-bus.md` |
| Pantry spreadsheet has 8 sheets with specified structure | `knowledge/research/pantry-spreadsheet-analysis.md:37-46` |
| HS price service endpoints and contract | `services/hs-prices/README.md`; `services/hs-prices/server.mjs` |
| HS price service reads products.json anonymously | `docs/adr/0002-hs-catalog-reads-are-anonymous.md`; `services/hs-prices/reader.mjs:6` |
| HS price service compose config (host network, no published ports) | `services/hs-prices/compose.yml:6-20` |
| Setup wizard provisions dormant login profile | `services/hs-prices/setup.sh:187-398` |
| Smoke test checks health, catalog, prices | `services/hs-prices/smoke.sh` |
| Menu builder prompt (343 lines) | `knowledge/prompts/generate-menu.md` |
| Menu builder trialed 2026-09-21 | `knowledge/automation/menu-building.md:28` |
| Extract Delivery prompt (email-to-CSV) | `knowledge/prompts/extract-delivery.md` |
| TFSS Extraction prompt (ICS + tab-delimited) | `knowledge/prompts/tfss-extraction-formatting.md` |
| Delivery extraction is a manual pain point | `knowledge/automation/delivery-extraction.md:20-22` |
| Snack Program Calendar embedded via hp5 shortcode | `content/docs/teachers.md:113`; `layouts/shortcodes/hp5.html` |
| No calendar publisher tool exists yet | `docs/adr/0001-spreadsheet-as-integration-bus.md:11,20-23` |
| Calendar publisher is a remaining opportunity | `knowledge/automation/opportunities.md:30-33` |
| Volunteer intake form URL | `content/docs/community.md:136`; `knowledge/operations/volunteer-workflows.md:14` |
| Teacher reporting form URL | `content/docs/teachers.md:21`; `knowledge/communication/teacher-reporting-form.md:11` |
| WhatsApp coordination channel | `knowledge/communication/whatsapp-coordination.md` |
| WhatsApp digest automation described but not implemented | `knowledge/automation/whatsapp-digest-automation.md` |
| Volunteer workflows documented | `knowledge/operations/volunteer-workflows.md` |
| Teacher form triage as opportunity | `knowledge/automation/opportunities.md:19-22` |
| Allergy label generation as opportunity | `knowledge/automation/opportunities.md:24-27` |
| CI only deploys Hugo site | `.github/workflows/pages.yml` |
| HS price service design record (spec + wizard issue, both marked implemented) | `.scratch/hs-price-service/spec.md`; `.scratch/hs-price-service/issues/01-setup-wizard.md` |
| Knowledge bundle validates with 0 FAIL | `bash knowledge/validate.sh knowledge` output |
| 23 concept files in knowledge bundle | `bash knowledge/validate.sh knowledge` output |
| Menu skill definition | `.agents/skills/menu/SKILL.md` |
