const cloud = require("wx-server-sdk");

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

const db = cloud.database();
const _ = db.command;

exports.main = async (event) => {
  const { OPENID } = cloud.getWXContext();
  const { articleId } = event;
  if (!articleId) return { favorited: false };

  const existed = await db.collection("favorites")
    .where({ openid: OPENID, articleId })
    .limit(1)
    .get();

  if (existed.data.length > 0) {
    await db.collection("favorites").doc(existed.data[0]._id).remove();
    await db.collection("articles").doc(articleId).update({
      data: { favoriteCount: _.inc(-1) }
    });
    return { favorited: false };
  }

  await db.collection("favorites").add({
    data: {
      openid: OPENID,
      articleId,
      createdAt: new Date()
    }
  });
  await db.collection("articles").doc(articleId).update({
    data: { favoriteCount: _.inc(1) }
  });
  return { favorited: true };
};
