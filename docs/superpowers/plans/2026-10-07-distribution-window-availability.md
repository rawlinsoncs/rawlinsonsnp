# Distribution-Window Availability Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Repoint the menu builder from a single Monday-cutoff serving-week view to the pantry sheet's five-column Distribution window, where deliveries default to next-day availability and near-delivery-day placement is the rule.

**Architecture:** The spreadsheet side is already built (window columns I–M on the `AvailableAsOf` tab; `Available from (override)`/`Available from` columns L/M on Deliveries). This plan changes only prose artifacts: the menu prompt (`knowledge/prompts/generate-menu.md`), the `menu` skill pointer, `AGENTS.md`, `CONTEXT.md`, and the bundle log — then verifies against the live sheet.

**Tech Stack:** Hugo Extended 0.153.2 (Extended — SCSS pipeline), OKF v0.2 knowledge bundle, Google Sheets publish-to-web CSV. No application runtime code changes.

## Global Constraints

- Toolchain pinned in `.tool-versions`: Hugo **Extended** 0.153.2, Dart Sass 1.97.1, Go 1.25.5, Node 24.12.0. Verify Hugo is the extended build with `hugo version`.
- Verification bar (AGENTS.md): a clean `hugo --gc --minify --baseURL "http://localhost/"` **plus** zero `validate.sh` FAIL lines. There is no test suite.
- OKF: non-reserved `.md` files need YAML frontmatter with a non-empty `type`; update `generated`; never set or edit `verified`; add `log.md` entries newest-first; run `bash knowledge/validate.sh knowledge` after bundle edits.
- Absolute dates in frontmatter use `date -u +%Y-%m-%dT%H:%M:%SZ`; coordinator-attributed sources use `author: human:aaron`.
- Commit messages: imperative, sentence case, matching repo style (`Add …`, `Update …`). Never stage `node_modules/` or `resources/_gen/`.
- Keep external links exactly as written. Use `CONTEXT.md` terms verbatim and avoid the listed "Avoid" alternatives.
- Do not edit the spreadsheet, `extract-delivery.md`, or `tfss-extraction-formatting.md`.

---

## Precondition: clean the working tree

The previous task's menu-skill work is uncommitted and must land first, or every later diff will mix the two change sets.

- [ ] **Step 1: Confirm the outstanding change set**

Run: `git status --short`
Expected exactly:
```
 M AGENTS.md
 M CONTEXT.md
 M knowledge/log.md
 M knowledge/prompts/generate-menu.md
?? .agents/skills/menu/
```

- [ ] **Step 2: Commit it as the slot-model baseline**

```bash
git add AGENTS.md CONTEXT.md knowledge/log.md knowledge/prompts/generate-menu.md .agents/skills/menu/
git commit -m "Add menu skill and slot-model rules"
```

---

## Task 1: Add Distribution-window vocabulary to CONTEXT.md

**Files:**
- Modify: `CONTEXT.md` (insert after the `Delta-fill` entry, before `Substitution bag`)

**Interfaces:**
- Produces: the terms **Distribution window** and **Available from**, referenced by the prompt (Task 2), the skill and AGENTS.md (Task 3).

- [ ] **Step 1: Insert the two entries**

Exact old text:
```
**Substitution bag**:
```
Exact new text:
```
**Distribution window**:
The planning unit for a menu run: five consecutive distribution days from a coordinator-set anchor, usually aligned with delivery days and possibly crossing calendar weeks.
_Avoid_: serving week (when meaning the planning window), five-day plan

**Available from**:
The day a delivery's servings become usable for distribution; next day by default, or a coordinator-set override for same-day arrivals (e.g., Millennium's morning bake).
_Avoid_: delivery date (when meaning the usable date), arrival date

**Substitution bag**:
```

- [ ] **Step 2: Verify the terms are present and unique**

Run: `rg -n "^\*\*(Distribution window|Available from)\*\*" CONTEXT.md`
Expected: two matching lines, in that order.

- [ ] **Step 3: Commit**

```bash
git add CONTEXT.md
git commit -m "Add Distribution window and Available from vocabulary"
```

---

