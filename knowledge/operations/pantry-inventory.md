---
type: Process
title: Pantry and Inventory Tracking
description: Two-floor storage system with vendor deliveries tracked into a central Google Sheets pantry log; Donors supply on their own initiative and Suppliers are ordered to fill menu gaps.
tags: [snp, pantry, inventory, vendors]
status: stable
generated: { by: opencode/kimi-k3, at: 2026-09-25T16:50:02Z }
stale_after: 2027-03-20T00:00:00Z
sources:
  - id: family-guide
    resource: https://rawlinsoncs.github.io/rawlinsonsnp/docs/community/
    title: Rawlinson SNP Family Guide
  - id: coordinator-session
    resource: scope: coordinator design session 2026-09-20/21
    title: Coordinator clarifications — vendor roles, delivery schedules, supply lag
    author: human:aaron
  - id: coordinator-2026-09-25
    resource: scope: coordinator clarification 2026-09-25
    title: Grape tomato delivery timing; ask-don't-assume on unknown perishability
    author: human:aaron
---

# Pantry and Inventory Tracking

## Physical Storage

- **2nd Floor Pantry**: Primary storage room for dry goods, whole grains, cereal products, WOW butter, breadsticks, and surplus packaging.[^family-guide]
- **Main Floor Refrigerators**: Located in the school lunchroom; houses perishable dairy products (yogurt tubes/cups, cheese strings) and fresh fruits requiring refrigeration.

## Donors and Suppliers

Vendors split into two roles (see the domain glossary in `CONTEXT.md`). **Donors** supply food on their own initiative — the program does not choose the contents. **Suppliers** are vendors the program orders chosen items from, mostly to fill menu gaps.

### Donors

| Donor | Schedule | Notes |
|-------|----------|-------|
| TFSS (Bridging the Nutrition Gap) | Generally Wednesdays; dates drift with school holidays and other factors | Contents chosen by TFSS — all components (fruit, vegetables, dairy, grain) arrive this way; notice emails carry a multi-week forward schedule labeled by Week Cycle |

### Suppliers

| Supplier | Lead time | Notes |
|----------|-----------|-------|
| Healthy Selections | Preferred order ~10–15 days before delivery; quicker turns possible | Ordered items with custom portion sizing; confirmations arrive in the program inbox. The catalog is **login-gated** — prices are served by a Docker price service that maintains the program login; the next-delivery-date banner at https://healthyselections.ca/ is public |
| Millennium Bakery | Order ≥ 1 week before the Wednesday delivery | **Grains only**; baked the morning of delivery — same-day unrefrigerated, up to a week refrigerated. Menu and prices are public at https://www.millenniumbakehouse.com/menu — cross-referenced when drafting gap-fill orders |
| Costco Business Delivery | Scheduled, confirmed via email | Direct online purchases; confirmations contain item numbers, pack sizes, delivery dates |

## Supply lag

Deliveries landing in week N mostly serve the **following** week's menu: a TFSS delivery on Wednesday of week N is distributed during week N+1, and most delivered food is used by the end of that following week. Millennium is the exception — its Wednesday baked goods serve the same day. Shelf-stable items are kept in the pantry as **Safety stock**: a deliberate buffer against spoilage and supply failures, not surplus to burn down.

## Safety stock reserve

The Safety stock is a quantified standing reserve: **two school days' worth of granola bars** (shelf-stable grain) and **two school days' worth of raisins or another shelf-stable fruit item such as apple squeeze packs** — ≈ 1,440 servings each at ~720 students. Its purpose is day-of cover: when a perishable item on the day's Menu is found spoiled or unusable that morning, the Distribution Volunteer replaces that component from the reserve (see [Volunteer Workflows](./volunteer-workflows.md)).

Reserve items must be shelf-stable — Millennium baked goods and fresh produce do not count toward it. The menu builder treats the reserve floor as unavailable when planning (see [Generate Menu](../prompts/generate-menu.md)); dipping below the floor triggers replenishment in the next gap-fill order.

## Per-item delivery notes

- **Grape tomatoes** — delivered the Wednesday prior to their distribution week, so they always land within their perishability window for the serving week they are planned for.[^coordinator-2026-09-25]

The AvailableAsOf view carries no dates, so an item's perishability window often can't be verified from the sheet alone. When that happens, the menu builder asks the coordinator rather than assuming (see [Generate Menu](../prompts/generate-menu.md)); confirmed per-item facts are recorded here.

## Order Tracking

Vendor confirmation emails (Costco order confirmations, TFSS delivery notices, Healthy Selections order receipts) serve as primary input sources. Order line items are extracted into structured CSV data for import into the "Deliveries" sheet of a central pantry tracking spreadsheet — see [Delivery Extraction](../automation/delivery-extraction.md). Placed orders are added as **future-dated rows** before the food arrives, so the sheet doubles as the record of pending orders.

The [Generate Menu](../prompts/generate-menu.md) prompt consumes the sheet (past and future-dated rows) to draft the weekly menu, identify incomplete days against the TDSB SNP requirements, and suggest gap-fill orders.

[^family-guide]: Rawlinson SNP Family Guide
[^coordinator-2026-09-25]: Coordinator clarification, 2026-09-25
