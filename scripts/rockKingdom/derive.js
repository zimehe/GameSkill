#!/usr/bin/env node
/* eslint-disable no-console */

// 将 utils/data 原始 JSON 规范化为可直接灌入 CloudBase 集合的瘦身数据。
// 输出在 scripts/rockKingdom/output/ 下，供 uploadData.js / seedArticles.js 使用。

const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..", "..");
const DATA_DIR = path.join(ROOT, "utils", "data");
const ASSET_DIR = path.join(ROOT, "utils", "assets", "webp");
const OUT_DIR = path.join(__dirname, "output");

function readJson(relPath) {
  const full = path.join(DATA_DIR, relPath);
  if (!fs.existsSync(full)) {
    throw new Error(`原始数据缺失：${relPath}`);
  }
  return JSON.parse(fs.readFileSync(full, "utf8"));
}

function tryReadJson(relPath) {
  try {
    return readJson(relPath);
  } catch (error) {
    console.warn(`[derive] 跳过 ${relPath}: ${error.message}`);
    return null;
  }
}

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function writeJson(name, payload) {
  ensureDir(OUT_DIR);
  const full = path.join(OUT_DIR, name);
  fs.writeFileSync(full, JSON.stringify(payload, null, 2));
  const size = (fs.statSync(full).size / 1024).toFixed(1);
  console.log(`[derive] ${name} → ${full} (${size} KB, ${Array.isArray(payload) ? payload.length : Object.keys(payload).length} 条)`);
}

function buildSearchTokens(...parts) {
  return parts
    .filter(Boolean)
    .map((p) => String(p).toLowerCase())
    .join(" ");
}

function existsAsset(rel) {
  return fs.existsSync(path.join(ASSET_DIR, rel));
}

function pickFriendAsset(englishName) {
  if (!englishName) return null;
  const candidates = [
    `friends/JL_${englishName}.webp`,
    `friends/JL_${englishName.toLowerCase()}.webp`
  ];
  for (const rel of candidates) {
    if (existsAsset(rel)) return rel;
  }
  return null;
}

function pickItemAsset(iconId) {
  if (!iconId) return null;
  const rel = `items/${iconId}.webp`;
  return existsAsset(rel) ? rel : null;
}

function zhOf(localized, fallback) {
  if (!localized) return fallback || "";
  if (typeof localized.zh === "string") return localized.zh;
  if (localized.zh && typeof localized.zh.name === "string") return localized.zh.name;
  return fallback || "";
}

function deriveTypes() {
  const raw = readJson("types.json");
  return raw.map((row) => ({
    _id: `rk-type-${row.id}`,
    typeId: row.id,
    name: row.name,
    nameZh: zhOf(row.localized, row.name),
    vulnerableTo: row.vulnerable_to || [],
    resistantTo: row.resistant_to || [],
    searchTokens: buildSearchTokens(row.name, zhOf(row.localized, row.name))
  }));
}

function derivePersonalities() {
  const raw = readJson("personalities.json");
  return raw.map((row) => ({
    _id: `rk-personality-${row.id}`,
    personalityId: row.id,
    name: row.name,
    nameZh: zhOf(row.localized, row.name),
    hpModPct: row.hp_mod_pct || 0,
    phyAtkModPct: row.phy_atk_mod_pct || 0,
    magAtkModPct: row.mag_atk_mod_pct || 0,
    phyDefModPct: row.phy_def_mod_pct || 0,
    magDefModPct: row.mag_def_mod_pct || 0,
    spdModPct: row.spd_mod_pct || 0,
    searchTokens: buildSearchTokens(row.name, zhOf(row.localized, row.name))
  }));
}

function deriveTerms() {
  const raw = readJson("game_terms.json");
  return raw.map((row) => ({
    _id: `rk-term-${row.id}`,
    termId: row.id,
    key: row.key,
    description: row.description || "",
    nameZh: zhOf(row.localized, row.key),
    descriptionZh: (row.localized && row.localized.zh && row.localized.zh.description) || row.description || "",
    sortOrder: row.sort_order || 0,
    searchTokens: buildSearchTokens(row.key, zhOf(row.localized, row.key))
  }));
}

