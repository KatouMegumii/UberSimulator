"""OSM raw tiles → assets/map/map.json（局部米制坐标，x 向东，z 向南）"""
import json, glob, math, collections, random, os, hashlib
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', 'assets', 'map', 'map.json')
LAT0, LON0 = 31.215, 121.4375
KX = math.cos(math.radians(LAT0)) * 111320.0
KZ = 110540.0
def P(lat, lon): return ((lon - LON0) * KX, -(lat - LAT0) * KZ)

nodes, ways, rels = {}, {}, {}
for f in sorted(glob.glob(os.path.join(os.path.dirname(__file__), 'raw/*.json'))):
    for e in json.load(open(f))['elements']:
        if e['type'] == 'node':
            if e['id'] not in nodes or 'tags' in e: nodes[e['id']] = e
        elif e['type'] == 'way': ways[e['id']] = e
        else: rels[e['id']] = e
xy = {i: P(n['lat'], n['lon']) for i, n in nodes.items()}

DRIVE = {'trunk': 20, 'primary': 16, 'secondary': 13, 'tertiary': 10, 'unclassified': 8, 'residential': 7,
         'living_street': 5.5, 'service': 4.5, 'trunk_link': 7.5, 'primary_link': 7, 'secondary_link': 6.5, 'tertiary_link': 6}
CLS = {'trunk': 0, 'primary': 1, 'secondary': 2, 'tertiary': 3, 'unclassified': 4, 'residential': 4, 'living_street': 5, 'service': 5,
       'trunk_link': 1, 'primary_link': 2, 'secondary_link': 3, 'tertiary_link': 3}
def width(t):
    hw = t['highway']; w = DRIVE[hw]
    if 'lanes' in t:
        try: w = max(4.5, float(str(t['lanes']).split(';')[0]) * 3.3 + 1)
        except: pass
    elif t.get('oneway') == 'yes' and CLS[hw] <= 2: w *= .6
    return round(w, 1)

drive, elev = [], []
for w in ways.values():
    t = w.get('tags', {}); hw = t.get('highway')
    if hw not in DRIVE: continue
    if t.get('tunnel') in ('yes', 'building_passage'): continue
    if hw == 'service' and t.get('service') in ('parking_aisle', 'driveway', 'drive-through'): continue
    if t.get('area') == 'yes': continue
    nd = [n for n in w['nodes'] if n in xy]
    if len(nd) < 2: continue
    try: layer = int(t.get('layer', '0'))
    except: layer = 0
    if t.get('bridge') == 'yes' and layer >= 1 and CLS[hw] <= 1:
        elev.append({'pts': nd, 'w': width(t), 'layer': layer}); continue
    drive.append((w['id'], nd, t))
# 拓扑：被多条路共用或位于端点的节点成为路口
use = collections.Counter()
for _, nd, _ in drive:
    for n in nd: use[n] += 1
    use[nd[0]] += 2; use[nd[-1]] += 2
vid = {}; V = []
def vert(n):
    if n not in vid: vid[n] = len(V); V.append(xy[n])
    return vid[n]
E = []
for wid, nd, t in drive:
    seg = [nd[0]]
    for n in nd[1:]:
        seg.append(n)
        if use[n] >= 2 and n != nd[-1] or n == nd[-1]:
            if len(seg) >= 2:
                pts = [xy[k] for k in seg]
                L = sum(math.dist(pts[i], pts[i + 1]) for i in range(len(pts) - 1))
                if L > .5:
                    E.append({'a': vert(seg[0]), 'b': vert(seg[-1]), 'p': [c for p in pts[1:-1] for c in (round(p[0], 1), round(p[1], 1))],
                              'w': width(t), 'c': CLS[t['highway']], 'n': t.get('name', ''), 'o': 1 if t.get('oneway') in ('yes', '1') else 0, 'L': round(L, 1)})
            seg = [n]
# 只保留最大连通分量
adj = collections.defaultdict(list)
for i, e in enumerate(E): adj[e['a']].append(i); adj[e['b']].append(i)
seen = set(); best = []
for s in range(len(V)):
    if s in seen or not adj[s]: continue
    comp = []; st = [s]; seen.add(s)
    while st:
        v = st.pop(); comp.append(v)
        for ei in adj[v]:
            e = E[ei]; u = e['b'] if e['a'] == v else e['a']
            if u not in seen: seen.add(u); st.append(u)
    if len(comp) > len(best): best = comp
