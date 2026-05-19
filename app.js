App({
  globalData: {
    appName: "云玩家游客图鉴",
    cloudEnvId: "cloud1-d7gr6v1ap412a239a",
    cloudReady: false,
    useMockData: true,
    openid: "",
    adminTapCount: 0,
    // 上传一张测试图片到云存储后，把返回的 fileID 的「cloud://…/」前缀（含末尾的 /）填到这里，
    // 例如 "cloud://cloud1-d7gr6v1ap412a239a.7072-cloud1-d7gr6v1ap412a239a-1300xxxxxx/"。
    // 设置后，洛克王国精灵/道具/技能图标会自动用 assetPath 拼出可显示的 fileID。
    cloudFileIDPrefix: ""
  },

  onLaunch() {
    if (!wx.cloud) {
      console.warn("当前基础库不支持云开发，请升级微信基础库。");
      return;
    }

    if (!this.globalData.cloudEnvId) {
      console.warn("云开发环境未配置，页面将显示配置提示。");
      return;
    }

    wx.cloud.init({
      env: this.globalData.cloudEnvId,
      traceUser: true
    });

    this.globalData.cloudReady = true;
    this.loadOpenId();
  },

  loadOpenId() {
    if (this.globalData.useMockData) {
      this.globalData.openid = "mock-admin-openid";
      return;
    }

    wx.cloud.callFunction({
      name: "getOpenId",
      success: (res) => {
        this.globalData.openid = res.result && res.result.openid ? res.result.openid : "";
      },
      fail: (error) => {
        console.warn("获取 openid 失败", error);
      }
    });
  }
});
