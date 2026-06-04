import { MapDefinition } from '../types'

export const ruinasAncestrales: MapDefinition = {
  id: 'ruinas_ancestrales',
  name: 'Ruinas Ancestrales',
  width: 120,
  height: 120,
  biome: 'desert',
  music: 'ambient_ruinas_ancestrales',
  spawns: [
    { id: 'susurros_gate', position: { x: 10, z: 60 } },
  ],
  portals: [
    {
      id: 'portal_to_susurros',
      position: { x: 4, z: 60 },
      radius: 4,
      targetMapId: 'cueva_susurros',
      targetSpawnId: 'ruinas_salida',
      label: '→ Cueva de los Susurros',
    },
    {
      id: 'portal_to_santuario',
      position: { x: 60, z: 116 },
      radius: 4,
      targetMapId: 'santuario_olvidado',
      targetSpawnId: 'ruinas_gate',
      label: '→ Santuario Olvidado',
    },
    {
      id: 'portal_to_castillo',
      position: { x: 116, z: 60 },
      radius: 4,
      targetMapId: 'castillo_olvidado',
      targetSpawnId: 'ruinas_atajo',
      label: '→ Castillo Olvidado',
    },
  ],
  npcs: [
    { npcId: 'npc_archaeologist', position: { x: 50, z: 70 } },
  ],
  monsters: [
    { monsterId: 'argiope', position: { x: 30, z: 30 }, respawnSeconds: 8 },
    { monsterId: 'argiope', position: { x: 70, z: 45 }, respawnSeconds: 8 },
    { monsterId: 'argiope', position: { x: 50, z: 85 }, respawnSeconds: 8 },
    { monsterId: 'shining_plant', position: { x: 45, z: 35 }, respawnSeconds: 7 },
    { monsterId: 'shining_plant', position: { x: 75, z: 55 }, respawnSeconds: 7 },
    { monsterId: 'shining_plant', position: { x: 30, z: 75 }, respawnSeconds: 7 },
    { monsterId: 'stalker', position: { x: 60, z: 35 }, respawnSeconds: 10 },
    { monsterId: 'stalker', position: { x: 80, z: 75 }, respawnSeconds: 10 },
  ],
  props: [
    // Ruin architecture
    { propId: 'ruin_column', position: { x: 20, z: 20 }, scale: 1.2 },
    { propId: 'ruin_column', position: { x: 30, z: 20 }, scale: 1.1 },
    { propId: 'ruin_column', position: { x: 25, z: 30 }, scale: 1 },
    { propId: 'ruin_column', position: { x: 80, z: 40 }, scale: 1.1 },
    { propId: 'ruin_column', position: { x: 90, z: 50 }, scale: 1.2 },
    { propId: 'ruin_column', position: { x: 40, z: 90 }, scale: 1 },
    { propId: 'ruin_pillar', position: { x: 50, z: 50 }, scale: 1.3 },
    { propId: 'ruin_pillar', position: { x: 70, z: 70 }, scale: 1.2 },
    { propId: 'ruin_pillar', position: { x: 35, z: 65 }, scale: 1.1 },
    { propId: 'ruin_slab', position: { x: 25, z: 25 }, scale: 1 },
    { propId: 'ruin_slab', position: { x: 55, z: 65 }, scale: 0.8 },
    { propId: 'ruin_slab', position: { x: 85, z: 60 }, scale: 1.1 },
    { propId: 'ruin_slab', position: { x: 40, z: 40 }, scale: 0.9 },
    // Rocks
    { propId: 'rock_a', position: { x: 15, z: 50 }, scale: 0.8 },
    { propId: 'rock_b', position: { x: 100, z: 30 }, scale: 1 },
    { propId: 'rock_a', position: { x: 65, z: 90 }, scale: 0.9 },
    { propId: 'rock_c', position: { x: 95, z: 85 }, scale: 0.7 },
    // Oasis
    { propId: 'bush_round', position: { x: 50, z: 30 }, scale: 0.6 },
    { propId: 'bush_round', position: { x: 55, z: 30 }, scale: 0.5 },
    { propId: 'bush_a', position: { x: 52, z: 28 }, scale: 0.6 },
    { propId: 'tree_deciduous', position: { x: 50, z: 25 }, scale: 1.2 },
    // Scattered bushes
    { propId: 'bush_a', position: { x: 30, z: 50 }, scale: 0.5 },
    { propId: 'bush_round', position: { x: 75, z: 35 }, scale: 0.6 },
    { propId: 'bush_a', position: { x: 60, z: 80 }, scale: 0.5 },
    // Signpost
    { propId: 'signpost_guide', position: { x: 8, z: 58 }, scale: 0.8 },
    { propId: 'signpost_danger', position: { x: 58, z: 114 }, scale: 0.8 },
  ],
}
