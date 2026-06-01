import * as THREE from 'three';
import { Entity, CharacterStats } from './types';
import { useGameStore } from './state';

export interface RockObstacle {
  x: number;
  z: number;
  radius: number;
  height?: number;
}

/**
 * Generates the deterministic coordinates of rock obstacle pillars in the scenario.
 * Matches the sin/cos formula used to instantiate them in EnvironmentInstancedSystem.
 */
export function getRockObstacles(rockCount: number = 30): RockObstacle[] {
  const rocks: RockObstacle[] = [];

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
    accelFactor: number = 11.0,
    obstacles?: RockObstacle[]
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
    const rocks = obstacles || getRockObstacles(30);

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
      px += pvx * stepDt;
      pz += pvz * stepDt;

      // Handle map boundaries
      const boundary = 140;
      if (Math.abs(px) > boundary) px = Math.sign(px) * boundary;
      if (Math.abs(pz) > boundary) pz = Math.sign(pz) * boundary;

      // Obstacle sliding collisions resolving
      for (const rock of rocks) {
        const rdx = px - rock.x;
        const rdz = pz - rock.z;
        const distSq = rdx * rdx + rdz * rdz;
        const minDist = rock.radius;

        if (distSq < minDist * minDist) {
          const dist = Math.sqrt(distSq);
          if (dist > 0.001) {
            const overlap = minDist - dist;
            px += (rdx / dist) * overlap;
            pz += (rdz / dist) * overlap;
          }
        }
      }
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
 * Provides high-fidelity movement mechanics, responsive direction flips, boundary and rock obstacle sliding physics.
 */
export class RPGCharacterController {
  public vx: number = 0; // current running velocity in X
  public vz: number = 0; // current running velocity in Z
  
  private player: Entity;
  private scene: THREE.Scene;
  private predictionPath: ClientPredictionPath;
  private rockObstacles: RockObstacle[];
  private staticObstacles: RockObstacle[] = [];

  // Tuning parameter configurations
  private accelerationConstant = 12.5; // High responsiveness start curve
  private decelerationConstant = 16.0; // Snappy stopping feedback deceleration
  private mapBoundaryLimit = 140.0; // Border culling clamp coordinates

  constructor(player: Entity, scene: THREE.Scene) {
    this.player = player;
    this.scene = scene;
    this.predictionPath = new ClientPredictionPath(scene);
    this.staticObstacles = getRockObstacles(30);
    this.rockObstacles = [...this.staticObstacles];
  }

  // Merge terrain collision cells with static obstacles (fortress ring, etc.)
  public syncObstacles(cells: RockObstacle[]) {
    this.rockObstacles = [...this.staticObstacles, ...cells];
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
      this.player.state = 'move';
      this.player.x += moveX;
      this.player.z += moveZ;
    } else if (targetState === 'idle') {
      this.player.state = 'idle';
    }

    // 4. MAP BOUNDARY CLAMPING
    if (Math.abs(this.player.x) > this.mapBoundaryLimit) {
      this.player.x = Math.sign(this.player.x) * this.mapBoundaryLimit;
      this.vx = 0;
    }
    if (Math.abs(this.player.z) > this.mapBoundaryLimit) {
      this.player.z = Math.sign(this.player.z) * this.mapBoundaryLimit;
      this.vz = 0;
    }

    // 5. ROCK OBSTACLES PHYSICAL CIRCULAR SLIDING COLLISION
    // If running against rocks, slip dynamically around the tangent instead of getting stuck
    for (const rock of this.rockObstacles) {
      const rdx = this.player.x - rock.x;
      const rdz = this.player.z - rock.z;
      const distSq = rdx * rdx + rdz * rdz;
      const minDist = rock.radius;

      if (distSq < minDist * minDist) {
        const dist = Math.sqrt(distSq);
        if (dist > 0.001) {
          const overlap = minDist - dist;
          // Slip correction
          this.player.x += (rdx / dist) * overlap;
          this.player.z += (rdz / dist) * overlap;
          
          // Modify velocity vectors slightly to assist sliding
          const normalX = rdx / dist;
          const normalZ = rdz / dist;
          const dot = this.vx * normalX + this.vz * normalZ;
          if (dot < 0) {
            this.vx -= normalX * dot;
            this.vz -= normalZ * dot;
          }
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
      this.accelerationConstant,
      this.rockObstacles
    );
  }

  public destroy() {
    if (this.predictionPath) {
      this.predictionPath.destroy();
    }
  }
}
