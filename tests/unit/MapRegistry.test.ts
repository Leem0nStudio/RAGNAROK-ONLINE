import { describe, it, expect } from 'vitest';
import {
  ALL_MAP_DEFS,
  MAP_INDEX,
  PRONTERA_CITY_MAP,
  findMapByPosition,
  findTransition,
  REGION_INDEX,
} from '../../lib/game/map/MapRegistry';
import { LANDMARKS } from '../../lib/game/quests';

describe('MapRegistry', () => {
  describe('MAP_INDEX', () => {
    it('contiene todos los mapas definidos', () => {
      for (const map of ALL_MAP_DEFS) {
        expect(MAP_INDEX[map.id]).toBe(map);
      }
    });

    it('prontera_city existe en el índice', () => {
      expect(MAP_INDEX['prontera_city']).toBeDefined();
      expect(MAP_INDEX['prontera_city'].name).toBe('Prontera — Plaza del Alba');
    });

    it('todos los mapas tienen bounds válidos', () => {
      for (const map of ALL_MAP_DEFS) {
        expect(map.bounds.xMin).toBeLessThan(map.bounds.xMax);
        expect(map.bounds.zMin).toBeLessThan(map.bounds.zMax);
      }
    });

    it('todos los mapas tienen regionId válida', () => {
      for (const map of ALL_MAP_DEFS) {
        expect(REGION_INDEX[map.regionId]).toBeDefined();
      }
    });
  });

  describe('findMapByPosition', () => {
    it('devuelve prontera_city para (0, 0)', () => {
      const map = findMapByPosition(0, 0);
      expect(map?.id).toBe('prontera_city');
    });

    it('devuelve pradera_del_alba para (40, 16)', () => {
      const map = findMapByPosition(40, 16);
      expect(map?.id).toBe('pradera_del_alba');
    });

    it('devuelve null para coordenadas fuera de todos los mapas', () => {
      const map = findMapByPosition(999, 999);
      expect(map).toBeNull();
    });

    it('respeta half-open intervals [min, max)', () => {
      const prontera = MAP_INDEX['prontera_city'];
      const atMin = findMapByPosition(prontera.bounds.xMin, prontera.bounds.zMin);
      expect(atMin?.id).toBe('prontera_city');
      const atMax = findMapByPosition(prontera.bounds.xMax, prontera.bounds.zMin);
      expect(atMax?.id).not.toBe('prontera_city');
    });

    it('prontera se solapa con pradera en x=32 pero gana prontera por orden', () => {
      const atEdge = findMapByPosition(31.9, 16);
      expect(atEdge?.id).toBe('prontera_city');
    });
  });

  describe('findTransition', () => {
    it('encuentra transición de prontera → pradera en zona de trigger', () => {
      const t = findTransition(PRONTERA_CITY_MAP, 31, 4);
      expect(t).toBeDefined();
      expect(t?.targetMapId).toBe('pradera_del_alba');
    });

    it('no encuentra transición fuera de trigger zone', () => {
      const t = findTransition(PRONTERA_CITY_MAP, 0, 0);
      expect(t).toBeNull();
    });

    it('todas las transiciones apuntan a mapas existentes', () => {
      for (const map of ALL_MAP_DEFS) {
        for (const t of map.connectTo) {
          expect(MAP_INDEX[t.targetMapId]).toBeDefined();
        }
      }
    });

    it('los spawnAt están dentro de bounds del mapa destino', () => {
      for (const map of ALL_MAP_DEFS) {
        for (const t of map.connectTo) {
          const target = MAP_INDEX[t.targetMapId];
          expect(t.spawnAt.x).toBeGreaterThanOrEqual(target.bounds.xMin);
          expect(t.spawnAt.x).toBeLessThan(target.bounds.xMax);
          expect(t.spawnAt.z).toBeGreaterThanOrEqual(target.bounds.zMin);
          expect(t.spawnAt.z).toBeLessThan(target.bounds.zMax);
        }
      }
    });
  });

  describe('monsterTable', () => {
    it('los spawnArea están dentro de bounds del mapa', () => {
      for (const map of ALL_MAP_DEFS) {
        for (const entry of map.monsterTable) {
          if (entry.spawnArea) {
            expect(entry.spawnArea.xMin).toBeGreaterThanOrEqual(map.bounds.xMin);
            expect(entry.spawnArea.xMax).toBeLessThanOrEqual(map.bounds.xMax);
            expect(entry.spawnArea.zMin).toBeGreaterThanOrEqual(map.bounds.zMin);
            expect(entry.spawnArea.zMax).toBeLessThanOrEqual(map.bounds.zMax);
          }
        }
      }
    });
  });

  describe('LANDMARKS', () => {
    it('todos los landmarks tienen mapId válido', () => {
      for (const lm of LANDMARKS) {
        expect(MAP_INDEX[lm.mapId]).toBeDefined();
      }
    });
  });
});
