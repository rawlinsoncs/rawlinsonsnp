#!/usr/bin/env bash
# Live smoke test (not CI): hits the running service on the machine.
# Run after deploys: ./smoke.sh
#
# Exits non-zero if the service is unhealthy, /catalog fails, or the answer
# is missing prices -- the three ways this adapter can be wrong.
# Needs only curl and jq; the service itself is Node, but the check is not.
set -euo pipefail

base="${HS_PRICES_URL:-http://127.0.0.1:${HS_PRICES_PORT:-8787}}"

echo "health: $base/health"
health="$(curl -fsS --max-time 10 "$base/health")"
status="$(jq -r '.status' <<<"$health")"
if [[ "$status" != "ok" ]]; then
  echo "service is not ok: $status" >&2
  echo "$health" >&2
  exit 1
fi
jq -r '"  status=\(.status) lastSuccessAt=\(.lastSuccessAt // "none yet")"' <<<"$health"

echo "catalog: $base/catalog"
catalog="$(curl -fsS --max-time 10 "$base/catalog")"

items="$(jq '.items | length' <<<"$catalog")"
priced="$(jq '[.items[] | select(.priceCad != null)] | length' <<<"$catalog")"
jq -r '"  source=\(.source) fetchedAt=\(.fetchedAt) items=\(.items | length) priced=\([.items[] | select(.priceCad != null)] | length)"' <<<"$catalog"

if [[ "$items" -eq 0 ]]; then
  echo "empty catalog" >&2
  exit 1
fi
if [[ "$priced" -eq 0 ]]; then
  echo "no prices in the catalog -- a closed gate would look exactly like this" >&2
  exit 1
fi
jq -r '.items[:3][] | "  - \(.title) | \(.variantTitle) | $\(.priceCad) CAD"' <<<"$catalog"

echo "smoke: OK"