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
