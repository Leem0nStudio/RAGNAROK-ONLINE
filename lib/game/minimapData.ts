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
  bounds: { xMin: -32, xMax: 32, zMin: -32, zMax: 32 },
  features: [
    // Main horizontal streets (Z = -24, -16, -8, 0, 8, 16, 24)
    ...[-24, -16, -8, 0, 8, 16, 24].map(z => ({
      type: 'road' as const, x: 0, z, width: 64, height: 0.6, color: '#d4c8a8',
    })),
    // Main vertical streets (X = -24, -16, -8, 0, 8, 16, 24)
    ...[-24, -16, -8, 0, 8, 16, 24].map(x => ({
      type: 'road' as const, x, z: 0, width: 0.6, height: 64, color: '#d4c8a8',
    })),
    // Castle at (0, -12) — large L-shaped building
    { type: 'building', x: 0, z: -12, width: 14, height: 7, color: '#c0b0a0' },
    // Fountain at (0, 6)
    { type: 'water', x: 0, z: 6, width: 2.5, height: 2.5, color: '#7ab8e0' },
    // Kafra building (-12, 0)
    { type: 'building', x: -12, z: 0, width: 5, height: 5, color: '#d4a373' },
    // Market area (12, 0)
    { type: 'building', x: 12, z: 0, width: 6, height: 6, color: '#e8c8a0' },
    // Temple (0, 14)
    { type: 'building', x: 0, z: 14, width: 6, height: 6, color: '#e0d0c0' },
    // Guild buildings near center
    { type: 'building', x: -10, z: 12, width: 4, height: 4, color: '#a080c0' },
    { type: 'building', x: 10, z: 12, width: 4, height: 4, color: '#c08080' },
    // Pond (-20, -20)
    { type: 'water', x: -20, z: -20, width: 4, height: 4, color: '#6aa8d0' },
    // Park/green areas in corners
    { type: 'park', x: -20, z: 20, width: 7, height: 7, color: '#a0c080' },
    { type: 'park', x: 20, z: -20, width: 7, height: 7, color: '#a0c080' },
    // Small buildings / houses scattered in city blocks
    { type: 'building', x: -20, z: -4, width: 3, height: 3, color: '#d8c8b0' },
    { type: 'building', x: -20, z: 4, width: 3, height: 3, color: '#d8c8b0' },
    { type: 'building', x: 20, z: -4, width: 3, height: 3, color: '#d8c8b0' },
    { type: 'building', x: 20, z: 4, width: 3, height: 3, color: '#d8c8b0' },
    { type: 'building', x: -4, z: -20, width: 3, height: 3, color: '#d8c8b0' },
    { type: 'building', x: 4, z: -20, width: 3, height: 3, color: '#d8c8b0' },
    { type: 'building', x: -4, z: 20, width: 3, height: 3, color: '#d8c8b0' },
    { type: 'building', x: 4, z: 20, width: 3, height: 3, color: '#d8c8b0' },
    // Gate areas (small squares at cardinal exits)
    { type: 'plaza', x: -28, z: 0, width: 4, height: 4, color: '#e0d4c0' },
    { type: 'plaza', x: 28, z: 0, width: 4, height: 4, color: '#e0d4c0' },
    { type: 'plaza', x: 0, z: -28, width: 4, height: 4, color: '#e0d4c0' },
    { type: 'plaza', x: 0, z: 28, width: 4, height: 4, color: '#e0d4c0' },
  ],
};

const MAP_LAYOUTS: Record<string, MinimapLayout> = {
  prontera_city: PRONTERA_LAYOUT,
};

export function getMinimapLayout(mapId: string): MinimapLayout | null {
  return MAP_LAYOUTS[mapId] ?? null;
}
