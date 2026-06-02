import { InteractibleDef } from '../types';

export interface InteractibleEntry {
  id: string;
  mapId: string;
  x: number;
  z: number;
  label: string;
  type: 'torch' | 'inscription';
}

const INTERACTIBLE_DEFS: InteractibleEntry[] = [
  // Training dungeon
  { id: 'dungeon_torch_1', mapId: 'training_dungeon', x: 12, z: -48, label: 'Antorcha 1', type: 'torch' },
  { id: 'dungeon_torch_2', mapId: 'training_dungeon', x: 24, z: -52, label: 'Antorcha 2', type: 'torch' },
  { id: 'dungeon_torch_3', mapId: 'training_dungeon', x: 36, z: -56, label: 'Antorcha 3', type: 'torch' },
  { id: 'dungeon_inscription_1', mapId: 'training_dungeon', x: 8, z: -44, label: 'Inscripción Antigua I', type: 'inscription' },
  { id: 'dungeon_inscription_2', mapId: 'training_dungeon', x: 30, z: -60, label: 'Inscripción Antigua II', type: 'inscription' },
];

const INDEX: Record<string, InteractibleEntry> = {};
for (const e of INTERACTIBLE_DEFS) {
  INDEX[e.id] = e;
}

export function getInteractiblesForMap(mapId: string): InteractibleEntry[] {
  return INTERACTIBLE_DEFS.filter(e => e.mapId === mapId);
}

export function buildInteractibleEntity(def: InteractibleEntry): InteractibleDef {
  return {
    id: def.id,
    mapId: def.mapId,
    x: def.x,
    z: def.z,
    label: def.label,
    type: def.type,
    activated: false,
  };
}

export function getInteractibleDef(id: string): InteractibleEntry | undefined {
  return INDEX[id];
}
