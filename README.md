# 云玩家游客图鉴 V2 小程序

微信原生小程序 + 云开发 CloudBase 的游戏攻略工具书。当前内容浏览版保留搜索、分类、文章详情和洛克王国图鉴页，收藏、浏览历史、分享统计和隐藏管理页已暂时移除。

## 本地打开

1. 用微信开发者工具导入本目录。
2. 在 `project.config.json` 中把 `appid` 替换为真实小程序 AppID。
3. 现在默认启用 `useMockData: true`，不用配置云数据库也能先体验页面。
4. 要切回云端数据时，在 `app.js` 中把 `useMockData` 改为 `false`，并确认 `cloudEnvId` 是真实云开发环境 ID。
5. 流量主开通后，在 `pages/home/home.js` 中填入 Banner 广告位 ID，并把 `showBannerAd` 改为 `true`。

## 云数据库集合

创建以下集合，并按小程序需要配置读取权限：

通用集合：

- `games`
- `categories`
- `articles`
- `favorites`
- `history`
- `events`
- `admins`

洛克王国专属集合（由 `scripts/rockKingdom/` 灌入）：

- `rk_pets` — 精灵基础属性 / 蛋孵化 / 资源路径
- `rk_moves` — 技能（属性 / 威力 / 能量 / 说明）
- `rk_items` — 道具
- `rk_types` — 18 种属性 + 克制 / 抵抗
- `rk_personalities` — 25 种性格加成
- `rk_pet_skills` — 精灵可学技能映射（PetSkillIndex）
- `rk_terms` — 游戏术语 / 印记 / 状态
- `rk_eggs` — 蛋分组 / 稀有蛋
- `rk_bloodline` — 血脉技能反查

建议权限：

- `games`、`categories`、`articles`、`rk_*`：所有用户可读，仅管理员云函数可写。
- `favorites`、`history`、`events`：通过云函数写入。
- `admins`：仅管理员可读写。初始化后把 `replace-with-your-openid` 替换为你的 openid。

## 云函数

当前内容浏览版只需要上传并部署以下云函数：

- `seedRockKingdomEntries`：只初始化洛克王国首页入口和 4 个可用图鉴入口，并清理旧的占位分类 / 占位文章。
- `rkImport`：批量灌入洛克王国 9 个 `rk_*` 集合。数据通过 `npm run build-import-fn` 拷到 `cloudfunctions/rkImport/data/` 一起部署，调用 `{}` 一次即可。

以下增长功能云函数已从页面入口中移除，当前不需要部署：`getOpenId`、`toggleFavorite`、`trackEvent`、`adminArticle`。以后要恢复收藏、历史、统计或管理后台时再重新打开对应页面入口。

## 初始化内容

在微信开发者工具中上传并部署 `cloudfunctions/seedContent` 云函数，然后运行该云函数。它会写入：

- 3 个游戏
- 9 个分类
- 9 篇 V2 示例攻略

示例攻略中的正文是可替换的 HTML 字符串，会通过详情页 `rich-text` 渲染。

如果只想补洛克王国入口，不想初始化其它游戏，可以上传并运行 `cloudfunctions/seedRockKingdomEntries`。它只写入：

- 1 条 `games`：`game-rock-kingdom`
- 4 条 `categories`：精灵列表、技能列表、技能筛选精灵、克制关系表
- 清理历史遗留的洛克王国占位文章，首页不再展示「推荐攻略 / 最近更新」

同时会删除旧的无云端功能入口：蛋尺寸查询、蛋组配对、PVP属性伤害计算、阵容列表、道具图鉴、性格特点、技能词条。

调用 event 填 `{}` 即可，重复调用会按 `_id` 覆盖更新。

## 已暂时移除的增长功能

为了先保证云端内容浏览链路稳定，当前版本暂时移除了收藏、浏览历史、分享统计和隐藏管理入口。小程序主路由只保留首页、搜索、分类、文章详情和洛克王国图鉴页。

## 洛克王国专属图鉴页

小程序新增 5 个洛克王国数据相关页面（路由在 [app.json](app.json)）：

