const { getGames, getLatestArticles, getPopularArticles } = require("../../utils/db");

const FEATURED_GAME_LIMIT = 6;
const COLLAPSED_GAME_LIMIT = 8;

Page({
  data: {
    games: [],
    featuredGames: [],
    visibleGames: [],
    matchedGameCount: 0,
    latestArticles: [],
    popularArticles: [],
    loading: true,
    errorMessage: "",
    usingMockData: false,
    keyword: "",
    showAllGames: false,
    adminTapCount: 0,
    adUnitId: "",
    showBannerAd: false
  },

  onLoad() {
    this.loadGames();
  },

  async loadGames() {
    this.setData({ loading: true, errorMessage: "" });

    try {
      const [games, latestArticles, popularArticles] = await Promise.all([
        getGames(),
        getLatestArticles(3),
        getPopularArticles(3)
      ]);
      const normalizedGames = games.map(this.normalizeGame);
      const gameView = this.buildGameView(normalizedGames, this.data.keyword, this.data.showAllGames);
      this.setData({
        games: normalizedGames,
        ...gameView,
        latestArticles,
        popularArticles,
        usingMockData: getApp().globalData.useMockData
      });
    } catch (error) {
      console.error("读取游戏列表失败", error);
      this.setData({
        errorMessage: error.code === "CLOUD_ENV_NOT_CONFIGURED"
          ? "云开发环境还没配置。请在 app.js 填入 cloudEnvId，创建 games、categories、articles 集合后重新编译。"
          : "暂时无法读取攻略库，请检查云开发环境和数据库集合。"
      });
    } finally {
      this.setData({ loading: false });
    }
  },

  handleGameTap(event) {
    const { slug } = event.currentTarget.dataset;
    if (!slug) return;

    wx.navigateTo({
      url: `/pages/category/category?game=${slug}`
    });
  },

  handleSearchInput(event) {
    const keyword = event.detail.value;
    this.setData({
      keyword,
      ...this.buildGameView(this.data.games, keyword, this.data.showAllGames)
    });
  },

  submitSearch() {
    const keyword = String(this.data.keyword || "").trim();
    if (!keyword) {
      wx.showToast({ title: "请输入关键词", icon: "none" });
      return;
    }

    wx.navigateTo({
      url: `/pages/search/search?keyword=${encodeURIComponent(keyword)}`
    });
  },

  openArticle(event) {
    const { id } = event.currentTarget.dataset;
    if (!id) return;

    wx.navigateTo({
      url: `/pages/detail/detail?id=${id}`
    });
  },

  openMine() {
    wx.navigateTo({ url: "/pages/mine/mine" });
  },

  toggleAllGames() {
    const showAllGames = !this.data.showAllGames;
    this.setData({
      showAllGames,
      ...this.buildGameView(this.data.games, this.data.keyword, showAllGames)
    });
  },

  buildGameView(games, keyword, showAllGames) {
    const normalizedKeyword = String(keyword || "").trim().toLowerCase();
    const matchedGames = normalizedKeyword
      ? games.filter((game) => {
        const keywords = game.keywords || [];
        const haystack = [game.name, game.subtitle, keywords.join(" ")].join(" ").toLowerCase();
        return haystack.indexOf(normalizedKeyword) >= 0;
      })
      : games;
    const shouldShowAll = showAllGames || !!normalizedKeyword;

    return {
      featuredGames: games.slice(0, FEATURED_GAME_LIMIT),
      visibleGames: shouldShowAll ? matchedGames : matchedGames.slice(0, COLLAPSED_GAME_LIMIT),
      matchedGameCount: matchedGames.length
    };
  },

  normalizeGame(game) {
    return {
      ...game,
      gameInitial: game.name ? game.name.slice(0, 1) : "游",
      safeThemeColor: game.themeColor || "#10161f"
    };
  },

  handleTitleTap() {
    const next = this.data.adminTapCount + 1;
    if (next >= 5) {
      this.setData({ adminTapCount: 0 });
      wx.navigateTo({ url: "/pages/admin/index/index" });
      return;
    }

    this.setData({ adminTapCount: next });
  }
});
