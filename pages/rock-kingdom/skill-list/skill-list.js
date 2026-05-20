const rk = require("../../../utils/rk/index");

const PAGE_SIZE = 30;

const CATEGORIES = [
  { id: "", label: "全部" },
  { id: "Physical Attack", label: "物攻" },
  { id: "Magic Attack", label: "魔攻" },
  { id: "Status", label: "状态" }
];

Page({
  data: {
    keyword: "",
    typeId: 0,
    category: "",
    categories: CATEGORIES,
    types: [],
    moves: [],
    total: 0,
    page: 1,
    loading: false,
    loadingMore: false,
    finished: false,
    errorMessage: ""
  },

  async onLoad() {
    try {
      const types = await rk.getTypes();
      this.setData({ types });
    } catch (error) {
      console.warn("加载属性失败", error);
    }
    this.reload();
  },

  handleInput(event) {
    this.setData({ keyword: event.detail.value });
  },

  submitSearch() {
    this.reload();
  },

  handleTypeTap(event) {
    const { id } = event.currentTarget.dataset;
    const typeId = Number(id) || 0;
    if (typeId === this.data.typeId) return;
    this.setData({ typeId });
    this.reload();
  },

  handleCategoryTap(event) {
    const { id } = event.currentTarget.dataset;
    if (id === this.data.category) return;
    this.setData({ category: id });
    this.reload();
  },

  async reload() {
    this.setData({ page: 1, moves: [], finished: false, loading: true, errorMessage: "" });
    await this.fetchPage();
  },

  async onReachBottom() {
    if (this.data.loading || this.data.loadingMore || this.data.finished) return;
    this.setData({ loadingMore: true, page: this.data.page + 1 });
    await this.fetchPage(true);
  },

  async fetchPage(append = false) {
    try {
      const { keyword, typeId, category, page } = this.data;
      const { total, list } = await rk.listMoves({
        keyword,
        typeId: typeId || null,
        category,
        page,
        pageSize: PAGE_SIZE
      });
      const merged = append ? this.data.moves.concat(list) : list;
      const finished = merged.length >= total;
      this.setData({
        moves: merged,
        total,
        finished,
        loading: false,
        loadingMore: false
      });
    } catch (error) {
      console.error("技能列表加载失败", error);
      this.setData({
        loading: false,
        loadingMore: false,
        errorMessage:
          error.code === "CLOUD_ENV_NOT_CONFIGURED"
            ? "内容服务暂未准备好，请稍后再试。"
            : "技能列表加载失败。"
      });
    }
  }
});
