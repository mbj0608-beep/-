
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
  "狰", "当康", "祸斗", "夫诸", "鸣蛇", "朱厌", "狸力", "猰貐", "化蛇", "旋龟", "狌狌", "驳"
];

export const BOSS_NAMES = [
  "应龙", "共工之影", "祝融真身", "相柳", "烛九阴", "刑天意志", "饕餮", "穷奇"
];

export const INITIAL_ACHIEVEMENTS: Achievement[] = [
  { id: 'first_pill', name: '初窥门径', description: '第一次炼制丹药', unlocked: false },
  { id: 'floor_10', name: '登堂入室', description: '成功登上第10层天阶', unlocked: false },
  { id: 'floor_30', name: '金丹初成', description: '成功登上第30层天阶', unlocked: false },
  { id: 'floor_60', name: '破碎虚空', description: '成功登上第60层天阶', unlocked: false },
  { id: 'floor_99', name: '问鼎天阶', description: '成功登上最高层天阶', unlocked: false },
  { id: 'boss_slayer', name: '斩妖除魔', description: '击败一名强大的领主', unlocked: false },
  { id: 'rich_man', name: '财源广进', description: '持有灵石超过1000', unlocked: false },
  { id: 'millionaire', name: '富甲一方', description: '持有灵石超过5000', unlocked: false },
  { id: 'alchemy_master', name: '丹道圣手', description: '累计炼制丹药超过20次', unlocked: false },
  { id: 'alchemy_god', name: '丹神转世', description: '累计炼制丹药超过100次', unlocked: false },
  { id: 'reincarnate_5', name: '百折不挠', description: '重生超过5次', unlocked: false },
  { id: 'immortal_weapon', name: '绝世神兵', description: '装备一件仙品武器', unlocked: false }
];

export const INTRO_STORY = [
  "天道崩溃，法则紊乱。昔日的仙界已成废墟，唯有那九十九层【天阶】依然矗立在虚空之中。",
  "这不是普通的台阶，而是这方世界破碎时留下的最后记忆。每一层，都封印着一段往事。",
  "亿万年前，这里曾有四季，曾有欢笑。直到那个‘静默’的夜晚，神明抛弃了他们的子民。",
  "你，睁开了双眼。你是第几万个踏上这条路的人？在这无尽的轮回中，你是在寻求永生，还是在寻找归途？"
];

// 剧情片段库 (层层递进)
export const GET_FLOOR_STORY = (floor: number): string => {
  if (floor === 1) return "脚下的灰尘冰冷彻骨。你捡起一块碎砖，上面刻着一个模糊的‘家’字。";
  if (floor === 5) return "路边枯萎的草丛中，有一只褪色的木马。它不再摇晃，仿佛在等谁归来。";
  if (floor === 10) return "第十层。你看到一尊断头的石像，那是曾经保护这里的土地公。";
  if (floor === 15) return "风中传来了歌声，低沉而凄凉。像是母亲在摇篮边最后的叮咛。";
  if (floor === 20) return "天色渐暗，下方的尘世已看不清轮廓。你第一次感到了作为修行者的孤独。";
  if (floor === 25) return "这里有一摊干涸的血迹，属于一个不知名的炼气期少女，她手里握着半颗没炼成的废丹。";
  if (floor === 30) return "三十层。云雾缭绕。你回头望去，发现来时的路早已塌陷，你已无路可退。";
  if (floor === 40) return "你发现天阶的材料变了，不再是土石，而是无数强者的骨骼与法宝碎片。";
  if (floor === 50) return "五十层。这里的时间是凝固的。你看到自己前世的虚影，正满脸绝望地从这里坠落。";
  if (floor === 60) return "法则开始扭曲。你听到一个声音在问：‘如果你能拯救这一切，代价是失去关于他们的所有记忆，你愿意吗？’";
  if (floor === 75) return "每一阵风都在诉说着不甘。那些陨落的仙人，他们生前也在嘲笑蝼蚁，死后却成了筑路的砖。";
  if (floor === 90) return "九十层。距离天空只有一线之隔。空气中弥漫着诸神的余香，却寒冷如冰窖。";
  if (floor === 99) return "最高处。这里什么也没有。没有金座，没有仙子。只有一面镜子，镜子里照着疲惫的你。";
  
  // 填充逻辑
  const segments = [
    "你在台阶缝隙里发现一朵金色的花，那是法则枯萎前最后的挣扎。",
    "远方的天空裂开了一道缝，紫色的雷火在其间跳跃，嘲笑着凡人的执着。",
    "你感觉真气在经脉中疯狂流转，每一次突破都在剥夺你作为‘人’的情感。",
    "这层台阶上刻满了名字。你找了很久，终于在一个角落看到了自己的。",
    "一个路过的残魂对你笑了笑，然后化作点点磷光，消散在虚空中。",
    "你在路边发现了一本日记，最后一行写着：‘天亮了，但我看不见了。’"
  ];
  return segments[floor % segments.length];
};
