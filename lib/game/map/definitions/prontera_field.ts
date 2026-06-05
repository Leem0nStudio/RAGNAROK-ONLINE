import { MapDefinition } from '../types';
import {
  getTerrainHeight,
} from '../../renderer';
import {
  getRockObstacles,
  getTreeObstacles,
  getPropObstacles,
} from '../../characterController';

/**
 * PRONTERA_FIELD – The canonical starting map for this Ragnarok Online fan game.
 *
 * This definition calls the existing deterministic generator functions at
 * MODULE LOAD TIME to pre-compute obstacle positions. The data is then
 * consumed by the scene graph and engine, ensuring identical placement
 * in both visual rendering and collision physics.
 *
 * All values (spawn positions, boundary radius, NPC locations) match the
 * original hardcoded constants in engine.ts exactly.
 */
export const PRONTERA_FIELD: MapDefinition = {
  id: 'prontera_field',
  name: 'Prontera Field',

  terrain: {
    // The canonical terrain height function – same as renderer.ts exports
    heightFunction: getTerrainHeight,
  },

  obstacles: {
    // Calls deterministic functions with the same seeds (1337 for trees, 999 for props)
    rocks: getRockObstacles(),
    trees: getTreeObstacles(),
    props: getPropObstacles(),
  },

  spawn: {
    npcs: [
      {
        id: 'npc_kafra',
        name: 'Kafra Merchant ★ Clarice',
        npcType: 'kafra',
        x: -3,
        z: -2, // centered, welcoming near the spawn gate
        facing: 'right',
      },
      {
        id: 'npc_crusader',
        name: 'Job Master ★ Freya',
        npcType: 'crusader_instructor',
        x: 4,
        z: 4, // training yard quadrant
        facing: 'left',
      },
    ],

    monsters: [
      {
        type: 'poring',
        count: 4,
        territory: { xRange: [14, 38], zRange: [14, 38] }, // SE quadrant
        config: { name: 'Poring Pink', maxHp: 80, exp: 12, jobExp: 10, size: 1.0 },
      },
      {
        type: 'poporing',
        count: 4,
        territory: { xRange: [-38, -14], zRange: [14, 38] }, // SW quadrant
        config: { name: 'Poporing Tox', maxHp: 190, exp: 35, jobExp: 28, size: 1.1 },
      },
      {
        type: 'pecopeco',
        count: 4,
        territory: { xRange: [-38, -14], zRange: [-38, -14] }, // NW quadrant
        config: { name: 'PecoPeco Runner', maxHp: 380, exp: 90, jobExp: 75, size: 1.3 },
      },
    ],

    boss: {
      type: 'boss_mvp',
      territory: { xRange: [24, 38], zRange: [-38, -24] }, // NE quadrant
      config: { name: 'BAPHOMET ★ MVP', maxHp: 48000, exp: 12000, jobExp: 9500 },
    },
  },

  boundaries: {
    radius: 48.0,
    safeZoneRadius: 18.0,
  },
};
