import { MapDefinition } from '../types'

export const santuarioOlvidado: MapDefinition = {
  id: 'santuario_olvidado',
  name: 'Santuario Olvidado',
  width: 100,
  height: 100,
  biome: 'dungeon',
  music: 'ambient_santuario_olvidado',
  spawns: [
    { id: 'ruinas_gate', position: { x: 10, z: 50 } },
  ],
  portals: [
    {
      id: 'portal_to_ruinas',
      position: { x: 4, z: 50 },
      radius: 4,
      targetMapId: 'ruinas_ancestrales',
      targetSpawnId: 'susurros_gate',
      label: '→ Ruinas Ancestrales',
    },
    {
      id: 'portal_to_castillo',
      position: { x: 96, z: 50 },
      radius: 4,
      targetMapId: 'castillo_olvidado',
      targetSpawnId: 'santuario_entrada',
      label: '→ Castillo Olvidado',
    },
  ],
  npcs: [
    { npcId: 'npc_sage', position: { x: 50, z: 70 } },
  ],
  monsters: [
    { monsterId: 'master_drainliar', position: { x: 30, z: 30 }, respawnSeconds: 12 },
    { monsterId: 'master_drainliar', position: { x: 65, z: 35 }, respawnSeconds: 12 },
    { monsterId: 'dark_guardian', position: { x: 50, z: 50 }, respawnSeconds: 15 },
    { monsterId: 'dark_guardian', position: { x: 40, z: 80 }, respawnSeconds: 15 },
    { monsterId: 'argiope', position: { x: 25, z: 65 }, respawnSeconds: 8 },
    { monsterId: 'argiope', position: { x: 70, z: 70 }, respawnSeconds: 8 },
    { monsterId: 'argiope', position: { x: 50, z: 20 }, respawnSeconds: 8 },
  ],
  props: [
    // Temple entrance pillars
    { propId: 'pillar', position: { x: 8, z: 46 }, scale: 1.3 },
    { propId: 'pillar', position: { x: 8, z: 54 }, scale: 1.3 },
    // Main temple columns
    { propId: 'ruin_pillar', position: { x: 25, z: 25 }, scale: 1.4 },
    { propId: 'ruin_pillar', position: { x: 75, z: 25 }, scale: 1.4 },
    { propId: 'ruin_pillar', position: { x: 25, z: 75 }, scale: 1.4 },
    { propId: 'ruin_pillar', position: { x: 75, z: 75 }, scale: 1.4 },
    // Inner columns
    { propId: 'pillar', position: { x: 40, z: 40 }, scale: 1.1 },
    { propId: 'pillar', position: { x: 60, z: 40 }, scale: 1.1 },
    { propId: 'pillar', position: { x: 40, z: 60 }, scale: 1.1 },
    { propId: 'pillar', position: { x: 60, z: 60 }, scale: 1.1 },
    // Altar
    { propId: 'ruin_slab', position: { x: 50, z: 50 }, scale: 1.2 },
    { propId: 'ruin_slab', position: { x: 52, z: 50 }, scale: 1 },
    { propId: 'fountain', position: { x: 50, z: 50 }, scale: 0.8 },
    // Statues / guardians (use ruin_pillar as statues)
    { propId: 'ruin_column', position: { x: 35, z: 50 }, scale: 1.3 },
    { propId: 'ruin_column', position: { x: 65, z: 50 }, scale: 1.3 },
    // Torches
    { propId: 'torch', position: { x: 10, z: 30 }, scale: 1.1 },
    { propId: 'torch', position: { x: 10, z: 70 }, scale: 1.1 },
    { propId: 'torch', position: { x: 90, z: 30 }, scale: 1.1 },
    { propId: 'torch', position: { x: 90, z: 70 }, scale: 1.1 },
    { propId: 'torch', position: { x: 50, z: 10 }, scale: 1 },
    { propId: 'torch', position: { x: 50, z: 90 }, scale: 1 },
    // Debris
    { propId: 'ruin_slab', position: { x: 30, z: 35 }, scale: 0.7 },
    { propId: 'ruin_slab', position: { x: 70, z: 65 }, scale: 0.8 },
    { propId: 'barrel', position: { x: 15, z: 20 }, scale: 0.6 },
    { propId: 'crate', position: { x: 85, z: 80 }, scale: 0.7 },
  ],
}
