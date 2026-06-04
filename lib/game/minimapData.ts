export interface MinimapFeature {
  type: 'road' | 'building' | 'water' | 'park' | 'plaza';
  x: number;
  z: number;
  width: number;
  height: number;
  color: string;
}

export interface MinimapLayout {
  backgroundColor: string;
  borderColor: string;
  bounds: { xMin: number; xMax: number; zMin: number; zMax: number };
  features: MinimapFeature[];
}

const PRONTERA_LAYOUT: MinimapLayout = {
  backgroundColor: '#f0e8d8',
  borderColor: '#c0b090',
  bounds: { xMin: 0, xMax: 64, zMin: 0, zMax: 64 },
  features: [
    // Main horizontal streets (Z = 12, 20, 28, 32, 36, 44, 52)
    ...[12, 20, 28, 32, 36, 44, 52].map(z => ({
      type: 'road' as const, x: 32, z, width: 64, height: 0.6, color: '#d4c8a8',
    })),
    // Main vertical streets (X = 12, 20, 28, 32, 36, 44, 52)
    ...[12, 20, 28, 32, 36, 44, 52].map(x => ({
      type: 'road' as const, x, z: 32, width: 0.6, height: 64, color: '#d4c8a8',
    })),
    // Castle at (32, 20) — center north
    { type: 'building', x: 32, z: 20, width: 14, height: 7, color: '#c0b0a0' },
    // Fountain at (32, 38)
    { type: 'water', x: 32, z: 38, width: 2.5, height: 2.5, color: '#7ab8e0' },
    // Kafra building (20, 32)
    { type: 'building', x: 20, z: 32, width: 5, height: 5, color: '#d4a373' },
    // Market area (44, 32)
    { type: 'building', x: 44, z: 32, width: 6, height: 6, color: '#e8c8a0' },
    // Temple (32, 46)
    { type: 'building', x: 32, z: 46, width: 6, height: 6, color: '#e0d0c0' },
    // Guild buildings
    { type: 'building', x: 22, z: 44, width: 4, height: 4, color: '#a080c0' },
    { type: 'building', x: 42, z: 44, width: 4, height: 4, color: '#c08080' },
    // Pond (12, 12)
    { type: 'water', x: 12, z: 12, width: 4, height: 4, color: '#6aa8d0' },
    // Park areas
    { type: 'park', x: 12, z: 52, width: 7, height: 7, color: '#a0c080' },
    { type: 'park', x: 52, z: 12, width: 7, height: 7, color: '#a0c080' },
    // Houses
    { type: 'building', x: 12, z: 28, width: 3, height: 3, color: '#d8c8b0' },
    { type: 'building', x: 12, z: 36, width: 3, height: 3, color: '#d8c8b0' },
    { type: 'building', x: 52, z: 28, width: 3, height: 3, color: '#d8c8b0' },
    { type: 'building', x: 52, z: 36, width: 3, height: 3, color: '#d8c8b0' },
    { type: 'building', x: 28, z: 12, width: 3, height: 3, color: '#d8c8b0' },
    { type: 'building', x: 36, z: 12, width: 3, height: 3, color: '#d8c8b0' },
    { type: 'building', x: 28, z: 52, width: 3, height: 3, color: '#d8c8b0' },
    { type: 'building', x: 36, z: 52, width: 3, height: 3, color: '#d8c8b0' },
    // Gate areas
    { type: 'plaza', x: 4, z: 32, width: 4, height: 4, color: '#e0d4c0' },
    { type: 'plaza', x: 60, z: 32, width: 4, height: 4, color: '#e0d4c0' },
    { type: 'plaza', x: 32, z: 4, width: 4, height: 4, color: '#e0d4c0' },
    { type: 'plaza', x: 32, z: 60, width: 4, height: 4, color: '#e0d4c0' },
  ],
};

