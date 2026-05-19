#!/usr/bin/env node
/* eslint-disable no-console */

// 根据 derive 产物 + asset-map 生成洛克王国静态分类文章并写入 articles 集合。
// 覆盖 7 个分类：
//   - cat-rk-nature-traits  性格特点
//   - cat-rk-skill-terms    技能词条
//   - cat-rk-egg-size       蛋尺寸查询
//   - cat-rk-egg-group-pair 蛋组配对
//   - cat-rk-pvp-damage     PVP 属性伤害计算
//   - cat-rk-team-list      阵容列表（占位，后续由 admin 维护）
//   - cat-rk-item-index     道具图鉴

const fs = require("fs");
const path = require("path");

const OUT_DIR = path.join(__dirname, "output");
const MAP_PATH = path.join(OUT_DIR, "asset-map.json");

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

function loadJson(name) {
  const full = path.join(OUT_DIR, name);
  if (!fs.existsSync(full)) {
    console.warn(`[seedArticles] 缺少 ${name}，对应文章可能不完整。`);
    return [];
  }
  return JSON.parse(fs.readFileSync(full, "utf8"));
}

function loadAssetMap() {
  if (!fs.existsSync(MAP_PATH)) return {};
  return JSON.parse(fs.readFileSync(MAP_PATH, "utf8"));
}

function escapeHtml(value) {
  return String(value == null ? "" : value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function pct(value) {
  if (!value) return "0%";
  return `${value > 0 ? "+" : ""}${Math.round(value * 100)}%`;
}

function buildNatureArticle(personalities) {
  const rows = personalities
    .slice()
    .sort((a, b) => a.personalityId - b.personalityId)
    .map((p) => {
      const mods = [
        ["体力", p.hpModPct],
        ["物攻", p.phyAtkModPct],
        ["魔攻", p.magAtkModPct],
        ["物防", p.phyDefModPct],
        ["魔防", p.magDefModPct],
        ["速度", p.spdModPct]
      ];
      const positives = mods.filter(([, v]) => v > 0).map(([k, v]) => `${k} ${pct(v)}`).join(" / ") || "—";
      const negatives = mods.filter(([, v]) => v < 0).map(([k, v]) => `${k} ${pct(v)}`).join(" / ") || "—";
      return `<tr><td>${escapeHtml(p.nameZh || p.name)}</td><td>${positives}</td><td>${negatives}</td></tr>`;
    })
    .join("");

  return `<h2>洛克王国 25 种性格加成速查</h2>
<p>性格会对精灵的六维基础值进行 +20% / -10% 修正。建议根据精灵的攻击倾向选择对应性格。</p>
<table border="1" cellspacing="0" cellpadding="6">
<thead><tr><th>性格</th><th>增益</th><th>削弱</th></tr></thead>
<tbody>${rows}</tbody>
</table>`;
}

function buildTermsArticle(terms) {
  const cards = terms
    .slice()
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((t) => `<section><h3>${escapeHtml(t.nameZh || t.key)}</h3><p>${escapeHtml(t.descriptionZh || t.description)}</p></section>`)
    .join("");
  return `<h2>技能与状态词条说明</h2>${cards}`;
}

function buildEggSizeArticle(pets) {
  const rows = pets
    .filter((pet) => pet.egg)
    .slice(0, 80)
    .map((pet) => {
      const egg = pet.egg;
      const hatch = egg.hatchData ? `${Math.round(egg.hatchData / 3600)} 小时` : "—";
      const weight = egg.weightLow && egg.weightHigh ? `${egg.weightLow}~${egg.weightHigh} g` : "—";
      const height = egg.heightLow && egg.heightHigh ? `${egg.heightLow}~${egg.heightHigh} cm` : "—";
      return `<tr><td>${escapeHtml(pet.nameZh)}</td><td>${weight}</td><td>${height}</td><td>${hatch}</td></tr>`;
    })
    .join("");
  return `<h2>蛋尺寸 / 孵化时长查询</h2>
<p>本表抽取前 80 个常见精灵，完整数据请进入 <strong>精灵列表</strong> 查看精灵详情中的"蛋孵化"信息。</p>
<table border="1" cellspacing="0" cellpadding="6">
<thead><tr><th>精灵</th><th>重量</th><th>身高</th><th>孵化时长</th></tr></thead>
<tbody>${rows}</tbody>
</table>`;
}

function buildEggGroupArticle(eggs) {
  if (!eggs.length) {
    return `<h2>蛋组配对说明</h2><p>蛋组配对数据请在精灵详情中查看，本文将持续补充常用蛋组路线。</p>`;
  }
  const rows = eggs
    .slice()
    .sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0))
    .map((e) => `<tr><td>${e.eggTypeId}</td><td>${e.preciousEggType ?? "—"}</td><td>${e.cantGiveAway ? "不可赠送" : "可赠送"}</td></tr>`)
    .join("");
  return `<h2>蛋组分类总览</h2>
<p>当前数据从 EGG_TYPE_CONF 抽取，蛋组路线建议结合"血脉魔法"使用。</p>
<table border="1" cellspacing="0" cellpadding="6">
<thead><tr><th>蛋组 ID</th><th>稀有蛋类型</th><th>赠送限制</th></tr></thead>
<tbody>${rows}</tbody>
</table>`;
}

