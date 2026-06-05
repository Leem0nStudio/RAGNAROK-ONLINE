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

  // Inventory & Targets
  inventory: InventoryItem[];
  equippedItems: EquippedItems;
  targetEntityId: string | null;
  targetHp: number;
  targetMaxHp: number;
  targetName: string;

  playerAttackPulse: number; // Increment to trigger UI attack animations

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
  allocateSkillPoint: (skillId: string) => void;

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

  targetEntityId: null,
  targetHp: 0,
  targetMaxHp: 0,
  targetName: 'Ninguno',
  playerAttackPulse: 0,

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
    const newStats = { ...state.baseStats };
    
    // Add Equipment Stats
    Object.values(state.equippedItems).forEach(item => {
        if (item && item.stats) {
            newStats.atk = (newStats.atk || 0) + (item.stats.atk || 0);
            newStats.def = (newStats.def || 0) + (item.stats.def || 0);
            newStats.agi = (newStats.agi || 0) + (item.stats.agi || 0);
            if (item.stats.str) newStats.str = (newStats.str || 0) + item.stats.str;
            if (item.stats.vit) newStats.vit = (newStats.vit || 0) + item.stats.vit;
            if (item.stats.int) newStats.int = (newStats.int || 0) + item.stats.int;
            if (item.stats.dex) newStats.dex = (newStats.dex || 0) + item.stats.dex;
            if (item.stats.luk) newStats.luk = (newStats.luk || 0) + item.stats.luk;
        }
    });

    // Add Buff Stats
    state.activeBuffs.forEach(buff => {
        if (buff.stats) {
            if (buff.stats.str) newStats.str = (newStats.str || 0) + buff.stats.str;
            if (buff.stats.agi) newStats.agi = (newStats.agi || 0) + buff.stats.agi;
            if (buff.stats.vit) newStats.vit = (newStats.vit || 0) + buff.stats.vit;
            if (buff.stats.int) newStats.int = (newStats.int || 0) + buff.stats.int;
            if (buff.stats.dex) newStats.dex = (newStats.dex || 0) + buff.stats.dex;
            if (buff.stats.luk) newStats.luk = (newStats.luk || 0) + buff.stats.luk;
            if (buff.stats.atk) newStats.atk = (newStats.atk || 0) + buff.stats.atk;
            if (buff.stats.def) newStats.def = (newStats.def || 0) + buff.stats.def;
            if (buff.stats.aspd) newStats.aspd = (newStats.aspd || 0) + buff.stats.aspd;
        }
        // Legacy buff mapping for specific skill IDs if stats not provided
        if (!buff.stats) {
            if (buff.id === 'increase_agi') {
                newStats.agi = (newStats.agi || 0) + 20;
            } else if (buff.id === 'blessing') {
                newStats.str = (newStats.str || 0) + 20;
                newStats.int = (newStats.int || 0) + 20;
                newStats.dex = (newStats.dex || 0) + 20;
            }
        }
    });

    const agiBonus = newStats.agi - state.baseStats.agi;
    const vitBonus = newStats.vit - state.baseStats.vit;
    const intBonus = newStats.int - state.baseStats.int;
    const strBonus = newStats.str - state.baseStats.str;

    if (agiBonus > 0) {
      newStats.flee = (newStats.flee || 0) + agiBonus;
      newStats.aspd = (newStats.aspd || 0) + Math.floor(agiBonus * 0.5);
    }
    if (vitBonus > 0) {
      newStats.maxHp = (newStats.maxHp || 0) + vitBonus * 15;
    }
    if (intBonus > 0) {
      newStats.maxSp = (newStats.maxSp || 0) + intBonus * 5;
    }
    if (strBonus > 0) {
      newStats.atk = (newStats.atk || 0) + strBonus * 2;
    }
    
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

      const updatedStats = { ...state.stats, level: lvl, jobLevel: jLvl };

      return {
        playerBaseExp: bExp,
        playerBaseMaxExp: bMax,
        playerJobExp: jExp,
        playerJobMaxExp: jMax,
        stats: updatedStats,
        skillPoints: state.skillPoints + addedSkillPoints,
        currentHp: leveledUp ? updatedStats.maxHp : state.currentHp,
        currentSp: leveledUp ? updatedStats.maxSp : state.currentSp
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
          set({
            jobClass: fallbackJob,
            currentHp: data.hp !== undefined ? data.hp : (defaultStats[fallbackJob].maxHp),
            equippedItems: data.equippedItems || {},
            inventory: data.inventory || get().inventory,
            headgear: data.headgear || 'none',
            stats: data.stats || defaultStats[fallbackJob],
            skillPoints: data.skillPoints || 0,
            skills: data.skills || defaultSkills[fallbackJob],
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