## Task 2: Repoint generate-menu.md at the Distribution window

**Files:**
- Modify: `knowledge/prompts/generate-menu.md`
- Modify: `knowledge/prompts/generate-menu.md` frontmatter `description`, `generated.at`, and `sources`

**Interfaces:**
- Consumes: terms from Task 1; the live sheet layout (window columns I–M, Deliveries columns L/M).
- Produces: the single source of truth the skill and AGENTS.md point at.

- [ ] **Step 1: Update the frontmatter `description`**

Exact old text:
```
description: Agent prompt that builds the weekly snack Menu from a pantry spreadsheet export — slot-filled draft menu, gap analysis, suggested gap-fill orders with cost per child per day, and the week's distribution schedule.
```
Exact new text:
```
description: Agent prompt that builds the snack Menu for a Distribution window from the pantry spreadsheet's window columns — slot-filled draft menu, per-day gap analysis, suggested gap-fill orders with cost per child per day, and the window's distribution schedule.
```

- [ ] **Step 2: Bump `generated.at`**

Run: `date -u +%Y-%m-%dT%H:%M:%SZ` and replace the `at:` value in the `generated:` line with the command's output:
```
generated: { by: opencode/kimi-k3, at: 2026-10-07T15:53:49Z }
```
Expected: the line now carries the fresh UTC timestamp; `stale_after` stays `2027-04-07T00:00:00Z`.

- [ ] **Step 3: Add the window-design source**

Exact old text:
```
  - id: coordinator-2026-10-07
    resource: scope: coordinator rulings during the week-of-Oct-5 menu run
    title: Slot model (540 + 180), consistency with delta-fill, K exclusions, pairing rules, Millennium waiver at coordinator discretion, distribution-schedule format
    author: human:aaron
---
```
Exact new text:
```
  - id: coordinator-2026-10-07
    resource: scope: coordinator rulings during the week-of-Oct-5 menu run
    title: Slot model (540 + 180), consistency with delta-fill, K exclusions, pairing rules, Millennium waiver at coordinator discretion, distribution-schedule format
    author: human:aaron
  - id: coordinator-2026-10-07-window
    resource: scope: coordinator window-design session 2026-10-07
    title: Distribution window (five hand-typed cutoffs on the AvailableAsOf tab), user-dictated runs, next-day availability default with an Available-from override column
    author: human:aaron
---
```

- [ ] **Step 4: Rewrite the intro paragraphs**

Exact old text:
```
You are a menu-building agent for the Rawlinson Student Nutrition Program.
Your input is an export of the pantry tracking spreadsheet. Your output is a
draft Menu for one serving week, a gap analysis, suggested gap-fill orders,
and the week's distribution schedule.

A menu run plans in **slots**: one item, one population, one component, one
day. Vocabulary (Menu, Snack, Serving week, Slot, Delta-fill, Donation,
Gap-fill Purchase, Safety stock, Dual-component item, Week Cycle, Cost per
child per day) is defined in the repo's `CONTEXT.md` — use those terms
exactly.
```
Exact new text:
```
You are a menu-building agent for the Rawlinson Student Nutrition Program.
Your input is an export of the pantry tracking spreadsheet. Your output is a
draft Menu for one Distribution window, a gap analysis, suggested gap-fill
orders, and the window's distribution schedule.

A menu run plans in **slots**: one item, one population, one component, one
day, across a **Distribution window** of five consecutive distribution days.
Vocabulary (Menu, Snack, Distribution window, Serving week, Slot,
Delta-fill, Available from, Donation, Gap-fill Purchase, Safety stock,
Dual-component item, Week Cycle, Cost per child per day) is defined in the
repo's `CONTEXT.md` — use those terms exactly.
```

- [ ] **Step 5: Replace Input item 1**

