const { listAdminArticles } = require("../../../utils/db");

Page({
  data: {
    articles: [],
    loading: true,
    errorMessage: ""
  },

  onShow() {
    this.loadArticles();
  },

  async loadArticles() {
    this.setData({ loading: true, errorMessage: "" });
    try {
      const articles = await listAdminArticles();
      this.setData({ articles });
    } catch (error) {
      console.error("读取管理列表失败", error);
      this.setData({ errorMessage: "读取文章列表失败。" });
    } finally {
      this.setData({ loading: false });
    }
  },

  createArticle() {
    wx.navigateTo({ url: "/pages/admin/article-editor/article-editor" });
  },

  editArticle(event) {
    const { id } = event.currentTarget.dataset;
    wx.navigateTo({ url: `/pages/admin/article-editor/article-editor?id=${id}` });
  }
});
