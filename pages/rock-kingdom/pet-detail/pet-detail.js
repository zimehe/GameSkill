const rk = require("../../../utils/rk/index");

const TABS = [
  { id: "stats", label: "属性面板" },
  { id: "skills", label: "可学技能" },
  { id: "egg", label: "蛋孵化" }
];

const STAT_FIELDS = [
  { key: "hp", label: "体力" },
  { key: "phyAtk", label: "物攻" },
  { key: "magAtk", label: "魔攻" },
  { key: "phyDef", label: "物防" },
  { key: "magDef", label: "魔防" },
  { key: "spd", label: "速度" }
];
const STAT_BAR_MAX = 200;

function buildStatRows(baseStats = {}) {
  return STAT_FIELDS.map((field) => {
    const value = Number(baseStats[field.key]) || 0;
    const percent = Math.max(0, Math.min(100, Math.round((value / STAT_BAR_MAX) * 100)));
    return {
      ...field,
      value,
      barWidth: `${percent}%`
    };
  });
}

Page({
  data: {
    petId: 0,
    pet: null,
    moves: [],
    statRows: [],
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
      this.setData({
        pet,
        statRows: buildStatRows(pet.baseStats),
        loading: false
      });
      wx.setNavigationBarTitle({ title: pet.nameZh || pet.name || "精灵详情" });
      this.loadMoves(pet.skills || []);
    } catch (error) {
      console.error("精灵详情加载失败", error);
      this.setData({
        loading: false,
        errorMessage:
          error.code === "CLOUD_ENV_NOT_CONFIGURED"
            ? "内容服务暂未准备好，请稍后再试。"
            : "精灵详情加载失败。"
      });
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
