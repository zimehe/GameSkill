const rk = require("../../../utils/rk/index");

// 计算 攻击属性 → 防御属性 的倍率：
// - 如果防御属性的 vulnerable_to 包含攻击属性 → 2 倍
// - 如果防御属性的 resistant_to 包含攻击属性 → 0.5 倍
// - 否则 1 倍
function buildMatrix(types) {
  const filtered = types.filter((t) => t.name !== "Leader");
  const rows = filtered.map((attacker) => ({
    attacker,
    cells: filtered.map((defender) => {
      const isVulnerable = (defender.vulnerableTo || []).indexOf(attacker.name) >= 0;
      const isResistant = (defender.resistantTo || []).indexOf(attacker.name) >= 0;
      if (isVulnerable && !isResistant) return { value: 2, label: "×2", className: "cell-strong" };
      if (isResistant && !isVulnerable) return { value: 0.5, label: "×0.5", className: "cell-weak" };
      if (isResistant && isVulnerable) return { value: 1, label: "×1", className: "cell-neutral" };
      return { value: 1, label: "—", className: "cell-neutral" };
    })
  }));
  return { headers: filtered, rows };
}

Page({
  data: {
    types: [],
    headers: [],
    rows: [],
    highlight: 0,
    loading: true,
    errorMessage: ""
  },

  async onLoad() {
    try {
      const types = await rk.getTypes();
      const { headers, rows } = buildMatrix(types);
      this.setData({ types, headers, rows, loading: false });
    } catch (error) {
      console.error("属性表加载失败", error);
      this.setData({
        loading: false,
        errorMessage:
          error.code === "CLOUD_ENV_NOT_CONFIGURED"
            ? "内容服务暂未准备好，请稍后再试。"
            : "属性表加载失败。"
      });
    }
  },

  handleAttackerTap(event) {
    const { id } = event.currentTarget.dataset;
    const highlight = Number(id) || 0;
    this.setData({ highlight: highlight === this.data.highlight ? 0 : highlight });
  }
});
