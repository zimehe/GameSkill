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

// 给一条记录补 coverImage：
// - 如果 record 已经有 coverImage（含 cloud://），直接保留
// - 否则用 cloudFileIDPrefix + 'rock-kingdom/' + assetPath 拼出 fileID
function fillCoverImage(record) {
  if (!record || record.coverImage) return record;
  if (!record.assetPath) return record;
  const prefix = getAppState().cloudFileIDPrefix || "";
  if (!prefix) return record;
  const normalized = prefix.endsWith("/") ? prefix : `${prefix}/`;
  return { ...record, coverImage: `${normalized}rock-kingdom/${record.assetPath}` };
}

function fillCoverList(list) {
  return list.map(fillCoverImage);
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
    return { total: pool.length, list: fillCoverList(pool.slice(start, start + pageSize)) };
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

  return { total, list: fillCoverList(data) };
}

async function getPet(petId) {
  const numericId = Number(petId);
  if (isMockMode()) {
    const pet = mock.pets.find((p) => p.petId === numericId) || null;
    const skills = mock.petSkills.find((p) => p.petId === numericId);
    return pet ? fillCoverImage({ ...pet, skills: skills ? skills.movePoolIds : [] }) : null;
  }
  const db = getCloudDb();
  const docId = `rk-pet-${numericId}`;
  const [petRes, skillsRes] = await Promise.all([
    db.collection("rk_pets").doc(docId).get().catch(() => ({ data: null })),
    db.collection("rk_pet_skills").doc(`rk-pet-skills-${numericId}`).get().catch(() => ({ data: null }))
  ]);
  if (!petRes.data) return null;
  return fillCoverImage({
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
    return fillCoverList(mock.pets.filter((p) => petIds.indexOf(p.petId) >= 0));
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
  return fillCoverList(results.flat());
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
    return { total: mock.items.length, list: fillCoverList(mock.items.slice(start, start + pageSize)) };
  }
  const db = getCloudDb();
  const collection = db.collection("rk_items");
  const [{ total }, { data }] = await Promise.all([
    collection.count(),
    collection.orderBy("itemId", "asc").skip((page - 1) * pageSize).limit(pageSize).get()
  ]);
  return { total, list: fillCoverList(data) };
}

async function resolveCloudUrls(fileIds) {
  const ids = ensureArray(fileIds).filter((id) => typeof id === "string" && id.indexOf("cloud://") === 0);
  if (!ids.length) return {};
  if (!wx.cloud) return {};
  try {
    const res = await wx.cloud.getTempFileURL({ fileList: ids });
    const map = {};
    (res.fileList || []).forEach((item) => {
      if (item && item.fileID && item.tempFileURL) {
        map[item.fileID] = item.tempFileURL;
      }
    });
    return map;
  } catch (error) {
    console.warn("[rk] 转换 cloud:// 临时链接失败", error);
    return {};
  }
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
