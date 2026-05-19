#!/usr/bin/env node
/* eslint-disable no-console */

// 把 derive.js 产物按集合 upsert 到 CloudBase。
// 同时把 asset-map.json 里图片对应的 cloud:// fileID 写回每条数据的 coverImage。

const fs = require("fs");
const path = require("path");

const OUT_DIR = path.join(__dirname, "output");
const MAP_PATH = path.join(OUT_DIR, "asset-map.json");

const CONCURRENCY = Number(process.env.UPLOAD_CONCURRENCY) || 6;

const COLLECTION_MAP = [
  { collection: "rk_types", file: "types.json" },
  { collection: "rk_personalities", file: "personalities.json" },
  { collection: "rk_terms", file: "terms.json" },
  { collection: "rk_moves", file: "moves.json" },
  { collection: "rk_items", file: "items.json" },
  { collection: "rk_pets", file: "pets.json" },
  { collection: "rk_pet_skills", file: "pet_skills.json" },
  { collection: "rk_eggs", file: "eggs.json" },
  { collection: "rk_bloodline", file: "bloodline_index.json" }
];

function loadEnv() {
  const envPath = path.join(__dirname, ".env");
  if (!fs.existsSync(envPath)) return;
  fs.readFileSync(envPath, "utf8")
    .split(/\r?\n/)
    .forEach((line) => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) return;
      const idx = trimmed.indexOf("=");
      if (idx <= 0) return;
      const key = trimmed.slice(0, idx).trim();
      const value = trimmed.slice(idx + 1).trim().replace(/^"|"$/g, "");
      if (!process.env[key]) process.env[key] = value;
    });
}

function loadAssetMap() {
  if (!fs.existsSync(MAP_PATH)) {
    console.warn("[uploadData] 未找到 asset-map.json，将不会回填图片 fileID。");
    return {};
  }
  return JSON.parse(fs.readFileSync(MAP_PATH, "utf8"));
}

function fillCoverImage(rows, assetMap) {
  return rows.map((row) => {
    if (row.assetPath && assetMap[row.assetPath]) {
      return { ...row, coverImage: assetMap[row.assetPath] };
    }
    return row;
  });
}

async function runWithConcurrency(items, worker, limit) {
  let i = 0;
  const total = items.length;
  const workers = new Array(Math.min(limit, total)).fill(null).map(async () => {
    while (i < total) {
      const idx = i++;
      try {
        await worker(items[idx], idx);
      } catch (error) {
        console.warn(`[uploadData] 写入失败 (#${idx}): ${error.message}`);
      }
      if ((idx + 1) % 100 === 0 || idx + 1 === total) {
        console.log(`[uploadData]  ↳ 已写入 ${idx + 1}/${total}`);
      }
    }
  });
  await Promise.all(workers);
}

async function ensureCollection(app, name) {
  try {
    await app.callFunction({ name: "__noop__" }).catch(() => {});
    const dbm = app.database();
    await dbm.createCollection(name).catch((error) => {
      if (error && (error.code === "ResourceExists" || error.code === "DATABASE_COLLECTION_ALREADY_EXIST")) return;
      throw error;
    });
  } catch (error) {
    console.warn(`[uploadData] 创建集合 ${name} 失败（可能已存在）：${error.message}`);
  }
}

async function upsertRow(app, collection, row) {
  const db = app.database();
  const docId = String(row._id);
  const payload = { ...row };
  delete payload._id;
  try {
    await db.collection(collection).doc(docId).set({ data: payload });
  } catch (error) {
    if (error && error.code === "DATABASE_DOCUMENT_NOT_EXIST") {
      await db.collection(collection).add({ data: { _id: docId, ...payload } });
    } else {
      throw error;
    }
  }
}

async function main() {
  loadEnv();
  const { TCB_SECRET_ID, TCB_SECRET_KEY, TCB_ENV_ID } = process.env;
  if (!TCB_SECRET_ID || !TCB_SECRET_KEY || !TCB_ENV_ID) {
    console.error("[uploadData] 缺少环境变量 TCB_SECRET_ID / TCB_SECRET_KEY / TCB_ENV_ID");
    process.exit(1);
  }

  let tcb;
  try {
    tcb = require("@cloudbase/node-sdk");
  } catch (error) {
    console.error("[uploadData] 缺少依赖 @cloudbase/node-sdk，请运行 npm install。");
    process.exit(1);
  }

  const app = tcb.init({ secretId: TCB_SECRET_ID, secretKey: TCB_SECRET_KEY, env: TCB_ENV_ID });
  const assetMap = loadAssetMap();

  for (const { collection, file } of COLLECTION_MAP) {
    const fullPath = path.join(OUT_DIR, file);
    if (!fs.existsSync(fullPath)) {
      console.warn(`[uploadData] 跳过 ${collection}：未找到 ${file}`);
      continue;
    }

    const rows = fillCoverImage(JSON.parse(fs.readFileSync(fullPath, "utf8")), assetMap);
    console.log(`[uploadData] 写入 ${collection}（${rows.length} 条）...`);
    await ensureCollection(app, collection);
    await runWithConcurrency(rows, (row) => upsertRow(app, collection, row), CONCURRENCY);
  }

  console.log("[uploadData] 完成。下一步：node seedArticles.js");
}

if (require.main === module) {
  main().catch((error) => {
    console.error("[uploadData] 失败：", error);
    process.exit(1);
  });
}

module.exports = { main };
