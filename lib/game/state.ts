import { create } from 'zustand';
import { supabase, isSupabaseConfigured } from '../supabaseClient';
import { gameAudio } from './audio';
import { 
  JobClass, CharacterStats, InventoryItem, CombatLog, LootNotification,
  Skill, TouchIndicator, InputBufferItem, JoystickState, HeadgearId,
  EquipmentSlot, EquippedItems, StatusEffect, JobMetadata, PlayerStatus,
  QuestDefinition, QuestObjective, Achievement,
  ShopItem
} from './types';
import type { Entity } from './types';
import { ALL_QUESTS } from './quests';
import { SHOP_ITEMS } from './shop';
import { ALL_ACHIEVEMENTS } from './achievements';
import { getCombinedCardEffects } from './cards';

function getXpMultiplier(): number {
  if (typeof process === 'undefined' || !process.env.NEXT_PUBLIC_XP_MULTIPLIER) return 1;
  const v = parseFloat(process.env.NEXT_PUBLIC_XP_MULTIPLIER);
  return Number.isFinite(v) && v > 0 ? v : 1;
}

export const JOB_TREE: Record<JobClass, JobMetadata> = {
  'Novice': { tier: 'Novice', nextJobs: ['Swordsman', 'Mage', 'Archer', 'Acolyte', 'Merchant', 'Thief'], requirement: { jobLevel: 10 } },
  'Swordsman': { tier: 'First', nextJobs: ['Knight', 'Crusader'], requirement: { jobLevel: 40 } },
  'Mage': { tier: 'First', nextJobs: ['Wizard', 'Sage'], requirement: { jobLevel: 40 } },
  'Archer': { tier: 'First', nextJobs: ['Hunter', 'Bard', 'Dancer'], requirement: { jobLevel: 40 } },
  'Acolyte': { tier: 'First', nextJobs: ['Priest', 'Monk'], requirement: { jobLevel: 40 } },
  'Merchant': { tier: 'First', nextJobs: ['Blacksmith', 'Alchemist'], requirement: { jobLevel: 40 } },
  'Thief': { tier: 'First', nextJobs: ['Assassin', 'Rogue'], requirement: { jobLevel: 40 } },
  'Knight': { tier: 'Second', nextJobs: ['Lord Knight'], requirement: { jobLevel: 50, baseLevel: 99 } },
  'Crusader': { tier: 'Second', nextJobs: ['Paladin'], requirement: { jobLevel: 50, baseLevel: 99 } },
  'Wizard': { tier: 'Second', nextJobs: ['High Wizard'], requirement: { jobLevel: 50, baseLevel: 99 } },
  'Sage': { tier: 'Second', nextJobs: ['Professor'], requirement: { jobLevel: 50, baseLevel: 99 } },
  'Hunter': { tier: 'Second', nextJobs: ['Sniper'], requirement: { jobLevel: 50, baseLevel: 99 } },
  'Bard': { tier: 'Second', nextJobs: ['Clown'], requirement: { jobLevel: 50, baseLevel: 99 } },
  'Dancer': { tier: 'Second', nextJobs: ['Gypsy'], requirement: { jobLevel: 50, baseLevel: 99 } },
  'Priest': { tier: 'Second', nextJobs: ['High Priest'], requirement: { jobLevel: 50, baseLevel: 99 } },
  'Monk': { tier: 'Second', nextJobs: ['Champion'], requirement: { jobLevel: 50, baseLevel: 99 } },
  'Blacksmith': { tier: 'Second', nextJobs: ['Whitesmith'], requirement: { jobLevel: 50, baseLevel: 99 } },
  'Alchemist': { tier: 'Second', nextJobs: ['Creator'], requirement: { jobLevel: 50, baseLevel: 99 } },
  'Assassin': { tier: 'Second', nextJobs: ['Assassin Cross'], requirement: { jobLevel: 50, baseLevel: 99 } },
  'Rogue': { tier: 'Second', nextJobs: ['Stalker'], requirement: { jobLevel: 50, baseLevel: 99 } },
  'Lord Knight': { tier: 'Transcendent', nextJobs: [], requirement: { jobLevel: 70 } },
  'Paladin': { tier: 'Transcendent', nextJobs: [], requirement: { jobLevel: 70 } },
  'High Wizard': { tier: 'Transcendent', nextJobs: [], requirement: { jobLevel: 70 } },
  'Professor': { tier: 'Transcendent', nextJobs: [], requirement: { jobLevel: 70 } },
  'Sniper': { tier: 'Transcendent', nextJobs: [], requirement: { jobLevel: 70 } },
  'Clown': { tier: 'Transcendent', nextJobs: [], requirement: { jobLevel: 70 } },
  'Gypsy': { tier: 'Transcendent', nextJobs: [], requirement: { jobLevel: 70 } },
  'High Priest': { tier: 'Transcendent', nextJobs: [], requirement: { jobLevel: 70 } },
  'Champion': { tier: 'Transcendent', nextJobs: [], requirement: { jobLevel: 70 } },
  'Whitesmith': { tier: 'Transcendent', nextJobs: [], requirement: { jobLevel: 70 } },
  'Creator': { tier: 'Transcendent', nextJobs: [], requirement: { jobLevel: 70 } },
  'Assassin Cross': { tier: 'Transcendent', nextJobs: [], requirement: { jobLevel: 70 } },
  'Stalker': { tier: 'Transcendent', nextJobs: [], requirement: { jobLevel: 70 } },
};

export interface ActiveBuff {
  id: string;
  name: string;
  durationMs: number;
  maxDurationMs: number;
  icon: string;
  description: string;
  stats?: Partial<Record<'str' | 'agi' | 'int' | 'dex' | 'luk' | 'vit', number>>;
}

export interface ActiveCastState {
  skillId: string;
  skillName: string;
  durationMs: number;
  elapsedMs: number;
  color: string;
}

interface GameStoreState {
  // Player Stats & Status
  jobClass: JobClass;
  stats: CharacterStats;
  baseStats: CharacterStats; // New base stats
  currentHp: number;
  currentSp: number;
  playerBaseExp: number;
  playerBaseMaxExp: number;
  playerJobExp: number;
  playerJobMaxExp: number;
  headgear: HeadgearId;
  playerStatus: PlayerStatus;
  activeCast: ActiveCastState | null;
  battleMode: boolean;
  autoBattle: boolean;
  autoPickupEnabled: boolean;
  showCombatLog: boolean;

  // Inventory & Targets
  inventory: InventoryItem[];
  equippedItems: EquippedItems;
  targetEntityId: string | null;
  targetHp: number;
  targetMaxHp: number;
  targetName: string;
  targetLevel: number;
  targetEntityType: 'monster' | 'boss_mvp' | 'npc' | null;

  playerAttackPulse: number; // Increment to trigger UI attack animations

  // NPC Interactions & Buffs
  npcDialogue: {
    npcId: string;
    npcName: string;
    npcType: 'kafra' | 'crusader_instructor' | 'quest_giver';
    text: string;
    options: { label: string; actionParam: string }[];
  } | null;
  activeBuffs: ActiveBuff[];
  activeStatusEffects: StatusEffect[];

  // System Lists & UI
  combatLogs: CombatLog[];
  lootNotifications: LootNotification[];
  skills: Skill[];
  bufferingQueue: InputBufferItem[];
  joystick: JoystickState;
  
  // Settings & Controls
  isJoystickEnabled: boolean;
  isMultitouchSupported: boolean;
  activeInputMode: 'touch_target' | 'joystick_aim';
  highContrastMode: boolean;

  // Economía
  zeny: number;

  // Quest System
  quests: QuestDefinition[];
  activeQuests: string[];
  completedQuests: string[];
  questProgress: Record<string, QuestObjective[]>;
  questSurvivalTimers: Record<string, number>;
  currentMainQuest: string | null;

  // Shop
  shopOpen: boolean;
  shopItems: ShopItem[];

  // Landmarks
  discoveredLandmarks: string[];

  // Achievements
  achievements: Achievement[];

  // Titles
  playerTitle: string;

  // Entities (for minimap)
  entities: Entity[];

  // HUD
  showQuestTracker: boolean;
  currentMapName: string | null;
  currentMapId: string | null;
  currentRegionId: string | null;
  mapTransitionBanner: string | null;

  // Actions - HUD
  setCurrentMapName: (name: string | null) => void;
  setCurrentMapId: (mapId: string | null) => void;
  setCurrentRegionId: (regionId: string | null) => void;
  showMapTransitionBanner: (mapName: string) => void;
  hideMapTransitionBanner: () => void;

  // Actions - Accessibility
  toggleHighContrastMode: () => void;

  // Actions - Economía
  addZeny: (amount: number) => void;
  spendZeny: (amount: number) => boolean;
  openShop: () => void;
  closeShop: () => void;
  buyShopItem: (itemId: string) => void;
  sellItem: (itemId: string, quantity?: number) => void;

  // Actions - Quests
  acceptQuest: (questId: string) => void;
  abandonQuest: (questId: string) => void;
  updateQuestProgress: (questId: string, objectiveIndex: number, amount: number) => void;
  completeQuest: (questId: string) => void;
  getActiveQuest: () => QuestDefinition | null;

  // Actions - Landmarks
  discoverLandmark: (landmarkId: string) => void;

  // Actions - Achievements
  checkAchievements: () => void;

  // Potions
  drinkPotionById: (itemId: string) => boolean;
  getPotionHealAmount: (itemId: string) => { hpPct: number; spPct: number } | null;

  // Titles
  setPlayerTitle: (title: string) => void;

  // Cards
  socketCardIntoEquipment: (cardItemId: string, equipmentId: string) => void;

  // Habilidades y progresión
  skillPoints: number;
  allocateSkillPoint: (skillId: string) => void;

  // Actions / Reducers
  setJobClass: (job: JobClass) => void;
  updateStats: (stats: Partial<CharacterStats>) => void;
  setPlayerHpSp: (hp: number, sp: number) => void;
  addExp: (base: number, job: number) => void;
  setHeadgear: (id: HeadgearId) => void;
  setTarget: (id: string | null, name?: string, hp?: number, maxHp?: number, level?: number, entityType?: 'monster' | 'boss_mvp' | 'npc' | null) => void;
  updateTargetHp: (hp: number) => void;
  triggerPlayerAttackPulse: () => void;
  addCombatLog: (text: string, type: CombatLog['type']) => void;
  clearCombatLogs: () => void;
  addLootNotification: (lines: string[]) => void;
  addToInputBuffer: (item: Omit<InputBufferItem, 'id' | 'timestamp' | 'expiresAt'>) => void;
  removeFromInputBuffer: (id: string) => void;
  clearInputBuffer: () => void;
  updateJoystick: (joystick: Partial<JoystickState>) => void;
  setJoystickEnabled: (enabled: boolean) => void;
  setInputMode: (mode: 'touch_target' | 'joystick_aim') => void;
  toggleAutoBattle: () => void;
  toggleAutoPickup: () => void;
  castSkill: (skillId: string) => void;
  equipItem: (itemId: string, slot: EquipmentSlot) => void;
  unequipItem: (slot: EquipmentSlot) => void;
  recalculateStats: () => void;
  addItem: (item: InventoryItem) => void;
  discardItem: (itemId: string, quantity?: number) => void;