Exact old text:
```
1. **AvailableAsOf sheet** — published CSV (Google Sheets publish-to-web,
   one-time setup; the coordinator sets the *As of date* cutoff to the
   Monday of the serving week being planned and supplies the URL; follow
   redirects, the `pubhtml` form renders empty). Columns: Item, Category,
   Available as of, Deliveries, Distributions, Waste. The sheet's own
   formulas do the availability math and include future-dated deliveries up
   to the cutoff — pending orders and scheduled Donations are your
   forward-looking supply. Do not recompute availability from raw sheets.
```
Exact new text:
```
1. **AvailableAsOf sheet** — published CSV (Google Sheets publish-to-web,
   one-time setup; the coordinator supplies the URL; follow redirects, the
   `pubhtml` form renders empty). Columns C–F hold the legacy single-cutoff
   view; columns I–M are the **Distribution window**, whose row-1 cells
   hold the five hand-typed cutoff dates. Each window cell is that item's
   availability as of that date, computed by the sheet's own formulas (the
   same math as the legacy view, except deliveries count by their
   *Available from* date — see the delivery-availability section below).
   One fetch reads the whole window. Skip rows with an empty Item (the
   fill-down padding). Do not recompute availability from raw sheets.
```

- [ ] **Step 6: Update Input item 6 (coverage)**

Exact old text:
```
6. **Coverage** — which school weeks between the latest recorded
   Distributions and the serving week are already covered by their own
   plans or orders. The cutoff marks the serving week, but says nothing
   about coverage of the weeks before it. If the coordinator hasn't said,
   ask before computing gaps; never assume coverage either way.
```
Exact new text:
```
6. **Coverage** — which school weeks between the latest recorded
   Distributions and the window's first day are already covered by their
   own plans or orders. The window's first cutoff marks the window, but
   says nothing about coverage of the weeks before it. If the coordinator
   hasn't said, ask before computing gaps; never assume coverage either way.
```

- [ ] **Step 7: Replace the Supply section**

Exact old text:
```
## Supply

- Availability comes from the AvailableAsOf view as-is — one row per item:
  Item, Category, servings available as of the cutoff. Its formulas already
  include pending deliveries dated on or before the cutoff, so forward
  supply is visible with no delta math. Trust it: a gap is only a gap if
  the view shows the component short — this is the double-ordering guard.
- If Distributions are all zero or stale relative to the cutoff, the view
  overstates availability by unrecorded consumption — but subtract it only
  for school weeks the coordinator says are NOT already covered (see
  Input). For each uncovered week, subtract ~school days × student count
  per component. Record the coverage answer in the flags.
- Exclude non-food rows (serving supplies such as spoons, packaging).
```
Exact new text:
```
## Supply

- Availability comes from the window columns as-is — one row per item, five
  servings figures, one per cutoff date. Each column already includes every
  delivery whose *Available from* date is on or before it (pending orders
  and scheduled Donations included), plus every logged distribution and
  waste up to it, so forward supply is visible with no delta math. Trust
  it: a gap is only a gap if that day's column shows the component short —
  this is the double-ordering guard.
- If Distributions are all zero or stale relative to the window, the sheet
  overstates availability by unrecorded consumption — but subtract it only
  for school weeks the coordinator says are NOT already covered (see
  Input). For each uncovered week, subtract ~school days × student count
  per component. Record the coverage answer in the flags.
- Exclude non-food rows (serving supplies such as spoons, packaging).
```

- [ ] **Step 8: Replace the Serving-weeks section with two sections**

