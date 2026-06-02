export interface ColorGrading {
  brightness: number;
  contrast: number;
  saturation: number;
  tint: [number, number, number];
  shadowTint: [number, number, number];
  highlightTint: [number, number, number];
}

export interface FogDef {
  color: [number, number, number];
  density: number;
  mode: 'exp' | 'exp2' | 'linear';
  near?: number;
  far?: number;
}

export interface MonsterSpawnEntry {
  mobType: string;
  weight: number;
  minLevel: number;
  maxCount: number;
  respawnTimeMs: number;
  spawnArea?: {
    xMin: number; xMax: number;
    zMin: number; zMax: number;
  };
  isRare?: boolean;
  isBoss?: boolean;
}

export interface MapTransition {
  targetMapId: string;
  triggerZone: {
    xMin: number; xMax: number;
    zMin: number; zMax: number;
  };
  spawnAt: { x: number; z: number };
  direction: 'north' | 'south' | 'east' | 'west';
}

export interface MinimapConfig {
  backgroundColor: string;
  borderColor: string;
  defaultZoom: number;
}

export interface MapDef {
  id: string;
  name: string;
  description: string;
  regionId: string;
  minLevel: number;
  maxLevel: number;
  bounds: {
    xMin: number; xMax: number;
    zMin: number; zMax: number;
  };
  spawnPoint: { x: number; z: number };
  connectTo: MapTransition[];

  // Media
  music: string;
  ambient: string;
  lightingPreset: string;
  colorGrading?: ColorGrading;
  fog: FogDef;

  // Gameplay
  monsterTable: MonsterSpawnEntry[];
  npcIds: string[];
  questIds: string[];
  landmarkIds: string[];

  // Metadata
  minimap: MinimapConfig;
  isSafeZone: boolean;
  isDungeon: boolean;
}

export interface RegionDefMap {
  id: string;
  name: string;
  description: string;
  mapIds: string[];
  defaultMusic: string;
  defaultAmbient: string;
}

export interface MinimapData {
  mapId: string;
  mapName: string;
  regionId: string;
  regionName: string;
  playerPos: { x: number; z: number };
  monsters: { x: number; z: number; isBoss: boolean }[];
  waypoints: { x: number; z: number; type: 'quest' | 'landmark' | 'exit' }[];
  exits: { x: number; z: number; targetMapId: string; targetMapName: string }[];
  discoveredLandmarks: { x: number; z: number; name: string }[];
}

export interface MapState {
  currentMapId: string | null;
  previousMapId: string | null;
  transitionProgress: number;
}
