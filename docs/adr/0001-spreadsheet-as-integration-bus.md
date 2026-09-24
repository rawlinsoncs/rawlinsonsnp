# The pantry spreadsheet is the integration bus

Status: accepted (2026-09-21)

The program's automations are converging on a suite of small services. Rather
than integrating them with each other directly, the **Deliveries sheet of the
central Google Sheets pantry log is the single integration bus**: extraction
services write rows into it (future-dated rows are the record of pending
orders), the [menu builder](../../knowledge/prompts/generate-menu.md) reads
it and emits a draft Menu, gap analysis, and suggested gap-fill orders, and
calendar publication is a separate future tool. Today these "services" are
agent prompt docs in `knowledge/prompts/` — the executable specs — and real
microservices can replace them one at a time without moving the seams.

## Considered options

- **Menu builder parses vendor emails directly** — rejected: it couples menu
  logic to three email formats, duplicates the extraction service's job, and
  the sheet is already the ledger of record.
- **Menu builder emits ICS events to the Snack Program Calendar** — deferred
  to a separate publisher tool: the calendar is public-facing, its revision
  semantics (stable UIDs, update-not-duplicate) are a concern of their own,
  and one service per transformation keeps the seams clean.
- **Spreadsheet formulas compute the menu** — rejected: menu planning needs
  judgment (perishability, variety, gap-fill sourcing) that formulas cannot
  express and should not silently decide.
- **Healthy Selections pricing via a price service** — a Docker web service
  on the program machine (alongside the WhatsApp bot) maintains the vendor
  login and serves current catalog prices on demand; the menu builder
  queries it at run time. Rejected: anonymously fetching the live catalog
  (the shop is login-gated) and a stored price list (goes stale — only
  historic prices belong in the knowledge bundle).

## Consequences

- The sheet's schema becomes a contract: exact item-name strings key the
  aggregation formulas, Category and Vendor are part of the interface, and
  future-dated rows must be added when orders are *placed*, not when food
  arrives — that is the double-ordering guard.
- The menu builder's planning window is bounded by how promptly extraction
  populates future-dated rows.
- Future services (WhatsApp digest, calendar publisher) integrate via the
  sheet and the calendar, not via each other.
- Reference data (vendor catalog prices) flows from small adapter services,
  not through the sheet: the bus carries state (orders, inventory), adapters
  carry reference data. Future vendors plug in as additional adapters.
- No spreadsheet schema additions: the stock AvailableAsOf view is the
  availability API. Deliberate limitations — no per-batch dates, no netting
  of the current week's unrecorded distributions — are absorbed by the
  coordinator's review and the prompt's flags rather than by new sheets (a
  Menu/MenuInput schema was considered and rejected after a live trial).
