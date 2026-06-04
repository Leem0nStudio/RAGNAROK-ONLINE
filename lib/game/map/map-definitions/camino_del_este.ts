import { MapDefinition } from '../types'

export const caminoDelEste: MapDefinition = {
  id: 'camino_del_este',
  name: 'Camino del Este',
  width: 100,
  height: 100,
  biome: 'plains',
  music: 'ambient_prontera_fields',
  spawns: [
    { id: 'pradera_gate', position: { x: 10, z: 50 } },
  ],
  portals: [
    {
      id: 'portal_to_pradera',
      position: { x: 4, z: 50 },
      radius: 4,
      targetMapId: 'pradera_alba',
      targetSpawnId: 'alba_entrada',
      label: '→ Pradera del Alba',
    },
    {
      id: 'portal_to_bosque',
      position: { x: 96, z: 50 },
      radius: 4,
      targetMapId: 'bosque_umbrio',
      targetSpawnId: 'camino_gate',
      label: '→ Bosque Umbrío',
    },
  ],
  npcs: [
    { npcId: 'npc_bosque_guard', position: { x: 30, z: 50 } },
    { npcId: 'npc_shady_merchant', position: { x: 65, z: 55 } },
  ],
  monsters: [
    { monsterId: 'picky', position: { x: 25, z: 25 }, respawnSeconds: 7 },
    { monsterId: 'picky', position: { x: 50, z: 30 }, respawnSeconds: 7 },
    { monsterId: 'picky', position: { x: 75, z: 45 }, respawnSeconds: 7 },
    { monsterId: 'fabre', position: { x: 35, z: 70 }, respawnSeconds: 8 },
    { monsterId: 'fabre', position: { x: 60, z: 20 }, respawnSeconds: 8 },
    { monsterId: 'chonchon', position: { x: 45, z: 40 }, respawnSeconds: 6 },
    { monsterId: 'chonchon', position: { x: 55, z: 65 }, respawnSeconds: 6 },
  ],
  props: [
    { propId: 'rock_a', position: { x: 15, z: 20 }, scale: 0.8 },
    { propId: 'rock_a', position: { x: 85, z: 50 }, scale: 1 },
    { propId: 'rock_b', position: { x: 50, z: 80 }, scale: 0.9 },
    { propId: 'rock_c', position: { x: 30, z: 75 }, scale: 0.7 },
    { propId: 'bush_a', position: { x: 20, z: 40 }, scale: 0.6 },
    { propId: 'bush_a', position: { x: 70, z: 35 }, scale: 0.7 },
    { propId: 'bush_a', position: { x: 40, z: 85 }, scale: 0.5 },
    { propId: 'bush_round', position: { x: 55, z: 25 }, scale: 0.6 },
    { propId: 'bush_round', position: { x: 25, z: 60 }, scale: 0.5 },
    // Stone bridge at center
    { propId: 'fence_stone', position: { x: 48, z: 50 }, scale: 0.8 },
    { propId: 'fence_stone', position: { x: 52, z: 50 }, scale: 0.8 },
    // Watchtower ruins (north-east area)
    { propId: 'ruin_column', position: { x: 75, z: 20 }, scale: 0.9 },
    { propId: 'ruin_column', position: { x: 80, z: 25 }, scale: 0.8 },
    { propId: 'ruin_slab', position: { x: 77, z: 22 }, scale: 0.7 },
    // Abandoned cart
    { propId: 'cart', position: { x: 35, z: 15 }, scale: 0.8 },
    // Signposts
    { propId: 'signpost_guide', position: { x: 12, z: 48 }, scale: 0.8 },
    { propId: 'signpost_a', position: { x: 90, z: 48 }, scale: 0.8 },
    // Fence near gate
    { propId: 'fence_wood', position: { x: 6, z: 46 }, rotation: 0.3 },
    { propId: 'fence_wood', position: { x: 6, z: 54 }, rotation: -0.3 },
    // Trees
    { propId: 'tree_deciduous', position: { x: 18, z: 18 }, scale: 1 },
    { propId: 'tree_deciduous', position: { x: 82, z: 40 }, scale: 1 },
    { propId: 'tree_conifer', position: { x: 40, z: 12 }, scale: 0.9 },
    { propId: 'tree_conifer', position: { x: 60, z: 80 }, scale: 0.9 },
  ],
  biomeOverrides: {
    trees: [
      { propId: 'tree_deciduous', position: { x: 10, z: 10 }, scale: 0.8 },
      { propId: 'tree_deciduous', position: { x: 90, z: 10 }, scale: 0.9 },
      { propId: 'tree_conifer', position: { x: 20, z: 90 }, scale: 0.8 },
      { propId: 'tree_conifer', position: { x: 80, z: 90 }, scale: 0.9 },
    ],
  },
}
