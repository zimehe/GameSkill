const mockData = require("./mockData");

const FAVORITES_KEY = "v2_favorites";
const HISTORY_KEY = "v2_history";
const EVENTS_KEY = "v2_events";
const ADMIN_DRAFTS_KEY = "v2_admin_drafts";

function getAppState() {
  return getApp().globalData || {};
}

function isMockMode() {
  return !!getAppState().useMockData;
}

async function ensureOpenId() {
  const app = getApp();
  if (app.globalData.openid) return app.globalData.openid;
  if (isMockMode()) return "mock-admin-openid";

  const res = await wx.cloud.callFunction({ name: "getOpenId" });
  const openid = res.result && res.result.openid ? res.result.openid : "";
  app.globalData.openid = openid;
  return openid;
}

function getCloudDb() {
  const app = getAppState();

  if (isMockMode()) {
    const error = new Error("当前使用本地模拟数据");
    error.code = "USING_MOCK_DATA";
    throw error;
  }

  if (!wx.cloud || !app.cloudReady) {
    const error = new Error("云开发环境未配置");
    error.code = "CLOUD_ENV_NOT_CONFIGURED";
    throw error;
  }

  return wx.cloud.database();
}

function bySort(a, b) {
  return (a.sortOrder || 0) - (b.sortOrder || 0);
}

function byUpdated(a, b) {
  return String(b.updatedAt || b.publishedAt || "").localeCompare(String(a.updatedAt || a.publishedAt || ""));
}

function byPopular(a, b) {
  return (b.viewCount || 0) - (a.viewCount || 0);
}

function normalizeArticle(article) {
  return {
    ...article,
    tags: article.tags || [],
    imageUrls: article.imageUrls || [],
    status: article.status || "published",
    viewCount: article.viewCount || 0,
    favoriteCount: article.favoriteCount || 0,
    shareCount: article.shareCount || 0,
    updatedAt: article.updatedAt || article.publishedAt || "",
    titleInitial: article.title ? article.title.slice(0, 1) : "攻"
  };
}

function published(items) {
  return items.filter((item) => !item.status || item.status === "published");
}

function readStorage(key, fallback) {
  try {
    return wx.getStorageSync(key) || fallback;
  } catch (error) {
    console.warn("读取本地缓存失败", key, error);
    return fallback;
  }
}

function writeStorage(key, value) {
  try {
    wx.setStorageSync(key, value);
  } catch (error) {
    console.warn("写入本地缓存失败", key, error);
  }
}

function getMockArticles() {
  const drafts = readStorage(ADMIN_DRAFTS_KEY, []);
  const draftIds = drafts.map((item) => item._id);
  const baseArticles = mockData.articles.filter((item) => draftIds.indexOf(item._id) < 0);
  return published(drafts.concat(baseArticles)).map(normalizeArticle);
}

async function getGames() {
  if (isMockMode()) {
    return published(mockData.games).sort(bySort);
  }

  const db = getCloudDb();
  const { data } = await db.collection("games")
    .where({ status: "published" })
    .orderBy("sortOrder", "asc")
    .get();
  return data;
}

async function getGame(slug) {
  if (isMockMode()) {
    return published(mockData.games).find((game) => game.slug === slug) || null;
  }

  const db = getCloudDb();
  const { data } = await db.collection("games")
    .where({ slug, status: "published" })
    .limit(1)
    .get();
  return data[0] || null;
}

async function getCategories(gameSlug) {
  if (isMockMode()) {
    return published(mockData.categories)
      .filter((category) => category.gameSlug === gameSlug)
      .sort(bySort);
  }

  const db = getCloudDb();
  const { data } = await db.collection("categories")
    .where({ gameSlug, status: "published" })
    .orderBy("sortOrder", "asc")
    .get();
  return data;
}

async function getArticlesByGame(gameSlug) {
  if (isMockMode()) {
    return getMockArticles()
      .filter((article) => article.gameSlug === gameSlug)
      .sort(bySort);
  }

  const db = getCloudDb();
  const { data } = await db.collection("articles")
    .where({ gameSlug, status: "published" })
    .orderBy("sortOrder", "asc")
    .get();
  return data.map(normalizeArticle);
}

