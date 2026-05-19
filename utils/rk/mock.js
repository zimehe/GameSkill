// utils/rk/mock.js
// 洛克王国数据「极小」mock 样本，让未配置云开发的用户也能看到图鉴页效果。
// 字段结构与 scripts/rockKingdom/derive.js 输出一致，便于 cloud / mock 切换。

const types = [
  { _id: "rk-type-1", typeId: 1, name: "Normal", nameZh: "普通", vulnerableTo: ["Fighting"], resistantTo: ["Ghost"] },
  { _id: "rk-type-2", typeId: 2, name: "Grass", nameZh: "草", vulnerableTo: ["Flying", "Fire", "Ice", "Poison", "Bug"], resistantTo: ["Water", "Light", "Ground", "Electric"] },
  { _id: "rk-type-3", typeId: 3, name: "Fire", nameZh: "火", vulnerableTo: ["Ground", "Water"], resistantTo: ["Mechanical", "Cute", "Bug", "Grass", "Ice"] },
  { _id: "rk-type-4", typeId: 4, name: "Water", nameZh: "水", vulnerableTo: ["Electric", "Grass"], resistantTo: ["Mechanical", "Fire"] },
  { _id: "rk-type-5", typeId: 5, name: "Light", nameZh: "光", vulnerableTo: ["Ghost", "Grass"], resistantTo: ["Illusion", "Dark"] },
  { _id: "rk-type-6", typeId: 6, name: "Ground", nameZh: "地", vulnerableTo: ["Fighting", "Water", "Mechanical", "Ice", "Grass"], resistantTo: ["Fire", "Electric", "Normal", "Flying", "Poison"] },
  { _id: "rk-type-7", typeId: 7, name: "Ice", nameZh: "冰", vulnerableTo: ["Mechanical", "Ground", "Fire", "Fighting"], resistantTo: ["Water", "Light", "Ice"] },
  { _id: "rk-type-8", typeId: 8, name: "Dragon", nameZh: "龙", vulnerableTo: ["Ice", "Dragon", "Cute"], resistantTo: ["Water", "Grass", "Fire", "Electric", "Flying"] },
  { _id: "rk-type-9", typeId: 9, name: "Electric", nameZh: "电", vulnerableTo: ["Ground"], resistantTo: ["Mechanical", "Electric", "Flying"] },
  { _id: "rk-type-10", typeId: 10, name: "Poison", nameZh: "毒", vulnerableTo: ["Dark", "Illusion", "Ground"], resistantTo: ["Cute", "Grass", "Bug", "Poison", "Fighting"] },
  { _id: "rk-type-11", typeId: 11, name: "Bug", nameZh: "虫", vulnerableTo: ["Fire", "Flying"], resistantTo: ["Grass", "Fighting"] },
  { _id: "rk-type-12", typeId: 12, name: "Fighting", nameZh: "武", vulnerableTo: ["Cute", "Flying", "Illusion"], resistantTo: ["Bug", "Ground", "Dark"] },
  { _id: "rk-type-13", typeId: 13, name: "Flying", nameZh: "翼", vulnerableTo: ["Ice", "Electric"], resistantTo: ["Bug", "Fighting", "Grass"] },
  { _id: "rk-type-14", typeId: 14, name: "Cute", nameZh: "萌", vulnerableTo: ["Mechanical", "Dark", "Poison"], resistantTo: ["Fighting", "Bug"] },
  { _id: "rk-type-15", typeId: 15, name: "Ghost", nameZh: "幽", vulnerableTo: ["Ghost", "Light", "Dark"], resistantTo: ["Poison", "Bug", "Fighting", "Normal"] },
  { _id: "rk-type-16", typeId: 16, name: "Dark", nameZh: "恶", vulnerableTo: ["Fighting", "Bug", "Cute", "Light"], resistantTo: ["Dark", "Ghost"] },
  { _id: "rk-type-17", typeId: 17, name: "Mechanical", nameZh: "机械", vulnerableTo: ["Fighting", "Water", "Fire"], resistantTo: ["Illusion", "Poison", "Ice", "Bug", "Dragon", "Flying", "Grass", "Cute", "Normal", "Mechanical"] },
  { _id: "rk-type-18", typeId: 18, name: "Illusion", nameZh: "幻", vulnerableTo: ["Ghost", "Bug"], resistantTo: ["Illusion", "Fighting"] }
];

