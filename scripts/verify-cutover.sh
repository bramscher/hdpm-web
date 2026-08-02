#!/usr/bin/env bash
# Pre-cutover verification for the P0 fixes in docs/hdpm-web-fix-brief.md.
# Usage: ./scripts/verify-cutover.sh [BASE_URL]
#   BASE_URL defaults to the staging deployment; re-run against
#   https://www.highdesertpm.com after DNS cutover.
set -u

BASE="${1:-https://hdpm-web.vercel.app}"
FAIL=0

check() { # check <desc> <expected> <actual>
  local desc="$1" expected="$2" actual="$3"
  if [[ "$actual" == "$expected" ]]; then
    printf '  ✅ %-55s %s\n' "$desc" "$actual"
  else
    printf '  ❌ %-55s got: %s  want: %s\n' "$desc" "$actual" "$expected"
    FAIL=1
  fi
}

status_and_location() { # <path> -> "<code> <location-path>"
  local out
  out=$(curl -s -o /dev/null --max-time 20 -w '%{http_code} %{redirect_url}' "$BASE$1")
  # normalize the absolute redirect_url to a path for comparison
  echo "$out" | sed -E 's#https?://[^/ ]+##'
}

echo "== P0-6: redirect map (every live URL resolves; zero 404s) =="
declare -a REDIRECTS=(
  "/about-us|/about"
  "/availability|/listings"
  "/bend-property-management|/market-areas/bend"
  "/sisters-property-management|/market-areas/sisters"
  "/prineville-property-management|/market-areas/prineville"
  "/privacy-policy|/privacy"
  "/cookie-policy|/privacy"
  "/services|/owners"
  "/residents|/tenants"
  "/free-property-management-consultation|/owners#get-started"
  "/how-to-rent-redmond|/blog/how-to-rent-redmond"
  "/real-estate-investing-redmond|/blog/real-estate-investing-redmond"
  "/buying-investment-property-redmond|/blog/buying-investment-property-redmond"
  "/sitemap|/"
  "/home|/"
  "/listings/detail/37e083e0-4b40-45fd-b65c-a81c784b7efc|/listings?notice=unavailable"
  "/listings/detail/e7ff2344-1713-44cf-8d5e-71957c46a348|/listings?notice=unavailable"
  "/mckenzie-meadows-village|/listings"
)
for pair in "${REDIRECTS[@]}"; do
  path="${pair%%|*}"; want="${pair##*|}"
  check "301 $path -> $want" "308 $want" "$(status_and_location "$path")"
done

echo
echo "== Paths that keep their URL (200, no redirect) =="
for p in / /contact /blog /owners /tenants /about /listings /market-areas/bend; do
  code=$(curl -s -o /dev/null --max-time 20 -w '%{http_code}' "$BASE$p")
  check "200 $p" "200" "$code"
done

echo
echo "== P0-8: legal pages exist with content =="
for p in /privacy /terms /accessibility; do
  code=$(curl -s -o /dev/null --max-time 20 -w '%{http_code}' "$BASE$p")
  check "200 $p" "200" "$code"
done

echo
echo "== P0-9: owner portal =="
check "200 /owner-portal" "200" "$(curl -s -o /dev/null --max-time 20 -w '%{http_code}' "$BASE/owner-portal")"

echo
echo "== P0-1/4/5: canonicals, sitemap, robots =="
canonical=$(curl -s --max-time 20 "$BASE/" | grep -Eo '<link[^>]+rel="canonical"[^>]*>' | head -1)
echo "  canonical on /: $canonical"
bramplan=$(curl -s --max-time 20 "$BASE/" | grep -c bramplan || true)
check "no 'bramplan' on /" "0" "$bramplan"
robots=$(curl -s --max-time 20 "$BASE/robots.txt")
echo "$robots" | grep -q "^Sitemap: https" && echo "  ✅ robots Sitemap: is single-line" || { echo "  ❌ robots Sitemap: malformed"; FAIL=1; }
echo "$robots" | grep -qi "^Host:" && { echo "  ❌ robots still has Host: directive"; FAIL=1; } || echo "  ✅ robots has no Host: directive"
curl -s --max-time 20 "$BASE/sitemap.xml" | head -3 | grep -q "<urlset" && echo "  ✅ sitemap parses as XML" || { echo "  ❌ sitemap not XML"; FAIL=1; }

echo
echo "== P0-10: founding year =="
y2003=$(curl -s --max-time 20 "$BASE/" | grep -c 2003 || true)
check "no '2003' on /" "0" "$y2003"

echo
echo "== P0-3: staging noindex (skip this block on production) =="
if [[ "$BASE" != *"highdesertpm.com"* ]]; then
  xr=$(curl -sI --max-time 20 "$BASE/" | grep -i x-robots-tag || true)
  [[ "$xr" == *noindex* ]] && echo "  ✅ $BASE is noindex" || { echo "  ❌ $BASE missing X-Robots-Tag: noindex"; FAIL=1; }
else
  xr=$(curl -sI --max-time 20 "$BASE/" | grep -i x-robots-tag || true)
  [[ -z "$xr" ]] && echo "  ✅ production has no X-Robots-Tag" || { echo "  ❌ production is noindexed: $xr"; FAIL=1; }
fi

echo
[[ $FAIL == 0 ]] && echo "ALL CHECKS PASSED" || { echo "FAILURES DETECTED"; exit 1; }
