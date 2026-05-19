// rkImport
//
// 批量把洛克王国数据写入 9 个 rk_* 集合。
// 数据由本地脚本 `node scripts/rockKingdom/buildImportFunction.js` 拷进 ./data/，
// 部署时一并打包上传，云函数运行时读自身 data/ 目录、按 _id upsert。
//
// 调用方式（微信开发者工具 → 云函数 → 右键 rkImport → 云端测试）：
//   {}                                  // 一次性导入全部集合（推荐）
//   { "collection": "rk_pets" }         // 只导入指定集合（用于排错 / 增量）
//   { "dryRun": true }                  // 只统计不写库，便于体检
//
// 返回示例：
//   { ok: true, report: [{ collection: "rk_types", files: 1, total: 19, imported: 19 }] }

const cloud = require("wx-server-sdk");
const fs = require("fs");
const path = require("path");

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

const db = cloud.database();

const DATA_DIR = path.join(__dirname, "data");
const CONCURRENCY = 20;

// 集合名 ←→ 文件名前缀（toJsonLines.js 可能切片为 *_001.json / *_002.json …）
const COLLECTIONS = [
  { name: "rk_types", prefix: "rk_types" },
  { name: "rk_personalities", prefix: "rk_personalities" },
  { name: "rk_terms", prefix: "rk_terms" },
  { name: "rk_moves", prefix: "rk_moves" },
  { name: "rk_eggs", prefix: "rk_eggs" },
  { name: "rk_pet_skills", prefix: "rk_pet_skills" },
  { name: "rk_pets", prefix: "rk_pets" },
  { name: "rk_items", prefix: "rk_items" },
  { name: "rk_bloodline", prefix: "rk_bloodline" }
];

function matchFile(name, prefix) {
  if (!name.endsWith(".json")) return false;
  if (name === `${prefix}.json`) return true;
  return name.startsWith(`${prefix}_`) && /_\d+\.json$/.test(name);
}

function readNdjson(filePath) {
  const text = fs.readFileSync(filePath, "utf8");
  return text.split(/\r?\n/).filter((line) => line.trim()).map((line) => JSON.parse(line));
}

async function upsertOne(collectionName, record) {
  const { _id, ...rest } = record;
  const collection = db.collection(collectionName);
  if (_id) {
    // doc.set 在文档不存在时也会创建，这就是 CloudBase 的 upsert 语义
    await collection.doc(_id).set({ data: rest });
  } else {
    await collection.add({ data: rest });
  }
}

async function batchUpsert(collectionName, records, { dryRun }) {
  if (dryRun) return records.length;
  let success = 0;
  const failures = [];
  for (let i = 0; i < records.length; i += CONCURRENCY) {
    const batch = records.slice(i, i + CONCURRENCY);
    const results = await Promise.allSettled(batch.map((r) => upsertOne(collectionName, r)));
    results.forEach((res, idx) => {
      if (res.status === "fulfilled") {
        success += 1;
      } else {
        failures.push({ id: batch[idx]._id, error: String(res.reason && res.reason.message || res.reason) });
      }
    });
  }
  return { success, failures };
}

exports.main = async (event = {}) => {
  if (!fs.existsSync(DATA_DIR)) {
    return {
      ok: false,
      error: "./data 目录不存在。请先在本地执行 `node scripts/rockKingdom/buildImportFunction.js` 并重新上传部署 rkImport。"
    };
  }

  const allFiles = fs.readdirSync(DATA_DIR);
  const wantedName = event.collection || null;
  const dryRun = !!event.dryRun;

  const targets = wantedName
    ? COLLECTIONS.filter((c) => c.name === wantedName)
    : COLLECTIONS;

  if (!targets.length) {
    return { ok: false, error: `未知集合：${wantedName}。可选值：${COLLECTIONS.map((c) => c.name).join(", ")}` };
  }

  const report = [];
  for (const target of targets) {
    const files = allFiles.filter((name) => matchFile(name, target.prefix)).sort();
    if (!files.length) {
      report.push({ collection: target.name, files: 0, skipped: "no data files bundled" });
      continue;
    }
    let total = 0;
    let success = 0;
    const allFailures = [];
    for (const fileName of files) {
      const records = readNdjson(path.join(DATA_DIR, fileName));
      total += records.length;
      const result = await batchUpsert(target.name, records, { dryRun });
      if (dryRun) {
        success += result;
      } else {
        success += result.success;
        if (result.failures.length) allFailures.push(...result.failures);
      }
    }
    report.push({
      collection: target.name,
      files: files.length,
      total,
      imported: success,
      ...(allFailures.length ? { failures: allFailures.slice(0, 10), failureCount: allFailures.length } : {})
    });
  }

  return { ok: true, dryRun, report };
};
