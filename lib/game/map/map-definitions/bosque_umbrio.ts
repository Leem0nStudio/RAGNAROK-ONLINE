import { MapDefinition } from '../types'

export const bosqueUmbrio: MapDefinition = {
  id: 'bosque_umbrio',
  name: 'Bosque Umbrío',
  width: 120,
  height: 120,
  biome: 'forest',
  music: 'ambient_bosque_umbrio',
  spawns: [
    { id: 'camino_gate', position: { x: 10, z: 60 } },
  ],
  portals: [
    {
      id: 'portal_to_camino',
      position: { x: 4, z: 60 },
      radius: 4,
      targetMapId: 'camino_del_este',
      targetSpawnId: 'pradera_gate',
      label: '→ Camino del Este',
    },
    {
      id: 'portal_to_cueva_susurros',
      position: { x: 60, z: 116 },
      radius: 4,
      targetMapId: 'cueva_susurros',
      targetSpawnId: 'bosque_entrada',
      label: '→ Cueva de los Susurros',
    },
    {
      id: 'portal_to_costa',
      position: { x: 116, z: 60 },
      radius: 4,
      targetMapId: 'costa_del_eco',
      targetSpawnId: 'bosque_entrada',
      label: '→ Costa del Eco',
    },
  ],
  npcs: [
    { npcId: 'npc_spirit', position: { x: 60, z: 50 } },
  ],
  monsters: [
    { monsterId: 'spore', position: { x: 30, z: 30 }, respawnSeconds: 7 },
    { monsterId: 'spore', position: { x: 50, z: 25 }, respawnSeconds: 7 },
    { monsterId: 'spore', position: { x: 70, z: 35 }, respawnSeconds: 7 },
    { monsterId: 'spore', position: { x: 40, z: 80 }, respawnSeconds: 7 },
    { monsterId: 'spore', position: { x: 90, z: 70 }, respawnSeconds: 7 },
    { monsterId: 'drainliar', position: { x: 60, z: 40 }, respawnSeconds: 8 },
    { monsterId: 'drainliar', position: { x: 45, z: 80 }, respawnSeconds: 8 },
    { monsterId: 'drainliar', position: { x: 80, z: 55 }, respawnSeconds: 8 },
    { monsterId: 'stalker', position: { x: 55, z: 65 }, respawnSeconds: 10 },
    { monsterId: 'stalker', position: { x: 75, z: 85 }, respawnSeconds: 10 },
    { monsterId: 'will_o_wisp', position: { x: 35, z: 50 }, respawnSeconds: 9 },
    { monsterId: 'will_o_wisp', position: { x: 85, z: 40 }, respawnSeconds: 9 },
  ],
  props: [
    // Dense forest props
    { propId: 'rock_a', position: { x: 25, z: 25 }, scale: 0.7 },
    { propId: 'rock_b', position: { x: 95, z: 65 }, scale: 0.8 },
    { propId: 'rock_c', position: { x: 50, z: 95 }, scale: 0.9 },
    { propId: 'rock_d', position: { x: 70, z: 25 }, scale: 0.5 },
    { propId: 'rock_a', position: { x: 15, z: 85 }, scale: 0.6 },
    { propId: 'bush_a', position: { x: 30, z: 15 }, scale: 0.6 },
    { propId: 'bush_a', position: { x: 65, z: 15 }, scale: 0.7 },
    { propId: 'bush_round', position: { x: 20, z: 45 }, scale: 0.5 },
    { propId: 'bush_round', position: { x: 90, z: 30 }, scale: 0.6 },
    { propId: 'bush_a', position: { x: 45, z: 100 }, scale: 0.6 },
    { propId: 'bush_round', position: { x: 100, z: 95 }, scale: 0.5 },
    // Logs and moss
    { propId: 'fence_wood', position: { x: 35, z: 35 }, rotation: 0.5 },
    { propId: 'fence_wood', position: { x: 85, z: 85 }, rotation: -0.3 },
    { propId: 'fence_wood', position: { x: 55, z: 55 }, rotation: 0.8 },
    // Dark pond
    { propId: 'ruin_slab', position: { x: 50, z: 55 }, scale: 0.5 },
    { propId: 'ruin_slab', position: { x: 55, z: 55 }, scale: 0.5 },
    // Trees as props (dense forest)
    { propId: 'tree_deciduous', position: { x: 28, z: 28 }, scale: 1.1 },
    { propId: 'tree_deciduous', position: { x: 75, z: 45 }, scale: 1.2 },
    { propId: 'tree_conifer', position: { x: 40, z: 65 }, scale: 1 },
    { propId: 'tree_conifer', position: { x: 90, z: 50 }, scale: 1.1 },
    { propId: 'tree_deciduous', position: { x: 15, z: 70 }, scale: 1 },
    { propId: 'tree_conifer', position: { x: 65, z: 95 }, scale: 1.2 },
    // Torches near entrance (first safe area)
    { propId: 'torch', position: { x: 8, z: 58 }, scale: 1 },
    { propId: 'torch', position: { x: 8, z: 62 }, scale: 1 },
    // Signs
    { propId: 'signpost_danger', position: { x: 14, z: 58 }, scale: 0.8 },
    { propId: 'signpost_guide', position: { x: 55, z: 114 }, scale: 0.8 },
  ],
  biomeOverrides: {
    trees: [
      { propId: 'tree_deciduous', position: { x: 20, z: 10 }, scale: 1.1 },
      { propId: 'tree_conifer', position: { x: 100, z: 10 }, scale: 1 },
      { propId: 'tree_deciduous', position: { x: 10, z: 110 }, scale: 1.2 },
      { propId: 'tree_conifer', position: { x: 110, z: 110 }, scale: 1.1 },
      { propId: 'tree_deciduous', position: { x: 110, z: 30 }, scale: 1 },
      { propId: 'tree_conifer', position: { x: 50, z: 110 }, scale: 1.1 },
    ],
  },
}