Exact old text:
```
## Serving weeks

- A serving week is a school week (Mon–Fri) minus holidays and PD days per
  the TDSB calendar. Verify each week; a holiday week has fewer serving days
  and needs proportionally fewer servings.
- Plan **one serving week per run** — the week the coordinator is
  purchasing for. Longer horizons are already in the sheet as future-dated
  rows and will surface in later runs.
- Supply mapping: serving week W is fed by deliveries dated in week W−1,
  plus Millennium goods delivered Wednesday of week W (baked that morning,
  served same day), plus carry-over stock. TFSS delivers *generally* on
  Wednesdays but dates drift with school holidays and other factors; never
  assume a weekday — use actual dates from the delivery emails.
```
Exact new text:
```
## The Distribution window

- The planning unit is the **Distribution window**: the five cutoff dates in
  the sheet's window columns (I–M), set by the coordinator before the run.
  The anchor is movable (e.g., a Wednesday when deliveries cluster) and the
  window may cross calendar weeks (Wed–Tue).
- Runs are coordinator-dictated: run whenever asked, against whatever window
  is stored. Plan the window days not yet served; days already distributed
  (logged in Distributions) are done.
- **Validate the window first.** The five header dates must be five
  distinct, strictly increasing, real school days per the TDSB calendar.
  Flag a holiday or weekend cutoff or a non-consecutive gap (for example,
  Thanksgiving Monday inside the window) and ask — never silently correct
  the coordinator's dates.
- **Chain the window.** Each column already includes every delivery with an
  *Available from* date on or before that cutoff and every logged
  distribution and waste up to it. Future distributions are not yet logged,
  so the sheet cannot subtract the run's own plan: projected availability
  entering window day *n* = window column *n* − the run's planned
  consumption for earlier window days.
- **Mid-window runs:** for window days already served, read consumption
  from the Distributions log; if the log shows nothing for a day that has
  passed and lag is plausible, ask the coordinator to declare it — the same
  declare-don't-assume rule as disposals.
- Supply mapping is per day, not per week: a delivery lands in the first
  window column whose cutoff is at or after its *Available from* date. TFSS
  delivers *generally* on Wednesdays but dates drift with school holidays
  and other factors; never assume a weekday — use actual dates.
  Millennium's Wednesday bake is normally same-day (baked that morning,
  served same day), recorded as an `Available from` override.

## Delivery availability (`Available from`)

- The default is **next day**: a delivery becomes available the day *after*
  it arrives, because the vast majority land after that day's distribution.
- Deliveries column L (`Available from (override)`) records the exception.
  Blank = next day. A typed date is the actual usable date — Millennium's
  same-day bake is entered as its own delivery date.
- Deliveries column M (`Available from`) is the formula `=IF(L2="",J2+1,L2)`;
  the window columns key on it. Never edit M, and never key planning off the
  raw Delivery Date (column J).
- Flag a same-day override (L = J) that lands inside the window for the
  coordinator to eyeball ("landed before distribution?"), and flag an
  override earlier than its delivery date as a likely typo. Blank rows are
  never flagged.
```

- [ ] **Step 9: Update the Assignment section**

Exact old text:
```
## Assignment within the week

- Fresh items are generally used by the end of the week following their
  delivery; dairy and produce earliest within the serving week.
- Millennium baked goods: same-day unrefrigerated, up to a week refrigerated.
- Shelf-stable items are flexible and carry no urgency — consolidate them
  late in the week.
```
Exact new text:
```
## Assignment within the window

- **Freshness is the point of the window:** place perishables on the
  earliest window day at or after their *Available from* date. Flag any
  perishable sitting two or more days past its availability, with the day
  count.
- Millennium baked goods: same-day unrefrigerated, up to a week refrigerated.
- Shelf-stable items are flexible and carry no urgency — consolidate them
  late in the window.
```

Exact old text:
```
- Flag any placement outside its window and any perishable scheduled more
  than a week past its delivery.
```
Exact new text:
```
- Flag any placement outside its window and any perishable scheduled more
  than a week past its *Available from* date.
```

- [ ] **Step 10: Add the per-day gap rule to Gap-fill**

Exact old text:
```
## Gap-fill

- **Stock first** — plannable stock above the reserve floor fills slots
```
Exact new text:
```
## Gap-fill

- **Per-day gaps.** A gap is a shortfall on a specific window day (`DN
  short 540`). Before suggesting an order for day *n*, check that day's
  column: a delivery arriving earlier in the window already covers it — the
  within-window double-ordering guard.
- **Stock first** — plannable stock above the reserve floor fills slots
```

Exact old text:
```
  each held gap, state the Millennium order-by date and check the HS
  fallback: if Millennium declines, the HS banner delivery date must still
  precede the serving day — if it does not, flag the gap **urgent: decide
  now**.
```
Exact new text:
```
  each held gap, state the Millennium order-by date and check the HS
  fallback: if Millennium declines, the HS banner delivery date must still
  precede the window day being covered — if it does not, flag the gap
  **urgent: decide now**.
```

