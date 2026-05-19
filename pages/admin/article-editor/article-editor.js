const { getArticle, getGames, getCategories, saveArticle } = require("../../../utils/db");

const blankArticle = {
  _id: "",
  title: "",
  gameSlug: "wuthering-waves",
  gameName: "鸣潮",
  categoryId: "cat-ww-character-index",
  summary: "",
  tagsText: "",
  coverImage: "",
  imageUrlsText: "",
  contentHtml: "",
  status: "draft"
};

Page({
  data: {
    article: { ...blankArticle },
    games: [],
    categories: [],
    loading: true
  },

  onLoad(options) {
    this.loadEditor(options.id || "");
  },

  async loadEditor(id) {
    const games = await getGames();
    const article = id ? await getArticle(id) : null;
    const current = article ? {
      ...article,
      tagsText: (article.tags || []).join("，"),
      imageUrlsText: (article.imageUrls || []).join("\n")
    } : { ...blankArticle };
    const categories = await getCategories(current.gameSlug);

    this.setData({
      games,
      categories,
      article: current,
      loading: false
    });
  },

  handleInput(event) {
    const { field } = event.currentTarget.dataset;
    this.setData({
      article: {
        ...this.data.article,
        [field]: event.detail.value
      }
    });
  },

  async handleGameChange(event) {
    const game = this.data.games[event.detail.value];
    const categories = await getCategories(game.slug);
    this.setData({
      categories,
      article: {
        ...this.data.article,
        gameSlug: game.slug,
        gameName: game.name,
        categoryId: categories[0] ? categories[0]._id : ""
      }
    });
  },

  handleCategoryChange(event) {
    const category = this.data.categories[event.detail.value];
    this.setData({
      article: {
        ...this.data.article,
        categoryId: category ? category._id : ""
      }
    });
  },

  handleStatusChange(event) {
    this.setData({
      article: {
        ...this.data.article,
        status: event.detail.value ? "published" : "draft"
      }
    });
  },

  async saveArticle() {
    const article = this.data.article;
    if (!article.title || !article.summary || !article.contentHtml) {
      wx.showToast({ title: "请补齐标题、摘要和正文", icon: "none" });
      return;
    }

    const saved = await saveArticle({
      ...article,
      tags: article.tagsText,
      imageUrls: article.imageUrlsText
    });
    wx.showToast({ title: "已保存", icon: "success" });
    this.setData({ article: { ...saved, tagsText: (saved.tags || []).join("，"), imageUrlsText: (saved.imageUrls || []).join("\n") } });
  }
});