| 路由 | 用途 | 数据源 |
| --- | --- | --- |
| `pages/rock-kingdom/pet-list/pet-list` | 精灵列表（搜索 + 属性筛选 + 分页） | `rk_pets` |
| `pages/rock-kingdom/pet-detail/pet-detail?id=xxx` | 精灵详情（属性 / 技能 / 蛋孵化 tab） | `rk_pets` + `rk_pet_skills` + `rk_moves` |
| `pages/rock-kingdom/skill-list/skill-list` | 技能列表（属性 + 类别筛选） | `rk_moves` |
| `pages/rock-kingdom/skill-filter/skill-filter` | 技能筛选精灵（按技能反查） | `rk_moves` + `rk_pet_skills` + `rk_pets` |
| `pages/rock-kingdom/type-counter/type-counter` | 18×18 属性克制表 | `rk_types` |

这些页面通过 [utils/rk/index.js](utils/rk/index.js) 读数据，未配置云开发时会读 [utils/rk/mock.js](utils/rk/mock.js) 的极小样例（20 只精灵 / 20 个技能 / 18 个属性 / 12 个性格）让首屏直接可用。

> 图标显示原理：精灵 / 道具记录里只存 `assetPath`（云端相对路径）。`app.js → globalData.cloudFileIDPrefix` 配好之后，[utils/rk/index.js](utils/rk/index.js) 会自动给每条记录补出完整的 `cloud://` fileID，`<image>` 标签直接渲染。

在 [pages/category/category.js](pages/category/category.js) 中，洛克王国当前只保留 4 个有实际页面支撑的入口：精灵列表、技能列表、技能筛选精灵、克制表。列表区会显示「进入图鉴」CTA 卡，跳转到对应专属页。

## 数据 ETL 脚本（本地一次性执行）

`utils/data/` 与 `utils/assets/` 是「构建源」，不会进 Git、不会进小程序包（已在 `.gitignore` 与 `project.config.json` 的 `packOptions.ignore` 排除）。提供两条路径：

### 路径 A（强烈推荐 · 4 步搞定，无需 API 密钥）

利用 `rkImport` 云函数把全部 9 个 `rk_*` 集合一次性灌完：

```bash
cd scripts/rockKingdom
npm run wechat-prep         # = derive + to-jsonl + build-import-fn
                            # 数据被拷到 cloudfunctions/rkImport/data/
```

然后在微信开发者工具里：

1. 云开发 → 数据库 新建 9 个 `rk_*` 集合（`rk_pets` / `rk_moves` / `rk_items` / `rk_types` / `rk_personalities` / `rk_pet_skills` / `rk_terms` / `rk_eggs` / `rk_bloodline`），权限「所有用户可读」。
2. 右键 `cloudfunctions/rkImport` → 「上传并部署：云端安装依赖」。
3. 云开发 → 云函数 → `rkImport` → 测试 → event 填 `{}` → 调用。约 10–30 秒返回每个集合的导入条数。
4. 云开发 → 存储 → 上传文件夹，把 `utils/assets/webp/` 整个上传到云端目录 `rock-kingdom/`。上传完后点开任一图片，复制 File ID 中 `rock-kingdom/...` 之前的前缀，填到 [app.js](app.js) 的 `globalData.cloudFileIDPrefix`。

完成后所有精灵 / 道具 / 技能图标会自动用 `assetPath` 拼出 `cloud://` fileID 直接显示。

### 路径 B（备用 · 控制台逐文件导入）

如果你不想部署云函数，可以在微信控制台「数据库 → 集合 → 导入数据 → JSON」逐个上传 `scripts/rockKingdom/output/import/*.json`。详情见 [scripts/rockKingdom/README.md](scripts/rockKingdom/README.md)。

### 路径 C（需要腾讯云 API 密钥，速度最快）

```bash
cd scripts/rockKingdom
cp .env.example .env        # 填入 TCB_SECRET_ID / TCB_SECRET_KEY / TCB_ENV_ID
npm install
npm run all                 # = derive → uploadAssets → uploadData → seedArticles
```

三条路径的完整对比、断点续传、报错排查都在 [scripts/rockKingdom/README.md](scripts/rockKingdom/README.md)。

## 文章里的 cloud:// 图片

`articles` 集合里的 `coverImage` / `imageUrls` / `contentHtml` 内的 `cloud://...` fileID，在 [pages/detail/detail.js](pages/detail/detail.js) 加载时会自动调用 `wx.cloud.getTempFileURL` 转换为可访问的 https URL，并替换正文 HTML 中的所有 fileID。所以管理员保存文章时可以直接写 fileID，无需手动取临时链接。
