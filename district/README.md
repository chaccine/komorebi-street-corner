# 晴间街区

一座可以拿近细看的日式微缩街区。三栋建筑共用一条路，斑马线边有树荫和长椅，转动底座还能看见断开的混凝土、钢筋和垂下的树根。[进入街区](https://chaccine.github.io/komorebi-street-corner/district/)

| 建筑 | 可以做什么 |
| --- | --- |
| [晴间茶铺](https://chaccine.github.io/komorebi-street-corner/district/#tea) | 点窗户，柜台和楼上的灯依次亮起，再点一次熄灯。 |
| [自行车修理棚](https://chaccine.github.io/komorebi-street-corner/district/#cycles) | 拨一下悬挂的车轮，看反光片绕圈，听棘轮声逐渐变慢。 |
| [外廊公寓](https://chaccine.github.io/komorebi-street-corner/district/#flats) | 点阳台的床单，风会掀起下摆，露出后面的盆栽。 |

## 怎么逛

电脑上拖动旋转，滚轮缩放，右键拖动或按住 Shift 拖动可以平移。点建筑可以靠近，也可以直接点全景里的窗户、车轮和床单。

手机竖屏会从茶铺一侧望向街区。单指拖动旋转，双指捏合缩放，双指同向移动可以平移。先点建筑靠近，再点细节互动。两指同时轻点可切换静音。横竖屏切换时会重新取景，保留正在看的建筑。

双击空白处回到全景。键盘可用 1、2、3 选建筑，用回车或空格互动，Home 或 Esc 返回，M 切换静音。声音在首次操作后启用。

## 本地运行

用支持 WebGL 2 的浏览器打开同目录的 `index.html` 即可离线游玩。几何、画面和声音都在这个文件里。

修改源码后，在本目录运行以下命令重新生成试玩页。

```sh
python -B build.py
```

## 继续扩建

- `src/buildings.js` 放建筑和可以点的部件。`src/ground.js` 放地块、道路、庭院和剖面。两者使用同一套以米为单位的坐标。
- `src/district.js` 定义每栋建筑的分享地址、取景范围、声音位置和点按反馈。新增建筑时，在这里登记它的镜头与交互，并同步更新编号处理、键盘说明和测试。
- `src/engine.js` 负责渲染、点选和远近细节。`src/weather.js` 控制短时阵雨。`src/gestures.js` 和 `src/audio.js` 分别负责手势与音效。
- `cover.webp` 和 `cover-portrait.webp` 是街区实景截图，用于横屏和竖屏的启动画面。正式页面和扩建用的源码都位于本仓库的 `district/` 目录。独立的[原版晴间街角](https://chaccine.github.io/komorebi-street-corner/)由仓库根目录提供。

## 检查改动

安装 Python 的 Playwright 包与 Chromium 后，运行 `python -B checks/check_district.py`。测试会在浏览器中实际点选三栋建筑，检查灯光、车轮、床单和直达链接，再用三倍像素密度的触屏模拟检查捏合、点按和返回。可用 `--chrome` 指定浏览器路径，或传入试玩网址来检查已发布版本。
