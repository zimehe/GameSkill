const rk = require("../../../utils/rk/index");

Page({
  data: {
    keyword: "",
    moves: [],
    selectedMove: null,
    pets: [],
    searching: false,
    finding: false,
    errorMessage: ""
  },

  handleInput(event) {
    this.setData({ keyword: event.detail.value });
  },

  async submitSearch() {
    const keyword = String(this.data.keyword || "").trim();
    if (!keyword) {
      this.setData({ moves: [], errorMessage: "请输入技能名后再搜索。" });
      return;
    }
    this.setData({ searching: true, errorMessage: "", moves: [], selectedMove: null, pets: [] });
    try {
      const { list } = await rk.listMoves({ keyword, page: 1, pageSize: 20 });
      this.setData({ moves: list, searching: false });
      if (list.length === 0) {
        this.setData({ errorMessage: "没有匹配的技能。" });
      }
    } catch (error) {
      console.error("搜索技能失败", error);
      this.setData({
        searching: false,
        errorMessage:
          error.code === "CLOUD_ENV_NOT_CONFIGURED"
            ? "内容服务暂未准备好，请稍后再试。"
            : "搜索技能失败。"
      });
    }
  },

  async handleMoveTap(event) {
    const moveId = Number(event.currentTarget.dataset.id);
    const selectedMove = this.data.moves.find((m) => m.moveId === moveId) || null;
    this.setData({ selectedMove, pets: [], finding: true });
    try {
      const pets = await rk.findPetsBySkill(moveId);
      this.setData({ pets, finding: false });
    } catch (error) {
      console.error("查询精灵失败", error);
      this.setData({ finding: false, errorMessage: "查询精灵失败。" });
    }
  },

  handlePetTap(event) {
    const { id } = event.currentTarget.dataset;
    wx.navigateTo({ url: `/pages/rock-kingdom/pet-detail/pet-detail?id=${id}` });
  }
});
