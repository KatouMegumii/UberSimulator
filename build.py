#!/usr/bin/env python3
"""构建产物，两种模式共用同一份 src/：

  python3 build.py          双击版 → dist/桥西夜班/
                            资源 base64 包进 assets/pack/*.js（file:// 下浏览器只允许加载脚本）

  python3 build.py --web    网页版 → dist/web/
                            资源保持原样，按 URL 直连，交给浏览器并发下载 + 按文件缓存
                            （GitHub Pages 用这个）

两者共有的部分：
- index.html：src/a_head.html + src/order.txt 里的分段 + src/z_boot.html，字体内嵌为 data URI
- lib/engine.js：three.js r149 + GLTFLoader + RGBELoader + SkeletonUtils（IIFE，来自 vendor/）
"""
import os, sys, json, base64, shutil, re

WEB = '--web' in sys.argv[1:]

ROOT = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(ROOT, 'src')
ASSET = os.path.join(ROOT, 'assets')
VENDOR = os.path.join(ROOT, 'vendor')
OUT = os.path.join(ROOT, 'dist', 'web' if WEB else '桥西夜班')
PACK_LIMIT = 8_000_000
MIME = {'.jpg': 'image/jpeg', '.png': 'image/png', '.json': 'application/json',
        '.gltf': 'model/gltf+json', '.glb': 'model/gltf-binary',
        '.bin': 'application/octet-stream', '.hdr': 'application/octet-stream'}

if os.path.isdir(OUT):
    shutil.rmtree(OUT)
os.makedirs(OUT)
os.makedirs(os.path.join(OUT, 'lib'))
shutil.copy(os.path.join(VENDOR, 'engine.js'), os.path.join(OUT, 'lib', 'engine.js'))

packs = []
if WEB:
    # 原样拷贝资源，并生成一份体积清单：启动时用它算按字节的下载进度
    shutil.copytree(ASSET, os.path.join(OUT, 'assets'))
    sizes = {}
    for root, _, fs in os.walk(ASSET):
        for f in fs:
            if os.path.splitext(f)[1].lower() not in MIME:
                continue
            p = os.path.join(root, f)
            rel = 'assets/' + os.path.relpath(p, ASSET).replace(os.sep, '/')
            sizes[rel] = os.path.getsize(p)
    with open(os.path.join(OUT, 'assets', 'manifest.js'), 'w') as w:
        w.write('window.__MANIFEST=' + json.dumps(
            {'total': sum(sizes.values()), 'sizes': sizes}, separators=(',', ':')) + ';')
else:
    pack_dir = os.path.join(OUT, 'assets', 'pack')
    os.makedirs(pack_dir)

    # 资源打包：按 ~8MB 一包切分
    files = []
    for root, _, fs in os.walk(ASSET):
        for f in fs:
            if os.path.splitext(f)[1].lower() in MIME:
                p = os.path.join(root, f)
                files.append(('assets/' + os.path.relpath(p, ASSET).replace(os.sep, '/'), p))
    files.sort()
    cur, cur_size = [], 0

    def flush():
        global cur, cur_size
        if not cur:
            return
        name = f'{len(packs):03d}.js'
        with open(os.path.join(pack_dir, name), 'w') as w:
            for rel, p in cur:
                b = base64.b64encode(open(p, 'rb').read()).decode()
                mime = MIME[os.path.splitext(p)[1].lower()]
                w.write(f'__pack({json.dumps(rel)},"{b}",{json.dumps(mime)});\n')
        packs.append([name, cur_size, os.path.basename(cur[-1][0])])
        cur, cur_size = [], 0

    for rel, p in files:
        sz = os.path.getsize(p)
        if cur_size + sz > PACK_LIMIT:
            flush()
        cur.append((rel, p))
        cur_size += sz
    flush()
    open(os.path.join(pack_dir, 'index.js'), 'w').write('window.__PACKS=' + json.dumps(packs) + ';')

# HTML
fonts = os.path.join(VENDOR, 'fonts')


def font_uri(m):
    fp = os.path.join(fonts, os.path.basename(m.group(1)))
    if not os.path.exists(fp):
        return m.group(0)
    return 'url(data:font/woff2;base64,' + base64.b64encode(open(fp, 'rb').read()).decode() + ')'


order = open(os.path.join(SRC, 'order.txt')).read().split()
head = re.sub(r"url\((lib/fonts/[^)]+)\)", font_uri, open(os.path.join(SRC, 'a_head.html')).read())
body = ''.join(open(os.path.join(SRC, f)).read() for f in order)
assert '</script' not in body, '分段源码里不能出现 </script'
tail = open(os.path.join(SRC, 'z_boot.html')).read()

if WEB:
    # 告诉 z_boot 走 URL 直连；把打包清单脚本换成体积清单脚本
    assert '</head>' in head
    head = head.replace('</head>', '<script>window.__WEB=1;</script>\n</head>', 1)
    old_tag = '<script src="assets/pack/index.js"></script>'
    assert old_tag in tail
    tail = tail.replace(old_tag, '<script src="assets/manifest.js"></script>', 1)

open(os.path.join(OUT, 'index.html'), 'w').write(head + body + tail)
if not WEB:
    open(os.path.join(OUT, '使用说明.txt'), 'w').write(
        '双击 index.html 即可开始（推荐 Chrome 或 Edge）。\n'
        '整个文件夹要放在一起，不要单独拷走 index.html。\n'
        '首次载入约需半分钟。按 Esc 查看操作说明和画质设置。\n')

tot = sum(os.path.getsize(os.path.join(dp, f)) for dp, _, fs in os.walk(OUT) for f in fs)
if WEB:
    res = tot - os.path.getsize(os.path.join(OUT, 'index.html')) - os.path.getsize(os.path.join(OUT, 'lib', 'engine.js'))
    print(f'dist/web: {len(sizes)} 个资源直连（{res / 1e6:.0f} MB，不膨胀），产物共 {tot / 1e6:.1f} MB')
else:
    print(f'dist/桥西夜班: {len(files)} 个资源 → {len(packs)} 个包，共 {tot / 1e6:.1f} MB')
