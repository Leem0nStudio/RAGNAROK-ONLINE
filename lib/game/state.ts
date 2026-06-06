import { create } from 'zustand';
import { supabase, isSupabaseConfigured } from '../supabaseClient';
import { 
  JobClass, CharacterStats, InventoryItem, CombatLog, 
  Skill, TouchIndicator, InputBufferItem, JoystickState, HeadgearId,
  EquipmentSlot, EquippedItems, StatusEffect, JobMetadata
} from './types';
import { 
  ITEM_DATABASE, InventoryManager, INITIAL_MAX_SLOTS 
} from './inventory';
import { gameAudio } from './audio';

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
  stats?: Partial<CharacterStats>;
}

export interface ActiveCastState {
  skillId: string;
  skillName: string;
  durationMs: number;
  elapsedMs: number;
  color: string;
}

interface GameStoreState {
  currentMap: string;
  setMap: (mapName: string) => void;
  warpFadeActive: boolean;
  setWarpFade: (active: boolean) => void;
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
  potCount: number;
  headgear: HeadgearId;
  activeCast: ActiveCastState | null;
  battleMode: boolean;
  autoBattle: boolean;
  autoPickupEnabled: boolean;
  showCombatLog: boolean;
  showInventory: boolean;
  closeNpcDialogue: () => void;

  // Inventory & Targets
  inventory: InventoryItem[];
  equippedItems: EquippedItems;
  targetEntityId: string | null;
  targetHp: number;
  targetMaxHp: number;
  targetName: string;

  playerAttackPulse: number; // Increment to trigger UI attack animations
  comboCount: number;
  comboTimer: number;
  killStreakCount: number;
  killStreakTimer: number;
  incrementKillStreak: () => void;
  resetKillStreak: () => void;

  // NPC Interactions & Buffs
  npcDialogue: {
    npcId: string;
    npcName: string;
    npcType: 'kafra' | 'crusader_instructor';
    text: string;
    options: { label: string; actionParam: string }[];
  } | null;
  activeBuffs: ActiveBuff[];
  activeStatusEffects: StatusEffect[];

  // System Lists & UI
  combatLogs: CombatLog[];
  skills: Skill[];
  bufferingQueue: InputBufferItem[];
  joystick: JoystickState;
  
  // Settings & Controls
  isJoystickEnabled: boolean;
  isMultitouchSupported: boolean;
  activeInputMode: 'touch_target' | 'joystick_aim';
  showConfigPanel: boolean;

  // Camera Adjustments Settings
  cameraZoom: number;
  cameraAngleY: number;
  cameraOffsetZ: number;
  setCameraZoom: (zoom: number) => void;
  setCameraAngleY: (angle: number) => void;
  setCameraOffsetZ: (offset: number) => void;

  // Habilidades y progresión
  skillPoints: number;
  statPoints: number;
  allocateSkillPoint: (skillId: string) => void;
  allocateStatPoint: (stat: keyof CharacterStats) => void;

  // Actions / Reducers
  setJobClass: (job: JobClass) => void;
  updateStats: (stats: Partial<CharacterStats>) => void;
  setPlayerHpSp: (hp: number, sp: number) => void;
  addExp: (base: number, job: number) => void;
  drinkPotion: () => void;
  setPotCount: (count: number) => void;
  setHeadgear: (id: HeadgearId) => void;
  setTarget: (id: string | null, name?: string, hp?: number, maxHp?: number) => void;
  updateTargetHp: (hp: number) => void;
  triggerPlayerAttackPulse: () => void;
  incrementCombo: () => void;
  resetCombo: () => void;
  addCombatLog: (text: string, type: CombatLog['type']) => void;
  clearCombatLogs: () => void;
  addToInputBuffer: (item: Omit<InputBufferItem, 'id' | 'timestamp' | 'expiresAt'>) => void;
  removeFromInputBuffer: (id: string) => void;
  clearInputBuffer: () => void;
  updateJoystick: (joystick: Partial<JoystickState>) => void;
  setJoystickEnabled: (enabled: boolean) => void;
  setInputMode: (mode: 'touch_target' | 'joystick_aim') => void;
  toggleConfigPanel: () => void;
  toggleAutoBattle: () => void;
  toggleAutoPickup: () => void;
  toggleInventory: () => void;
  castSkill: (skillId: string) => void;
  equipItem: (itemId: string, slot: EquipmentSlot) => void;
  unequipItem: (slot: EquipmentSlot) => void;
  recalculateStats: () => void;
  addItem: (item: InventoryItem) => void;

  // Advanced Slot-Based Inventory actions
  maxInventorySlots: number;
  addItemSlot: (itemId: string, quantity: number) => { success: boolean; added: number };
  removeItemBySlotIndex: (slotIndex: number, quantity: number) => { success: boolean; removed: number };
  swapSlots: (fromIndex: number, toIndex: number) => void;
  sortInventory: () => void;
  getWeightInfo: () => { current: number; max: number; percent: number };
  increaseMaxSlots: (amount: number) => void;
  useConsumable: (slotIndex: number) => void;

  engineInstance: any;
  registerEngine: (engine: any) => void;

  setNpcDialogue: (dialogue: GameStoreState['npcDialogue']) => void;
  addBuff: (buff: ActiveBuff) => void;
  removeBuff: (id: string) => void;
  setStatusEffects: (effects: StatusEffect[]) => void;
  saveGame: () => Promise<void>;
  loadGame: () => Promise<void>;

  // Configurable Loot Drops
  lootTables: Record<string, { itemId: string; chance: number }[]>;
  updateDropRate: (mobType: string, itemId: string, chance: number) => void;
  
  systemToast: string | null;
  showSystemToast: (text: string) => void;
  // Visual notifications
  pickupNotifications: {
    id: string;
    itemName: string;
    quantity: number;
    rarity: 'common' | 'rare' | 'epic';
    type: string;
    icon: string;
    timestamp: number;
  }[];
  addPickupNotification: (itemName: string, quantity: number, rarity: 'common' | 'rare' | 'epic', type: string, icon: string) => void;
  removePickupNotification: (id: string) => void;

  // Skill Hotbar
  equippedSkills: (string | null)[];
  assignSkillToHotbar: (skillId: string, slotIndex: number) => void;
}