  setNpcDialogue: (dialogue: GameStoreState['npcDialogue']) => void;
  setPlayerStatus: (status: PlayerStatus) => void;
  addBuff: (buff: ActiveBuff) => void;
  removeBuff: (id: string) => void;
  setStatusEffects: (effects: StatusEffect[]) => void;
  saveGame: () => Promise<void>;
  loadGame: () => Promise<void>;
}

export const defaultStats: Record<JobClass, CharacterStats> = {
  'Novice': {
    level: 1, jobLevel: 1, str: 5, agi: 5, vit: 5, int: 5, dex: 5, luk: 5,
    atk: 10, def: 5, matk: 0, hit: 10, flee: 10, aspd: 110, spd: 100, maxHp: 160, maxSp: 30
  },
  'Swordsman': {
    level: 10, jobLevel: 1, str: 18, agi: 12, vit: 18, int: 5, dex: 12, luk: 6,
    atk: 42, def: 24, matk: 0, hit: 24, flee: 18, aspd: 125, spd: 100, maxHp: 850, maxSp: 80
  },
  'Acolyte': {
    level: 10, jobLevel: 1, str: 8, agi: 8, vit: 12, int: 20, dex: 12, luk: 8,
    atk: 22, def: 18, matk: 0, hit: 22, flee: 18, aspd: 120, spd: 100, maxHp: 650, maxSp: 180
  },
  'Thief': {
    level: 10, jobLevel: 1, str: 14, agi: 20, vit: 8, int: 5, dex: 14, luk: 10,
    atk: 32, def: 12, matk: 0, hit: 26, flee: 32, aspd: 135, spd: 110, maxHp: 580, maxSp: 100
  },
  'Archer': {
    level: 10, jobLevel: 1, str: 8, agi: 18, vit: 8, int: 8, dex: 20, luk: 8,
    atk: 28, def: 10, matk: 0, hit: 32, flee: 26, aspd: 130, spd: 100, maxHp: 540, maxSp: 120
  },
  'Mage': {
    level: 10, jobLevel: 1, str: 5, agi: 8, vit: 10, int: 22, dex: 14, luk: 6,
    atk: 18, def: 12, matk: 0, hit: 20, flee: 16, aspd: 115, spd: 100, maxHp: 520, maxSp: 220
  },
  'Merchant': {
    level: 10, jobLevel: 1, str: 15, agi: 10, vit: 15, int: 5, dex: 10, luk: 8,
    atk: 35, def: 20, matk: 0, hit: 22, flee: 15, aspd: 120, spd: 100, maxHp: 750, maxSp: 90
  },
  'Knight': {
    level: 40, jobLevel: 1, str: 45, agi: 35, vit: 50, int: 15, dex: 35, luk: 20,
    atk: 120, def: 85, matk: 0, hit: 90, flee: 85, aspd: 142, spd: 100, maxHp: 4200, maxSp: 180
  },
  'Crusader': {
    level: 40, jobLevel: 1, str: 40, agi: 30, vit: 65, int: 35, dex: 30, luk: 25,
    atk: 110, def: 120, matk: 0, hit: 85, flee: 70, aspd: 135, spd: 100, maxHp: 4800, maxSp: 320
  },
  'Wizard': {
    level: 40, jobLevel: 1, str: 10, agi: 25, vit: 30, int: 55, dex: 45, luk: 20,
    atk: 60, def: 55, matk: 0, hit: 85, flee: 75, aspd: 132, spd: 100, maxHp: 2800, maxSp: 850
  },
  'Sage': {
    level: 40, jobLevel: 1, str: 20, agi: 35, vit: 35, int: 45, dex: 50, luk: 20,
    atk: 90, def: 65, matk: 0, hit: 105, flee: 90, aspd: 140, spd: 105, maxHp: 3100, maxSp: 620
  },
  'Hunter': {
    level: 40, jobLevel: 1, str: 20, agi: 45, vit: 30, int: 25, dex: 55, luk: 35,
    atk: 110, def: 65, matk: 0, hit: 110, flee: 115, aspd: 148, spd: 105, maxHp: 3200, maxSp: 350
  },
  'Bard': {
    level: 40, jobLevel: 1, str: 25, agi: 40, vit: 35, int: 40, dex: 50, luk: 20,
    atk: 95, def: 60, matk: 0, hit: 105, flee: 100, aspd: 145, spd: 105, maxHp: 3000, maxSp: 480
  },
  'Dancer': {
    level: 40, jobLevel: 1, str: 20, agi: 50, vit: 30, int: 45, dex: 40, luk: 25,
    atk: 88, def: 55, matk: 0, hit: 95, flee: 120, aspd: 152, spd: 105, maxHp: 2800, maxSp: 520
  },
  'Priest': {
    level: 40, jobLevel: 1, str: 15, agi: 25, vit: 35, int: 50, dex: 40, luk: 25,
    atk: 80, def: 75, matk: 0, hit: 100, flee: 95, aspd: 135, spd: 100, maxHp: 3500, maxSp: 750
  },
  'Monk': {
    level: 40, jobLevel: 1, str: 55, agi: 45, vit: 40, int: 25, dex: 35, luk: 20,
    atk: 150, def: 65, matk: 0, hit: 95, flee: 110, aspd: 150, spd: 105, maxHp: 3900, maxSp: 420
  },
  'Blacksmith': {
    level: 40, jobLevel: 1, str: 55, agi: 30, vit: 45, int: 10, dex: 40, luk: 25,
    atk: 180, def: 110, matk: 0, hit: 105, flee: 80, aspd: 140, spd: 100, maxHp: 4500, maxSp: 250
  },
  'Alchemist': {
    level: 40, jobLevel: 1, str: 40, agi: 25, vit: 45, int: 40, dex: 40, luk: 30,
    atk: 140, def: 90, matk: 0, hit: 100, flee: 75, aspd: 132, spd: 100, maxHp: 4100, maxSp: 450
  },
  'Assassin': {
    level: 40, jobLevel: 1, str: 50, agi: 55, vit: 30, int: 10, dex: 35, luk: 30,
    atk: 160, def: 70, matk: 0, hit: 115, flee: 140, aspd: 155, spd: 110, maxHp: 3800, maxSp: 280
  },
  'Rogue': {
    level: 40, jobLevel: 1, str: 45, agi: 50, vit: 35, int: 15, dex: 50, luk: 25,
    atk: 145, def: 80, matk: 0, hit: 120, flee: 130, aspd: 150, spd: 105, maxHp: 3600, maxSp: 310
  },
  'Lord Knight': {
    level: 99, jobLevel: 70, str: 85, agi: 65, vit: 80, int: 20, dex: 50, luk: 30,
    atk: 340, def: 180, matk: 0, hit: 240, flee: 195, aspd: 168, spd: 100, maxHp: 18400, maxSp: 420
  },
  'Paladin': {
    level: 99, jobLevel: 70, str: 75, agi: 55, vit: 99, int: 45, dex: 45, luk: 35,
    atk: 290, def: 240, matk: 0, hit: 220, flee: 170, aspd: 162, spd: 100, maxHp: 21500, maxSp: 680
  },
  'High Wizard': {
    level: 99, jobLevel: 70, str: 15, agi: 35, vit: 45, int: 99, dex: 75, luk: 25,
    atk: 180, def: 120, matk: 0, hit: 220, flee: 185, aspd: 152, spd: 100, maxHp: 9800, maxSp: 2450
  },
  'Professor': {
    level: 99, jobLevel: 70, str: 35, agi: 55, vit: 55, int: 90, dex: 85, luk: 30,
    atk: 240, def: 140, matk: 0, hit: 260, flee: 210, aspd: 165, spd: 100, maxHp: 10500, maxSp: 1850
  },
  'Sniper': {
    level: 99, jobLevel: 70, str: 30, agi: 90, vit: 40, int: 35, dex: 99, luk: 40,
    atk: 360, def: 110, matk: 0, hit: 299, flee: 260, aspd: 178, spd: 105, maxHp: 12500, maxSp: 720
  },
  'Clown': {
    level: 99, jobLevel: 70, str: 45, agi: 80, vit: 60, int: 70, dex: 90, luk: 30,
    atk: 280, def: 140, matk: 0, hit: 270, flee: 240, aspd: 175, spd: 100, maxHp: 13200, maxSp: 1100
  },
  'Gypsy': {
    level: 99, jobLevel: 70, str: 35, agi: 95, vit: 50, int: 80, dex: 80, luk: 35,
    atk: 240, def: 130, matk: 0, hit: 250, flee: 280, aspd: 182, spd: 105, maxHp: 12200, maxSp: 1400
  },
  'High Priest': {
    level: 99, jobLevel: 70, str: 20, agi: 40, vit: 75, int: 99, dex: 70, luk: 15,
    atk: 145, def: 150, matk: 0, hit: 210, flee: 175, aspd: 154, spd: 100, maxHp: 11200, maxSp: 1980
  },
  'Champion': {
    level: 99, jobLevel: 70, str: 99, agi: 85, vit: 65, int: 45, dex: 60, luk: 25,
    atk: 450, def: 130, matk: 0, hit: 240, flee: 250, aspd: 180, spd: 105, maxHp: 16500, maxSp: 850
  },
  'Whitesmith': {
    level: 99, jobLevel: 70, str: 99, agi: 60, vit: 70, int: 20, dex: 70, luk: 40,
    atk: 420, def: 190, matk: 0, hit: 250, flee: 210, aspd: 170, spd: 100, maxHp: 21000, maxSp: 650
  },
  'Creator': {
    level: 99, jobLevel: 70, str: 80, agi: 50, vit: 80, int: 80, dex: 70, luk: 40,
    atk: 360, def: 170, matk: 0, hit: 240, flee: 180, aspd: 160, spd: 100, maxHp: 18500, maxSp: 1200
  },
  'Assassin Cross': {
    level: 99, jobLevel: 70, str: 90, agi: 95, vit: 45, int: 15, dex: 45, luk: 40,
    atk: 395, def: 95, matk: 0, hit: 235, flee: 285, aspd: 182, spd: 110, maxHp: 14200, maxSp: 510
  },
  'Stalker': {
    level: 99, jobLevel: 70, str: 75, agi: 99, vit: 55, int: 35, dex: 85, luk: 35,
    atk: 310, def: 140, matk: 0, hit: 280, flee: 290, aspd: 180, spd: 110, maxHp: 15400, maxSp: 680
  },
};