async function getArticle(id) {
  if (isMockMode()) {
    return getMockArticles().find((article) => article._id === id) || null;
  }

  const db = getCloudDb();
  const _ = db.command;
  const { data } = await db.collection("articles")
    .where(_.or([{ _id: id }, { articleId: id }]))
    .limit(1)
    .get();
  return data[0] ? normalizeArticle(data[0]) : null;
}

async function getCategoryPageData(gameSlug) {
  const [game, categories, articles] = await Promise.all([
    getGame(gameSlug),
    getCategories(gameSlug),
    getArticlesByGame(gameSlug)
  ]);

  return {
    game,
    categories: categories.sort(bySort),
    articles: articles.sort(bySort)
  };
}

async function getLatestArticles(limit = 5) {
  if (isMockMode()) {
    return getMockArticles().sort(byUpdated).slice(0, limit);
  }

  const db = getCloudDb();
  const { data } = await db.collection("articles")
    .where({ status: "published" })
    .orderBy("updatedAt", "desc")
    .limit(limit)
    .get();
  return data.map(normalizeArticle);
}

async function getPopularArticles(limit = 5) {
  if (isMockMode()) {
    return getMockArticles().sort(byPopular).slice(0, limit);
  }

  const db = getCloudDb();
  const { data } = await db.collection("articles")
    .where({ status: "published" })
    .orderBy("viewCount", "desc")
    .limit(limit)
    .get();
  return data.map(normalizeArticle);
}

async function searchArticles(keyword) {
  const query = String(keyword || "").trim().toLowerCase();
  if (!query) return [];

  await trackEvent("search", { keyword: query });

  if (isMockMode()) {
    return getMockArticles().filter((article) => {
      const haystack = [
        article.title,
        article.summary,
        article.gameName,
        article.gameSlug,
        article.tags.join(" ")
      ].join(" ").toLowerCase();
      return haystack.indexOf(query) >= 0;
    }).sort(byPopular);
  }

  const db = getCloudDb();
  const _ = db.command;
  const regExp = db.RegExp({ regexp: query, options: "i" });
  const { data } = await db.collection("articles")
    .where(_.and([
      { status: "published" },
      _.or([
        { title: regExp },
        { summary: regExp },
        { tags: regExp },
        { gameName: regExp }
      ])
    ]))
    .limit(30)
    .get();
  return data.map(normalizeArticle);
}

async function getRelatedArticles(article, limit = 3) {
  if (!article) return [];
  const articles = await getArticlesByGame(article.gameSlug);
  return articles
    .filter((item) => item._id !== article._id && item.categoryId === article.categoryId)
    .concat(articles.filter((item) => item._id !== article._id && item.categoryId !== article.categoryId))
    .slice(0, limit);
}

async function isFavorite(articleId) {
  if (isMockMode()) {
    const ids = readStorage(FAVORITES_KEY, []);
    return ids.indexOf(articleId) >= 0;
  }

  const db = getCloudDb();
  const openid = await ensureOpenId();
  const { data } = await db.collection("favorites")
    .where({ openid, articleId })
    .limit(1)
    .get();
  return data.length > 0;
}

async function toggleFavorite(articleId) {
  if (isMockMode()) {
    const ids = readStorage(FAVORITES_KEY, []);
    const exists = ids.indexOf(articleId) >= 0;
    const next = exists ? ids.filter((id) => id !== articleId) : ids.concat(articleId);
    writeStorage(FAVORITES_KEY, next);
    await trackEvent(exists ? "unfavorite" : "favorite", { articleId });
    return { favorited: !exists };
  }

  const res = await wx.cloud.callFunction({
    name: "toggleFavorite",
    data: { articleId }
  });
  return res.result || { favorited: false };
}

async function getFavoriteArticles() {
  if (isMockMode()) {
    const ids = readStorage(FAVORITES_KEY, []);
    return ids.map((id) => getMockArticles().find((article) => article._id === id)).filter(Boolean);
  }

  const db = getCloudDb();
  const openid = await ensureOpenId();
  const { data } = await db.collection("favorites")
    .where({ openid })
    .orderBy("createdAt", "desc")
    .get();
  const articles = await Promise.all(data.map((item) => getArticle(item.articleId)));
  return articles.filter(Boolean);
}

