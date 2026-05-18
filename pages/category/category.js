const { getCategoryPageData } = require("../../utils/db");

Page({
  data: {
    gameSlug: "",
    game: null,
    categories: [],
    articles: [],
    filteredArticles: [],
    activeCategoryId: "",
    sortMode: "default",
    loading: true,
    errorMessage: ""
  },

  onLoad(options) {
    const gameSlug = options.game || "";
    this.setData({ gameSlug });
    this.loadPageData(gameSlug);
  },

  async loadPageData(gameSlug) {
    if (!gameSlug) {
      this.setData({
        loading: false,
        errorMessage: "缺少游戏参数，请从首页重新进入。"
      });
      return;
    }

    this.setData({ loading: true, errorMessage: "" });

    try {
      const { game, categories, articles } = await getCategoryPageData(gameSlug);
      const normalizedArticles = articles.map((article) => ({
        ...article,
        titleInitial: article.title ? article.title.slice(0, 1) : "攻"
      }));
      const activeCategoryId = categories[0] ? categories[0]._id : "";

      this.setData({
        game,
        categories,
        articles: normalizedArticles,
        activeCategoryId,
        filteredArticles: this.filterArticles(normalizedArticles, activeCategoryId)
      });

      if (game && game.name) {
        wx.setNavigationBarTitle({ title: `${game.name}攻略` });
      }
    } catch (error) {
      console.error("读取目录页数据失败", error);
      this.setData({
        errorMessage: error.code === "CLOUD_ENV_NOT_CONFIGURED"
          ? "云开发环境还没配置。请先在 app.js 填入 cloudEnvId，再初始化云数据库内容。"
          : "目录加载失败，请检查云数据库权限和数据。"
      });
    } finally {
      this.setData({ loading: false });
    }
  },

  filterArticles(articles, categoryId) {
    const filtered = categoryId ? articles.filter((article) => article.categoryId === categoryId) : articles;
    if (this.data.sortMode === "hot") {
      return filtered.sort((a, b) => (b.viewCount || 0) - (a.viewCount || 0));
    }
    if (this.data.sortMode === "latest") {
      return filtered.sort((a, b) => String(b.updatedAt || "").localeCompare(String(a.updatedAt || "")));
    }
    return filtered.sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
  },

  handleTabTap(event) {
    const { id } = event.currentTarget.dataset;
    this.setData({
      activeCategoryId: id,
      filteredArticles: this.filterArticles(this.data.articles, id)
    });
  },

  handleSortTap(event) {
    const { mode } = event.currentTarget.dataset;
    this.setData({
      sortMode: mode,
      filteredArticles: this.filterArticles(this.data.articles, this.data.activeCategoryId)
    });
  },

  handleArticleTap(event) {
    const { id } = event.currentTarget.dataset;
    if (!id) return;

    wx.navigateTo({
      url: `/pages/detail/detail?id=${id}`
    });
  }
});
