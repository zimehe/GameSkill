App({
  globalData: {
    appName: "云玩家游客图鉴",
    cloudEnvId: "cloud1-d7gr6v1ap412a239a",
    cloudReady: false,
    useMockData: false,
    openid: "",
    adminTapCount: 0,
    // 云存储图片根路径。当前已上传到 webp/friends、webp/items。
    cloudAssetRoot: "webp",
    // 上传图片后复制任意 File ID，截取到资源根目录前（含末尾 /）。
    cloudFileIDPrefix: "cloud://cloud1-d7gr6v1ap412a239a.636c-cloud1-d7gr6v1ap412a239a-1434282942/"
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
