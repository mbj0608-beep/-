
import { INITIAL_TALENTS, INITIAL_ACHIEVEMENTS } from '../constants';
import { GlobalSaveData } from '../types';

const STORAGE_KEY = 'vangu_lunhui_save_v2';

export const saveGame = (data: GlobalSaveData) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
};

export const loadGame = (): GlobalSaveData => {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      // Ensure missing achievements are added
      if (!parsed.achievements) parsed.achievements = INITIAL_ACHIEVEMENTS;
      return parsed;
    } catch (e) {
      console.error("Failed to load save", e);
    }
  }
  return { talents: INITIAL_TALENTS, points: 0, achievements: INITIAL_ACHIEVEMENTS };
};
