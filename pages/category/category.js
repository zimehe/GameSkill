const { getCategoryPageData } = require("../../utils/db");

const DEDICATED_RK_PAGES = {
  "cat-rk-pet-list": {
    url: "/pages/rock-kingdom/pet-list/pet-list",
    title: "精灵图鉴",
    description: "支持按属性 / 关键词搜索 1000+ 精灵，进入查看技能、属性、蛋孵化"
  },
  "cat-rk-skill-list": {
    url: "/pages/rock-kingdom/skill-list/skill-list",
    title: "技能图鉴",
    description: "全部技能按属性 / 类别筛选，威力、能量、效果一目了然"
  },
  "cat-rk-skill-pet-filter": {
    url: "/pages/rock-kingdom/skill-filter/skill-filter",
    title: "技能筛选精灵",
    description: "输入技能名 → 反查所有可学该技能的精灵"
  },
  "cat-rk-counter-table": {
    url: "/pages/rock-kingdom/type-counter/type-counter",
    title: "属性克制速查表",
    description: "18 × 18 克制网格，攻击 / 防御倍率一眼看穿"
  }
};

Page({
  data: {
    gameSlug: "",
    game: null,
    categories: [],
    articles: [],
    filteredArticles: [],
    activeCategoryId: "",
    activeCategory: null,
    dedicatedEntry: null,
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

      const activeCategory = categories.find((c) => c._id === activeCategoryId) || null;
      this.setData({
        game,
        categories,
        articles: normalizedArticles,
        activeCategoryId,
        activeCategory,
        dedicatedEntry: DEDICATED_RK_PAGES[activeCategoryId] || null,
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
    const activeCategory = this.data.categories.find((c) => c._id === id) || null;
    this.setData({
      activeCategoryId: id,
      activeCategory,
      dedicatedEntry: DEDICATED_RK_PAGES[id] || null,
      filteredArticles: this.filterArticles(this.data.articles, id)
    });
  },

  handleDedicatedTap() {
    const { dedicatedEntry } = this.data;
    if (!dedicatedEntry) return;
    wx.navigateTo({ url: dedicatedEntry.url });
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