function deriveMoves() {
  const raw = readJson("moves.json");
  return raw.map((row) => ({
    _id: `rk-move-${row.id}`,
    moveId: row.id,
    name: row.name,
    nameZh: zhOf(row.localized, row.name),
    descriptionZh: (row.localized && row.localized.zh && row.localized.zh.description) || row.description || "",
    description: row.description || "",
    moveCategory: row.move_category || "Status",
    energyCost: row.energy_cost || 0,
    power: row.power == null ? null : row.power,
    typeId: row.move_type ? row.move_type.id : null,
    typeName: row.move_type ? row.move_type.name : null,
    typeNameZh: row.move_type ? zhOf(row.move_type.localized, row.move_type.name) : null,
    searchTokens: buildSearchTokens(row.name, zhOf(row.localized, row.name), row.move_category)
  }));
}

function deriveItems() {
  const raw = readJson("items.json");
  return raw.map((row) => {
    const iconRel = pickItemAsset(row.icon_id);
    return {
      _id: `rk-item-${row.id}`,
      itemId: row.id,
      name: row.name,
      iconId: row.icon_id || "",
      category: row.category || "",
      typeDesc: row.type_desc || "",
      quality: row.quality || 0,
      qualityLabel: row.quality_label || "",
      description: row.description || "",
      flavorText: row.flavor_text || "",
      acquireWays: row.acquire_ways || [],
      relatedPets: row.related_pets || [],
      assetPath: iconRel,
      searchTokens: buildSearchTokens(row.name, row.category, row.type_desc, row.quality_label)
    };
  });
}

function buildEggIndex() {
  const conf = tryReadJson("tables/PET_EGG_CONF.json");
  if (!conf || !conf.RocoDataRows) return new Map();
  const result = new Map();
  Object.values(conf.RocoDataRows).forEach((row) => {
    if (row.pet_id) {
      result.set(row.pet_id, row);
    }
  });
  return result;
}

function buildBreedingIndex() {
  const raw = tryReadJson("breeding.json");
  if (!Array.isArray(raw)) return new Map();
  const result = new Map();
  raw.forEach((row) => {
    if (row.pet_id) {
      result.set(row.pet_id, row);
    }
  });
  return result;
}

function derivePets(eggIndex, breedingIndex) {
  const raw = readJson("Pets.json");
  return raw.map((row) => {
    const englishName = row.name || "";
    const nameZh = zhOf(row.localized, englishName);
    const assetPath = pickFriendAsset(englishName);
    // 蛋孵化信息：优先用 Pets[].breeding（直接挂在精灵下），其次用 PET_EGG_CONF 按 variant id 反查
    const embeddedBreeding = row.breeding || null;
    const variantId = embeddedBreeding && embeddedBreeding.id ? embeddedBreeding.id : null;
    const eggInfo = embeddedBreeding || (variantId ? eggIndex.get(variantId) : null) || eggIndex.get(row.id) || null;
    const breeding = breedingIndex.get(row.id) || embeddedBreeding || null;
    const totalBase =
      (row.base_hp || 0) +
      (row.base_phy_atk || 0) +
      (row.base_mag_atk || 0) +
      (row.base_phy_def || 0) +
      (row.base_mag_def || 0) +
      (row.base_spd || 0);

    return {
      _id: `rk-pet-${row.id}`,
      petId: row.id,
      name: englishName,
      nameZh,
      form: row.form || "default",
      implemented: row.implemented !== false,
      assetPath,
      preferredAttackStyle: row.preferred_attack_style || "Both",
      mainType: row.main_type
        ? { id: row.main_type.id, name: row.main_type.name, nameZh: zhOf(row.main_type.localized, row.main_type.name) }
        : null,
      subType: row.sub_type
        ? { id: row.sub_type.id, name: row.sub_type.name, nameZh: zhOf(row.sub_type.localized, row.sub_type.name) }
        : null,
      legacyType: row.default_legacy_type
        ? {
            id: row.default_legacy_type.id,
            name: row.default_legacy_type.name,
            nameZh: zhOf(row.default_legacy_type.localized, row.default_legacy_type.name)
          }
        : null,
      baseStats: {
        hp: row.base_hp || 0,
        phyAtk: row.base_phy_atk || 0,
        magAtk: row.base_mag_atk || 0,
        phyDef: row.base_phy_def || 0,
        magDef: row.base_mag_def || 0,
        spd: row.base_spd || 0,
        total: totalBase
      },
      evolvesFromId: row.evolves_from_id || null,
      egg: eggInfo
        ? {
            id: eggInfo.id || null,
            weightLow: eggInfo.weight_low || null,
            weightHigh: eggInfo.weight_high || null,
            heightLow: eggInfo.height_low || null,
            heightHigh: eggInfo.height_high || null,
            hatchData: eggInfo.hatch_data || null,
            preciousEggType: eggInfo.precious_egg_type || null
          }
        : null,
      breedingSummary: breeding
        ? {
            id: breeding.id || null,
            name: breeding.name || "",
            modelId: breeding.model_id || null,
            preciousEggType: breeding.precious_egg_type || null
          }
        : null,
      searchTokens: buildSearchTokens(englishName, nameZh, row.main_type && row.main_type.name)
    };
  });
}