async function recordHistory(articleId) {
  if (!articleId) return;

  if (isMockMode()) {
    await trackEvent("view", { articleId });
    const now = new Date().toISOString();
    const list = readStorage(HISTORY_KEY, []);
    const exists = list.find((item) => item.articleId === articleId);
    const next = [
      { articleId, lastViewedAt: now, viewCount: exists ? (exists.viewCount || 0) + 1 : 1 },
      ...list.filter((item) => item.articleId !== articleId)
    ].slice(0, 50);
    writeStorage(HISTORY_KEY, next);
    return;
  }

  await wx.cloud.callFunction({
    name: "trackEvent",
    data: { type: "view", articleId }
  });
}

async function getHistoryArticles() {
  if (isMockMode()) {
    const list = readStorage(HISTORY_KEY, []);
    return list.map((item) => {
      const article = getMockArticles().find((target) => target._id === item.articleId);
      return article ? { ...article, lastViewedAt: item.lastViewedAt } : null;
    }).filter(Boolean);
  }

  const db = getCloudDb();
  const openid = await ensureOpenId();
  const { data } = await db.collection("history")
    .where({ openid })
    .orderBy("lastViewedAt", "desc")
    .limit(50)
    .get();
  const articles = await Promise.all(data.map((item) => getArticle(item.articleId)));
  return articles.filter(Boolean);
}

async function clearHistory() {
  if (isMockMode()) {
    writeStorage(HISTORY_KEY, []);
    return;
  }

  await wx.cloud.callFunction({
    name: "trackEvent",
    data: { type: "clearHistory" }
  });
}

async function trackEvent(type, payload = {}) {
  if (isMockMode()) {
    const list = readStorage(EVENTS_KEY, []);
    writeStorage(EVENTS_KEY, [{ type, payload, createdAt: new Date().toISOString() }].concat(list).slice(0, 100));
    return;
  }

  await wx.cloud.callFunction({
    name: "trackEvent",
    data: { type, ...payload }
  });
}

async function isAdmin() {
  if (isMockMode()) return true;

  const db = getCloudDb();
  const openid = await ensureOpenId();
  const { data } = await db.collection("admins")
    .where({ openid })
    .limit(1)
    .get();
  return data.length > 0;
}

async function listAdminArticles() {
  if (isMockMode()) {
    const drafts = readStorage(ADMIN_DRAFTS_KEY, []);
    const draftIds = drafts.map((item) => item._id);
    const baseArticles = mockData.articles.filter((item) => draftIds.indexOf(item._id) < 0);
    return drafts.concat(baseArticles).map(normalizeArticle).sort(byUpdated);
  }

  const db = getCloudDb();
  const { data } = await db.collection("articles")
    .orderBy("updatedAt", "desc")
    .limit(100)
    .get();
  return data.map(normalizeArticle);
}

async function saveArticle(article) {
  const now = new Date().toISOString().slice(0, 10);
  const payload = {
    ...article,
    _id: article._id || `mock-article-${Date.now()}`,
    tags: typeof article.tags === "string" ? article.tags.split(/[,，\s]+/).filter(Boolean) : (article.tags || []),
    imageUrls: typeof article.imageUrls === "string" ? article.imageUrls.split(/\n+/).filter(Boolean) : (article.imageUrls || []),
    updatedAt: now,
    createdAt: article.createdAt || now,
    publishedAt: article.publishedAt || now,
    status: article.status || "draft",
    viewCount: article.viewCount || 0,
    favoriteCount: article.favoriteCount || 0,
    shareCount: article.shareCount || 0
  };

  if (isMockMode()) {
    const drafts = readStorage(ADMIN_DRAFTS_KEY, []);
    const next = [payload].concat(drafts.filter((item) => item._id !== payload._id));
    writeStorage(ADMIN_DRAFTS_KEY, next);
    return payload;
  }

  const res = await wx.cloud.callFunction({
    name: "adminArticle",
    data: { action: "save", article: payload }
  });
  return res.result && res.result.article ? res.result.article : payload;
}

module.exports = {
  getGames,
  getGame,
  getCategories,
  getArticlesByGame,
  getArticle,
  getCategoryPageData,
  getLatestArticles,
  getPopularArticles,
  searchArticles,
  getRelatedArticles,
  isFavorite,
  toggleFavorite,
  getFavoriteArticles,
  recordHistory,
  getHistoryArticles,
  clearHistory,
  trackEvent,
  isAdmin,
  listAdminArticles,
  saveArticle
};
