const rk = require("../../../utils/rk/index");

const PAGE_SIZE = 20;

const SORTS = [
  { id: "id", label: "编号" },
  { id: "spd", label: "速度" },
  { id: "total", label: "总点" }
];

Page({
  data: {
    keyword: "",
    typeId: 0,
    sortMode: "id",
    types: [],
    sorts: SORTS,
    pets: [],
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

  handleSortTap(event) {
    const { mode } = event.currentTarget.dataset;
    if (mode === this.data.sortMode) return;
    this.setData({ sortMode: mode });
    this.reload();
  },

  async reload() {
    this.setData({ page: 1, pets: [], finished: false, loading: true, errorMessage: "" });
    await this.fetchPage();
  },

  async onReachBottom() {
    if (this.data.loading || this.data.loadingMore || this.data.finished) return;
    this.setData({ loadingMore: true, page: this.data.page + 1 });
    await this.fetchPage(true);
  },

  async fetchPage(append = false) {
    try {
      const { keyword, typeId, sortMode, page } = this.data;
      const { total, list } = await rk.listPets({
        keyword,
        typeId: typeId || null,
        sortMode,
        page,
        pageSize: PAGE_SIZE
      });
      const merged = append ? this.data.pets.concat(list) : list;
      const finished = merged.length >= total;
      if (!append && list[0]) {
        console.log("[pet-list] first cover", {
          assetPath: list[0].assetPath,
          coverImage: list[0].coverImage,
          displayCoverImage: list[0].displayCoverImage
        });
      }

      this.setData({
        pets: merged,
        total,
        finished,
        loading: false,
        loadingMore: false
      });
    } catch (error) {
      console.error("精灵列表加载失败", error);
      this.setData({
        loading: false,
        loadingMore: false,
        errorMessage:
          error.code === "CLOUD_ENV_NOT_CONFIGURED"
            ? "内容服务暂未准备好，请稍后再试。"
            : "精灵列表加载失败，请稍后再试。"
      });
    }
  },

  handlePetTap(event) {
    const { id } = event.currentTarget.dataset;
    wx.navigateTo({ url: `/pages/rock-kingdom/pet-detail/pet-detail?id=${id}` });
  }
});
