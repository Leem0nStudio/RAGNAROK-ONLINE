import { MapDefinition } from '../types'

export const costaDelEco: MapDefinition = {
  id: 'costa_del_eco',
  name: 'Costa del Eco',
  width: 120,
  height: 120,
  biome: 'mountain',
  music: 'ambient_costa_del_eco',
  spawns: [
    { id: 'bosque_entrada', position: { x: 10, z: 60 } },
  ],
  portals: [
    {
      id: 'portal_to_bosque',
      position: { x: 4, z: 60 },
      radius: 4,
      targetMapId: 'bosque_umbrio',
      targetSpawnId: 'camino_gate',
      label: '→ Bosque Umbrío',
    },
  ],
  npcs: [],
  monsters: [
    { monsterId: 'drainliar', position: { x: 30, z: 30 }, respawnSeconds: 8 },
    { monsterId: 'drainliar', position: { x: 60, z: 25 }, respawnSeconds: 8 },
    { monsterId: 'drainliar', position: { x: 45, z: 70 }, respawnSeconds: 8 },
    { monsterId: 'drainliar', position: { x: 85, z: 55 }, respawnSeconds: 8 },
    { monsterId: 'argiope', position: { x: 50, z: 50 }, respawnSeconds: 9 },
    { monsterId: 'argiope', position: { x: 75, z: 30 }, respawnSeconds: 9 },
    { monsterId: 'shining_plant', position: { x: 35, z: 65 }, respawnSeconds: 7 },
    { monsterId: 'shining_plant', position: { x: 70, z: 75 }, respawnSeconds: 7 },
  ],
  props: [
    // Coastal rocks
    { propId: 'rock_a', position: { x: 20, z: 20 }, scale: 1.2 },
    { propId: 'rock_b', position: { x: 80, z: 25 }, scale: 1.4 },
    { propId: 'rock_a', position: { x: 95, z: 50 }, scale: 1.1 },
    { propId: 'rock_c', position: { x: 40, z: 85 }, scale: 1 },
    { propId: 'rock_b', position: { x: 70, z: 90 }, scale: 1.3 },
    { propId: 'rock_c', position: { x: 15, z: 70 }, scale: 0.8 },
    // Lighthouse
    { propId: 'pillar', position: { x: 90, z: 30 }, scale: 1.5 },
    { propId: 'torch', position: { x: 90, z: 30 }, scale: 1.2 },
    // Shipwreck
    { propId: 'cart', position: { x: 50, z: 75 }, scale: 1.2 },
    { propId: 'barrel', position: { x: 48, z: 78 }, scale: 0.8 },
    { propId: 'barrel', position: { x: 52, z: 76 }, scale: 0.7 },
    { propId: 'crate', position: { x: 50, z: 73 }, scale: 0.8 },
    { propId: 'crate', position: { x: 54, z: 74 }, scale: 0.7 },
    // Sea cave entrance
    { propId: 'fence_stone', position: { x: 30, z: 55 }, scale: 0.9 },
    { propId: 'fence_stone', position: { x: 34, z: 55 }, scale: 0.9 },
    // Cliffs edge markers
    { propId: 'fence_wood', position: { x: 60, z: 100 }, scale: 0.8 },
    { propId: 'fence_wood', position: { x: 100, z: 60 }, scale: 0.8 },
    { propId: 'fence_wood', position: { x: 55, z: 105 }, scale: 0.8 },
    // Scrub bushes
    { propId: 'bush_round', position: { x: 25, z: 40 }, scale: 0.5 },
    { propId: 'bush_round', position: { x: 65, z: 45 }, scale: 0.6 },
    { propId: 'bush_a', position: { x: 80, z: 65 }, scale: 0.5 },
    { propId: 'bush_a', position: { x: 35, z: 95 }, scale: 0.5 },
    // Trees
    { propId: 'tree_conifer', position: { x: 15, z: 15 }, scale: 0.9 },
    { propId: 'tree_deciduous', position: { x: 65, z: 15 }, scale: 1 },
    { propId: 'tree_conifer', position: { x: 25, z: 80 }, scale: 0.8 },
    // Signpost
    { propId: 'signpost_guide', position: { x: 8, z: 58 }, scale: 0.8 },
  ],
}
