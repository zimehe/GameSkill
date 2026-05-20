// utils/rk/index.js
// 洛克王国数据访问层：mock 模式直接读 utils/rk/mock.js，云端模式读 CloudBase rk_* 集合。

const mock = require("./mock");

function getAppState() {
  return getApp().globalData || {};
}

function isMockMode() {
  return !!getAppState().useMockData;
}

function getCloudDb() {
  const app = getAppState();
  if (!wx.cloud || !app.cloudReady) {
    const err = new Error("云开发环境未配置");
    err.code = "CLOUD_ENV_NOT_CONFIGURED";
    throw err;
  }
  return wx.cloud.database();
}

function ensureArray(value) {
  return Array.isArray(value) ? value : [];
}

function getFallbackInitial(record) {
  const name = String((record && (record.nameZh || record.name || record.key)) || "?");
  return name.charAt(0) || "?";
}

function buildCloudFileId(assetPath) {
  if (!assetPath) return "";
  const prefix = getAppState().cloudFileIDPrefix || "";
  if (!prefix) return "";
  const normalized = prefix.endsWith("/") ? prefix : `${prefix}/`;
  const assetRoot = String(getAppState().cloudAssetRoot || "rock-kingdom").replace(/^\/+|\/+$/g, "");
  return `${normalized}${assetRoot}/${assetPath}`;
}

// 给一条记录补 coverImage：
// - 只要存在 assetPath + cloudFileIDPrefix，就按当前配置重新拼 fileID
// - 这样可以覆盖云数据库里历史写入的占位值或旧路径
function fillCoverImage(record) {
  if (!record) return record;
  const next = { ...record };
  if (!next.initial) {
    next.initial = getFallbackInitial(next);
  }
  const configuredFileId = buildCloudFileId(next.assetPath);
  if (configuredFileId) {
    next.coverImage = configuredFileId;
  }
  return next;
}

function fillCoverList(list) {
  return list.map(fillCoverImage);
}

function isCloudFileId(value) {
  return typeof value === "string" && value.indexOf("cloud://") === 0;
}

function isRemoteImageUrl(value) {
  return typeof value === "string" && /^https?:\/\//.test(value);
}

async function resolveCoverList(list) {
  const filled = fillCoverList(list);
  const fileIds = Array.from(new Set(
    filled
      .map((item) => item.coverImage)
      .filter(isCloudFileId)
  ));

  if (!fileIds.length) {
    return filled.map((item) => ({
      ...item,
      displayCoverImage: isRemoteImageUrl(item.coverImage) ? item.coverImage : ""
    }));
  }

  const urlMap = await resolveCloudUrls(fileIds);
  return filled.map((item) => {
    const tempUrl = urlMap[item.coverImage] || "";
    return {
      ...item,
      displayCoverImage: isRemoteImageUrl(tempUrl) ? tempUrl : ""
    };
  });
}

async function resolveCoverItem(item) {
  const list = await resolveCoverList(item ? [item] : []);
  return list[0] || null;
}

