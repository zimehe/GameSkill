# 洛克王国数据 ETL 脚本

本目录的脚本负责把 `utils/data` 原始 JSON 和 `utils/assets/webp` 图片整体灌入 CloudBase。它**不在小程序运行时执行**，只在本地 Node 环境跑一次（或重跑增量更新）。

提供三条路径，从易到难：

- **路径 A（强烈推荐 · 4 步搞定）**：把数据打包进 `rkImport` 云函数，部署一次、调用一次，全量灌库。
- 路径 B（备用 · 控制台逐文件导入）：把 NDJSON 切片在微信控制台「数据库 → 导入」逐文件上传。
- 路径 C（可选 · 速度最快）：用 `@cloudbase/node-sdk` 本地脚本（需要去腾讯云开 API 密钥）。

> 微信云开发底层就是腾讯云 CloudBase。路径 A / B 完全不需要碰腾讯云控制台。

## 共同步骤：本地数据派生

```bash
cd scripts/rockKingdom
node derive.js
```

会在 `output/` 下生成 9 个标准化 JSON：`pets.json` / `moves.json` / `items.json` / `types.json` / `personalities.json` / `pet_skills.json` / `eggs.json` / `terms.json` / `bloodline_index.json`，总共约 7 MB。

---

## 路径 A：rkImport 云函数一键灌库（推荐）

### A.1 本地准备数据

```bash
cd scripts/rockKingdom
npm run wechat-prep      # = derive + to-jsonl + build-import-fn
```

这条命令做了三件事：
1. `derive.js` 把 `utils/data/` 派生为 9 个标准 JSON
2. `toJsonLines.js` 转为 NDJSON 并切片
3. `buildImportFunction.js` 把切片 NDJSON 拷到 `cloudfunctions/rkImport/data/`

### A.2 在微信开发者工具创建集合

进入「云开发 → 数据库」，新建 9 个集合，权限选「所有用户可读」：

`rk_pets` · `rk_moves` · `rk_items` · `rk_types` · `rk_personalities` · `rk_pet_skills` · `rk_terms` · `rk_eggs` · `rk_bloodline`

### A.3 上传并部署 rkImport 云函数

1. 微信开发者工具左侧 → 展开 `cloudfunctions/` 目录。
2. **右键 `rkImport` → 「上传并部署：云端安装依赖」**（重要：选这个不要选「不安装依赖」，否则缺 `wx-server-sdk`）。
3. 等待几十秒看到「上传成功」。

### A.4 触发云函数灌库

1. 「云开发 → 云函数」面板，找到 `rkImport`。
2. 点击「云端测试」。
3. event 输入框填：

   ```json
   {}
   ```

4. 点「调用」。约 10–30 秒后返回类似：

   ```json
   {
     "ok": true,
     "report": [
       { "collection": "rk_types", "files": 1, "total": 19, "imported": 19 },
       { "collection": "rk_pets", "files": 3, "total": 1015, "imported": 1015 },
       ...
     ]
   }
   ```

如果某个集合超时，单独再调一次：`{ "collection": "rk_items" }`。
体检模式不实际写库：`{ "dryRun": true }`。

### A.5 上传图片 + 配置 cloudFileIDPrefix

数据进库后，还差图片：

1. 云开发 → 存储 → 上传 → 选「上传文件夹」→ 选本地 `utils/assets/webp/`，**云端路径填 `rock-kingdom/`**。
2. 上传完成后，点开任意一张已上传的图（比如 `rock-kingdom/friends/JL_miaomiao.webp`），复制 File ID。
3. 截取 `rock-kingdom/...` 之前的部分（含末尾 `/`），填到 [app.js](../../app.js) 的 `globalData.cloudFileIDPrefix`。

完成 ✅ 把 `app.js` 的 `useMockData` 改 `false`，重启模拟器看效果。

---

## 路径 B：手动逐文件导入

如果你不想部署云函数，也可以走纯控制台流程。

### B.1 派生 JSON 并切成「NDJSON」导入文件

```bash
node derive.js
node toJsonLines.js
```

`toJsonLines.js` 会把 `output/*.json`（标准 JSON 数组）转成 `output/import/*.json`（**NDJSON / JSON Lines：每行一个独立 JSON 对象，文件外层没有 `[]`**）。

> 微信开发者工具「导入数据」窗口只让选 `.json` 后缀，但**内容**要求的就是这种「每行一条文档」的 NDJSON 格式 —— 不是标准 JSON 数组。直接把 derive 产生的数组喂进去会失败。

超过 500 条的集合会自动切片为 `rk_items_001.json`、`rk_items_002.json` ……

### B.2 导入数据到云数据库

