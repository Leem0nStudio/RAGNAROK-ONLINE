import { MapDef, RegionDefMap, MonsterSpawnEntry, MapTransition } from './types';

// ─── HELPERS ────────────────────────────────────────────────────────

function transition(
  targetMapId: string,
  xMin: number, xMax: number,
  zMin: number, zMax: number,
  spawnX: number, spawnZ: number,
  direction: MapTransition['direction']
): MapTransition {
  return { targetMapId, triggerZone: { xMin, xMax, zMin, zMax }, spawnAt: { x: spawnX, z: spawnZ }, direction };
}

function spawnEntry(mobType: string, weight: number, minLevel: number, maxCount: number, respawnMs: number = 8000, area?: { xMin: number; xMax: number; zMin: number; zMax: number }, isBoss?: boolean): MonsterSpawnEntry {
  return { mobType, weight, minLevel, maxCount, respawnTimeMs: respawnMs, spawnArea: area, isBoss };
}

// ─── MAPAS ──────────────────────────────────────────────────────────

export const PRONTERA_CITY_MAP: MapDef = {
  id: 'prontera_city',
  name: 'Prontera — Plaza del Alba',
  description: 'La majestuosa capital de Rune-Midgard. Sus calles empedradas y fuentes de mármol reciben a los aventureros.',
  regionId: 'region_central',
  minLevel: 1,
  maxLevel: 10,
  bounds: { xMin: -32, xMax: 32, zMin: -32, zMax: 32 },
  spawnPoint: { x: 0, z: 0 },
  connectTo: [
    transition('pradera_del_alba',  28, 32, 0, 8,  34, 4,  'east'),
    transition('training_dungeon',  -4, 4, -32, -28,  0, -36,  'south'),
    transition('laderas_molino', -8, 8, 28, 32, 4, 34, 'north'),
    transition('campos_de_prontera_oeste', -32, -28, -8, 8, -34, 4, 'west'),
  ],
  music: 'ambient_prontera_city',
  ambient: 'city_bustle',
  lightingPreset: 'prontera_city',
  fog: { color: [0.94, 0.91, 0.85], density: 0.006, mode: 'exp2' },
  monsterTable: [
    spawnEntry('poring',    100, 1, 3, 8000, { xMin: -28, xMax: -10, zMin: -10, zMax: 10 }),
    spawnEntry('poring',    100, 1, 3, 8000, { xMin: 10, xMax: 28, zMin: -10, zMax: 10 }),
  ],
  npcIds: ['kafra_prontera', 'instructor', 'weapon_smith', 'potion_master', 'skill_trainer', 'quest_giver_01', 'portal_keeper', 'storage_keeper', 'guild_master_warrior', 'guild_master_mage', 'guild_master_acolyte', 'guild_master_thief', 'guild_master_merchant', 'guild_master_archer', 'traveling_merchant'],
  questIds: ['epic_01', 'epic_02', 'epic_03'],
  landmarkIds: ['prontera_castle', 'prontera_fountain', 'prontera_kafra', 'prontera_market', 'prontera_temple', 'prontera_guild_magic', 'prontera_guild_warrior', 'prontera_pond'],
  minimap: { backgroundColor: '#f0e8d8', borderColor: '#c0b090', defaultZoom: 1 },
  isSafeZone: true,
  isDungeon: false,
};

export const CAMPOS_DE_PRONTERA_OESTE_MAP: MapDef = {
  id: 'campos_de_prontera_oeste',
  name: 'Campos de Prontera (Oeste)',
  description: 'Vastas llanuras que se extienden al oeste de la capital.',
  regionId: 'region_central',
  minLevel: 1,
  maxLevel: 10,
  bounds: { xMin: -64, xMax: -32, zMin: 0, zMax: 32 },
  spawnPoint: { x: -48, z: 16 },
  connectTo: [
    transition('prontera_city', -32, -28, 0, 8, -30, 4, 'east'),
  ],
  music: 'ambient_prontera_fields',
  ambient: 'windy_grasslands',
  lightingPreset: 'prontera_fields',
  fog: { color: [0.78, 0.85, 0.78], density: 0.012, mode: 'exp2' },
  monsterTable: [
    spawnEntry('poring', 60, 1, 5, 6000, { xMin: -62, xMax: -34, zMin: 2, zMax: 30 }),
    spawnEntry('lunatic', 40, 2, 4, 7000, { xMin: -60, xMax: -36, zMin: 4, zMax: 28 }),
  ],
  npcIds: [],
  questIds: [],
  landmarkIds: [],
  minimap: { backgroundColor: '#d0e0c0', borderColor: '#90b080', defaultZoom: 1 },
  isSafeZone: false,
  isDungeon: false,
};

