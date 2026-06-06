export interface VFXEffect {
  id: string;
  type: 'hit_flash' | 'damage_number' | 'spell_effect' | 'trail';
  mesh: THREE.Object3D;
  age: number;
  maxAge: number;
  speed: number;
  active: boolean;
}

export type JobClass = 
  | 'Novice' 
  // First Jobs
  | 'Swordsman' | 'Mage' | 'Archer' | 'Acolyte' | 'Merchant' | 'Thief' 
  // Second Jobs
  | 'Knight' | 'Crusader' | 'Wizard' | 'Sage' | 'Hunter' | 'Bard' | 'Dancer' | 'Priest' | 'Monk' | 'Blacksmith' | 'Alchemist' | 'Assassin' | 'Rogue'
  // Transcendent Jobs
  | 'Lord Knight' | 'Paladin' | 'High Wizard' | 'Professor' | 'Sniper' | 'Clown' | 'Gypsy' | 'High Priest' | 'Champion' | 'Whitesmith' | 'Creator' | 'Assassin Cross' | 'Stalker';

export type JobTier = 'Novice' | 'First' | 'Second' | 'Transcendent';

export interface JobMetadata {
  tier: JobTier;
  nextJobs: JobClass[];
  requirement: {
    baseLevel?: number;
    jobLevel: number;
  };
}

export interface CharacterStats {
  level: number;
  jobLevel: number;
  str: number;
  agi: number;
  vit: number;
  int: number;
  dex: number;
  luk: number;
  atk: number;
  def: number;
  hit: number;
  flee: number;
  aspd: number;
  maxHp: number;
  maxSp: number;
}

export interface StatusEffect {
  id: string; // e.g., 'might_1'
  name: string; // e.g., 'Might'
  type: 'haste' | 'might' | 'burn' | 'slow' | 'vulnerability';
  magnitude: number;
  duration: number; // in ms
  remainingTime: number; // in ms
  stacks?: number;
}

export interface Projectile {
  id: string;
  type: 'arrow' | 'holy_light' | 'poison_dart' | 'dark_energy';
  x: number;
  y: number;
  z: number;
  speed: number;
  targetEntityId: string;
  ownerEntityId: string;
  damage: number;
  isCrit: boolean;
  spawnTime: number;
  height: number;
}

export interface Entity {
  id: string;
  name: string;
  type: 'player' | 'monster' | 'boss_mvp' | 'npc';
  job?: JobClass;
  mobType?: 'poring' | 'baphomet' | 'pecopeco' | 'poporing';
  npcType?: 'kafra' | 'crusader_instructor';
  activeEffects?: StatusEffect[]; // replaces string[] buffs
  x: number;
  y: number;
  z: number;
  targetX?: number;
  targetZ?: number;
  facing: 'left' | 'right';
  state: 'idle' | 'move' | 'attack' | 'hit' | 'cast' | 'death';
  currentHp: number;
  currentSp: number;
  maxHp: number;
  maxSp: number;
  targetEntityId: string | null;
  hitRecoveryEndTime: number;
  animationTimer: number;
  animationFrame: number;
  animMachine?: any; // Lazy initialized animation state machine
  spawnX?: number;
  spawnZ?: number;
  sayText?: string;
  sayTextEndTime?: number;
  lastChatTime?: number;
  npcWanderTimer?: number;
}

export interface GroundItem {
  id: string;
  name: string;
  x: number;
  z: number;
  y: number;
  quantity: number;
  itemId: string;
  velX?: number;
  velY?: number;
  velZ?: number;
  bounceCount?: number;
  rarity: 'common' | 'rare' | 'epic';
  spawnTime: number;
  ownerId?: string;
}

export interface Skill {
  id: string;
  name: string;
  key: string;
  desc: string;
  spCost: number;
  cooldown: number; // in milliseconds
  range: number;
  lastCastTime: number;
  color: string;
  castTime?: number; // in milliseconds (0 or undefined means instant)
  level: number;
  maxLevel: number;
  dependencies?: { skillId: string; level: number }[];
  x?: number; // coordinate for PoE-style constellation node
  y?: number; // coordinate for PoE-style constellation node
  isPassive?: boolean; // indicator for passive abilities
}

export interface InventoryItem {
  id: string;
  name: string;
  quantity: number;
  type: 'equipment' | 'consumable' | 'material' | 'weapon' | 'armor' | 'accessory' | 'quest';
  slot?: EquipmentSlot;
  allowedJobs?: JobClass[];
  stats?: {
    str?: number;
    agi?: number;
    vit?: number;
    int?: number;
    dex?: number;
    luk?: number;
    atk?: number;
    def?: number;
    hit?: number;
    flee?: number;
    aspd?: number;
    maxHp?: number;
    maxSp?: number;
  };
  slotIndex?: number;
  instanceId?: string;
  description?: string;
  icon?: string;
  rarity?: 'normal' | 'rare' | 'epic';
  weight?: number;
  maxStack?: number;
  sellValue?: number;
  metadata?: Record<string, any>;
}

export type EquipmentSlot = 
  | 'head'
  | 'body'
  | 'rightHand'
  | 'leftHand'
  | 'accessory1'
  | 'accessory2'
  | 'cape'
  | 'mount'
  | 'pet'
  | 'costume';

export type EquippedItems = Partial<Record<EquipmentSlot, Omit<InventoryItem, 'quantity'>>>;

export interface CombatLog {
  id: string;
  text: string;
  type: 'system' | 'mvp' | 'loot' | 'player_hit' | 'monster_hit' | 'heal' | 'skill';
  timestamp: string;
}

export interface TouchIndicator {
  id: string;
  x: number;
  y: number;
  z: number;
  age: number; // 0 to maxAge (ticks or ms)
  maxAge: number;
  type: 'move' | 'target' | 'skill';
}

export interface InputBufferItem {
  id: string;
  type: 'skill' | 'potion' | 'move' | 'target';
  skillId?: string;
  targetId?: string;
  coords?: { x: number; z: number };
  timestamp: number; // when it was queued
  expiresAt: number; // buffer expiration (e.g., now + 1500ms)
}

export interface JoystickState {
  isActive: boolean;
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
  angle: number; // angle in radians
  distance: number; // distance from start
  normalizedX: number; // -1 to 1
  normalizedY: number; // -1 to 1
}

export type HeadgearId = 'none' | 'goggles' | 'magician_hat' | 'bunny_band' | 'ragnarok_crown';

export interface Headgear {
  id: HeadgearId;
  name: string;
  color: string;
}
