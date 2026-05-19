const rk = require("../../../utils/rk/index");

const TABS = [
  { id: "stats", label: "属性面板" },
  { id: "skills", label: "可学技能" },
  { id: "egg", label: "蛋孵化" }
];

Page({
  data: {
    petId: 0,
    pet: null,
    moves: [],
    coverUrl: "",
    activeTab: "stats",
    tabs: TABS,
    loading: true,
    errorMessage: ""
  },

  async onLoad(options) {
    const petId = Number(options.id) || 0;
    if (!petId) {
      this.setData({ loading: false, errorMessage: "缺少精灵 ID。" });
      return;
    }
    this.setData({ petId });
    try {
      const pet = await rk.getPet(petId);
      if (!pet) {
        this.setData({ loading: false, errorMessage: "未找到该精灵。" });
        return;
      }
      this.setData({ pet, loading: false });
      wx.setNavigationBarTitle({ title: pet.nameZh || pet.name || "精灵详情" });
      this.resolveCover(pet);
      this.loadMoves(pet.skills || []);
    } catch (error) {
      console.error("精灵详情加载失败", error);
      this.setData({
        loading: false,
        errorMessage:
          error.code === "CLOUD_ENV_NOT_CONFIGURED"
            ? "云开发未配置，暂时仅可查看 mock 列表中的精灵。"
            : "精灵详情加载失败。"
      });
    }
  },

  async resolveCover(pet) {
    if (!pet.coverImage) return;
    const map = await rk.resolveCloudUrls([pet.coverImage]);
    if (map[pet.coverImage]) {
      this.setData({ coverUrl: map[pet.coverImage] });
    }
  },

  async loadMoves(skillIds) {
    if (!skillIds || !skillIds.length) return;
    try {
      const moves = await rk.getMovesByIds(skillIds);
      this.setData({ moves });
    } catch (error) {
      console.warn("加载技能失败", error);
    }
  },

  handleTabTap(event) {
    const { id } = event.currentTarget.dataset;
    this.setData({ activeTab: id });
  }
});