export const BOSQUE_DE_PRONTERA_SUR_MAP: MapDef = {
  id: 'bosque_de_prontera_sur',
  name: 'Bosque de Prontera (Sur)',
  description: 'Un denso bosque al sur de la capital, lleno de vida salvaje.',
  regionId: 'region_central',
  minLevel: 5,
  maxLevel: 15,
  bounds: { xMin: -32, xMax: 0, zMin: -64, zMax: -32 },
  spawnPoint: { x: -16, z: -48 },
  connectTo: [
    transition('prontera_city', -8, 0, -32, -28, -4, -30, 'north'),
  ],
  music: 'ambient_dark_forest',
  ambient: 'forest_night',
  lightingPreset: 'bosque_umbrio_entrada',
  fog: { color: [0.10, 0.16, 0.10], density: 0.025, mode: 'exp2' },
  monsterTable: [
    spawnEntry('spore', 50, 5, 5, 7000, { xMin: -30, xMax: -2, zMin: -62, zMax: -34 }),
    spawnEntry('drainliar', 50, 7, 3, 8000, { xMin: -30, xMax: -2, zMin: -62, zMax: -34 }),
  ],
  npcIds: [],
  questIds: [],
  landmarkIds: [],
  minimap: { backgroundColor: '#2a3a2a', borderColor: '#4a5a3a', defaultZoom: 1 },
  isSafeZone: false,
  isDungeon: false,
};

export const PRADERA_DEL_ALBA_MAP: MapDef = {
  id: 'pradera_del_alba',
  name: 'Pradera del Alba',
  description: 'Verdes colinas salpicadas de flores silvestres. Ideal para novatos.',
  regionId: 'region_central',
  minLevel: 1,
  maxLevel: 15,
  bounds: { xMin: 32, xMax: 64, zMin: 0, zMax: 32 },
  spawnPoint: { x: 48, z: 16 },
  connectTo: [
    transition('prontera_city',       30, 34, 0, 8,   -4, 4,   'west'),
    transition('llanura_ecoles',      60, 64, 0, 8,    66, 4,   'east'),
    transition('laderas_molino',      32, 40, 28, 32,  4, 36,   'north'),
  ],
  music: 'ambient_prontera_fields',
  ambient: 'windy_grasslands',
  lightingPreset: 'prontera_fields',
  fog: { color: [0.78, 0.85, 0.78], density: 0.012, mode: 'exp2' },
  monsterTable: [
    spawnEntry('poring',  50, 1, 5, 6000, { xMin: 34, xMax: 58, zMin: 2, zMax: 26 }),
    spawnEntry('lunatic', 40, 1, 4, 7000, { xMin: 38, xMax: 60, zMin: 4, zMax: 28 }),
    spawnEntry('fabre',   10, 5, 2, 8000, { xMin: 40, xMax: 56, zMin: 6, zMax: 24 }),
  ],
  npcIds: ['field_guide_01'],
  questIds: ['epic_02'],
  landmarkIds: ['centinel_tree', 'guide_post_cm1'],
  minimap: { backgroundColor: '#d0e0c0', borderColor: '#90b080', defaultZoom: 1 },
  isSafeZone: false,
  isDungeon: false,
};

