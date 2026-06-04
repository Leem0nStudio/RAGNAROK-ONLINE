import { MapDefinition } from '../types'

export const cuevaSusurros: MapDefinition = {
  id: 'cueva_susurros',
  name: 'Cueva de los Susurros',
  width: 80,
  height: 80,
  biome: 'dungeon',
  music: 'ambient_cueva_susurros',
  spawns: [
    { id: 'bosque_entrada', position: { x: 10, z: 40 } },
    { id: 'ruinas_salida', position: { x: 70, z: 40 } },
  ],
  portals: [
    {
      id: 'portal_to_bosque',
      position: { x: 4, z: 40 },
      radius: 4,
      targetMapId: 'bosque_umbrio',
      targetSpawnId: 'camino_gate',
      label: '→ Bosque Umbrío',
    },
    {
      id: 'portal_to_ruinas',
      position: { x: 76, z: 40 },
      radius: 4,
      targetMapId: 'ruinas_ancestrales',
      targetSpawnId: 'susurros_gate',
      label: '→ Ruinas Ancestrales',
    },
  ],
  npcs: [],
  monsters: [
    { monsterId: 'drainliar', position: { x: 20, z: 20 }, respawnSeconds: 8 },
    { monsterId: 'drainliar', position: { x: 50, z: 30 }, respawnSeconds: 8 },
    { monsterId: 'drainliar', position: { x: 35, z: 60 }, respawnSeconds: 8 },
    { monsterId: 'will_o_wisp', position: { x: 30, z: 45 }, respawnSeconds: 9 },
    { monsterId: 'will_o_wisp', position: { x: 55, z: 55 }, respawnSeconds: 9 },
    { monsterId: 'will_o_wisp', position: { x: 45, z: 20 }, respawnSeconds: 9 },
    { monsterId: 'spore', position: { x: 15, z: 60 }, respawnSeconds: 7 },
    { monsterId: 'spore', position: { x: 65, z: 25 }, respawnSeconds: 7 },
    { monsterId: 'spore', position: { x: 60, z: 65 }, respawnSeconds: 7 },
  ],
  props: [
    // Stalactites / pillars
    { propId: 'pillar', position: { x: 20, z: 20 }, scale: 1 },
    { propId: 'pillar', position: { x: 60, z: 20 }, scale: 1 },
    { propId: 'pillar', position: { x: 20, z: 60 }, scale: 1 },
    { propId: 'pillar', position: { x: 60, z: 60 }, scale: 1 },
    { propId: 'pillar', position: { x: 40, z: 40 }, scale: 1.1 },
    // Torches along corridors
    { propId: 'torch', position: { x: 2, z: 20 }, scale: 1 },
    { propId: 'torch', position: { x: 2, z: 30 }, scale: 1 },
    { propId: 'torch', position: { x: 2, z: 50 }, scale: 1 },
    { propId: 'torch', position: { x: 2, z: 60 }, scale: 1 },
    { propId: 'torch', position: { x: 78, z: 20 }, scale: 1 },
    { propId: 'torch', position: { x: 78, z: 30 }, scale: 1 },
    { propId: 'torch', position: { x: 78, z: 50 }, scale: 1 },
    { propId: 'torch', position: { x: 78, z: 60 }, scale: 1 },
    // Altar
    { propId: 'ruin_slab', position: { x: 40, z: 40 }, scale: 0.8 },
    { propId: 'ruin_slab', position: { x: 42, z: 40 }, scale: 0.6 },
    // Debris
    { propId: 'rock_d', position: { x: 30, z: 35 }, scale: 0.5 },
    { propId: 'rock_d', position: { x: 50, z: 45 }, scale: 0.4 },
    { propId: 'barrel', position: { x: 12, z: 38 }, scale: 0.6 },
    { propId: 'barrel', position: { x: 68, z: 42 }, scale: 0.6 },
    { propId: 'crate', position: { x: 10, z: 42 }, scale: 0.7 },
    { propId: 'crate', position: { x: 70, z: 38 }, scale: 0.7 },
  ],
}