function matchKeyword(item, keyword) {
  if (!keyword) return true;
  const haystack = [
    item.name,
    item.nameZh,
    item.searchTokens,
    item.key,
    item.category,
    item.qualityLabel,
    item.descriptionZh,
    item.description,
    item.mainType && item.mainType.nameZh,
    item.subType && item.subType.nameZh,
    item.typeNameZh
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return haystack.indexOf(keyword.toLowerCase()) >= 0;
}

function sortPets(list, sortMode) {
  const copy = list.slice();
  if (sortMode === "spd") {
    return copy.sort((a, b) => (b.baseStats?.spd || 0) - (a.baseStats?.spd || 0));
  }
  if (sortMode === "total") {
    return copy.sort((a, b) => (b.baseStats?.total || 0) - (a.baseStats?.total || 0));
  }
  return copy.sort((a, b) => (a.petId || 0) - (b.petId || 0));
}

async function listPets({ keyword = "", typeId = null, sortMode = "id", page = 1, pageSize = 20 } = {}) {
  const safeKw = String(keyword || "").trim();
  if (isMockMode()) {
    let pool = mock.pets.slice();
    if (typeId) {
      pool = pool.filter((p) => (p.mainType && p.mainType.id === typeId) || (p.subType && p.subType.id === typeId));
    }
    pool = pool.filter((p) => matchKeyword(p, safeKw));
    pool = sortPets(pool, sortMode);
    const start = (page - 1) * pageSize;
    return { total: pool.length, list: await resolveCoverList(pool.slice(start, start + pageSize)) };
  }

  const db = getCloudDb();
  const _ = db.command;
  const filters = [];
  if (safeKw) {
    const regExp = db.RegExp({ regexp: safeKw, options: "i" });
    filters.push(_.or([
      { nameZh: regExp },
      { name: regExp },
      { searchTokens: regExp }
    ]));
  }
  if (typeId) {
    filters.push(_.or([
      { "mainType.id": typeId },
      { "subType.id": typeId }
    ]));
  }
  const where = filters.length ? _.and(filters) : {};

  let orderField = "petId";
  let orderDir = "asc";
  if (sortMode === "spd") { orderField = "baseStats.spd"; orderDir = "desc"; }
  if (sortMode === "total") { orderField = "baseStats.total"; orderDir = "desc"; }

  const collection = db.collection("rk_pets");
  const [{ total }, { data }] = await Promise.all([
    collection.where(where).count(),
    collection.where(where).orderBy(orderField, orderDir).skip((page - 1) * pageSize).limit(pageSize).get()
  ]);

  return { total, list: await resolveCoverList(data) };
}

async function getPet(petId) {
  const numericId = Number(petId);
  if (isMockMode()) {
    const pet = mock.pets.find((p) => p.petId === numericId) || null;
    const skills = mock.petSkills.find((p) => p.petId === numericId);
    return pet ? resolveCoverItem({ ...pet, skills: skills ? skills.movePoolIds : [] }) : null;
  }
  const db = getCloudDb();
  const docId = `rk-pet-${numericId}`;
  const [petRes, skillsRes] = await Promise.all([
    db.collection("rk_pets").doc(docId).get().catch(() => ({ data: null })),
    db.collection("rk_pet_skills").doc(`rk-pet-skills-${numericId}`).get().catch(() => ({ data: null }))
  ]);
  if (!petRes.data) return null;
  return resolveCoverItem({
    _id: docId,
    ...petRes.data,
    skills: skillsRes.data ? (skillsRes.data.movePoolIds || []) : []
  });
}

async function getMovesByIds(moveIds) {
  const ids = ensureArray(moveIds);
  if (!ids.length) return [];
  if (isMockMode()) {
    return ids.map((id) => mock.moves.find((m) => m.moveId === id)).filter(Boolean);
  }
  const db = getCloudDb();
  const _ = db.command;
  const { data } = await db.collection("rk_moves").where({ moveId: _.in(ids) }).limit(100).get();
  return data;
}

async function listMoves({ keyword = "", typeId = null, category = "", page = 1, pageSize = 30 } = {}) {
  const safeKw = String(keyword || "").trim();
  if (isMockMode()) {
    let pool = mock.moves.slice();
    if (typeId) pool = pool.filter((m) => m.typeId === typeId);
    if (category) pool = pool.filter((m) => m.moveCategory === category);
    pool = pool.filter((m) => matchKeyword(m, safeKw));
    const start = (page - 1) * pageSize;
    return { total: pool.length, list: pool.slice(start, start + pageSize) };
  }

  const db = getCloudDb();
  const _ = db.command;
  const filters = [];
  if (safeKw) {
    const regExp = db.RegExp({ regexp: safeKw, options: "i" });
    filters.push(_.or([{ nameZh: regExp }, { name: regExp }, { descriptionZh: regExp }]));
  }
  if (typeId) filters.push({ typeId });
  if (category) filters.push({ moveCategory: category });
  const where = filters.length ? _.and(filters) : {};

  const collection = db.collection("rk_moves");
  const [{ total }, { data }] = await Promise.all([
    collection.where(where).count(),
    collection.where(where).orderBy("moveId", "asc").skip((page - 1) * pageSize).limit(pageSize).get()
  ]);
  return { total, list: data };
}

async function findPetsBySkill(moveId) {
  const targetId = Number(moveId);
  if (!targetId) return [];

  if (isMockMode()) {
    const petIds = mock.petSkills
      .filter((entry) => entry.movePoolIds.indexOf(targetId) >= 0)
      .map((entry) => entry.petId);
    return resolveCoverList(mock.pets.filter((p) => petIds.indexOf(p.petId) >= 0));
  }

  const db = getCloudDb();
  const _ = db.command;
  const { data: skillEntries } = await db.collection("rk_pet_skills")
    .where({ movePoolIds: _.elemMatch(_.eq(targetId)) })
    .limit(200)
    .get();
  const petIds = skillEntries.map((entry) => entry.petId);
  if (!petIds.length) return [];

  const chunks = [];
  for (let i = 0; i < petIds.length; i += 20) chunks.push(petIds.slice(i, i + 20));
  const results = await Promise.all(chunks.map((ids) =>
    db.collection("rk_pets").where({ petId: _.in(ids) }).limit(20).get().then((res) => res.data)
  ));
  return resolveCoverList(results.flat());
}

async function getTypes() {
  if (isMockMode()) return mock.types;
  const db = getCloudDb();
  const { data } = await db.collection("rk_types").orderBy("typeId", "asc").limit(50).get();
  return data;
}

async function getPersonalities() {
  if (isMockMode()) return mock.personalities;
  const db = getCloudDb();
  const { data } = await db.collection("rk_personalities").orderBy("personalityId", "asc").limit(50).get();
  return data;
}

async function getTerms() {
  if (isMockMode()) return mock.terms;
  const db = getCloudDb();
  const { data } = await db.collection("rk_terms").orderBy("sortOrder", "asc").limit(200).get();
  return data;
}

async function getItems({ page = 1, pageSize = 30 } = {}) {
  if (isMockMode()) {
    const start = (page - 1) * pageSize;
    return { total: mock.items.length, list: await resolveCoverList(mock.items.slice(start, start + pageSize)) };
  }
  const db = getCloudDb();
  const collection = db.collection("rk_items");
  const [{ total }, { data }] = await Promise.all([
    collection.count(),
    collection.orderBy("itemId", "asc").skip((page - 1) * pageSize).limit(pageSize).get()
  ]);
  return { total, list: await resolveCoverList(data) };
}

async function resolveCloudUrls(fileIds) {
  const ids = ensureArray(fileIds).filter((id) => typeof id === "string" && id.indexOf("cloud://") === 0);
  if (!ids.length) return {};
  if (!wx.cloud) return {};
  const map = {};
  const failedIds = [];

  try {
    const res = await wx.cloud.getTempFileURL({ fileList: ids });
    (res.fileList || []).forEach((item) => {
      if (item && item.fileID && item.tempFileURL) {
        map[item.fileID] = item.tempFileURL;
      } else if (item && item.fileID) {
        console.warn("[rk] 图片 fileID 转链失败", item.fileID, item.status, item.errMsg);
        failedIds.push(item.fileID);
      }
    });
  } catch (error) {
    console.warn("[rk] 转换 cloud:// 临时链接失败", error);
    failedIds.push(...ids);
  }

  const unresolvedIds = Array.from(new Set(ids.filter((id) => !map[id]).concat(failedIds)));
  if (!unresolvedIds.length) return map;

  try {
    const res = await wx.cloud.callFunction({
      name: "getRkImageUrls",
      data: { fileList: unresolvedIds }
    });
    ((res.result && res.result.fileList) || []).forEach((item) => {
      if (item && item.fileID && item.tempFileURL) {
        map[item.fileID] = item.tempFileURL;
      } else if (item && item.fileID) {
        console.warn("[rk] 云函数图片转链失败", item.fileID, item.status, item.errMsg);
      }
    });
  } catch (error) {
    console.warn("[rk] getRkImageUrls 云函数不可用，图片将显示首字兜底", error);
  }

  return map;
}

module.exports = {
  isMockMode,
  listPets,
  getPet,
  getMovesByIds,
  listMoves,
  findPetsBySkill,
  getTypes,
  getPersonalities,
  getTerms,
  getItems,
  resolveCloudUrls
};
