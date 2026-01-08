
import { Player, Monster, Realm, Rarity, Pill, ElementType, Attributes, FiveElements, Equipment, EquipmentSlot } from '../types';
import { MONSTER_NAMES, BOSS_NAMES, RARITY_COLORS } from '../constants';

export const getRealmByFloor = (floor: number): Realm => {
  if (floor <= 20) return Realm.QI_REFINING;
  if (floor <= 40) return Realm.FOUNDATION;
  if (floor <= 60) return Realm.GOLDEN_CORE;
  if (floor <= 80) return Realm.NASCENT_SOUL;
  return Realm.DEITY_TRANSFORMATION;
};

export const calculateInterest = (stones: number, talentLevel: number): number => {
  const baseCap = 50;
  const cap = baseCap + talentLevel * 50;
  return Math.floor(Math.min(stones * 0.1, cap));
};

export const calculateAlchemyCost = (count: number, talentLevel: number): number => {
  const reduction = 1 - (talentLevel * 0.05);
  return Math.floor(10 * Math.pow(2, count) * reduction);
};

export const generateMonster = (floor: number): Monster => {
  const isBoss = floor % 30 === 0 || floor === 100;
  const growthFactorHP = Math.pow(1.18, floor - 1);
  const growthFactorATK = Math.pow(1.14, floor - 1);

  let hp = Math.floor(120 * growthFactorHP);
  let atk = Math.floor(18 * growthFactorATK);

  if (isBoss) {
    hp *= 2.8;
    atk *= 2.2;
  }

  const name = isBoss 
    ? BOSS_NAMES[Math.floor(Math.random() * BOSS_NAMES.length)]
    : MONSTER_NAMES[Math.floor(Math.random() * MONSTER_NAMES.length)];

  return { name, hp, maxHp: hp, atk, realm: getRealmByFloor(floor), isBoss };
};

export const generatePills = (floor: number, forceImmortal: boolean): Pill[] => {
  const pills: Pill[] = [];
  const rarityPool = [Rarity.COMMON, Rarity.UNCOMMON, Rarity.RARE, Rarity.EPIC, Rarity.LEGENDARY];
  const floorBonus = floor / 100;

  for (let i = 0; i < 3; i++) {
    let rarity = Rarity.COMMON;
    if (forceImmortal) {
      rarity = Rarity.LEGENDARY;
    } else {
      const roll = Math.random() + floorBonus;
      if (roll > 1.35) rarity = Rarity.LEGENDARY;
      else if (roll > 1.15) rarity = Rarity.EPIC;
      else if (roll > 0.85) rarity = Rarity.RARE;
      else if (roll > 0.45) rarity = Rarity.UNCOMMON;
    }

    const mult = (rarityPool.indexOf(rarity) + 1) * 2;
    const selectedElement = Object.values(ElementType)[Math.floor(Math.random() * 5)];
    const selectedAttr = (['physique', 'essence', 'spirit', 'agility'] as (keyof Attributes)[])[Math.floor(Math.random() * 4)];

    pills.push({
      id: Math.random().toString(36).substring(2),
      name: `${rarity}${selectedElement}纹丹`,
      rarity,
      color: RARITY_COLORS[rarity],
      attributes: { [selectedAttr]: Math.floor((Math.random() * 4 + 2) * mult) },
      elements: { [selectedElement.toLowerCase()]: Math.floor((Math.random() * 6 + 3) * mult) }
    });
  }
  return pills;
};

export const generateEquipment = (floor: number): Equipment | null => {
  // 基础掉落率 15%，Boss 100%
  const isBoss = floor % 30 === 0 || floor === 100;
  if (!isBoss && Math.random() > 0.15) return null;

  const slots = [EquipmentSlot.WEAPON, EquipmentSlot.ARMOR, EquipmentSlot.ACCESSORY];
  const slot = slots[Math.floor(Math.random() * 3)];
  
  const rarityPool = [Rarity.COMMON, Rarity.UNCOMMON, Rarity.RARE, Rarity.EPIC, Rarity.LEGENDARY];
  const roll = Math.random() + (floor / 150);
  let rarity = Rarity.COMMON;
  if (roll > 1.2) rarity = Rarity.LEGENDARY;
  else if (roll > 0.9) rarity = Rarity.EPIC;
  else if (roll > 0.6) rarity = Rarity.RARE;
  else if (roll > 0.3) rarity = Rarity.UNCOMMON;

  const mult = (rarityPool.indexOf(rarity) + 1) * 3;
  const stats: Partial<Attributes> = {};
  
  if (slot === EquipmentSlot.WEAPON) stats.essence = Math.floor(mult * (1 + floor * 0.1));
  if (slot === EquipmentSlot.ARMOR) stats.physique = Math.floor(mult * (1 + floor * 0.1));
  if (slot === EquipmentSlot.ACCESSORY) {
    stats.spirit = Math.floor(mult * 0.5);
    stats.agility = Math.floor(mult * 0.5);
  }

  const names = {
    [EquipmentSlot.WEAPON]: ['生锈铁剑', '精钢长剑', '青芒剑', '斩妖巨剑', '诛仙绝剑'],
    [EquipmentSlot.ARMOR]: ['粗布麻衣', '铁索甲', '玄龟甲', '乾坤法袍', '混元仙裳'],
    [EquipmentSlot.ACCESSORY]: ['木质发簪', '白玉佩', '玲珑塔', '五行轮', '太极阴阳符']
  };

  const nameIndex = Math.min(rarityPool.indexOf(rarity), 4);

  return {
    id: Math.random().toString(36).substring(2),
    name: names[slot][nameIndex],
    slot,
    rarity,
    stats,
    color: RARITY_COLORS[rarity]
  };
};

export const checkBonds = (elements: FiveElements) => {
  return {
    gold: elements.gold >= 30,
    wood: elements.wood >= 30,
    water: elements.water >= 30,
    fire: elements.fire >= 30,
    earth: elements.earth >= 30
  };
};

export const getPlayerCombatStats = (player: Player) => {
  const combined = { ...player.attributes };
  Object.values(player.equipment).forEach(eq => {
    if (eq) {
      Object.entries(eq.stats).forEach(([k, v]) => {
        combined[k as keyof Attributes] += v;
      });
    }
  });
  return combined;
};