const PRONTERA_FIELD_LAYOUT: MinimapLayout = {
  backgroundColor: '#d8e0c8',
  borderColor: '#a0b890',
  bounds: { xMin: 0, xMax: 80, zMin: 0, zMax: 80 },
  features: [
    // Dirt paths
    { type: 'road', x: 40, z: 10, width: 80, height: 0.6, color: '#c8b898' },
    { type: 'road', x: 40, z: 40, width: 80, height: 0.6, color: '#c8b898' },
    { type: 'road', x: 40, z: 70, width: 80, height: 0.6, color: '#c8b898' },
    { type: 'road', x: 10, z: 40, width: 0.6, height: 80, color: '#c8b898' },
    { type: 'road', x: 70, z: 40, width: 0.6, height: 80, color: '#c8b898' },
    // Small pond
    { type: 'water', x: 20, z: 20, width: 6, height: 6, color: '#6aa8d0' },
    // Grove areas
    { type: 'park', x: 60, z: 20, width: 8, height: 8, color: '#8ab870' },
    { type: 'park', x: 20, z: 60, width: 8, height: 8, color: '#8ab870' },
  ],
};

const TRAINING_DUNGEON_LAYOUT: MinimapLayout = {
  backgroundColor: '#2a2030',
  borderColor: '#605070',
  bounds: { xMin: 0, xMax: 48, zMin: 0, zMax: 48 },
  features: [
    // Stone floor grid lines
    { type: 'road', x: 24, z: 24, width: 0.4, height: 48, color: '#403050' },
    { type: 'road', x: 24, z: 24, width: 48, height: 0.4, color: '#403050' },
    // Pillars as small squares
    { type: 'building', x: 8, z: 8, width: 1.5, height: 1.5, color: '#605070' },
    { type: 'building', x: 40, z: 8, width: 1.5, height: 1.5, color: '#605070' },
    { type: 'building', x: 8, z: 40, width: 1.5, height: 1.5, color: '#605070' },
    { type: 'building', x: 40, z: 40, width: 1.5, height: 1.5, color: '#605070' },
    { type: 'building', x: 18, z: 18, width: 1, height: 1, color: '#504060' },
    { type: 'building', x: 30, z: 18, width: 1, height: 1, color: '#504060' },
    { type: 'building', x: 18, z: 30, width: 1, height: 1, color: '#504060' },
    { type: 'building', x: 30, z: 30, width: 1, height: 1, color: '#504060' },
    // Entrance area at bottom
    { type: 'plaza', x: 24, z: 44, width: 6, height: 3, color: '#807090' },
  ],
};

const LADERAS_MOLINO_LAYOUT: MinimapLayout = {
  backgroundColor: '#d0c8a0',
  borderColor: '#a09870',
  bounds: { xMin: 0, xMax: 72, zMin: 0, zMax: 72 },
  features: [
    // Hillside paths
    { type: 'road', x: 36, z: 12, width: 72, height: 0.5, color: '#c0b890' },
    { type: 'road', x: 36, z: 36, width: 72, height: 0.5, color: '#c0b890' },
    { type: 'road', x: 36, z: 60, width: 72, height: 0.5, color: '#c0b890' },
    { type: 'road', x: 12, z: 36, width: 0.5, height: 72, color: '#c0b890' },
    { type: 'road', x: 60, z: 36, width: 0.5, height: 72, color: '#c0b890' },
    // Windmill at center
    { type: 'building', x: 36, z: 36, width: 4, height: 4, color: '#8a7a5a' },
    // Rock outcroppings
    { type: 'building', x: 18, z: 18, width: 3, height: 3, color: '#8a8870' },
    { type: 'building', x: 54, z: 54, width: 3, height: 3, color: '#8a8870' },
    // Small pond
    { type: 'water', x: 55, z: 15, width: 4, height: 3, color: '#7ab8d8' },
  ],
};

