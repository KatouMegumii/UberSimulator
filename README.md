# 桥西夜班 · UberSimulator

一个单文件的 3D 网页小游戏：你在桥西开网约车跑夜班，接单、载客、收车费、还车租、
炒股，穿插面馆 / 手机 App / 剧情对话。基于 Three.js 实时渲染。

**在线试玩（GitHub Pages）**：https://katoumegumii.github.io/UberSimulator/

> 需要桌面浏览器（Chrome / Edge / Safari）+ 键盘，暂不支持触屏操作。

## 仓库结构

```
index.html               ← 部署入口（由 build.sh 生成，不要手改）
qiaoxi-night-shift.html  ← 原始单文件版本（历史备份）
vendor/three.min.js      ← 本地 three.js r149（免 CDN 依赖）
favicon.ico
build.sh                 ← 把 src/ 分段源码拼成 index.html
src/                     ← 源码分段
  a_head.html              <head> + CSS + HUD/DOM 结构 + three.js 加载
  b0_core.js              工具函数
  b1_render.js            渲染器 / 后期处理
  b2_tex.js               程序化贴图
  b3_city.js              街区几何
  b4_props.js             街道设施 / 树木
  b5_models.js            车辆模型
  c1_cockpit.js           车内视角 / 仪表
  c2_world.js             世界更新
  d1_state.js             存档状态
  d2_orders.js            派单逻辑
  d3_lin.js               镜头 / 线性系统
  d4_stock.js             股市
  e1_places.js            地点（面馆等）
  e2_phone.js             手机
  e3_apps.js              手机 App（滴滴车主 / 申城银行 / 同花顺）
  e4_main.js              主循环 / 启动
  old/                    早期合并版（已废弃，仅供参考）
```

`build.sh` 的拼接顺序写死在脚本里；新增分段源码时要同步改 `ORDER` 数组。

## 本地构建与预览

```bash
./build.sh                 # 生成 index.html
python3 -m http.server 8000
# 打开 http://127.0.0.1:8000/
```

直接双击 `index.html`（file:// 协议）也能玩，但用本地 HTTP 服务更接近线上环境。

## 部署到 GitHub Pages

站点是**纯静态**的：没有构建服务、没有后端、不发任何网络请求（three.js 已本地化），
所以任意静态托管都能跑，GitHub Pages 最省事。

当前配置：`main` 分支根目录直接发布，`.nojekyll` 关闭 Jekyll 处理。

以后更新：

```bash
./build.sh
git add -A && git commit -m "update" && git push
```

推送后 30 秒左右 Pages 会自动重建。

如果仓库名改了，注意 Pages 地址会变成 `https://<user>.github.io/<repo>/`；
页面内所有资源都用相对路径（`vendor/three.min.js`），放在子路径下也能正常工作。

## 技术备注

- 渲染：Three.js r149 + WebGL，含自定义后期处理（泛光 / 色调映射），
  显卡较弱时按 `G` 关掉后期效果。
- 数据：股票、公司、新闻均为虚构；A 股规则（涨跌停、T+1、集合竞价、停牌）是模拟的。
- 无存档：刷新页面即重开，进度不落盘（未使用 localStorage）。
- 时间：现实 1 秒 = 游戏 1 分钟；地图距离按 4 倍换算成里程。