const defaultStats: Record<JobClass, CharacterStats> = {
  'Novice': {
    level: 1, jobLevel: 1, str: 5, agi: 5, vit: 5, int: 5, dex: 5, luk: 5,
    atk: 10, def: 5, hit: 10, flee: 10, aspd: 110, maxHp: 160, maxSp: 30
  },
  'Swordsman': {
    level: 10, jobLevel: 1, str: 18, agi: 12, vit: 18, int: 5, dex: 12, luk: 6,
    atk: 42, def: 24, hit: 24, flee: 18, aspd: 125, maxHp: 850, maxSp: 80
  },
  'Acolyte': {
    level: 10, jobLevel: 1, str: 8, agi: 8, vit: 12, int: 20, dex: 12, luk: 8,
    atk: 22, def: 18, hit: 22, flee: 18, aspd: 120, maxHp: 650, maxSp: 180
  },
  'Thief': {
    level: 10, jobLevel: 1, str: 14, agi: 20, vit: 8, int: 5, dex: 14, luk: 10,
    atk: 32, def: 12, hit: 26, flee: 32, aspd: 135, maxHp: 580, maxSp: 100
  },
  'Archer': {
    level: 10, jobLevel: 1, str: 8, agi: 18, vit: 8, int: 8, dex: 20, luk: 8,
    atk: 28, def: 10, hit: 32, flee: 26, aspd: 130, maxHp: 540, maxSp: 120
  },
  'Mage': {
    level: 10, jobLevel: 1, str: 5, agi: 8, vit: 10, int: 22, dex: 14, luk: 6,
    atk: 18, def: 12, hit: 20, flee: 16, aspd: 115, maxHp: 520, maxSp: 220
  },
  'Merchant': {
    level: 10, jobLevel: 1, str: 15, agi: 10, vit: 15, int: 5, dex: 10, luk: 8,
    atk: 35, def: 20, hit: 22, flee: 15, aspd: 120, maxHp: 750, maxSp: 90
  },
  'Knight': {
    level: 40, jobLevel: 1, str: 45, agi: 35, vit: 50, int: 15, dex: 35, luk: 20,
    atk: 120, def: 85, hit: 90, flee: 85, aspd: 142, maxHp: 4200, maxSp: 180
  },
  'Crusader': {
    level: 40, jobLevel: 1, str: 40, agi: 30, vit: 65, int: 35, dex: 30, luk: 25,
    atk: 110, def: 120, hit: 85, flee: 70, aspd: 135, maxHp: 4800, maxSp: 320
  },
  'Wizard': {
    level: 40, jobLevel: 1, str: 10, agi: 25, vit: 30, int: 55, dex: 45, luk: 20,
    atk: 60, def: 55, hit: 85, flee: 75, aspd: 132, maxHp: 2800, maxSp: 850
  },
  'Sage': {
    level: 40, jobLevel: 1, str: 20, agi: 35, vit: 35, int: 45, dex: 50, luk: 20,
    atk: 90, def: 65, hit: 105, flee: 90, aspd: 140, maxHp: 3100, maxSp: 620
  },
  'Hunter': {
    level: 40, jobLevel: 1, str: 20, agi: 45, vit: 30, int: 25, dex: 55, luk: 35,
    atk: 110, def: 65, hit: 110, flee: 115, aspd: 148, maxHp: 3200, maxSp: 350
  },
  'Bard': {
    level: 40, jobLevel: 1, str: 25, agi: 40, vit: 35, int: 40, dex: 50, luk: 20,
    atk: 95, def: 60, hit: 105, flee: 100, aspd: 145, maxHp: 3000, maxSp: 480
  },
  'Dancer': {
    level: 40, jobLevel: 1, str: 20, agi: 50, vit: 30, int: 45, dex: 40, luk: 25,
    atk: 88, def: 55, hit: 95, flee: 120, aspd: 152, maxHp: 2800, maxSp: 520
  },
  'Priest': {
    level: 40, jobLevel: 1, str: 15, agi: 25, vit: 35, int: 50, dex: 40, luk: 25,
    atk: 80, def: 75, hit: 100, flee: 95, aspd: 135, maxHp: 3500, maxSp: 750
  },
  'Monk': {
    level: 40, jobLevel: 1, str: 55, agi: 45, vit: 40, int: 25, dex: 35, luk: 20,
    atk: 150, def: 65, hit: 95, flee: 110, aspd: 150, maxHp: 3900, maxSp: 420
  },
  'Blacksmith': {
    level: 40, jobLevel: 1, str: 55, agi: 30, vit: 45, int: 10, dex: 40, luk: 25,
    atk: 180, def: 110, hit: 105, flee: 80, aspd: 140, maxHp: 4500, maxSp: 250
  },
  'Alchemist': {
    level: 40, jobLevel: 1, str: 40, agi: 25, vit: 45, int: 40, dex: 40, luk: 30,
    atk: 140, def: 90, hit: 100, flee: 75, aspd: 132, maxHp: 4100, maxSp: 450
  },
  'Assassin': {
    level: 40, jobLevel: 1, str: 50, agi: 55, vit: 30, int: 10, dex: 35, luk: 30,
    atk: 160, def: 70, hit: 115, flee: 140, aspd: 155, maxHp: 3800, maxSp: 280
  },
  'Rogue': {
    level: 40, jobLevel: 1, str: 45, agi: 50, vit: 35, int: 15, dex: 50, luk: 25,
    atk: 145, def: 80, hit: 120, flee: 130, aspd: 150, maxHp: 3600, maxSp: 310
  },
  'Lord Knight': {
    level: 99, jobLevel: 70, str: 85, agi: 65, vit: 80, int: 20, dex: 50, luk: 30,
    atk: 340, def: 180, hit: 240, flee: 195, aspd: 168, maxHp: 18400, maxSp: 420
  },
  'Paladin': {
    level: 99, jobLevel: 70, str: 75, agi: 55, vit: 99, int: 45, dex: 45, luk: 35,
    atk: 290, def: 240, hit: 220, flee: 170, aspd: 162, maxHp: 21500, maxSp: 680
  },
  'High Wizard': {
    level: 99, jobLevel: 70, str: 15, agi: 35, vit: 45, int: 99, dex: 75, luk: 25,
    atk: 180, def: 120, hit: 220, flee: 185, aspd: 152, maxHp: 9800, maxSp: 2450
  },
  'Professor': {
    level: 99, jobLevel: 70, str: 35, agi: 55, vit: 55, int: 90, dex: 85, luk: 30,
    atk: 240, def: 140, hit: 260, flee: 210, aspd: 165, maxHp: 10500, maxSp: 1850
  },
  'Sniper': {
    level: 99, jobLevel: 70, str: 30, agi: 90, vit: 40, int: 35, dex: 99, luk: 40,
    atk: 360, def: 110, hit: 299, flee: 260, aspd: 178, maxHp: 12500, maxSp: 720
  },
  'Clown': {
    level: 99, jobLevel: 70, str: 45, agi: 80, vit: 60, int: 70, dex: 90, luk: 30,
    atk: 280, def: 140, hit: 270, flee: 240, aspd: 175, maxHp: 13200, maxSp: 1100
  },
  'Gypsy': {
    level: 99, jobLevel: 70, str: 35, agi: 95, vit: 50, int: 80, dex: 80, luk: 35,
    atk: 240, def: 130, hit: 250, flee: 280, aspd: 182, maxHp: 12200, maxSp: 1400
  },
  'High Priest': {
    level: 99, jobLevel: 70, str: 20, agi: 40, vit: 75, int: 99, dex: 70, luk: 15,
    atk: 145, def: 150, hit: 210, flee: 175, aspd: 154, maxHp: 11200, maxSp: 1980
  },
  'Champion': {
    level: 99, jobLevel: 70, str: 99, agi: 85, vit: 65, int: 45, dex: 60, luk: 25,
    atk: 450, def: 130, hit: 240, flee: 250, aspd: 180, maxHp: 16500, maxSp: 850
  },
  'Whitesmith': {
    level: 99, jobLevel: 70, str: 99, agi: 60, vit: 70, int: 20, dex: 70, luk: 40,
    atk: 420, def: 190, hit: 250, flee: 210, aspd: 170, maxHp: 21000, maxSp: 650
  },
  'Creator': {
    level: 99, jobLevel: 70, str: 80, agi: 50, vit: 80, int: 80, dex: 70, luk: 40,
    atk: 360, def: 170, hit: 240, flee: 180, aspd: 160, maxHp: 18500, maxSp: 1200
  },
  'Assassin Cross': {
    level: 99, jobLevel: 70, str: 90, agi: 95, vit: 45, int: 15, dex: 45, luk: 40,
    atk: 395, def: 95, hit: 235, flee: 285, aspd: 182, maxHp: 14200, maxSp: 510
  },
  'Stalker': {
    level: 99, jobLevel: 70, str: 75, agi: 99, vit: 55, int: 35, dex: 85, luk: 35,
    atk: 310, def: 140, hit: 280, flee: 290, aspd: 180, maxHp: 15400, maxSp: 680
  },
};
const defaultSkills: Record<JobClass, Skill[]> = {
  'Novice': [
    { id: 'basic_skill', name: 'Basic Skill', key: 'W', desc: 'Habilidad básica de aventurero. Imprime los cimientos del alma.', spCost: 0, cooldown: 0, range: 0, lastCastTime: 0, color: '#f59e0b', level: 1, maxLevel: 9, x: 200, y: 50, isPassive: true },
    { id: 'first_aid', name: 'First Aid', key: 'Q', desc: 'Restaura una pequeña cantidad de HP rápidamente (+20 HP por nivel).', spCost: 2, cooldown: 1000, range: 2.0, lastCastTime: 0, color: '#10b981', castTime: 0, level: 1, maxLevel: 3, x: 100, y: 150, dependencies: [{ skillId: 'basic_skill', level: 3 }] },
    { id: 'play_dead', name: 'Play Dead', key: 'E', desc: 'Te haces el muerto para recuperar HP instantáneamente pero eres inmóvil (Costo: 5 SP).', spCost: 5, cooldown: 5000, range: 1.0, lastCastTime: 0, color: '#64748b', level: 0, maxLevel: 1, x: 300, y: 150, dependencies: [{ skillId: 'basic_skill', level: 7 }] }
  ],
  'Swordsman': [
    { id: 'sword_mastery', name: 'Sword Mastery', key: 'P1', desc: 'Entrenamiento con espadas. Otorga +8 ATK físico pasivo por nivel.', spCost: 0, cooldown: 0, range: 0, lastCastTime: 0, color: '#3b82f6', level: 1, maxLevel: 10, x: 200, y: 50, isPassive: true },
    { id: 'bash', name: 'Bash', key: 'Q', desc: 'Ataque concentrado letal. Causa 150% + 30% por nivel de daño físico. Chance de aturdir.', spCost: 8, cooldown: 800, range: 2.2, lastCastTime: 0, color: '#f59e0b', level: 1, maxLevel: 10, x: 100, y: 150 },
    { id: 'increase_hp_rec', name: 'HP Recovery', key: 'P2', desc: 'Aumenta la regeneración pasiva de salud (+12 HP cada 4 segundos por nivel).', spCost: 0, cooldown: 0, range: 0, lastCastTime: 0, color: '#10b981', level: 1, maxLevel: 10, x: 300, y: 150, isPassive: true },
    { id: 'magnum_break', name: 'Magnum Break', key: 'W', desc: 'Expulsa una ráfaga ígnea en área que inflige daño de fuego (+120% + 20% por nivel).', spCost: 15, cooldown: 2000, range: 3.5, lastCastTime: 0, color: '#ea580c', level: 0, maxLevel: 10, x: 200, y: 250, dependencies: [{ skillId: 'bash', level: 5 }, { skillId: 'increase_hp_rec', level: 3 }] }
  ],
  'Acolyte': [
    { id: 'divine_protection', name: 'Divine Protection', key: 'P1', desc: 'Bendición mental. Reduce el daño recibido por no-muertos y demonios en +3% por nivel.', spCost: 0, cooldown: 0, range: 0, lastCastTime: 0, color: '#38bdf8', level: 1, maxLevel: 10, x: 200, y: 50, isPassive: true },
    { id: 'heal', name: 'Heal', key: 'Q', desc: 'Luz divina sanadora. Cura HP basado en tu INT y nivel de hechizo.', spCost: 12, cooldown: 500, range: 8.0, lastCastTime: 0, color: '#10b981', castTime: 300, level: 1, maxLevel: 10, x: 100, y: 160 },
    { id: 'holy_light', name: 'Holy Light', key: 'W', desc: 'Rayo celestial que causa daño mágico sagrado.', spCost: 8, cooldown: 900, range: 7.5, lastCastTime: 0, color: '#facc15', castTime: 800, level: 0, maxLevel: 10, x: 300, y: 160, dependencies: [{ skillId: 'divine_protection', level: 3 }] },
    { id: 'blessing_spell', name: 'Blessing', key: 'E', desc: 'Otorga un buff divino de +10 STR, DEX e INT por 60s.', spCost: 24, cooldown: 3000, range: 6.0, lastCastTime: 0, color: '#ec4899', level: 0, maxLevel: 10, x: 200, y: 260, dependencies: [{ skillId: 'heal', level: 3 }] }
  ],
  'Thief': [
    { id: 'double_attack', name: 'Double Attack', key: 'Q', desc: 'Otorga de forma pasiva una probabilidad del (Nivel * 5)% de dar 2 golpes rápidos.', spCost: 0, cooldown: 0, range: 2.0, lastCastTime: 0, color: '#a855f7', level: 1, maxLevel: 10, x: 200, y: 50, isPassive: true },
    { id: 'dodge_passive', name: 'Improve Dodge', key: 'P1', desc: 'Mejora los reflejos de tu héroe otorgando +3 de FLEE permanente por nivel.', spCost: 0, cooldown: 0, range: 0, lastCastTime: 0, color: '#3b82f6', level: 1, maxLevel: 10, x: 100, y: 150, isPassive: true },
    { id: 'stealth_attack', name: 'Poison Dart', key: 'W', desc: 'Dardo ponzoñoso que daña e introduce veneno intermitente por 10s.', spCost: 10, cooldown: 1200, range: 6.0, lastCastTime: 0, color: '#15803d', level: 0, maxLevel: 10, x: 300, y: 150, dependencies: [{ skillId: 'double_attack', level: 3 }] },
    { id: 'hiding', name: 'Hiding', key: 'E', desc: 'Te ocultas bajo la tierra para evitar ataques y moverte sigilosamente.', spCost: 15, cooldown: 5000, range: 0, lastCastTime: 0, color: '#1e293b', level: 0, maxLevel: 8, x: 200, y: 260, dependencies: [{ skillId: 'dodge_passive', level: 4 }] }
  ],
  'Archer': [
    { id: 'owls_eye', name: 'Owl’s Eye', key: 'P1', desc: 'Visión del búho de Prontera. Aumenta DEX de manera permanente (+1 por nivel).', spCost: 0, cooldown: 0, range: 0, lastCastTime: 0, color: '#4ade80', level: 1, maxLevel: 10, x: 200, y: 50, isPassive: true },
    { id: 'vultures_eye', name: 'Vulture’s Eye', key: 'P2', desc: 'Vista de buitre cazador. Aumenta el rango de ataque con flechas y el HIT en +2 por nivel.', spCost: 0, cooldown: 0, range: 0, lastCastTime: 0, color: '#14b8a6', level: 0, maxLevel: 10, x: 100, y: 150, isPassive: true, dependencies: [{ skillId: 'owls_eye', level: 3 }] },
    { id: 'double_strafe', name: 'Double Strafe', key: 'Q', desc: 'Fuego doble. Causa 160% + 25% por nivel de daño físico a larga distancia.', spCost: 10, cooldown: 800, range: 9.0, lastCastTime: 0, color: '#f59e0b', level: 1, maxLevel: 10, x: 300, y: 150 },
    { id: 'arrow_shower', name: 'Arrow Shower', key: 'W', desc: 'Dispara una lluvia de flechas salvaje que empuja y daña en área de 3.5m.', spCost: 15, cooldown: 1800, range: 8.0, lastCastTime: 0, color: '#0284c7', level: 0, maxLevel: 10, x: 200, y: 250, dependencies: [{ skillId: 'double_strafe', level: 5 }, { skillId: 'vultures_eye', level: 3 }] }
  ],
  'Mage': [
    { id: 'increase_sp_rec', name: 'SP Recovery', key: 'P1', desc: 'Aceleración mental. Regenera +4 SP adicionales por nivel cada 10s de forma pasiva.', spCost: 0, cooldown: 0, range: 0, lastCastTime: 0, color: '#8b5cf6', level: 1, maxLevel: 10, x: 200, y: 50, isPassive: true },
    { id: 'fire_bolt', name: 'Fire Bolt', key: 'Q', desc: 'Lanza flechas espirituales ardientes causando daño de Fuego (150% + 20% por nivel).', spCost: 12, cooldown: 1200, range: 8.5, lastCastTime: 0, color: '#f97316', castTime: 1200, level: 1, maxLevel: 10, x: 100, y: 150 },
    { id: 'cold_bolt', name: 'Cold Bolt', key: 'W', desc: 'Lanza ráfagas de agujas gélidas que ralentizan a los objetivos.', spCost: 12, cooldown: 1200, range: 8.5, lastCastTime: 0, color: '#38bdf8', castTime: 1200, level: 0, maxLevel: 10, x: 300, y: 150 },
    { id: 'fire_wall', name: 'Fire Wall', key: 'E', desc: 'Levanta una barrera ardiente que empuja y quema a los enemigos que osen cruzarla.', spCost: 20, cooldown: 2500, range: 6.0, lastCastTime: 0, color: '#ef4444', castTime: 1000, level: 0, maxLevel: 10, x: 200, y: 250, dependencies: [{ skillId: 'fire_bolt', level: 5 }, { skillId: 'increase_sp_rec', level: 3 }] }
  ],
  'Merchant': [
    { id: 'enlarge_weight', name: 'Enlarge Weight', key: 'P1', desc: 'Fortaleza del comerciante. Otorga +200 de peso máximo pasivo por nivel.', spCost: 0, cooldown: 0, range: 0, lastCastTime: 0, color: '#fbbf24', level: 1, maxLevel: 10, x: 200, y: 50, isPassive: true },
    { id: 'mammonite', name: 'Mammonite', key: 'Q', desc: 'Golpe mercantil de oro. Consume 100z para infligir 600% de daño físico masivo.', spCost: 5, cooldown: 500, range: 2.0, lastCastTime: 0, color: '#eab308', level: 1, maxLevel: 10, x: 100, y: 150 },
    { id: 'cart_revolution', name: 'Cart Revolution', key: 'W', desc: 'Golpea a todos a tu alrededor utilizando la inercia ruda del carrito.', spCost: 12, cooldown: 1200, range: 3.5, lastCastTime: 0, color: '#92400e', level: 0, maxLevel: 10, x: 300, y: 150, dependencies: [{ skillId: 'enlarge_weight', level: 3 }] }
  ],
  'Knight': [
    { id: 'spear_mastery', name: 'Spear Mastery', key: 'P1', desc: 'Otorga +10 de daño físico por nivel al portar alabardas o lanzas.', spCost: 0, cooldown: 0, range: 0, lastCastTime: 0, color: '#ef4444', level: 1, maxLevel: 10, x: 200, y: 50, isPassive: true },
    { id: 'bash', name: 'Bash Master', key: 'Q', desc: 'Versión maestra del Bash físico que golpea con 400% de fuerza.', spCost: 15, cooldown: 800, range: 2.2, lastCastTime: 0, color: '#f59e0b', level: 10, maxLevel: 10, x: 100, y: 150 },
    { id: 'bowling_bash', name: 'Bowling Bash', key: 'W', desc: 'Embestida de voleibol que empuja y aplasta a todo un grupo de enemigos.', spCost: 28, cooldown: 1500, range: 2.5, lastCastTime: 0, color: '#dc2626', castTime: 650, level: 1, maxLevel: 10, x: 300, y: 150, dependencies: [{ skillId: 'bash', level: 10 }] }
  ],
  'Crusader': [
    { id: 'holy_cross', name: 'Holy Cross', key: 'Q', desc: 'Golpe purificador dual que daña con elemento Sagrado.', spCost: 20, cooldown: 600, range: 2.5, lastCastTime: 0, color: '#facc15', level: 1, maxLevel: 10, x: 100, y: 150 },
    { id: 'grand_cross', name: 'Grand Cross', key: 'W', desc: 'Consagra una cruz gigante de luz sagrada en el suelo.', spCost: 40, cooldown: 3000, range: 4.0, lastCastTime: 0, color: '#ffffff', castTime: 1500, level: 1, maxLevel: 10, x: 300, y: 150, dependencies: [{ skillId: 'holy_cross', level: 5 }] }
  ],
  'Wizard': [
    { id: 'fire_bolt', name: 'Fire Bolt Max', key: 'Q', desc: 'Lanzas ráfagas ígneas de alto calibre mágico.', spCost: 25, cooldown: 1200, range: 8.5, lastCastTime: 0, color: '#f97316', castTime: 1500, level: 10, maxLevel: 10, x: 100, y: 150 },
    { id: 'meteor_storm', name: 'Meteor Storm', key: 'W', desc: 'Invoca un clúster de meteoritos abrasadores que causan daño masivo y aturden.', spCost: 65, cooldown: 4500, range: 10.0, lastCastTime: 0, color: '#ef4444', castTime: 3500, level: 1, maxLevel: 10, x: 300, y: 150, dependencies: [{ skillId: 'fire_bolt', level: 10 }] }
  ],
  'Sage': [
    { id: 'earth_spike', name: 'Earth Spike', key: 'Q', desc: 'Invoca púas rocosas de la tierra perforando al objetivo.', spCost: 18, cooldown: 1000, range: 8.0, lastCastTime: 0, color: '#78350f', level: 1, maxLevel: 10, x: 100, y: 150 },
    { id: 'heaven_drive', name: 'Heaven Drive', key: 'W', desc: 'Genera un sismo destructivo en amplio radio de área.', spCost: 35, cooldown: 2500, range: 6.0, lastCastTime: 0, color: '#451a03', castTime: 2000, level: 1, maxLevel: 10, x: 300, y: 150, dependencies: [{ skillId: 'earth_spike', level: 5 }] }
  ],
  'Hunter': [
    { id: 'double_strafe', name: 'Double Strafe Max', key: 'Q', desc: 'Disparo de ráfaga rápida de arco.', spCost: 15, cooldown: 700, range: 9.0, lastCastTime: 0, color: '#14b8a6', level: 10, maxLevel: 10, x: 100, y: 150 },
    { id: 'claymore_trap', name: 'Claymore Trap', key: 'W', desc: 'Coloca una mina explosiva devastadora en el suelo.', spCost: 22, cooldown: 3000, range: 3.5, lastCastTime: 0, color: '#f97316', level: 1, maxLevel: 10, x: 300, y: 150, dependencies: [{ skillId: 'double_strafe', level: 10 }] }
  ],
  'Bard': [
    { id: 'musical_strike', name: 'Musical Strike', key: 'Q', desc: 'Vibraciones de guitarra abrasivas.', spCost: 12, cooldown: 600, range: 8.0, lastCastTime: 0, color: '#3b82f6', level: 1, maxLevel: 10, x: 100, y: 150 },
    { id: 'arrow_vulcan', name: 'Arrow Vulcan', key: 'W', desc: 'Desata una tormenta de notas silbantes.', spCost: 35, cooldown: 1500, range: 9.0, lastCastTime: 0, color: '#0ea5e9', castTime: 1000, level: 1, maxLevel: 10, x: 300, y: 150, dependencies: [{ skillId: 'musical_strike', level: 5 }] }
  ],
  'Dancer': [
    { id: 'sling_arrow', name: 'Sling Arrow', key: 'Q', desc: 'Disparo elástico coordinado.', spCost: 12, cooldown: 600, range: 8.0, lastCastTime: 0, color: '#ec4899', level: 1, maxLevel: 10, x: 100, y: 150 },
    { id: 'arrow_vulcan', name: 'Arrow Vulcan', key: 'W', desc: 'Látigo de flechas en danza furiosa.', spCost: 35, cooldown: 1500, range: 9.0, lastCastTime: 0, color: '#d946ef', castTime: 1000, level: 1, maxLevel: 10, x: 300, y: 150, dependencies: [{ skillId: 'sling_arrow', level: 5 }] }
  ],
  'Priest': [
    { id: 'heal', name: 'Heal Max', key: 'Q', desc: 'Restauración curativa suprema.', spCost: 25, cooldown: 500, range: 8.0, lastCastTime: 0, color: '#10b981', level: 10, maxLevel: 10, x: 100, y: 150 },
    { id: 'magnus_exorcismus', name: 'Magnus Exorcismus', key: 'W', desc: 'Gran cruz santa purificadora que extermina espíritus hostiles.', spCost: 55, cooldown: 5000, range: 8.0, lastCastTime: 0, color: '#7dd3fc', castTime: 4000, level: 1, maxLevel: 10, x: 300, y: 150, dependencies: [{ skillId: 'heal', level: 10 }] }
  ],
  'Monk': [
    { id: 'triple_attack', name: 'Triple Attack', key: 'Q', desc: 'Combos automáticos físicos triples.', spCost: 0, cooldown: 0, range: 2.0, lastCastTime: 0, color: '#fbbf24', level: 1, maxLevel: 10, x: 100, y: 150, isPassive: true },
    { id: 'guillotine_fist', name: 'Asura Strike', key: 'W', desc: 'Impacto rúnico absoluto. Vacía tu barra de SP en un daño abismal.', spCost: 100, cooldown: 15000, range: 2.0, lastCastTime: 0, color: '#000000', castTime: 2000, level: 1, maxLevel: 10, x: 300, y: 150, dependencies: [{ skillId: 'triple_attack', level: 5 }] }
  ],
  'Blacksmith': [
    { id: 'mammonite', name: 'Mammonite Max', key: 'Q', desc: 'Impacto financiero supremo.', spCost: 10, cooldown: 400, range: 2.0, lastCastTime: 0, color: '#facc15', level: 10, maxLevel: 10, x: 100, y: 150 },
    { id: 'cart_termination', name: 'Cart Termination', key: 'W', desc: 'Impacto total del carro de compras causando daño brutal y aturdiendo.', spCost: 35, cooldown: 2000, range: 2.5, lastCastTime: 0, color: '#7f1d1d', level: 1, maxLevel: 10, x: 300, y: 150, dependencies: [{ skillId: 'mammonite', level: 10 }] }
  ],
  'Alchemist': [
    { id: 'acid_terror', name: 'Acid Terror', key: 'Q', desc: 'Lanza viales de ácido corrosivo perforante.', spCost: 15, cooldown: 1000, range: 7.0, lastCastTime: 0, color: '#65a30d', level: 1, maxLevel: 10, x: 100, y: 150 },
    { id: 'bomb', name: 'Bomb', key: 'W', desc: 'Granada de fósforo químico incendiario para incendiar un área.', spCost: 15, cooldown: 1500, range: 7.0, lastCastTime: 0, color: '#ea580c', level: 1, maxLevel: 10, x: 300, y: 150, dependencies: [{ skillId: 'acid_terror', level: 5 }] }
  ],
  'Assassin': [
    { id: 'sonic_blow', name: 'Sonic Blow', key: 'Q', desc: 'Tempestad de 8 cortes veloces al usar garras de Katar.', spCost: 30, cooldown: 1200, range: 2.0, lastCastTime: 0, color: '#8b5cf6', level: 1, maxLevel: 10, x: 100, y: 150 },
    { id: 'venom_splasher', name: 'Venom Splasher', key: 'W', desc: 'Bomba tóxica que detona en el oponente tras 3 segundos.', spCost: 24, cooldown: 4000, range: 2.5, lastCastTime: 0, color: '#166534', level: 1, maxLevel: 10, x: 300, y: 150, dependencies: [{ skillId: 'sonic_blow', level: 5 }] }
  ],
  'Rogue': [
    { id: 'back_stab', name: 'Back Stab', key: 'Q', desc: 'Golpe a traición letal desde la espalda.', spCost: 16, cooldown: 800, range: 2.0, lastCastTime: 0, color: '#4c1d95', level: 1, maxLevel: 10, x: 100, y: 150 },
    { id: 'strip_shield', name: 'Strip Shield', key: 'W', desc: 'Intento de remover el escudo protector de tu rival.', spCost: 20, cooldown: 2500, range: 2.0, lastCastTime: 0, color: '#64748b', level: 1, maxLevel: 5, x: 300, y: 150, dependencies: [{ skillId: 'back_stab', level: 5 }] }
  ],
  'Lord Knight': [
    { id: 'bash', name: 'Bash High', key: 'Q', desc: 'Golpe letal mejorado con furia de combate noble.', spCost: 15, cooldown: 800, range: 2.2, lastCastTime: 0, color: '#f59e0b', level: 10, maxLevel: 10, x: 100, y: 150 },
    { id: 'bowling_bash', name: 'Bowling Bash', key: 'W', desc: 'Aplasta grupos enteros con fuerza ciclónica.', spCost: 28, cooldown: 1500, range: 2.5, lastCastTime: 0, color: '#dc2626', level: 1, maxLevel: 10, x: 300, y: 150, dependencies: [{ skillId: 'bash', level: 10 }] }
  ],
  'Paladin': [
    { id: 'holy_cross', name: 'Holy Cross High', key: 'Q', desc: 'Daño santa dual definitivo.', spCost: 20, cooldown: 500, range: 2.5, lastCastTime: 0, color: '#facc15', level: 10, maxLevel: 10, x: 100, y: 150 },
    { id: 'shield_boomerang', name: 'Shield Boomerang', key: 'W', desc: 'Lanza el escudo bumerán causando daño lineal directo.', spCost: 12, cooldown: 1000, range: 9.0, lastCastTime: 0, color: '#94a3b8', level: 1, maxLevel: 5, x: 300, y: 150, dependencies: [{ skillId: 'holy_cross', level: 10 }] }
  ],
  'High Wizard': [
    { id: 'fire_bolt', name: 'Fire Bolt High', key: 'Q', desc: 'Lanza ráfagas de meteoritos rúnicos duales.', spCost: 30, cooldown: 1000, range: 9.0, lastCastTime: 0, color: '#f97316', level: 10, maxLevel: 10, x: 100, y: 150 },
    { id: 'chain_lightning', name: 'Chain Lightning', key: 'W', desc: 'Rayo concatenado que se bifurca rebotando entre enemigos.', spCost: 45, cooldown: 3000, range: 10.0, lastCastTime: 0, color: '#6366f1', castTime: 2000, level: 1, maxLevel: 10, x: 300, y: 150, dependencies: [{ skillId: 'fire_bolt', level: 10 }] }
  ],
  'Professor': [
    { id: 'heaven_drive', name: 'Heaven Drive High', key: 'Q', desc: 'Sismo telúrico definitivo en área.', spCost: 35, cooldown: 2000, range: 7.0, lastCastTime: 0, color: '#451a03', level: 10, maxLevel: 10, x: 100, y: 150 },
    { id: 'double_bolt', name: 'Double Bolt', key: 'W', desc: 'Multiplica los proyectiles mágicos duplicando el impacto elemental.', spCost: 0, cooldown: 0, range: 0, lastCastTime: 0, color: '#8b5cf6', level: 1, maxLevel: 10, x: 300, y: 150, dependencies: [{ skillId: 'heaven_drive', level: 10 }] }
  ],
  'Sniper': [
    { id: 'double_strafe', name: 'Double Strafe High', key: 'Q', desc: 'Disparo gemelo de alta tensión e impacto penetrante.', spCost: 12, cooldown: 700, range: 9.0, lastCastTime: 0, color: '#14b8a6', level: 10, maxLevel: 10, x: 100, y: 150 },
    { id: 'falcon_strike', name: 'Blitz Beat High', key: 'W', desc: 'Daño de ráfaga física de tu Halcón ignorando defensa física.', spCost: 30, cooldown: 2000, range: 10.0, lastCastTime: 0, color: '#3b82f6', castTime: 1000, level: 1, maxLevel: 10, x: 300, y: 150, dependencies: [{ skillId: 'double_strafe', level: 10 }] }
  ],
  'Clown': [
    { id: 'musical_strike', name: 'Musical Strike High', key: 'Q', desc: 'Acorde fúnebre abrasador.', spCost: 15, cooldown: 500, range: 9.0, lastCastTime: 0, color: '#3b82f6', level: 10, maxLevel: 10, x: 100, y: 150 },
    { id: 'vulcan_arm', name: 'Arrow Vulcan XL', key: 'W', desc: 'Ráfaga supersónica de acordes de flechas.', spCost: 45, cooldown: 1200, range: 10.0, lastCastTime: 0, color: '#0ea5e9', level: 1, maxLevel: 10, x: 300, y: 150, dependencies: [{ skillId: 'musical_strike', level: 10 }] }
  ],
  'Gypsy': [
    { id: 'sling_arrow', name: 'Sling Arrow High', key: 'Q', desc: 'Danza elástica armada letal.', spCost: 15, cooldown: 500, range: 9.0, lastCastTime: 0, color: '#ec4899', level: 10, maxLevel: 10, x: 100, y: 150 },
    { id: 'vulcan_arm', name: 'Arrow Vulcan XL', key: 'W', desc: 'Danza mortal rítmica de 12 golpes de flecha.', spCost: 45, cooldown: 1200, range: 10.0, lastCastTime: 0, color: '#d946ef', level: 1, maxLevel: 10, x: 300, y: 150, dependencies: [{ skillId: 'sling_arrow', level: 10 }] }
  ],
  'High Priest': [
    { id: 'heal', name: 'Heal High', key: 'Q', desc: 'Luz sanadora de arcángel.', spCost: 20, cooldown: 500, range: 8.0, lastCastTime: 0, color: '#10b981', level: 10, maxLevel: 10, x: 100, y: 150 },
    { id: 'holy_light', name: 'Holy Light Max', key: 'W', desc: 'Golpe celestial fulminante contra demonios y sombras.', spCost: 12, cooldown: 900, range: 7.5, lastCastTime: 0, color: '#38bdf8', level: 10, maxLevel: 10, x: 300, y: 150, dependencies: [{ skillId: 'heal', level: 10 }] }
  ],
  'Champion': [
    { id: 'guillotine_fist', name: 'Asura Strike High', key: 'Q', desc: 'Impacto total de puño de luz desatado.', spCost: 100, cooldown: 10000, range: 2.0, lastCastTime: 0, color: '#000000', level: 10, maxLevel: 10, x: 100, y: 150 },
    { id: 'steel_body', name: 'Steel Body', key: 'W', desc: 'Inmunidad a stagger y +80% DEF temporal pero reduce paso.', spCost: 50, cooldown: 60000, range: 0, lastCastTime: 0, color: '#94a3b8', level: 1, maxLevel: 5, x: 300, y: 150, dependencies: [{ skillId: 'guillotine_fist', level: 10 }] }
  ],
  'Whitesmith': [
    { id: 'cart_termination', name: 'Cart Termination High', key: 'Q', desc: 'Demolición con carro rúnico.', spCost: 35, cooldown: 1800, range: 2.5, lastCastTime: 0, color: '#7f1d1d', level: 10, maxLevel: 10, x: 100, y: 150 },
    { id: 'maximum_power_thrust', name: 'Max Power Thrust', key: 'W', desc: 'Aumenta un 35% tu ataque físico general a expensas de zenys.', spCost: 50, cooldown: 60000, range: 0, lastCastTime: 0, color: '#ea580c', level: 1, maxLevel: 5, x: 300, y: 150, dependencies: [{ skillId: 'cart_termination', level: 10 }] }
  ],
  'Creator': [
    { id: 'acid_demonstration', name: 'Acid Demonstration', key: 'Q', desc: 'Lanza fuegos y ácidos encadenados destruyendo la armadura del oponente.', spCost: 40, cooldown: 1000, range: 8.0, lastCastTime: 0, color: '#ef4444', level: 1, maxLevel: 10, x: 100, y: 150 },
    { id: 'potion_pitcher', name: 'Potion Pitcher', key: 'W', desc: 'Cura y restaura SP a aliados arrojándoles elixires sagrados.', spCost: 10, cooldown: 500, range: 8.0, lastCastTime: 0, color: '#10b981', level: 1, maxLevel: 10, x: 300, y: 150, dependencies: [{ skillId: 'acid_demonstration', level: 5 }] }
  ],
  'Assassin Cross': [
    { id: 'sonic_blow', name: 'Sonic Blow Master', key: 'Q', desc: 'Ráfaga de 8 cuchilladas rápidas asestadas con fuerza titánica.', spCost: 34, cooldown: 1200, range: 2.0, lastCastTime: 0, color: '#8b5cf6', level: 1, maxLevel: 10, x: 100, y: 150 },
    { id: 'grimtooth', name: 'Grimtooth', key: 'W', desc: 'Embiste con ondas de choque sigilosas desde la clandestinidad.', spCost: 18, cooldown: 1000, range: 6.0, lastCastTime: 0, color: '#ec4899', level: 1, maxLevel: 10, x: 300, y: 150, dependencies: [{ skillId: 'sonic_blow', level: 5 }] }
  ],
  'Stalker': [
    { id: 'back_stab_high', name: 'Back Stab High', key: 'Q', desc: 'Impacto letal sigiloso definitivo.', spCost: 20, cooldown: 500, range: 2.0, lastCastTime: 0, color: '#4c1d95', level: 10, maxLevel: 10, x: 100, y: 150 },
    { id: 'chase_walk', name: 'Chase Walk', key: 'W', desc: 'Ocultamiento absoluto mientras te arrastras con celeridad.', spCost: 5, cooldown: 1000, range: 0, lastCastTime: 0, color: '#1e293b', level: 1, maxLevel: 5, x: 300, y: 150, dependencies: [{ skillId: 'back_stab_high', level: 10 }] }
  ],
};

