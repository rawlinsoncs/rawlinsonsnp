---
name: menu
description: "Use when the user asks to build, draft, or suggest the Rawlinson SNP snack menu for a school week, asks for next week's order, mentions a menu run, or supplies a pantry spreadsheet export for menu planning."
---

# Menu

The menu run's process lives in [`knowledge/prompts/generate-menu.md`](../../../knowledge/prompts/generate-menu.md) — read it fully before doing anything. It is the single source of truth for the slot model, the pairing and exclusion rules, gap-fill dispositions, and the output formats.

Two inputs only the coordinator can supply; get them before computing:

1. The pantry publish-to-web **CSV URL** (the `pubhtml` form renders empty).
2. Answers on **coverage**, **perishability windows**, and **disposals** — ask; these are never assumed.

Placed orders return to the sheet as future-dated delivery rows, so the next run reads them as pending supply.
