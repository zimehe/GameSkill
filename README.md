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

- `games`
- `categories`
- `articles`
- `favorites`
- `history`
- `events`
- `admins`

建议权限：

- `games`、`categories`、`articles`：所有用户可读，仅管理员云函数可写。
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
