
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Player, Monster, Realm, Rarity, Pill, Attributes, FiveElements, CombatLog, RandomEvent, ElementType, EquipmentSlot, Equipment, Achievement, GlobalSaveData } from './types';
import { INITIAL_TALENTS, RARITY_COLORS, ELEMENT_LABELS, INITIAL_ACHIEVEMENTS, INTRO_STORY, GET_FLOOR_STORY } from './constants';
import { getRealmByFloor, calculateInterest, calculateAlchemyCost, generateMonster, generatePills, checkBonds, generateEquipment, getPlayerCombatStats } from './services/gameLogic';
import { loadGame, saveGame } from './services/storage';

// --- UI Components ---

const ProgressBar: React.FC<{ value: number; max: number; color: string; label: string; height?: string }> = ({ value, max, color, label, height = "h-5" }) => (
  <div className="w-full relative group">
    <div className={`${height} bg-stone-900/80 rounded-full border border-stone-800 overflow-hidden shadow-inner`}>
      <div 
        className={`h-full transition-all duration-700 ${color} shadow-[0_0_20px_rgba(0,0,0,0.7)]`} 
        style={{ width: `${Math.max(0, Math.min(100, (value / max) * 100))}%` }}
      />
    </div>
    <div className="absolute inset-0 flex items-center justify-center text-[10px] font-black text-white uppercase tracking-tighter drop-shadow-[0_2px_2px_rgba(0,0,0,1)]">
      {label}
    </div>
  </div>
);

const StatItem: React.FC<{ icon: string; label: string; value: number; baseValue: number; color: string }> = ({ icon, label, value, baseValue, color }) => (
  <div className="flex flex-col bg-stone-900/80 border border-stone-800/50 p-2.5 rounded-xl hover:border-stone-600 transition-colors shadow-lg">
    <div className="flex justify-between items-center mb-1.5">
      <span className="text-[9px] text-stone-500 font-black uppercase tracking-widest">{label}</span>
      <span className="text-xs filter drop-shadow-md">{icon}</span>
    </div>
    <div className={`text-lg font-black leading-none ${color} flex items-baseline gap-1`}>
      {Math.floor(value)}
      {value > baseValue && <span className="text-[10px] text-green-500 font-bold">+{Math.floor(value - baseValue)}</span>}
    </div>
  </div>
);

const EqSlot: React.FC<{ slot: EquipmentSlot; item?: Equipment }> = ({ slot, item }) => (
  <div className={`relative flex flex-col items-center justify-center p-2 rounded-2xl border-2 transition-all aspect-square group ${item ? 'bg-stone-800/80 border-stone-600 shadow-xl' : 'bg-stone-900/20 border-stone-800 border-dashed opacity-50'}`}>
    <span className="text-[9px] text-stone-500 font-black mb-1.5 uppercase opacity-60 group-hover:opacity-100">{slot}</span>
    <span className="text-2xl mb-1 group-hover:scale-110 transition-transform">{item ? (slot === EquipmentSlot.WEAPON ? '🗡️' : slot === EquipmentSlot.ARMOR ? '🧥' : '💍') : '∅'}</span>
    {item && <span className="text-[8px] font-black truncate w-full text-center px-1" style={{ color: item.color }}>{item.name}</span>}
    {item && <div className="absolute inset-0 rounded-2xl border-2 border-white/5 pointer-events-none" />}
  </div>
);

const ElementBadge: React.FC<{ type: ElementType; value: number; active: boolean }> = ({ type, value, active }) => {
  const colors: Record<ElementType, string> = {
    [ElementType.GOLD]: 'border-yellow-500 text-yellow-500 bg-yellow-950/50',
    [ElementType.WOOD]: 'border-green-500 text-green-500 bg-green-950/50',
    [ElementType.WATER]: 'border-blue-500 text-blue-500 bg-blue-950/50',
    [ElementType.FIRE]: 'border-red-500 text-red-500 bg-red-950/50',
    [ElementType.EARTH]: 'border-orange-700 text-orange-700 bg-orange-950/50',
  };
  return (
    <div className={`flex flex-col items-center justify-center py-2 px-1 rounded-xl border transition-all duration-500 ${active ? colors[type] + ' scale-110 shadow-[0_0_15px_rgba(255,255,255,0.05)] ring-1 ring-white/10' : 'border-stone-800 text-stone-700 grayscale'}`}>
      <span className="text-[9px] font-black mb-0.5">{ELEMENT_LABELS[type]}</span>
      <span className="text-xs font-mono font-bold">{value}</span>
    </div>
  );
};

// --- Main Engine ---

