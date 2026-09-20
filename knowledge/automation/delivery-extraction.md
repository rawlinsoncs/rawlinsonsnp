---
type: Process
title: Vendor Delivery Extraction
description: Extracting order line items from vendor confirmation emails into the pantry tracking spreadsheet.
tags: [snp, automation, llm, inventory]
status: stable
generated: { by: opencode/glm-5.3-flash, at: 2026-09-20T00:00:00Z }
stale_after: 2027-03-20T00:00:00Z
sources:
  - id: zk-note
    resource: ../rawlinsonsnp-zk-source.md
    title: ZK research note 20260915000000_research_student_nutrition_program
---

# Vendor Delivery Extraction

Vendor confirmation emails (Costco order confirmations, TFSS delivery notices, Healthy Selections order receipts) are the primary input sources for inventory tracking (see [Pantry and Inventory](../operations/pantry-inventory.md)).

## Current Pain Point

Manual entry of line items, pack sizes, quantities, and delivery dates from order emails into spreadsheet inventory.

## Automation Opportunity

Automated email parser / LLM data extraction pipeline that converts incoming Costco, TFSS, and Healthy Selections order confirmation emails into CSV rows and syncs directly into the Google Sheets pantry log.

The active prompts live at [Extract Delivery](../prompts/extract-delivery.md) (email-to-CSV) and [TFSS Data Extraction and Formatting](../prompts/tfss-extraction-formatting.md) (ICS + tab-delimited).

Source ZK note: `20260513215315_snp_delivery_extraction`.