Exact old text:
```
  - The banner next-delivery date must precede the serving day; flag
    conflicts.
```
Exact new text:
```
  - The banner next-delivery date must precede the window day being
    covered; flag conflicts.
```

- [ ] **Step 11: Update the Cost section wording**

Exact old text:
```
Exact costs land post-order from the order-confirmation email. Report per
day and rolled up per serving week.
```
Exact new text:
```
Exact costs land post-order from the order-confirmation email. Report per
day and rolled up per window.
```

- [ ] **Step 12: Update the Output format**

Exact old text:
```
## Output format

One section per serving week, then a summary:

1. **Menu draft** — table: Day | Veg/Fruit — Gr 1–8 (540) | Veg/Fruit —
   K (180) | Grain/Protein/Dairy — Gr 1–8 (540) | Grain/Protein/Dairy —
   K (180) | Source (Donation / Stock / Gap-fill) | Cost per child.
2. **Gap analysis** — week, day, slot, servings short, disposition
   (Millennium hold / HS / covered by pending row).
```
Exact new text:
```
## Output format

One section per Distribution window, then a summary:

1. **Menu draft** — table: Day | Veg/Fruit — Gr 1–8 (540) | Veg/Fruit —
   K (180) | Grain/Protein/Dairy — Gr 1–8 (540) | Grain/Protein/Dairy —
   K (180) | Source (Donation / Stock / Gap-fill) | Cost per child.
2. **Gap analysis** — day, slot, servings short, disposition (Millennium
   hold / HS / covered by pending row).
```

Exact old text:
```
4. **Flags** — slot-arithmetic waste with quantities, dual-component days,
   out-of-window placements, new/unmapped items, banner conflicts,
   holidays/PD days, urgent gaps, reserve-floor drawdowns, price
   verifications pending, the coverage answer.
```
Exact new text:
```
4. **Flags** — invalid or holiday header dates, logging lag on served
   window days, freshness postponements with day counts, same-day overrides
   inside the window, overrides earlier than their delivery date,
   slot-arithmetic waste with quantities, dual-component days,
   out-of-window placements, new/unmapped items, banner conflicts,
   holidays/PD days, urgent gaps, reserve-floor drawdowns, price
   verifications pending, the coverage answer.
```

Exact old text:
```
5. **Summary** — weeks planned, total order cost, week cost-per-child range.
```
Exact new text:
```
5. **Summary** — window planned, total order cost, window cost-per-child
   range.
```

Exact old text:
```
6. **Distribution schedule** — in two parts:
   - the full week as a table with every row marked Stock or highlighted
     **TO ORDER** (vendor, needed-by date);
```
Exact new text:
```
6. **Distribution schedule** — in two parts. The window's five dates are
   the header dates read from the sheet:
   - the full window as a table with every row marked Stock or highlighted
     **TO ORDER** (vendor, needed-by date);
```

- [ ] **Step 13: Update the Validation checklist**

Exact old text:
```
## Validation before finalizing

- Every serving day × component has a 540 item and a 180 item, or appears
  in the gap analysis.
```
Exact new text:
```
## Validation before finalizing

- The five window header dates were validated against the TDSB calendar
  (distinct, increasing, real school days), or a mismatch is flagged and
  asked.
- Every unserved window day × component has a 540 item and a 180 item, or
  appears in the gap analysis.
```

Exact old text:
```
- No gap is suggested for order twice (the view's inclusion of pending
  deliveries was trusted).
```
Exact new text:
```
- No gap is suggested for order twice, including within the window: each
  day's column already includes pending deliveries up to it.
- Each perishable was placed on the earliest window day at or after its
  *Available from* date, or its postponement is flagged with a day count.
- Planning keyed off *Available from* (column M), never the raw Delivery
  Date; the run's window chaining subtracted only earlier unserved days'
  planned consumption.
- Same-day overrides inside the window were surfaced for confirmation, and
  overrides earlier than their delivery date were flagged.
```

