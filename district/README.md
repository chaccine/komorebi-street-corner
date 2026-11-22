# 晴间街区

一座可以拿近细看的日式微缩街区。五栋建筑和一座石阶小庭沿街道与小巷相连，斑马线边有树荫和长椅，转动底座还能看见断开的混凝土、钢筋和垂下的树根。[进入街区](https://chaccine.github.io/komorebi-street-corner/district/)

| 地点 | 可以做什么 |
| --- | --- |
| [晴间茶铺](https://chaccine.github.io/komorebi-street-corner/district/#tea) | 点窗户，柜台和楼上的灯依次亮起，再点一次熄灯。 |
| [自行车修理棚](https://chaccine.github.io/komorebi-street-corner/district/#cycles) | 拨一下悬挂的车轮，看反光片绕圈，听棘轮声逐渐变慢。 |
| [外廊公寓](https://chaccine.github.io/komorebi-street-corner/district/#flats) | 点阳台的床单，风会掀起下摆，露出后面的盆栽。 |
| [巷尾花店](https://chaccine.github.io/komorebi-street-corner/district/#florist) | 顺着修理棚旁的石板巷到玻璃花房，点门边的青绿水壶浇花。 |
| [旧书报亭](https://chaccine.github.io/komorebi-street-corner/district/#newsstand) | 点长椅旁摊开的报纸，听纸页翻动，露出夕阳下的巷尾花店插画。再点一次翻回头版。 |
| [石阶小庭](https://chaccine.github.io/komorebi-street-corner/district/#courtyard) | 修理棚后、花店小巷旁。点石钵，麻雀扑上矮墙，歇一会儿再跳回钵沿。 |
| [沿河小街](https://chaccine.github.io/komorebi-street-corner/district/#riverside) | 从旧书报亭沿栏杆走到石桥。点桥面到对岸，看步道边的红邮筒和伸入水中的石阶。再点同一座桥回书报亭。 |

## 怎么逛

沿河步道尽头有一片暖白色的云。第一次点桥抵达红邮筒旁，稍等片刻，两只燕子会先后飞离树梢，沿河绕一圈再归枝。开启系统的“减少动态效果”后，可以在河岸树上找到它们。

午后的公寓前停着一辆奶油色旅行车。提菜篮的街坊沿茶铺门前走到花店巷口，再转身走回来。旧书报亭旁的两个人共看一张印着花房的报纸，拉近能看见其中一人指向插画。茶铺门边、巷口矮墙脚和红邮筒旁分别有一簇暖色花。开启系统的“减少动态效果”可让人物保持静止。

电脑上拖动旋转，滚轮缩放，右键拖动或按住 Shift 拖动可以平移。点建筑可以靠近，也可以直接点全景里的窗户、车轮、床单、花店水壶、报纸和小庭的石钵。

手机竖屏会从茶铺一侧望向街区。单指拖动旋转，双指捏合缩放，双指同向移动可以平移。先点建筑靠近，再点细节互动。两指同时轻点可切换静音。横竖屏切换时会重新取景，保留正在看的建筑。

双击空白处回到所在岸的全景。在茶铺近景可先双击空地，沿书报亭旁的栏杆找到桥。点红邮筒或亲水石阶可以靠近。浏览器后退、前进可重访上一次过桥的位置。键盘可用 1 至 6 选生活街地点，用回车或空格互动，B 过桥，Home 或 Esc 回到当前岸的全景，M 切换静音。声音在首次操作后启用。

## 本地运行

用支持 WebGL 2 的浏览器打开同目录的 `index.html` 即可离线游玩。几何、画面和声音都在这个文件里。

修改源码后，在本目录运行以下命令重新生成试玩页。

```sh
python -B build.py
```

## 继续扩建

- `src/buildings.js` 放建筑和可以点的部件。`src/ground.js` 放地块、道路、庭院和剖面。石阶小庭、石钵和麻雀在 `src/courtyard.js`。各处使用同一套以米为单位的坐标。
- `src/district.js` 定义每栋建筑的分享地址、取景范围、声音位置和点按反馈。新增建筑时，在这里登记它的镜头与交互，并同步更新编号处理、键盘说明和测试。
- `src/engine.js` 负责渲染、点选和远近细节。`src/weather.js` 控制短时阵雨。`src/gestures.js` 和 `src/audio.js` 分别负责手势与音效。
- `cover.webp` 和 `cover-portrait.webp` 是街区实景截图，用于横屏和竖屏的启动画面。正式页面和扩建用的源码都位于本仓库的 `district/` 目录。独立的[原版晴间街角](https://chaccine.github.io/komorebi-street-corner/)由仓库根目录提供。

## 检查改动

安装 Python 的 Playwright 包与 Chromium 后，运行 `python -B checks/check_district.py`。测试会在浏览器中实际点选五栋建筑，检查灯光、车轮、床单、浇水、翻页、纸声和直达链接，再用三倍像素密度的触屏模拟检查捏合、点按和返回。可用 `--chrome` 指定浏览器路径，或传入试玩网址来检查已发布版本。

运行 `python -B checks/check_courtyard.py` 可单独检查石钵点按、麻雀的两个落脚点、水面涟漪、扑翅与鸟叫声，以及静音后再次互动。也可传入街区试玩网址。

河岸与小桥的模型在 `src/riverside.js`。运行 `python -B checks/check_riverside.py` 可检查桌面和两种竖屏宽度下从茶铺过河、拖动、原桥返回和浏览器前进后退，也可传入试玩网址。
