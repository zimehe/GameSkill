const {
  getArticle,
  getRelatedArticles,
  isFavorite,
  toggleFavorite,
  recordHistory,
  trackEvent
} = require("../../utils/db");

const CLOUD_URI_RE = /cloud:\/\/[a-zA-Z0-9_\-\.\/]+/g;

function collectCloudIds(article) {
  const ids = new Set();
  const add = (value) => {
    if (typeof value === "string" && value.indexOf("cloud://") === 0) ids.add(value);
  };
  add(article.coverImage);
  (article.imageUrls || []).forEach(add);
  if (typeof article.contentHtml === "string") {
    (article.contentHtml.match(CLOUD_URI_RE) || []).forEach((id) => ids.add(id));
  }
  return Array.from(ids);
}

async function resolveCloudFileURLs(fileIds) {
  if (!fileIds.length || !wx.cloud) return {};
  try {
    const res = await wx.cloud.getTempFileURL({ fileList: fileIds });
    const map = {};
    (res.fileList || []).forEach((item) => {
      if (item && item.fileID && item.tempFileURL) map[item.fileID] = item.tempFileURL;
    });
    return map;
  } catch (error) {
    console.warn("解析 cloud:// 链接失败", error);
    return {};
  }
}

function rewriteArticleUrls(article, urlMap) {
  if (!Object.keys(urlMap).length) return article;
  let contentHtml = article.contentHtml || "";
  Object.entries(urlMap).forEach(([fileID, url]) => {
    contentHtml = contentHtml.split(fileID).join(url);
  });
  return {
    ...article,
    coverImage: urlMap[article.coverImage] || article.coverImage,
    imageUrls: (article.imageUrls || []).map((id) => urlMap[id] || id),
    contentHtml
  };
}

Page({
  data: {
    article: null,
    relatedArticles: [],
    favorited: false,
    loading: true,
    errorMessage: ""
  },

  onLoad(options) {
    this.loadArticle(options.id || "");
  },

  async loadArticle(id) {
    if (!id) {
      this.setData({
        loading: false,
        errorMessage: "缺少文章参数，请从目录页重新进入。"
      });
      return;
    }

    this.setData({ loading: true, errorMessage: "" });

    try {
      const article = await getArticle(id);
      if (!article) {
        this.setData({ errorMessage: "没有找到这篇攻略。" });
        return;
      }

      const cloudIds = collectCloudIds(article);
      const [favorited, relatedArticles, , urlMap] = await Promise.all([
        isFavorite(article._id),
        getRelatedArticles(article, 3),
        recordHistory(article._id),
        resolveCloudFileURLs(cloudIds)
      ]);

      const rewritten = rewriteArticleUrls(article, urlMap);
      const normalizedArticle = {
        ...rewritten,
        imageUrls: rewritten.imageUrls || [],
        tags: rewritten.tags || []
      };

      this.setData({
        article: normalizedArticle,
        favorited,
        relatedArticles
      });
      wx.setNavigationBarTitle({ title: article.title || "攻略详情" });
    } catch (error) {
      console.error("读取文章详情失败", error);
      this.setData({
        errorMessage: error.code === "CLOUD_ENV_NOT_CONFIGURED"
          ? "云开发环境还没配置。请先在 app.js 填入 cloudEnvId，再打开文章详情。"
          : "攻略加载失败，请检查云数据库权限和文章数据。"
      });
    } finally {
      this.setData({ loading: false });
    }
  },

  previewImage(event) {
    const { current } = event.currentTarget.dataset;
    const urls = this.data.article.imageUrls || [];
    if (!current || urls.length === 0) return;

    wx.previewImage({
      current,
      urls
    });
  },

  goBack() {
    const pages = getCurrentPages();
    if (pages.length > 1) {
      wx.navigateBack();
      return;
    }

    wx.redirectTo({ url: "/pages/home/home" });
  },

  async toggleFavorite() {
    if (!this.data.article) return;

    const result = await toggleFavorite(this.data.article._id);
    this.setData({ favorited: result.favorited });
    wx.showToast({
      title: result.favorited ? "已收藏" : "已取消",
      icon: "success"
    });
  },

  copyTitle() {
    if (!this.data.article) return;

    wx.setClipboardData({
      data: this.data.article.title,
      success: () => wx.showToast({ title: "标题已复制", icon: "success" })
    });
  },

  openRelated(event) {
    const { id } = event.currentTarget.dataset;
    if (!id) return;

    wx.navigateTo({ url: `/pages/detail/detail?id=${id}` });
  },

  onShareAppMessage() {
    const article = this.data.article || {};
    if (article._id) {
      trackEvent("share", { articleId: article._id });
    }

    return {
      title: article.title || "云玩家游客图鉴",
      path: `/pages/detail/detail?id=${article._id || ""}`
    };
  }
});
