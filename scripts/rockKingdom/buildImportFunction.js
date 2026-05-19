#!/usr/bin/env node
/* eslint-disable no-console */

// 把 output/import/*.json（NDJSON）拷贝到 cloudfunctions/rkImport/data/。
// 部署 rkImport 云函数时，data/ 会跟着上传，函数运行时读自己的 data/ 目录批量灌库。
//
// 流程：
//   1. node derive.js
//   2. node toJsonLines.js
//   3. node buildImportFunction.js   ← 本脚本
//   4. 微信开发者工具 → cloudfunctions/rkImport → 右键「上传并部署：云端安装依赖」
//   5. 云函数面板 → 测试 → event 输入 {} → 调用

const fs = require("fs");
const path = require("path");

const SRC = path.join(__dirname, "output", "import");
const DEST = path.join(__dirname, "..", "..", "cloudfunctions", "rkImport", "data");

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function clearJsonFiles(dir) {
  if (!fs.existsSync(dir)) return;
  for (const name of fs.readdirSync(dir)) {
    if (name.endsWith(".json")) fs.unlinkSync(path.join(dir, name));
  }
}

function main() {
  if (!fs.existsSync(SRC)) {
    console.error("[buildImportFunction] 找不到 output/import/，请先执行：");
    console.error("    node derive.js && node toJsonLines.js");
    process.exit(1);
  }
  ensureDir(DEST);
  clearJsonFiles(DEST);

  let totalBytes = 0;
  let fileCount = 0;
  for (const name of fs.readdirSync(SRC).sort()) {
    if (!name.endsWith(".json")) continue;
    const src = path.join(SRC, name);
    const dst = path.join(DEST, name);
    fs.copyFileSync(src, dst);
    const size = fs.statSync(src).size;
    totalBytes += size;
    fileCount += 1;
    console.log(`  copy ${name}  (${(size / 1024).toFixed(1)} KB)`);
  }

  const mb = (totalBytes / 1024 / 1024).toFixed(2);
  console.log(`\n[buildImportFunction] 完成：${fileCount} 个文件 / ${mb} MB → ${DEST}`);
  if (totalBytes > 40 * 1024 * 1024) {
    console.warn("⚠️  接近云函数部署 50 MB 上限，请考虑减少切片或 dryRun 检查");
  }
  console.log("下一步：微信开发者工具 → 右键 cloudfunctions/rkImport → 上传并部署：云端安装依赖。");
  console.log("       部署完成后 → 云函数列表 → rkImport → 测试 → event 填 {} → 调用。");
}

if (require.main === module) {
  try {
    main();
  } catch (error) {
    console.error("[buildImportFunction] 失败：", error.message);
    process.exit(1);
  }
}

module.exports = { main };