const personalities = [
  { _id: "rk-personality-1", personalityId: 1, name: "Timid", nameZh: "胆小", hpModPct: 0, phyAtkModPct: -0.1, magAtkModPct: 0, phyDefModPct: 0, magDefModPct: 0, spdModPct: 0.2 },
  { _id: "rk-personality-2", personalityId: 2, name: "Cheerful", nameZh: "开朗", hpModPct: 0, phyAtkModPct: 0, magAtkModPct: -0.1, phyDefModPct: 0, magDefModPct: 0, spdModPct: 0.2 },
  { _id: "rk-personality-3", personalityId: 3, name: "Impatient", nameZh: "急躁", hpModPct: 0, phyAtkModPct: 0, magAtkModPct: 0, phyDefModPct: -0.1, magDefModPct: 0, spdModPct: 0.2 },
  { _id: "rk-personality-4", personalityId: 4, name: "Naive", nameZh: "天真", hpModPct: 0, phyAtkModPct: 0, magAtkModPct: 0, phyDefModPct: 0, magDefModPct: -0.1, spdModPct: 0.2 },
  { _id: "rk-personality-5", personalityId: 5, name: "Restless", nameZh: "浮躁", hpModPct: -0.1, phyAtkModPct: 0, magAtkModPct: 0, phyDefModPct: 0, magDefModPct: 0, spdModPct: 0.2 },
  { _id: "rk-personality-6", personalityId: 6, name: "Stubborn", nameZh: "固执", hpModPct: 0, phyAtkModPct: 0.2, magAtkModPct: -0.1, phyDefModPct: 0, magDefModPct: 0, spdModPct: 0 },
  { _id: "rk-personality-10", personalityId: 10, name: "Brave", nameZh: "勇敢", hpModPct: 0, phyAtkModPct: 0.2, magAtkModPct: 0, phyDefModPct: 0, magDefModPct: 0, spdModPct: -0.1 },
  { _id: "rk-personality-11", personalityId: 11, name: "Modest", nameZh: "保守", hpModPct: 0, phyAtkModPct: -0.1, magAtkModPct: 0.2, phyDefModPct: 0, magDefModPct: 0, spdModPct: 0 },
  { _id: "rk-personality-15", personalityId: 15, name: "Calm", nameZh: "冷静", hpModPct: 0, phyAtkModPct: 0, magAtkModPct: 0.2, phyDefModPct: 0, magDefModPct: 0, spdModPct: -0.1 },
  { _id: "rk-personality-16", personalityId: 16, name: "Bold", nameZh: "大胆", hpModPct: 0, phyAtkModPct: -0.1, magAtkModPct: 0, phyDefModPct: 0.2, magDefModPct: 0, spdModPct: 0 },
  { _id: "rk-personality-22", personalityId: 22, name: "Careful", nameZh: "慎重", hpModPct: 0, phyAtkModPct: 0, magAtkModPct: -0.1, phyDefModPct: 0, magDefModPct: 0.2, spdModPct: 0 },
  { _id: "rk-personality-26", personalityId: 26, name: "Quiet", nameZh: "沉默", hpModPct: 0.2, phyAtkModPct: -0.1, magAtkModPct: 0, phyDefModPct: 0, magDefModPct: 0, spdModPct: 0 }
];

