import { MapDefinition } from '../types'

export const trainingDungeon: MapDefinition = {
  id: 'training_dungeon',
  name: 'Mazmorra de Entrenamiento',
  width: 48,
  height: 48,
  biome: 'dungeon',
  music: 'ambient_training_dungeon',
  spawns: [
    { id: 'dungeon_entry', position: { x: 24, z: 44 } },
  ],
  portals: [
    {
      id: 'portal_to_city',
      position: { x: 24, z: 46 },
      radius: 4,
      targetMapId: 'prontera_city',
      targetSpawnId: 'south_gate_spawn',
      label: '→ Prontera',
    },
  ],
  npcs: [],
  monsters: [
    { monsterId: 'poring', position: { x: 12, z: 12 }, respawnSeconds: 4 },
    { monsterId: 'poring', position: { x: 36, z: 12 }, respawnSeconds: 4 },
    { monsterId: 'poring', position: { x: 12, z: 36 }, respawnSeconds: 4 },
    { monsterId: 'poring', position: { x: 36, z: 36 }, respawnSeconds: 4 },
    { monsterId: 'lunatic', position: { x: 18, z: 24 }, respawnSeconds: 5 },
    { monsterId: 'lunatic', position: { x: 30, z: 24 }, respawnSeconds: 5 },
    { monsterId: 'fabre', position: { x: 24, z: 18 }, respawnSeconds: 6 },
    { monsterId: 'fabre', position: { x: 24, z: 30 }, respawnSeconds: 6 },
    { monsterId: 'chonchon', position: { x: 8, z: 24 }, respawnSeconds: 6 },
    { monsterId: 'chonchon', position: { x: 40, z: 24 }, respawnSeconds: 6 },
  ],
  props: [
    // Pillars in corners
    { propId: 'pillar', position: { x: 8, z: 8 }, scale: 0.8 },
    { propId: 'pillar', position: { x: 40, z: 8 }, scale: 0.8 },
    { propId: 'pillar', position: { x: 8, z: 40 }, scale: 0.8 },
    { propId: 'pillar', position: { x: 40, z: 40 }, scale: 0.8 },
    // Inner pillars
    { propId: 'pillar', position: { x: 18, z: 18 }, scale: 0.6 },
    { propId: 'pillar', position: { x: 30, z: 18 }, scale: 0.6 },
    { propId: 'pillar', position: { x: 18, z: 30 }, scale: 0.6 },
    { propId: 'pillar', position: { x: 30, z: 30 }, scale: 0.6 },
    // Torches along walls
    { propId: 'torch', position: { x: 4, z: 12 }, scale: 1 },
    { propId: 'torch', position: { x: 4, z: 24 }, scale: 1 },
    { propId: 'torch', position: { x: 4, z: 36 }, scale: 1 },
    { propId: 'torch', position: { x: 44, z: 12 }, scale: 1 },
    { propId: 'torch', position: { x: 44, z: 24 }, scale: 1 },
    { propId: 'torch', position: { x: 44, z: 36 }, scale: 1 },
    // Barrels and crates
    { propId: 'barrel', position: { x: 10, z: 6 }, scale: 0.6 },
    { propId: 'barrel', position: { x: 14, z: 6 }, scale: 0.6 },
    { propId: 'crate', position: { x: 34, z: 6 }, scale: 0.7 },
    { propId: 'crate', position: { x: 38, z: 6 }, scale: 0.7 },
  ],
}