keep = set(best)
E = [e for e in E if e['a'] in keep]
remap = {}; V2 = []
for e in E:
    for k in ('a', 'b'):
        if e[k] not in remap: remap[e[k]] = len(V2); V2.append(V[e[k]])
        e[k] = remap[e[k]]
V = V2
print('graph', len(V), 'verts', len(E), 'edges', round(sum(e['L'] for e in E) / 1000, 1), 'km')

# 建筑
def ring_area(r):
    a = 0
    for i in range(len(r)):
        x1, z1 = r[i]; x2, z2 = r[(i + 1) % len(r)]; a += x1 * z2 - x2 * z1
    return a / 2
def hrand(i, s=''):
    return int(hashlib.md5((str(i) + s).encode()).hexdigest()[:8], 16) / 0xffffffff
B = []
def add_bld(rid, ring_nodes, t):
    r = [xy[n] for n in ring_nodes if n in xy]
    if len(r) > 2 and r[0] == r[-1]: r = r[:-1]
    if len(r) < 3: return
    A = abs(ring_area(r))
    if A < 12: return
    h = None
    try:
        if 'height' in t: h = float(str(t['height']).replace('m', '').split(';')[0])
        elif 'building:levels' in t: h = float(str(t['building:levels']).split(';')[0]) * 3.1 + .6
    except: h = None
    bt = t.get('building', 'yes'); u = hrand(rid)
    if h is None:
        if A < 120: h = 6.5 + u * 3
        elif A < 450: h = 8 + u * 12 if u < .6 else 17 + u * 6
        elif A < 1500: h = 14 + u * 30
        else: h = 18 + u * (60 if bt in ('commercial', 'office', 'yes') else 35)
    h = max(3.5, min(h, 260))
    if h <= 12.5: k = 0          # 砖 / 老房
    elif h <= 32: k = 1 if u < .55 else 2  # 涂料 / 面砖
    elif bt in ('commercial', 'office', 'retail', 'hotel') or u < .45: k = 3  # 玻璃
    else: k = 2
    if ring_area(r) < 0: r = r[::-1]  # 统一为逆时针（x 东 z 南坐标下）
    B.append({'p': [round(c, 1) for p in r for c in p], 'h': round(h, 1), 'k': k})
for w in ways.values():
    t = w.get('tags', {})
    if 'building' in t and t.get('building') not in ('roof', 'construction') and t.get('location') != 'underground':
        add_bld(w['id'], w['nodes'], t)
for r in rels.values():
    t = r.get('tags', {})
    if 'building' not in t: continue
    for m in r.get('members', []):
        if m['type'] == 'way' and m.get('role') == 'outer' and m['ref'] in ways: add_bld(m['ref'], ways[m['ref']]['nodes'], t)
print('buildings', len(B))
# 绿地 / 水面
G, W = [], []
for w in ways.values():
    t = w.get('tags', {})
    r = [xy[n] for n in w['nodes'] if n in xy]
    if len(r) < 4 or w['nodes'][0] != w['nodes'][-1]: continue
    flat = [round(c, 1) for p in r[:-1] for c in p]
    if t.get('natural') == 'water' or t.get('waterway') == 'riverbank': W.append(flat)
    elif t.get('leisure') in ('park', 'garden') or t.get('landuse') in ('grass', 'forest', 'meadow', 'village_green') or t.get('natural') in ('wood', 'scrub'): G.append(flat)
# 用地：居住区 / 商业区
LU=[]
for w in ways.values():
    t=w.get('tags',{});lu=t.get('landuse')
    if lu in ('residential','commercial','retail'):
        r=[xy[n] for n in w['nodes'] if n in xy]
        if len(r)>=4 and w['nodes'][0]==w['nodes'][-1]:
            A=abs(ring_area(r[:-1]))
            if A>400: LU.append([0 if lu=='residential' else 1,[round(c,1) for p in r[:-1] for c in p]])
print('landuse',len(LU))
# 河流线
RIV = []
for w in ways.values():
    t = w.get('tags', {})
    if t.get('waterway') in ('river', 'canal'):
        r = [xy[n] for n in w['nodes'] if n in xy]
        if len(r) > 1: RIV.append([round(c, 1) for p in r for c in p])
