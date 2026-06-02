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
  matk: number;
  hit: number;
  flee: number;
  aspd: number;
  spd: number;
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
  mobType?: 'poring' | 'pecopeco' | 'lunatic' | 'fabre' | 'chonchon' | 'savage_baby' | 'picky' | 'mandragora' | 'drainliar' | 'spore' | 'will_o_wisp' | 'argiope' | 'shining_plant' | 'stalker' | 'master_drainliar' | 'dark_guardian';
  npcType?: 'kafra' | 'crusader_instructor' | 'quest_giver';
  activeEffects?: StatusEffect[]; // replaces string[] buffs
  x: number;
  y: number;
  z: number;
  targetX?: number;
  targetZ?: number;
  facing: 'left' | 'right' | 'up' | 'down';
  state: 'idle' | 'move' | 'attack' | 'hit' | 'cast' | 'death';
  currentHp: number;
  currentSp: number;
  maxHp: number;
  maxSp: number;
  targetEntityId: string | null;
  hitRecoveryEndTime: number;
  animationTimer: number;
  animationFrame: number;
  animMachine?: import('./animationStateMachine').AnimationStateMachine;
  _lastAnimUpdateTime?: number;
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
}

export interface InventoryItem {
  id: string;
  name: string;
  quantity: number;
  type: 'equipment' | 'consumable' | 'material' | 'card';
  slot?: EquipmentSlot;
  allowedJobs?: JobClass[];
  socketedCards?: string[];
  stats?: {
    atk?: number;
    def?: number;
    matk?: number;
    hp?: number;
    flee?: number;
    spd?: number;
    str?: number;
    agi?: number;
    int?: number;
    dex?: number;
    luk?: number;
  };
}

export type EquipmentSlot = 'head' | 'body' | 'rightHand' | 'leftHand' | 'accessory';

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
  type: 'skill' | 'move' | 'target';
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

export type BiomeType = 'grassland' | 'forest' | 'desert' | 'swamp' | 'volcanic' | 'snow' | 'dungeon';

export type SubzonePurpose = 'city' | 'fields' | 'forest' | 'dungeon' | 'boss_arena' | 'transition' | 'lake';

export interface SubzoneDef {
  id: string;
  name: string;
  zoneId: string;
  purpose: SubzonePurpose;
  recommendedLevel: [number, number];
  connections: string[];
  majorLandmarks: string[];
  ambientAudio?: string;
  monsterSpawns?: MonsterSpawn[];
}

export interface RegionDef {
  id: string;
  name: string;
  description: string;
  subzones: SubzoneDef[];
}

export interface WeightMap {
  data: Uint8Array;
  width: number;
  height: number;
}

export interface TerrainChunkData {
  cx: number;
  cz: number;
  biome: BiomeType;
  weightMap: WeightMap;
  tileAtlas: string;
}

export interface PropBlueprint {
  id: string;
  meshId: string;
  scaleRange: [number, number];
  rotationYRange: [number, number];
  collisionRadius: number;
  castShadow: boolean;
  lodDistances: [number, number, number];
}

export interface PropInstance {
  blueprintId: string;
  x: number;
  z: number;
  scale: number;
  rotationY: number;
}

export interface VegetationLayer {
  type: 'tree' | 'bush' | 'grass' | 'ground_cover';
  blueprintId: string;
  density: number;
  instanceCount: number;
  maxDistance: number;
  lodBreakpoints: [number, number];
  color?: string;
  secondaryColor?: string;
}

export interface LandmarkDefinition {
  id: string;
  type: 'building' | 'bridge' | 'statue' | 'gate' | 'wall_segment';
  position: [number, number, number];
  rotation: number;
  scale: number;
  blocks: VoxelBlock[];
  lodDistances: [number, number];
}

export interface VoxelBlock {
  type: 'wall' | 'window' | 'door' | 'tower' | 'roof' | 'corner' | 'arch';
  ox: number;
  oy: number;
  oz: number;
  color: string;
}

export interface MonsterSpawn {
  mobType: Entity['mobType'];
  count: number;
  /** Spawn area in world coords */
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
}

export interface MapZone {
  id: string;
  name: string;
  biome: BiomeType;
  regionId?: string;
  subzoneId?: string;
  purpose?: SubzonePurpose;
  recommendedLevel?: [number, number];
  connections?: string[];
  chunks: TerrainChunkData[];
  props: PropInstance[];
  landmarks: LandmarkDefinition[];
  vegetation: VegetationLayer[];
  monsterSpawns?: MonsterSpawn[];
  lighting: {
    ambientColor: string;
    directionalColor: string;
    hemisphereSky: string;
    hemisphereGround: string;
    fogColor: string;
    fogDensity: number;
  };
}

export interface MobileProfile {
  lowPower: boolean;
  targetFPS: number;
  pixelRatio: number;
  shadowQuality: 0 | 1 | 2;
  vegetationDistance: number;
  propDistance: number;
  particleQuality: number;
}

export type QuestState = 'locked' | 'available' | 'active' | 'completed';

export type QuestObjectiveType = 'kill' | 'collect' | 'talk' | 'explore' | 'survive' | 'reach';

export interface QuestObjective {
  type: QuestObjectiveType;
  description: string;
  mobType?: string;
  targetId?: string;
  count: number;
  current: number;
  location?: { mapId: string; x: number; z: number };
  interactId?: string;
}

export interface QuestDefinition {
  id: string;
  name: string;
  description: string;
  objectives: QuestObjective[];
  rewards: {
    zeny: number;
    baseExp: number;
    jobExp: number;
    items?: { itemId: string; name: string; quantity: number }[];
  };
  npcGiver: string;
  npcGiverId: string;
  mapId: string;
  nextQuestId?: string;
  requiredLevel?: number;
  requiredQuestId?: string;
  isMainQuest?: boolean;
  state: QuestState;
}

export interface LootEntry {
  itemId: string;
  name: string;
  type: 'common' | 'rare' | 'epic';
  probability: number;
  quantity: [number, number];
  category: 'material' | 'consumable' | 'equipment' | 'card';
}

export interface LootTable {
  mobType: Entity['mobType'];
  drops: LootEntry[];
}

export interface ShopItem {
  itemId: string;
  name: string;
  price: number;
  type: 'consumable' | 'equipment' | 'material';
  stats?: {
    atk?: number;
    def?: number;
    matk?: number;
    hp?: number;
    sp?: number;
    flee?: number;
    spd?: number;
    str?: number;
    agi?: number;
    int?: number;
    dex?: number;
    luk?: number;
  };
  allowedJobs?: JobClass[];
  slot?: EquipmentSlot;
  levelReq?: number;
}

export interface InteractibleDef {
  id: string;
  mapId: string;
  x: number;
  z: number;
  label: string;
  type: 'torch' | 'inscription';
  activated: boolean;
}

export interface Achievement {
  id: string;
  name: string;
  condition: string;
  reward: { zeny: number; items?: { itemId: string; name: string; quantity: number }[]; title?: string };
  unlocked: boolean;
}


