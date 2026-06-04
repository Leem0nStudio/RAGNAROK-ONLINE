import { MapDefinition } from '../types'

export const pronteraCity: MapDefinition = {
  id: 'prontera_city',
  name: 'Prontera — Plaza del Alba',
  width: 64,
  height: 64,
  biome: 'city',
  music: 'ambient_prontera_city',
  spawns: [
    { id: 'south_gate_spawn', position: { x: 32, z: 8 } },
    { id: 'north_gate_spawn', position: { x: 32, z: 56 } },
    { id: 'east_gate_spawn', position: { x: 56, z: 32 } },
    { id: 'west_gate_spawn', position: { x: 8, z: 32 } },
  ],
  portals: [
    {
      id: 'portal_to_field',
      position: { x: 32, z: 60 },
      radius: 4,
      targetMapId: 'prontera_field',
      targetSpawnId: 'city_gate_spawn',
      label: '→ Campo de Prontera',
    },
    {
      id: 'portal_to_dungeon',
      position: { x: 32, z: 4 },
      radius: 4,
      targetMapId: 'training_dungeon',
      targetSpawnId: 'dungeon_entry',
      label: '→ Mazmorra de Entrenamiento',
    },
    {
      id: 'portal_to_pradera',
      position: { x: 60, z: 32 },
      radius: 4,
      targetMapId: 'pradera_alba',
      targetSpawnId: 'alba_entrada',
      label: '→ Pradera del Alba',
    },
  ],
  npcs: [
    { npcId: 'npc_kafra', position: { x: 42, z: 30 } },
    { npcId: 'npc_skill_trainer', position: { x: 20, z: 34 } },
    { npcId: 'npc_weapon_smith', position: { x: 44, z: 20 } },
    { npcId: 'npc_potion_master', position: { x: 44, z: 44 } },
    { npcId: 'npc_quest_giver', position: { x: 22, z: 20 } },
    { npcId: 'npc_guard_01', position: { x: 32, z: 58 } },
    { npcId: 'npc_guard_02', position: { x: 32, z: 6 } },
  ],
  monsters: [],
  props: [
    // Fountain at center
    { propId: 'fountain', position: { x: 32, z: 32 }, scale: 1.2 },
    // Lamp posts along main avenue
    { propId: 'lamp_post', position: { x: 32, z: 16 }, scale: 1 },
    { propId: 'lamp_post', position: { x: 32, z: 48 }, scale: 1 },
    { propId: 'lamp_post', position: { x: 16, z: 32 }, scale: 1 },
    { propId: 'lamp_post', position: { x: 48, z: 32 }, scale: 1 },
    // Benches around fountain
    { propId: 'bench', position: { x: 28, z: 28 }, rotation: 0.5 },
    { propId: 'bench', position: { x: 36, z: 28 }, rotation: -0.5 },
    { propId: 'bench', position: { x: 28, z: 36 }, rotation: -0.5 },
    { propId: 'bench', position: { x: 36, z: 36 }, rotation: 0.5 },
    // Market stalls (south-east corner)
    { propId: 'stall', position: { x: 48, z: 16 }, scale: 1 },
    { propId: 'stall', position: { x: 48, z: 12 }, scale: 0.9 },
    { propId: 'stall', position: { x: 48, z: 8 }, scale: 0.9 },
    // Barrels and crates near market
    { propId: 'barrel', position: { x: 46, z: 18 }, scale: 0.6 },
    { propId: 'barrel', position: { x: 50, z: 18 }, scale: 0.6 },
    { propId: 'crate', position: { x: 46, z: 10 }, scale: 0.7 },
    // Trees in park areas
    { propId: 'tree_deciduous', position: { x: 12, z: 52 }, scale: 1.1 },
    { propId: 'tree_deciduous', position: { x: 52, z: 52 }, scale: 1.1 },
    { propId: 'tree_deciduous', position: { x: 12, z: 12 }, scale: 1.1 },
    { propId: 'tree_deciduous', position: { x: 52, z: 12 }, scale: 1.1 },
    // Inn (south-west corner)
    { propId: 'building_inn', position: { x: 18, z: 14 }, scale: 1, rotation: 0.8 },
    // Flower beds
    { propId: 'flower_bed', position: { x: 28, z: 34 }, scale: 0.5 },
    { propId: 'flower_bed', position: { x: 36, z: 34 }, scale: 0.5 },
    { propId: 'flower_bed', position: { x: 28, z: 30 }, scale: 0.5 },
    { propId: 'flower_bed', position: { x: 36, z: 30 }, scale: 0.5 },
  ],
}