const PRADERA_ALBA_LAYOUT: MinimapLayout = {
  backgroundColor: '#e8f0d8',
  borderColor: '#b0c890',
  bounds: { xMin: 0, xMax: 80, zMin: 0, zMax: 80 },
  features: [
    { type: 'road', x: 40, z: 10, width: 80, height: 0.5, color: '#d0c8a8' },
    { type: 'road', x: 40, z: 40, width: 80, height: 0.5, color: '#d0c8a8' },
    { type: 'road', x: 40, z: 70, width: 80, height: 0.5, color: '#d0c8a8' },
    { type: 'road', x: 10, z: 40, width: 0.5, height: 80, color: '#d0c8a8' },
    { type: 'road', x: 70, z: 40, width: 0.5, height: 80, color: '#d0c8a8' },
    { type: 'plaza', x: 40, z: 40, width: 6, height: 6, color: '#d8e0c0' },
    { type: 'park', x: 15, z: 15, width: 8, height: 8, color: '#a0d080' },
    { type: 'park', x: 65, z: 65, width: 8, height: 8, color: '#a0d080' },
  ],
};

const CAMINO_ESTE_LAYOUT: MinimapLayout = {
  backgroundColor: '#d8d8c0',
  borderColor: '#a0a088',
  bounds: { xMin: 0, xMax: 100, zMin: 0, zMax: 100 },
  features: [
    { type: 'road', x: 50, z: 50, width: 100, height: 0.6, color: '#c8b898' },
    { type: 'road', x: 12, z: 50, width: 0.5, height: 100, color: '#c8b898' },
    { type: 'water', x: 50, z: 50, width: 3, height: 3, color: '#7ab8d0' },
    { type: 'building', x: 77, z: 22, width: 6, height: 5, color: '#a09878' },
    { type: 'building', x: 35, z: 15, width: 3, height: 2, color: '#b8a888' },
    { type: 'park', x: 18, z: 18, width: 7, height: 7, color: '#90c070' },
    { type: 'park', x: 82, z: 40, width: 7, height: 7, color: '#90c070' },
  ],
};

const BOSQUE_UMBRIO_LAYOUT: MinimapLayout = {
  backgroundColor: '#2a3828',
  borderColor: '#4a6a44',
  bounds: { xMin: 0, xMax: 120, zMin: 0, zMax: 120 },
  features: [
    { type: 'road', x: 10, z: 60, width: 0.5, height: 120, color: '#3a4a34' },
    { type: 'road', x: 60, z: 110, width: 120, height: 0.5, color: '#3a4a34' },
    { type: 'road', x: 110, z: 60, width: 0.5, height: 120, color: '#3a4a34' },
    { type: 'water', x: 52, z: 55, width: 8, height: 8, color: '#2a4a3a' },
    { type: 'plaza', x: 60, z: 50, width: 5, height: 5, color: '#3a5030' },
    { type: 'park', x: 28, z: 28, width: 10, height: 10, color: '#3a5830' },
    { type: 'park', x: 90, z: 50, width: 10, height: 10, color: '#3a5830' },
  ],
};

const COLINAS_VENTOSAS_LAYOUT: MinimapLayout = {
  backgroundColor: '#d0d8c0',
  borderColor: '#98a888',
  bounds: { xMin: 0, xMax: 100, zMin: 0, zMax: 100 },
  features: [
    { type: 'road', x: 50, z: 12, width: 100, height: 0.5, color: '#c0b890' },
    { type: 'road', x: 50, z: 50, width: 100, height: 0.5, color: '#c0b890' },
    { type: 'road', x: 50, z: 88, width: 100, height: 0.5, color: '#c0b890' },
    { type: 'road', x: 12, z: 50, width: 0.5, height: 100, color: '#c0b890' },
    { type: 'building', x: 50, z: 50, width: 4, height: 4, color: '#8a8a6a' },
    { type: 'park', x: 18, z: 18, width: 8, height: 8, color: '#90b870' },
    { type: 'park', x: 82, z: 82, width: 8, height: 8, color: '#90b870' },
  ],
};

