import { MapDefinition } from '../types'

export const pronteraField: MapDefinition = {
  id: 'prontera_field',
  name: 'Campo de Prontera',
  width: 80,
  height: 80,
  biome: 'plains',
  music: 'ambient_prontera_fields',
  spawns: [
    { id: 'city_gate_spawn', position: { x: 10, z: 40 } },
    { id: 'field_center', position: { x: 40, z: 40 } },
    { id: 'molino_gate', position: { x: 74, z: 40 } },
  ],
  portals: [
    {
      id: 'portal_to_city',
      position: { x: 6, z: 40 },
      radius: 4,
      targetMapId: 'prontera_city',
      targetSpawnId: 'south_gate_spawn',
      label: '→ Prontera',
    },
    {
      id: 'portal_to_molino',
      position: { x: 76, z: 40 },
      radius: 4,
      targetMapId: 'laderas_molino',
      targetSpawnId: 'molino_entrada',
      label: '→ Laderas del Molino',
    },
  ],
  npcs: [
    { npcId: 'npc_field_guide', position: { x: 20, z: 30 } },
  ],
  monsters: [
    { monsterId: 'poring', position: { x: 30, z: 30 }, respawnSeconds: 6 },
    { monsterId: 'poring', position: { x: 50, z: 50 }, respawnSeconds: 6 },
    { monsterId: 'poring', position: { x: 35, z: 55 }, respawnSeconds: 8 },
    { monsterId: 'lunatic', position: { x: 60, z: 30 }, respawnSeconds: 7 },
    { monsterId: 'lunatic', position: { x: 45, z: 25 }, respawnSeconds: 7 },
    { monsterId: 'fabre', position: { x: 55, z: 55 }, respawnSeconds: 8 },
  ],
  props: [
    // Rocks scattered around
    { propId: 'rock_a', position: { x: 25, z: 20 }, scale: 0.8 },
    { propId: 'rock_a', position: { x: 55, z: 45 }, scale: 1 },
    { propId: 'rock_b', position: { x: 40, z: 60 }, scale: 0.9 },
    { propId: 'rock_b', position: { x: 20, z: 55 }, scale: 0.7 },
    // Bushes
    { propId: 'bush_a', position: { x: 30, z: 15 }, scale: 0.6 },
    { propId: 'bush_a', position: { x: 50, z: 20 }, scale: 0.7 },
    { propId: 'bush_a', position: { x: 15, z: 45 }, scale: 0.5 },
    // Fence near the city gate
    { propId: 'fence_wood', position: { x: 8, z: 36 }, rotation: 0.5 },
    { propId: 'fence_wood', position: { x: 8, z: 44 }, rotation: -0.5 },
    // Signpost
    { propId: 'signpost_guide', position: { x: 14, z: 38 }, scale: 0.8 },
  ],
  biomeOverrides: {
    trees: [
      { propId: 'tree_deciduous', position: { x: 28, z: 18 }, scale: 0.9 },
      { propId: 'tree_deciduous', position: { x: 52, z: 22 }, scale: 1 },
      { propId: 'tree_deciduous', position: { x: 48, z: 58 }, scale: 0.8 },
      { propId: 'tree_deciduous', position: { x: 22, z: 52 }, scale: 0.9 },
    ],
  },
}