export const useGameStore = create<GameStoreState>((set, get) => ({
  currentMap: 'prontera',
  setMap: (mapName) => set({ currentMap: mapName }),
  warpFadeActive: false,
  setWarpFade: (active) => set({ warpFadeActive: active }),
  jobClass: 'Novice',
  stats: defaultStats['Novice'],
  baseStats: defaultStats['Novice'],
  currentHp: defaultStats['Novice'].maxHp,
  currentSp: defaultStats['Novice'].maxSp,
  playerBaseExp: 0,
  playerBaseMaxExp: 100,
  playerJobExp: 0,
  playerJobMaxExp: 80,
  potCount: 15,
  headgear: 'none',

  maxInventorySlots: INITIAL_MAX_SLOTS,
  inventory: [
    {
      id: 'red_potion',
      name: 'Red Potion',
      quantity: 15,
      type: 'consumable',
      slotIndex: 0,
      instanceId: 'starter_pots',
      description: 'A potion brewed from red herbs. Restores 25% of Max HP and +10 * VIT.',
      icon: 'Wine',
      rarity: 'normal',
      weight: 2,
      maxStack: 100,
      sellValue: 15,
      metadata: {}
    },
    {
      id: 'jellopy',
      name: 'Jellopy',
      quantity: 10,
      type: 'material',
      slotIndex: 1,
      instanceId: 'starter_jellopies',
      description: 'A mysterious translucent crystalline gemstone commonly dropped by Porings.',
      icon: 'Sparkles',
      rarity: 'normal',
      weight: 1,
      maxStack: 999,
      sellValue: 5,
      metadata: {}
    },
    {
      id: 'sticky_mucus',
      name: 'Sticky Mucus',
      quantity: 3,
      type: 'material',
      slotIndex: 2,
      instanceId: 'starter_mucus',
      description: 'A viscous gel extracted from slimes. Used heavily in generic alchemy.',
      icon: 'Droplets',
      rarity: 'normal',
      weight: 1,
      maxStack: 999,
      sellValue: 8,
      metadata: {}
    },
    {
      id: 'iron_sword',
      name: 'Iron Sword',
      quantity: 1,
      type: 'weapon',
      slotIndex: 3,
      instanceId: 'starter_sword',
      description: 'A balanced single-handed sword forged with high grade pig iron.',
      icon: 'Sword',
      rarity: 'normal',
      weight: 45,
      maxStack: 1,
      sellValue: 75,
      slot: 'rightHand',
      stats: { atk: 18 },
      metadata: {}
    }
  ],
  equippedItems: {},

  activeCast: null,
  battleMode: false,
  autoBattle: false,
  autoPickupEnabled: true,
  showCombatLog: true,
  showInventory: false,
  closeNpcDialogue: () => set({ npcDialogue: null }),

  lootTables: {
    poring: [
      { itemId: 'jellopy', chance: 0.70 },
      { itemId: 'sticky_mucus', chance: 0.30 },
      { itemId: 'red_potion', chance: 0.15 }
    ],
    poporing: [
      { itemId: 'sticky_mucus', chance: 0.65 },
      { itemId: 'red_potion', chance: 0.35 },
      { itemId: 'steel', chance: 0.10 }
    ],
    pecopeco: [
      { itemId: 'red_potion', chance: 0.50 },
      { itemId: 'awakening_potion', chance: 0.15 },
      { itemId: 'iron_sword', chance: 0.08 },
      { itemId: 'clip_of_wisdom', chance: 0.04 }
    ],
    boss_mvp: [
      { itemId: 'baphomet_horn', chance: 1.00 },
      { itemId: 'mvp_coin', chance: 0.90 },
      { itemId: 'legendary_katar', chance: 0.25 },
      { itemId: 'rare_armor', chance: 0.20 },
      { itemId: 'awakening_potion', chance: 0.60 }
    ]
  },
  pickupNotifications: [],
  systemToast: null,
  showSystemToast: (text) => {
    set({ systemToast: text });
    setTimeout(() => {
      if (get().systemToast === text) {
        set({ systemToast: null });
      }
    }, 3000);
  },

  targetEntityId: null,
  targetHp: 0,
  targetMaxHp: 0,
  targetName: 'Ninguno',
  playerAttackPulse: 0,
  comboCount: 0,
  comboTimer: 0,
  killStreakCount: 0,
  killStreakTimer: 0,

  npcDialogue: null,
  activeBuffs: [],
  activeStatusEffects: [],

  combatLogs: [
    { id: '1', text: '¡Bienvenido a Ragnarok Mobile Input Engine!', type: 'system', timestamp: '00:28' },
    { id: '2', text: 'Usa TAPS en pantalla para moverte y atacar monstruos, o activa JOYSTICK.', type: 'system', timestamp: '00:28' },
    { id: '3', text: 'El búfer de entrada (Input Buffer) encolará tus comandos para una respuesta en tiempo real.', type: 'system', timestamp: '00:28' },
  ],

  skills: defaultSkills['Novice'],
  skillPoints: 0,
  statPoints: 0,
  equippedSkills: ['first_aid', 'basic_skill', 'play_dead', null],
  
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

    // Check pre-requisite dependencies
    if (skill.dependencies && skill.dependencies.length > 0) {
      for (const dep of skill.dependencies) {
        const depSkill = skillList.find(s => s.id === dep.skillId);
        if (!depSkill || depSkill.level < dep.level) {
          const reqSkillName = depSkill?.name || dep.skillId;
          state.addCombatLog(`❌ Requiere [${reqSkillName}] Nivel ${dep.level} antes de aprender [${skill.name}].`, 'system');
          gameAudio.playFail();
          return;
        }
      }
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

  assignSkillToHotbar: (skillId, slotIndex) => {
    const state = get();
    const newEquipped = [...state.equippedSkills];
    
    // If the skill is already in another slot, clear that slot (allow reordering)
    const existingIndex = newEquipped.indexOf(skillId);
    if (existingIndex !== -1) {
      newEquipped[existingIndex] = null;
    }

    newEquipped[slotIndex] = skillId;
    set({ equippedSkills: newEquipped });
    state.saveGame();
  },

  allocateStatPoint: (statName) => {
    const state = get();
    if (state.statPoints <= 0) return;
    
    const newBaseStats = { ...state.baseStats };
    // @ts-ignore
    const oldVal = newBaseStats[statName] || 0;
    // @ts-ignore
    newBaseStats[statName] = oldVal + 1;
    
    set({
      baseStats: newBaseStats,
      statPoints: state.statPoints - 1
    });
    
    get().recalculateStats();
    
    // Impact heals on vit/int increase
    if (statName === 'vit') {
        const hpBonus = 15; // Matches recalculateStats logic per point
        set({ currentHp: Math.min(get().stats.maxHp, get().currentHp + hpBonus) });
    }
    if (statName === 'int') {
        const spBonus = 5;
        set({ currentSp: Math.min(get().stats.maxSp, get().currentSp + spBonus) });
    }

    get().addCombatLog(`Estadística mejorada: ${statName.toUpperCase()}. Puntos restantes: ${get().statPoints}`, 'system');
    get().saveGame();
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

  isJoystickEnabled: false,
  isMultitouchSupported: true,
  activeInputMode: 'touch_target',
  showConfigPanel: false,

  // Camera Settings Defaults
  cameraZoom: 1.0,
  cameraAngleY: 0,
  cameraOffsetZ: 2.2, // Default offset to move character slightly up, giving lots of click space below !

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
            skills: defaultSkills['Novice'],
            equippedSkills: (defaultSkills['Novice'].map(s => s.id) as (string | null)[]).concat([null, null, null, null]).slice(0, 4)
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
      equippedSkills: (selectedSkills.map(s => s.id) as (string | null)[]).concat([null, null, null, null]).slice(0, 4),
      skillPoints: 0, 
      playerJobExp: 0,
      playerJobMaxExp: 100,
      targetEntityId: null,
      bufferingQueue: [],
      activeCast: null,
      battleMode: false,
      equippedItems: {},
    });
    get().addCombatLog(`¡Has avanzado a ${job}!`, 'system');
    get().saveGame();
  },

  equipItem: (itemId, slot) => {
    const state = get();
    // Find item in inventory matching the ID
    const idx = state.inventory.findIndex(i => i.id === itemId && (i.type === 'weapon' || i.type === 'armor' || i.type === 'accessory' || i.type === 'equipment'));
    if (idx === -1) return;
    const item = state.inventory[idx];

    // Job restriction check
    if (item.allowedJobs && item.allowedJobs.length > 0 && !item.allowedJobs.includes(state.jobClass)) {
      state.addCombatLog(`❌ Tu clase actual (${state.jobClass}) no puede equipar este objeto.`, 'system');
      return;
    }

    // Intelligent Accessory Routing (allocate click items to free accessory slot if one occupied)
    let targetSlot = slot;
    if (item.type === 'accessory' || item.slot === 'accessory1' || item.slot === 'accessory2') {
      if (slot !== 'accessory1' && slot !== 'accessory2') {
        targetSlot = state.equippedItems['accessory1'] ? 'accessory2' : 'accessory1';
      } else if (slot === 'accessory1' && state.equippedItems['accessory1'] && !state.equippedItems['accessory2']) {
        targetSlot = 'accessory2';
      } else if (slot === 'accessory2' && state.equippedItems['accessory2'] && !state.equippedItems['accessory1']) {
        targetSlot = 'accessory1';
      }
    }

    const currentEquipped = state.equippedItems[targetSlot];
    let updatedInventory = [...state.inventory];
    
    // Remove old item
    updatedInventory.splice(idx, 1);

    const newEquippedItems = { ...state.equippedItems, [targetSlot]: item };

    if (currentEquipped) {
      // Put currently equipped back into the slot index that was occupied by the equipped item if possible
      const putResult = InventoryManager.addItem(
        updatedInventory as any,
        currentEquipped.id,
        1,
        state.maxInventorySlots
      );
      if (putResult.success) {
        const addedItem = putResult.slots[putResult.slots.length - 1];
        if (addedItem && item.slotIndex !== undefined) {
          addedItem.slotIndex = item.slotIndex;
        }
        updatedInventory = putResult.slots as any;
      }
    }

    set({
      equippedItems: newEquippedItems,
      inventory: updatedInventory
    });

    get().recalculateStats();
    get().saveGame();
    get().addCombatLog(`Equipado: [${item.name}] en ranura [${targetSlot}].`, 'system');
  },

  unequipItem: (slot) => {
    const state = get();
    const equipped = state.equippedItems[slot];
    if (!equipped) return;

    const newEquipped = { ...state.equippedItems };
    delete newEquipped[slot];

    const putResult = InventoryManager.addItem(
      state.inventory as any,
      equipped.id,
      1,
      state.maxInventorySlots
    );

    if (!putResult.success) {
      state.addCombatLog('❌ Tu mochila está llena. No puedes desequipar este objeto.', 'system');
      return;
    }

    set({
      equippedItems: newEquipped,
      inventory: putResult.slots as any
    });

    get().recalculateStats();
    get().saveGame();
    get().addCombatLog(`Desequipado: [${equipped.name}]. Se guardó en la mochila.`, 'system');
  },

  recalculateStats: () => {
    const state = get();
    if (!state.baseStats) return;
    
    const defaultJobStats = defaultStats[state.jobClass] || defaultStats['Novice'];
    const newStats = { ...defaultJobStats };
    
    // Level and jobLevel
    newStats.level = state.baseStats.level;
    newStats.jobLevel = state.baseStats.jobLevel;

    // Base attributes are stored in baseStats (which includes manual statutory allocations)
    newStats.str = state.baseStats.str;
    newStats.agi = state.baseStats.agi;
    newStats.vit = state.baseStats.vit;
    newStats.int = state.baseStats.int;
    newStats.dex = state.baseStats.dex;
    newStats.luk = state.baseStats.luk;

    // Now let's calculate equipment/buff adjustments
    const attrBuffs = { str: 0, agi: 0, vit: 0, int: 0, dex: 0, luk: 0, atk: 0, def: 0, aspd: 0 };

    Object.values(state.equippedItems).forEach(item => {
        if (item && item.stats) {
            attrBuffs.atk += item.stats.atk || 0;
            attrBuffs.def += item.stats.def || 0;
            attrBuffs.str += item.stats.str || 0;
            attrBuffs.agi += item.stats.agi || 0;
            attrBuffs.vit += item.stats.vit || 0;
            attrBuffs.int += item.stats.int || 0;
            attrBuffs.dex += item.stats.dex || 0;
            attrBuffs.luk += item.stats.luk || 0;
        }
    });

    state.activeBuffs.forEach(buff => {
        if (buff.stats) {
            attrBuffs.atk += buff.stats.atk || 0;
            attrBuffs.def += buff.stats.def || 0;
            attrBuffs.str += buff.stats.str || 0;
            attrBuffs.agi += buff.stats.agi || 0;
            attrBuffs.vit += buff.stats.vit || 0;
            attrBuffs.int += buff.stats.int || 0;
            attrBuffs.dex += buff.stats.dex || 0;
            attrBuffs.luk += buff.stats.luk || 0;
            attrBuffs.aspd += buff.stats.aspd || 0;
        }
        if (!buff.stats) {
            if (buff.id === 'increase_agi') {
                attrBuffs.agi += 20;
            } else if (buff.id === 'blessing') {
                attrBuffs.str += 20;
                attrBuffs.int += 20;
                attrBuffs.dex += 20;
            }
        }
    });

    // Write final total attributes (base + buffs/equipment):
    newStats.str += attrBuffs.str;
    newStats.agi += attrBuffs.agi;
    newStats.vit += attrBuffs.vit;
    newStats.int += attrBuffs.int;
    newStats.dex += attrBuffs.dex;
    newStats.luk += attrBuffs.luk;

    // Now recalculate derivative stats using total attributes!
    // Every 1 STR gives 2 ATK
    const strDiff = newStats.str - defaultJobStats.str;
    newStats.atk = defaultJobStats.atk + (strDiff * 2) + attrBuffs.atk;

    // Every 1 VIT gives 15 maxHp, and 0.5 DEF
    const vitDiff = newStats.vit - defaultJobStats.vit;
    newStats.maxHp = defaultJobStats.maxHp + (vitDiff * 15);
    newStats.def = Math.floor(defaultJobStats.def + (vitDiff * 0.5) + attrBuffs.def);

    // Every 1 INT gives 5 maxSp
    const intDiff = newStats.int - defaultJobStats.int;
    newStats.maxSp = defaultJobStats.maxSp + (intDiff * 5);

    // Every 1 DEX gives 1.5 HIT
    const dexDiff = newStats.dex - defaultJobStats.dex;
    newStats.hit = Math.floor(defaultJobStats.hit + (dexDiff * 1.5));

    // Every 1 AGI gives 1.0 FLEE and 0.5 ASPD
    const agiDiff = newStats.agi - defaultJobStats.agi;
    newStats.flee = defaultJobStats.flee + agiDiff;
    newStats.aspd = Math.floor(defaultJobStats.aspd + (agiDiff * 0.5) + attrBuffs.aspd);

    set({ stats: newStats });
  },

  addItem: (item) => {
    const r = get().addItemSlot(item.id, item.quantity);
    if (r.success) {
      get().saveGame();
    }
  },

  addItemSlot: (itemId, quantity) => {
    const state = get();
    const cleanId = itemId.trim().toLowerCase();
    const result = InventoryManager.addItem(state.inventory as any, cleanId, quantity, state.maxInventorySlots);
    if (result.success || result.added > 0) {
      const info = ITEM_DATABASE[cleanId];
      const displayName = info ? info.name : itemId;
      set({ inventory: result.slots as any });
      
      const realQuantity = result.success ? quantity : result.added;
      state.addCombatLog(
        result.success 
          ? `Obtenido: ${quantity}x [${displayName}]` 
          : `Obtenido parcialmente: ${result.added}x [${displayName}] (¡Mochila llena!)`, 
        'system'
      );
      
      if (info) {
        state.addPickupNotification(
          info.name,
          realQuantity,
          info.rarity === 'normal' ? 'common' : info.rarity,
          info.type,
          info.icon
        );
      }
    } else {
      state.addCombatLog(`❌ ¡Mochila llena! No se pudo recoger de la tierra.`, 'system');
    }
    return { success: result.success, added: result.added };
  },

  removeItemBySlotIndex: (slotIndex, quantity) => {
    const state = get();
    const result = InventoryManager.removeItemBySlotIndex(state.inventory as any, slotIndex, quantity);
    if (result.success) {
      set({ inventory: result.slots as any });
    }
    return { success: result.success, removed: result.removed };
  },

  swapSlots: (fromIndex, toIndex) => {
    const state = get();
    const swapped = InventoryManager.swapSlots(state.inventory as any, fromIndex, toIndex, state.maxInventorySlots);
    set({ inventory: swapped as any });
    get().saveGame();
  },

  sortInventory: () => {
    const state = get();
    const sorted = InventoryManager.sortAndDefragment(state.inventory as any);
    set({ inventory: sorted as any });
    state.addCombatLog('🎒 Mochila organizada automáticamente por categoría y rareza.', 'system');
    get().saveGame();
  },

  getWeightInfo: () => {
    const state = get();
    const current = InventoryManager.calculateTotalWeight(state.inventory as any);
    const max = InventoryManager.calculateMaxWeightCapacity(state.stats.str);
    const percent = max > 0 ? (current / max) * 100 : 0;
    return { current, max, percent };
  },

  increaseMaxSlots: (amount) => {
    set((state) => ({ maxInventorySlots: state.maxInventorySlots + amount }));
    get().addCombatLog(`🎒 ¡Mochila expandida! Capacidad incrementada en +${amount} ranuras.`, 'system');
    get().saveGame();
  },

  useConsumable: (slotIndex) => {
    const state = get();
    const slotItem = state.inventory.find(i => i.slotIndex === slotIndex);
    if (!slotItem) return;

    if (slotItem.type !== 'consumable') return;

    if (state.currentHp <= 0) {
      state.addCombatLog('No puedes usar consumibles si estás derrotado.', 'system');
      return;
    }

    const { metadata, name } = slotItem;
    if (!metadata) {
      const res = get().removeItemBySlotIndex(slotIndex, 1);
      if (res.success) {
        state.addCombatLog(`Utilizado: [${name}].`, 'system');
      }
      get().saveGame();
      return;
    }
    let effectTriggered = false;

    // 1. HP Recovery
    if (metadata.healPercent || metadata.healVitMult || metadata.healFixed) {
       if (state.currentHp >= state.stats.maxHp) {
         state.addCombatLog('Tu vida ya está al máximo.', 'system');
         return;
       }
       const percentHeal = metadata.healPercent ? Math.floor(state.stats.maxHp * metadata.healPercent) : 0;
       const vitHeal = metadata.healVitMult ? (state.stats.vit * metadata.healVitMult) : 0;
       const fixedHeal = metadata.healFixed || 0;
       const healAmount = Math.floor(percentHeal + vitHeal + fixedHeal);
       const newHp = Math.min(state.stats.maxHp, state.currentHp + healAmount);
       
       set({ currentHp: newHp });
       state.addCombatLog(`Usas [${name}]: +${healAmount} HP sanados!`, 'heal');
       
       // Sync with Engine for floating text
       if (state.engineInstance?.floatingTextSpawner) {
         const playerPos = state.engineInstance.playerEntity || { x: 0, z: 0 };
         state.engineInstance.floatingTextSpawner(`+${healAmount} HP`, '#10b981', 1.8, playerPos.x, 2.5, playerPos.z);
       }
       effectTriggered = true;
    }

    // 2. SP Recovery
    if (metadata.healSpPercent || metadata.healIntMult || metadata.healSpFixed) {
      if (state.currentSp >= state.stats.maxSp && !effectTriggered) {
        state.addCombatLog('Tu energía ya está al máximo.', 'system');
        return;
      }
      const percentSp = metadata.healSpPercent ? Math.floor(state.stats.maxSp * metadata.healSpPercent) : 0;
      const intSp = metadata.healIntMult ? (state.stats.int * metadata.healIntMult) : 0;
      const fixedSp = metadata.healSpFixed || 0;
      const spAmount = Math.floor(percentSp + intSp + fixedSp);
      const newSp = Math.min(state.stats.maxSp, state.currentSp + spAmount);
      
      set({ currentSp: newSp });
      state.addCombatLog(`Usas [${name}]: +${spAmount} SP recuperados.`, 'heal');
      
      if (state.engineInstance?.floatingTextSpawner) {
        const playerPos = state.engineInstance.playerEntity || { x: 0, z: 0 };
        state.engineInstance.floatingTextSpawner(`+${spAmount} SP`, '#3b82f6', 1.6, playerPos.x, 2.2, playerPos.z);
      }
      effectTriggered = true;
    }

    // 3. Cleanse
    if (metadata.cleanseStatusEffects) {
      if (state.activeStatusEffects.length > 0) {
        set({ activeStatusEffects: [] });
        state.addCombatLog(`¡Usas [${name}]! Todos los estados negativos purificados.`, 'system');
        effectTriggered = true;
      }
    }

    // 4. Buffs
    if (metadata.buffId) {
      state.addBuff({
        id: metadata.buffId,
        name: metadata.buffName || name,
        durationMs: metadata.duration || 30000,
        maxDurationMs: metadata.duration || 30000,
        icon: metadata.buffIcon || '✨',
        description: metadata.description || 'Efecto activo por consumible',
        stats: metadata.stats
      });
      state.addCombatLog(`¡Utilizas [${name}]! Efecto activo: ${metadata.buffName || name}.`, 'heal');
      effectTriggered = true;
    }

    // 5. Special Effects
    if (metadata.specialEffect === 'mystery_random') {
       const rolls = ['exp', 'zeny', 'buff', 'nothing'];
       const roll = rolls[Math.floor(Math.random() * rolls.length)];
       if (roll === 'exp') {
         state.addExp(500, 200);
       } else if (roll === 'buff') {
         state.addBuff({ id: 'lucky_bonus', name: 'Luck of the Draw', durationMs: 60000, maxDurationMs: 60000, icon: '🍀', description: 'Feeling lucky!' });
       }
       state.addCombatLog(`¡El Pergamino Misterioso ha revelado su secreto: ${roll}!`, 'system');
       effectTriggered = true;
    }

    // consume item if any effect worked or implicitly by default for types not mapped
    const res = get().removeItemBySlotIndex(slotIndex, 1);
    if (res.success) {
      if (!effectTriggered) state.addCombatLog(`Utilizado: [${name}].`, 'system');
    }

    get().saveGame();
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
    set((state) => {
      let bExp = state.playerBaseExp + base;
      let bMax = state.playerBaseMaxExp;
      let lvl = state.stats.level;
      let baseLeveledUp = false;
      let grantedStatPoints = 0;

      while (bExp >= bMax && lvl < 99) {
        bExp -= bMax;
        lvl += 1;
        baseLeveledUp = true;
        // Accurate level-based stat point reward formula matching classic RO style
        grantedStatPoints += Math.floor(lvl / 5) + 3;
        bMax = Math.floor(bMax * 1.35);
      }

      let jExp = state.playerJobExp + job;
      let jMax = state.playerJobMaxExp;
      let jLvl = state.stats.jobLevel;
      let jobLeveledUp = false;
      let addedSkillPoints = 0;

      // Classify max Job Level limits (Novices and T1: 50, T2 and Trans: 70)
      const maxJLevel = ['Novice', 'Swordsman', 'Mage', 'Archer', 'Acolyte', 'Merchant', 'Thief'].includes(state.jobClass) ? 50 : 70;

      while (jExp >= jMax && jLvl < maxJLevel) {
        jExp -= jMax;
        jLvl += 1;
        jobLeveledUp = true;
        addedSkillPoints += 1;
        jMax = Math.floor(jMax * 1.25);
      }

      const updatedStats = { ...state.stats, level: lvl, jobLevel: jLvl };
      const anyLvlUp = baseLeveledUp || jobLeveledUp;

      if (anyLvlUp && state.engineInstance?.gameRenderer) {
        // Trigger visual effect in engine
        const fxMesh = state.engineInstance.gameRenderer.createSkillVisualMesh('level_up', state.engineInstance.playerEntity.x, state.engineInstance.playerEntity.z, 0.05);
        state.engineInstance.activeEffects.push({
          id: `levelup_${Math.random()}`,
          type: 'level_up',
          mesh: fxMesh,
          age: 0,
          maxAge: 60,
          x: state.engineInstance.playerEntity.x,
          z: state.engineInstance.playerEntity.z
        });
        gameAudio.playHeal(); // Level up sound

        if (baseLeveledUp) {
          state.addCombatLog(`✨ ¡Has subido de Base Level a Lv ${lvl}! (+${grantedStatPoints} Sat Points)`, 'system');
        }
        if (jobLeveledUp) {
          state.addCombatLog(`✨ ¡Has subido de Job Level a Lv ${jLvl}! (+${addedSkillPoints} Skill Points)`, 'system');
        }
      }

      return {
        playerBaseExp: bExp,
        playerBaseMaxExp: bMax,
        playerJobExp: jExp,
        playerJobMaxExp: jMax,
        stats: updatedStats,
        skillPoints: state.skillPoints + addedSkillPoints,
        statPoints: state.statPoints + grantedStatPoints,
        currentHp: baseLeveledUp ? updatedStats.maxHp : state.currentHp,
        currentSp: baseLeveledUp ? updatedStats.maxSp : state.currentSp
      };
    });
  },

  drinkPotion: () => {
    const state = get();
    if (state.potCount <= 0) {
      state.addCombatLog('¡No te quedan Red Potions!', 'system');
      return;
    }
    if (state.currentHp >= state.stats.maxHp) {
      state.addCombatLog('Tu vida ya está al máximo.', 'system');
      return;
    }

    const healAmount = Math.floor(state.stats.maxHp * 0.25 + state.stats.vit * 10);
    const newHp = Math.min(state.stats.maxHp, state.currentHp + healAmount);
    
    set({
      potCount: state.potCount - 1,
      currentHp: newHp,
      inventory: state.inventory.map(item => 
        item.id === 'red_potion' ? { ...item, quantity: item.quantity - 1 } : item
      )
    });

    state.addCombatLog(`Usas Red Potion: +${healAmount} HP sanados!`, 'heal');
  },

  setPotCount: (count) => {
    set({ potCount: count });
  },

  setHeadgear: (id) => {
    set({ headgear: id });
  },

  setTarget: (id, name = 'Ninguno', hp = 0, maxHp = 0) => {
    set({
      targetEntityId: id,
      targetName: name,
      targetHp: hp,
      targetMaxHp: maxHp
    });
  },

  updateTargetHp: (hp) => {
    set({ targetHp: hp });
  },

  triggerPlayerAttackPulse: () => {
    set((state) => ({ playerAttackPulse: state.playerAttackPulse + 1 }));
  },

  incrementCombo: () => {
    const state = get();
    const now = Date.now();
    // Use a 3-second window for combos
    if (now - state.comboTimer > 3000) {
      set({ comboCount: 1, comboTimer: now });
    } else {
      set({ comboCount: state.comboCount + 1, comboTimer: now });
    }
  },

  resetCombo: () => {
    set({ comboCount: 0, comboTimer: 0 });
  },

  incrementKillStreak: () => {
    const state = get();
    const now = Date.now();
    if (now - state.killStreakTimer > 6500) {
      set({ killStreakCount: 1, killStreakTimer: now });
    } else {
      const nextCount = state.killStreakCount + 1;
      set({ killStreakCount: nextCount, killStreakTimer: now });
      
      if (nextCount === 2) {
        get().addCombatLog("¡DOBLE BAJA! Has derrotado a 2 monstruos consecutivamente.", "system");
      } else if (nextCount === 3) {
        get().addCombatLog("¡TRIPLE BAJA! ¡Estás en racha salvaje!", "system");
      } else if (nextCount === 4) {
        get().addCombatLog("¡MEGA DESTRUCCIÓN! ¡Estás barriendo el mapa!", "system");
      } else if (nextCount >= 5) {
        get().addCombatLog(`¡RACHA MORTAL DE ${nextCount}! ¡Eres completamente imparable!`, "system");
      }
    }
  },

  resetKillStreak: () => {
    set({ killStreakCount: 0, killStreakTimer: 0 });
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

  setCameraZoom: (zoom) => {
    set({ cameraZoom: zoom });
  },

  setCameraAngleY: (angle) => {
    set({ cameraAngleY: angle });
  },

  setCameraOffsetZ: (offset) => {
    set({ cameraOffsetZ: offset });
  },

  toggleConfigPanel: () => {
    set((state) => ({ showConfigPanel: !state.showConfigPanel }));
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

  toggleInventory: () => {
      set((state) => ({ showInventory: !state.showInventory }));
  },

  updateDropRate: (mobType, itemId, newChance) => {
    set((state) => {
      const currentList = state.lootTables[mobType] || [];
      const updatedList = currentList.map(drop => {
        if (drop.itemId === itemId) {
          return { ...drop, chance: Math.min(1.0, Math.max(0.0, newChance)) };
        }
        return drop;
      });
      const newLootTables = { ...state.lootTables, [mobType]: updatedList };
      setTimeout(() => get().saveGame(), 0);
      return { lootTables: newLootTables };
    });
  },

  engineInstance: null,
  registerEngine: (engine) => {
    set({ engineInstance: engine });
  },

  addPickupNotification: (itemName, quantity, rarity, type, icon) => {
    const id = `pickup_${Math.random()}_${Date.now()}`;
    const newNotif = {
      id,
      itemName,
      quantity,
      rarity,
      type,
      icon,
      timestamp: Date.now()
    };
    set((state) => ({
      pickupNotifications: [newNotif, ...state.pickupNotifications].slice(0, 5)
    }));
    setTimeout(() => {
      get().removePickupNotification(id);
    }, 4500);
  },

  removePickupNotification: (id) => {
    set((state) => ({
      pickupNotifications: state.pickupNotifications.filter(n => n.id !== id)
    }));
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
    get().recalculateStats();
  },

  removeBuff: (id) => {
    set((state) => ({
      activeBuffs: state.activeBuffs.filter(b => b.id !== id)
    }));
    get().recalculateStats();
  },

  saveGame: async () => {
    const state = get();
    const saveObj = {
      currentMap: state.currentMap,
      level: state.stats.level,
      hp: state.currentHp,
      equippedItems: state.equippedItems,
      jobClass: state.jobClass,
      inventory: state.inventory,
      headgear: state.headgear,
      stats: state.stats,
      skillPoints: state.skillPoints,
      skills: state.skills,
      lootTables: state.lootTables
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
          const fallbackJob = (data.jobClass || 'Novice') as JobClass;
          const savedSkills = data.skills || [];
          const referenceSkills = defaultSkills[fallbackJob] || [];
          const mergedSkills = referenceSkills.map((refSkill) => {
            const saved = savedSkills.find((s: any) => s.id === refSkill.id);
            return {
              ...refSkill,
              level: saved && saved.level !== undefined ? saved.level : refSkill.level,
              lastCastTime: saved && saved.lastCastTime !== undefined ? saved.lastCastTime : refSkill.lastCastTime,
            };
          });

          set({
            currentMap: data.currentMap || 'prontera',
            jobClass: fallbackJob,
            currentHp: data.hp !== undefined ? data.hp : (defaultStats[fallbackJob].maxHp),
            equippedItems: data.equippedItems || {},
            inventory: data.inventory || get().inventory,
            headgear: data.headgear || 'none',
            stats: data.stats || defaultStats[fallbackJob],
            skillPoints: data.skillPoints || 0,
            skills: mergedSkills,
            lootTables: data.lootTables || get().lootTables
          });
          get().recalculateStats();
        }
      } catch (e) {
        console.warn('LocalStorage load blocked or empty:', e);
      }
    }
  }
}));