const RUINAS_ANCESTRALES_LAYOUT: MinimapLayout = {
  backgroundColor: '#d0c8a8',
  borderColor: '#a09870',
  bounds: { xMin: 0, xMax: 120, zMin: 0, zMax: 120 },
  features: [
    { type: 'road', x: 10, z: 60, width: 0.6, height: 120, color: '#b8a880' },
    { type: 'road', x: 60, z: 110, width: 120, height: 0.6, color: '#b8a880' },
    { type: 'road', x: 110, z: 60, width: 0.6, height: 120, color: '#b8a880' },
    { type: 'building', x: 40, z: 40, width: 12, height: 12, color: '#a09068' },
    { type: 'building', x: 80, z: 50, width: 8, height: 8, color: '#988860' },
    { type: 'building', x: 60, z: 75, width: 6, height: 6, color: '#a09068' },
    { type: 'plaza', x: 50, z: 28, width: 6, height: 5, color: '#c8b898' },
    { type: 'water', x: 50, z: 25, width: 4, height: 4, color: '#7ab8d0' },
  ],
};

const COSTA_DEL_ECO_LAYOUT: MinimapLayout = {
  backgroundColor: '#c8d8d0',
  borderColor: '#88a8a0',
  bounds: { xMin: 0, xMax: 120, zMin: 0, zMax: 120 },
  features: [
    { type: 'road', x: 10, z: 60, width: 0.5, height: 120, color: '#b8c8b8' },
    { type: 'water', x: 110, z: 60, width: 20, height: 120, color: '#5a8aaa' },
    { type: 'building', x: 90, z: 30, width: 4, height: 4, color: '#a09878' },
    { type: 'building', x: 50, z: 75, width: 6, height: 3, color: '#8a7a5a' },
    { type: 'park', x: 15, z: 15, width: 8, height: 8, color: '#80a890' },
  ],
};

const CUEVA_SUSURROS_LAYOUT: MinimapLayout = {
  backgroundColor: '#1a1828',
  borderColor: '#383050',
  bounds: { xMin: 0, xMax: 80, zMin: 0, zMax: 80 },
  features: [
    { type: 'road', x: 40, z: 40, width: 0.4, height: 80, color: '#282040' },
    { type: 'road', x: 40, z: 40, width: 80, height: 0.4, color: '#282040' },
    { type: 'building', x: 20, z: 20, width: 2, height: 2, color: '#403060' },
    { type: 'building', x: 60, z: 20, width: 2, height: 2, color: '#403060' },
    { type: 'building', x: 20, z: 60, width: 2, height: 2, color: '#403060' },
    { type: 'building', x: 60, z: 60, width: 2, height: 2, color: '#403060' },
    { type: 'plaza', x: 40, z: 40, width: 5, height: 5, color: '#383058' },
    { type: 'building', x: 40, z: 40, width: 2, height: 2, color: '#504070' },
  ],
};

const CUEVA_CRISTAL_LAYOUT: MinimapLayout = {
  backgroundColor: '#1a2030',
  borderColor: '#405068',
  bounds: { xMin: 0, xMax: 80, zMin: 0, zMax: 80 },
  features: [
    { type: 'road', x: 10, z: 40, width: 0.5, height: 80, color: '#2a3850' },
    { type: 'road', x: 40, z: 40, width: 80, height: 0.5, color: '#2a3850' },
    { type: 'road', x: 70, z: 40, width: 0.5, height: 80, color: '#2a3850' },
    { type: 'plaza', x: 40, z: 40, width: 8, height: 8, color: '#305068' },
    { type: 'water', x: 40, z: 68, width: 8, height: 5, color: '#3a6a8a' },
  ],
};

