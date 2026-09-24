# Spec: HS price service setup wizard

Status: ready-for-agent

## Problem Statement

The coordinator wants the menu builder (and the future HS price service) to
run with minimal friction, mostly from a phone, on a headless program machine
that already runs Docker services. Two machine-side prerequisites require
human action:

1. The pantry spreadsheet's availability data must be reachable without a
   manual export. This is already solved — the AvailableAsOf sheet is
   published to the web (validated in the live trial run) — but the
   published URL currently lives only in a chat conversation; tooling needs
   it in a durable, conventional location.
2. The Healthy Selections catalog is login-gated (confirmed: anonymous fetch
   of `/collections/all` returns nothing). Before any price fetching — the
   spike, then the price service — a persistent authenticated browser
   profile must be established on the machine. Logging in is a human-only
   step (the coordinator's credentials), the machine has no display, and the
   Shopify session will expire periodically, so the procedure will recur and
   should not need re-explaining to an agent each time.

## Solution

A committed, rerunnable bash wizard at `services/hs-prices/setup.sh`, built
from the vendored wizard template, with three stages:

1. **Capture the sheet URL.** The coordinator pastes the already-published
   AvailableAsOf CSV URL (or publishes it on the spot, guided); the wizard
   verifies the URL returns CSV with an Item column and writes it to `.env`.
2. **One-time HS login.** The wizard starts a containerized Chromium with a
   browser-accessible web UI and a persistent profile volume, opens the page
   for the coordinator (works from a phone), and gates on confirmation that
   they have logged into healthyselections.ca.
3. **Verify.** The wizard fetches the HS catalog's product JSON through the
   authenticated profile via CDP and confirms the response carries prices,
   printing a sample item and price as proof, then stops the container. The
   only residue is the profile volume on disk.

Re-running the wizard is the session-expiry re-login path.

## User Stories

1. As the coordinator, I want to log into Healthy Selections once from my
   phone, so the price service can fetch catalog prices without me.
2. As the coordinator, I want the login page served as a web UI, so I can
   complete it on a phone without a desktop.
3. As the coordinator, I want my login to persist across container restarts,
   so I am not asked to log in weekly.
4. As the coordinator, I want a one-command re-login path when the session
   expires, so an outage is a two-minute fix.
5. As the coordinator, I want to see proof the login worked — a real item
   and price printed — before the wizard exits, so I trust the setup.
6. As the coordinator, I want no credentials written to the repo, so git
   history stays clean.
7. As the coordinator, I want the already-published sheet URL captured into
   config, so later runs never re-ask for it.
8. As the coordinator, I want a bad sheet URL to fail loudly at setup time,
   so a paste error doesn't surface mid-run weeks later.
9. As the coordinator, I want stage-of-N progress shown, so I always know
   where I am in the setup.
10. As the coordinator, I want each stage to show only its own step, so
    nothing I need has scrolled off my phone screen.
11. As the coordinator, I want to be able to abort and resume safely, so an
    interrupted setup leaves nothing half-configured.
12. As the coordinator, I want the container stopped when the wizard exits,
    so nothing lingers listening on the machine.
13. As the coordinator, I want the login web UI on a predictable local port,
    so I can bookmark it for re-logins.
14. As the agent running the menu builder, I want a machine-checkable signal
    that the HS login is valid, so degraded mode triggers on evidence
    instead of silent wrong output.
15. As the agent running the spike, I want a known profile path and CDP
    endpoint in `.env`, so I can fetch the catalog without further setup.
16. As the future price service, I want the profile volume at a stable,
    documented path I can mount, so the wizard and the service share one
    login.
17. As a future maintainer, I want the wizard committed beside the service
    it provisions, so the next person or agent finds it where it is needed.
18. As the coordinator, I want `.env` excluded from git, so publish tokens
    and endpoints don't enter history.
19. As the agent re-running the wizard, I want idempotent `.env` upserts, so
    re-runs never duplicate keys.
20. As the coordinator, I want the setup to install nothing on the host
    beyond Docker containers, so the machine stays clean.

## Implementation Decisions

- The wizard is authored from the vendored wizard template
  (`.agents/skills/wizard/template.sh`): the library above the `STAGES`
  marker is used untouched; each stage clears the screen and gates on
  confirmation.
- Docker-only, matching the machine's existing convention (the
  `announcements` WhatsApp container precedent); node is not installed on
  the host and nothing in this wizard needs it.
- Stage 2's browser is a Chromium container with a web-accessible UI
  (noVNC/KasmVNC-style image, e.g. linuxserver/chromium), a persistent
  profile volume at `services/hs-prices/profile`, and the CDP port exposed
  on localhost. The volume is the price service's future mount point.
- No credentials are captured by the script. The human types them only into
  the browser; what persists is the session state inside the profile volume.
- `.env` at the repo root receives: `PANTRY_AVAILABLEASOF_CSV_URL`,
  `CHROME_CDP_URL`, `CHROME_WEB_URL`, `HS_PROFILE_DIR`. `.env` is added to
  `.gitignore` (a new line; the repo's protected entries `node_modules/` and
  `resources/_gen/` are untouched).
- Stage 1 verifies the pasted URL actually returns CSV containing an `Item`
  column before persisting it. If no URL exists yet, the stage walks the
  publish flow (Google Sheets → File → Share → Publish to web → AvailableAsOf
  → CSV) and then captures.
- Stage 3's verification fetch (Shopify product JSON via the authenticated
  profile over CDP) doubles as the first step of the price-service spike —
  one command, two purposes.
- Per ADR 0001: this wizard provisions an adapter service's credential;
  state stays on the sheet (the bus), and this wizard touches neither.

## Testing Decisions

- A good test here checks observable outcomes, not script internals. There
  is exactly one seam, at the highest point: **the stage-3 verification
  fetch**. It exercises the wizard's entire product — profile logged in,
  reachable via CDP, catalog readable, prices present — in one command, and
  it is the same command the price service will issue.
- Secondary checks: after stage 1, `.env` contains
  `PANTRY_AVAILABLEASOF_CSV_URL` and the URL returns CSV with an `Item`
  column; `.env` upserts are idempotent across re-runs.
- Static checks per the wizard skill: `bash -n` and `shellcheck`.
- Prior art: none — this repo has no test suite; the AGENTS.md verification
  bar (clean hugo build, zero validate.sh FAIL lines) is unaffected because
  the script lives outside `content/` and `knowledge/`.

## Out of Scope

- Creating a `MenuInput` view or `Menu` sheet — considered and rejected
  after the live trial (recorded as an ADR 0001 consequence); the stock
  AvailableAsOf view suffices.
- The price service itself (HTTP API, caching, login-expiry detection) — a
  separate build; this wizard only provisions its credential.
- The spike's analysis (what the catalog JSON actually contains) — stage 3
  verifies access; interpretation follows.
- Calendar publisher, WhatsApp digest integration, Millennium ordering
  automation.
- CI / GitHub secrets — the service runs machine-local; nothing in CI needs
  these values.

## Further Notes

- Shopify customer-session expiry is empirical (~weeks); the wizard is the
  recurring re-login procedure, which is why it is committed rather than
  ephemeral.
- Stage 2's web UI is what keeps the flow phone-first — the coordinator's
  stated constraint.
- If the workbook is ever recreated (year-end archive), stage 1 is where the
  new publish URL gets captured.
- Publishing note: this spec landed on the local tracker because `gh` auth
  on this machine holds an invalid token (HTTP 401). Run `gh auth login`
  and it can be mirrored to GitHub Issues with the `ready-for-agent` label.
