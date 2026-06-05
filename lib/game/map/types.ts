import { RockObstacle, TreeObstacle, PropObstacle } from '../characterController';

/**
 * MapDefinition – Data-driven map configuration.
 *
 * A MapDefinition specifies all data needed to build a playable map:
 *   - terrain height function
 *   - pre-computed obstacle positions (rocks, trees, props)
 *   - NPC and monster spawn configuration
 *   - boundary limits
 *
 * Obstacle data is pre-computed at module load time by calling the
 * existing deterministic generator functions in characterController.ts.
 * This keeps the renderer and physics systems perfectly aligned.
 */
export interface MapDefinition {
  /** Unique string identifier (e.g. "prontera_field") */
  id: string;
  /** Human-readable display name */
  name: string;
  /** Terrain configuration */
  terrain: {
    /** Function that returns the height (Y) at any (x, z) coordinate */
    heightFunction: (x: number, z: number) => number;
  };
  /** Pre-computed obstacle position arrays (rocks, trees, props) */
  obstacles: {
    rocks: RockObstacle[];
    trees: TreeObstacle[];
    props: PropObstacle[];
  };
  /** Entity spawn definitions */
  spawn: {
    npcs: NPCSpawnDefinition[];
    monsters: MonsterSpawnDefinition[];
    boss: BossSpawnDefinition;
  };
  /** World boundary limits */
  boundaries: {
    /** Circular boundary radius – entities beyond this are clamped */
    radius: number;
    /** Safe zone radius – spawning/player revive point radius */
    safeZoneRadius: number;
  };
}

export interface NPCSpawnDefinition {
  id: string;
  name: string;
  npcType: 'kafra' | 'crusader_instructor';
  x: number;
  z: number;
  facing?: 'left' | 'right';
}

export interface MonsterSpawnDefinition {
  type: 'poring' | 'poporing' | 'pecopeco';
  count: number;
  territory: {
    xRange: [number, number];
    zRange: [number, number];
  };
  config: {
    name: string;
    maxHp: number;
    exp: number;
    jobExp: number;
    size: number;
  };
}

export interface BossSpawnDefinition {
  type: 'boss_mvp';
  territory: {
    xRange: [number, number];
    zRange: [number, number];
  };
  config: {
    name: string;
    maxHp: number;
    exp: number;
    jobExp: number;
  };
}
