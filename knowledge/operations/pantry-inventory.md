---
type: Process
title: Pantry and Inventory Tracking
description: Two-floor storage system with vendor deliveries tracked into a central Google Sheets pantry log; Donors supply on their own initiative and Suppliers are ordered to fill menu gaps.
tags: [snp, pantry, inventory, vendors]
status: stable
generated: { by: opencode/glm-5.3, at: 2026-09-21T00:00:00Z }
stale_after: 2027-03-20T00:00:00Z
sources:
  - id: family-guide
    resource: https://rawlinsoncs.github.io/rawlinsonsnp/docs/community/
    title: Rawlinson SNP Family Guide
  - id: coordinator-session
    resource: scope: coordinator design session 2026-09-20/21
    title: Coordinator clarifications — vendor roles, delivery schedules, supply lag
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
| Healthy Selections | Preferred order ~10–15 days before delivery; quicker turns possible — next delivery date shown at https://healthyselections.ca/ | Ordered items with custom portion sizing; confirmations arrive in the program inbox |
| Millennium Bakery | Order ≥ 1 week before the Wednesday delivery | **Grains only**; baked the morning of delivery — same-day unrefrigerated, up to a week refrigerated |
| Costco Business Delivery | Scheduled, confirmed via email | Direct online purchases; confirmations contain item numbers, pack sizes, delivery dates |

## Supply lag

Deliveries landing in week N mostly serve the **following** week's menu: a TFSS delivery on Wednesday of week N is distributed during week N+1, and most delivered food is used by the end of that following week. Millennium is the exception — its Wednesday baked goods serve the same day. Shelf-stable items are kept in the pantry as **Safety stock**: a deliberate buffer against spoilage and supply failures, not surplus to burn down.

## Order Tracking

Vendor confirmation emails (Costco order confirmations, TFSS delivery notices, Healthy Selections order receipts) serve as primary input sources. Order line items are extracted into structured CSV data for import into the "Deliveries" sheet of a central pantry tracking spreadsheet — see [Delivery Extraction](../automation/delivery-extraction.md). Placed orders are added as **future-dated rows** before the food arrives, so the sheet doubles as the record of pending orders.

The [Generate Menu](../prompts/generate-menu.md) prompt consumes the sheet (past and future-dated rows) to draft the weekly menu, identify incomplete days against the TDSB SNP requirements, and suggest gap-fill orders.

[^family-guide]: Rawlinson SNP Family Guide
