---
type: Process
title: Pantry and Inventory Tracking
description: Two-floor storage system with vendor deliveries tracked into a central Google Sheets pantry log.
tags: [snp, pantry, inventory, vendors]
status: stable
generated: { by: opencode/glm-5.3-flash, at: 2026-09-20T00:00:00Z }
stale_after: 2027-03-20T00:00:00Z
sources:
  - id: family-guide
    resource: https://rawlinsoncs.github.io/rawlinsonsnp/docs/community/
    title: Rawlinson SNP Family Guide
---

# Pantry and Inventory Tracking

## Physical Storage

- **2nd Floor Pantry**: Primary storage room for dry goods, whole grains, cereal products, WOW butter, breadsticks, and surplus packaging.[^family-guide]
- **Main Floor Refrigerators**: Located in the school lunchroom; houses perishable dairy products (yogurt tubes/cups, cheese strings) and fresh fruits requiring refrigeration.

## Vendor Sources and Delivery Schedules

[^family-guide]

| Vendor | Schedule | Notes |
|--------|----------|-------|
| TFSS | Wednesdays, 11:00 AM – 1:00 PM | Subsidized/donated perishables and staples; unpredictable timing within window |
| Healthy Selections | Dates set by SNP coordinator, agreed window | Ordered items with custom portion sizing; email order confirmations |
| Millennium Bakery | Wednesday mornings | Fresh baked goods; reliable |
| Costco Business Delivery | Scheduled, confirmed via email | Direct online purchases; confirmations contain item numbers, pack sizes, delivery dates |

## Order Tracking

Vendor confirmation emails (Costco order confirmations, TFSS delivery notices, Healthy Selections order receipts) serve as primary input sources. Order line items are extracted into structured CSV data for import into the "Deliveries" sheet of a central pantry tracking spreadsheet — see [Delivery Extraction](../automation/delivery-extraction.md).

[^family-guide]: Rawlinson SNP Family Guide
