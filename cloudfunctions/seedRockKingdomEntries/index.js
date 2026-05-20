const cloud = require("wx-server-sdk");

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

const db = cloud.database();

const game = {
  _id: "game-rock-kingdom",
  slug: "rock-kingdom",
  name: "洛克王国",
  subtitle: "精灵图鉴 / 技能筛选 / 属性克制",
  coverImage: "",
  themeColor: "#6f66d8",
  keywords: ["洛克王国", "宠物", "精灵", "技能", "属性克制"],
  status: "published",
  sortOrder: 3
};

const categories = [
  { _id: "cat-rk-pet-list", gameSlug: "rock-kingdom", name: "精灵列表", description: "精灵基础资料 / 属性 / 编号索引", icon: "灵", status: "published", sortOrder: 1 },
  { _id: "cat-rk-skill-list", gameSlug: "rock-kingdom", name: "技能列表", description: "技能属性 / 威力 / 效果说明", icon: "技", status: "published", sortOrder: 2 },
  { _id: "cat-rk-skill-pet-filter", gameSlug: "rock-kingdom", name: "技能筛选精灵", description: "按技能反查精灵 / 技能持有者", icon: "筛", status: "published", sortOrder: 3 },
  { _id: "cat-rk-counter-table", gameSlug: "rock-kingdom", name: "克制关系表", description: "属性克制 / 抵抗 / 免疫速查", icon: "克", status: "published", sortOrder: 4 }
];

const removedCategoryIds = [
  "cat-rk-egg-size",
  "cat-rk-egg-group-pair",
  "cat-rk-pvp-damage",
  "cat-rk-team-list",
  "cat-rk-item-index",
  "cat-rk-nature-traits",
  "cat-rk-skill-terms"
];

const removedArticleIds = categories
  .map((category) => category._id)
  .concat(removedCategoryIds)
  .map((categoryId) => `article-rk-${categoryId.replace("cat-rk-", "")}`);

async function ensureCollection(name) {
  try {
    await db.createCollection(name);
  } catch (error) {
    // Collection already exists or current account has already created it.
  }
}

async function upsert(collectionName, docs) {
  const collection = db.collection(collectionName);
  for (const doc of docs) {
    const { _id, ...data } = doc;
    await collection.doc(_id).set({ data });
  }
}

async function removeCategoryAndArticles(categoryIds) {
  const categoryCollection = db.collection("categories");
  const articleCollection = db.collection("articles");

  for (const categoryId of categoryIds) {
    await categoryCollection.doc(categoryId).remove().catch(() => {});
    await articleCollection.where({ categoryId }).remove().catch(() => {});
  }
}

async function removeArticlesById(articleIds) {
  const articleCollection = db.collection("articles");

  for (const articleId of articleIds) {
    await articleCollection.doc(articleId).remove().catch(() => {});
  }
}

exports.main = async () => {
  await ensureCollection("games");
  await ensureCollection("categories");

  await removeCategoryAndArticles(removedCategoryIds);
  await removeArticlesById(removedArticleIds);
  await upsert("games", [game]);
  await upsert("categories", categories);

  return {
    ok: true,
    message: "洛克王国入口数据已写入 games / categories，并已清理占位文章",
    counts: {
      games: 1,
      categories: categories.length,
      articles: 0
    },
    removedCategoryIds,
    removedArticleIds
  };
};
