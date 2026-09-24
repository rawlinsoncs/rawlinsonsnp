# Update Log

## 2026-09-21 (bundle consistency)
- **Creation**: Added `automation/menu-building.md` — the automation concept for the menu builder (weekly loop, boundaries per ADR 0001, degraded mode), listed in `automation/index.md`.
- **Update**: `automation/opportunities.md` — the menu-calendar item is now partially realized (menu proposal trialed live 2026-09-21); what remains is calendar publishing and inventory threshold alerts.
- **Update**: `operations/pantry-inventory.md` — recorded vendor access facts found during the trial: the HS catalog is login-gated (prices served by the planned Docker price service) with a public delivery banner; Millennium's menu and prices are public.
- **Update**: Bundle-root `index.md` prompts description now includes menu generation; `prompts/generate-menu.md` gained the verified TDSB school-calendar URL.

## 2026-09-21 (menu builder simplification)
- **Update**: Simplified `prompts/generate-menu.md` after its first live trial run: input is the single published AvailableAsOf CSV (no raw-sheet fetches, no delta math), one serving week per run, the public Millennium menu added as the grain gap-fill cross-reference, and `Multi` accepted as the sheet's fifth category label for dual-component items. Trial findings (zero-Distributions overstatement, unverifiable per-batch dates) became prompt flags instead of schema changes — the Menu/MenuInput sheets were considered and rejected; ADR 0001 amended accordingly.

## 2026-09-21 (menu builder inputs)
- **Update**: Revised `prompts/generate-menu.md` inputs — the pantry sheets are read from Google Sheets publish-to-web CSV URLs (phone-first, no manual exports); Healthy Selections catalog and prices come from a planned Docker price service maintaining the vendor login, with a degraded no-pricing mode and the public delivery banner fetched directly; exact order costs land post-order from the order-confirmation email.

## 2026-09-21 (menu builder)
- **Creation**: Added `prompts/generate-menu.md` — the menu-builder agent prompt: takes a pantry spreadsheet export (including future-dated rows as pending supply), drafts the Menu per serving week against the TDSB two-component rule and ~720-student sufficiency, assigns items by perishability, and suggests gap-fill orders (grains held for Millennium, fruit/vegetables from Healthy Selections with live pricing and cost per child per day). Email extraction and calendar publication remain separate services by design.
- **Update**: Fixed hardcoded `Fruit` category in `prompts/tfss-extraction-formatting.md` — TFSS ships all components; the category is now inferred per product (dairy → Protein, whole-grain → Grain), with a Protein example row added.
- **Update**: Restructured `operations/pantry-inventory.md` — vendor table split into Donors (TFSS Bridging the Nutrition Gap, contents vendor-chosen) and Suppliers (Healthy Selections, Millennium Bakery grains-only with ≥1 week lead, Costco); documented the supply-lag model (week N deliveries serve week N+1, Millennium same-day) and Safety stock; softened the TFSS Wednesday claim (dates drift with school holidays); noted future-dated rows as the pending-order record.

## 2026-09-20 (nutrition standards)
- **Update**: Rewrote `program/nutrition-standards.md` from primary sources (MCCSS SNP Nutrition Guidelines 2020 + City of Toronto adaptation) — added yogurt sugar threshold (≤ 11 g/100 g), bran as a qualifying first ingredient, milk-fat limits, milk rules, juice prohibition, pro-rating rule; linked the full extraction in `research/tdsb-snp-product-requirements.md`.

## 2026-09-20 (research — product requirements)
- **Research**: Added `research/tdsb-snp-product-requirements.md` — full extraction of SNP product choice rules from MCCSS 2020 provincial guidelines and City of Toronto/TPH adaptations: all numeric thresholds (sugar, sodium, milk fat), per-category serve/do-not-serve tables, label-reading rules, morning-snack structure, reconciliation with school teacher-guidance claims (all three numbers confirmed, with noted omissions).

## 2026-09-20 (prompt fix)
- **Update**: Fixed CSV column order in `prompts/extract-delivery.md` to match the Deliveries sheet — header is now `Item,Unit,PackSize,Delivery Date,Notes` (sheet columns A, B, C, J, K), with a note that columns D–I are computed or maintained in-sheet.

## 2026-09-20 (clarifications)
- **Update**: Added coordinator clarifications to `research/pantry-spreadsheet-analysis.md` — formula columns D/F/G vs manual E/H/I; `HealthySelections spend` and `Vendor Analysis` out of automation scope; TFSS current-year schedule is Wednesday mornings (Monday pattern was last year's).

## 2026-09-20 (research)
- **Research**: Added `research/pantry-spreadsheet-analysis.md` — full structural analysis of the pantry tracking spreadsheet (.xlsx and .ods), covering all 8 sheets, schemas, 45 items, 6 vendors, formulas, data anomalies, and 15 open questions for automation design.
- **Creation**: Added `research/` directory with index.

## 2026-09-20 (import)
- **Import**: Added three prompts to `prompts/` — `extract-delivery.md`, `tfss-extraction-formatting.md`, `whatsapp-style-guide.md` (from Downloads, bodies verbatim, sources recorded).
- **Creation**: Added `README.md` (maintenance guide).
- **Update**: Cross-linked prompts from automation and communication concepts.

## 2026-09-20
- **Creation**: Bundle created from ZK note `20260915000000_research_student_nutrition_program.md`; decomposed into 12 concepts across program, operations, communication, and automation.
