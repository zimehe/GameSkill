const cloud = require("wx-server-sdk");

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

const db = cloud.database();

async function assertAdmin(openid) {
  const { data } = await db.collection("admins")
    .where({ openid })
    .limit(1)
    .get();
  if (data.length === 0) {
    const error = new Error("无管理员权限");
    error.code = "PERMISSION_DENIED";
    throw error;
  }
}

exports.main = async (event) => {
  const { OPENID } = cloud.getWXContext();
  await assertAdmin(OPENID);

  const { action, article } = event;
  if (action !== "save" || !article) {
    return { ok: false, message: "unsupported action" };
  }

  const id = article._id || `article-${Date.now()}`;
  const { _id, ...data } = article;
  await db.collection("articles").doc(id).set({
    data: {
      ...data,
      updatedAt: new Date()
    }
  });

  return {
    ok: true,
    article: { _id: id, ...data }
  };
};
