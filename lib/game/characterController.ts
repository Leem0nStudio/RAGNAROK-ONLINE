import * as THREE from 'three';
import { Entity, CharacterStats } from './types';
import { useGameStore } from './state';
import { getTerrainHeight, isPositionWalkable } from './renderer';

export interface RockObstacle {
  x: number;
  z: number;
  radius: number;
  height?: number;
}

export interface TreeObstacle {
  x: number;
  z: number;
  radius: number;
  scale: number;
  rotX: number;
  rotY: number;
  rotZ: number;
  leavesScaleY: number;
}

export interface PropObstacle {
  x: number;
  z: number;
  radius: number;
  scale: number;
  type: 'crate' | 'barrel' | 'signpost';
  rotX: number;
  rotY: number;
  rotZ: number;
  isFallen?: boolean;
  boardRotY?: number;
  boardRotZ?: number;
}

/**
 * High-performance deterministic Linear Congruential Generator.
 * Used to keep the visual renderer and the physics loop perfectly aligned on the same coordinates.
 */
export function makePRNG(seed: number) {
  let s = seed;
  return function() {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

/**
 * Generates the deterministic coordinates of rock obstacle pillars in the scenario.
 * Matches the sin/cos formula used to instantiate them in EnvironmentInstancedSystem.
 */
export function getRockObstacles(mapName: string = 'prontera'): RockObstacle[] {
  const rocks: RockObstacle[] = [];
  if (mapName === 'prontera') return []; // Prontera uses city walls instead of rock pillars

  // 1. Citadel Fortress Ring Walls: radius 16 around (0,0) with 16 possible pillars.
  // We skip index multiples of 4 (i.e. 0, 4, 8, 12) to create 4 elegant gateway passages.
  const fortressPillars = 16;
  for (let i = 0; i < fortressPillars; i++) {
    if (i % 4 === 0) continue; // Leaves East, North, West, and South gates open
    const angle = i * (Math.PI * 2 / fortressPillars);
    const r = 16.0;
    const rx = Math.cos(angle) * r;
    const rz = Math.sin(angle) * r;
    
    // Deterministic height for visual variety
    const h = 3.6 + Math.sin(i * 3.5) * 1.4;

    rocks.push({
      x: rx,
      z: rz,
      radius: 0.95, // collision radius
      height: h
    });
  }

  // 2. Dungeon Gateway Pillars: Northeast volcanic corner around the Abyssal Portal (48, -48).
  // These create an evoking, imposing frame for the dungeon entrance.
  const dungeonPillars = [
    { x: 44.5, z: -48.0, h: 7.2 },
    { x: 51.5, z: -48.0, h: 7.2 },
    { x: 48.0, z: -51.5, h: 5.5 },
    { x: 48.0, z: -44.5, h: 5.5 }
  ];
  for (const pillar of dungeonPillars) {
    rocks.push({
      x: pillar.x,
      z: pillar.z,
      radius: 1.1, // massive column radius
      height: pillar.h
    });
  }

  // 3. Scattered Ruins in Adventure Plains to create tactical covers
  const ruins = [
    // Southeast: Poring Novice plains
    { x: 38.0, z: 28.0, h: 3.5 },
    { x: 41.5, z: 25.0, h: 4.2 },
    { x: 35.0, z: 31.0, h: 2.8 },

    // Northwest: PecoPeco runner plains
    { x: -38.0, z: -35.0, h: 4.8 },
    { x: -44.0, z: -30.0, h: 3.0 },
    { x: -32.5, z: -40.0, h: 3.5 },

    // South: Poporing poison valley
    { x: -12.0, z: 45.0, h: 3.2 },
    { x: -8.0, z: 49.0, h: 4.5 },
    { x: 12.0, z: 42.0, h: 4.0 }
  ];
  for (const r of ruins) {
    rocks.push({
      x: r.x,
      z: r.z,
      radius: 0.85,
      height: r.h
    });
  }

  return rocks;
}

/**
 * Generates deterministic locations and dimensions of all 180 trees on the map.
 * Shared between logic controller loop and scene tree rendering.
 */
export function getTreeObstacles(mapName: string = 'prontera'): TreeObstacle[] {
  const trees: TreeObstacle[] = [];
  const treeCount = mapName === 'prontera' ? 0 : 180;
  if (treeCount === 0) return [];
  const rand = makePRNG(1337);

  for (let i = 0; i < treeCount; i++) {
    let x = 0;
    let z = 0;

    // 1. Boundary Wall (100 trees): Dense staggered rows to frame the level organically
    if (i < 100) {
      const angle = (i / 100) * Math.PI * 2;
      const offsetDist = 44.5 + (Math.sin(i * 1.5) + 1.0) * 8.0;
      x = Math.cos(angle) * offsetDist;
      z = Math.sin(angle) * offsetDist;
    } else {
      // 2. Playable Field Clusters (80 trees): 4 specific hand-designed clusters (grupos de árboles)
      const hubs = [
        { hX: -26, hZ: -26 }, // NW hill copse (encapsulating exploration knoll)
        { hX: 28, hZ: 28 },   // SE sunny copse
        { hX: -32, hZ: 14 },  // West rocky grove
        { hX: 42, hZ: -28 }   // Boss entry transition grove
      ];

      const hubIdx = i % hubs.length;
      const hub = hubs[hubIdx];

      const angle = rand() * Math.PI * 2;
      const spread = Math.sqrt(rand()) * 9.5;
      x = hub.hX + Math.cos(angle) * spread;
      z = hub.hZ + Math.sin(angle) * spread;

      // Keep clear of Spawn Plaza and restrain within level bounds
      const dist = Math.sqrt(x * x + z * z);
      if (dist < 18) {
        x = (x / dist) * 19;
        z = (z / dist) * 19;
      } else if (dist > 43) {
        x = (x / dist) * 42.5;
        z = (z / dist) * 42.5;
      }
    }

    const scale = 0.72 + rand() * 0.88;
    trees.push({
      x,
      z,
      radius: 0.40 * scale, // visually tracks tree trunk width accurately
      scale,
      rotX: (rand() - 0.5) * 0.08,
      rotY: rand() * Math.PI * 2,
      rotZ: (rand() - 0.5) * 0.08,
      leavesScaleY: scale * (0.84 + rand() * 0.38)
    });
  }

  return trees;
}

/**
 * Generates deterministic props (crates, barrels, signposts) scattered on the map.
 * Hand-aligned near ruins to make them look populated and clustered organically.
 */
export function getPropObstacles(mapName: string = 'prontera'): PropObstacle[] {
  const props: PropObstacle[] = [];
  const rocks = getRockObstacles(mapName);
  const rand = makePRNG(999);
  
  const placedProps: { x: number; z: number; radius: number }[] = [];

  const getPointNearRock = (propRadius: number): { x: number; z: number } | null => {
    if (rocks.length === 0) {
      if (mapName === 'prontera') {
        // Scatter props in Prontera quadrants, avoiding gated roads
        const angle = rand() * Math.PI * 2;
        const dist = 18 + rand() * 45; // between fountain plaza and walls
        const x = Math.cos(angle) * dist;
        const z = Math.sin(angle) * dist;
        if (Math.abs(x) < 8 || Math.abs(z) < 8) return null;
        return { x, z };
      }
      return { x: (rand() - 0.5) * 100, z: (rand() - 0.5) * 100 };
    }

    for (let attempts = 0; attempts < 15; attempts++) {
      const rockIdx = Math.floor(Math.pow(rand(), 1.5) * rocks.length);
      const rock = rocks[rockIdx];

      const angle = rand() * Math.PI * 2;
      const distance = rock.radius + propRadius + 0.1 + rand() * 1.8;

      const candidateX = rock.x + Math.cos(angle) * distance;
      const candidateZ = rock.z + Math.sin(angle) * distance;

      // Restrain from the spawn plaza zone (radius 18)
      if (Math.sqrt(candidateX * candidateX + candidateZ * candidateZ) < 18) continue;

      let collidesWithRock = false;
      for (const r of rocks) {
        const dx = candidateX - r.x;
        const dz = candidateZ - r.z;
        const dist = Math.sqrt(dx*dx + dz*dz);
        if (dist < r.radius + propRadius - 0.15) {
          collidesWithRock = true;
          break;
        }
      }
      if (collidesWithRock) continue;

      let collidesWithProp = false;
      for (const p of placedProps) {
        const dx = candidateX - p.x;
        const dz = candidateZ - p.z;
        const dist = Math.sqrt(dx*dx + dz*dz);
        if (dist < p.radius + propRadius + 0.1) {
          collidesWithProp = true;
          break;
        }
      }
      if (collidesWithProp) continue;

      placedProps.push({ x: candidateX, z: candidateZ, radius: propRadius });
      return { x: candidateX, z: candidateZ };
    }
    return null;
  };

  const crateCount = 65;
  const barrelCount = 45;
  const signpostCount = 18;

  // 1. Crates
  for (let i = 0; i < crateCount; i++) {
    const scale = 0.7 + rand() * 0.5;
    const pt = getPointNearRock(0.4 * scale);
    if (pt) {
      props.push({
        x: pt.x,
        z: pt.z,
        radius: 0.38 * scale, // Solid box collision
        scale,
        type: 'crate',
        rotX: (rand() - 0.5) * 0.15,
        rotY: rand() * Math.PI * 2,
        rotZ: (rand() - 0.5) * 0.15
      });
    }
  }

  // 2. Barrels
  for (let i = 0; i < barrelCount; i++) {
    const scale = 0.8 + rand() * 0.3;
    const pt = getPointNearRock(0.35 * scale);
    if (pt) {
      const isFallen = rand() > 0.65;
      props.push({
        x: pt.x,
        z: pt.z,
        radius: 0.34 * scale, // Cylindrical collision diameter
        scale,
        type: 'barrel',
        isFallen,
        rotX: isFallen ? Math.PI / 2 : (rand() - 0.5) * 0.05,
        rotY: rand() * Math.PI * 2,
        rotZ: isFallen ? rand() * Math.PI : 0
      });
    }
  }

  // 3. Signposts
  for (let i = 0; i < signpostCount; i++) {
    const pt = getPointNearRock(0.6);
    if (pt) {
      const baseRotationY = rand() * Math.PI * 2;
      const tilt = (rand() - 0.5) * 0.2;
      props.push({
        x: pt.x,
        z: pt.z,
        radius: 0.22, // thin pole collision radius
        scale: 1.0,
        type: 'signpost',
        rotX: tilt,
        rotY: baseRotationY,
        rotZ: tilt,
        boardRotY: baseRotationY + (rand() - 0.5) * 0.3,
        boardRotZ: (rand() - 0.5) * 0.15
      });
    }
  }

  return props;
}

/**
 * Unified Axis-Aligned broadphase collision solver.
 * Multi-level sliding physics for perfect, fluid gameplay collision against rock walls, trunks and barrels.
 */
export function resolveCollisions(
  px: number,
  pz: number,
  rocks: RockObstacle[],
  trees: TreeObstacle[],
  props: PropObstacle[]
): { x: number; z: number } {
  let cx = px;
  let cz = pz;

  // 1. Solve Rock collisions
  for (let i = 0; i < rocks.length; i++) {
    const r = rocks[i];
    const dx = cx - r.x;
    if (Math.abs(dx) > r.radius) continue;
    const dz = cz - r.z;
    if (Math.abs(dz) > r.radius) continue;

    const dSq = dx * dx + dz * dz;
    const minDist = r.radius;
    if (dSq < minDist * minDist) {
      const dist = Math.sqrt(dSq);
      if (dist > 0.001) {
        const overlap = minDist - dist;
        cx += (dx / dist) * overlap;
        cz += (dz / dist) * overlap;
      }
    }
  }

  // 2. Solve Tree trunk collisions
  for (let i = 0; i < trees.length; i++) {
    const t = trees[i];
    const dx = cx - t.x;
    if (Math.abs(dx) > t.radius) continue;
    const dz = cz - t.z;
    if (Math.abs(dz) > t.radius) continue;

    const dSq = dx * dx + dz * dz;
    const minDist = t.radius;
    if (dSq < minDist * minDist) {
      const dist = Math.sqrt(dSq);
      if (dist > 0.001) {
        const overlap = minDist - dist;
        cx += (dx / dist) * overlap;
        cz += (dz / dist) * overlap;
      }
    }
  }

  // 3. Solve environmental item collisions (crates and barrels)
  for (let i = 0; i < props.length; i++) {
    const p = props[i];
    const dx = cx - p.x;
    if (Math.abs(dx) > p.radius) continue;
    const dz = cz - p.z;
    if (Math.abs(dz) > p.radius) continue;

    const dSq = dx * dx + dz * dz;
    const minDist = p.radius;
    if (dSq < minDist * minDist) {
      const dist = Math.sqrt(dSq);
      if (dist > 0.001) {
        const overlap = minDist - dist;
        cx += (dx / dist) * overlap;
        cz += (dz / dist) * overlap;
      }
    }
  }

  return { x: cx, z: cz };
}

/**
 * HIGH-PERFORMANCE MOVEMENT PREDICTION PATH VISUALIZER
 * Projects the physical sliding trajectory of the player in future frames,
 * creating a futuristic glowing neon track on the grassland leading to the destination.
 */
export class ClientPredictionPath {
  private line: THREE.Line;
  private scene: THREE.Scene;
  private maxPoints = 16;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(this.maxPoints * 3);
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    // Custom glowing material styling
    const material = new THREE.LineBasicMaterial({
      color: 0x0ea5e9, // Glowing High-contrast Sky Blue
      transparent: true,
      opacity: 0.7,
      depthWrite: false
    });

    this.line = new THREE.Line(geometry, material);
    this.line.visible = false;
    this.scene.add(this.line);
  }

  /**
   * Projects the path forward incorporating velocity, acceleration curves,
   * boundaries, and obstacle collisions.
   */
  public project(
    startX: number,
    startZ: number,
    vx: number,
    vz: number,
    targetX?: number,
    targetZ?: number,
    maxSpeed: number = 8.0,
    accelFactor: number = 11.0
  ) {
    // If not moving and has no target, hide the path prediction trail
    const hasTarget = targetX !== undefined && targetZ !== undefined;
    const currentSpeedSq = vx * vx + vz * vz;

    if (!hasTarget && currentSpeedSq < 0.05) {
      this.line.visible = false;
      return;
    }

    this.line.visible = true;
    const positions = this.line.geometry.attributes.position.array as Float32Array;
    const mapName = useGameStore.getState().currentMap || 'prontera';
    const rocks = getRockObstacles(mapName);
    const trees = getTreeObstacles(mapName);
    const props = getPropObstacles(mapName);

    let px = startX;
    let pz = startZ;
    let pvx = vx;
    let pvz = vz;
    const stepDt = 0.06; // Simulation advance time-slice

    for (let i = 0; i < this.maxPoints; i++) {
      positions[i * 3] = px;
      positions[i * 3 + 1] = 0.055; // prevent visual Z-fighting with ground
      positions[i * 3 + 2] = pz;

      // Calculate future velocity targets
      let targetVx = 0;
      let targetVz = 0;

      if (hasTarget) {
        const dx = targetX! - px;
        const dz = targetZ! - pz;
        const distance = Math.sqrt(dx * dx + dz * dz);

        if (distance > 0.15) {
          targetVx = (dx / distance) * maxSpeed;
          targetVz = (dz / distance) * maxSpeed;
        }
      } else {
        // Continue momentum direction
        const speed = Math.sqrt(pvx * pvx + pvz * pvz);
        if (speed > 0.1) {
          targetVx = (pvx / speed) * maxSpeed * 0.95;
          targetVz = (pvz / speed) * maxSpeed * 0.95;
        }
      }

      // Blend velocity projection
      pvx = THREE.MathUtils.lerp(pvx, targetVx, accelFactor * stepDt);
      pvz = THREE.MathUtils.lerp(pvz, targetVz, accelFactor * stepDt);

      // Advance physics integration
      const nextX = px + pvx * stepDt;
      const nextZ = pz + pvz * stepDt;
      
      if (!isPositionWalkable(nextX, nextZ)) {
        pvx = 0;
        pvz = 0;
      } else {
        px = nextX;
        pz = nextZ;
      }

      // Handle map boundaries (prevent crossing mountain ridges)
      const controller = useGameStore.getState().engineInstance?.charController;
      const mapLimit = controller ? controller.getMapBoundaryLimit() : (mapName === 'prontera' ? 96.0 : 48.0);

      const pDist = Math.sqrt(px * px + pz * pz);
      if (pDist > mapLimit) {
        px = (px / pDist) * mapLimit;
        pz = (pz / pDist) * mapLimit;
        pvx = 0;
        pvz = 0;
      }

      // Resolve obstacle sliding collisions inside path projection
      const resolved = resolveCollisions(px, pz, rocks, trees, props);
      px = resolved.x;
      pz = resolved.z;
    }

    this.line.geometry.attributes.position.needsUpdate = true;
  }

  public destroy() {
    this.scene.remove(this.line);
    this.line.geometry.dispose();
    if (Array.isArray(this.line.material)) {
      this.line.material.forEach(m => m.dispose());
    } else {
      this.line.material.dispose();
    }
  }
}

/**
 * PREMIUM RPG CHARACTER CONTROLLER DESIGN
 * Separates gameplay simulation and rendering.
 * Provides high-fidelity movement mechanics, responsive direction flips, boundary and obstacle sliding physics.
 */
export class RPGCharacterController {
  public vx: number = 0; // current running velocity in X
  public vz: number = 0; // current running velocity in Z
  
  private player: Entity;
  private scene: THREE.Scene;
  private predictionPath: ClientPredictionPath;
  private rockObstacles: RockObstacle[];
  private treeObstacles: TreeObstacle[];
  private propObstacles: PropObstacle[];

  // Tuning parameter configurations
  private accelerationConstant = 12.5; // High responsiveness start curve
  private decelerationConstant = 16.0; // Snappy stopping feedback deceleration
  private mapBoundaryLimit = 48.0; // Circular border clamp radius

  public getMapBoundaryLimit() {
    return this.mapBoundaryLimit;
  }

  constructor(player: Entity, scene: THREE.Scene, mapName: string = 'prontera') {
    this.player = player;
    this.scene = scene;
    this.predictionPath = new ClientPredictionPath(scene);
    this.rockObstacles = getRockObstacles(mapName);
    this.treeObstacles = getTreeObstacles(mapName);
    this.propObstacles = getPropObstacles(mapName);
    this.mapBoundaryLimit = mapName === 'prontera' ? 96.0 : 48.0;
  }

  /**
   * Core Update loop. To be triggered inside tickCoordinates.
   * Handles smooth acceleration, joystick fusion, point-and-click sliding, and target locked facing alignments.
   */
  public updateMovement(dt: number, tickScale: number, isCastingOrAttacking: boolean, lockedTargetMob: Entity | null) {
    const store = useGameStore.getState();

    // Max movement speed configured incorporating Character AGI factor
    const baseSpeed = 8.1;
    const agiBonus = store.stats.agi * 0.11;
    const maxSpeed = baseSpeed + agiBonus;

    let targetVx = 0;
    let targetVz = 0;
    let targetState: Entity['state'] = 'idle';

    // 1. INPUT METHOD DETECTION: JOYSTICK SPLENDID BLENDING
    if (store.isJoystickEnabled && store.joystick.isActive) {
      targetState = 'move';
      
      const angle = store.joystick.angle;
      const mag = Math.min(1.0, store.joystick.distance / 60); // standard joystick drag clamp

      targetVx = Math.cos(angle) * maxSpeed * mag;
      targetVz = Math.sin(angle) * maxSpeed * mag;

      // Abort click routing targets
      this.player.targetX = undefined;
      this.player.targetZ = undefined;
    } 
    // 2. INPUT METHOD DETECTION: CLICK/TAP COORDINATE ROUTING
    else if (this.player.targetX !== undefined && this.player.targetZ !== undefined) {
      const dx = this.player.targetX - this.player.x;
      const dz = this.player.targetZ - this.player.z;
      const dist = Math.sqrt(dx * dx + dz * dz);

      if (dist > 0.32) {
        targetState = 'move';
        targetVx = (dx / dist) * maxSpeed;
        targetVz = (dz / dist) * maxSpeed;
      } else {
        // Destination arrived
        targetState = 'idle';
        this.player.targetX = undefined;
        this.player.targetZ = undefined;
      }
    }

    // 3. INERTIA / ACCELERATION COMPUTATION BLENDING
    // Decide if we are accelerating (speeding up or turning) or braking (heading to stop)
    const currentSpeedSq = this.vx * this.vx + this.vz * this.vz;
    const targetSpeedSq = targetVx * targetVx + targetVz * targetVz;
    const isStopping = targetSpeedSq === 0;

    const blendRate = isStopping ? this.decelerationConstant : this.accelerationConstant;

    // Linearly interpolate velocities based on frame step timing
    this.vx = THREE.MathUtils.lerp(this.vx, targetVx, blendRate * dt);
    this.vz = THREE.MathUtils.lerp(this.vz, targetVz, blendRate * dt);

    // Apply simulation movement update to coordinates
    const moveX = this.vx * dt;
    const moveZ = this.vz * dt;

    if (Math.abs(moveX) > 0.0001 || Math.abs(moveZ) > 0.0001) {
      const nextX = this.player.x + moveX;
      const nextZ = this.player.z + moveZ;
      
      if (!isPositionWalkable(nextX, nextZ)) {
        // Professional Sliding & Unstuck Logic
        const canMoveX = isPositionWalkable(nextX, this.player.z);
        const canMoveZ = isPositionWalkable(this.player.x, nextZ);

        if (canMoveX && !canMoveZ) {
          this.player.x = nextX;
          this.vz = 0;
        } else if (canMoveZ && !canMoveX) {
          this.player.z = nextZ;
          this.vx = 0;
        } else {
          // Completely blocked: Immediate Stop
          this.vx = 0;
          this.vz = 0;
          
          // Emergency Unstuck search: if current position is invalid, push to nearest valid
          if (!isPositionWalkable(this.player.x, this.player.z)) {
            const searchDist = 0.5;
            const dirs = [
              {x: 1, z: 0}, {x: -1, z: 0}, {x: 0, z: 1}, {x: 0, z: -1},
              {x: 0.7, z: 0.7}, {x: -0.7, z: -0.7}, {x: 0.7, z: -0.7}, {x: -0.7, z: 0.7}
            ];
            for (const d of dirs) {
              const tx = this.player.x + d.x * searchDist;
              const tz = this.player.z + d.z * searchDist;
              if (isPositionWalkable(tx, tz)) {
                this.player.x = tx;
                this.player.z = tz;
                break;
              }
            }
          }
        }
      } else {
        this.player.state = 'move';
        this.player.x = nextX;
        this.player.z = nextZ;
      }
    } else if (targetState === 'idle') {
      this.player.state = 'idle';
    }

    // 4. MAP CIRCULAR BOUNDARY CLAMPING
    const playDist = Math.sqrt(this.player.x * this.player.x + this.player.z * this.player.z);
    if (playDist > this.mapBoundaryLimit) {
      this.player.x = (this.player.x / playDist) * this.mapBoundaryLimit;
      this.player.z = (this.player.z / playDist) * this.mapBoundaryLimit;
      this.vx = 0;
      this.vz = 0;
    }

    // 5. UNIFIED HIGH-PERFORMANCE PHYSICAL COLLISION AND SLIDING PHYSICS
    // Slips fluidly around rocks, trees, crates and barrels
    const oldX = this.player.x;
    const oldZ = this.player.z;
    const resolved = resolveCollisions(
      this.player.x,
      this.player.z,
      this.rockObstacles,
      this.treeObstacles,
      this.propObstacles
    );

    if (resolved.x !== oldX || resolved.z !== oldZ) {
      this.player.x = resolved.x;
      this.player.z = resolved.z;

      // Adjust velocity vector based on normal direction of deflection to assist smooth sliding
      const diffX = resolved.x - oldX;
      const diffZ = resolved.z - oldZ;
      const diffLen = Math.sqrt(diffX * diffX + diffZ * diffZ);
      if (diffLen > 0.001) {
        const normalX = diffX / diffLen;
        const normalZ = diffZ / diffLen;
        const dot = this.vx * normalX + this.vz * normalZ;
        if (dot < 0) {
          this.vx -= normalX * dot * 1.05; // cancel opposing components
          this.vz -= normalZ * dot * 1.05;
        }
      }
    }

    // 6. FACING ALIGNMENTS (MOVEMENT & ATTACK TARGET DIRECTION)
    // Rule: If actively casting or attacking, instantly face the target mob;
    // Otherwise, face the horizontal movement direction.
    if (lockedTargetMob && isCastingOrAttacking) {
      this.player.facing = (lockedTargetMob.x > this.player.x) ? 'right' : 'left';
    } else {
      if (Math.abs(this.vx) > 0.05) {
        this.player.facing = this.vx > 0 ? 'right' : 'left';
      }
    }

    // 7. SYNC PREDICTIVE PATH GRAPHICS
    this.predictionPath.project(
      this.player.x,
      this.player.z,
      this.vx,
      this.vz,
      this.player.targetX,
      this.player.targetZ,
      maxSpeed,
      this.accelerationConstant
    );
  }

  public destroy() {
    if (this.predictionPath) {
      this.predictionPath.destroy();
    }
  }
}
