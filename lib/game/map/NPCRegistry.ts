import { Entity } from '../types';

export interface NPCDef {
  id: string;
  name: string;
  npcType: 'kafra' | 'crusader_instructor' | 'quest_giver' | 'shop' | 'skill_trainer' | 'guard';
  mapId: string;
  x: number;
  z: number;
  facing: 'left' | 'right' | 'up' | 'down';
}

export const NPC_DEFS: NPCDef[] = [
  // ─── Prontera City (new mapDef sources) ───
  { id: 'npc_kafra',          name: 'Clarice — Asistente Kafra',       npcType: 'kafra',              mapId: 'prontera_city', x: 42, z: 30, facing: 'right' },
  { id: 'npc_skill_trainer',  name: 'Kurt — Instructor de Habilidades', npcType: 'skill_trainer',     mapId: 'prontera_city', x: 20, z: 34, facing: 'left' },
  { id: 'npc_weapon_smith',   name: 'Herrero Garmund',                 npcType: 'shop',               mapId: 'prontera_city', x: 44, z: 20, facing: 'right' },
  { id: 'npc_potion_master',  name: 'Alquimista Leticia',              npcType: 'shop',               mapId: 'prontera_city', x: 44, z: 44, facing: 'right' },
  { id: 'npc_quest_giver',    name: 'Hermana Serafina',                npcType: 'quest_giver',        mapId: 'prontera_city', x: 22, z: 20, facing: 'right' },
  { id: 'npc_guard_01',       name: 'Guardia de la Puerta Norte',      npcType: 'guard',              mapId: 'prontera_city', x: 32, z: 58, facing: 'down' },
  { id: 'npc_guard_02',       name: 'Guardia de la Puerta Sur',        npcType: 'guard',              mapId: 'prontera_city', x: 32, z: 6, facing: 'up' },

  // ─── Campo de Prontera ───
  { id: 'npc_field_guide',    name: 'Guía del Campo',                  npcType: 'quest_giver',        mapId: 'prontera_field', x: 20, z: 30, facing: 'right' },

  // ─── Laderas del Molino ───
  { id: 'npc_miller',         name: 'Mol Molinero',                    npcType: 'quest_giver',        mapId: 'laderas_molino', x: 12, z: 40, facing: 'right' },

  // ─── Camino del Este ───
  { id: 'npc_bosque_guard',   name: 'Guardia del Bosque Umbrío',       npcType: 'quest_giver',        mapId: 'camino_del_este', x: 30, z: 50, facing: 'left' },
  { id: 'npc_shady_merchant', name: 'Mercader Sombrío',                npcType: 'shop',               mapId: 'camino_del_este', x: 65, z: 55, facing: 'left' },

  // ─── Bosque Umbrío ───
  { id: 'npc_spirit',         name: 'Espíritu del Bosque',             npcType: 'quest_giver',        mapId: 'bosque_umbrio', x: 60, z: 50, facing: 'right' },

  // ─── Ruinas Ancestrales ───
  { id: 'npc_archaeologist',  name: 'Arqueólogo Eldric',               npcType: 'quest_giver',        mapId: 'ruinas_ancestrales', x: 50, z: 70, facing: 'right' },

  // ─── Santuario Olvidado ───
  { id: 'npc_sage',           name: 'Sabio Mathius',                   npcType: 'quest_giver',        mapId: 'santuario_olvidado', x: 50, z: 70, facing: 'left' },
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
