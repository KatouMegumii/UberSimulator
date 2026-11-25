# 桥西夜班 · UberSimulator

上海网约车生活模拟的网页原型（three.js r149）。你在徐汇、静安、长宁交界一带开网约车跑夜班：接单、载客、充电、还车租、炒股，穿插面馆、手机 App 和路上的剧情。地图取自 OpenStreetMap 真实路网和建筑。

## 目录结构

```
build.py         构建脚本：src/ + assets/ + vendor/ → dist/桥西夜班/
src/             游戏源码分段，按 src/order.txt 的顺序拼接
  a_head.html      <head>、CSS、HUD/DOM 结构
  order.txt        拼接顺序（新增分段要同步改这里）
  z_boot.html      启动脚本：载入资源包、解析模型贴图、启动游戏
  m*/b*/c*/d*/e*   世界、城市、道具、交通、驾驶舱、订单、手机 App、主循环等
assets/          原始资源：tex/ 贴图、hdr/ 天空、models/ 模型、map/map.json 地图
vendor/          engine.js（three.js + GLTFLoader + RGBELoader + SkeletonUtils 打包）、Inter 字体
tools/osm/       地图生成：fetch.py 拉 OSM 原始数据到 raw/，build_map.py 生成 assets/map/map.json
dist/            构建产物（不进 git）
```

## 构建与运行

```bash
python3 build.py
open dist/桥西夜班/index.html
```

`dist/桥西夜班/` 是交付物：整个文件夹压缩后发给别人，对方双击 `index.html` 就能玩，不需要联网或本地服务器。资源以 base64 打包成 `assets/pack/*.js`，因为浏览器在 file:// 下只允许加载脚本。推荐桌面版 Chrome / Edge，首次载入约半分钟。

改地图时先运行 `python3 tools/osm/fetch.py`（需要联网访问 Overpass API），再运行 `python3 tools/osm/build_map.py`。

## 署名

- 地图数据：© OpenStreetMap contributors，ODbL
- [Park Bench](https://sketchfab.com/3d-models/park-bench-2ee2bc87756d4bf0932d83ab860ddb8f)，作者 RBG_illustrations，CC BY 4.0（Sketchfab）
- [Generic Town Bus](https://sketchfab.com/3d-models/generic-town-bus-14fe03d792914d51b6c6250b393c44fd)，作者 own.guest，CC BY 4.0（Sketchfab）
- [Grass Bushes (game ready asset)](https://sketchfab.com/3d-models/grass-bushes-game-ready-asset-aa1fa43af9bf4228adfddb54ea123ad1)，作者 Pixel Life，CC BY 4.0（Sketchfab）
- [Carla Rigged 001 - Rigged 3D Business Women](https://sketchfab.com/3d-models/carla-rigged-001-rigged-3d-business-women-acf520f450d14dd799f98a6fede3edf5)，作者 Renderpeople，CC BY 4.0（Sketchfab）
- [Electric charging station](https://sketchfab.com/3d-models/electric-charging-station-a11e4043c6224aff98efac4097103466)，作者 cedric4296，CC BY 4.0（Sketchfab）
- [Claudia Rigged 002 - 3D Rigged Business Women](https://sketchfab.com/3d-models/claudia-rigged-002-3d-rigged-business-women-c659bd0accab47c6bbe390cf822a2b92)，作者 Renderpeople，CC BY 4.0（Sketchfab）
- [2014 Toyota Corolla E180 EU (with interior)](https://sketchfab.com/3d-models/2014-toyota-corolla-e180-eu-with-interior-36f95efb0585464cae43a25a3b3392e8)，作者 Armored Wave，CC BY 4.0（Sketchfab）
- [Eric Rigged 001 - Rigged 3D Business Man](https://sketchfab.com/3d-models/eric-rigged-001-rigged-3d-business-man-a46bc9f67aaa415bb4f3241eef900e7f)，作者 Renderpeople，CC BY 4.0（Sketchfab）
- [Metal Barrier | Game Ready | 4K](https://sketchfab.com/3d-models/metal-barrier-game-ready-4k-3843be0d065847bc8e0b2b2002e7e46f)，作者 bralunit，CC BY 4.0（Sketchfab）
- [Nathan Animated 003 - Walking 3D Man](https://sketchfab.com/3d-models/nathan-animated-003-walking-3d-man-143a2b1ea5eb4385ae90a73657aca3bc)，作者 Renderpeople，CC BY 4.0（Sketchfab）
- [Sophia Animated 003 - Animated 3D Woman](https://sketchfab.com/3d-models/sophia-animated-003-animated-3d-woman-dc448c3be0e74f96a55fb475a13433cf)，作者 Renderpeople，CC BY 4.0（Sketchfab）
- [2017 Skoda Superb](https://sketchfab.com/3d-models/2017-skoda-superb-2da5059c3068448b9541eafb930a45a0)，作者 BHP3D，CC BY 4.0（Sketchfab）
- [Trees (low-Poly, 4k Tris / Tree)](https://sketchfab.com/3d-models/trees-low-poly-4k-tris-tree-6fad6d1b2d7e4b2187ea6e6a721606ff)，作者 Sereib，CC BY 4.0（Sketchfab）
- HDR 天空、照片扫描贴图、街道道具（配电箱、垃圾桶、卷帘门、塑料椅、方凳）：Poly Haven，CC0
- 字体 Inter（SIL OFL）；引擎 three.js r149（MIT）
- 股票、公司、新闻、人物均为虚构