const defaultSkills: Record<JobClass, Skill[]> = {
  'Novice': [
    { id: 'first_aid', name: 'First Aid', key: 'Q', desc: 'Restaura una pequeña cantidad de HP rápidamente (+15 HP por nivel).', spCost: 2, cooldown: 1000, range: 2.0, lastCastTime: 0, color: '#10b981', castTime: 0, level: 1, maxLevel: 1 },
    { id: 'basic_skill', name: 'Basic Skill', key: 'W', desc: 'Habilidad básica de aventurero. Desbloquea Play Dead a nivel 7.', spCost: 0, cooldown: 0, range: 0, lastCastTime: 0, color: '#f59e0b', level: 1, maxLevel: 9 },
    { id: 'play_dead', name: 'Play Dead', key: 'E', desc: 'Te haces el muerto para recuperar HP instantáneamente pero eres inmóvil (Costo: 5 SP).', spCost: 5, cooldown: 5000, range: 1.0, lastCastTime: 0, color: '#64748b', level: 0, maxLevel: 1 }
  ],
  'Swordsman': [
    { id: 'bash', name: 'Bash', key: 'Q', desc: 'Ataque fuerte que inflige 150% + 25% por nivel de daño físico. Chance de aturdir.', spCost: 8, cooldown: 800, range: 2.2, lastCastTime: 0, color: '#f59e0b', level: 1, maxLevel: 10 },
    { id: 'magnum_break', name: 'Magnum Break', key: 'W', desc: 'Expulsa una ráfaga ígnea alrededor del héroe haciendo daño de fuego en área (+120% + 20% por nivel).', spCost: 15, cooldown: 2000, range: 3.5, lastCastTime: 0, color: '#ea580c', level: 0, maxLevel: 10 }
  ],
  'Acolyte': [
    { id: 'heal', name: 'Heal', key: 'Q', desc: 'Luz sanadora. Restaura HP basado en tu INT y el nivel del hechizo.', spCost: 12, cooldown: 500, range: 8.0, lastCastTime: 0, color: '#10b981', castTime: 300, level: 1, maxLevel: 10 },
    { id: 'holy_light', name: 'Holy Light', key: 'W', desc: 'Rayo celestial de daño mágico sagrado.', spCost: 8, cooldown: 900, range: 7.5, lastCastTime: 0, color: '#38bdf8', castTime: 800, level: 1, maxLevel: 10 }
  ],
  'Thief': [
    { id: 'double_attack', name: 'Double Attack', key: 'Q', desc: 'Habilidad pasiva. Otorga una probabilidad del (Nivel * 5)% de golpear 2 veces.', spCost: 0, cooldown: 0, range: 2.0, lastCastTime: 0, color: '#a855f7', level: 1, maxLevel: 10 },
    { id: 'stealth_attack', name: 'Poison Dart', key: 'W', desc: 'Lanza un dardo ponzoñoso que daña al objetivo e inflige daño persistente por veneno.', spCost: 10, cooldown: 1200, range: 6.0, lastCastTime: 0, color: '#15803d', level: 0, maxLevel: 10 }
  ],
  'Archer': [
    { id: 'double_strafe', name: 'Double Strafe', key: 'Q', desc: 'Dispara 2 flechas letales que causan daño físico de largo alcance acumulado.', spCost: 10, cooldown: 800, range: 9.0, lastCastTime: 0, color: '#14b8a6', level: 1, maxLevel: 10 },
    { id: 'arrow_shower', name: 'Arrow Shower', key: 'W', desc: 'Cae una lluvia de flechas en área empujando y dañando a los enemigos.', spCost: 15, cooldown: 1800, range: 8.0, lastCastTime: 0, color: '#0284c7', level: 0, maxLevel: 10 }
  ],
  'Mage': [
    { id: 'fire_bolt', name: 'Fire Bolt', key: 'Q', desc: 'Flechas de fuego que infligen daño mágico (150% + 20% por nivel).', spCost: 12, cooldown: 1200, range: 8.5, lastCastTime: 0, color: '#f97316', castTime: 1200, level: 1, maxLevel: 10 },
    { id: 'cold_bolt', name: 'Cold Bolt', key: 'W', desc: 'Flechas de hielo que ralentizan al enemigo.', spCost: 12, cooldown: 1200, range: 8.5, lastCastTime: 0, color: '#38bdf8', castTime: 1200, level: 0, maxLevel: 10 }
  ],
  'Merchant': [
    { id: 'mammonite', name: 'Mammonite', key: 'Q', desc: 'Gasta 100z para infringir 600% de daño físico masivo.', spCost: 5, cooldown: 500, range: 2.0, lastCastTime: 0, color: '#facc15', level: 1, maxLevel: 10 },
    { id: 'cart_revolution', name: 'Cart Revolution', key: 'W', desc: 'Gira tu carrito de compras golpeando a todos a tu alrededor.', spCost: 12, cooldown: 1200, range: 3.5, lastCastTime: 0, color: '#92400e', level: 0, maxLevel: 10 }
  ],
  'Knight': [
    { id: 'bash', name: 'Bash', key: 'Q', desc: 'Ataque fuerte que inflige 400% de daño físico.', spCost: 15, cooldown: 800, range: 2.2, lastCastTime: 0, color: '#f59e0b', level: 10, maxLevel: 10 },
    { id: 'bowling_bash', name: 'Bowling Bash', key: 'W', desc: 'Ataca a un objetivo empujándolo contra los demás.', spCost: 28, cooldown: 1500, range: 2.5, lastCastTime: 0, color: '#dc2626', castTime: 650, level: 1, maxLevel: 10 }
  ],
  'Crusader': [
    { id: 'holy_cross', name: 'Holy Cross', key: 'Q', desc: 'Golpe sagrado dual que inflige daño masivo de luz.', spCost: 20, cooldown: 600, range: 2.5, lastCastTime: 0, color: '#facc15', level: 1, maxLevel: 10 },
    { id: 'grand_cross', name: 'Grand Cross', key: 'W', desc: 'Invoca una cruz de luz divina que daña a todos los enemigos cercanos.', spCost: 40, cooldown: 3000, range: 4.0, lastCastTime: 0, color: '#ffffff', castTime: 1500, level: 1, maxLevel: 10 }
  ],
  'Wizard': [
    { id: 'fire_bolt', name: 'Fire Bolt', key: 'Q', desc: 'Flechas de fuego mágicas de alto nivel.', spCost: 25, cooldown: 1200, range: 8.5, lastCastTime: 0, color: '#f97316', castTime: 1500, level: 10, maxLevel: 10 },
    { id: 'meteor_storm', name: 'Meteor Storm', key: 'W', desc: 'Lluvia de meteoros masiva que daña y aturde en área.', spCost: 65, cooldown: 4500, range: 10.0, lastCastTime: 0, color: '#ef4444', castTime: 3500, level: 1, maxLevel: 10 }
  ],
  'Sage': [
    { id: 'earth_spike', name: 'Earth Spike', key: 'Q', desc: 'Invoca púas de roca desde el suelo para empalar al enemigo.', spCost: 18, cooldown: 1000, range: 8.0, lastCastTime: 0, color: '#78350f', level: 1, maxLevel: 10 },
    { id: 'heaven_drive', name: 'Heaven Drive', key: 'W', desc: 'Sacude la tierra en un área amplia infligiendo daño de tierra.', spCost: 35, cooldown: 2500, range: 6.0, lastCastTime: 0, color: '#451a03', castTime: 2000, level: 1, maxLevel: 10 }
  ],
  'Hunter': [
    { id: 'double_strafe', name: 'Double Strafe', key: 'Q', desc: 'Disparo rápido de dos flechas.', spCost: 15, cooldown: 700, range: 9.0, lastCastTime: 0, color: '#14b8a6', level: 10, maxLevel: 10 },
    { id: 'claymore_trap', name: 'Claymore Trap', key: 'W', desc: 'Coloca una mina terrestre explosiva que inflige daño de fuego.', spCost: 22, cooldown: 3000, range: 3.5, lastCastTime: 0, color: '#f97316', level: 1, maxLevel: 10 }
  ],
  'Bard': [
    { id: 'musical_strike', name: 'Musical Strike', key: 'Q', desc: 'Dispara una nota musical ruidosa que daña al enemigo.', spCost: 12, cooldown: 600, range: 8.0, lastCastTime: 0, color: '#3b82f6', level: 1, maxLevel: 10 },
    { id: 'arrow_vulcan', name: 'Arrow Vulcan', key: 'W', desc: 'Dispara múltiples flechas en una ráfaga rítmica.', spCost: 35, cooldown: 1500, range: 9.0, lastCastTime: 0, color: '#0ea5e9', castTime: 1000, level: 1, maxLevel: 10 }
  ],
  'Dancer': [
    { id: 'sling_arrow', name: 'Sling Arrow', key: 'Q', desc: 'Dispara una flecha con un movimiento de baile grácil.', spCost: 12, cooldown: 600, range: 8.0, lastCastTime: 0, color: '#ec4899', level: 1, maxLevel: 10 },
    { id: 'arrow_vulcan', name: 'Arrow Vulcan', key: 'W', desc: 'Múltiples flechas en una danza mortal.', spCost: 35, cooldown: 1500, range: 9.0, lastCastTime: 0, color: '#d946ef', castTime: 1000, level: 1, maxLevel: 10 }
  ],
  'Priest': [
    { id: 'heal', name: 'Heal', key: 'Q', desc: 'Luz sanadora potente.', spCost: 25, cooldown: 500, range: 8.0, lastCastTime: 0, color: '#10b981', level: 10, maxLevel: 10 },
    { id: 'magnus_exorcismus', name: 'Magnus Exorcismus', key: 'W', desc: 'Crea una cruz de luz sagrada que daña masivamente a demonios y muertos vivientes.', spCost: 55, cooldown: 5000, range: 8.0, lastCastTime: 0, color: '#7dd3fc', castTime: 4000, level: 1, maxLevel: 10 }
  ],
  'Monk': [
    { id: 'triple_attack', name: 'Triple Attack', key: 'Q', desc: 'Probabilidad de realizar 3 golpes rápidos automáticamente.', spCost: 0, cooldown: 0, range: 2.0, lastCastTime: 0, color: '#fbbf24', level: 1, maxLevel: 10 },
    { id: 'guillotine_fist', name: 'Asura Strike', key: 'W', desc: 'Gasta todo el SP para asestar el golpe definitivo rúnico.', spCost: 100, cooldown: 15000, range: 2.0, lastCastTime: 0, color: '#000000', castTime: 2000, level: 1, maxLevel: 10 }
  ],
  'Blacksmith': [
    { id: 'mammonite', name: 'Mammonite', key: 'Q', desc: 'Golpe monetario definitivo.', spCost: 10, cooldown: 400, range: 2.0, lastCastTime: 0, color: '#facc15', level: 10, maxLevel: 10 },
    { id: 'cart_termination', name: 'Cart Termination', key: 'W', desc: 'Arremete con toda la fuerza de tu carrito para aturdir y destrozar al enemigo.', spCost: 35, cooldown: 2000, range: 2.5, lastCastTime: 0, color: '#7f1d1d', level: 1, maxLevel: 10 }
  ],
  'Alchemist': [
    { id: 'acid_terror', name: 'Acid Terror', key: 'Q', desc: 'Lanza una botella de ácido corrosivo que daña y rompe armaduras.', spCost: 15, cooldown: 1000, range: 7.0, lastCastTime: 0, color: '#65a30d', level: 1, maxLevel: 10 },
    { id: 'bomb', name: 'Bomb', key: 'W', desc: 'Lanza una granada incendiaria que quema a los enemigos.', spCost: 15, cooldown: 1500, range: 7.0, lastCastTime: 0, color: '#ea580c', level: 1, maxLevel: 10 }
  ],
  'Assassin': [
    { id: 'sonic_blow', name: 'Sonic Blow', key: 'Q', desc: '8 golpes rápidos con Katar.', spCost: 30, cooldown: 1200, range: 2.0, lastCastTime: 0, color: '#8b5cf6', level: 1, maxLevel: 10 },
    { id: 'venom_splasher', name: 'Venom Splasher', key: 'W', desc: 'Detona veneno en el objetivo tras unos segundos.', spCost: 24, cooldown: 4000, range: 2.5, lastCastTime: 0, color: '#166534', level: 1, maxLevel: 10 }
  ],
  'Rogue': [
    { id: 'back_stab', name: 'Back Stab', key: 'Q', desc: 'Golpe traicionero por la espalda que inflige daño masivo.', spCost: 16, cooldown: 800, range: 2.0, lastCastTime: 0, color: '#4c1d95', level: 1, maxLevel: 10 },
    { id: 'strip_shield', name: 'Strip Shield', key: 'W', desc: 'Intenta desarmar el escudo del enemigo reduciendo su defensa.', spCost: 20, cooldown: 2500, range: 2.0, lastCastTime: 0, color: '#64748b', level: 1, maxLevel: 5 }
  ],
  'Lord Knight': [
    { id: 'bash', name: 'Bash', key: 'Q', desc: 'Ataque fuerte que inflige 400% de daño físico y tiene probabilidad de aturdir.', spCost: 15, cooldown: 800, range: 2.2, lastCastTime: 0, color: '#f59e0b', castTime: 0, level: 10, maxLevel: 10 },
    { id: 'bowling_bash', name: 'Bowling Bash', key: 'W', desc: 'Ataca a un objetivo empujándolo contra los demás infligiendo daño masivo de área.', spCost: 28, cooldown: 1500, range: 2.5, lastCastTime: 0, color: '#dc2626', castTime: 650, level: 1, maxLevel: 10 },
  ],
  'Paladin': [
    { id: 'holy_cross', name: 'Holy Cross', key: 'Q', desc: 'Golpe sagrado dual definitivo.', spCost: 20, cooldown: 500, range: 2.5, lastCastTime: 0, color: '#facc15', level: 10, maxLevel: 10 },
    { id: 'shield_boomerang', name: 'Shield Boomerang', key: 'W', desc: 'Lanza tu escudo como proyectil para dañar desde lejos.', spCost: 12, cooldown: 1000, range: 9.0, lastCastTime: 0, color: '#94a3b8', level: 1, maxLevel: 5 }
  ],
  'High Wizard': [
    { id: 'fire_bolt', name: 'Fire Bolt', key: 'Q', desc: 'Flechas de fuego mágicas definitivas.', spCost: 30, cooldown: 1000, range: 9.0, lastCastTime: 0, color: '#f97316', level: 10, maxLevel: 10 },
    { id: 'chain_lightning', name: 'Chain Lightning', key: 'W', desc: 'Lanza un rayo que salta entre enemigos electrocutándolos.', spCost: 45, cooldown: 3000, range: 10.0, lastCastTime: 0, color: '#6366f1', castTime: 2000, level: 1, maxLevel: 10 }
  ],
  'Professor': [
    { id: 'heaven_drive', name: 'Heaven Drive', key: 'Q', desc: 'Sacudida de tierra definitiva.', spCost: 35, cooldown: 2000, range: 7.0, lastCastTime: 0, color: '#451a03', level: 10, maxLevel: 10 },
    { id: 'double_bolt', name: 'Double Bolt', key: 'W', desc: 'Lanza dos flechas mágicas en lugar de una.', spCost: 0, cooldown: 0, range: 0, lastCastTime: 0, color: '#8b5cf6', level: 1, maxLevel: 10 }
  ],
  'Sniper': [
    { id: 'double_strafe', name: 'Double Strafe', key: 'Q', desc: 'Dispara rápidamente 2 flechas en simultáneo infligiendo daño de proyectil acumulativo.', spCost: 12, cooldown: 700, range: 9.0, lastCastTime: 0, color: '#14b8a6', castTime: 0, level: 10, maxLevel: 10 },
    { id: 'falcon_strike', name: 'Blitz Beat', key: 'W', desc: 'Envía tu Halcón entrenado a atacar ferozmente en ráfaga e ignora la defensa física.', spCost: 30, cooldown: 2000, range: 10.0, lastCastTime: 0, color: '#3b82f6', castTime: 1000, level: 1, maxLevel: 10 },
  ],
  'Clown': [
    { id: 'musical_strike', name: 'Musical Strike', key: 'Q', desc: 'Ataque musical potenciado.', spCost: 15, cooldown: 500, range: 9.0, lastCastTime: 0, color: '#3b82f6', level: 10, maxLevel: 10 },
    { id: 'vulcan_arm', name: 'Arrow Vulcan XL', key: 'W', desc: 'Ráfaga de flechas super sónica.', spCost: 45, cooldown: 1200, range: 10.0, lastCastTime: 0, color: '#0ea5e9', level: 1, maxLevel: 10 }
  ],
  'Gypsy': [
    { id: 'sling_arrow', name: 'Sling Arrow', key: 'Q', desc: 'Ataque de baile potenciado.', spCost: 15, cooldown: 500, range: 9.0, lastCastTime: 0, color: '#ec4899', level: 10, maxLevel: 10 },
    { id: 'vulcan_arm', name: 'Arrow Vulcan XL', key: 'W', desc: 'Danza de flechas mortal definitiva.', spCost: 45, cooldown: 1200, range: 10.0, lastCastTime: 0, color: '#d946ef', level: 1, maxLevel: 10 }
  ],
  'High Priest': [
    { id: 'heal', name: 'Heal', key: 'Q', desc: 'Restaura una cantidad de HP basada en tu INT al objetivo o a ti mismo.', spCost: 20, cooldown: 500, range: 8.0, lastCastTime: 0, color: '#10b981', castTime: 400, level: 10, maxLevel: 10 },
    { id: 'holy_light', name: 'Holy Light', key: 'W', desc: 'Invoca poder sagrado directo para infligir 150% de daño mágico sagrado.', spCost: 12, cooldown: 900, range: 7.5, lastCastTime: 0, color: '#38bdf8', castTime: 1200, level: 10, maxLevel: 10 },
  ],
  'Champion': [
    { id: 'guillotine_fist', name: 'Asura Strike High', key: 'Q', desc: 'El golpe de dios definitivo.', spCost: 100, cooldown: 10000, range: 2.0, lastCastTime: 0, color: '#000000', level: 10, maxLevel: 10 },
    { id: 'steel_body', name: 'Steel Body', key: 'W', desc: 'Convierte tu cuerpo en acero aumentando defensa al máximo pero reduciendo velocidad.', spCost: 50, cooldown: 60000, range: 0, lastCastTime: 0, color: '#94a3b8', level: 1, maxLevel: 5 }
  ],
  'Whitesmith': [
    { id: 'cart_termination', name: 'Cart Termination', key: 'Q', desc: 'Golpe masivo con el carrito.', spCost: 35, cooldown: 1800, range: 2.5, lastCastTime: 0, color: '#7f1d1d', level: 10, maxLevel: 10 },
    { id: 'maximum_power_thrust', name: 'Max Power Thrust', key: 'W', desc: 'Aumenta enormemente el ATK por un tiempo pero arriesga romper el arma.', spCost: 50, cooldown: 60000, range: 0, lastCastTime: 0, color: '#ea580c', level: 1, maxLevel: 5 }
  ],
  'Creator': [
    { id: 'acid_demonstration', name: 'Acid Demo', key: 'Q', desc: 'Lanza fuego y ácido en un solo golpe explosivo devastador.', spCost: 40, cooldown: 1000, range: 8.0, lastCastTime: 0, color: '#ef4444', level: 1, maxLevel: 10 },
    { id: 'potion_pitcher', name: 'Potion Pitcher', key: 'W', desc: 'Lanza una poción a un aliado para curarlo a distancia.', spCost: 10, cooldown: 500, range: 8.0, lastCastTime: 0, color: '#10b981', level: 1, maxLevel: 10 }
  ],
  'Assassin Cross': [
    { id: 'sonic_blow', name: 'Sonic Blow', key: 'Q', desc: 'Desata una tormenta de 8 golpes ultra rápidos con Katar de un solo golpe.', spCost: 34, cooldown: 1200, range: 2.0, lastCastTime: 0, color: '#8b5cf6', castTime: 0, level: 1, maxLevel: 10 },
    { id: 'grimtooth', name: 'Grimtooth', key: 'W', desc: 'Ataca subterráneamente desde las sombras infligiendo daño a distancia en área.', spCost: 18, cooldown: 1000, range: 6.0, lastCastTime: 0, color: '#ec4899', castTime: 0, level: 1, maxLevel: 10 },
  ],
  'Stalker': [
    { id: 'back_stab', name: 'Back Stab High', key: 'Q', desc: 'Golpe traicionero potenciado.', spCost: 20, cooldown: 500, range: 2.0, lastCastTime: 0, color: '#4c1d95', level: 10, maxLevel: 10 },
    { id: 'chase_walk', name: 'Chase Walk', key: 'W', desc: 'Te vuelves invisible permanentemente mientras caminas.', spCost: 5, cooldown: 1000, range: 0, lastCastTime: 0, color: '#1e293b', level: 1, maxLevel: 5 }
  ],
};