const moves = [
  { _id: "rk-move-1", moveId: 1, name: "Focus", nameZh: "聚能", descriptionZh: "本回合不做其他行动，恢复 5 点能量。", moveCategory: "Status", energyCost: 0, power: null, typeId: null, typeNameZh: null },
  { _id: "rk-move-3", moveId: 3, name: "Control", nameZh: "压制", descriptionZh: "对敌方造成物理伤害。", moveCategory: "Physical Attack", energyCost: 2, power: 80, typeId: 1, typeNameZh: "普通" },
  { _id: "rk-move-7020360", moveId: 7020360, name: "Alert", nameZh: "机警", descriptionZh: "精灵警戒起来了，正在寻找逃走的机会。", moveCategory: "Physical Attack", energyCost: 0, power: 35, typeId: 1, typeNameZh: "普通" },
  { _id: "rk-move-7020640", moveId: 7020640, name: "Magic Boost", nameZh: "魔法增效", descriptionZh: "自己获得魔攻+70%。", moveCategory: "Status", energyCost: 2, power: null, typeId: 1, typeNameZh: "普通" },
  { _id: "rk-move-7030440", moveId: 7030440, name: "Flower Scent", nameZh: "花香", descriptionZh: "对敌方精灵造成魔法伤害。", moveCategory: "Magic Attack", energyCost: 3, power: 100, typeId: 2, typeNameZh: "草" },
  { _id: "rk-move-7030200", moveId: 7030200, name: "Thorn Whip", nameZh: "刺藤", descriptionZh: "造成物理伤害，2 连击。", moveCategory: "Physical Attack", energyCost: 4, power: 80, typeId: 2, typeNameZh: "草" },
  { _id: "rk-move-7030220", moveId: 7030220, name: "Flame Burst", nameZh: "烈焰冲击", descriptionZh: "对敌方精灵造成火属性魔法伤害。", moveCategory: "Magic Attack", energyCost: 3, power: 90, typeId: 3, typeNameZh: "火" },
  { _id: "rk-move-7030260", moveId: 7030260, name: "Aqua Cannon", nameZh: "水箭", descriptionZh: "对敌方精灵造成水属性物理伤害。", moveCategory: "Physical Attack", energyCost: 3, power: 90, typeId: 4, typeNameZh: "水" },
  { _id: "rk-move-7030280", moveId: 7030280, name: "Lightning Bolt", nameZh: "雷击", descriptionZh: "对敌方精灵造成电属性魔法伤害。", moveCategory: "Magic Attack", energyCost: 3, power: 95, typeId: 9, typeNameZh: "电" },
  { _id: "rk-move-7030300", moveId: 7030300, name: "Frost Blade", nameZh: "霜刃", descriptionZh: "对敌方精灵造成冰属性物理伤害。", moveCategory: "Physical Attack", energyCost: 3, power: 95, typeId: 7, typeNameZh: "冰" },
  { _id: "rk-move-7030480", moveId: 7030480, name: "Shadow Strike", nameZh: "暗影突袭", descriptionZh: "对敌方造成幽系物理伤害。", moveCategory: "Physical Attack", energyCost: 3, power: 90, typeId: 15, typeNameZh: "幽" },
  { _id: "rk-move-7030210", moveId: 7030210, name: "Iron Tail", nameZh: "铁尾", descriptionZh: "对敌方造成机械属性物理伤害。", moveCategory: "Physical Attack", energyCost: 3, power: 95, typeId: 17, typeNameZh: "机械" },
  { _id: "rk-move-7030190", moveId: 7030190, name: "Cute Charm", nameZh: "萌力施压", descriptionZh: "对敌方造成萌系伤害。", moveCategory: "Magic Attack", energyCost: 2, power: 75, typeId: 14, typeNameZh: "萌" },
  { _id: "rk-move-7030230", moveId: 7030230, name: "Whirlwind", nameZh: "翼风斩", descriptionZh: "对敌方造成翼系物理伤害。", moveCategory: "Physical Attack", energyCost: 3, power: 85, typeId: 13, typeNameZh: "翼" },
  { _id: "rk-move-7020390", moveId: 7020390, name: "Tail Sweep", nameZh: "扫尾", descriptionZh: "对敌方精灵造成物理伤害。", moveCategory: "Physical Attack", energyCost: 2, power: 90, typeId: 1, typeNameZh: "普通" },
  { _id: "rk-move-7020910", moveId: 7020910, name: "Magic Bullet", nameZh: "魔法弹", descriptionZh: "对敌方精灵造成魔法伤害。", moveCategory: "Magic Attack", energyCost: 2, power: 90, typeId: 1, typeNameZh: "普通" },
  { _id: "rk-move-7030320", moveId: 7030320, name: "Stone Slam", nameZh: "落石", descriptionZh: "对敌方精灵造成地系物理伤害。", moveCategory: "Physical Attack", energyCost: 3, power: 90, typeId: 6, typeNameZh: "地" },
  { _id: "rk-move-7030180", moveId: 7030180, name: "Holy Beam", nameZh: "圣光", descriptionZh: "对敌方精灵造成光系魔法伤害。", moveCategory: "Magic Attack", energyCost: 3, power: 95, typeId: 5, typeNameZh: "光" },
  { _id: "rk-move-7030460", moveId: 7030460, name: "Dragon Pulse", nameZh: "龙息", descriptionZh: "对敌方精灵造成龙属性魔法伤害。", moveCategory: "Magic Attack", energyCost: 4, power: 110, typeId: 8, typeNameZh: "龙" },
  { _id: "rk-move-7020780", moveId: 7020780, name: "Cuteify", nameZh: "萌化", descriptionZh: "敌方获得 1 层萌化。", moveCategory: "Status", energyCost: 0, power: null, typeId: 1, typeNameZh: "普通" }
];