const SANTUARIO_OLVIDADO_LAYOUT: MinimapLayout = {
  backgroundColor: '#2a2030',
  borderColor: '#504068',
  bounds: { xMin: 0, xMax: 100, zMin: 0, zMax: 100 },
  features: [
    { type: 'road', x: 10, z: 50, width: 0.5, height: 100, color: '#382848' },
    { type: 'road', x: 50, z: 90, width: 100, height: 0.5, color: '#382848' },
    { type: 'road', x: 90, z: 50, width: 0.5, height: 100, color: '#382848' },
    { type: 'building', x: 30, z: 30, width: 6, height: 6, color: '#504070' },
    { type: 'building', x: 70, z: 30, width: 6, height: 6, color: '#504070' },
    { type: 'building', x: 30, z: 70, width: 6, height: 6, color: '#504070' },
    { type: 'building', x: 70, z: 70, width: 6, height: 6, color: '#504070' },
    { type: 'plaza', x: 50, z: 50, width: 6, height: 6, color: '#483868' },
    { type: 'plaza', x: 8, z: 48, width: 4, height: 4, color: '#403060' },
  ],
};

const CASTILLO_OLVIDADO_LAYOUT: MinimapLayout = {
  backgroundColor: '#2a2030',
  borderColor: '#504068',
  bounds: { xMin: 0, xMax: 180, zMin: 0, zMax: 180 },
  features: [
    { type: 'road', x: 10, z: 90, width: 0.5, height: 180, color: '#382848' },
    { type: 'road', x: 90, z: 10, width: 180, height: 0.5, color: '#382848' },
    { type: 'road', x: 90, z: 90, width: 180, height: 0.5, color: '#382848' },
    { type: 'road', x: 90, z: 170, width: 180, height: 0.5, color: '#382848' },
    { type: 'road', x: 170, z: 90, width: 0.5, height: 180, color: '#382848' },
    { type: 'building', x: 90, z: 90, width: 40, height: 40, color: '#504070' },
    { type: 'building', x: 90, z: 90, width: 16, height: 16, color: '#604880' },
    { type: 'building', x: 40, z: 40, width: 8, height: 8, color: '#403060' },
    { type: 'building', x: 140, z: 40, width: 8, height: 8, color: '#403060' },
    { type: 'building', x: 40, z: 140, width: 8, height: 8, color: '#403060' },
    { type: 'building', x: 140, z: 140, width: 8, height: 8, color: '#403060' },
    { type: 'plaza', x: 8, z: 88, width: 4, height: 4, color: '#403060' },
    { type: 'plaza', x: 90, z: 8, width: 4, height: 4, color: '#403060' },
  ],
};

const MAP_LAYOUTS: Record<string, MinimapLayout> = {
  prontera_city: PRONTERA_LAYOUT,
  prontera_field: PRONTERA_FIELD_LAYOUT,
  training_dungeon: TRAINING_DUNGEON_LAYOUT,
  laderas_molino: LADERAS_MOLINO_LAYOUT,
  pradera_alba: PRADERA_ALBA_LAYOUT,
  camino_del_este: CAMINO_ESTE_LAYOUT,
  bosque_umbrio: BOSQUE_UMBRIO_LAYOUT,
  colinas_ventosas: COLINAS_VENTOSAS_LAYOUT,
  ruinas_ancestrales: RUINAS_ANCESTRALES_LAYOUT,
  costa_del_eco: COSTA_DEL_ECO_LAYOUT,
  cueva_susurros: CUEVA_SUSURROS_LAYOUT,
  cueva_cristal: CUEVA_CRISTAL_LAYOUT,
  santuario_olvidado: SANTUARIO_OLVIDADO_LAYOUT,
  castillo_olvidado: CASTILLO_OLVIDADO_LAYOUT,
};

export function getMinimapLayout(mapId: string): MinimapLayout | null {
  return MAP_LAYOUTS[mapId] ?? null;
}
