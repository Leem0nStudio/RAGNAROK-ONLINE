import { MapDefinition } from '../types'

export const colinasVentosas: MapDefinition = {
  id: 'colinas_ventosas',
  name: 'Colinas Ventosas',
  width: 100,
  height: 100,
  biome: 'plains',
  music: 'ambient_colinas_ventosas',
  spawns: [
    { id: 'laderas_gate_spawn', position: { x: 50, z: 10 } },
  ],
  portals: [
    {
      id: 'portal_to_laderas',
      position: { x: 50, z: 4 },
      radius: 4,
      targetMapId: 'laderas_molino',
      targetSpawnId: 'colinas_return_spawn',
      label: '→ Laderas del Molino',
    },
    {
      id: 'portal_to_cueva_cristal',
      position: { x: 50, z: 96 },
      radius: 4,
      targetMapId: 'cueva_cristal',
      targetSpawnId: 'colinas_entrada',
      label: '→ Cueva de Cristal',
    },
  ],
  npcs: [],
  monsters: [
    { monsterId: 'savage_baby', position: { x: 25, z: 30 }, respawnSeconds: 8 },
    { monsterId: 'savage_baby', position: { x: 60, z: 35 }, respawnSeconds: 8 },
    { monsterId: 'savage_baby', position: { x: 40, z: 70 }, respawnSeconds: 8 },
    { monsterId: 'pecopeco', position: { x: 50, z: 25 }, respawnSeconds: 10 },
    { monsterId: 'pecopeco', position: { x: 75, z: 50 }, respawnSeconds: 10 },
    { monsterId: 'pecopeco', position: { x: 30, z: 65 }, respawnSeconds: 10 },
    { monsterId: 'argiope', position: { x: 65, z: 70 }, respawnSeconds: 9 },
    { monsterId: 'argiope', position: { x: 35, z: 40 }, respawnSeconds: 9 },
  ],
  props: [
    // Large rocks
    { propId: 'rock_a', position: { x: 20, z: 20 }, scale: 1 },
    { propId: 'rock_c', position: { x: 80, z: 30 }, scale: 1.2 },
    { propId: 'rock_b', position: { x: 70, z: 80 }, scale: 1.1 },
    { propId: 'rock_c', position: { x: 30, z: 85 }, scale: 0.9 },
    { propId: 'rock_a', position: { x: 85, z: 65 }, scale: 0.8 },
    // Windmill at crest
    { propId: 'windmill', position: { x: 50, z: 50 }, scale: 1.3 },
    // Fences
    { propId: 'fence_wood', position: { x: 45, z: 8 }, rotation: 0.3 },
    { propId: 'fence_wood', position: { x: 55, z: 8 }, rotation: -0.3 },
    { propId: 'fence_stone', position: { x: 48, z: 94 }, rotation: 0.2 },
    { propId: 'fence_stone', position: { x: 52, z: 94 }, rotation: -0.2 },
    // Bushes
    { propId: 'bush_round', position: { x: 15, z: 40 }, scale: 0.6 },
    { propId: 'bush_round', position: { x: 75, z: 20 }, scale: 0.7 },
    { propId: 'bush_a', position: { x: 60, z: 60 }, scale: 0.5 },
    { propId: 'bush_a', position: { x: 40, z: 45 }, scale: 0.6 },
    // Scattered trees
    { propId: 'tree_conifer', position: { x: 18, z: 18 }, scale: 1 },
    { propId: 'tree_conifer', position: { x: 82, z: 82 }, scale: 1.1 },
    { propId: 'tree_deciduous', position: { x: 75, z: 15 }, scale: 0.9 },
    { propId: 'tree_deciduous', position: { x: 15, z: 75 }, scale: 0.9 },
    // Signposts
    { propId: 'signpost_guide', position: { x: 48, z: 6 }, scale: 0.8 },
    { propId: 'signpost_guide', position: { x: 52, z: 94 }, scale: 0.8 },
  ],
  biomeOverrides: {
    trees: [
      { propId: 'tree_conifer', position: { x: 10, z: 50 }, scale: 0.9 },
      { propId: 'tree_conifer', position: { x: 90, z: 40 }, scale: 1 },
      { propId: 'tree_deciduous', position: { x: 50, z: 90 }, scale: 0.8 },
      { propId: 'tree_conifer', position: { x: 40, z: 12 }, scale: 0.9 },
    ],
  },
}