export const useGameStore = create<GameStoreState>((set, get) => ({
  jobClass: 'Novice',
  stats: defaultStats['Novice'],
  baseStats: defaultStats['Novice'],
  currentHp: defaultStats['Novice'].maxHp,
  currentSp: defaultStats['Novice'].maxSp,
  playerBaseExp: 0,
  playerBaseMaxExp: 100,
  playerJobExp: 0,
  playerJobMaxExp: 80,
  zeny: 500,
  headgear: 'none',

  quests: ALL_QUESTS.map(q => ({ ...q, state: q.requiredQuestId ? 'locked' : 'available' })),
  activeQuests: [],
  completedQuests: [],
  questProgress: {},
  questSurvivalTimers: {},
  currentMainQuest: null,

  shopOpen: false,
  shopItems: SHOP_ITEMS,

  entities: [],

  discoveredLandmarks: [],
  achievements: ALL_ACHIEVEMENTS.map(a => ({ ...a, unlocked: false })),
  showQuestTracker: true,

  inventory: [
    { id: 'red_potion', name: 'Red Potion', quantity: 15, type: 'consumable' },
    { id: 'jellopy', name: 'Jellopy', quantity: 10, type: 'material' },
    { id: 'sticky_mucus', name: 'Sticky Mucus', quantity: 3, type: 'material' }
  ],
  equippedItems: {},

  playerStatus: 'normal',
  activeCast: null,
  battleMode: false,
  autoBattle: false,
  autoPickupEnabled: true,
  showCombatLog: true,
  playerTitle: '',

  targetEntityId: null,
  targetHp: 0,
  targetMaxHp: 0,
  targetName: 'Ninguno',
  targetLevel: 0,
  targetEntityType: null,
  playerAttackPulse: 0,

  npcDialogue: null,
  activeBuffs: [],
  activeStatusEffects: [],

  combatLogs: [
    { id: '1', text: '¡Bienvenido a Ragnarok Mobile Input Engine!', type: 'system', timestamp: '00:28' },
    { id: '2', text: 'Usa TAPS en pantalla para moverte y atacar monstruos, o activa JOYSTICK.', type: 'system', timestamp: '00:28' },
    { id: '3', text: 'El búfer de entrada (Input Buffer) encolará tus comandos para una respuesta en tiempo real.', type: 'system', timestamp: '00:28' },
  ],

  lootNotifications: [],

  skills: defaultSkills['Novice'],
  skillPoints: 0,

  currentMapName: 'Prontera — Plaza del Alba',
  currentMapId: 'prontera_city',
  currentRegionId: 'region_central',
  mapTransitionBanner: null,
  isJoystickEnabled: false,
  isMultitouchSupported: true,
  activeInputMode: 'touch_target',
  highContrastMode: false,

  setCurrentMapName: (name) => set({ currentMapName: name }),
  setCurrentMapId: (mapId) => set({ currentMapId: mapId }),
  setCurrentRegionId: (regionId) => set({ currentRegionId: regionId }),
  showMapTransitionBanner: (mapName) => set({ mapTransitionBanner: mapName }),
  hideMapTransitionBanner: () => set({ mapTransitionBanner: null }),

  toggleHighContrastMode: () => {
    set((state) => ({ highContrastMode: !state.highContrastMode }));
    const isEnabled = get().highContrastMode;
    get().addCombatLog(
      isEnabled ? 'Modo de alto contraste activado.' : 'Modo de alto contraste desactivado.',
      'system',
    );
    get().saveGame();
  },
  
  addZeny: (amount) => {
    set((state) => ({ zeny: state.zeny + amount }));
  },

  spendZeny: (amount) => {
    const state = get();
    if (state.zeny < amount) {
      state.addCombatLog(`❌ No tienes suficiente Zeny. Necesitas ${amount} Zeny.`, 'system');
      return false;
    }
    set({ zeny: state.zeny - amount });
    return true;
  },

  openShop: () => {
    set((state) => ({ shopOpen: true, shopItems: SHOP_ITEMS }));
  },

  closeShop: () => {
    set({ shopOpen: false });
  },

  buyShopItem: (itemId) => {
    const state = get();
    const shopItem = state.shopItems.find(i => i.itemId === itemId);
    if (!shopItem) return;
    if (state.zeny < shopItem.price) {
      state.addCombatLog(`❌ No tienes suficiente Zeny para comprar ${shopItem.name}. Costo: ${shopItem.price} Zeny.`, 'system');
      return;
    }
    if (shopItem.type === 'equipment' && shopItem.levelReq && state.stats.level < shopItem.levelReq) {
      state.addCombatLog(`❌ Necesitas nivel ${shopItem.levelReq} para equipar ${shopItem.name}.`, 'system');
      return;
    }
    set({ zeny: state.zeny - shopItem.price });
    const invItem: InventoryItem = {
      id: shopItem.itemId,
      name: shopItem.name,
      quantity: 1,
      type: shopItem.type,
      slot: shopItem.slot,
      allowedJobs: shopItem.allowedJobs,
      stats: shopItem.stats ? { ...shopItem.stats } : undefined,
    };
    state.addItem(invItem);
    state.addLootNotification([`🛒 ${shopItem.name}`, `-${shopItem.price} Zeny`]);
    state.saveGame();
  },

  sellItem: (itemId: string, quantity?: number) => {
    const state = get();
    const item = state.inventory.find(i => i.id === itemId);
    if (!item || item.quantity < (quantity || 1)) {
      state.addCombatLog(`❌ No tienes suficiente ${item?.name || itemId} para vender.`, 'system');
      return;
    }
    const qty = quantity || 1;
    const shopEntry = SHOP_ITEMS.find(s => s.itemId === itemId);
    const pricePerUnit = shopEntry ? Math.floor(shopEntry.price * 0.5) : Math.floor(item.type === 'equipment' ? 100 : 5);
    const totalPrice = pricePerUnit * qty;
    const updatedInventory = state.inventory.map(i =>
      i.id === itemId ? { ...i, quantity: i.quantity - qty } : i
    ).filter(i => i.quantity > 0);
    set({ inventory: updatedInventory, zeny: state.zeny + totalPrice });
    state.addLootNotification([`💰 ${qty}x ${item.name}`, `+${totalPrice} Zeny`]);
    state.saveGame();
  },

  acceptQuest: (questId) => {
    const state = get();
    const quest = state.quests.find(q => q.id === questId);
    if (!quest || quest.state !== 'available') return;
    if (quest.requiredLevel && state.stats.level < quest.requiredLevel) {
      state.addCombatLog(`❌ Necesitas nivel ${quest.requiredLevel} para aceptar esta misión.`, 'system');
      return;
    }
    const progress = quest.objectives.map(obj => ({ ...obj, current: 0 }));
    set((s) => ({
      quests: s.quests.map(q => q.id === questId ? { ...q, state: 'active' as const } : q),
      activeQuests: [...s.activeQuests, questId],
      questProgress: { ...s.questProgress, [questId]: progress },
      currentMainQuest: quest.isMainQuest ? questId : s.currentMainQuest,
    }));
    state.addCombatLog(`📜 Misión aceptada: ${quest.name}`, 'system');
    if (quest.isMainQuest) {
      gameAudio.playSkillCast();
    }
    state.saveGame();
  },

  abandonQuest: (questId) => {
    const state = get();
    const quest = state.quests.find(q => q.id === questId);
    if (!quest || !state.activeQuests.includes(questId)) {
      state.addCombatLog('Misión no encontrada o no está activa.', 'system');
      return;
    }
    if (quest.isMainQuest) {
      state.addCombatLog('No puedes abandonar una misión principal.', 'system');
      return;
    }
    set(s => {
      const newQuestProgress = { ...s.questProgress };
      delete newQuestProgress[questId];
      return {
        quests: s.quests.map(q => q.id === questId ? { ...q, state: 'available' as const } : q),
        activeQuests: s.activeQuests.filter(id => id !== questId),
        questProgress: newQuestProgress,
      };
    });
    state.addCombatLog(`Misión abandonada: ${quest.name}`, 'system');
    state.saveGame();
  },

  updateQuestProgress: (questId, objectiveIndex, amount) => {
    const state = get();
    const progress = state.questProgress[questId];
    if (!progress) return;
    const updated = [...progress];
    updated[objectiveIndex] = { ...updated[objectiveIndex], current: Math.min(updated[objectiveIndex].current + amount, updated[objectiveIndex].count) };
    set((s) => ({ questProgress: { ...s.questProgress, [questId]: updated } }));
    const allDone = updated.every(obj => obj.current >= obj.count);
    if (allDone) {
      state.completeQuest(questId);
    }
  },

  completeQuest: (questId) => {
    const state = get();
    const quest = state.quests.find(q => q.id === questId);
    if (!quest) return;
    set((s) => ({
      quests: s.quests.map(q => q.id === questId ? { ...q, state: 'completed' as const } : q),
      activeQuests: s.activeQuests.filter(id => id !== questId),
      completedQuests: [...s.completedQuests, questId],
      zeny: s.zeny + quest.rewards.zeny,
    }));
    state.addExp(quest.rewards.baseExp, quest.rewards.jobExp);
    state.addLootNotification([`✨ ${quest.name}`, `+${quest.rewards.zeny} Zeny`]);
    if (quest.rewards.items) {
      quest.rewards.items.forEach(item => {
        const shopEntry = SHOP_ITEMS.find(s => s.itemId === item.itemId);
        const type = shopEntry ? shopEntry.type : 'material';
        state.addItem({ id: item.itemId, name: item.name, quantity: item.quantity, type });
      });
    }
    if (quest.nextQuestId) {
      set((s) => ({
        quests: s.quests.map(q => q.id === quest.nextQuestId ? { ...q, state: 'available' as const } : q),
      }));
      state.addCombatLog(`🔓 Nueva misión disponible: ${quest.nextQuestId}`, 'system');
    }
    if (quest.isMainQuest) {
      gameAudio.playLevelUp();
    } else {
      gameAudio.playHeal();
    }
    state.checkAchievements();
    state.saveGame();
  },

  getActiveQuest: () => {
    const state = get();
    if (state.currentMainQuest) {
      return state.quests.find(q => q.id === state.currentMainQuest) || null;
    }
    if (state.activeQuests.length > 0) {
      return state.quests.find(q => q.id === state.activeQuests[0]) || null;
    }
    return null;
  },

  discoverLandmark: (landmarkId) => {
    const state = get();
    if (state.discoveredLandmarks.includes(landmarkId)) return;
    set((s) => ({ discoveredLandmarks: [...s.discoveredLandmarks, landmarkId] }));
    state.addCombatLog(`📍 ¡Descubriste un nuevo lugar!`, 'system');
    state.addExp(25, 0);
    gameAudio.playItemPickup();
    state.checkAchievements();
    state.saveGame();
  },

  checkAchievements: () => {
    const state = get();
    const updated = state.achievements.map(a => {
      if (a.unlocked) return a;
      let unlock = false;
      if (a.id === 'first_steps') unlock = state.completedQuests.includes('epic_01');
      if (a.id === 'poring_hunter') {
        const killCount = Object.values(state.questProgress).flat().filter(o => o.mobType === 'poring').reduce((s, o) => s + o.current, 0);
        unlock = killCount >= 15;
      }
      if (a.id === 'job_change') unlock = state.jobClass !== 'Novice';
      if (a.id === 'mill_savior') unlock = state.completedQuests.includes('epic_06');
      if (a.id === 'explorer') unlock = state.discoveredLandmarks.length >= 5;
      if (a.id === 'completionist') unlock = state.completedQuests.filter(id => !state.quests.find(q => q.id === id)?.isMainQuest).length >= 5;
      if (a.id === 'apprentice_hero') unlock = state.stats.level >= 10;
      if (a.id === 'warrior') unlock = state.stats.level >= 15;
      // Bosque Umbrío achievements
      if (a.id === 'bosque_entrance') unlock = state.completedQuests.includes('epic_08');
      if (a.id === 'bosque_spirit') unlock = state.completedQuests.includes('epic_09');
      if (a.id === 'bosque_ruins') unlock = state.completedQuests.includes('epic_10');
      if (a.id === 'bosque_cleanser') unlock = state.completedQuests.includes('epic_11');
      if (a.id === 'drainliar_hunter') {
        const killCount = Object.values(state.questProgress).flat().filter(o => o.mobType === 'drainliar').reduce((s, o) => s + o.current, 0);
        unlock = killCount >= 30;
      }
      if (a.id === 'spore_hunter') {
        const killCount = Object.values(state.questProgress).flat().filter(o => o.mobType === 'spore').reduce((s, o) => s + o.current, 0);
        unlock = killCount >= 30;
      }
      if (a.id === 'wisp_hunter') {
        const killCount = Object.values(state.questProgress).flat().filter(o => o.mobType === 'will_o_wisp').reduce((s, o) => s + o.current, 0);
        unlock = killCount >= 30;
      }
      if (a.id === 'argiope_hunter') {
        const killCount = Object.values(state.questProgress).flat().filter(o => o.mobType === 'argiope').reduce((s, o) => s + o.current, 0);
        unlock = killCount >= 20;
      }
      if (a.id === 'shadow_cleanser') {
        const buMobs = ['drainliar','spore','will_o_wisp','argiope','shining_plant','stalker','master_drainliar','dark_guardian'];
        const killCount = Object.values(state.questProgress).flat().filter(o => buMobs.includes(o.mobType || '')).reduce((s, o) => s + o.current, 0);
        unlock = killCount >= 100;
      }
      if (a.id === 'bu_material_collector') {
        const buMaterials = ['bat_wing','spore_powder','wisp_essence','silk_thread','glowing_sap','shadow_shard','ancient_tablet','dark_crystal'];
        const collected = buMaterials.filter(m => state.inventory.some(i => i.id === m && i.quantity > 0));
        unlock = collected.length >= 5;
      }
      if (a.id === 'crystal_gatherer') {
        const crystal = state.inventory.find(i => i.id === 'dark_crystal');
        unlock = (crystal?.quantity || 0) >= 10;
      }
      if (a.id === 'tablet_reader') {
        const tablet = state.inventory.find(i => i.id === 'ancient_tablet');
        unlock = (tablet?.quantity || 0) >= 8;
      }
      if (a.id === 'shadow_explorer') {
        const buLandmarks = ['lm_bosque_arch','lm_weeping_willow','lm_ruined_temple','lm_forgotten_shrine','lm_dark_portal'];
        const discovered = buLandmarks.filter(l => state.discoveredLandmarks.includes(l));
        unlock = discovered.length >= 5;
      }
      if (a.id === 'ruins_visitor') {
        const zoneLandmarks: Record<string, string[]> = {
          bosque_umbrio_entrada: ['lm_bosque_arch'],
          bosque_umbrio_profundo: ['lm_weeping_willow'],
          ruinas_ancestrales: ['lm_ruined_temple'],
          santuario_olvidado: ['lm_forgotten_shrine', 'lm_dark_portal'],
        };
        const visited = Object.entries(zoneLandmarks).filter(([_, lms]) =>
          lms.some(lm => state.discoveredLandmarks.includes(lm))
        );
        unlock = visited.length >= 4;
      }
      if (a.id === 'sanctuary_reached') unlock = state.completedQuests.includes('epic_11') || state.discoveredLandmarks.includes('lm_forgotten_shrine');
      if (a.id === 'shadow_warrior') unlock = state.stats.level >= 25;
      if (a.id === 'forest_master') unlock = state.stats.level >= 30;
      if (a.id === 'bu_side_quest_master') {
        const buSideIds = ['sq_16','sq_17','sq_18','sq_19','sq_20','sq_21','sq_22','sq_23','sq_24','sq_25'];
        const completed = buSideIds.filter(id => state.completedQuests.includes(id));
        unlock = completed.length >= 8;
      }
      if (a.id === 'bu_epic_hero') {
        const buEpicIds = ['epic_08','epic_09','epic_10','epic_11'];
        const completed = buEpicIds.filter(id => state.completedQuests.includes(id));
        unlock = completed.length >= 4;
      }
      if (a.id === 'bu_completionist') {
        const buAllIds = ['epic_08','epic_09','epic_10','epic_11','sq_16','sq_17','sq_18','sq_19','sq_20','sq_21','sq_22','sq_23','sq_24','sq_25'];
        const completed = buAllIds.filter(id => state.completedQuests.includes(id));
        unlock = completed.length >= 14;
      }
      if (unlock) {
        state.addCombatLog(`🏆 ¡Logro desbloqueado: ${a.name}! +${a.reward.zeny} Zeny`, 'mvp');
        set((s) => ({ zeny: s.zeny + a.reward.zeny }));
        if (a.reward.items) {
          a.reward.items.forEach(item => {
            state.addItem({ id: item.itemId, name: item.name, quantity: item.quantity, type: 'material' });
          });
        }
        if (a.reward.title) {
          set((s) => ({ playerTitle: a.reward.title! }));
          state.addCombatLog(`🏅 Título desbloqueado: ${a.reward.title}`, 'system');
        }
      }
      return { ...a, unlocked: unlock };
    });
    set({ achievements: updated });
  },

  allocateSkillPoint: (skillId) => {
    const state = get();
    if (state.skillPoints <= 0) {
      state.addCombatLog('No tienes puntos de habilidad disponibles.', 'system');
      return;
    }
    const skillList = [...state.skills];
    const skillIdx = skillList.findIndex(s => s.id === skillId);
    if (skillIdx === -1) return;
    
    const skill = skillList[skillIdx];
    if (skill.level >= skill.maxLevel) {
      state.addCombatLog(`La habilidad [${skill.name}] ya alcanzó su nivel máximo.`, 'system');
      return;
    }

    const updatedSkill = { ...skill, level: skill.level + 1 };
    skillList[skillIdx] = updatedSkill;

    // Special interaction: Play dead unlocks at Basic Skill level 7
    if (state.jobClass === 'Novice' && updatedSkill.id === 'basic_skill' && updatedSkill.level === 7) {
      const playDeadIdx = skillList.findIndex(s => s.id === 'play_dead');
      if (playDeadIdx !== -1 && skillList[playDeadIdx].level === 0) {
        skillList[playDeadIdx] = { ...skillList[playDeadIdx], level: 1 };
        state.addCombatLog('✨ ¡Has aprendido la habilidad [Play Dead] tras alcanzar Basic Skill Nivel 7! ✨', 'system');
      }
    }

    set({
      skills: skillList,
      skillPoints: state.skillPoints - 1
    });

    state.addCombatLog(`Invertido un punto de habilidad. [${skill.name}] subió a Nivel ${updatedSkill.level}.`, 'system');
    state.saveGame();
  },

  bufferingQueue: [],
  
  joystick: {
    isActive: false,
    startX: 0,
    startY: 0,
    currentX: 0,
    currentY: 0,
    angle: 0,
    distance: 0,
    normalizedX: 0,
    normalizedY: 0
  },

  setJobClass: (job) => {
    const state = get();
    const currentJob = state.jobClass;
    const currentStats = state.stats;
    const metadata = JOB_TREE[currentJob];
    
    // Validate job change requirements
    if (currentJob !== job) {
      if (!metadata.nextJobs.includes(job)) {
        // Special case: Rebirth (From 2nd to Novice/High Novice)
        const isRebirth = currentStats.level >= 99 && currentStats.jobLevel >= 50 && job === 'Novice';
        if (!isRebirth) {
            state.addCombatLog(`❌ No puedes cambiar directamente de ${currentJob} a ${job}.`, 'system');
            return;
        }
        
        // Rebirth logic (Reset levels, keep status/prestige)
        state.addCombatLog(`✨ ¡Has renacido! Vuelves a ser Novice pero con el potencial de un High Job. ✨`, 'system');
        const noviceStats = defaultStats['Novice'];
        set({
            jobClass: 'Novice',
            stats: { ...noviceStats, level: 1, jobLevel: 1 },
            baseStats: { ...noviceStats, level: 1, jobLevel: 1 },
            playerBaseExp: 0,
            playerBaseMaxExp: 100,
            playerJobExp: 0,
            playerJobMaxExp: 80,
            skillPoints: 0,
            skills: defaultSkills['Novice']
        });
        get().saveGame();
        return;
      }

      if (currentStats.jobLevel < metadata.requirement.jobLevel) {
        state.addCombatLog(`❌ Necesitas Job Lv ${metadata.requirement.jobLevel} para ser ${job}.`, 'system');
        return;
      }
      
      if (metadata.requirement.baseLevel && currentStats.level < metadata.requirement.baseLevel) {
        state.addCombatLog(`❌ Necesitas Base Lv ${metadata.requirement.baseLevel} para ser ${job}.`, 'system');
        return;
      }
    }

    const selectedStats = defaultStats[job];
    const selectedSkills = defaultSkills[job].map(s => ({ ...s })); // clone skills
    
    // Mantain Base level on normal job change, but reset Job level
    const newStats = {
      ...selectedStats,
      level: currentStats.level,
      jobLevel: 1 
    };

    set({
      jobClass: job,
      stats: newStats,
      baseStats: { ...newStats },
      currentHp: newStats.maxHp,
      currentSp: newStats.maxSp,
      skills: selectedSkills,
      skillPoints: 0, 
      playerJobExp: 0,
      playerJobMaxExp: 100,
      targetEntityId: null,
      bufferingQueue: [],
      activeCast: null,
      battleMode: false,
      inventory: [
        ...state.inventory,
        ...Object.values(state.equippedItems).filter(Boolean) as InventoryItem[],
      ],
      equippedItems: {},
    });
    get().addCombatLog(`¡Has avanzado a ${job}!`, 'system');
    get().saveGame();
  },

  equipItem: (itemId, slot) => {
    const state = get();
    const item = state.inventory.find(i => i.id === itemId);
    if (!item || item.type !== 'equipment' || item.slot !== slot) return;

    // Job restriction check
    if (item.allowedJobs && item.allowedJobs.length > 0 && !item.allowedJobs.includes(state.jobClass)) {
      state.addCombatLog(`❌ Tu clase actal (${state.jobClass}) no puede equipar este objeto.`, 'system');
      return;
    }

    if (state.equippedItems[slot]) {
      state.unequipItem(slot);
    }
    
    const updatedState = get();
    set({
        equippedItems: { ...updatedState.equippedItems, [slot]: item },
        inventory: updatedState.inventory.filter(i => i.id !== itemId)
    });
    get().recalculateStats();
    get().saveGame();
  },

  unequipItem: (slot) => {
    const state = get();
    const equipped = state.equippedItems[slot];
    if (!equipped) return;

    const newEquipped = { ...state.equippedItems };
    delete newEquipped[slot];
    
    set({
      equippedItems: newEquipped,
      inventory: [...state.inventory, { ...equipped as InventoryItem }]
    });
    
    get().recalculateStats();
    get().saveGame();
  },

  recalculateStats: () => {
    const state = get();
    const newStats = { ...state.baseStats, level: state.stats.level, jobLevel: state.stats.jobLevel };
    
    Object.values(state.equippedItems).forEach(item => {
        if (item && item.stats) {
            newStats.atk = (newStats.atk || 0) + (item.stats.atk || 0);
            newStats.def = (newStats.def || 0) + (item.stats.def || 0);
            newStats.matk = (newStats.matk || 0) + (item.stats.matk || 0);
            newStats.agi = (newStats.agi || 0) + (item.stats.agi || 0);
            newStats.flee = (newStats.flee || 0) + (item.stats.flee || 0);
            newStats.spd = (newStats.spd || 0) + (item.stats.spd || 0);
            newStats.str = (newStats.str || 0) + (item.stats.str || 0);
            newStats.int = (newStats.int || 0) + (item.stats.int || 0);
            newStats.dex = (newStats.dex || 0) + (item.stats.dex || 0);
            newStats.luk = (newStats.luk || 0) + (item.stats.luk || 0);
            if (item.stats.hp) newStats.maxHp = (newStats.maxHp || 0) + item.stats.hp;
        }
    });

    // Apply card socket bonuses from equipped items
    const allCardIds: string[] = [];
    Object.values(state.equippedItems).forEach(item => {
      if (item && item.socketedCards) {
        allCardIds.push(...item.socketedCards);
      }
    });
    if (allCardIds.length > 0) {
      const cardBonus = getCombinedCardEffects(allCardIds);
      if (cardBonus.str) newStats.str = (newStats.str || 0) + cardBonus.str;
      if (cardBonus.agi) newStats.agi = (newStats.agi || 0) + cardBonus.agi;
      if (cardBonus.int) newStats.int = (newStats.int || 0) + cardBonus.int;
      if (cardBonus.dex) newStats.dex = (newStats.dex || 0) + cardBonus.dex;
      if (cardBonus.luk) newStats.luk = (newStats.luk || 0) + cardBonus.luk;
      if (cardBonus.vit) newStats.vit = (newStats.vit || 0) + cardBonus.vit;
      if (cardBonus.def) newStats.def = (newStats.def || 0) + cardBonus.def;
      if (cardBonus.maxHp) newStats.maxHp = (newStats.maxHp || 0) + cardBonus.maxHp;
      if (cardBonus.flee) newStats.flee = (newStats.flee || 0) + cardBonus.flee;
      if (cardBonus.matk) newStats.matk = (newStats.matk || 0) + cardBonus.matk;
    }

    // Apply active buff bonuses
    state.activeBuffs.forEach(buff => {
      if (!buff.stats) return;
      if (buff.stats.str) newStats.str = (newStats.str || 0) + buff.stats.str;
      if (buff.stats.agi) newStats.agi = (newStats.agi || 0) + buff.stats.agi;
      if (buff.stats.int) newStats.int = (newStats.int || 0) + buff.stats.int;
      if (buff.stats.dex) newStats.dex = (newStats.dex || 0) + buff.stats.dex;
      if (buff.stats.luk) newStats.luk = (newStats.luk || 0) + buff.stats.luk;
      if (buff.stats.vit) newStats.vit = (newStats.vit || 0) + buff.stats.vit;
    });
    
    set({ stats: newStats });
  },

  addItem: (item) => {
    set((state) => {
      const existingItem = state.inventory.find(i => i.id === item.id);
      if (existingItem) {
        return {
          inventory: state.inventory.map(i =>
            i.id === item.id ? { ...i, quantity: i.quantity + item.quantity } : i
          )
        };
      }
      return { inventory: [...state.inventory, item] };
    });
    // Track collect quest objectives
    const s = get();
    s.activeQuests.forEach(qId => {
      const progress = s.questProgress[qId];
      if (!progress) return;
      progress.forEach((obj, idx) => {
        if (obj.type === 'collect' && obj.targetId === item.id) {
          s.updateQuestProgress(qId, idx, item.quantity);
        }
      });
    });
    setTimeout(() => get().checkAchievements(), 0);
    s.addCombatLog(`Obtenido: ${item.name}`, 'system');
  },

  discardItem: (itemId, quantity) => {
    const state = get();
    const item = state.inventory.find(i => i.id === itemId);
    if (!item) return;
    const qty = quantity ?? item.quantity;
    const newInventory = state.inventory.map(i =>
      i.id === itemId ? { ...i, quantity: i.quantity - qty } : i
    ).filter(i => i.quantity > 0);
    set({ inventory: newInventory });
    state.addCombatLog(`Descartaste ${qty}x ${item.name}`, 'system');
  },

  updateStats: (statChanges) => {
    set((state) => ({
      stats: { ...state.stats, ...statChanges }
    }));
  },

  setPlayerHpSp: (hp, sp) => {
    set({ currentHp: hp, currentSp: sp });
  },

  addExp: (base, job) => {
    const mult = getXpMultiplier();
    base = Math.floor(base * mult);
    job = Math.floor(job * mult);
    set((state) => {
      let bExp = state.playerBaseExp + base;
      let bMax = state.playerBaseMaxExp;
      let lvl = state.stats.level;
      let leveledUp = false;

      if (bExp >= bMax) {
        bExp -= bMax;
        bMax = Math.floor(bMax * 1.35);
        lvl = Math.min(99, lvl + 1);
        leveledUp = true;
      }

      let jExp = state.playerJobExp + job;
      let jMax = state.playerJobMaxExp;
      let jLvl = state.stats.jobLevel;
      let addedSkillPoints = 0;

      if (jExp >= jMax) {
        jExp -= jMax;
        jMax = Math.floor(jMax * 1.25);
        jLvl = Math.min(70, jLvl + 1);
        leveledUp = true;
        addedSkillPoints = 1;
      }

      const equipHp = Object.values(state.equippedItems).reduce((sum, item) => sum + (item?.stats?.hp ?? 0), 0);
      const rawMaxHp = state.stats.maxHp - equipHp;
      const newMaxHp = Math.floor(rawMaxHp + 5 + state.stats.vit * 0.5);

      const updatedStats = {
        ...state.stats,
        level: lvl,
        jobLevel: jLvl,
        maxHp: newMaxHp + equipHp,
        maxSp: Math.floor(state.stats.maxSp + 2 + state.stats.int * 0.3),
      };

      return {
        playerBaseExp: bExp,
        playerBaseMaxExp: bMax,
        playerJobExp: jExp,
        playerJobMaxExp: jMax,
        stats: updatedStats,
        baseStats: {
          ...state.baseStats,
          maxHp: newMaxHp,
          maxSp: updatedStats.maxSp,
        },
        skillPoints: state.skillPoints + addedSkillPoints,
        currentHp: leveledUp ? updatedStats.maxHp : state.currentHp,
        currentSp: leveledUp ? updatedStats.maxSp : state.currentSp
      };
    });
    if (get().stats.level >= 10) setTimeout(() => get().checkAchievements(), 0);
  },

  getPotionHealAmount: (itemId) => {
    const map: Record<string, { hpPct: number; spPct: number }> = {
      red_potion: { hpPct: 0.25, spPct: 0 },
      orange_potion: { hpPct: 0.45, spPct: 0 },
      yellow_potion: { hpPct: 0.65, spPct: 0 },
      blue_potion: { hpPct: 0, spPct: 0.30 },
      white_potion: { hpPct: 1.0, spPct: 0 },
      awakening_potion: { hpPct: 0, spPct: 0.15 },
      green_potion: { hpPct: 0, spPct: 0 },
      millers_blessing: { hpPct: 1.0, spPct: 0 },
      flour_sack: { hpPct: 0.15, spPct: 0 },
    };
    return map[itemId] || null;
  },

  drinkPotionById: (itemId): boolean => {
    const state = get();
    const item = state.inventory.find(i => i.id === itemId);
    if (!item || item.quantity <= 0) {
      state.addCombatLog(`¡No tienes ${itemId.replace('_', ' ')}!`, 'system');
      return false;
    }
    const heal = state.getPotionHealAmount(itemId);
    if (!heal) return false;

    const isFullHp = state.currentHp >= state.stats.maxHp;
    const isFullSp = state.currentSp >= state.stats.maxSp;
    if (heal.hpPct > 0 && isFullHp && heal.spPct === 0) {
      state.addCombatLog('Tu vida ya está al máximo.', 'system');
      return false;
    }
    if (heal.spPct > 0 && isFullSp && heal.hpPct === 0) {
      state.addCombatLog('Tu SP ya está al máximo.', 'system');
      return false;
    }

    const hpHeal = heal.hpPct > 0 ? Math.floor(state.stats.maxHp * heal.hpPct + state.stats.vit * 10) : 0;
    const spHeal = heal.spPct > 0 ? Math.floor(state.stats.maxSp * heal.spPct + state.stats.int * 5) : 0;
    const newHp = Math.min(state.stats.maxHp, state.currentHp + hpHeal);
    const newSp = Math.min(state.stats.maxSp, state.currentSp + spHeal);

    const updatedInventory = state.inventory.map(i =>
      i.id === itemId ? { ...i, quantity: i.quantity - 1 } : i
    ).filter(i => i.quantity > 0);

    set({
      currentHp: newHp,
      currentSp: newSp,
      inventory: updatedInventory,
    });
    state.addCombatLog(`🧪 Usaste ${itemId.replace('_', ' ')}. Recuperaste ${hpHeal} HP y ${spHeal} SP.`, 'heal');
    return true;
  },

  setPlayerTitle: (title) => {
    set({ playerTitle: title });
  },

  socketCardIntoEquipment: (cardItemId, equipmentId) => {
    const state = get();
    const cardItem = state.inventory.find(i => i.id === cardItemId);
    if (!cardItem || cardItem.type !== 'card' || cardItem.quantity <= 0) {
      state.addCombatLog('No tienes esa carta.', 'system');
      return;
    }
    const equipIdx = state.inventory.findIndex(i => i.id === equipmentId && i.type === 'equipment');
    if (equipIdx === -1) {
      state.addCombatLog('No tienes ese equipo.', 'system');
      return;
    }
    const equip = state.inventory[equipIdx];
    const currentSlots = equip.socketedCards || [];
    if (currentSlots.length >= 4) {
      state.addCombatLog('¡Ese equipo ya tiene 4 cartas insertadas (máximo)!', 'system');
      return;
    }
    if (currentSlots.includes(cardItemId)) {
      state.addCombatLog('Esa carta ya está insertada en este equipo.', 'system');
      return;
    }

    const updatedInventory = state.inventory.map((item, idx) => {
      if (idx === equipIdx) {
        return { ...item, socketedCards: [...currentSlots, cardItemId] };
      }
      if (item.id === cardItemId) {
        const q = item.quantity - 1;
        return q <= 0 ? null : { ...item, quantity: q };
      }
      return item;
    }).filter(Boolean) as InventoryItem[];

    set({ inventory: updatedInventory });
    state.addCombatLog(`🃏 Carta [${cardItem.name}] insertada en [${equip.name}].`, 'system');
    get().recalculateStats();
  },

  setHeadgear: (id) => {
    set({ headgear: id });
  },

  setTarget: (id, name = 'Ninguno', hp = 0, maxHp = 0, level = 0, entityType = null) => {
    set({
      targetEntityId: id,
      targetName: name,
      targetHp: hp,
      targetMaxHp: maxHp,
      targetLevel: level,
      targetEntityType: id ? entityType : null,
    });
  },

  updateTargetHp: (hp) => {
    set({ targetHp: hp });
  },

  triggerPlayerAttackPulse: () => {
    set((state) => ({ playerAttackPulse: state.playerAttackPulse + 1 }));
  },

  addCombatLog: (text, type) => {
    const time = new Date();
    const timestamp = `${time.getHours().toString().padStart(2, '0')}:${time.getMinutes().toString().padStart(2, '0')}:${time.getSeconds().toString().padStart(2, '0')}`;
    const newLog: CombatLog = {
      id: Math.random().toString(),
      text,
      type,
      timestamp
    };
    set((state) => ({
      combatLogs: [newLog, ...state.combatLogs].slice(0, 50) // Cap to 50 logs for memory performance
    }));
  },

  clearCombatLogs: () => {
    set({ combatLogs: [] });
  },

  addLootNotification: (lines) => {
    const id = Math.random().toString();
    set((state) => ({
      lootNotifications: [...state.lootNotifications, { id, lines, createdAt: Date.now() }].slice(-5),
    }));
    setTimeout(() => {
      set((state) => ({
        lootNotifications: state.lootNotifications.filter(n => n.id !== id),
      }));
    }, 2000);
  },

  addToInputBuffer: (action) => {
    const now = performance.now();
    const expiresAt = now + 1200; // Buffered actions live for 1.2s max, perfect RO latency feel!
    const newItem: InputBufferItem = {
      id: Math.random().toString(),
      ...action,
      timestamp: now,
      expiresAt
    };
    set((state) => ({
      bufferingQueue: [...state.bufferingQueue, newItem].slice(0, 5) // Cap queue to 5 commands
    }));
  },

  removeFromInputBuffer: (id) => {
    set((state) => ({
      bufferingQueue: state.bufferingQueue.filter(item => item.id !== id)
    }));
  },

  clearInputBuffer: () => {
    set({ bufferingQueue: [] });
  },

  updateJoystick: (changes) => {
    set((state) => ({
      joystick: { ...state.joystick, ...changes }
    }));
  },

  setJoystickEnabled: (enabled) => {
    set({ 
      isJoystickEnabled: enabled,
      activeInputMode: enabled ? 'joystick_aim' : 'touch_target'
    });
    get().addCombatLog(
      enabled 
        ? 'Joystick virtual activado (Lateral izquierdo). Movimiento libre 360°' 
        : 'Joystick virtual desactivado. Toque de pantalla (Touch navigation) activado', 
      'system'
    );
  },

  setInputMode: (mode) => {
    set({ activeInputMode: mode });
  },

  toggleAutoBattle: () => {
    set((state) => ({ autoBattle: !state.autoBattle }));
    get().addCombatLog(
        !get().autoBattle 
          ? 'Auto-Battle desactivado.' 
          : 'Auto-Battle activado. Buscando enemigos...', 
        'system'
    );
  },

  toggleAutoPickup: () => {
    set((state) => ({ autoPickupEnabled: !state.autoPickupEnabled }));
    get().addCombatLog(
        !get().autoPickupEnabled 
          ? 'Auto-pickup desactivado.' 
          : 'Auto-pickup activado.', 
        'system'
    );
  },

  castSkill: (skillId) => {
    // Action helper to queue and buffer a skill cast trigger
    const state = get();
    const skill = state.skills.find(s => s.id === skillId);
    if (!skill) return;

    // Cooldown verification checks
    const now = performance.now();
    const lastCast = skill.lastCastTime || 0;
    if (now - lastCast < skill.cooldown) {
      const remaining = Math.ceil((skill.cooldown - (now - lastCast)) / 100) / 10;
      state.addCombatLog(`¡[${skill.name}] está recargando! Reutilización en ${remaining}s.`, 'system');
      return;
    }

    if (state.currentSp < skill.spCost) {
      state.addCombatLog(`¡Falta SP para lanzar ${skill.name}! Requiere ${skill.spCost} SP.`, 'system');
      return;
    }

    // Queue in input buffer system!
    state.addToInputBuffer({
      type: 'skill',
      skillId: skillId,
      targetId: state.targetEntityId || undefined
    });
  },

  setNpcDialogue: (dialogue) => {
    set({ npcDialogue: dialogue });
  },

  setPlayerStatus: (status) => {
    set({ playerStatus: status });
  },

  setStatusEffects: (effects) => {
    set({ activeStatusEffects: effects });
  },

  addBuff: (buff) => {
    set((state) => {
      const index = state.activeBuffs.findIndex(b => b.id === buff.id);
      const updated = [...state.activeBuffs];
      if (index > -1) {
        updated[index] = buff;
      } else {
        updated.push(buff);
      }
      return { activeBuffs: updated };
    });
  },

  removeBuff: (id) => {
    set((state) => ({
      activeBuffs: state.activeBuffs.filter(b => b.id !== id)
    }));
  },

  saveGame: async () => {
    const state = get();
    const saveObj = {
      level: state.stats.level,
      hp: state.currentHp,
      equippedItems: state.equippedItems,
      jobClass: state.jobClass,
      inventory: state.inventory,
      headgear: state.headgear,
      stats: state.stats,
      baseStats: state.baseStats,
      skillPoints: state.skillPoints,
      skills: state.skills,
      zeny: state.zeny,
      activeQuests: state.activeQuests,
      completedQuests: state.completedQuests,
      questProgress: state.questProgress,
      discoveredLandmarks: state.discoveredLandmarks,
      achievements: state.achievements,
      highContrastMode: state.highContrastMode,
      currentMainQuest: state.currentMainQuest,
    };

    if (isSupabaseConfigured) {
      try {
        const { error } = await supabase.from('player_profiles').upsert({
          username: 'Player1', // Placeholder username
          level: state.stats.level,
          hp: state.currentHp,
          equipped_items: state.equippedItems,
          job: state.jobClass,
        });
        if (error) {
          console.error('Error saving game to Supabase:', {
            message: error.message,
            code: error.code,
            details: error.details,
            hint: error.hint
          });
        }
      } catch (e) {
        console.error('Supabase upload exception:', e);
      }
    }

    try {
      localStorage.setItem('ragnarok_sandbox_save', JSON.stringify(saveObj));
    } catch (e) {
      console.warn('LocalStorage save failed/blocked:', e);
    }
  },

  loadGame: async () => {
    let loadedFromDb = false;

    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase.from('player_profiles').select('*').maybeSingle();
        if (!error && data) {
          const loadedJob = (data.job || 'Novice') as JobClass;
          set({
            jobClass: loadedJob,
            currentHp: data.hp,
            equippedItems: data.equipped_items as EquippedItems,
            skills: defaultSkills[loadedJob]
          });
          get().recalculateStats();
          loadedFromDb = true;
        } else if (error) {
          console.error('Error loading game from Supabase:', {
            message: error.message,
            code: error.code,
            details: error.details,
            hint: error.hint
          });
        }
      } catch (e) {
        console.error('Supabase load exception:', e);
      }
    }

    if (!loadedFromDb) {
      try {
        const localDataString = localStorage.getItem('ragnarok_sandbox_save');
        if (localDataString) {
          const data = JSON.parse(localDataString);

          // Validate jobClass
          const validJobs = Object.keys(JOB_TREE) as JobClass[];
          const safeJob: JobClass = validJobs.includes(data.jobClass) ? data.jobClass : 'Novice';
          const jobDefaults = defaultStats[safeJob];

          // Validate stats: must be object with numeric level
          const rawStats = data.stats;
          const safeStats: CharacterStats = rawStats && typeof rawStats.level === 'number'
            ? { ...jobDefaults, ...rawStats, level: Math.max(1, Math.min(99, rawStats.level || 1)) }
            : { ...jobDefaults };

          // Validate HP: must be finite positive number not exceeding maxHp * 2
          const safeHp = (typeof data.hp === 'number' && isFinite(data.hp) && data.hp > 0 && data.hp <= safeStats.maxHp * 2)
            ? data.hp : safeStats.maxHp;

          // Validate zeny: non-negative integer
          const safeZeny = (typeof data.zeny === 'number' && isFinite(data.zeny) && data.zeny >= 0)
            ? Math.floor(data.zeny) : 500;

          // Validate arrays
          const safeActiveQuests = Array.isArray(data.activeQuests) ? data.activeQuests.filter(Boolean) : [];
          const safeCompletedQuests = Array.isArray(data.completedQuests) ? data.completedQuests.filter(Boolean) : [];
          const safeDiscoveredLandmarks = Array.isArray(data.discoveredLandmarks) ? data.discoveredLandmarks.filter(Boolean) : [];
          const safeInventory = Array.isArray(data.inventory) ? data.inventory : get().inventory;
          const safeQuestProgress = data.questProgress && typeof data.questProgress === 'object' ? data.questProgress : {};

          // Validate headgear
          const validHeadgear: HeadgearId[] = ['none', 'goggles', 'magician_hat', 'bunny_band', 'ragnarok_crown'];
          const safeHeadgear: HeadgearId = validHeadgear.includes(data.headgear) ? data.headgear : 'none';

          // Validate skillPoints
          const safeSkillPoints = (typeof data.skillPoints === 'number' && isFinite(data.skillPoints) && data.skillPoints >= 0)
            ? Math.floor(data.skillPoints) : 0;

          // Validate skills
          const safeSkills = Array.isArray(data.skills) ? data.skills : defaultSkills[safeJob];

          // Validate equippedItems
          const safeEquipped = data.equippedItems && typeof data.equippedItems === 'object' ? data.equippedItems : {};

          // Build safe quest states
          const savedQuests = get().quests.map(q => {
            const inActive = safeActiveQuests.includes(q.id);
            const inCompleted = safeCompletedQuests.includes(q.id);
            let state: 'locked' | 'available' | 'active' | 'completed' = 'available';
            if (inActive) state = 'active';
            else if (inCompleted) state = 'completed';
            else if (q.requiredQuestId && !safeCompletedQuests.includes(q.requiredQuestId)) state = 'locked';
            return { ...q, state };
          });

          // Validate achievements
          const safeAchievements = Array.isArray(data.achievements)
            ? data.achievements.map((a: any) => ({
                ...a,
                unlocked: typeof a.unlocked === 'boolean' ? a.unlocked : false
              }))
            : ALL_ACHIEVEMENTS.map(a => ({ ...a, unlocked: false }));

          const safeBaseStats = data.baseStats && typeof data.baseStats === 'object'
            ? { ...data.baseStats }
            : { ...safeStats };

          const safeHighContrast = typeof data.highContrastMode === 'boolean' ? data.highContrastMode : false;

          set({
            jobClass: safeJob,
            currentHp: safeHp,
            stats: safeStats,
            baseStats: safeBaseStats,
            equippedItems: safeEquipped as EquippedItems,
            inventory: safeInventory,
            headgear: safeHeadgear,
            skillPoints: safeSkillPoints,
            skills: safeSkills,
            zeny: safeZeny,
            quests: savedQuests,
            activeQuests: safeActiveQuests,
            completedQuests: safeCompletedQuests,
            questProgress: safeQuestProgress,
            discoveredLandmarks: safeDiscoveredLandmarks,
            achievements: safeAchievements,
            highContrastMode: safeHighContrast,
            currentMainQuest: typeof data.currentMainQuest === 'string' ? data.currentMainQuest : null,
          });
          get().recalculateStats();
        }
      } catch (e) {
        console.warn('Save corrupto, iniciando partida nueva:', e);
        try {
          const corruptData = localStorage.getItem('ragnarok_sandbox_save');
          if (corruptData) {
            localStorage.setItem('ragnarok_sandbox_save_corrupt_backup', corruptData);
          }
        } catch (_) { /* ignore backup failure */ }
        localStorage.removeItem('ragnarok_sandbox_save');
      }
    }
  }
}));
