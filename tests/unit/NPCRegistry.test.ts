import { describe, it, expect } from 'vitest';
import { getNPCDefsForMap, NPC_DEFS } from '../../lib/game/map/NPCRegistry';
import { MAP_INDEX } from '../../lib/game/map/MapRegistry';

describe('NPCRegistry', () => {
  it('todos los NPCs tienen mapId válido', () => {
    for (const npc of NPC_DEFS) {
      expect(MAP_INDEX[npc.mapId]).toBeDefined();
    }
  });

  it('todos los NPCs están dentro de bounds de su mapa', () => {
    for (const npc of NPC_DEFS) {
      const map = MAP_INDEX[npc.mapId];
      expect(npc.x).toBeGreaterThanOrEqual(map.bounds.xMin);
      expect(npc.x).toBeLessThan(map.bounds.xMax);
      expect(npc.z).toBeGreaterThanOrEqual(map.bounds.zMin);
      expect(npc.z).toBeLessThan(map.bounds.zMax);
    }
  });

  it('getNPCDefsForMap devuelve NPCs correctos para prontera_city', () => {
    const npcs = getNPCDefsForMap('prontera_city');
    expect(npcs.length).toBeGreaterThanOrEqual(9);
    expect(npcs.some(n => n.id === 'npc_kafra')).toBe(true);
    expect(npcs.some(n => n.id === 'npc_crusader')).toBe(true);
  });

  it('getNPCDefsForMap devuelve array vacío para mapa sin NPCs', () => {
    const npcs = getNPCDefsForMap('echo_dungeon');
    expect(npcs).toEqual([]);
  });

  it('cada NPC tiene tipo válido', () => {
    for (const npc of NPC_DEFS) {
      expect(['kafra', 'crusader_instructor', 'quest_giver']).toContain(npc.npcType);
    }
  });
});
