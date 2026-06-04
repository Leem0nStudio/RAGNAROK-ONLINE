import { MapDefinition } from '../types'

export const cuevaCristal: MapDefinition = {
  id: 'cueva_cristal',
  name: 'Cueva de Cristal',
  width: 80,
  height: 80,
  biome: 'mountain',
  music: 'ambient_cueva_cristal',
  spawns: [
    { id: 'colinas_entrada', position: { x: 10, z: 40 } },
  ],
  portals: [
    {
      id: 'portal_to_colinas',
      position: { x: 4, z: 40 },
      radius: 4,
      targetMapId: 'colinas_ventosas',
      targetSpawnId: 'laderas_gate_spawn',
      label: '→ Colinas Ventosas',
    },
  ],
  npcs: [],
  monsters: [
    { monsterId: 'chonchon', position: { x: 20, z: 20 }, respawnSeconds: 6 },
    { monsterId: 'chonchon', position: { x: 55, z: 25 }, respawnSeconds: 6 },
    { monsterId: 'chonchon', position: { x: 30, z: 65 }, respawnSeconds: 6 },
    { monsterId: 'chonchon', position: { x: 65, z: 55 }, respawnSeconds: 6 },
    { monsterId: 'shining_plant', position: { x: 40, z: 30 }, respawnSeconds: 7 },
    { monsterId: 'shining_plant', position: { x: 50, z: 55 }, respawnSeconds: 7 },
    { monsterId: 'shining_plant', position: { x: 25, z: 45 }, respawnSeconds: 7 },
  ],
  props: [
    // Crystal formations (use rock_quartz as crystals)
    { propId: 'rock_d', position: { x: 20, z: 20 }, scale: 1 },
    { propId: 'rock_d', position: { x: 25, z: 18 }, scale: 0.8 },
    { propId: 'rock_d', position: { x: 22, z: 22 }, scale: 0.6 },
    { propId: 'rock_d', position: { x: 55, z: 25 }, scale: 1.1 },
    { propId: 'rock_d', position: { x: 58, z: 28 }, scale: 0.7 },
    { propId: 'rock_d', position: { x: 30, z: 65 }, scale: 1.2 },
    { propId: 'rock_d', position: { x: 27, z: 62 }, scale: 0.9 },
    { propId: 'rock_d', position: { x: 33, z: 68 }, scale: 0.7 },
    { propId: 'rock_d', position: { x: 65, z: 55 }, scale: 1 },
    { propId: 'rock_d', position: { x: 68, z: 52 }, scale: 0.8 },
    // Large geode center
    { propId: 'rock_c', position: { x: 40, z: 40 }, scale: 1.8 },
    { propId: 'rock_d', position: { x: 38, z: 38 }, scale: 1 },
    { propId: 'rock_d', position: { x: 42, z: 42 }, scale: 0.9 },
    { propId: 'rock_d', position: { x: 36, z: 44 }, scale: 0.7 },
    // Torches for light
    { propId: 'torch', position: { x: 4, z: 30 }, scale: 1 },
    { propId: 'torch', position: { x: 4, z: 50 }, scale: 1 },
    { propId: 'torch', position: { x: 76, z: 30 }, scale: 1 },
    { propId: 'torch', position: { x: 76, z: 50 }, scale: 1 },
    { propId: 'torch', position: { x: 40, z: 4 }, scale: 1 },
    { propId: 'torch', position: { x: 40, z: 76 }, scale: 1 },
    // Small crystals
    { propId: 'rock_d', position: { x: 10, z: 30 }, scale: 0.5 },
    { propId: 'rock_d', position: { x: 70, z: 50 }, scale: 0.6 },
    { propId: 'rock_d', position: { x: 50, z: 10 }, scale: 0.5 },
    { propId: 'rock_d', position: { x: 60, z: 70 }, scale: 0.5 },
    // Pillars
    { propId: 'pillar', position: { x: 15, z: 15 }, scale: 0.8 },
    { propId: 'pillar', position: { x: 65, z: 15 }, scale: 0.8 },
    { propId: 'pillar', position: { x: 15, z: 65 }, scale: 0.8 },
    { propId: 'pillar', position: { x: 65, z: 65 }, scale: 0.8 },
    // Underground lake edge (use slabs as shore markers)
    { propId: 'ruin_slab', position: { x: 40, z: 65 }, scale: 0.6 },
    { propId: 'ruin_slab', position: { x: 36, z: 65 }, scale: 0.5 },
    { propId: 'ruin_slab', position: { x: 44, z: 65 }, scale: 0.5 },
  ],
}
