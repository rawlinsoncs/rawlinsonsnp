---
type: Guide
title: Maintaining the SNP Knowledge Bundle
description: How to edit, extend, and keep this OKF knowledge bundle current.
tags: [snp, okf, maintenance]
status: stable
generated: { by: opencode/glm-5.3-flash, at: 2026-09-20T00:00:00Z }
---

# Maintaining the SNP Knowledge Bundle

This bundle follows the [Open Knowledge Format (OKF) v0.2](https://github.com/GoogleCloudPlatform/open-knowledge-format): a directory of markdown files where each file is one concept, described by YAML frontmatter. Agents and humans can both read it with no tooling beyond `cat`.

## Structure

- `program/` — what the SNP is (mission, standards, governance, policy)
- `operations/` — how it runs day to day (workflows, pantry)
- `communication/` — channels (WhatsApp, teacher form, docs site)
- `automation/` — what's being automated (backlog + descriptions)
- `prompts/` — the actual agent prompts used in automation
- `index.md` (per directory) — listing for browsing; no frontmatter
- `log.md` — change history, newest first

## Rules (conformance)

1. Every non-reserved `.md` file needs YAML frontmatter with a non-empty `type`.
2. `index.md` and `log.md` are reserved filenames with defined structures — don't put concept content in them.
3. Never delete frontmatter fields you don't recognize — extension is allowed.

## Keeping it up to date

When knowledge changes:

1. Edit the concept file. Update `generated: { by: ..., at: ... }` to record who changed it and when.
2. If a human confirmed the content, add or update `verified: { by: human:<id>, at: ... }`. Only mark human verification if a human actually reviewed it.
3. Set `stale_after` to a horizon where the content should be re-checked (default ~6 months). `validate.sh` flags content whose `stale_after` has passed.
4. Add a dated entry to `log.md` (newest first, `## YYYY-MM-DD` heading).
5. Run the validator:

   ```bash
   bash knowledge/validate.sh knowledge
   ```

   Zero FAIL lines = conformant. Warnings (W1–W7) are advisory.

## Importing new documents

To bring in a new prompt, policy, or doc:

1. Add frontmatter — `type` (required), `title`, `description`, `tags`, and a `sources` entry pointing at the original file/URL for provenance.
2. Keep the body verbatim (don't summarize away detail).
3. Cross-link from related concepts (e.g., an automation concept should link to its prompt in `prompts/`).
4. List it in the directory's `index.md`.
5. Log the import in `log.md` and validate.

## Verification workflow (periodic)

1. Run the validator; fix anything with a stale `stale_after` (W7).
2. Check `sources[].last_modified` where recorded; re-check content against changed upstream sources.
3. Mark verified concepts with `verified: { by: human:<id>, at: ... }` as they're reviewed.
