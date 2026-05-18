const { searchArticles } = require("../../utils/db");

Page({
  data: {
    keyword: "",
    results: [],
    searched: false,
    loading: false,
    errorMessage: ""
  },

  onLoad(options) {
    const keyword = decodeURIComponent(options.keyword || "");
    this.setData({ keyword });
    if (keyword) this.doSearch(keyword);
  },

  handleInput(event) {
    this.setData({ keyword: event.detail.value });
  },

  submitSearch() {
    const keyword = String(this.data.keyword || "").trim();
    if (!keyword) {
      wx.showToast({ title: "请输入关键词", icon: "none" });
      return;
    }
    this.doSearch(keyword);
  },

  async doSearch(keyword) {
    this.setData({ loading: true, errorMessage: "", searched: true });

    try {
      const results = await searchArticles(keyword);
      this.setData({ results });
    } catch (error) {
      console.error("搜索失败", error);
      this.setData({ errorMessage: "搜索失败，请稍后再试。" });
    } finally {
      this.setData({ loading: false });
    }
  },

  openArticle(event) {
    const { id } = event.currentTarget.dataset;
    if (!id) return;
    wx.navigateTo({ url: `/pages/detail/detail?id=${id}` });
  }
});
