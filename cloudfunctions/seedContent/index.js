const cloud = require("wx-server-sdk");

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

const db = cloud.database();

const games = [
  {
    _id: "game-wuthering-waves",
    slug: "wuthering-waves",
    name: "鸣潮",
    subtitle: "公测开荒 / 声骸全配 / 角色推荐",
    coverImage: "",
    themeColor: "#1c7f8a",
    keywords: ["鸣潮", "声骸", "开荒", "角色"],
    status: "published",
    sortOrder: 1
  },
  {
    _id: "game-stardew-valley",
    slug: "stardew-valley",
    name: "星露谷物语",
    subtitle: "作物收益 / 村民好感 / 四季钓鱼",
    coverImage: "",
    themeColor: "#d6863c",
    keywords: ["星露谷", "作物", "送礼", "钓鱼"],
    status: "published",
    sortOrder: 2
  },
  {
    _id: "game-rock-kingdom",
    slug: "rock-kingdom",
    name: "洛克王国",
    subtitle: "宠物图鉴 / 经典练级 / BOSS打法",
    coverImage: "",
    themeColor: "#6f66d8",
    keywords: ["洛克王国", "宠物", "练级", "天梯"],
    status: "published",
    sortOrder: 3
  }
];

const categories = [
  { _id: "cat-ww-character-index", gameSlug: "wuthering-waves", name: "角色图鉴", description: "共鸣者定位 / 技能 / 培养优先级", icon: "角", status: "published", sortOrder: 1 },
  { _id: "cat-ww-weapon-index", gameSlug: "wuthering-waves", name: "武器图鉴", description: "武器属性 / 适配角色 / 抽取建议", icon: "武", status: "published", sortOrder: 2 },
  { _id: "cat-ww-echo-index", gameSlug: "wuthering-waves", name: "声骸图鉴", description: "声骸套装 / 主词条 / 获取位置", icon: "声", status: "published", sortOrder: 3 },
  { _id: "cat-ww-character-stats", gameSlug: "wuthering-waves", name: "角色属性", description: "基础面板 / 突破材料 / 技能倍率", icon: "属", status: "published", sortOrder: 4 },
  { _id: "cat-ww-gacha-plan", gameSlug: "wuthering-waves", name: "抽卡规划", description: "卡池节奏 / 星声预算 / 补强路线", icon: "抽", status: "published", sortOrder: 5 },
  { _id: "cat-ww-build-stats", gameSlug: "wuthering-waves", name: "角色配装统计", description: "武器声骸使用率 / 队伍搭配统计", icon: "配", status: "published", sortOrder: 6 },
  { _id: "cat-sv-crop", gameSlug: "stardew-valley", name: "四季作物", description: "作物收益及成熟时间", icon: "作", status: "published", sortOrder: 1 },
  { _id: "cat-sv-gift", gameSlug: "stardew-valley", name: "村民好感", description: "全 NPC 最爱 / 喜欢礼物", icon: "礼", status: "published", sortOrder: 2 },
  { _id: "cat-sv-tool", gameSlug: "stardew-valley", name: "日常工具", description: "钓鱼时间表 / 矿洞攻略", icon: "工", status: "published", sortOrder: 3 },
  { _id: "cat-rk-pet-list", gameSlug: "rock-kingdom", name: "精灵列表", description: "精灵基础资料 / 属性 / 编号索引", icon: "灵", status: "published", sortOrder: 1 },
  { _id: "cat-rk-skill-list", gameSlug: "rock-kingdom", name: "技能列表", description: "技能属性 / 威力 / 效果说明", icon: "技", status: "published", sortOrder: 2 },
  { _id: "cat-rk-skill-pet-filter", gameSlug: "rock-kingdom", name: "技能筛选精灵", description: "按技能反查精灵 / 技能持有者", icon: "筛", status: "published", sortOrder: 3 },
  { _id: "cat-rk-counter-table", gameSlug: "rock-kingdom", name: "克制关系表", description: "属性克制 / 抵抗 / 免疫速查", icon: "克", status: "published", sortOrder: 4 }
];

