"""把游戏打包成本地双击可运行的文件夹：outputs/桥西夜班/
- lib/engine.js：three.js + GLTFLoader + RGBELoader + SkeletonUtils（IIFE）
- assets/pack/*.js：资源以 base64 包在脚本里（file:// 下浏览器允许加载脚本）
- 字体内嵌为 data URI
"""
import os, json, base64, shutil, re
SRC = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(SRC, '..', '桥西夜班')
ASSET = os.path.join(SRC, '..', 'github-pages', 'assets')
ENGINE = '/tmp/bundle/engine.js'
os.makedirs(os.path.join(OUT, 'lib'), exist_ok=True)
pack_dir = os.path.join(OUT, 'assets', 'pack')
if os.path.isdir(pack_dir): shutil.rmtree(pack_dir)
os.makedirs(pack_dir)
shutil.copy(ENGINE, os.path.join(OUT, 'lib', 'engine.js'))
# 资源打包
MIME = {'.jpg': 'image/jpeg', '.png': 'image/png', '.json': 'application/json', '.gltf': 'model/gltf+json', '.glb': 'model/gltf-binary', '.bin': 'application/octet-stream', '.hdr': 'application/octet-stream'}
files = []
for root, _, fs in os.walk(ASSET):
    for f in fs:
        p = os.path.join(root, f); rel = 'assets/' + os.path.relpath(p, ASSET).replace(os.sep, '/')
        if os.path.splitext(f)[1].lower() in MIME: files.append((rel, p))
files.sort()
packs = []; cur = []; cur_size = 0; n = 0
def flush():
    global cur, cur_size, n
    if not cur: return
    name = f'{n:03d}.js'; n += 1
    with open(os.path.join(pack_dir, name), 'w') as w:
        for rel, p in cur:
            b = base64.b64encode(open(p, 'rb').read()).decode()
            w.write(f'__pack({json.dumps(rel)},"{b}",{json.dumps(MIME[os.path.splitext(p)[1].lower()])});\n')
    packs.append([name, cur_size, os.path.basename(cur[-1][0])]); cur = []; cur_size = 0
for rel, p in files:
    sz = os.path.getsize(p)
    if cur_size + sz > 8_000_000: flush()
    cur.append((rel, p)); cur_size += sz
flush()
open(os.path.join(pack_dir, 'index.js'), 'w').write('window.__PACKS=' + json.dumps(packs) + ';')
# HTML
order = open(os.path.join(SRC, 'order_osm.txt')).read().split()
head = open(os.path.join(SRC, 'a_head2.html')).read()
fonts = os.path.join(SRC, '..', 'github-pages', 'lib', 'fonts')
def font_uri(m):
    fp = os.path.join(fonts, os.path.basename(m.group(1)))
    return 'url(data:font/woff2;base64,' + base64.b64encode(open(fp, 'rb').read()).decode() + ')' if os.path.exists(fp) else m.group(0)
head = re.sub(r"url\((lib/fonts/[^)]+)\)", font_uri, head)
body = ''.join(open(os.path.join(SRC, f)).read() for f in order)
assert '</script' not in body
tail = open(os.path.join(SRC, 'z_boot_local.html')).read()
open(os.path.join(OUT, 'index.html'), 'w').write(head + body + tail)
open(os.path.join(OUT, '使用说明.txt'), 'w').write('双击 index.html 即可开始（推荐 Chrome 或 Edge）。\n整个文件夹要放在一起，不要单独拷走 index.html。\n首次载入约需半分钟。按 Esc 查看操作说明和画质设置。\n')
tot = sum(os.path.getsize(os.path.join(dp, f)) for dp, _, fs in os.walk(OUT) for f in fs)
print('packs', len(packs), 'files', len(files), 'total MB', round(tot / 1e6, 1))