1. 打开微信开发者工具，左上角点「云开发」。
2. 进入「数据库」标签。
3. 对于每个集合：
   - 点「+」新建集合（集合名：`rk_pets`、`rk_moves`、`rk_items`、`rk_types`、`rk_personalities`、`rk_pet_skills`、`rk_terms`、`rk_eggs`、`rk_bloodline`），选择「自定义安全规则」→ 只读。
   - 选中集合 → 上方「导入」→ **数据类型选 JSON** → 选 `scripts/rockKingdom/output/import/${集合名}.json`（或多片中的每片）。
   - 冲突处理选「Insert / Upsert」（默认）。
   - 如果导入失败提示「JSON 解析错误」，确认你选的是 `output/import/` 里的文件（NDJSON 格式），**而不是** `output/` 根目录里的原始数组 JSON。

### B.3 上传图片 + 配置 cloudFileIDPrefix

同路径 A.5。

---

## 路径 C：本地脚本（@cloudbase/node-sdk）

适合想一键全量灌库 + 一键全量上传图片的场景。

### C.1 准备腾讯云 API 密钥

1. 访问 https://console.cloud.tencent.com/cam/capi（用微信扫码登录即可，无需新注册）。
2. 新建一对「SecretId / SecretKey」，并确保该账号对你的 CloudBase 环境有「数据库读写」「云存储读写」权限。
3. 复制 `.env.example` 为 `.env`，填入：
   ```env
   TCB_SECRET_ID=...
   TCB_SECRET_KEY=...
   TCB_ENV_ID=cloud1-d7gr6v1ap412a239a
   ```

### C.2 安装依赖 + 一键灌库

```bash
cd scripts/rockKingdom
npm install
npm run all          # = derive → uploadAssets → uploadData → seedArticles
```

### C.3 同样要配 cloudFileIDPrefix

路径 C 也需要 A.5 那一步（提取一次前缀）。不同的是脚本 `uploadAssets.js` 会把 fileID 写到 `output/asset-map.json`，`uploadData.js` 会把 fileID 直接回填到每条 DB 记录的 `coverImage`。所以即使不配前缀，图片也能显示，配前缀只是作为冗余/备份。

---

## npm 脚本速查

| 命令 | 路径 | 说明 |
| --- | --- | --- |
| `npm run derive` | 全部 | 仅生成 `output/*.json` |
| `npm run to-jsonl` | A / B | 生成 `output/import/*.json`（NDJSON，按 500 条切片） |
| `npm run build-import-fn` | A | 把 NDJSON 拷到 `cloudfunctions/rkImport/data/` |
| `npm run wechat-prep` | A | derive + to-jsonl + build-import-fn 一次完成 |
| `npm run upload-assets` | C | 上传 2631 张 webp 到云存储 |
| `npm run upload-data` | C | upsert 9 个 rk_* 集合 |
| `npm run seed-articles` | C | 写入 7 篇静态文章 |
| `npm run all` | C | 一键全跑 |

---

## 产物目录

执行 `derive.js` 后：

| 文件 | 说明 |
| --- | --- |
| `output/pets.json` | 1015 只精灵基础属性 + 蛋孵化 |
| `output/moves.json` | 全量技能（475 条） |
| `output/items.json` | 全量道具（4268 条） |
| `output/types.json` | 18 种属性 + 克制关系 |
| `output/personalities.json` | 25 种性格加成 |
| `output/pet_skills.json` | 精灵可学技能映射 |
| `output/eggs.json` | 蛋分组 |
| `output/bloodline_index.json` | 血脉技能反查 |
| `output/import/*.json` | 微信控制台「导入数据 → JSON」格式（NDJSON，每行一条文档） |
| `output/asset-map.json` | 路径 B 上传后的图片 fileID 映射 |

## 断点续传 / 重跑

- 路径 A：`rkImport` 用 `doc(_id).set()`（CloudBase 的 upsert 语义），重复调用等于「覆盖已有 + 补齐缺失」。某一集合失败时单独再调 `{ "collection": "rk_xxx" }`。
- 路径 B：在控制台导入时选 Upsert，可重复导。
- 路径 C：`uploadAssets.js` 会跳过 `asset-map.json` 中已记录的文件；`uploadData.js` 按 `_id` upsert，重跑等同于「更新已有 + 补齐缺失」。
- 想从零开始：删除 `output/` 目录。

## 注意

- `utils/data/` 和 `utils/assets/` 已经被根目录 `.gitignore` 与 `project.config.json` 的 `packOptions.ignore` 排除，**不会**进入 Git 仓库或小程序打包。
- 微信 CloudBase 控制台导入对单个 JSON 文件体积有限制（通常 100 MB），脚本默认切片 500 行，单片远低于上限。
- 上传图片完成后，第一次用小程序如果图片不显示，多半是 `cloudFileIDPrefix` 没填或填错，按 A.4 步骤检查。