export const LLANURA_ECOLES_MAP: MapDef = {
  id: 'llanura_ecoles',
  name: 'Llanura de los Écoles',
  description: 'Extensiones verdes donde los Fabre alados revolotean en busca de néctar.',
  regionId: 'region_central',
  minLevel: 10,
  maxLevel: 25,
  bounds: { xMin: 64, xMax: 96, zMin: 0, zMax: 32 },
  spawnPoint: { x: 80, z: 16 },
  connectTo: [
    transition('pradera_del_alba',  60, 64, 0, 8,   58, 4,   'west'),
    transition('camino_del_este',   92, 96, 0, 8,   98, 4,   'east'),
  ],
  music: 'ambient_prontera_fields',
  ambient: 'windy_grasslands',
  lightingPreset: 'prontera_fields',
  fog: { color: [0.82, 0.82, 0.72], density: 0.015, mode: 'exp2' },
  monsterTable: [
    spawnEntry('fabre',    45, 10, 6, 6000, { xMin: 66, xMax: 90, zMin: 2, zMax: 26 }),
    spawnEntry('chonchon', 35, 10, 4, 7000, { xMin: 70, xMax: 92, zMin: 4, zMax: 28 }),
    spawnEntry('poring',   20, 10, 3, 5000, { xMin: 68, xMax: 88, zMin: 4, zMax: 24 }),
  ],
  npcIds: [],
  questIds: [],
  landmarkIds: ['ecoles_nest', 'stone_circle_cm2'],
  minimap: { backgroundColor: '#c8d8b8', borderColor: '#88a878', defaultZoom: 1 },
  isSafeZone: false,
  isDungeon: false,
};

export const LADERAS_MOLINO_MAP: MapDef = {
  id: 'laderas_molino',
  name: 'Laderas del Molino',
  description: 'Colinas onduladas con un viejo molino de viento en ruinas. Los Savage Bebé corretean entre los arbustos.',
  regionId: 'region_central',
  minLevel: 15,
  maxLevel: 30,
  bounds: { xMin: 0, xMax: 64, zMin: 32, zMax: 96 },
  spawnPoint: { x: 16, z: 48 },
  connectTo: [
    transition('pradera_del_alba',  0, 8, 28, 32,   36, 26,   'south'),
    transition('echo_dungeon',     60, 64, 60, 68,  68, 64,   'east'),
  ],
  music: 'ambient_prontera_fields',
  ambient: 'windy_grasslands',
  lightingPreset: 'prontera_fields',
  fog: { color: [0.66, 0.63, 0.56], density: 0.020, mode: 'exp2' },
  monsterTable: [
    spawnEntry('savage_baby', 40, 15, 5, 7000, { xMin: 2, xMax: 30, zMin: 34, zMax: 60 }),
    spawnEntry('picky',       35, 15, 4, 7000, { xMin: 4, xMax: 32, zMin: 38, zMax: 62 }),
    spawnEntry('mandragora',  10, 20, 1, 15000, { xMin: 14, xMax: 20, zMin: 44, zMax: 50 }, true),
    spawnEntry('pecopeco',    15, 18, 2, 10000, { xMin: 34, xMax: 56, zMin: 50, zMax: 80 }),
  ],
  npcIds: [],
  questIds: ['epic_03'],
  landmarkIds: ['fallen_mill', 'watchtower_cm3'],
  minimap: { backgroundColor: '#b8b898', borderColor: '#888870', defaultZoom: 1 },
  isSafeZone: false,
  isDungeon: false,
};

export const CAMINO_DEL_ESTE_MAP: MapDef = {
  id: 'camino_del_este',
  name: 'Camino del Este',
  description: 'Una ruta comercial bordeada de árboles que conecta las llanuras con el oscuro Bosque Umbrío.',
  regionId: 'region_central',
  minLevel: 20,
  maxLevel: 35,
  bounds: { xMin: 96, xMax: 128, zMin: 0, zMax: 32 },
  spawnPoint: { x: 112, z: 16 },
  connectTo: [
    transition('llanura_ecoles',         92, 96, 0, 8,    90, 4,  'west'),
    transition('bosque_umbrio_entrada',   124, 128, 0, 8,  130, 4,  'east'),
  ],
  music: 'ambient_forest_road',
  ambient: 'windy_trees',
  lightingPreset: 'camino_este',
  fog: { color: [0.72, 0.82, 0.63], density: 0.018, mode: 'exp2' },
  monsterTable: [
    spawnEntry('picky',    45, 20, 5, 7000, { xMin: 98, xMax: 122, zMin: 2, zMax: 26 }),
    spawnEntry('pecopeco', 35, 22, 3, 10000, { xMin: 100, xMax: 124, zMin: 4, zMax: 28 }),
    spawnEntry('savage_baby', 20, 20, 2, 8000, { xMin: 102, xMax: 120, zMin: 6, zMax: 24 }),
  ],
  npcIds: [],
  questIds: [],
  landmarkIds: ['forest_arch'],
  minimap: { backgroundColor: '#b8c8a0', borderColor: '#889878', defaultZoom: 1 },
  isSafeZone: false,
  isDungeon: false,
};