Exact old text:
```
- Coverage of weeks outside the serving week came from the coordinator,
  not from an assumption in either direction; disposals were honored
  immediately and waste-log reminders issued.
- A passed Millennium order-by was surfaced to the coordinator, and any
  waiver is recorded in the flags.
- School days verified against the TDSB calendar.
- Distribution-schedule item text matches the Deliveries text exactly.
```
Exact new text:
```
- Coverage of weeks outside the window came from the coordinator, not from
  an assumption in either direction; disposals were honored immediately and
  waste-log reminders issued.
- A passed Millennium order-by was surfaced to the coordinator, and any
  waiver is recorded in the flags.
- Distribution-schedule item text matches the Deliveries text exactly.
```

- [ ] **Step 14: Verify no stale week-based wording remains**

Run:
```
rg -n "per serving week|Monday of the serving|the view's inclusion|serving day" knowledge/prompts/generate-menu.md
```
Expected: no output (exit 1).

Run:
```
bash knowledge/validate.sh knowledge
```
Expected: `PASS: <n> concept files valid | FAIL: 0`.

- [ ] **Step 15: Commit**

```bash
git add knowledge/prompts/generate-menu.md
git commit -m "Repoint menu builder at the Distribution window"
```

---

## Task 3: Update the skill pointer, AGENTS.md, and the bundle log

**Files:**
- Modify: `.agents/skills/menu/SKILL.md`
- Modify: `AGENTS.md` (the Menu planning runs paragraph)
- Modify: `knowledge/log.md` (prepend entry)

**Interfaces:**
- Consumes: the window terminology and prompt section names from Task 2.
- Produces: the discoverable entry points agent sessions rely on.

- [ ] **Step 1: Rewrite the skill pointer**

Replace the whole file with:
```
---
name: menu
description: "Use when the user asks to build, draft, or suggest the Rawlinson SNP snack menu for a distribution window, asks for the next order, mentions a menu run, or supplies a pantry window sheet for menu planning."
---

# Menu

The menu run's process lives in [`knowledge/prompts/generate-menu.md`](../../../knowledge/prompts/generate-menu.md) — read it fully before doing anything. It is the single source of truth for the Distribution window, the slot model, the pairing and exclusion rules, gap-fill dispositions, and the output formats.

Two inputs only the coordinator can supply; get them before computing:

1. The pantry publish-to-web **CSV URL** — the `AvailableAsOf` tab carries the five hand-typed window cutoff dates (columns I–M). The coordinator sets them before a run (the `pubhtml` form renders empty).
2. Answers on **coverage**, **perishability windows**, and **disposals** — ask; these are never assumed.

Deliveries become available the next day by default; the coordinator marks same-day cases in the sheet's `Available from (override)` column, so the window columns are the truth. Placed orders return as future-dated rows, so the next run reads them as pending supply.
```

- [ ] **Step 2: Update the AGENTS.md menu-runs paragraph**

Exact old text (one line, line 34):
```
Requests like "suggest next week's order" fire the `menu` skill, which runs `knowledge/prompts/generate-menu.md` — read it first; it encodes coordinator rules you cannot guess: the slot model (per day per component, one item at 540 for grades 1–8 plus one at 180 for kindergarten; partial lots are delta-filled, never pooled; stranded remainders are written off and flagged), coverage scope (ask which weeks before the serving week are already covered — never assume either way), stock before purchasing, ask-don't-assume on unknown perishability windows and disposals, and the two-day shelf-stable safety-stock floor (granola bars; raisins or apple squeeze packs) that is off-limits for planning.
```
Exact new text:
```
Requests like "suggest next week's order" fire the `menu` skill, which runs `knowledge/prompts/generate-menu.md` — read it first; it encodes coordinator rules you cannot guess: the **Distribution window** (five hand-typed cutoff dates on the `AvailableAsOf` tab, columns I–M; runs are coordinator-dictated and read whatever window is stored), **next-day availability** (blank `Available from` override = next day; the coordinator marks same-day exceptions), the slot model (per day per component, one item at 540 for grades 1–8 plus one at 180 for kindergarten; partial lots are delta-filled, never pooled; stranded remainders are written off and flagged), coverage scope (ask which weeks before the window are already covered — never assume either way), stock before purchasing, ask-don't-assume on unknown perishability windows and disposals, and the two-day shelf-stable safety-stock floor (granola bars; raisins or apple squeeze packs) that is off-limits for planning.
```

