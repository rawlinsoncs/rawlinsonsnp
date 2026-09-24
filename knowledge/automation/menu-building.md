---
type: Process
title: Menu Building
description: Weekly drafting of the snack Menu from the published pantry availability view, with gap analysis and suggested gap-fill orders.
tags: [snp, automation, menu, pantry]
status: stable
generated: { by: opencode/glm-5.3, at: 2026-09-21T14:00:00Z }
stale_after: 2027-03-21T00:00:00Z
sources:
  - id: context-glossary
    resource: ../../CONTEXT.md
    title: Rawlinson SNP domain glossary (CONTEXT.md)
  - id: adr-0001
    resource: ../../docs/adr/0001-spreadsheet-as-integration-bus.md
    title: ADR 0001 — The pantry spreadsheet is the integration bus
  - id: coordinator-session
    resource: scope: coordinator design session 2026-09-20/21
    title: Coordinator design session and live trial, 2026-09-20/21
    author: human:aaron
---

# Menu Building

The menu builder drafts the weekly [Menu](../../CONTEXT.md) — which items make
up each school day's Snack — from what the program already has and what is
confirmed to arrive. The runnable prompt is
[Generate Menu](../prompts/generate-menu.md); a live trial ran on 2026-09-21
against the published AvailableAsOf view.

## Weekly loop

1. Fetch the published **AvailableAsOf** CSV (coordinator sets the cutoff to
   the Monday of the serving week being planned), the HS price service, the
   public Millennium menu, and the TDSB school calendar.
2. Draft one serving week: per-day component pairs at ≥ ~720 pooled servings,
   perishability-aware assignment, safety stock held.
3. Produce the gap analysis and suggested gap-fill orders — grains held for
   Millennium, fruit/vegetables from Healthy Selections with prices and cost
   per child per day.
4. The coordinator approves and places orders; placed orders return to the
   pantry sheet as future-dated rows, so the next run sees them as pending
   supply.

## Boundaries

Per ADR 0001, the menu builder is one service in a suite connected by the
pantry spreadsheet. It does **not** parse vendor emails (that is
[Delivery Extraction](./delivery-extraction.md)) and does **not** publish to
the Snack Program Calendar (a future calendar-publisher tool). It is
allergen-blind: substitutions are made day-of by the allergy system.

If the HS price service is unreachable, the builder runs degraded — gap list
without prices, flagged — rather than blocking. See
[Pantry and Inventory](../operations/pantry-inventory.md) for vendor roles
and the supply-lag model this planning depends on.
