
export enum Realm {
  QI_REFINING = '炼气期',
  FOUNDATION = '筑基期',
  GOLDEN_CORE = '金丹期',
  NASCENT_SOUL = '元婴期',
  DEITY_TRANSFORMATION = '化神期'
}

export enum ElementType {
  GOLD = '金',
  WOOD = '木',
  WATER = '水',
  FIRE = '火',
  EARTH = '土'
}

export enum Rarity {
  COMMON = '凡品',
  UNCOMMON = '良品',
  RARE = '精品',
  EPIC = '极品',
  LEGENDARY = '仙品',
  IMMORTAL = '神品'
}

export enum EquipmentSlot {
  WEAPON = '武器',
  ARMOR = '防具',
  ACCESSORY = '饰品'
}

export interface Equipment {
  id: string;
  name: string;
  slot: EquipmentSlot;
  rarity: Rarity;
  stats: Partial<Attributes>;
  color: string;
}

export interface Attributes {
  physique: number; // 体魄
  essence: number;  // 真元
  spirit: number;   // 神识
  agility: number;  // 身法
}

export interface FiveElements {
  gold: number;
  wood: number;
  water: number;
  fire: number;
  earth: number;
}

export interface Talents {
  baseAttributes: number;
  interestCap: number;
  alchemyEfficiency: number;
  inheritanceRate: number;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  unlocked: boolean;
}

export interface GlobalSaveData {
  talents: Talents;
  points: number;
  achievements: Achievement[];
}

export interface Player {
  hp: number;
  maxHp: number;
  stones: number;
  floor: number;
  attributes: Attributes;
  elements: FiveElements;
  equipment: {
    [EquipmentSlot.WEAPON]?: Equipment;
    [EquipmentSlot.ARMOR]?: Equipment;
    [EquipmentSlot.ACCESSORY]?: Equipment;
  };
  alchemyCount: number;
  isImmortalNext: boolean;
  talents: Talents;
  reincarnationPoints: number;
  tutorialStep: number;
  totalAlchemyCount: number;
}

export interface Monster {
  name: string;
  hp: number;
  maxHp: number;
  atk: number;
  realm: Realm;
  isBoss: boolean;
}

export interface Pill {
  id: string;
  name: string;
  rarity: Rarity;
  attributes: Partial<Attributes>;
  elements: Partial<FiveElements>;
  color: string;
}

export interface RandomEvent {
  title: string;
  description: string;
  options: {
    label: string;
    action: (player: Player) => { player: Player; message: string };
  }[];
}

export interface CombatLog {
  id: string;
  text: string;
  type: 'player' | 'monster' | 'system' | 'critical' | 'event' | 'drop';
}
