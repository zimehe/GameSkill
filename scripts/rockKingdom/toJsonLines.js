#!/usr/bin/env node
/* eslint-disable no-console */

// 把 derive.js 产物（output/*.json，里头是 JSON 数组）转成「JSON Lines」格式，
// 每行一条 JSON 文档。这是微信开发者工具 → 云开发 → 数据库 → 集合 → 导入
// 所要求的格式：UI 只接受 .json 后缀，但内部要求 NDJSON / JSON Lines。
//
// 超过 SPLIT_SIZE 条记录的集合会自动切片为 *_001.json / *_002.json …
// 这样既避免单文件过大，也方便重跑只导失败的那片。

const fs = require("fs");
const path = require("path");

const OUT_DIR = path.join(__dirname, "output");
const IMPORT_DIR = path.join(OUT_DIR, "import");
const SPLIT_SIZE = Number(process.env.JSONL_SPLIT_SIZE) || 500;

// derive 产物 → 目标集合名（注意：seedArticles 已经直接写到 articles 集合，
// 不需要在控制台里再次导入）
const FILES = [
  { input: "types.json", collection: "rk_types" },
  { input: "personalities.json", collection: "rk_personalities" },
  { input: "terms.json", collection: "rk_terms" },
  { input: "moves.json", collection: "rk_moves" },
  { input: "items.json", collection: "rk_items" },
  { input: "pets.json", collection: "rk_pets" },
  { input: "pet_skills.json", collection: "rk_pet_skills" },
  { input: "eggs.json", collection: "rk_eggs" },
  { input: "bloodline_index.json", collection: "rk_bloodline" }
];

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function chunk(arr, size) {
  const result = [];
  for (let i = 0; i < arr.length; i += size) {
    result.push(arr.slice(i, i + size));
  }
  return result;
}

function pad(num, width = 3) {
  return String(num).padStart(width, "0");
}

function writeNdjson(name, rows) {
  const target = path.join(IMPORT_DIR, name);
  // 关键：每行一个 JSON 对象，文件不要被 [] 包裹、行尾不要逗号。
  // 微信开发者工具「导入数据 → JSON」选项要求的就是 NDJSON / JSON Lines 格式。
  fs.writeFileSync(target, rows.map((row) => JSON.stringify(row)).join("\n") + "\n");
  const size = (fs.statSync(target).size / 1024).toFixed(1);
  console.log(`  → ${name}  (${rows.length} 条, ${size} KB)`);
}

function main() {
  if (!fs.existsSync(OUT_DIR)) {
    console.error("[toJsonLines] 找不到 output/，请先执行 node derive.js");
    process.exit(1);
  }
  // 旧版本会写到 output/jsonl/，新版本统一写到 output/import/。
  // 留一句话提示，避免老用户误用旧目录。
  const legacyDir = path.join(OUT_DIR, "jsonl");
  if (fs.existsSync(legacyDir)) {
    console.log(`[toJsonLines] 检测到旧目录 ${legacyDir}，可以手工删除。新文件会写到 ${IMPORT_DIR}`);
  }
  ensureDir(IMPORT_DIR);

  for (const { input, collection } of FILES) {
    const full = path.join(OUT_DIR, input);
    if (!fs.existsSync(full)) {
      console.warn(`[toJsonLines] 跳过 ${input}：文件不存在`);
      continue;
    }
    const rows = JSON.parse(fs.readFileSync(full, "utf8"));
    console.log(`[toJsonLines] ${collection}  ←  ${input}  (${rows.length} 条)`);
    if (rows.length <= SPLIT_SIZE) {
      writeNdjson(`${collection}.json`, rows);
    } else {
      const slices = chunk(rows, SPLIT_SIZE);
      slices.forEach((slice, idx) => {
        writeNdjson(`${collection}_${pad(idx + 1)}.json`, slice);
      });
    }
  }

  console.log(`\n[toJsonLines] 完成。文件已写到 ${IMPORT_DIR}`);
  console.log("下一步：微信开发者工具 → 云开发 → 数据库 → 选集合 → 导入 → 类型选 JSON → 选这些 .json 文件。");
  console.log("注意：里头是 NDJSON（每行一个对象），不是 JSON 数组，这是微信控制台要求的格式。");
}

if (require.main === module) {
  try {
    main();
  } catch (error) {
    console.error("[toJsonLines] 失败：", error.message);
    process.exit(1);
  }
}

module.exports = { main };