function derivePetSkills() {
  const raw = readJson("PetSkillIndex.json");
  if (!raw || !Array.isArray(raw.entries)) return [];
  return raw.entries.map((row) => ({
    _id: `rk-pet-skills-${row.pet_id}`,
    petId: row.pet_id,
    movePoolIds: row.move_pool_ids || [],
    moveStoneIds: row.move_stone_ids || [],
    bloodlineMoveIds: row.bloodline_move_ids || []
  }));
}

function deriveEggGroups() {
  const eggTypeConf = tryReadJson("tables/EGG_TYPE_CONF.json");
  if (!eggTypeConf || !eggTypeConf.RocoDataRows) return [];
  return Object.values(eggTypeConf.RocoDataRows).map((row) => ({
    _id: `rk-egg-${row.ID}`,
    eggTypeId: row.ID,
    displayOrder: row.display_order || 0,
    preciousEggType: row.precious_egg_type || null,
    cantGiveAway: !!row.cant_give_away,
    ballRange: row.ball_range || []
  }));
}

function deriveBloodlineIndex() {
  const raw = tryReadJson("bloodline_index.json");
  if (!Array.isArray(raw)) return [];
  return raw.map((row) => ({
    _id: `rk-bloodline-${row.pet_id}`,
    petId: row.pet_id,
    petName: row.pet_name || "",
    implemented: row.implemented !== false,
    mainTypeId: row.main_type_id || null,
    subTypeId: row.sub_type_id || null,
    defaultLegacyTypeId: row.default_legacy_type_id || null,
    preferredAttackStyle: row.preferred_attack_style || "Both",
    bloodlineMoves: (row.bloodline_moves || []).map((move) => ({
      typeId: move.type_id,
      typeName: move.type_name,
      typeLabel: move.type_label,
      moveId: move.move_id,
      moveName: move.move_name,
      moveCategory: move.move_category,
      energyCost: move.energy_cost,
      power: move.power
    }))
  }));
}

function deriveAll() {
  ensureDir(OUT_DIR);
  console.log("[derive] 开始读取 utils/data 原始数据…");

  const types = deriveTypes();
  writeJson("types.json", types);

  const personalities = derivePersonalities();
  writeJson("personalities.json", personalities);

  const terms = deriveTerms();
  writeJson("terms.json", terms);

  const moves = deriveMoves();
  writeJson("moves.json", moves);

  const items = deriveItems();
  writeJson("items.json", items);

  const eggIndex = buildEggIndex();
  const breedingIndex = buildBreedingIndex();
  const pets = derivePets(eggIndex, breedingIndex);
  writeJson("pets.json", pets);

  const petSkills = derivePetSkills();
  writeJson("pet_skills.json", petSkills);

  const eggs = deriveEggGroups();
  writeJson("eggs.json", eggs);

  const bloodline = deriveBloodlineIndex();
  writeJson("bloodline_index.json", bloodline);

  console.log("[derive] 完成。下一步：node uploadAssets.js → node uploadData.js → node seedArticles.js");
}

if (require.main === module) {
  try {
    deriveAll();
  } catch (error) {
    console.error("[derive] 失败：", error.message);
    process.exit(1);
  }
}

module.exports = { deriveAll };