- [ ] **Step 3: Prepend the log entry**

Exact old text:
```
# Update Log

## 2026-10-07 (menu builder — slot model and consistency rules)
```
Exact new text:
```
# Update Log

## 2026-10-07 (menu builder — distribution window)
- **Update**: `prompts/generate-menu.md` — the planning unit is now the Distribution window: five hand-typed cutoff dates in the `AvailableAsOf` tab's window columns (I–M), read in one fetch, each column already including every delivery whose *Available from* date is on or before it. Runs are coordinator-dictated and read the stored window; the run validates the dates against the TDSB calendar, chains the window day by day (subtracting its own planned consumption for earlier days), and places perishables on the earliest window day at or after availability. Deliveries default to next-day availability; the Deliveries sheet's new `Available from (override)`/`Available from` columns (L/M) carry the same-day exception (Millennium's morning bake), and the extraction scripts are unchanged. Per-day gaps replace per-week gaps, with a within-window double-ordering guard.
- **Update**: `CONTEXT.md` — added Distribution window and Available from.
- **Note**: `.agents/skills/menu/SKILL.md` and `AGENTS.md` repointed at the window sheet. Design spec: `docs/superpowers/specs/2026-10-07-distribution-window-availability-design.md`.

## 2026-10-07 (menu builder — slot model and consistency rules)
```

- [ ] **Step 4: Validate and commit**

Run: `bash knowledge/validate.sh knowledge`
Expected: `FAIL: 0`.

```bash
git add .agents/skills/menu/SKILL.md AGENTS.md knowledge/log.md
git commit -m "Point menu skill and AGENTS.md at the Distribution window"
```

---

## Task 4: End-to-end verification

**Files:** none (verification only).

- [ ] **Step 1: Bundle validation**

Run: `bash knowledge/validate.sh knowledge; echo "exit=$?"`
Expected: `FAIL: 0` and `exit=0`.

- [ ] **Step 2: Site build**

Run: `hugo --gc --minify --baseURL "http://localhost/"`
Expected: builds with no ERROR/FAILED lines (warnings ok). If `hugo` is missing, install the pinned Extended build per AGENTS.md first.

- [ ] **Step 3: Live-sheet smoke test**

Run:
```
curl -sL "https://docs.google.com/spreadsheets/d/e/2PACX-1vRO5pptJaH-azIRjBQji2-ZOygI_yZsAYH-Yd4TofKBU5vl9f4PCcRcwZIfGg2Z4_9_wqBUjoMNkKAA/pub?gid=944515770&single=true&output=csv" | grep -m1 '^Clementine,'
```
Expected: a row whose five trailing window values are dates-derivable figures — for the currently stored window `2026-10-12 … 2026-10-16`, values should read `1900,1900,1900,1900,2620` (the last-day jump proves per-column cutoffs work). Also confirm the header contains five date columns:
```
curl -sL "<same URL>" | head -1
```
Expected header ends `…,As of date:,2026-10-12,2026-10-13,2026-10-14,2026-10-15,2026-10-16`.

- [ ] **Step 4: Confirm no unintended files changed**

Run: `git status --short`
Expected: clean tree (all four tasks committed).

---

## Self-Review

**Spec coverage:** every spec section maps to a task — sheet consumption/chaining → Task 2 Steps 5,8; Available-from semantics → Step 8; freshness rule → Step 9; per-day gaps/guard → Step 10; output + flags → Steps 12–13; skill/AGENTS/log → Task 3; vocabulary → Task 1; verification → Task 4. The spec's "extraction unchanged" and "sheet already built" are honored by *not* including those files.

**Placeholder scan:** the only instruction to compute a value at runtime is the `generated.at` timestamp (exact command given), which is required because the execution date is unknowable at plan-writing time. No TBD/TODO.

**Type consistency:** term names are identical across tasks (`Distribution window`, `Available from`, `Available from (override)`, columns I–M, L/M); the prompt sections referenced by the skill/AGENTS text (`Distribution window`) exist after Task 2.