export const TRAINING_DUNGEON_MAP: MapDef = {
  id: 'training_dungeon',
  name: 'Mazmorra de Entrenamiento',
  description: 'Una mazmorra subterránea bajo Prontera, usada por los gremios para entrenar a los novatos.',
  regionId: 'region_central',
  minLevel: 5,
  maxLevel: 20,
  bounds: { xMin: 0, xMax: 32, zMin: -64, zMax: -32 },
  spawnPoint: { x: 16, z: -40 },
  connectTo: [
    transition('prontera_city',  -4, 4, -64, -60,  0, -28,  'north'),
  ],
  music: 'ambient_dungeon',
  ambient: 'dungeon_echoes',
  lightingPreset: 'training_dungeon',
  fog: { color: [0.04, 0.06, 0.11], density: 0.030, mode: 'exp2' },
  monsterTable: [
    spawnEntry('fabre',    45, 5, 4, 6000, { xMin: 4, xMax: 28, zMin: -62, zMax: -50 }),
    spawnEntry('chonchon', 35, 8, 3, 7000, { xMin: 4, xMax: 28, zMin: -62, zMax: -50 }),
    spawnEntry('poring',   20, 5, 2, 5000, { xMin: 8, xMax: 26, zMin: -60, zMax: -48 }),
  ],
  npcIds: [],
  questIds: [],
  landmarkIds: ['crystal_guardian'],
  minimap: { backgroundColor: '#1a1a2e', borderColor: '#3a3a5e', defaultZoom: 1 },
  isSafeZone: false,
  isDungeon: true,
};

export const BOSQUE_UMBRIO_ENTRADA_MAP: MapDef = {
  id: 'bosque_umbrio_entrada',
  name: 'Bosque Umbrío — Entrada',
  description: 'Los primeros árboles del bosque umbrío, donde la luz del sol apenas alcanza el suelo.',
  regionId: 'region_central',
  minLevel: 25,
  maxLevel: 40,
  bounds: { xMin: 128, xMax: 160, zMin: 0, zMax: 32 },
  spawnPoint: { x: 144, z: 16 },
  connectTo: [
    transition('camino_del_este',       124, 128, 0, 8,   126, 4,   'west'),
    transition('bosque_umbrio_profundo', 128, 136, 28, 32,  132, 36,  'north'),
  ],
  music: 'ambient_dark_forest',
  ambient: 'forest_night',
  lightingPreset: 'bosque_umbrio_entrada',
  fog: { color: [0.10, 0.16, 0.10], density: 0.025, mode: 'exp2' },
  monsterTable: [
    spawnEntry('drainliar', 40, 25, 5, 7000, { xMin: 132, xMax: 152, zMin: 2, zMax: 26 }),
    spawnEntry('spore',     35, 25, 4, 8000, { xMin: 130, xMax: 150, zMin: 4, zMax: 28 }),
    spawnEntry('will_o_wisp', 15, 28, 2, 10000, { xMin: 134, xMax: 154, zMin: 6, zMax: 24 }),
    spawnEntry('shining_plant', 10, 26, 2, 12000, { xMin: 136, xMax: 152, zMin: 2, zMax: 20 }),
  ],
  npcIds: [],
  questIds: ['epic_04'],
  landmarkIds: ['bosque_arch'],
  minimap: { backgroundColor: '#2a3a2a', borderColor: '#4a5a3a', defaultZoom: 1 },
  isSafeZone: false,
  isDungeon: false,
};

