#!/bin/bash
# (30.6) acemi profili: üç tohum x 40 gün paralel; özet satırları tools/sim/out/n/<etiket>-<tohum>.txt
# Kullanım: tools/sim/novice-run.sh <etiket> [tohumlar...]
tag=${1:-run}; shift
seeds=${@:-42 77 101}
mkdir -p "$(dirname "$0")/out/n"
for sd in $seeds; do node "$(dirname "$0")/autopilot.mjs" $sd 40 --profile novice --quiet --verbose > "$(dirname "$0")/out/n/$tag-$sd.log" 2>&1 & done
wait
for sd in $seeds; do echo "== $sd"; grep "(30.6)\|(22. aşama)" "$(dirname "$0")/out/n/$tag-$sd.log" | grep -v "gün gün altın\|gün gün yiyecek\|nüfus/yapı" | cut -c1-420; done
