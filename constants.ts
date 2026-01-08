
import { Rarity, ElementType, Achievement } from './types';

export const RARITY_COLORS: Record<Rarity, string> = {
  [Rarity.COMMON]: '#a8a29e',     // Stone-400
  [Rarity.UNCOMMON]: '#22c55e',   // Green-500
  [Rarity.RARE]: '#3b82f6',       // Blue-500
  [Rarity.EPIC]: '#a855f7',       // Purple-500
  [Rarity.LEGENDARY]: '#f97316',  // Orange-500
  [Rarity.IMMORTAL]: '#eab308'    // Yellow-500
};

export const ELEMENT_LABELS: Record<ElementType, string> = {
  [ElementType.GOLD]: '破极',
  [ElementType.WOOD]: '逢春',
  [ElementType.WATER]: '叠浪',
  [ElementType.FIRE]: '焚心',
  [ElementType.EARTH]: '磐石'
};

export const INITIAL_TALENTS = {
  baseAttributes: 0,
  interestCap: 0,
  alchemyEfficiency: 0,
  inheritanceRate: 0
};

export const MONSTER_NAMES = [
  "幽影狼", "赤炼蛇", "玄水龟", "烈焰狮", "厚土象", "疾风隼", "幻目狐", "嗜血蝠",
  "雷翼虎", "冰晶蚕", "噬魂魔", "天劫影", "九幽蛟", "混沌兽"
];

export const BOSS_NAMES = [
  "青冥妖皇", "紫阳剑灵", "九天玄鸟", "深渊主宰", "万古荒兽", "九极幽尊"
];

export const INITIAL_ACHIEVEMENTS: Achievement[] = [
  { id: 'first_pill', name: '初窥门径', description: '第一次炼制丹药', unlocked: false },
  { id: 'floor_10', name: '登堂入室', description: '成功登上第10层天阶', unlocked: false },
  { id: 'boss_slayer', name: '斩妖除魔', description: '击败一名强大的领主', unlocked: false },
  { id: 'rich_man', name: '腰缠万贯', description: '持有灵石超过1000', unlocked: false },
  { id: 'alchemy_master', name: '丹道圣手', description: '累计炼制丹药超过20次', unlocked: false },
  { id: 'immortal', name: '半步登仙', description: '成功登上第50层天阶', unlocked: false }
];

export const INTRO_STORY = [
  "天道崩溃，法则紊乱。昔日的仙界已成废墟，唯有那九十九层【天阶】依然矗立在虚空之中。",
  "传说，登上天阶顶端者，可重塑肉身，掌控寰宇法则，成就永恒不灭之境。",
  "亿万年来，无数修行者在这里陨落，他们的神识散落在轮回之中，等待着下一次觉醒。",
  "你，睁开了双眼。这已是你不知道第多少次的轮回。这一次，你能否破开迷雾，问鼎天阶？"
];