export const BOSQUE_UMBRIO_PROFUNDO_MAP: MapDef = {
  id: 'bosque_umbrio_profundo',
  name: 'Bosque Umbrío — Profundo',
  description: 'La densidad del bosque aquí es abrumadora. Criaturas de pesadilla acechan entre las raíces retorcidas.',
  regionId: 'region_central',
  minLevel: 30,
  maxLevel: 50,
  bounds: { xMin: 128, xMax: 160, zMin: 32, zMax: 64 },
  spawnPoint: { x: 144, z: 40 },
  connectTo: [
    transition('bosque_umbrio_entrada', 128, 136, 28, 32,  132, 26,  'south'),
    transition('ruinas_ancestrales',    156, 160, 32, 40,  162, 28,  'east'),
    transition('santuario_olvidado',    156, 160, 52, 64,  162, 56,  'east'),
  ],
  music: 'ambient_dark_forest',
  ambient: 'forest_night',
  lightingPreset: 'bosque_umbrio_profundo',
  fog: { color: [0.04, 0.08, 0.04], density: 0.035, mode: 'exp2' },
  monsterTable: [
    spawnEntry('spore',          30, 30, 3, 7000, { xMin: 130, xMax: 150, zMin: 34, zMax: 54 }),
    spawnEntry('will_o_wisp',    25, 32, 4, 8000, { xMin: 128, xMax: 152, zMin: 32, zMax: 56 }),
    spawnEntry('argiope',        25, 34, 3, 9000, { xMin: 132, xMax: 154, zMin: 36, zMax: 58 }),
    spawnEntry('shining_plant',  20, 30, 3, 10000, { xMin: 134, xMax: 156, zMin: 32, zMax: 60 }),
  ],
  npcIds: [],
  questIds: ['epic_05'],
  landmarkIds: ['weeping_willow'],
  minimap: { backgroundColor: '#1a2a1a', borderColor: '#3a4a2a', defaultZoom: 1 },
  isSafeZone: false,
  isDungeon: false,
};

// ─── RUINAS ANCESTRALES ──────────────────────────────────────────────

export const RUINAS_ANCESTRALES_MAP: MapDef = {
  id: 'ruinas_ancestrales',
  name: 'Ruinas Ancestrales',
  description: 'Los restos de una civilización olvidada yacen entre la maleza. El aire huele a polvo y misterio.',
  regionId: 'region_central',
  minLevel: 45,
  maxLevel: 65,
  bounds: { xMin: 160, xMax: 192, zMin: 0, zMax: 32 },
  spawnPoint: { x: 170, z: 16 },
  connectTo: [
    transition('bosque_umbrio_profundo', 158, 162, 28, 32,  155, 34,  'west'),
  ],
  music: 'ambient_ruins',
  ambient: 'windy_grasslands',
  lightingPreset: 'ruinas_ancestrales',
  fog: { color: [0.10, 0.10, 0.06], density: 0.028, mode: 'exp2' },
  monsterTable: [
    spawnEntry('stalker',            40, 45, 4, 8000, { xMin: 162, xMax: 188, zMin: 2, zMax: 26 }),
    spawnEntry('argiope',            30, 48, 3, 9000, { xMin: 164, xMax: 190, zMin: 4, zMax: 28 }),
  ],
  npcIds: ['npc_archaeologist', 'npc_sage'],
  questIds: ['epic_06'],
  landmarkIds: ['ruined_temple'],
  minimap: { backgroundColor: '#3a3a2a', borderColor: '#5a4a3a', defaultZoom: 1 },
  isSafeZone: false,
  isDungeon: false,
};

// ─── SANTUARIO OLVIDADO ──────────────────────────────────────────────

