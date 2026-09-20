#!/usr/bin/env bash
# OKF v0.2 conformance check (core rules + warnings)
set -u
bundle="${1:-knowledge}"
pass=0; fail=0
for f in $(find "$bundle" -name '*.md'); do
  base=$(basename "$f")
  if [ "$base" = "index.md" ] || [ "$base" = "log.md" ]; then continue; fi
  # E1: frontmatter present
  if [ "$(head -c 3 "$f")" != "---" ]; then
    echo "E1: $f has no YAML frontmatter"; fail=$((fail+1)); continue
  fi
  # E2: type field present and non-empty
  fm=$(awk '/^---$/{c++; next} c==1' "$f")
  if ! echo "$fm" | grep -Eq '^type: .+'; then
    echo "E2: $f has frontmatter but no non-empty 'type' field"; fail=$((fail+1)); continue
  fi
  # E4: Attested Computation requires runtime
  if echo "$fm" | grep -q '^type: Attested Computation' && ! echo "$fm" | grep -q '^runtime:'; then
    echo "E4: $f is Attested Computation missing 'runtime'"; fail=$((fail+1)); continue
  fi
  # W1/W3: recommended fields
  echo "$fm" | grep -q '^title:' || echo "W1: $f missing 'title' (recommended)"
  echo "$fm" | grep -q '^description:' || echo "W1: $f missing 'description' (recommended)"
  echo "$fm" | grep -q '^generated:' || echo "W3: $f missing 'generated' (v0.2 recommended)"
  # W7: stale check
  stale=$(echo "$fm" | awk '/^stale_after:/ {print $2}')
  if [ -n "$stale" ] && [ "$stale" \< "$(date -u +%Y-%m-%dT%H:%M:%SZ)" ]; then
    echo "W7: $f stale_after=$stale has passed"
  fi
  pass=$((pass+1))
done
# E3: reserved file structure
if [ -f "$bundle/log.md" ]; then
  if grep -q '^# Update Log' "$bundle/log.md" || grep -q '^# Log' "$bundle/log.md"; then :; else
    echo "E3: $bundle/log.md unexpected structure"; fail=$((fail+1))
  fi
fi
echo "---"
echo "PASS: $pass concept files valid | FAIL: $fail"
exit $fail
