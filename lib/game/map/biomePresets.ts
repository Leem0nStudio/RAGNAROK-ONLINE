import { PropSpawn } from './types'

export interface BiomePreset {
  trees: PropSpawn[]
  rocks: PropSpawn[]
  grass: PropSpawn[]
  landmarks: string[]
  groundTileWeights: Record<string, number>
  fogColor: string
  ambientLight: { intensity: number; color: string }
  atlasUrl: string
  tileSet: [number, number, number, number]
  heightConfig: { amplitude: number; roughness: number }
  hasWater: boolean
  waterColor: number
}

export const BIOME_PRESETS: Record<string, BiomePreset> = {
  city: {
    trees: [{ propId: 'tree_deciduous', position: { x: 3, z: -24 }, scale: 1 },
            { propId: 'tree_deciduous', position: { x: -3, z: -24 }, scale: 1 }],
    rocks: [],
    grass: [{ propId: 'planter_box', position: { x: 4, z: 10 }, scale: 1 },
            { propId: 'planter_box', position: { x: -4, z: 10 }, scale: 1 }],
    landmarks: ['fountain_01', 'statue_01', 'bench_01'],
    groundTileWeights: { stone: 0.6, grass: 0.2, path: 0.2 },
    fogColor: '#d4c9b0',
    ambientLight: { intensity: 0.9, color: '#fff4e0' },
    atlasUrl: '/textures/tiles/terrain_atlas.png',
    tileSet: [0, 4, 8, 12],
    heightConfig: { amplitude: 1.0, roughness: 0.3 },
    hasWater: false,
    waterColor: 0x1a5a8a,
  },
  plains: {
    trees: [],
    rocks: [{ propId: 'rock_a', position: { x: 10, z: 10 }, scale: 0.8 },
            { propId: 'rock_b', position: { x: -8, z: 15 }, scale: 1 }],
    grass: [{ propId: 'grass_blade', position: { x: 0, z: 0 }, scale: 1 }],
    landmarks: [],
    groundTileWeights: { grass: 0.7, dirt: 0.2, stone: 0.1 },
    fogColor: '#c8d8c8',
    ambientLight: { intensity: 1.0, color: '#ffffff' },
    atlasUrl: '/textures/tiles/terrain_atlas.png',
    tileSet: [0, 4, 8, 12],
    heightConfig: { amplitude: 1.5, roughness: 0.5 },
    hasWater: true,
    waterColor: 0x1a5a8a,
  },
  forest: {
    trees: [{ propId: 'tree_conifer', position: { x: 5, z: 5 }, scale: 1 },
            { propId: 'tree_deciduous', position: { x: -5, z: -5 }, scale: 1 }],
    rocks: [{ propId: 'rock_a', position: { x: 3, z: 8 }, scale: 0.7 },
            { propId: 'rock_b', position: { x: -6, z: -7 }, scale: 0.9 }],
    grass: [{ propId: 'bush_round', position: { x: 0, z: 4 }, scale: 0.6 }],
    landmarks: ['log_01', 'mossy_rock_01'],
    groundTileWeights: { grass: 0.7, dirt: 0.2, stone: 0.1 },
    fogColor: '#c8d4b8',
    ambientLight: { intensity: 0.6, color: '#e8f4d8' },
    atlasUrl: '/textures/tiles/forest_atlas.png',
    tileSet: [0, 4, 1, 8],
    heightConfig: { amplitude: 2.5, roughness: 0.7 },
    hasWater: true,
    waterColor: 0x1a4a6a,
  },
  desert: {
    trees: [],
    rocks: [{ propId: 'rock_a', position: { x: 8, z: 6 }, scale: 1.2 },
            { propId: 'rock_b', position: { x: -10, z: -5 }, scale: 1 }],
    grass: [],
    landmarks: ['cactus_01', 'ruin_pillar_01'],
    groundTileWeights: { sand: 0.8, stone: 0.15, dirt: 0.05 },
    fogColor: '#d4c8a0',
    ambientLight: { intensity: 1.2, color: '#ffeecc' },
    atlasUrl: '/textures/tiles/desert_atlas.png',
    tileSet: [8, 12, 4, 0],
    heightConfig: { amplitude: 0.8, roughness: 0.3 },
    hasWater: false,
    waterColor: 0x1a5a8a,
  },
  mountain: {
    trees: [{ propId: 'tree_conifer', position: { x: 2, z: 3 }, scale: 0.8 }],
    rocks: [{ propId: 'rock_c', position: { x: 5, z: 2 }, scale: 1.5 },
            { propId: 'rock_d', position: { x: -4, z: -3 }, scale: 1.2 }],
    grass: [],
    landmarks: ['peak_01', 'cliff_01'],
    groundTileWeights: { stone: 0.5, dirt: 0.3, grass: 0.2 },
    fogColor: '#b8c8d8',
    ambientLight: { intensity: 0.8, color: '#e8e8ff' },
    atlasUrl: '/textures/tiles/terrain_atlas.png',
    tileSet: [0, 4, 8, 12],
    heightConfig: { amplitude: 4.0, roughness: 1.2 },
    hasWater: false,
    waterColor: 0x1a5a8a,
  },
  swamp: {
    trees: [{ propId: 'tree_deciduous', position: { x: 3, z: 2 }, scale: 0.7 }],
    rocks: [{ propId: 'rock_a', position: { x: 6, z: 5 }, scale: 0.6 }],
    grass: [{ propId: 'bush_round', position: { x: -2, z: -3 }, scale: 0.5 }],
    landmarks: ['swamp_tree_01'],
    groundTileWeights: { mud: 0.6, grass: 0.3, water: 0.1 },
    fogColor: '#a8b898',
    ambientLight: { intensity: 0.5, color: '#d8e8c8' },
    atlasUrl: '/textures/tiles/terrain_atlas.png',
    tileSet: [1, 4, 0, 8],
    heightConfig: { amplitude: 0.6, roughness: 0.4 },
    hasWater: true,
    waterColor: 0x2d4a1a,
  },
  snow: {
    trees: [{ propId: 'tree_conifer', position: { x: 0, z: 5 }, scale: 0.9 }],
    rocks: [{ propId: 'rock_c', position: { x: -5, z: -5 }, scale: 1.3 },
            { propId: 'rock_d', position: { x: 7, z: -2 }, scale: 1 }],
    grass: [],
    landmarks: ['ice_statue_01', 'snow_rock_01'],
    groundTileWeights: { snow: 0.7, ice: 0.2, stone: 0.1 },
    fogColor: '#d8dce8',
    ambientLight: { intensity: 0.7, color: '#ddeeff' },
    atlasUrl: '/textures/tiles/snow_atlas.png',
    tileSet: [4, 0, 8, 12],
    heightConfig: { amplitude: 2.0, roughness: 0.6 },
    hasWater: false,
    waterColor: 0x1a5a8a,
  },
  volcano: {
    trees: [],
    rocks: [{ propId: 'rock_a', position: { x: 3, z: 4 }, scale: 1.4 },
            { propId: 'rock_b', position: { x: -5, z: -2 }, scale: 1.1 }],
    grass: [],
    landmarks: ['lava_fall_01', 'obsidian_01'],
    groundTileWeights: { stone: 0.5, dirt: 0.3, lava: 0.2 },
    fogColor: '#d8a080',
    ambientLight: { intensity: 0.5, color: '#ff8844' },
    atlasUrl: '/textures/tiles/lava_atlas.png',
    tileSet: [12, 8, 4, 0],
    heightConfig: { amplitude: 4.0, roughness: 1.2 },
    hasWater: false,
    waterColor: 0x1a5a8a,
  },
  dungeon: {
    trees: [],
    rocks: [{ propId: 'rock_d', position: { x: 3, z: 3 }, scale: 1 }],
    grass: [],
    landmarks: ['brazier_01', 'pillar_01'],
    groundTileWeights: { stone: 0.7, dirt: 0.2, path: 0.1 },
    fogColor: '#1a1a2a',
    ambientLight: { intensity: 0.3, color: '#443355' },
    atlasUrl: '/textures/tiles/dungeon_atlas.png',
    tileSet: [8, 12, 4, 1],
    heightConfig: { amplitude: 0.5, roughness: 0.3 },
    hasWater: false,
    waterColor: 0x1a5a8a,
  },
}

export function getBiomePreset(biome: string): BiomePreset {
  return BIOME_PRESETS[biome] || BIOME_PRESETS.plains
}
