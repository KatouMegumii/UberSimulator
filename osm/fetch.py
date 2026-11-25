import json,time,sys,os,urllib.request,urllib.parse
S,W,N,E=31.185,121.405,31.245,121.470
step=0.015
EPS=['https://overpass-api.de/api/interpreter','https://lz4.overpass-api.de/api/interpreter','https://z.overpass-api.de/api/interpreter']
def q(bb):
  s,w,n,e=bb
  return f"""[out:json][timeout:120];
(way["building"]({s},{w},{n},{e});
 way["highway"]({s},{w},{n},{e});
 way["landuse"]({s},{w},{n},{e});
 way["leisure"~"park|garden|pitch"]({s},{w},{n},{e});
 way["natural"~"water|wood|scrub"]({s},{w},{n},{e});
 way["waterway"]({s},{w},{n},{e});
 way["railway"]({s},{w},{n},{e});
 relation["building"]({s},{w},{n},{e});
 relation["natural"="water"]({s},{w},{n},{e});
 relation["landuse"]({s},{w},{n},{e});
 node["amenity"]({s},{w},{n},{e});
 node["shop"]({s},{w},{n},{e});
 node["natural"="tree"]({s},{w},{n},{e});
 node["highway"="traffic_signals"]({s},{w},{n},{e});
);
out body;>;out skel qt;"""
lat=S;i=0
tiles=[]
while lat<N-1e-9:
  lon=W
  while lon<E-1e-9:
    tiles.append((round(lat,4),round(lon,4),round(min(lat+step,N),4),round(min(lon+step,E),4)));lon+=step
  lat+=step
print(len(tiles),'tiles')
for k,bb in enumerate(tiles):
  fn=f'/sessions/zealous-loving-wright/mnt/outputs/osm/raw/t{k:02d}.json'
  if os.path.exists(fn) and os.path.getsize(fn)>1000: continue
  for attempt in range(8):
    ep=EPS[attempt%len(EPS)]
    try:
      data=urllib.parse.urlencode({'data':q(bb)}).encode()
      req=urllib.request.Request(ep,data=data,headers={'User-Agent':'qiaoxi-demo/0.1 (game prototype)'})
      r=urllib.request.urlopen(req,timeout=180).read()
      j=json.loads(r);open(fn,'wb').write(r);print(k,bb,len(j['elements']),'ok',flush=True);break
    except Exception as ex:
      print(k,'retry',attempt,str(ex)[:80],flush=True);time.sleep(5*(attempt+1))
