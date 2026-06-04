import * as THREE from 'three';
import { Entity } from './types';
import { useGameStore } from './state';

export interface RockObstacle {
  x: number;
  z: number;
  radius: number;
  height?: number;
}

export class RPGCharacterController {
  public vx: number = 0;
  public vz: number = 0;
  
  private player: Entity;
  private scene: THREE.Scene;
  private predictionPath: ClientPredictionPath;
  private rockObstacles: RockObstacle[] = [];

  private accelerationConstant = 12.5;
  private decelerationConstant = 16.0;
  private mapWidth = 64;
  private mapHeight = 64;

  constructor(player: Entity, scene: THREE.Scene) {
    this.player = player;
    this.scene = scene;
    this.predictionPath = new ClientPredictionPath(scene);
  }

  public setMapDimensions(width: number, height: number) {
    this.mapWidth = width;
    this.mapHeight = height;
  }

  public syncObstacles(cells: RockObstacle[]) {
    this.rockObstacles = cells;
  }

  public updateMovement(dt: number, tickScale: number, isCastingOrAttacking: boolean, lockedTargetMob: Entity | null) {
    const store = useGameStore.getState();

    const baseSpeed = 8.1;
    const agiBonus = store.stats.agi * 0.11;
    const maxSpeed = baseSpeed + agiBonus;

    let targetVx = 0;
    let targetVz = 0;
    let targetState: Entity['state'] = 'idle';

    if (store.isJoystickEnabled && store.joystick.isActive) {
      targetState = 'move';
      const angle = store.joystick.angle;
      const mag = Math.min(1.0, store.joystick.distance / 60);
      targetVx = Math.cos(angle) * maxSpeed * mag;
      targetVz = Math.sin(angle) * maxSpeed * mag;
      this.player.targetX = undefined;
      this.player.targetZ = undefined;
    } else if (this.player.targetX !== undefined && this.player.targetZ !== undefined) {
      const dx = this.player.targetX - this.player.x;
      const dz = this.player.targetZ - this.player.z;
      const dist = Math.sqrt(dx * dx + dz * dz);
      if (dist > 0.32) {
        targetState = 'move';
        targetVx = (dx / dist) * maxSpeed;
        targetVz = (dz / dist) * maxSpeed;
      } else {
        targetState = 'idle';
        this.player.targetX = undefined;
        this.player.targetZ = undefined;
      }
    }

    const currentSpeedSq = this.vx * this.vx + this.vz * this.vz;
    const targetSpeedSq = targetVx * targetVx + targetVz * targetVz;
    const isStopping = targetSpeedSq === 0;
    const blendRate = isStopping ? this.decelerationConstant : this.accelerationConstant;
    this.vx = THREE.MathUtils.lerp(this.vx, targetVx, blendRate * dt);
    this.vz = THREE.MathUtils.lerp(this.vz, targetVz, blendRate * dt);

    const moveX = this.vx * dt;
    const moveZ = this.vz * dt;

    if (Math.abs(moveX) > 0.0001 || Math.abs(moveZ) > 0.0001) {
      this.player.state = 'move';
      this.player.x += moveX;
      this.player.z += moveZ;
    } else if (targetState === 'idle') {
      this.player.state = 'idle';
    }

    // Clamp to map boundaries (0 → width, 0 → height)
    if (this.player.x < 0) {
      this.player.x = 0;
      this.vx = 0;
    }
    if (this.player.x > this.mapWidth) {
      this.player.x = this.mapWidth;
      this.vx = 0;
    }
    if (this.player.z < 0) {
      this.player.z = 0;
      this.vz = 0;
    }
    if (this.player.z > this.mapHeight) {
      this.player.z = this.mapHeight;
      this.vz = 0;
    }

    // Rock obstacle sliding collision
    for (const rock of this.rockObstacles) {
      const rdx = this.player.x - rock.x;
      const rdz = this.player.z - rock.z;
      const distSq = rdx * rdx + rdz * rdz;
      const minDist = rock.radius;
      if (distSq < minDist * minDist) {
        const dist = Math.sqrt(distSq);
        if (dist > 0.001) {
          const overlap = minDist - dist;
          this.player.x += (rdx / dist) * overlap;
          this.player.z += (rdz / dist) * overlap;
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

    // Facing alignment
    if (lockedTargetMob && isCastingOrAttacking) {
      this.player.facing = (lockedTargetMob.x > this.player.x) ? 'right' : 'left';
    } else {
      if (Math.abs(this.vz) > Math.abs(this.vx)) {
        this.player.facing = this.vz < 0 ? 'up' : 'down';
      } else if (Math.abs(this.vx) > 0.05) {
        this.player.facing = this.vx > 0 ? 'right' : 'left';
      }
    }

    // Sync predictive path graphics
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

class ClientPredictionPath {
  private line: THREE.Line;
  private scene: THREE.Scene;
  private maxPoints = 16;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(this.maxPoints * 3);
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const material = new THREE.LineBasicMaterial({
      color: 0x0ea5e9,
      transparent: true,
      opacity: 0.7,
      depthWrite: false
    });
    this.line = new THREE.Line(geometry, material);
    this.line.visible = false;
    this.scene.add(this.line);
  }

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
    const hasTarget = targetX !== undefined && targetZ !== undefined;
    const currentSpeedSq = vx * vx + vz * vz;

    if (!hasTarget && currentSpeedSq < 0.05) {
      this.line.visible = false;
      return;
    }

    this.line.visible = true;
    const positions = this.line.geometry.attributes.position.array as Float32Array;
    const rocks = obstacles || [];

    let px = startX;
    let pz = startZ;
    let pvx = vx;
    let pvz = vz;
    const stepDt = 0.06;

    for (let i = 0; i < this.maxPoints; i++) {
      positions[i * 3] = px;
      positions[i * 3 + 1] = 0.055;
      positions[i * 3 + 2] = pz;

      let targetVx = 0;
      let targetVz = 0;

      if (hasTarget) {
        const dx = targetX! - px;
        const dz = targetZ! - pz;
        const dist = Math.sqrt(dx * dx + dz * dz);
        if (dist > 0.2) {
          targetVx = (dx / dist) * maxSpeed;
          targetVz = (dz / dist) * maxSpeed;
        }
      }

      const isStopping = targetVx === 0 && targetVz === 0;
      const blend = isStopping ? 16.0 : accelFactor;
      pvx = THREE.MathUtils.lerp(pvx, targetVx, blend * stepDt);
      pvz = THREE.MathUtils.lerp(pvz, targetVz, blend * stepDt);

      px += pvx * stepDt;
      pz += pvz * stepDt;

      // Obstacle collision
      for (const rock of rocks) {
        const rdx = px - rock.x;
        const rdz = pz - rock.z;
        const distSq = rdx * rdx + rdz * rdz;
        if (distSq < rock.radius * rock.radius && distSq > 0.001) {
          const dist = Math.sqrt(distSq);
          px += (rdx / dist) * (rock.radius - dist);
          pz += (rdz / dist) * (rock.radius - dist);
        }
      }
    }

    this.line.geometry.attributes.position.needsUpdate = true;
  }

  public destroy() {
    this.scene.remove(this.line);
    this.line.geometry.dispose();
    (this.line.material as THREE.Material).dispose();
  }
}