# 点：树 / 信号灯 / POI
TR, SG, POI = [], [], []
for n in nodes.values():
    t = n.get('tags')
    if not t: continue
    x, z = xy[n['id']]
    if t.get('natural') == 'tree': TR += [round(x, 1), round(z, 1)]
    if t.get('highway') == 'traffic_signals': SG += [round(x, 1), round(z, 1)]
    a = t.get('amenity'); s = t.get('shop')
    if (a in ('restaurant', 'cafe', 'bar', 'pub', 'nightclub', 'fast_food', 'bank', 'pharmacy', 'ice_cream', 'cinema', 'theatre') or s) and t.get('name'):
        POI.append([round(x, 1), round(z, 1), t.get('name:zh') or t['name'], a or 'shop'])
CS=[]
for n in nodes.values():
    t=n.get('tags') or {}
    if t.get('amenity')=='charging_station':
        x,z=xy[n['id']];CS.append([round(x,1),round(z,1),t.get('name') or t.get('operator') or '充电站'])
for w in ways.values():
    t=w.get('tags',{})
    if t.get('amenity')=='charging_station' or (t.get('amenity')=='parking' and 'charg' in str(t).lower()):
        r=[xy[k] for k in w['nodes'] if k in xy]
        if r: CS.append([round(sum(p[0] for p in r)/len(r),1),round(sum(p[1] for p in r)/len(r),1),t.get('name') or t.get('operator') or '充电站'])
print('charging',len(CS))
print('trees', len(TR) // 2, 'signals', len(SG) // 2, 'poi', len(POI))
# 高架
EL = [{'p': [round(c, 1) for n in e['pts'] for c in xy[n]], 'w': e['w']} for e in elev]
# 区域格：r 住宅 c 商业 n 夜生活
xs = [v[0] for v in V]; zs = [v[1] for v in V]
minx, maxx, minz, maxz = min(xs), max(xs), min(zs), max(zs)
CELL = 100
gw, gh = int((maxx - minx) // CELL) + 1, int((maxz - minz) // CELL) + 1
night = collections.Counter(); comm = collections.Counter()
def cell(x, z): return (int((x - minx) // CELL), int((z - minz) // CELL))
for x, z, nm, ty in POI:
    cx, cz = cell(x, z)
    for dx in range(-1, 2):
        for dz in range(-1, 2):
            if ty in ('bar', 'pub', 'nightclub'): night[(cx + dx, cz + dz)] += 2 if dx == 0 and dz == 0 else 1
            comm[(cx + dx, cz + dz)] += 1
for w in ways.values():
    t = w.get('tags', {})
    if t.get('landuse') in ('commercial', 'retail'):
        for n in w['nodes'][::3]:
            if n in xy: comm[cell(*xy[n])] += 2
Z = []
for j in range(gh):
    row = ''
    for i in range(gw):
        row += 'n' if night[(i, j)] >= 4 else ('c' if comm[(i, j)] >= 9 else 'r')
    Z.append(row)
print('zones', collections.Counter(''.join(Z)))
out = {'origin': [LAT0, LON0], 'bounds': [round(minx), round(minz), round(maxx), round(maxz)],
       'V': [round(c, 1) for v in V for c in v], 'E': [[e['a'], e['b'], e['w'], e['c'], e['o'], e['n'], e['p']] for e in E],
       'B': [[b['h'], b['k'], b['p']] for b in B], 'LU': LU, 'CS': CS, 'G': G, 'W': W, 'R': RIV, 'EL': EL, 'T': TR, 'S': SG, 'POI': POI,
       'Z': {'cell': CELL, 'x0': round(minx), 'z0': round(minz), 'w': gw, 'h': gh, 'd': Z}}
os.makedirs(os.path.dirname(OUT), exist_ok=True)
json.dump(out, open(OUT, 'w'), ensure_ascii=False, separators=(',', ':'))
print('bytes', os.path.getsize(OUT))
# 便于选地点：打印候选路名
names = collections.Counter(e['n'] for e in E if e['n'])
for q in ['永福路', '武康路', '湖南路', '愚园路', '长乐路', '巨鹿路', '富民路', '延安西路', '复兴西路', '五原路', '安福路', '乌鲁木齐中路', '华山路', '江苏路', '常熟路']:
    es = [e for e in E if e['n'] == q]
    if es:
        e = max(es, key=lambda e: e['L']); a = V[e['a']]
        print(q, len(es), 'eg', round(a[0]), round(a[1]))
