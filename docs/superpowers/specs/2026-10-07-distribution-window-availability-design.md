# Distribution-window availability — menu planning closer to delivery dates

- **Date:** 2026-10-07
- **Status:** design approved by coordinator; awaiting implementation plan
- **Problem owner:** SNP coordinator

## Problem

Menu runs planned an entire serving week from a single Monday-cutoff
availability snapshot. Deliveries landing later in the week were invisible
at planning time, so food that arrived Wednesday could be assigned to
Friday's slots. Goal: **distribute food on the earliest distribution day at
or after the day it becomes usable.**

## Decisions (coordinator, 2026-10-07)

- **Planning unit: the Distribution window** — five consecutive
  distribution days from a coordinator-set anchor. The anchor is movable
  (e.g., Wednesday when deliveries cluster) and the window may cross
  calendar weeks (Wed–Tue).
- **Runs are user-dictated.** The coordinator triggers a menu run whenever
  they want; the sheet is always ready; each run reads whatever window is
  stored.
- **Window cutoffs are typed by hand** into the sheet header (five cells,
  one edit-set per window advance). No auto-computation, no in-sheet
  holiday logic — the coordinator is the calendar expert; the run validates
  the dates against the TDSB calendar and flags mismatches, never guesses.
- **One sheet, one URL** — window columns live beside the existing view on
  the same tab, not on five separately published sheets.
