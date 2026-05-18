const cloud = require("wx-server-sdk");

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

const db = cloud.database();
const _ = db.command;

exports.main = async (event) => {
  const { OPENID } = cloud.getWXContext();
  const { type, articleId, keyword } = event;
  const now = new Date();

  await db.collection("events").add({
    data: {
      openid: OPENID,
      type,
      articleId: articleId || "",
      keyword: keyword || "",
      createdAt: now
    }
  });

  if (type === "clearHistory") {
    const { data } = await db.collection("history")
      .where({ openid: OPENID })
      .limit(100)
      .get();

    await Promise.all(data.map((item) => db.collection("history").doc(item._id).remove()));
    return { ok: true };
  }

  if (type === "view" && articleId) {
    await db.collection("articles").doc(articleId).update({
      data: { viewCount: _.inc(1) }
    });

    const existed = await db.collection("history")
      .where({ openid: OPENID, articleId })
      .limit(1)
      .get();

    if (existed.data.length > 0) {
      await db.collection("history").doc(existed.data[0]._id).update({
        data: { lastViewedAt: now, viewCount: _.inc(1) }
      });
    } else {
      await db.collection("history").add({
        data: { openid: OPENID, articleId, lastViewedAt: now, viewCount: 1 }
      });
    }
  }

  if (type === "share" && articleId) {
    await db.collection("articles").doc(articleId).update({
      data: { shareCount: _.inc(1) }
    });
  }

  return { ok: true };
};
