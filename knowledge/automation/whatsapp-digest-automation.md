---
type: Process
title: WhatsApp Digest Automation
description: Self-hosted WhatsApp bot posting daily volunteer schedules and tagging via Baileys Web API.
tags: [snp, automation, whatsapp]
status: stable
generated: { by: opencode/glm-5.3-flash, at: 2026-09-20T00:00:00Z }
stale_after: 2027-03-20T00:00:00Z
sources:
  - id: zk-note
    resource: ../rawlinsonsnp-zk-source.md
    title: ZK research note 20260915000000_research_student_nutrition_program
---

# WhatsApp Digest Automation

Coordinators currently draft daily schedule posts and tag volunteers in the [WhatsApp group](../communication/whatsapp-coordination.md) every evening/morning.

## Automation Opportunity

Self-hosted WhatsApp bot (via Baileys Web API container `aaronromeo/announcements`) exposed via REST API, automatically posting daily schedules and tagging scheduled volunteers (`@phone_number`).

Message drafts follow the [WhatsApp Message Style Guide](../prompts/whatsapp-style-guide.md).

Source ZK note: `20260817224408_automating_whatsapp_posts`.
