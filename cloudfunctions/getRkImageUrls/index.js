const cloud = require("wx-server-sdk");

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

exports.main = async (event = {}) => {
  const fileList = Array.isArray(event.fileList)
    ? event.fileList.filter((id) => typeof id === "string" && id.indexOf("cloud://") === 0)
    : [];

  if (!fileList.length) {
    return { ok: true, fileList: [] };
  }

  const res = await cloud.getTempFileURL({
    fileList
  });

  return {
    ok: true,
    fileList: res.fileList || []
  };
};