function buildPvpDamageArticle() {
  return `<h2>PVP 属性伤害计算公式</h2>
<p>本文用于解释技能伤害如何参考属性克制 + 性格加成 + 个体值。具体公式：</p>
<pre>伤害 = (((2 × 等级 / 5 + 2) × 威力 × 攻击 / 防御) / 50 + 2) × 修正</pre>
<p>修正项包括属性克制（×2 / ×0.5）、性格、印记、血脉等。详细数据请配合"克制关系表"页面查看。</p>`;
}

function buildTeamArticle() {
  return `<h2>阵容列表（持续更新）</h2>
<p>本分类用于沉淀官方天梯 / 副本推荐阵容。请通过"我的 → 管理后台 → 文章管理"逐条补充。</p>
<ul>
<li>新增阵容时建议附：核心精灵 + 替代精灵 + 应对队伍。</li>
<li>每条阵容附"适配段位 / 适合关卡"等元信息，方便查找。</li>
</ul>`;
}

function buildItemsArticle(items, assetMap) {
  const top = items
    .filter((item) => item.category)
    .slice(0, 60)
    .map((item) => {
      const file = item.assetPath && assetMap[item.assetPath];
      const icon = file
        ? `<img src="${escapeHtml(file)}" alt="${escapeHtml(item.name)}" style="width:48px;height:48px;" />`
        : "";
      return `<section><h3>${icon} ${escapeHtml(item.name)}</h3><p><em>${escapeHtml(item.category)} · ${escapeHtml(item.qualityLabel)}</em></p><p>${escapeHtml(item.description)}</p></section>`;
    })
    .join("");
  return `<h2>道具图鉴速览</h2>
<p>当前展示前 60 个常见道具卡片，完整道具数据已写入 <code>rk_items</code> 集合，可在管理后台扩展专属页面。</p>${top}`;
}

