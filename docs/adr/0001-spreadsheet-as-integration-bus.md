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
- **Live Healthy Selections pricing** — accepted as the menu builder's one
  non-sheet input, needed for order suggestions and cost per child per day;
  prices are never stored in the knowledge bundle.

## Consequences

- The sheet's schema becomes a contract: exact item-name strings key the
  aggregation formulas, Category and Vendor are part of the interface, and
  future-dated rows must be added when orders are *placed*, not when food
  arrives — that is the double-ordering guard.
- The menu builder's planning window is bounded by how promptly extraction
  populates future-dated rows.
- Future services (WhatsApp digest, calendar publisher) integrate via the
  sheet and the calendar, not via each other.
