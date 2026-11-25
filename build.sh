#!/usr/bin/env bash
# 把 src/ 下的分段源码拼成可部署的 index.html
#   - a_head.html + b*.js + c*.js + d*.js + e*.js 顺序拼接
#   - 结尾补 </script></body></html>
#   - three.js 改为本地优先（vendor/），失败再回退 CDN
set -euo pipefail
cd "$(dirname "$0")"

ORDER=(
  a_head.html
  b0_core.js b1_render.js b2_tex.js b3_city.js b4_props.js b5_models.js
  c1_cockpit.js c2_world.js
  d1_state.js d2_orders.js d3_lin.js d4_stock.js
  e1_places.js e2_phone.js e3_apps.js e4_main.js
)

TMP=$(mktemp)
for f in "${ORDER[@]}"; do cat "src/$f" >> "$TMP"; done
printf '</script></body></html>\n' >> "$TMP"

# three.js：本地 vendor 优先，CDN 兜底（大陆网络访问 jsdelivr 可能较慢/被墙）
python3 - "$TMP" > index.html <<'PY'
import sys, re
html = open(sys.argv[1], encoding='utf-8').read()
old = '''<script src="https://cdn.jsdelivr.net/npm/three@0.149.0/build/three.min.js"></script>'''
new = '''<script src="vendor/three.min.js"></script>
<script>if(!window.THREE){document.write('<script src="https://cdn.jsdelivr.net/npm/three@0.149.0/build/three.min.js"><\\/script>')}</script>'''
assert old in html, '在 a_head.html 里找不到 three.js 的 script 标签'
sys.stdout.write(html.replace(old, new, 1))
PY

rm -f "$TMP"
echo "built index.html ($(wc -c < index.html | tr -d ' ') bytes)"