export const SANTUARIO_OLVIDADO_MAP: MapDef = {
  id: 'santuario_olvidado',
  name: 'Santuario Olvidado',
  description: 'Un santuario en ruinas donde la energía oscura palpita en cada piedra. No todos los que entran salen.',
  regionId: 'region_central',
  minLevel: 50,
  maxLevel: 70,
  bounds: { xMin: 160, xMax: 192, zMin: 32, zMax: 64 },
  spawnPoint: { x: 170, z: 48 },
  connectTo: [
    transition('bosque_umbrio_profundo', 158, 162, 52, 64,  155, 56,  'west'),
  ],
  music: 'ambient_dark_sanctuary',
  ambient: 'forest_night',
  lightingPreset: 'santuario_olvidado',
  fog: { color: [0.04, 0.04, 0.08], density: 0.030, mode: 'exp2' },
  monsterTable: [
    spawnEntry('stalker',            35, 50, 3, 8000,  { xMin: 162, xMax: 186, zMin: 34, zMax: 58 }),
    spawnEntry('master_drainliar',   20, 55, 1, 12000, { xMin: 166, xMax: 172, zMin: 48, zMax: 54 }, true),
    spawnEntry('dark_guardian',      15, 60, 1, 15000, { xMin: 164, xMax: 170, zMin: 50, zMax: 56 }, true),
  ],
  npcIds: [],
  questIds: ['epic_07'],
  landmarkIds: ['forgotten_shrine', 'dark_portal'],
  minimap: { backgroundColor: '#1a1a2a', borderColor: '#3a2a4a', defaultZoom: 1 },
  isSafeZone: false,
  isDungeon: false,
};

// ─── CUEVAS DEL ECO ─────────────────────────────────────────────────

export const ECHO_DUNGEON_MAP: MapDef = {
  id: 'echo_dungeon',
  name: 'Cuevas del Eco',
  description: 'Cavernas resonantes donde los ecos nunca mueren. Criaturas de cristal y sombra merodean en la oscuridad.',
  regionId: 'region_central',
  minLevel: 25,
  maxLevel: 40,
  bounds: { xMin: 64, xMax: 96, zMin: 60, zMax: 92 },
  spawnPoint: { x: 70, z: 68 },
  connectTo: [
    transition('laderas_molino',  62, 66, 60, 68,  60, 64,  'west'),
  ],
  music: 'ambient_dark_forest',
  ambient: 'dungeon_echoes',
  lightingPreset: 'echo_dungeon',
  fog: { color: [0.03, 0.05, 0.08], density: 0.032, mode: 'exp2' },
  monsterTable: [
    spawnEntry('drainliar',    35, 25, 4, 7000, { xMin: 66, xMax: 88, zMin: 62, zMax: 84 }),
    spawnEntry('chonchon',     30, 25, 4, 6000, { xMin: 64, xMax: 90, zMin: 60, zMax: 86 }),
    spawnEntry('argiope',      20, 28, 3, 8000, { xMin: 68, xMax: 92, zMin: 64, zMax: 88 }),
    spawnEntry('shining_plant', 10, 25, 2, 10000, { xMin: 70, xMax: 86, zMin: 66, zMax: 82 }),
  ],
  npcIds: [],
  questIds: ['sq_echo_caves'],
  landmarkIds: ['crystal_guardian'],
  minimap: { backgroundColor: '#0a1a2a', borderColor: '#2a3a5a', defaultZoom: 1 },
  isSafeZone: false,
  isDungeon: true,
};

// ─── REGISTRO COMPLETO ──────────────────────────────────────────────

export const ALL_MAP_DEFS: MapDef[] = [
  PRONTERA_CITY_MAP,
  CAMPOS_DE_PRONTERA_OESTE_MAP,
  BOSQUE_DE_PRONTERA_SUR_MAP,
  PRADERA_DEL_ALBA_MAP,
  LLANURA_ECOLES_MAP,
  LADERAS_MOLINO_MAP,
  CAMINO_DEL_ESTE_MAP,
  TRAINING_DUNGEON_MAP,
  BOSQUE_UMBRIO_ENTRADA_MAP,
  BOSQUE_UMBRIO_PROFUNDO_MAP,
  RUINAS_ANCESTRALES_MAP,
  SANTUARIO_OLVIDADO_MAP,
  ECHO_DUNGEON_MAP,
];

export const MAP_INDEX: Record<string, MapDef> = {};
for (const m of ALL_MAP_DEFS) {
  MAP_INDEX[m.id] = m;
}

// ─── REGIONES ───────────────────────────────────────────────────────

