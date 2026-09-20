---
type: Automation Backlog
title: Remaining Automation Opportunities
description: Manual SNP workflows identified as candidates for automation beyond delivery extraction and WhatsApp digests.
tags: [snp, automation, backlog]
status: stable
generated: { by: opencode/glm-5.3-flash, at: 2026-09-20T00:00:00Z }
stale_after: 2027-03-20T00:00:00Z
sources:
  - id: zk-note
    resource: ../rawlinsonsnp-zk-source.md
    title: ZK research note 20260915000000_research_student_nutrition_program
---

# Remaining Automation Opportunities

Beyond [Delivery Extraction](./delivery-extraction.md) and [WhatsApp Digest Automation](./whatsapp-digest-automation.md):

## Teacher Form Triage & Classroom Packing Lists

- *Pain Point*: Manually reading [teacher Google Form submissions](../communication/teacher-reporting-form.md) for field trip holds, quantity adjustments, and allergy changes every morning.
- *Opportunity*: Webhook integration on teacher Google Form submissions to automatically recalculate classroom packing targets, flag dietary changes, and notify the morning volunteer team via WhatsApp or email.

## Allergy & Dietary Substitution Label Generation

- *Pain Point*: Hand-writing or manually managing daily substitution bag labels for students with allergies.
- *Opportunity*: Automated label printing / PDF generation based on classroom master allergen lists cross-referenced against the day's scheduled menu.

## Menu Calendar Synchronization & Inventory Alerting

- *Pain Point*: Disconnect between pantry stock, perishability dates, and menu calendar updates.
- *Opportunity*: Automated inventory threshold alerts when stock is low or near expiration, automatically proposing menu adjustments and updating the embedded Google Calendar.
