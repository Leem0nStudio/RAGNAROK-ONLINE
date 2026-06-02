import { Entity } from '../types';

export interface NPCDef {
  id: string;
  name: string;
  npcType: 'kafra' | 'crusader_instructor' | 'quest_giver';
  mapId: string;
  x: number;
  z: number;
  facing: 'left' | 'right';
}

export const NPC_DEFS: NPCDef[] = [
  // ─── Prontera City ───
  { id: 'npc_kafra',     name: 'Kafra Assistant ★ Clarice',     npcType: 'kafra',              mapId: 'prontera_city',  x: -3,  z: -2,  facing: 'right' },
  { id: 'npc_crusader',  name: 'Swordsman Instructor ★ Kurt',    npcType: 'crusader_instructor', mapId: 'prontera_city',  x: 4,   z: 4,   facing: 'left' },
  { id: 'npc_guard',     name: 'Guardia de Prontera',            npcType: 'quest_giver',        mapId: 'prontera_city',  x: 0,   z: -28, facing: 'right' },
  { id: 'npc_messenger', name: 'Mensajero de Prontera',          npcType: 'quest_giver',        mapId: 'prontera_city',  x: -6,  z: 4,   facing: 'right' },
  { id: 'npc_gardener',  name: 'Jardinero de Prontera',          npcType: 'quest_giver',        mapId: 'prontera_city',  x: 4,   z: -6,  facing: 'right' },
  { id: 'npc_artisan',   name: 'Artesano de Prontera',           npcType: 'quest_giver',        mapId: 'prontera_city',  x: -10, z: 6,   facing: 'right' },
  { id: 'npc_chef',      name: 'Cocinero de Prontera',           npcType: 'quest_giver',        mapId: 'prontera_city',  x: 8,   z: -10, facing: 'right' },
  { id: 'npc_farmer',    name: 'Granjero de Prontera',           npcType: 'quest_giver',        mapId: 'prontera_city',  x: 6,   z: -8,  facing: 'right' },
  { id: 'npc_healer',    name: 'Curandera de Prontera',          npcType: 'quest_giver',        mapId: 'prontera_city',  x: -10, z: -6,  facing: 'right' },

  // ─── Laderas del Molino ───
  { id: 'npc_miller',    name: 'Mol Molinero',                   npcType: 'quest_giver',        mapId: 'laderas_molino', x: 12,  z: 40,  facing: 'right' },

  // ─── Camino del Este ───
  { id: 'npc_bosque_guard',  name: 'Guardia del Bosque Umbrío',  npcType: 'quest_giver',        mapId: 'camino_del_este', x: 100, z: 0,   facing: 'left' },
  { id: 'npc_shady_merchant', name: 'Mercader Sombrío',          npcType: 'quest_giver',        mapId: 'camino_del_este', x: 108, z: 8,   facing: 'left' },

  // ─── Bosque Umbrío — Entrada ───
  { id: 'npc_spirit',    name: 'Espíritu del Bosque',            npcType: 'quest_giver',        mapId: 'bosque_umbrio_entrada', x: 132, z: 20, facing: 'right' },

  // ─── Ruinas Ancestrales ───
  { id: 'npc_archaeologist', name: 'Arqueólogo Eldric',          npcType: 'quest_giver',        mapId: 'ruinas_ancestrales', x: 164, z: 12, facing: 'right' },

  // ─── Santuario Olvidado ───
  { id: 'npc_sage',      name: 'Sabio Mathius',                  npcType: 'quest_giver',        mapId: 'santuario_olvidado', x: 164, z: 40, facing: 'left' },
];

export const NPC_INDEX: Record<string, NPCDef> = {};
for (const npc of NPC_DEFS) {
  NPC_INDEX[npc.id] = npc;
}

export function getNPCDefsForMap(mapId: string): NPCDef[] {
  return NPC_DEFS.filter(n => n.mapId === mapId);
}

export function buildNPCEntity(def: NPCDef): Entity {
  return {
    id: def.id,
    name: def.name,
    type: 'npc',
    npcType: def.npcType,
    x: def.x,
    y: 0,
    z: def.z,
    facing: def.facing,
    state: 'idle',
    currentHp: 100,
    currentSp: 100,
    maxHp: 100,
    maxSp: 100,
    targetEntityId: null,
    hitRecoveryEndTime: 0,
    animationTimer: 0,
    animationFrame: 0,
  };
}
