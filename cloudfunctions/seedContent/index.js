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
  { _id: "cat-rk-pet", gameSlug: "rock-kingdom", name: "神宠图鉴", description: "种族值 / 性格 / 技能石", icon: "宠", status: "published", sortOrder: 1 },
  { _id: "cat-rk-pve", gameSlug: "rock-kingdom", name: "天梯/副本", description: "PK 阵容 / BOSS 打法", icon: "战", status: "published", sortOrder: 2 },
  { _id: "cat-rk-level", gameSlug: "rock-kingdom", name: "怀旧练级", description: "1-100 级快速升级路线", icon: "级", status: "published", sortOrder: 3 }
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
  ["cat-rk-pet", "rock-kingdom", "洛克王国", "热门神宠性格与技能搭配", "热门宠物种族值、推荐性格和技能石搭配占位。", ["神宠", "性格", "技能"]],
  ["cat-rk-pve", "rock-kingdom", "洛克王国", "天梯阵容与 BOSS 打法", "当前版本主流阵容、克制思路和副本 Boss 处理方式。", ["天梯", "副本", "BOSS"]],
  ["cat-rk-level", "rock-kingdom", "洛克王国", "1-100 级怀旧练级路线", "从低级场景到高经验副本的练级路线和注意事项。", ["练级", "路线", "怀旧"]]
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