export default function App() {
  const [view, setView] = useState<'start' | 'intro' | 'main' | 'alchemy' | 'reincarnation' | 'event' | 'achievements' | 'story'>('start');
  const [player, setPlayer] = useState<Player | null>(null);
  const [monster, setMonster] = useState<Monster | null>(null);
  const [logs, setLogs] = useState<CombatLog[]>([]);
  const [currentPills, setCurrentPills] = useState<Pill[]>([]);
  const [activeEvent, setActiveEvent] = useState<RandomEvent | null>(null);
  const [globalData, setGlobalData] = useState<GlobalSaveData>(loadGame());
  const [currentStoryText, setCurrentStoryText] = useState("");
  
  const [shake, setShake] = useState(false);
  const [flash, setFlash] = useState(false);
  const [dmgPop, setDmgPop] = useState<{ id: number; val: number; crit: boolean }[]>([]);
  const [dismissTutorial, setDismissTutorial] = useState(false);
  const [showDrop, setShowDrop] = useState<Equipment | null>(null);
  const [introIndex, setIntroIndex] = useState(0);

  const addLog = useCallback((text: string, type: CombatLog['type'] = 'system') => {
    setLogs(prev => [{ id: Math.random().toString(), text, type }, ...prev].slice(0, 18));
  }, []);

  const checkAchievements = useCallback((p: Player) => {
    let changed = false;
    const nextAch = globalData.achievements.map(ach => {
      if (ach.unlocked) return ach;
      let unlocked = false;
      if (ach.id === 'first_pill' && p.totalAlchemyCount > 0) unlocked = true;
      if (ach.id === 'floor_10' && p.floor >= 10) unlocked = true;
      if (ach.id === 'floor_30' && p.floor >= 30) unlocked = true;
      if (ach.id === 'floor_60' && p.floor >= 60) unlocked = true;
      if (ach.id === 'floor_99' && p.floor >= 99) unlocked = true;
      if (ach.id === 'rich_man' && p.stones >= 1000) unlocked = true;
      if (ach.id === 'millionaire' && p.stones >= 5000) unlocked = true;
      if (ach.id === 'alchemy_master' && p.totalAlchemyCount >= 20) unlocked = true;
      if (ach.id === 'alchemy_god' && p.totalAlchemyCount >= 100) unlocked = true;
      if (ach.id === 'reincarnate_5' && globalData.reincarnationCount >= 5) unlocked = true;
      if (ach.id === 'immortal_weapon' && p.equipment[EquipmentSlot.WEAPON]?.rarity === Rarity.LEGENDARY) unlocked = true;
      
      if (unlocked) {
        changed = true;
        addLog(`【成就达成】 ${ach.name}！`, 'system');
        return { ...ach, unlocked: true };
      }
      return ach;
    });

    if (changed) {
      setGlobalData(prev => {
        const next = { ...prev, achievements: nextAch };
        saveGame(next);
        return next;
      });
    }
  }, [globalData.achievements, globalData.reincarnationCount, addLog]);

  const triggerPop = (val: number, crit: boolean) => {
    const id = Date.now();
    setDmgPop(prev => [...prev, { id, val, crit }]);
    setTimeout(() => setDmgPop(prev => prev.filter(p => p.id !== id)), 1000);
  };

  const initGame = () => {
    const baseAttrs = {
      physique: 20 + globalData.talents.baseAttributes * 5,
      essence: 15 + globalData.talents.baseAttributes * 2,
      spirit: 10 + globalData.talents.baseAttributes * 2,
      agility: 10 + globalData.talents.baseAttributes * 2,
    };
    
    const p: Player = {
      hp: baseAttrs.physique * 20,
      maxHp: baseAttrs.physique * 20,
      stones: 200, 
      floor: 1,
      attributes: baseAttrs,
      elements: { gold: 0, wood: 0, water: 0, fire: 0, earth: 0 },
      equipment: {},
      alchemyCount: 0,
      isImmortalNext: false,
      talents: globalData.talents,
      reincarnationPoints: globalData.points,
      tutorialStep: 0,
      totalAlchemyCount: 0,
      reincarnationCount: globalData.reincarnationCount
    };

    setPlayer(p);
    setMonster(generateMonster(1));
    setLogs([{ id: 'init', text: '“九重天阶，万世浮屠。尔等凡躯，求索长生。”', type: 'system' }]);
    setDismissTutorial(false);
    setView('main');
  };

  const handleDeath = useCallback(() => {
    if (!player) return;
    const pointsEarned = Math.floor(player.floor * 5 + player.totalAlchemyCount * 2);
    setGlobalData(prev => {
      const next = { ...prev, points: prev.points + pointsEarned, reincarnationCount: prev.reincarnationCount + 1 };
      saveGame(next);
      return next;
    });
    addLog(`身消道陨... 你于轮回中悟出 ${pointsEarned} 点遗泽。`, 'system');
    setView('reincarnation');
  }, [player, addLog]);

  const handleHeal = useCallback(() => {
    if (!player) return;
    const healCost = 200; 
    
    if (player.tutorialStep === 2) {
      setPlayer(prev => prev ? { ...prev, tutorialStep: 3 } : null);
    }

    if (player.stones < healCost) {
      addLog('灵石匮乏，无法运功疗伤！', 'system');
      return;
    }
    if (player.hp >= player.maxHp) {
      addLog('气血充盈，无需疗伤。', 'system');
      return;
    }

    let p = { ...player };
    p.stones -= healCost;
    const healVal = Math.floor(p.maxHp * 0.4);
    p.hp = Math.min(p.maxHp, p.hp + healVal);
    setPlayer(p);
    addLog(`耗费 ${healCost} 灵石，运功调息恢复了 ${healVal} 点气血。`, 'player');
    checkAchievements(p);
  }, [player, checkAchievements, addLog]);

  const triggerEvent = (customPlayer?: Player) => {
    const activeP = customPlayer || player;
    if (!activeP) return;

    const pool: RandomEvent[] = [
      {
        title: '【盲眼琴师】',
        description: '一名琴师在台阶旁独奏，他问你：‘你修仙是为了谁？’',
        options: [
          { 
            label: '为了苍生 (+15神识，-20%灵石)', 
            action: (p) => {
              const stoneLoss = Math.floor(p.stones * 0.2);
              return { player: { ...p, stones: p.stones - stoneLoss, attributes: { ...p.attributes, spirit: p.attributes.spirit + 15 } }, message: '琴声入魂，你的神识前所未有的清澈。' };
            }
          },
          { 
            label: '为了自己 (+15真元，-20%闪避)', 
            action: (p) => ({ player: { ...p, attributes: { ...p.attributes, essence: p.attributes.essence + 15, agility: Math.max(0, p.attributes.agility - 10) } }, message: '你坚定道心，真元激荡。' }) 
          }
        ]
      },
      {
        title: '【因果磨盘】',
        description: '巨大的石磨在虚空中旋转，吞噬着破碎的魂魄。',
        options: [
          { 
            label: '投身磨炼 (+20体魄，扣除50%当前HP)', 
            action: (p) => {
              const dmg = Math.floor(p.hp * 0.5);
              const nextP = { ...p, hp: Math.max(1, p.hp - dmg), attributes: { ...p.attributes, physique: p.attributes.physique + 20 } };
              nextP.maxHp = nextP.attributes.physique * 20;
              return { player: nextP, message: '肉身被反复碾碎重组，愈发坚韧。' };
            }
          },
          { label: '绕道而行 (+5身法)', action: (p) => ({ player: { ...p, attributes: { ...p.attributes, agility: p.attributes.agility + 5 } }, message: '你谨慎地避开了因果的碾压。' }) }
        ]
      },
      {
        title: '【天降异火】',
        description: '一团混沌火焰从虚空坠落，落在你必经之路上。',
        options: [
          { 
            label: '强行吸收 (+15火灵，-50灵石)', 
            action: (p) => {
              if (p.stones < 50) return { player: p, message: '灵石不足，无法压制异火，只能避开。' };
              return { player: { ...p, stones: p.stones - 50, elements: { ...p.elements, fire: p.elements.fire + 15 } }, message: '你以重金构筑法阵，成功炼化了异火。' };
            }
          },
          { label: '引水灌溉 (+10水灵，-30当前HP)', action: (p) => ({ player: { ...p, hp: Math.max(1, p.hp - 30), elements: { ...p.elements, water: p.elements.water + 10 } }, message: '火势熄灭，留下了纯净的水精。' }) }
        ]
      },
      {
        title: '【路遇仙冢】',
        description: '一座无名孤冢横在路中央，墓碑刻着：‘此生无憾，唯憾未登顶。’',
        options: [
          { label: '叩首拜祭 (+10全五行，-50灵石)', action: (p) => {
            if (p.stones < 50) return { player: p, message: '你两袖清风，唯有以此心祭奠。' };
            const nextE = { ...p.elements };
            Object.keys(nextE).forEach(k => (nextE as any)[k] += 10);
            return { player: { ...p, stones: p.stones - 50, elements: nextE }, message: '前辈遗泽感召，五行平衡流转。' };
          }},
          { label: '摸金掘宝 (+1件随机装备，全属性-5)', action: (p) => {
            const drop = generateEquipment(p.floor);
            const nextAttrs = { ...p.attributes };
            Object.keys(nextAttrs).forEach(k => (nextAttrs as any)[k] = Math.max(0, (nextAttrs as any)[k] - 5));
            const nextP = { ...p, attributes: nextAttrs };
            if (drop) nextP.equipment[drop.slot] = drop;
            return { player: nextP, message: '你挖出了残存法宝，但也沾染了死气。' };
          }}
        ]
      }
    ];
    setActiveEvent(pool[Math.floor(Math.random() * pool.length)]);
    setView('event');
  };

  const handleCombat = useCallback(() => {
    if (!player || !monster) return;

    let p = { ...player };
    let m = { ...monster };
    const combatStatsLocal = getPlayerCombatStats(p);
    const bonds = checkBonds(p.elements);

    // 新手引导逻辑
    if (p.tutorialStep === 1) p.tutorialStep = 2;
    if (p.tutorialStep === 3) {
       // 当玩家已进行到利息教学，并完成一次战斗（推进一层），视为已掌握，关闭引导
       setDismissTutorial(true);
       p.tutorialStep = 4;
    }

    const executePlayerTurn = () => {
      let dmg = combatStatsLocal.essence * 5;
      if (bonds.gold) dmg = Math.floor(dmg * 1.4); 
      const isCrit = Math.random() < (combatStatsLocal.spirit * 0.005);
      if (isCrit) dmg *= 2;
      let totalDmg = dmg;
      if (bonds.fire) totalDmg += Math.floor(m.maxHp * 0.05);
      m.hp -= totalDmg;
      triggerPop(totalDmg, isCrit);
      addLog(`造成 ${totalDmg} 伤害${isCrit ? '！(暴击)' : ''}`, isCrit ? 'critical' : 'player');
      if (isCrit) { setShake(true); setTimeout(() => setShake(false), 200); }
    };

    const executeMonsterTurn = () => {
      if (m.hp <= 0) return;
      let mDmg = Math.floor(m.atk * (bonds.earth ? 0.75 : 1));
      p.hp -= mDmg;
      addLog(`${m.name} 反击，损耗 ${mDmg} 气血`, 'monster');
      setFlash(true); setTimeout(() => setFlash(false), 100);
    };

    executePlayerTurn();
    executeMonsterTurn();

    if (m.hp <= 0) {
      const reward = 50 + p.floor * 5;
      const interest = calculateInterest(p.stones, p.talents.interestCap);
      p.stones += reward + interest;
      p.hp = Math.min(p.maxHp, p.hp + Math.floor(p.maxHp * 0.1));
      
      const drop = generateEquipment(p.floor);
      if (drop) { 
        p.equipment[drop.slot] = drop; 
        addLog(`【异宝】获得 ${drop.name}！`, 'drop'); 
        setShowDrop(drop); 
      }
      
      const nextFloor = p.floor + 1;
      p.floor = nextFloor;
      p.alchemyCount = 0; 
      
      setPlayer(p);
      setMonster(generateMonster(nextFloor));
      addLog(`胜局！晋升至第 ${nextFloor} 层。`, 'system');
      checkAchievements(p);
      
      // 触发层级剧情
      setCurrentStoryText(GET_FLOOR_STORY(nextFloor));
      setView('story');
    } else if (p.hp <= 0) {
      handleDeath();
    } else {
      setPlayer(p);
      setMonster(m);
    }
  }, [player, monster, globalData.achievements, checkAchievements, addLog, handleDeath]);

  const handleAlchemy = useCallback(() => {
    if (!player) return;
    const cost = calculateAlchemyCost(player.alchemyCount, player.talents.alchemyEfficiency);
    if (player.stones < cost) {
      addLog('灵石匮乏，无法开启丹炉！', 'system');
      return;
    }

    let p = { ...player };
    p.stones -= cost;
    p.alchemyCount += 1;
    p.totalAlchemyCount += 1;
    if (p.tutorialStep === 0) p.tutorialStep = 1; 

    if (p.alchemyCount >= 4 && Math.random() < (p.alchemyCount - 3) * 0.2) {
      const dmg = Math.floor(p.hp * 0.25);
      p.hp -= dmg;
      p.isImmortalNext = true; 
      setPlayer(p);
      addLog(`丹炉炸裂！受到 ${dmg} 点反噬伤害。下一炉必成仙品！`, 'critical');
      if (p.hp <= 0) handleDeath();
      return;
    }

    setCurrentPills(generatePills(p.floor, p.isImmortalNext));
    p.isImmortalNext = false;
    setPlayer(p);
    setView('alchemy');
  }, [player, addLog, handleDeath]);

  const selectPill = (pill: Pill) => {
    if (!player) return;
    let p = { ...player };
    Object.entries(pill.attributes).forEach(([k, v]) => p.attributes[k as keyof Attributes] += v);
    Object.entries(pill.elements).forEach(([k, v]) => p.elements[k as keyof FiveElements] += v);
    p.maxHp = p.attributes.physique * 20;
    setPlayer(p);
    setView('main');
    addLog(`药力灌体，修行大增！`, 'system');
    checkAchievements(p);
  };

  const upgradeTalent = (key: keyof typeof INITIAL_TALENTS) => {
    const cost = (globalData.talents[key] + 1) * 20;
    if (globalData.points < cost) return;
    setGlobalData(prev => {
      const newData = { ...prev, points: prev.points - cost, talents: { ...prev.talents, [key]: prev.talents[key] + 1 } };
      saveGame(newData);
      return newData;
    });
  };

  const combatStats = player ? getPlayerCombatStats(player) : null;
  const unlockedAchievementCount = globalData.achievements.filter(a => a.unlocked).length;

  // --- Render Layouts ---

  if (view === 'start') {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center p-6 text-center z-50 relative overflow-hidden bg-stone-950">
        <div className="absolute top-10 right-10 flex flex-col items-end opacity-60">
           <span className="text-yellow-600 text-[10px] font-black uppercase tracking-widest">累计轮回</span>
           <span className="text-stone-300 text-3xl font-black">{globalData.reincarnationCount}</span>
        </div>
        <div className="mb-2 text-yellow-500 text-8xl font-black tracking-[0.4em] text-glow select-none">万古轮回</div>
        <div className="text-stone-400 text-sm tracking-[0.6em] mb-16 opacity-60 uppercase font-bold tracking-widest">Eternal Reincarnation</div>
        <div className="flex gap-6 z-[100]">
          <button 
            onClick={() => setView('intro')}
            className="px-20 py-6 bg-stone-900 border-2 border-yellow-600 text-yellow-500 rounded-full font-black text-3xl hover:bg-yellow-600 hover:text-black transition-all shadow-2xl active:scale-95 cursor-pointer"
          >
            启 程
          </button>
          <button 
            onClick={() => setView('achievements')}
            className="px-10 py-6 bg-stone-800 border-2 border-stone-700 text-stone-300 rounded-full font-black text-xl hover:bg-stone-700 transition-all cursor-pointer shadow-lg active:scale-95"
          >
            成就 ({unlockedAchievementCount})
          </button>
        </div>
      </div>
    );
  }

  if (view === 'intro') {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-black p-12 text-center relative z-50 overflow-hidden">
        <div className="max-w-2xl">
          <p className="text-yellow-500/80 text-lg mb-8 tracking-[0.2em] font-black uppercase">卷首语</p>
          <div className="h-48 flex items-center justify-center text-stone-200 text-2xl leading-relaxed italic font-bold tracking-wide">
             {INTRO_STORY[introIndex]}
          </div>
          <div className="mt-16 flex flex-col items-center gap-6">
            <div className="flex gap-2">
              {INTRO_STORY.map((_, i) => (
                <div key={i} className={`w-2 h-2 rounded-full transition-all ${i === introIndex ? 'bg-yellow-500 w-8' : 'bg-stone-800'}`} />
              ))}
            </div>
            {introIndex < INTRO_STORY.length - 1 ? (
              <button 
                onClick={() => setIntroIndex(introIndex + 1)}
                className="px-12 py-4 bg-stone-900 border border-stone-700 text-stone-300 rounded-full hover:bg-stone-800 transition-all font-black tracking-widest cursor-pointer active:scale-95"
              >
                继续阅读
              </button>
            ) : (
              <button 
                onClick={initGame}
                className="px-16 py-5 bg-yellow-900 border-2 border-yellow-500 text-yellow-500 rounded-full hover:bg-yellow-800 transition-all font-black text-2xl tracking-[0.3em] shadow-glow cursor-pointer active:scale-95"
              >
                踏入轮回
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // --- Story Modal ---
  if (view === 'story') {
    return (
      <div className="fixed inset-0 bg-black/98 flex items-center justify-center p-8 z-[5000] animate-in fade-in duration-700">
        <div className="max-w-xl text-center space-y-12">
           <div className="text-yellow-600 text-xs font-black uppercase tracking-[0.8em]">天阶往事：第 {player?.floor} 层</div>
           <p className="text-stone-100 text-3xl leading-relaxed italic font-bold filter drop-shadow-md animate-in slide-in-from-bottom-4 duration-1000">
             “ {currentStoryText} ”
           </p>
           <button 
             onClick={() => {
               // 概率触发后续随机事件
               if (Math.random() < 0.45) {
                  triggerEvent();
               } else {
                  setView('main');
               }
             }}
             className="px-16 py-4 bg-stone-900 border border-stone-800 text-stone-400 rounded-full hover:bg-stone-800 hover:text-stone-200 transition-all font-black tracking-widest text-sm cursor-pointer"
           >
             踏入下一阶
           </button>
        </div>
      </div>
    );
  }

  if (view === 'achievements') {
    return (
      <div className="h-screen w-screen bg-black/95 p-12 flex flex-col items-center z-[200] relative overflow-y-auto">
        <h2 className="text-6xl text-yellow-600 font-black mb-12 tracking-widest text-glow">修行成就</h2>
        <div className="w-full max-w-4xl grid grid-cols-2 gap-6">
          {globalData.achievements.map(ach => (
            <div key={ach.id} className={`p-8 rounded-[2rem] border-2 transition-all ${ach.unlocked ? 'bg-yellow-950/20 border-yellow-600 shadow-glow' : 'bg-stone-900/50 border-stone-800 opacity-50 grayscale'}`}>
               <div className="flex justify-between items-start mb-4">
                 <h3 className="text-2xl font-black text-stone-100">{ach.name}</h3>
                 <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${ach.unlocked ? 'bg-yellow-600 text-black' : 'bg-stone-800 text-stone-500'}`}>
                   {ach.unlocked ? '已达成' : '未解锁'}
                 </span>
               </div>
               <p className="text-stone-400 italic font-bold">{ach.description}</p>
            </div>
          ))}
        </div>
        <button onClick={() => setView('start')} className="mt-16 px-16 py-5 bg-stone-800 text-stone-200 rounded-full font-black text-xl hover:bg-stone-700 transition-all cursor-pointer">返回</button>
      </div>
    );
  }

  if (view === 'reincarnation') {
    return (
      <div className="h-screen w-screen bg-black/90 p-8 flex flex-col items-center overflow-y-auto z-[200] relative">
        <h2 className="text-7xl text-yellow-600 font-black mb-8 tracking-widest text-glow drop-shadow-2xl">轮回殿</h2>
        <div className="w-full max-w-xl bg-stone-900/70 backdrop-blur-xl border-t-2 border-yellow-900/50 p-12 rounded-[3.5rem] shadow-2xl">
          <div className="flex justify-between items-center mb-12 border-b border-stone-800 pb-8">
            <span className="text-stone-500 text-sm font-black uppercase tracking-widest">遗泽点数</span>
            <span className="text-yellow-500 text-5xl font-black italic tracking-tighter">✨ {globalData.points}</span>
          </div>
          <div className="space-y-6">
            {[
              { key: 'baseAttributes', name: '重塑灵根', desc: '提升初始属性' },
              { key: 'interestCap', name: '聚宝盆', desc: '提高每层灵石收益上限' },
              { key: 'alchemyEfficiency', name: '丹道道果', desc: '减缓炼丹灵石消耗' },
              { key: 'inheritanceRate', name: '因果继承', desc: '增强每一世的传承力量' },
            ].map((t) => (
              <div key={t.key} className="flex justify-between items-center p-6 bg-black/50 rounded-[2rem] border border-stone-800 hover:border-yellow-700/50 transition-all group">
                <div className="flex-1">
                  <div className="font-black text-stone-200 text-xl flex items-center gap-4">
                    {t.name} <span className="text-yellow-600 text-xs px-3 py-1 bg-yellow-950/80 rounded-full">Lv.{globalData.talents[t.key as keyof typeof INITIAL_TALENTS]}</span>
                  </div>
                  <div className="text-sm text-stone-500 mt-2 font-medium italic opacity-80">{t.desc}</div>
                </div>
                <button 
                  onClick={() => upgradeTalent(t.key as keyof typeof INITIAL_TALENTS)}
                  className="px-8 py-3 bg-yellow-900/60 text-yellow-200 text-sm font-black rounded-2xl hover:bg-yellow-700 active:scale-90 disabled:opacity-20 transition-all shadow-xl cursor-pointer"
                  disabled={globalData.points < (globalData.talents[t.key as keyof typeof INITIAL_TALENTS] + 1) * 20}
                >
                  凝练
                </button>
              </div>
            ))}
          </div>
        </div>
        <button onClick={() => setView('start')} className="mt-12 w-full max-w-xl py-6 bg-stone-800 text-yellow-500 rounded-[2rem] font-black border border-yellow-900 shadow-2xl active:scale-95 transition-all text-2xl uppercase tracking-[0.4em] cursor-pointer">重 入 凡 尘</button>
      </div>
    );
  }

  return (
    <div className={`h-screen w-screen flex flex-col text-stone-200 overflow-hidden relative ${shake ? 'animate-[shake_0.2s_ease-in-out]' : ''}`}>
      {flash && <div className="fixed inset-0 bg-red-600/30 z-[999] pointer-events-none animate-pulse" />}

      {/* Top HUD */}
      <div className="px-10 py-6 bg-stone-900/95 border-b-2 border-stone-800/50 flex justify-between items-center z-50 shadow-2xl backdrop-blur-md">
        <div className="flex-1 flex items-center gap-6">
          <div 
            onClick={() => setView('achievements')}
            className="w-20 h-20 rounded-full border-4 border-yellow-600/60 bg-stone-950 flex flex-col items-center justify-center cursor-pointer shadow-glow hover:scale-105 active:scale-95 transition-all group"
          >
             <span className="text-[10px] font-black text-stone-500 uppercase group-hover:text-yellow-500 transition-colors">成就</span>
             <span className="text-yellow-500 text-lg font-black">{unlockedAchievementCount}</span>
          </div>
          <div className="w-64">
            <ProgressBar value={player?.hp || 0} max={player?.maxHp || 1} color="bg-gradient-to-r from-red-900 via-red-600 to-red-400" label={`气血: ${Math.floor(player?.hp || 0)}`} height="h-4" />
            <div className="mt-2 opacity-90"><ProgressBar value={player?.floor || 0} max={99} color="bg-sky-900" label={`登天阶进度`} height="h-2" /></div>
          </div>
        </div>
        <div className="flex flex-col items-center relative">
           <div className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-b from-yellow-50 via-yellow-500 to-yellow-950 tracking-tighter drop-shadow-[0_0_20px_rgba(234,179,8,0.5)]">{player?.floor}</div>
           <span className="text-[11px] text-stone-600 font-black tracking-[0.5em] uppercase -mt-2 opacity-80">层 天 阶</span>
           <div className="absolute -top-4 right-[-50px] text-[10px] text-yellow-700 font-black italic whitespace-nowrap">轮回 {globalData.reincarnationCount}</div>
        </div>
        <div className="flex-1 flex flex-col items-end">
          <div className="flex items-center gap-3">
            <span className="text-yellow-500 text-4xl font-black drop-shadow-lg">💰 {player?.stones}</span>
          </div>
          <div className="text-[11px] text-stone-500 font-black tracking-widest mt-1">利息 +{calculateInterest(player?.stones || 0, player?.talents.interestCap || 0)}</div>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <div className="w-80 bg-stone-950/80 backdrop-blur-xl border-r-2 border-stone-800/40 p-6 flex flex-col gap-10 overflow-y-auto z-40 shadow-2xl">
          <section>
            <h4 className="text-[11px] font-black text-stone-500 uppercase mb-5 border-b border-stone-800 pb-2">自身道基</h4>
            <div className="grid grid-cols-2 gap-4">
              <StatItem icon="🩸" label="体魄" value={combatStats?.physique || 0} baseValue={player?.attributes.physique || 0} color="text-rose-400" />
              <StatItem icon="⚡" label="真元" value={combatStats?.essence || 0} baseValue={player?.attributes.essence || 0} color="text-emerald-400" />
              <StatItem icon="🌀" label="神识" value={combatStats?.spirit || 0} baseValue={player?.attributes.spirit || 0} color="text-sky-400" />
              <StatItem icon="🎐" label="身法" value={combatStats?.agility || 0} baseValue={player?.attributes.agility || 0} color="text-amber-400" />
            </div>
          </section>
          <section>
            <h4 className="text-[11px] font-black text-stone-500 uppercase mb-5 border-b border-stone-800 pb-2">护身法宝</h4>
            <div className="grid grid-cols-3 gap-4">
              <EqSlot slot={EquipmentSlot.WEAPON} item={player?.equipment[EquipmentSlot.WEAPON]} />
              <EqSlot slot={EquipmentSlot.ARMOR} item={player?.equipment[EquipmentSlot.ARMOR]} />
              <EqSlot slot={EquipmentSlot.ACCESSORY} item={player?.equipment[EquipmentSlot.ACCESSORY]} />
            </div>
          </section>
          <section>
            <h4 className="text-[11px] font-black text-stone-500 uppercase mb-5 border-b border-stone-800 pb-2">五行真意</h4>
            <div className="grid grid-cols-5 gap-2">
              <ElementBadge type={ElementType.GOLD} value={player?.elements.gold || 0} active={!!checkBonds(player!.elements).gold} />
              <ElementBadge type={ElementType.WOOD} value={player?.elements.wood || 0} active={!!checkBonds(player!.elements).wood} />
              <ElementBadge type={ElementType.WATER} value={player?.elements.water || 0} active={!!checkBonds(player!.elements).water} />
              <ElementBadge type={ElementType.FIRE} value={player?.elements.fire || 0} active={!!checkBonds(player!.elements).fire} />
              <ElementBadge type={ElementType.EARTH} value={player?.elements.earth || 0} active={!!checkBonds(player!.elements).earth} />
            </div>
          </section>
        </div>

        {/* Center Stage */}
        <div className="flex-1 relative flex flex-col z-30">
          <div className="flex-1 flex flex-col items-center justify-center p-12 relative overflow-hidden">
            {dmgPop.map(p => (
              <div key={p.id} className={`absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-32 z-50 pointer-events-none damage-pop text-5xl font-black ${p.crit ? 'text-yellow-400 scale-150' : 'text-red-500'}`}>
                {p.crit && '✨'}-{Math.floor(p.val)}
              </div>
            ))}
            {monster && (
              <div className="text-center relative">
                <div className={`text-[14rem] mb-12 drop-shadow-[0_40px_100px_rgba(0,0,0,1)] ${monster.isBoss ? 'scale-110' : 'animate-float'}`} style={{ filter: `hue-rotate(${player?.floor! * 15}deg) brightness(1.1)` }}>{monster.isBoss ? '👾' : '👹'}</div>
                <div className="relative z-10 px-16 py-8 bg-stone-900/40 rounded-[4rem] border border-stone-800 backdrop-blur-xl shadow-2xl">
                  <h3 className="text-5xl font-black mb-2 tracking-tighter flex items-center justify-center gap-5">
                    {monster.isBoss && <span className="text-sm bg-red-700 px-4 py-1.5 rounded-full text-white font-black uppercase">领主</span>}
                    {monster.name}
                  </h3>
                  <div className="text-sm text-stone-500 font-black mb-8 uppercase tracking-[0.4em] opacity-70 italic">{monster.realm} | 凶煞：{monster.atk}</div>
                  <div className="w-96 mx-auto">
                    <ProgressBar value={monster.hp} max={monster.maxHp} color="bg-gradient-to-r from-orange-900 via-orange-700 to-orange-500" label={`${Math.floor(monster.hp)} / ${monster.maxHp}`} height="h-5" />
                  </div>
                </div>
              </div>
            )}
          </div>
          <div className="h-64 p-10 bg-gradient-to-t from-black via-black/90 to-transparent flex flex-col-reverse overflow-hidden pointer-events-none">
            {logs.map((log) => (
              <div key={log.id} className={`text-xs mb-2 ${
                log.type === 'player' ? 'text-green-400 font-bold' : 
                log.type === 'monster' ? 'text-rose-400' : 
                log.type === 'critical' ? 'text-yellow-400 font-black text-sm italic' : 
                log.type === 'drop' ? 'text-cyan-400 font-black animate-bounce' : 'text-stone-600 font-bold'
              }`}>
                {log.type === 'drop' && '◈ 瑞兆：'} {log.text}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer Controls */}
      <div className="relative z-[1000] p-10 bg-stone-900 border-t-4 border-stone-800/80 shadow-[0_-30px_60px_rgba(0,0,0,1)]">
        {/* Tutorial Guidance */}
        {player && player.tutorialStep < 4 && !dismissTutorial && (
           <div 
             onClick={() => setDismissTutorial(true)}
             className="absolute -top-32 left-1/2 -translate-x-1/2 bg-yellow-600 text-white text-xs font-black px-10 py-5 rounded-full animate-bounce shadow-2xl flex items-center gap-4 border-2 border-white/30 z-[2000] cursor-pointer pointer-events-auto"
           >
             <span className="bg-white/20 px-3 py-1 rounded-full text-[10px] uppercase font-black">仙缘指引 (点击关闭)</span>
             <span className="tracking-wide text-sm">
               {player.tutorialStep === 0 && "【炼丹】乃立身之本，先炼制一枚仙丹！"}
               {player.tutorialStep === 1 && "丹道初成，速去【挑战】登天阶！"}
               {player.tutorialStep === 2 && "受伤后点击【调息】，灵石可救命！"}
               {player.tutorialStep === 3 && "利息随存款增加，财法并举方可登仙。"}
             </span>
           </div>
        )}

        <div className="absolute -top-6 left-0 right-0 px-20">
           <div className="h-2 bg-stone-800 rounded-full border border-stone-700 overflow-hidden shadow-glow-sm">
              <div 
                className="h-full bg-gradient-to-r from-yellow-700 via-yellow-400 to-yellow-200 transition-all duration-1000"
                style={{ width: `${(player?.floor || 1)}%` }}
              />
           </div>
           <div className="flex justify-between mt-1 px-1">
              <span className="text-[9px] font-black text-stone-600 uppercase">凡 尘</span>
              <span className="text-[9px] font-black text-yellow-600 uppercase tracking-[0.2em]">问 鼎 苍 穹 (第 {player?.floor}/99 层)</span>
              <span className="text-[9px] font-black text-stone-600 uppercase">真 仙</span>
           </div>
        </div>

        <div className="max-w-5xl mx-auto grid grid-cols-4 gap-10 items-center h-24">
          <button 
            onClick={handleHeal}
            className={`h-full rounded-3xl bg-stone-800 border-2 border-stone-700 flex flex-col items-center justify-center transition-all hover:bg-stone-700 active:scale-90 group cursor-pointer shadow-lg ${player && player.tutorialStep === 2 ? 'ring-4 ring-red-500' : ''}`}
          >
            <span className="text-3xl mb-1 group-hover:scale-110 transition-transform">🧘</span>
            <span className="text-[11px] font-black uppercase text-stone-300">调息疗伤</span>
            <span className="text-[10px] text-yellow-500 font-black">💰 200</span>
          </button>

          <button 
            onClick={handleAlchemy}
            className={`h-28 -mt-12 rounded-[2.5rem] bg-gradient-to-br from-yellow-500 via-yellow-700 to-yellow-900 border-2 border-yellow-300 flex flex-col items-center justify-center shadow-2xl group active:scale-90 transition-all cursor-pointer relative ${player?.tutorialStep === 0 ? 'ring-8 ring-white/50' : ''}`}
          >
            <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity" />
            <span className="text-5xl mb-1 group-hover:rotate-12 transition-transform drop-shadow-lg">🏺</span>
            <span className="text-sm font-black text-white tracking-widest uppercase">九转炼丹</span>
            <span className="text-[10px] text-yellow-100 font-black mt-1">灵石: {calculateAlchemyCost(player?.alchemyCount || 0, player?.talents.alchemyEfficiency || 0)}</span>
          </button>

          <button 
            onClick={handleCombat}
            className={`h-28 -mt-12 rounded-[2.5rem] bg-gradient-to-br from-stone-700 via-stone-800 to-stone-950 border-2 border-stone-500 flex flex-col items-center justify-center shadow-2xl group active:scale-90 transition-all cursor-pointer relative ${player?.tutorialStep === 1 ? 'ring-8 ring-yellow-500/50' : ''}`}
          >
            <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
            <span className="text-5xl mb-1 group-hover:translate-y-[-5px] transition-transform drop-shadow-lg">⚔️</span>
            <span className="text-sm font-black text-stone-100 tracking-widest uppercase">踏步登天</span>
            <span className="text-[10px] text-stone-500 font-black mt-1">斩妖除魔</span>
          </button>

          <button 
            onClick={() => setView('start')} 
            className="h-full rounded-3xl bg-stone-800 border-2 border-stone-700 flex flex-col items-center justify-center transition-all hover:bg-stone-700 active:scale-90 text-stone-500 group cursor-pointer shadow-lg"
          >
            <span className="text-3xl mb-1 group-hover:scale-110 transition-transform">⛩️</span>
            <span className="text-[11px] font-black uppercase tracking-widest">返 回</span>
          </button>
        </div>
      </div>

      {/* MODAL: EQUIPMENT DROP */}
      {showDrop && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-[4000] animate-in fade-in duration-500">
           <div className="bg-stone-900 border-4 border-yellow-600 rounded-[3rem] p-12 w-full max-md text-center shadow-gold animate-in zoom-in duration-300">
              <p className="text-yellow-500 text-sm font-black uppercase tracking-[0.4em] mb-4">天 降 异 宝</p>
              <div className="text-8xl mb-8 animate-bounce">
                 {showDrop.slot === EquipmentSlot.WEAPON ? '🗡️' : showDrop.slot === EquipmentSlot.ARMOR ? '🧥' : '💍'}
              </div>
              <h3 className="text-3xl font-black mb-2" style={{ color: showDrop.color }}>{showDrop.name}</h3>
              <p className="text-stone-500 font-black uppercase tracking-widest text-xs mb-8">{showDrop.rarity} · {showDrop.slot}</p>
              <div className="bg-black/40 p-6 rounded-2xl border border-stone-800 mb-10 text-left">
                 {Object.entries(showDrop.stats).map(([k, v]) => (
                   <div key={k} className="text-stone-300 font-bold">
                     ◈ {k === 'physique' ? '体魄' : k === 'essence' ? '真元' : k === 'spirit' ? '神识' : '身法'} <span className="text-green-400">+{v}</span>
                   </div>
                 ))}
              </div>
              <button 
                onClick={() => setShowDrop(null)}
                className="w-full py-5 bg-yellow-600 text-black font-black text-xl rounded-full hover:bg-yellow-500 active:scale-95 transition-all cursor-pointer shadow-glow"
              >
                收纳法宝
              </button>
           </div>
        </div>
      )}

      {/* Modals: Alchemy/Event */}
      {view === 'alchemy' && (
        <div className="fixed inset-0 bg-black/98 backdrop-blur-3xl flex items-center justify-center p-8 z-[3000] animate-in fade-in duration-300">
          <div className="bg-stone-900 border-2 border-yellow-600 rounded-[4rem] p-12 w-full max-w-xl text-center shadow-gold">
            <div className="text-4xl font-black text-yellow-500 mb-12 tracking-[0.5em] flex items-center justify-center gap-6">✦ 丹 成 天 象 ✦</div>
            <div className="space-y-6">
              {currentPills.map(pill => (
                <button 
                  key={pill.id} 
                  onClick={() => selectPill(pill)}
                  className="w-full p-8 rounded-[2.5rem] bg-stone-950 border-2 border-stone-800 hover:border-yellow-500 transition-all text-left group hover:scale-[1.04] active:scale-95 cursor-pointer shadow-xl"
                >
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-2xl font-black group-hover:text-yellow-400" style={{ color: pill.color }}>{pill.name}</span>
                    <span className="text-[10px] bg-stone-900 px-4 py-1.5 rounded-full border border-stone-800 text-stone-500 uppercase">{pill.rarity}</span>
                  </div>
                  <div className="text-xs text-stone-500 leading-relaxed font-black italic">
                    {Object.entries(pill.attributes).map(([k, v]) => (
                      <span key={k} className="mr-6">◈ {k === 'physique' ? '体魄' : k === 'essence' ? '真元' : k === 'spirit' ? '神识' : '身法'} <span className="text-stone-100">+{v}</span></span>
                    ))}
                    <br/>
                    {Object.entries(pill.elements).map(([k, v]) => (
                      <span key={k} className="mr-6">◈ {ElementType[k.toUpperCase() as keyof typeof ElementType]}灵力 <span className="text-stone-100">+{v}</span></span>
                    ))}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {view === 'event' && activeEvent && (
        <div className="fixed inset-0 bg-black/98 backdrop-blur-3xl flex items-center justify-center p-8 z-[3000] animate-in fade-in zoom-in duration-500">
          <div className="bg-stone-900 border-2 border-stone-700 rounded-[4rem] p-16 w-full max-w-2xl text-center shadow-2xl">
            <h3 className="text-4xl font-black text-yellow-600 mb-8 tracking-[0.3em] uppercase">{activeEvent.title}</h3>
            <p className="text-stone-300 text-xl leading-relaxed mb-16 font-bold italic opacity-90">{activeEvent.description}</p>
            <div className="space-y-5">
              {activeEvent.options.map((opt, i) => (
                <button 
                  key={i} 
                  onClick={() => {
                    const result = opt.action(player!);
                    setPlayer(result.player);
                    addLog(result.message, 'event');
                    setView('main');
                    checkAchievements(result.player);
                  }}
                  className="w-full py-6 bg-stone-800 border-2 border-stone-700 rounded-[2.5rem] text-sm font-black hover:bg-stone-700 active:scale-[0.97] transition-all text-stone-100 uppercase tracking-widest cursor-pointer shadow-xl"
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
