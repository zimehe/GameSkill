#!/usr/bin/env node
/* eslint-disable no-console */

// 把 utils/assets/webp 下所有 webp 图片上传到 CloudBase 云存储。
// 支持断点续传：已上传过的文件会保留在 output/asset-map.json，重跑会自动跳过。

const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..", "..");
const ASSET_DIR = path.join(ROOT, "utils", "assets", "webp");
const OUT_DIR = path.join(__dirname, "output");
const MAP_PATH = path.join(OUT_DIR, "asset-map.json");

const REMOTE_PREFIX = "rock-kingdom";
const CONCURRENCY = Number(process.env.UPLOAD_CONCURRENCY) || 8;

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

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function loadMap() {
  if (!fs.existsSync(MAP_PATH)) return {};
  try {
    return JSON.parse(fs.readFileSync(MAP_PATH, "utf8"));
  } catch (error) {
    console.warn("[uploadAssets] asset-map.json 损坏，将重新生成：", error.message);
    return {};
  }
}

function saveMap(map) {
  ensureDir(OUT_DIR);
  fs.writeFileSync(MAP_PATH, JSON.stringify(map, null, 2));
}

function walkWebp(dir, base = dir) {
  const result = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      result.push(...walkWebp(full, base));
    } else if (entry.isFile() && entry.name.toLowerCase().endsWith(".webp")) {
      const rel = path.relative(base, full).split(path.sep).join("/");
      result.push({ localPath: full, rel });
    }
  }
  return result;
}

async function uploadOne(app, file) {
  const remote = `${REMOTE_PREFIX}/${file.rel}`;
  const res = await app.uploadFile({
    cloudPath: remote,
    fileContent: fs.createReadStream(file.localPath)
  });
  return res.fileID;
}

async function runWithConcurrency(items, worker, limit) {
  const queue = items.slice();
  const inflight = [];
  let processed = 0;
  const total = items.length;

  async function next() {
    if (queue.length === 0) return;
    const item = queue.shift();
    const promise = (async () => {
      try {
        await worker(item);
      } catch (error) {
        console.warn(`[uploadAssets] 上传失败 ${item.rel}: ${error.message}`);
      } finally {
        processed += 1;
        if (processed % 50 === 0 || processed === total) {
          console.log(`[uploadAssets] 进度 ${processed}/${total}`);
        }
      }
    })();
    inflight.push(promise);
    promise.finally(() => {
      inflight.splice(inflight.indexOf(promise), 1);
    });
    if (inflight.length >= limit) {
      await Promise.race(inflight);
    }
    await next();
  }

  await next();
  await Promise.all(inflight);
}

async function main() {
  loadEnv();
  const { TCB_SECRET_ID, TCB_SECRET_KEY, TCB_ENV_ID } = process.env;
  if (!TCB_SECRET_ID || !TCB_SECRET_KEY || !TCB_ENV_ID) {
    console.error("[uploadAssets] 缺少环境变量 TCB_SECRET_ID / TCB_SECRET_KEY / TCB_ENV_ID");
    console.error("  复制 .env.example 为 .env 后填入，或直接 export 后再执行。");
    process.exit(1);
  }

  if (!fs.existsSync(ASSET_DIR)) {
    console.error(`[uploadAssets] 找不到资源目录：${ASSET_DIR}`);
    process.exit(1);
  }

  let tcb;
  try {
    tcb = require("@cloudbase/node-sdk");
  } catch (error) {
    console.error("[uploadAssets] 缺少依赖 @cloudbase/node-sdk，请在 scripts/rockKingdom 下运行 npm install。");
    process.exit(1);
  }

  const app = tcb.init({
    secretId: TCB_SECRET_ID,
    secretKey: TCB_SECRET_KEY,
    env: TCB_ENV_ID
  });

  const files = walkWebp(ASSET_DIR);
  console.log(`[uploadAssets] 待处理文件 ${files.length} 个，并发 ${CONCURRENCY}。`);

  const map = loadMap();
  let saveCounter = 0;
  const toUpload = files.filter((file) => !map[file.rel]);
  console.log(`[uploadAssets] 跳过已上传 ${files.length - toUpload.length} 个，本次需上传 ${toUpload.length} 个。`);

  await runWithConcurrency(
    toUpload,
    async (file) => {
      const fileID = await uploadOne(app, file);
      map[file.rel] = fileID;
      saveCounter += 1;
      if (saveCounter % 50 === 0) {
        saveMap(map);
      }
    },
    CONCURRENCY
  );

  saveMap(map);
  console.log(`[uploadAssets] 完成，asset-map.json 共 ${Object.keys(map).length} 条记录。`);
}

if (require.main === module) {
  main().catch((error) => {
    console.error("[uploadAssets] 失败：", error);
    process.exit(1);
  });
}

module.exports = { main };