export const REGION_DEFS: RegionDefMap[] = [
  {
    id: 'region_central',
    name: 'Región Central de Rune-Midgard',
    description: 'El corazón del reino humano.',
    mapIds: ALL_MAP_DEFS.map(m => m.id),
    defaultMusic: 'ambient_prontera_fields',
    defaultAmbient: 'windy_grasslands',
  },
];

export const REGION_INDEX: Record<string, RegionDefMap> = {};
for (const r of REGION_DEFS) {
  REGION_INDEX[r.id] = r;
}

// ─── LIGHTING PRESETS ───────────────────────────────────────────────

export interface LightingValues {
  ambientColor: string;
  directionalColor: string;
  hemisphereSky: string;
  hemisphereGround: string;
  fogColor: string;
  fogDensity: number;
}

export const LIGHTING_PRESETS: Record<string, LightingValues> = {
  prontera_city: {
    ambientColor: '#f5e6c8', directionalColor: '#e8a040',
    hemisphereSky: '#d4a373', hemisphereGround: '#7ec8a0',
    fogColor: '#f0e8d8', fogDensity: 0.006,
  },
  prontera_fields: {
    ambientColor: '#ffffff', directionalColor: '#ffedd5',
    hemisphereSky: '#87ceeb', hemisphereGround: '#4a8c3f',
    fogColor: '#c8d8c8', fogDensity: 0.012,
  },
  camino_este: {
    ambientColor: '#ffffff', directionalColor: '#ffedd5',
    hemisphereSky: '#87ceeb', hemisphereGround: '#3a5a2a',
    fogColor: '#b8d0a0', fogDensity: 0.018,
  },
  training_dungeon: {
    ambientColor: '#221133', directionalColor: '#88aaff',
    hemisphereSky: '#334466', hemisphereGround: '#112222',
    fogColor: '#0a0f1c', fogDensity: 0.030,
  },
  bosque_umbrio_entrada: {
    ambientColor: '#2a3a2a', directionalColor: '#6a8a5a',
    hemisphereSky: '#3a5a3a', hemisphereGround: '#1a2a1a',
    fogColor: '#1a2a1a', fogDensity: 0.025,
  },
  bosque_umbrio_profundo: {
    ambientColor: '#1a2a1a', directionalColor: '#4a6a3a',
    hemisphereSky: '#2a4a2a', hemisphereGround: '#0a1a0a',
    fogColor: '#0a150a', fogDensity: 0.035,
  },
  ruinas_ancestrales: {
    ambientColor: '#2a2a1a', directionalColor: '#6a7a4a',
    hemisphereSky: '#3a4a2a', hemisphereGround: '#1a1a0a',
    fogColor: '#1a1a0a', fogDensity: 0.028,
  },
  santuario_olvidado: {
    ambientColor: '#1a1a2a', directionalColor: '#5a4a6a',
    hemisphereSky: '#2a2a4a', hemisphereGround: '#0a0a1a',
    fogColor: '#0a0a15', fogDensity: 0.030,
  },
  echo_dungeon: {
    ambientColor: '#1a2a3a', directionalColor: '#4a6a8a',
    hemisphereSky: '#2a3a5a', hemisphereGround: '#0a1a2a',
    fogColor: '#0a1520', fogDensity: 0.032,
  },
};

export function resolveLighting(presetId: string): LightingValues | null {
  return LIGHTING_PRESETS[presetId] ?? null;
}

// ─── FUNCIÓN DE BÚSQUEDA ────────────────────────────────────────────

export function findMapByPosition(x: number, z: number): MapDef | null {
  for (const map of ALL_MAP_DEFS) {
    if (x >= map.bounds.xMin && x < map.bounds.xMax &&
        z >= map.bounds.zMin && z < map.bounds.zMax) {
      return map;
    }
  }
  return null;
}

export function findTransition(currentMap: MapDef, x: number, z: number): MapTransition | null {
  for (const t of currentMap.connectTo) {
    const tz = t.triggerZone;
    if (x >= tz.xMin && x < tz.xMax && z >= tz.zMin && z < tz.zMax) {
      return t;
    }
  }
  return null;
}
