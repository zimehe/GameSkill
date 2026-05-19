# 洛克王国数据 ETL 脚本

本目录的脚本负责把 `utils/data` 原始 JSON 和 `utils/assets/webp` 图片整体灌入 CloudBase。它**不在小程序运行时执行**，只在本地 Node 环境跑一次（或重跑增量更新）。

## 一、前置准备

1. 安装 Node 16+。
2. 在腾讯云「访问管理 → API 密钥管理」创建一对 `SECRETID / SECRETKEY`，确保该子账号对目标 CloudBase 环境有「数据库读写」「云存储读写」权限。
3. 复制 `.env.example` 为 `.env`，填入：

   ```env
   TCB_SECRET_ID=...
   TCB_SECRET_KEY=...
   TCB_ENV_ID=cloud1-xxxxxxx
   ```

4. 安装依赖：

   ```bash
   cd scripts/rockKingdom
   npm install
   ```

## 二、执行顺序

```bash
node derive.js          # 1. 把 utils/data 转成瘦身 JSON 到 ./output/
node uploadAssets.js    # 2. 把 utils/assets/webp 上传到云存储，生成 asset-map.json
node uploadData.js      # 3. 把 output/*.json upsert 到 CloudBase 集合
node seedArticles.js    # 4. 自动生成 7 篇静态分类文章并写入 articles 集合
```

或一次性跑全部：

```bash
npm run all
```

> 三、四步会在云端创建集合：`rk_pets`、`rk_moves`、`rk_items`、`rk_types`、`rk_personalities`、`rk_pet_skills`、`rk_terms`、`rk_eggs`、`rk_bloodline`。若 CloudBase 没有自动创建权限，请提前在控制台手动建好同名集合。

## 三、断点续传 / 重跑

- `uploadAssets.js` 把已上传的图片记录在 `output/asset-map.json`，重跑会自动跳过。
- `uploadData.js` 使用 `_id` upsert，重跑等同于「更新已有 + 补齐缺失」。
- 想从零开始：删除 `output/` 目录即可。

## 四、产物目录

执行 `derive.js` 后 `output/` 下会有：

| 文件 | 说明 |
| --- | --- |
| `pets.json` | 精灵基础属性 + 蛋孵化 + 资源路径 |
| `moves.json` | 全量技能 |
| `items.json` | 全量道具 |
| `types.json` | 18 种属性 + 克制关系 |
| `personalities.json` | 25 种性格加成 |
| `pet_skills.json` | 精灵可学技能映射（PetSkillIndex） |
| `eggs.json` | 蛋分组 |
| `bloodline_index.json` | 血脉技能反查表 |
| `asset-map.json` | 由 `uploadAssets.js` 写入：相对路径 → cloud:// fileID |

## 五、注意事项

- 全量数据可能上千条文档、几千张图片，请确保腾讯云端 CloudBase 数据库与存储有足够配额。
- 默认并发：图片 8、数据 6。可以用 `UPLOAD_CONCURRENCY=12 node uploadAssets.js` 调高。
- 脚本失败可以反复重跑，不会造成数据重复。
- `utils/data/` 和 `utils/assets/` 已经被根目录 `.gitignore` 与 `project.config.json` 的 `packOptions.ignore` 排除，**不会**进入 Git 仓库或小程序打包。
