# 云玩家游客图鉴 V2 小程序

微信原生小程序 + 云开发 CloudBase 的游戏攻略工具书。当前已包含搜索、收藏、浏览历史、分享统计和隐藏管理页。

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

需要上传并部署以下云函数：

- `seedContent`：初始化游戏、分类、攻略和管理员占位数据。
- `getOpenId`：获取当前用户 openid。
- `toggleFavorite`：收藏/取消收藏。
- `trackEvent`：记录浏览、分享、搜索和历史。
- `adminArticle`：管理员新增或编辑攻略。

## 初始化内容

在微信开发者工具中上传并部署 `cloudfunctions/seedContent` 云函数，然后运行该云函数。它会写入：

- 3 个游戏
- 9 个分类
- 9 篇 V2 示例攻略

示例攻略中的正文是可替换的 HTML 字符串，会通过详情页 `rich-text` 渲染。

## 隐藏管理入口

本地模拟数据模式下，在首页连续点击标题“云玩家游客图鉴”5 次即可进入管理页。云端模式下需要先把你的 openid 写入 `admins` 集合。

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

在 [pages/category/category.js](pages/category/category.js) 中，当选中 4 个「列表/筛选类」分类（精灵列表、技能列表、技能筛选精灵、克制表）时，列表区会变成「进入图鉴」CTA 卡，跳转到对应专属页。其它洛克王国分类（性格、术语、蛋尺寸等）依然走原有文章 UI。

## 数据 ETL 脚本（本地一次性执行）

`utils/data/` 与 `utils/assets/` 是「构建源」，不会进 Git、不会进小程序包（已在 `.gitignore` 与 `project.config.json` 的 `packOptions.ignore` 排除）。要把数据灌进 CloudBase，执行：

```bash
cd scripts/rockKingdom
cp .env.example .env       # 填入 TCB_SECRET_ID / TCB_SECRET_KEY / TCB_ENV_ID
npm install
npm run all                # = derive → uploadAssets → uploadData → seedArticles
```

详情见 [scripts/rockKingdom/README.md](scripts/rockKingdom/README.md)。

## 文章里的 cloud:// 图片

`articles` 集合里的 `coverImage` / `imageUrls` / `contentHtml` 内的 `cloud://...` fileID，在 [pages/detail/detail.js](pages/detail/detail.js) 加载时会自动调用 `wx.cloud.getTempFileURL` 转换为可访问的 https URL，并替换正文 HTML 中的所有 fileID。所以管理员保存文章时可以直接写 fileID，无需手动取临时链接。