function statSet(hp, p, m, pd, md, spd) {
  return { hp, phyAtk: p, magAtk: m, phyDef: pd, magDef: md, spd, total: hp + p + m + pd + md + spd };
}

const pets = [
  { _id: "rk-pet-3001", petId: 3001, name: "miaomiao", nameZh: "喵喵", form: "default", implemented: true, mainType: { id: 2, name: "Grass", nameZh: "草" }, subType: null, baseStats: statSet(65, 66, 66, 49, 91, 33), preferredAttackStyle: "Both", egg: { hatchData: 43200, weightLow: 1267, weightHigh: 1840, heightLow: 23, heightHigh: 31 }, assetPath: null, coverImage: "" },
  { _id: "rk-pet-3002", petId: 3002, name: "shuilanlan", nameZh: "水蓝蓝", form: "default", implemented: true, mainType: { id: 4, name: "Water", nameZh: "水" }, subType: null, baseStats: statSet(72, 60, 70, 60, 75, 40), preferredAttackStyle: "Magic", egg: { hatchData: 43200, weightLow: 998, weightHigh: 1360, heightLow: 19, heightHigh: 27 }, assetPath: null, coverImage: "" },
  { _id: "rk-pet-3003", petId: 3003, name: "huohua", nameZh: "火花", form: "default", implemented: true, mainType: { id: 3, name: "Fire", nameZh: "火" }, subType: null, baseStats: statSet(60, 80, 65, 50, 60, 70), preferredAttackStyle: "Physical", egg: { hatchData: 43200, weightLow: 2660, weightHigh: 3400, heightLow: 23, heightHigh: 29 }, assetPath: null, coverImage: "" },
  { _id: "rk-pet-3004", petId: 3004, name: "dimo", nameZh: "迪莫", form: "default", implemented: true, mainType: { id: 8, name: "Dragon", nameZh: "龙" }, subType: { id: 8, name: "Dragon", nameZh: "龙" }, baseStats: statSet(90, 80, 100, 65, 80, 70), preferredAttackStyle: "Magic", egg: { hatchData: 72000, weightLow: 1925, weightHigh: 2800, heightLow: 23, heightHigh: 32 }, assetPath: null, coverImage: "" },
  { _id: "rk-pet-3008", petId: 3008, name: "caotouya", nameZh: "草头鸭", form: "default", implemented: true, mainType: { id: 2, name: "Grass", nameZh: "草" }, subType: { id: 13, name: "Flying", nameZh: "翼" }, baseStats: statSet(70, 55, 60, 60, 70, 45), preferredAttackStyle: "Both", egg: { hatchData: 43200, weightLow: 1715, weightHigh: 2628, heightLow: 21, heightHigh: 28 }, assetPath: null, coverImage: "" },
  { _id: "rk-pet-3019", petId: 3019, name: "kakapao", nameZh: "咔咔泡", form: "default", implemented: true, mainType: { id: 4, name: "Water", nameZh: "水" }, subType: null, baseStats: statSet(65, 60, 75, 55, 60, 50), preferredAttackStyle: "Magic", egg: null, assetPath: null, coverImage: "" },
  { _id: "rk-pet-3020", petId: 3020, name: "yeyetu", nameZh: "椰椰兔", form: "default", implemented: true, mainType: { id: 14, name: "Cute", nameZh: "萌" }, subType: null, baseStats: statSet(70, 50, 70, 50, 70, 65), preferredAttackStyle: "Magic", egg: null, assetPath: null, coverImage: "" },
  { _id: "rk-pet-3036", petId: 3036, name: "leidian", nameZh: "雷电", form: "default", implemented: true, mainType: { id: 9, name: "Electric", nameZh: "电" }, subType: null, baseStats: statSet(60, 65, 90, 50, 60, 90), preferredAttackStyle: "Magic", egg: null, assetPath: null, coverImage: "" },
  { _id: "rk-pet-3061", petId: 3061, name: "bingjing", nameZh: "冰晶", form: "default", implemented: true, mainType: { id: 7, name: "Ice", nameZh: "冰" }, subType: null, baseStats: statSet(70, 80, 80, 60, 75, 65), preferredAttackStyle: "Both", egg: null, assetPath: null, coverImage: "" },
  { _id: "rk-pet-3077", petId: 3077, name: "qishi", nameZh: "圣骑士", form: "default", implemented: true, mainType: { id: 12, name: "Fighting", nameZh: "武" }, subType: { id: 5, name: "Light", nameZh: "光" }, baseStats: statSet(90, 95, 60, 80, 70, 55), preferredAttackStyle: "Physical", egg: null, assetPath: null, coverImage: "" },
  { _id: "rk-pet-3094", petId: 3094, name: "huangtianshi", nameZh: "黄天使", form: "default", implemented: true, mainType: { id: 5, name: "Light", nameZh: "光" }, subType: null, baseStats: statSet(75, 55, 95, 60, 90, 75), preferredAttackStyle: "Magic", egg: null, assetPath: null, coverImage: "" },
  { _id: "rk-pet-3108", petId: 3108, name: "qiyuan", nameZh: "契约元素", form: "default", implemented: true, mainType: { id: 18, name: "Illusion", nameZh: "幻" }, subType: null, baseStats: statSet(80, 70, 100, 70, 80, 70), preferredAttackStyle: "Magic", egg: null, assetPath: null, coverImage: "" },
  { _id: "rk-pet-3149", petId: 3149, name: "jiankai", nameZh: "坚铠", form: "default", implemented: true, mainType: { id: 17, name: "Mechanical", nameZh: "机械" }, subType: null, baseStats: statSet(100, 60, 60, 100, 100, 40), preferredAttackStyle: "Physical", egg: null, assetPath: null, coverImage: "" },
  { _id: "rk-pet-3169", petId: 3169, name: "youlinghu", nameZh: "幽灵狐", form: "default", implemented: true, mainType: { id: 15, name: "Ghost", nameZh: "幽" }, subType: { id: 16, name: "Dark", nameZh: "恶" }, baseStats: statSet(70, 70, 95, 65, 70, 95), preferredAttackStyle: "Magic", egg: null, assetPath: null, coverImage: "" },
  { _id: "rk-pet-3217", petId: 3217, name: "duye", nameZh: "毒叶", form: "default", implemented: true, mainType: { id: 10, name: "Poison", nameZh: "毒" }, subType: { id: 2, name: "Grass", nameZh: "草" }, baseStats: statSet(75, 75, 70, 65, 70, 60), preferredAttackStyle: "Physical", egg: null, assetPath: null, coverImage: "" },
  { _id: "rk-pet-3237", petId: 3237, name: "tunadi", nameZh: "土纳地", form: "default", implemented: true, mainType: { id: 6, name: "Ground", nameZh: "地" }, subType: null, baseStats: statSet(95, 85, 55, 90, 60, 45), preferredAttackStyle: "Physical", egg: null, assetPath: null, coverImage: "" },
  { _id: "rk-pet-3260", petId: 3260, name: "feishi", nameZh: "飞鹰", form: "default", implemented: true, mainType: { id: 13, name: "Flying", nameZh: "翼" }, subType: null, baseStats: statSet(70, 90, 60, 65, 60, 100), preferredAttackStyle: "Physical", egg: null, assetPath: null, coverImage: "" },
  { _id: "rk-pet-3299", petId: 3299, name: "chongyong", nameZh: "虫拥", form: "default", implemented: true, mainType: { id: 11, name: "Bug", nameZh: "虫" }, subType: null, baseStats: statSet(75, 70, 60, 80, 55, 60), preferredAttackStyle: "Physical", egg: null, assetPath: null, coverImage: "" },
  { _id: "rk-pet-3333", petId: 3333, name: "jinjin", nameZh: "金金", form: "default", implemented: true, mainType: { id: 17, name: "Mechanical", nameZh: "机械" }, subType: { id: 5, name: "Light", nameZh: "光" }, baseStats: statSet(85, 80, 90, 80, 80, 70), preferredAttackStyle: "Magic", egg: null, assetPath: null, coverImage: "" },
  { _id: "rk-pet-3408", petId: 3408, name: "leiya", nameZh: "雷崖", form: "default", implemented: true, mainType: { id: 9, name: "Electric", nameZh: "电" }, subType: { id: 17, name: "Mechanical", nameZh: "机械" }, baseStats: statSet(80, 60, 110, 65, 75, 110), preferredAttackStyle: "Magic", egg: null, assetPath: null, coverImage: "" }
];

