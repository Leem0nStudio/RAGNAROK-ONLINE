import * as THREE from 'three';
import { Entity, CharacterStats } from './types';
import { useGameStore } from './state';

export interface RockObstacle {
  x: number;
  z: number;
  radius: number;
}

/**
 * Generates the deterministic coordinates of rock obstacle pillars in the scenario.
 * Matches the sin/cos formula used to instantiate them in EnvironmentInstancedSystem.
 */
export function getRockObstacles(rockCount: number = 30): RockObstacle[] {
  const rocks: RockObstacle[] = [];
  for (let i = 0; i < rockCount; i++) {
    let rx = (Math.sin(i * 123.4) * 0.5 + 0.5) * 140 - 70;
    let rz = (Math.cos(i * 567.8) * 0.5 + 0.5) * 140 - 70;
    if (Math.abs(rx) < 8 && Math.abs(rz) < 8) {
      rx += 12;
      rz += 12;
    }
    rocks.push({
      x: rx,
      z: rz,
      radius: 0.82 // cylinder base radius + padding buffer
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
    const rocks = getRockObstacles(30);

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
      if (Math.abs(px) > 78) px = Math.sign(px) * 78;
      if (Math.abs(pz) > 78) pz = Math.sign(pz) * 78;

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

  // Tuning parameter configurations
  private accelerationConstant = 12.5; // High responsiveness start curve
  private decelerationConstant = 16.0; // Snappy stopping feedback deceleration
  private mapBoundaryLimit = 78.0; // Border culling clamp coordinates

  constructor(player: Entity, scene: THREE.Scene) {
    this.player = player;
    this.scene = scene;
    this.predictionPath = new ClientPredictionPath(scene);
    this.rockObstacles = getRockObstacles(30);
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
      this.accelerationConstant
    );
  }

  public destroy() {
    if (this.predictionPath) {
      this.predictionPath.destroy();
    }
  }
}