- **Default availability is next-day.** For the vast majority of deliveries
  (arrived after that day's distribution), food becomes distributable the
  following distribution day. Same-day is the deliberate exception
  (Millennium's morning bake), recorded in an override column.
- **Extraction scripts take zero changes** — new columns sit outside the
  extract-CSV paste zone (A, B, C, J, K).

## The sheet (as built; verified live 2026-10-07)

The `AvailableAsOf` tab was extended in place rather than a new tab
created. Published URL (same gid as before, so no new link to configure):

`https://docs.google.com/spreadsheets/d/e/2PACX-1vRO5pptJaH-azIRjBQji2-ZOygI_yZsAYH-Yd4TofKBU5vl9f4PCcRcwZIfGg2Z4_9_wqBUjoMNkKAA/pub?gid=944515770&single=true&output=csv`

Layout as published (header row):

`Item | Category | Available as of | Deliveries | Distributions | Waste | | As of date: | <cutoff1> | <cutoff2> | <cutoff3> | <cutoff4> | <cutoff5>`

- Columns **I:M** are the window; their row-1 cells hold the five typed
  cutoff dates (real date values). Verified first window: 2026-10-12 …
  2026-10-16.
- The original single-cutoff columns C:F remain; the legacy `As of date:`
  cell now doubles as the first window cutoff, so column C tracks
  window-day-1.
- Window column formula (entered in I2, filled right to M and down the
  item list):

```
=IF($A2="","",LET(
  item, $A2,
  cutoff, I$1,
  SUMIFS(Deliveries!$G:$G, Deliveries!$A:$A, item, Deliveries!$M:$M, "<="&cutoff)
  - MAX(0, SUMIFS(Distributions!$C:$C, Distributions!$B:$B, item, Distributions!$A:$A, "<="&cutoff))
  - SUMIFS(Waste!$C:$C, Waste!$B:$B, item, Waste!$A:$A, "<="&cutoff)))
```

  Same trusted `AvailableAsOf` math, with one deliberate change: the
  deliveries criteria range is `Deliveries!$M` (Available from), not `$J`
  (Delivery Date). Same source columns as before (`Deliveries!G` =
  ServingsProjected, `Distributions!C` = QtyOut, `Waste!C` = QtyWaste), so
  the two views agree except for late-arrival timing.

**Setup lessons recorded** (these caused an all-zeros incident during
build): header cells must be *real dates* (use `=DATE(2026,10,12)` — text
dates make the `"<="&cutoff` criteria silently match nothing), and each
column's formula must reference its own column header (`I$1` in column I,
not a neighbouring header). Quick checks: `=ISNUMBER(I1)` → TRUE;
`=COUNTIFS(Deliveries!$J:$J,"<="&I1)` → dozens.

Blank-Item rows below the item list publish as zero-padding; runs skip
rows with an empty Item.

## Deliveries — Available-from columns

| Column | Kind | Header | Behaviour |
|---|---|---|---|
| L | manual | `Available from (override)` | Blank = available the **next** day (default: arrived after distribution). Type a date only when it is *not* next day — Millennium same-day (type the delivery date), or any unusual arrival. |
| M | formula | `Available from` | `=IF(L2="",J2+1,L2)` |

- Both sit after column K, outside the extract-CSV paste zone (A/B/C/J/K),
  so `extract-delivery` and `tfss-extraction-formatting` are unchanged.
- Fill L at receipt, or at order entry when the arrival pattern is already
  known (e.g., a TFSS order expected ~noon → set L to the next day up
  front, so even pre-arrival windows are honest).

## Run flow

1. **Fetch** the published CSV (one URL); skip blank-Item rows.
2. **Validate the window:** read the five header dates; check five
   distinct, increasing, real school days per the TDSB calendar. Flag
   holiday/weekend cutoffs and non-consecutive distribution days; ask,
   never silently correct. (The first live window, 2026-10-12…16, includes
   Thanksgiving Monday 2026-10-12 — exactly the case this rule catches.)
3. **Chain the window:** projected availability entering day *n* = window
   column *n* − planned consumption for earlier window days (future
   distributions are not yet logged, so the sheet cannot subtract them).
   Mid-window runs read already-served days from the Distributions log; if
   logging lag is suspected, ask (same declare-don't-assume rule as
   disposals).
4. **Freshness rule (new):** perishables go on the earliest window day at
   or after their Available-from date. Flag any perishable sitting two or
   more days past availability, with the day count.
5. **Unchanged:** slot model (540 + 180, one item per slot), delta-fill,
   stranded-remainder write-off with waste flags, K grape-tomato
   exclusion, raisins-on-cheese-days, spoon-items-together, safety-stock
   floor, stock-first, cost per child per day.
6. **Per-day gaps:** a gap is a shortfall on a specific window day
   (`DN short 540`). Suppress an order suggestion when a later window
   column shows a pending delivery already covering that day (the
   within-window double-order guard).
7. **Lead times unchanged:** Millennium order-by ≥ 1 week before the
   target Wednesday (hard by default; waiver is coordinator discretion,
   case by case), HS banner delivery date must precede the serving day,
   Costco stays a manual alternative.
8. **Output:** same six parts, week → window — window-slot menu table,
   per-day gap analysis, Millennium/HS drafts, flags, cost summary, and
   the paste-ready distribution schedule (highlighted TO ORDER rows plus
   stock-only TSV; item text mirrors the Deliveries row
   character-for-character). The five schedule dates are the header dates.
9. **Flags:** invalid/holiday header dates; logging lag on past window
   days; freshness postponements with day counts; same-day overrides
   inside the window (eyeball confirmation); an override earlier than its
   delivery date (typo); waste stranded by window-boundary slot
   arithmetic, with quantities.

## Repo artifact changes

| File | Change |
|---|---|
| `knowledge/prompts/generate-menu.md` | Input/Supply: window columns + chaining; serving-week → Distribution window; freshness rule; per-day gaps + within-window guard; Available-from semantics; header-date validation; updated validation checklist. Boundaries, cost, safety stock, vendor rules kept. |
| `.agents/skills/menu/SKILL.md` | Pointer text: window columns, five cutoffs set before runs, Available-from override is coordinator-declared |
| `AGENTS.md` | Menu-runs paragraph: window columns and next-day availability default |
| `CONTEXT.md` | New terms: **Distribution window**, **Available from** |
| `knowledge/log.md` | Dated entry; run `knowledge/validate.sh` green |
| `extract-delivery.md`, `tfss-extraction-formatting.md` | **No changes** |

## Out of scope

Slot-model internals, vendor ordering rules, cost math, safety-stock
policy, the three boundaries (no email parsing, no calendar publication,
allergen-blind), and the coordinator-only inputs (coverage, perishability
windows, disposals) — all unchanged.

## Sources

- Coordinator session 2026-10-07 (window semantics, user-dictated runs,
  hand-typed cutoffs, next-day default, override column)
- Pantry spreadsheet, live (structure verified 2026-10-07 via the
  published CSV)
- `knowledge/research/pantry-spreadsheet-analysis.md` (formula provenance,
  paste-zone layout)