const petSkills = [
  { _id: "rk-pet-skills-3001", petId: 3001, movePoolIds: [7020360, 7020640, 7030440, 7030200, 7020780, 7030220, 7020910] },
  { _id: "rk-pet-skills-3002", petId: 3002, movePoolIds: [7020360, 7020640, 7030260, 7030200, 7020780, 7020910] },
  { _id: "rk-pet-skills-3003", petId: 3003, movePoolIds: [7020360, 7020640, 7030220, 7020780, 7020390, 7020910] },
  { _id: "rk-pet-skills-3004", petId: 3004, movePoolIds: [7020360, 7020640, 7030460, 7030180, 7020780, 7020910] },
  { _id: "rk-pet-skills-3008", petId: 3008, movePoolIds: [7020360, 7020640, 7030440, 7030230, 7020780, 7020910] },
  { _id: "rk-pet-skills-3019", petId: 3019, movePoolIds: [7020360, 7020640, 7030260, 7020780, 7020910] },
  { _id: "rk-pet-skills-3020", petId: 3020, movePoolIds: [7020360, 7020640, 7030190, 7020780, 7020910] },
  { _id: "rk-pet-skills-3036", petId: 3036, movePoolIds: [7020360, 7020640, 7030280, 7020780, 7020910] },
  { _id: "rk-pet-skills-3061", petId: 3061, movePoolIds: [7020360, 7020640, 7030300, 7020780, 7020910] },
  { _id: "rk-pet-skills-3077", petId: 3077, movePoolIds: [7020360, 7020640, 7030180, 7020390, 7020780, 7020910] },
  { _id: "rk-pet-skills-3094", petId: 3094, movePoolIds: [7020360, 7020640, 7030180, 7020780, 7020910] },
  { _id: "rk-pet-skills-3108", petId: 3108, movePoolIds: [7020360, 7020640, 7030180, 7020780, 7020910] },
  { _id: "rk-pet-skills-3149", petId: 3149, movePoolIds: [7020360, 7020640, 7030210, 7020390, 7020780, 7020910] },
  { _id: "rk-pet-skills-3169", petId: 3169, movePoolIds: [7020360, 7020640, 7030480, 7020780, 7020910] },
  { _id: "rk-pet-skills-3217", petId: 3217, movePoolIds: [7020360, 7020640, 7030200, 7030440, 7020780, 7020910] },
  { _id: "rk-pet-skills-3237", petId: 3237, movePoolIds: [7020360, 7020640, 7030320, 7020780, 7020910] },
  { _id: "rk-pet-skills-3260", petId: 3260, movePoolIds: [7020360, 7020640, 7030230, 7020780, 7020910] },
  { _id: "rk-pet-skills-3299", petId: 3299, movePoolIds: [7020360, 7020640, 7030200, 7020780, 7020910] },
  { _id: "rk-pet-skills-3333", petId: 3333, movePoolIds: [7020360, 7020640, 7030210, 7030180, 7020780, 7020910] },
  { _id: "rk-pet-skills-3408", petId: 3408, movePoolIds: [7020360, 7020640, 7030280, 7030210, 7020780, 7020910] }
];

