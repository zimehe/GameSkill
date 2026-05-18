const { isAdmin } = require("../../../utils/db");

Page({
  data: {
    loading: true,
    allowed: false
  },

  onShow() {
    this.checkAdmin();
  },

  async checkAdmin() {
    this.setData({ loading: true });
    const allowed = await isAdmin();
    this.setData({ allowed, loading: false });
  },

  openArticleList() {
    if (!this.data.allowed) return;
    wx.navigateTo({ url: "/pages/admin/article-list/article-list" });
  }
});
