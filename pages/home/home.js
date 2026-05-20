const { getGames } = require("../../utils/db");

const COLLAPSED_GAME_LIMIT = 8;

Page({
  data: {
    games: [],
    visibleGames: [],
    matchedGameCount: 0,
    loading: true,
    errorMessage: "",
    keyword: "",
    showAllGames: false,
    adUnitId: "",
    showBannerAd: false
  },

  onLoad() {
    this.loadGames();
  },

  async loadGames() {
    this.setData({ loading: true, errorMessage: "" });

    try {
      const games = await getGames();
      const normalizedGames = games.map(this.normalizeGame);
      const gameView = this.buildGameView(normalizedGames, this.data.keyword, this.data.showAllGames);
      this.setData({
        games: normalizedGames,
        ...gameView
      });
    } catch (error) {
      console.error("读取游戏列表失败", error);
      this.setData({
        errorMessage: error.code === "CLOUD_ENV_NOT_CONFIGURED"
          ? "内容服务暂未准备好，请稍后再试。"
          : "暂时无法读取攻略库，请稍后再试。"
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
  }
});
