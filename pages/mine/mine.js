const { getFavoriteArticles, getHistoryArticles, clearHistory } = require("../../utils/db");

Page({
  data: {
    favorites: [],
    history: [],
    activeTab: "favorites",
    loading: true,
    errorMessage: ""
  },

  onShow() {
    this.loadMineData();
  },

  async loadMineData() {
    this.setData({ loading: true, errorMessage: "" });

    try {
      const [favorites, history] = await Promise.all([
        getFavoriteArticles(),
        getHistoryArticles()
      ]);
      this.setData({ favorites, history });
    } catch (error) {
      console.error("读取我的页面失败", error);
      this.setData({ errorMessage: "暂时无法读取收藏和历史。" });
    } finally {
      this.setData({ loading: false });
    }
  },

  switchTab(event) {
    this.setData({ activeTab: event.currentTarget.dataset.tab });
  },

  openArticle(event) {
    const { id } = event.currentTarget.dataset;
    if (!id) return;
    wx.navigateTo({ url: `/pages/detail/detail?id=${id}` });
  },

  async clearHistory() {
    await clearHistory();
    wx.showToast({ title: "已清空", icon: "success" });
    this.loadMineData();
  }
});
