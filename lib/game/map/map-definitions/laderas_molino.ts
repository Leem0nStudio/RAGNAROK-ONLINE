import { MapDefinition } from '../types'

export const laderasMolino: MapDefinition = {
  id: 'laderas_molino',
  name: 'Laderas del Molino',
  width: 72,
  height: 72,
  biome: 'mountain',
  music: 'ambient_laderas_molino',
  spawns: [
    { id: 'molino_entrada', position: { x: 10, z: 36 } },
    { id: 'colinas_return_spawn', position: { x: 36, z: 66 } },
  ],
  portals: [
    {
      id: 'portal_to_field',
      position: { x: 6, z: 36 },
      radius: 4,
      targetMapId: 'prontera_field',
      targetSpawnId: 'molino_gate',
      label: '→ Campo de Prontera',
    },
    {
      id: 'portal_to_colinas',
      position: { x: 36, z: 70 },
      radius: 4,
      targetMapId: 'colinas_ventosas',
      targetSpawnId: 'laderas_gate_spawn',
      label: '→ Colinas Ventosas',
    },
  ],
  npcs: [
    { npcId: 'npc_miller', position: { x: 36, z: 36 } },
  ],
  monsters: [
    { monsterId: 'picky', position: { x: 20, z: 20 }, respawnSeconds: 6 },
    { monsterId: 'picky', position: { x: 50, z: 50 }, respawnSeconds: 6 },
    { monsterId: 'savage_baby', position: { x: 36, z: 56 }, respawnSeconds: 8 },
    { monsterId: 'savage_baby', position: { x: 56, z: 36 }, respawnSeconds: 8 },
    { monsterId: 'lunatic', position: { x: 30, z: 15 }, respawnSeconds: 5 },
    { monsterId: 'lunatic', position: { x: 15, z: 55 }, respawnSeconds: 5 },
    { monsterId: 'pecopeco', position: { x: 48, z: 20 }, respawnSeconds: 10 },
  ],
  props: [
    // Mill structure
    { propId: 'windmill', position: { x: 36, z: 36 }, scale: 1.5 },
    // Rocks
    { propId: 'rock_a', position: { x: 18, z: 18 }, scale: 1 },
    { propId: 'rock_b', position: { x: 54, z: 54 }, scale: 1.2 },
    { propId: 'rock_c', position: { x: 42, z: 12 }, scale: 0.8 },
    // Bushes
    { propId: 'bush_a', position: { x: 12, z: 42 }, scale: 0.7 },
    { propId: 'bush_a', position: { x: 60, z: 30 }, scale: 0.6 },
    // Fences near entrance
    { propId: 'fence_wood', position: { x: 8, z: 32 }, rotation: 0.3 },
    { propId: 'fence_wood', position: { x: 8, z: 40 }, rotation: -0.3 },
    // Barrels
    { propId: 'barrel', position: { x: 34, z: 38 }, scale: 0.7 },
    { propId: 'barrel', position: { x: 38, z: 38 }, scale: 0.7 },
  ],
}