const items = [
  { _id: "rk-item-100002", itemId: 100002, name: "普通咕噜球", iconId: "100002", category: "咕噜球", typeDesc: "咕噜球", quality: 3, qualityLabel: "精良", description: "与精灵缔结契约的魔法道具。", flavorText: "曾是贵族的秘宝。", coverImage: "" },
  { _id: "rk-item-100003", itemId: 100003, name: "高级咕噜球", iconId: "100003", category: "咕噜球", typeDesc: "咕噜球", quality: 4, qualityLabel: "稀有", description: "比普通咕噜球更容易缔结契约。", coverImage: "" },
  { _id: "rk-item-100005", itemId: 100005, name: "超能咕噜球", iconId: "100005", category: "咕噜球", typeDesc: "咕噜球", quality: 5, qualityLabel: "传说", description: "超高捕获成功率。", coverImage: "" },
  { _id: "rk-item-100006", itemId: 100006, name: "体力恢复药", iconId: "100006", category: "回复药", typeDesc: "战斗道具", quality: 2, qualityLabel: "普通", description: "战斗中恢复 1 只精灵 50 点生命。", coverImage: "" },
  { _id: "rk-item-100007", itemId: 100007, name: "魔法经验", iconId: "100007", category: "成长道具", typeDesc: "经验", quality: 3, qualityLabel: "精良", description: "为精灵提供 150 点经验。", coverImage: "" }
];

const terms = [
  { _id: "rk-term-1", termId: 1, key: "Marks", nameZh: "印记", descriptionZh: "常驻在全队的效果，不仅仅作用于单个精灵。", sortOrder: 0 },
  { _id: "rk-term-2", termId: 2, key: "Slow Mark", nameZh: "减速印记", descriptionZh: "印记效果，速度每层 -10。", sortOrder: 1 },
  { _id: "rk-term-3", termId: 3, key: "Burn", nameZh: "灼烧", descriptionZh: "每回合损失最大体力 5%。", sortOrder: 2 },
  { _id: "rk-term-4", termId: 4, key: "Freeze", nameZh: "冰冻", descriptionZh: "冰冻状态下精灵无法行动。", sortOrder: 3 },
  { _id: "rk-term-5", termId: 5, key: "Poison", nameZh: "中毒", descriptionZh: "每回合损失最大体力 8%。", sortOrder: 4 }
];

module.exports = {
  types,
  personalities,
  moves,
  pets,
  petSkills,
  items,
  terms
};