const TEMPLATES = [
  {
    _id: "article-rk-nature-traits",
    categoryId: "cat-rk-nature-traits",
    title: "洛克王国 25 种性格加成速查表",
    summary: "整理所有性格对体力、攻防、速度的加成方向。",
    tags: ["性格", "加成", "练级"],
    builder: ({ personalities }) => buildNatureArticle(personalities)
  },
  {
    _id: "article-rk-skill-terms",
    categoryId: "cat-rk-skill-terms",
    title: "技能与状态词条说明",
    summary: "印记、状态、Buff 词条的含义解读。",
    tags: ["技能", "词条", "状态"],
    builder: ({ terms }) => buildTermsArticle(terms)
  },
  {
    _id: "article-rk-egg-size",
    categoryId: "cat-rk-egg-size",
    title: "洛克王国蛋尺寸查询表",
    summary: "精灵蛋重量 / 身高 / 孵化时长速查。",
    tags: ["蛋尺寸", "孵化"],
    builder: ({ pets }) => buildEggSizeArticle(pets)
  },
  {
    _id: "article-rk-egg-group-pair",
    categoryId: "cat-rk-egg-group-pair",
    title: "洛克王国蛋组分类速览",
    summary: "蛋组类型 + 稀有蛋 + 赠送限制总览。",
    tags: ["蛋组", "配对"],
    builder: ({ eggs }) => buildEggGroupArticle(eggs)
  },
  {
    _id: "article-rk-pvp-damage",
    categoryId: "cat-rk-pvp-damage",
    title: "PVP 属性伤害计算公式",
    summary: "PVP 中伤害是如何算的：威力、攻防、属性克制、性格修正。",
    tags: ["PVP", "伤害公式"],
    builder: () => buildPvpDamageArticle()
  },
  {
    _id: "article-rk-team-list",
    categoryId: "cat-rk-team-list",
    title: "洛克王国阵容榜样（持续更新）",
    summary: "本分类持续整理可参考的天梯 / 副本阵容。",
    tags: ["阵容", "天梯"],
    builder: () => buildTeamArticle()
  },
  {
    _id: "article-rk-item-index",
    categoryId: "cat-rk-item-index",
    title: "洛克王国道具图鉴速览",
    summary: "常用咕噜球 / 培养道具 / 炼金材料一览。",
    tags: ["道具", "图鉴"],
    builder: ({ items, assetMap }) => buildItemsArticle(items, assetMap)
  }
];

async function main() {
  loadEnv();
  const { TCB_SECRET_ID, TCB_SECRET_KEY, TCB_ENV_ID } = process.env;
  if (!TCB_SECRET_ID || !TCB_SECRET_KEY || !TCB_ENV_ID) {
    console.error("[seedArticles] 缺少 TCB_SECRET_ID / TCB_SECRET_KEY / TCB_ENV_ID");
    process.exit(1);
  }

  let tcb;
  try {
    tcb = require("@cloudbase/node-sdk");
  } catch (error) {
    console.error("[seedArticles] 缺少依赖 @cloudbase/node-sdk，请运行 npm install。");
    process.exit(1);
  }

  const app = tcb.init({ secretId: TCB_SECRET_ID, secretKey: TCB_SECRET_KEY, env: TCB_ENV_ID });
  const db = app.database();

  const ctx = {
    personalities: loadJson("personalities.json"),
    terms: loadJson("terms.json"),
    pets: loadJson("pets.json"),
    eggs: loadJson("eggs.json"),
    items: loadJson("items.json"),
    assetMap: loadAssetMap()
  };

  const now = new Date().toISOString().slice(0, 10);
  for (const template of TEMPLATES) {
    const contentHtml = template.builder(ctx);
    const payload = {
      _id: template._id,
      gameSlug: "rock-kingdom",
      gameName: "洛克王国",
      categoryId: template.categoryId,
      title: template.title,
      summary: template.summary,
      tags: template.tags,
      coverImage: "",
      imageUrls: [],
      contentHtml,
      authorNote: "数据来自洛克王国手游配置，自动生成",
      publishedAt: now,
      createdAt: now,
      updatedAt: now,
      viewCount: 0,
      favoriteCount: 0,
      shareCount: 0,
      status: "published",
      sortOrder: 1
    };

    try {
      await db.collection("articles").doc(template._id).set({ data: payload });
      console.log(`[seedArticles] 写入 ${template._id}`);
    } catch (error) {
      if (error && error.code === "DATABASE_DOCUMENT_NOT_EXIST") {
        await db.collection("articles").add({ data: payload });
        console.log(`[seedArticles] 新增 ${template._id}`);
      } else {
        console.warn(`[seedArticles] 写入失败 ${template._id}: ${error.message}`);
      }
    }
  }

  console.log("[seedArticles] 完成。");
}

if (require.main === module) {
  main().catch((error) => {
    console.error("[seedArticles] 失败：", error);
    process.exit(1);
  });
}

module.exports = { main };