const articleTemplates = [
  ["cat-ww-character-index", "wuthering-waves", "鸣潮", "鸣潮角色图鉴速查", "按属性、定位和队伍功能整理共鸣者，方便快速判断培养优先级。", ["角色图鉴", "共鸣者", "定位"]],
  ["cat-ww-weapon-index", "wuthering-waves", "鸣潮", "鸣潮武器图鉴与适配角色", "整理常用武器属性、特效、适配角色和抽取建议。", ["武器图鉴", "适配角色", "抽取建议"]],
  ["cat-ww-echo-index", "wuthering-waves", "鸣潮", "鸣潮声骸图鉴与套装速查", "整理声骸套装、主词条选择、COST 搭配和获取位置。", ["声骸图鉴", "套装", "主词条"]],
  ["cat-ww-character-stats", "wuthering-waves", "鸣潮", "鸣潮角色属性与突破材料表", "集中展示角色基础属性、突破材料、技能升级材料和关键倍率。", ["角色属性", "突破材料", "技能倍率"]],
  ["cat-ww-gacha-plan", "wuthering-waves", "鸣潮", "鸣潮抽卡规划与星声预算", "按版本卡池、角色定位和账号缺口整理抽卡优先级。", ["抽卡规划", "星声", "卡池"]],
  ["cat-ww-build-stats", "wuthering-waves", "鸣潮", "鸣潮角色配装统计速览", "统计热门角色的武器、声骸、词条和队伍搭配使用率。", ["角色配装统计", "武器使用率", "声骸搭配"]],
  ["cat-sv-crop", "stardew-valley", "星露谷物语", "四季作物收益速查", "春夏秋冬高收益作物、成熟时间和复种建议。", ["作物", "收益", "四季"]],
  ["cat-sv-gift", "stardew-valley", "星露谷物语", "全村民送礼好感表", "每位 NPC 的最爱、喜欢、生日和避雷礼物。", ["送礼", "好感", "NPC"]],
  ["cat-sv-tool", "stardew-valley", "星露谷物语", "钓鱼时间与矿洞 120 层路线", "按季节、天气、时间整理鱼类与矿洞推进策略。", ["钓鱼", "矿洞", "日常"]],
  ["cat-rk-pet-list", "rock-kingdom", "洛克王国", "洛克王国精灵列表", "整理精灵编号、属性、种族值、获取方式和推荐用途。", ["精灵列表", "宠物", "种族值"]],
  ["cat-rk-skill-list", "rock-kingdom", "洛克王国", "洛克王国技能列表", "按技能属性、威力、命中、PP 和效果整理技能图鉴。", ["技能列表", "技能属性", "效果"]],
  ["cat-rk-skill-pet-filter", "rock-kingdom", "洛克王国", "按技能筛选精灵查询", "输入技能名后反查可学习或携带该技能的精灵。", ["技能筛选精灵", "技能反查", "精灵"]],
  ["cat-rk-counter-table", "rock-kingdom", "洛克王国", "洛克王国克制关系表", "快速查询属性之间的克制、抵抗和弱点关系。", ["克制关系表", "属性", "弱点"]]
];

function buildArticle([categoryId, gameSlug, gameName, title, summary, tags], index) {
  const date = "2026-05-16";
  return {
    _id: `article-${index + 1}`,
    gameSlug,
    gameName,
    categoryId,
    title,
    summary,
    tags,
    coverImage: "",
    imageUrls: [],
    contentHtml: [
      `<h2>${title}</h2>`,
      `<p>${summary}</p>`,
      "<h3>速查结论</h3>",
      "<ul><li>这里替换成首屏最重要的结论。</li><li>长图、表格和路线图建议放在图鉴预览区。</li><li>V2 阶段优先保证信息准确、结构清楚。</li></ul>",
      "<h3>运营备注</h3>",
      "<p>把收集到的 B 站、贴吧、小红书或公众号内容整理后，替换本段 HTML 即可上线。</p>"
    ].join(""),
    authorNote: "本文整理自网络，侵删",
    publishedAt: date,
    createdAt: date,
    updatedAt: date,
    viewCount: 0,
    favoriteCount: 0,
    shareCount: 0,
    status: "published",
    sortOrder: index + 1
  };
}

async function upsert(collectionName, docs) {
  const collection = db.collection(collectionName);

  for (const doc of docs) {
    const { _id, ...data } = doc;
    try {
      await collection.doc(_id).set({ data });
    } catch (error) {
      await collection.doc(_id).update({ data });
    }
  }
}

async function removeDocs(collectionName, ids) {
  const collection = db.collection(collectionName);

  for (const id of ids) {
    try {
      await collection.doc(id).remove();
    } catch (error) {
      // Ignore missing legacy documents so the seed function stays idempotent.
    }
  }
}

async function removeArticlesByCategory(categoryIds) {
  const collection = db.collection("articles");

  for (const categoryId of categoryIds) {
    await collection.where({ categoryId }).remove().catch(() => {});
  }
}

exports.main = async () => {
  const articles = articleTemplates.map(buildArticle);
  const admins = [
    {
      _id: "admin-placeholder",
      openid: "replace-with-your-openid",
      name: "管理员占位，请替换 openid",
      createdAt: new Date()
    }
  ];

  await upsert("games", games);
  await upsert("categories", categories);
  await upsert("articles", articles);
  await upsert("admins", admins);
  await removeDocs("categories", ["cat-ww-build", "cat-ww-starter", "cat-ww-data"]);
  await removeDocs("categories", ["cat-rk-pet", "cat-rk-pve", "cat-rk-level"]);
  const removedRockKingdomCategoryIds = [
    "cat-rk-egg-size",
    "cat-rk-egg-group-pair",
    "cat-rk-pvp-damage",
    "cat-rk-team-list",
    "cat-rk-item-index",
    "cat-rk-nature-traits",
    "cat-rk-skill-terms"
  ];
  await removeDocs("categories", removedRockKingdomCategoryIds);
  await removeArticlesByCategory(removedRockKingdomCategoryIds);

  return {
    ok: true,
    counts: {
      games: games.length,
      categories: categories.length,
      articles: articles.length,
      admins: admins.length
    }
  };
};
