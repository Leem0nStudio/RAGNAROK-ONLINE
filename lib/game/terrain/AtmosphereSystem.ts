import type { SubzonePurpose } from '@/lib/game/types';
import * as THREE from 'three';

export interface AmbientParticleConfig {
  type: 'dust' | 'petals' | 'pollen' | 'leaves';
  count: number;
  color: string;
  size: number;
  opacity: number;
  spreadX: number;
  spreadZ: number;
  spreadY: [number, number];
  speed: number;
  driftX: number;
  driftZ: number;
}

const PURPOSE_PARTICLES: Record<string, AmbientParticleConfig[]> = {
  city: [
    {
      type: 'dust', count: 15, color: '#d0d0d0', size: 0.1, opacity: 0.1,
      spreadX: 40, spreadZ: 40, spreadY: [0.5, 3], speed: 0.1, driftX: 0.1, driftZ: 0.1,
    },
  ],
  fields: [
    {
      type: 'petals', count: 12, color: '#f0e8e0', size: 0.06, opacity: 0.3,
      spreadX: 40, spreadZ: 40, spreadY: [1, 6], speed: 0.3, driftX: 0.2, driftZ: 0.1,
    },
    {
      type: 'dust', count: 20, color: '#d0c8b0', size: 0.15, opacity: 0.08,
      spreadX: 50, spreadZ: 50, spreadY: [0.5, 4], speed: 0.15, driftX: 0.3, driftZ: 0.2,
    },
  ],
  forest: [
    {
      type: 'leaves', count: 18, color: '#6a5a3a', size: 0.08, opacity: 0.35,
      spreadX: 40, spreadZ: 30, spreadY: [2, 7], speed: 0.4, driftX: 0.5, driftZ: 0.15,
    },
    {
      type: 'pollen', count: 8, color: '#c8d878', size: 0.03, opacity: 0.15,
      spreadX: 35, spreadZ: 35, spreadY: [1, 5], speed: 0.5, driftX: 0.1, driftZ: 0.1,
    },
  ],
  dungeon: [],
  transition: [
    {
      type: 'dust', count: 25, color: '#b8a888', size: 0.12, opacity: 0.10,
      spreadX: 50, spreadZ: 50, spreadY: [0.5, 4], speed: 0.15, driftX: 0.3, driftZ: 0.2,
    },
  ],
  boss_arena: [],
  lake: [],
};

export class AtmosphereSystem {
  private scene: THREE.Scene;
  private particles: THREE.Points | null = null;
  private config: AmbientParticleConfig | null = null;
  private positions: Float32Array | null = null;
  private velocities: Float32Array | null = null;
  private basePositions: Float32Array | null = null;
  private active = false;
  private time = 0;
  private cameraPos = new THREE.Vector3();

  constructor(scene: THREE.Scene) {
    this.scene = scene;
  }

  getConfigsForPurpose(purpose: SubzonePurpose): AmbientParticleConfig[] {
    return PURPOSE_PARTICLES[purpose] ?? [];
  }

  applySubzone(purpose: SubzonePurpose) {
    this.clear();
    const configs = this.getConfigsForPurpose(purpose);
    if (configs.length === 0) return;
    this.config = configs[0];
    this.spawn(this.config);
  }

  /** @deprecated Use applySubzone(purpose) instead */
  applyZone(_zoneId: string) {
    this.clear();
  }

  private spawn(cfg: AmbientParticleConfig) {
    const count = cfg.count;
    const positions = new Float32Array(count * 3);
    const basePos = new Float32Array(count * 3);
    const velocities = new Float32Array(count * 2);

    for (let i = 0; i < count; i++) {
      const x = (Math.random() - 0.5) * cfg.spreadX;
      const z = (Math.random() - 0.5) * cfg.spreadZ;
      const y = cfg.spreadY[0] + Math.random() * (cfg.spreadY[1] - cfg.spreadY[0]);
      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;
      basePos[i * 3] = x;
      basePos[i * 3 + 1] = y;
      basePos[i * 3 + 2] = z;
      velocities[i * 2] = (Math.random() - 0.5) * 0.3;
      velocities[i * 2 + 1] = (Math.random() - 0.5) * 0.3;
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const mat = new THREE.PointsMaterial({
      color: new THREE.Color(cfg.color),
      size: cfg.size,
      transparent: true,
      opacity: cfg.opacity,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      sizeAttenuation: true,
    });

    this.particles = new THREE.Points(geo, mat);
    this.particles.renderOrder = 99;
    this.scene.add(this.particles);

    this.positions = positions;
    this.basePositions = basePos;
    this.velocities = velocities;
    this.active = true;
  }

  clear() {
    if (this.particles) {
      this.scene.remove(this.particles);
      this.particles.geometry.dispose();
      (this.particles.material as THREE.Material).dispose();
      this.particles = null;
    }
    this.positions = null;
    this.basePositions = null;
    this.velocities = null;
    this.active = false;
  }

  update(delta: number, cameraPos: THREE.Vector3) {
    if (!this.active || !this.particles || !this.positions || !this.basePositions || !this.config) return;

    this.time += delta;
    const cfg = this.config;
    const pos = this.positions;
    const base = this.basePositions;
    const vel = this.velocities!;
    const count = pos.length / 3;

    for (let i = 0; i < count; i++) {
      const ix = i * 3;
      const iy = i * 3 + 1;
      const iz = i * 3 + 2;

      if (cfg.type === 'petals') {
        pos[ix] = base[ix] + Math.sin(this.time * cfg.speed + i * 1.5) * 1.2;
        pos[iy] = base[iy] + Math.sin(this.time * cfg.speed * 1.3 + i * 2.1) * 0.5 - this.time * 0.08;
        pos[iz] = base[iz] + Math.cos(this.time * cfg.speed * 0.7 + i * 1.1) * 1.2;
      } else if (cfg.type === 'leaves') {
        pos[ix] = base[ix] + Math.sin(this.time * cfg.speed + i * 0.7) * 2.0 + this.time * cfg.driftX;
        pos[iy] = base[iy] + Math.sin(this.time * cfg.speed * 0.5 + i * 1.3) * 0.8;
        pos[iz] = base[iz] + Math.cos(this.time * cfg.speed * 0.3 + i * 0.5) * 1.5;
      } else if (cfg.type === 'pollen') {
        pos[ix] = base[ix] + Math.sin(this.time * cfg.speed + i * 3.7) * 2.5;
        pos[iy] = base[iy] + Math.sin(this.time * cfg.speed * 0.8 + i * 5.1) * 1.0;
        pos[iz] = base[iz] + Math.cos(this.time * cfg.speed * 0.6 + i * 2.3) * 2.5;
      } else {
        pos[ix] = base[ix] + Math.sin(this.time * cfg.speed + i * 1.3) * 1.0;
        pos[iy] = base[iy] + Math.sin(this.time * cfg.speed * 0.7 + i * 0.9) * 0.5;
        pos[iz] = base[iz] + Math.cos(this.time * cfg.speed * 0.5 + i * 1.7) * 1.0;
      }

      if (pos[iy] < 0) {
        pos[iy] = cfg.spreadY[0] + Math.random() * (cfg.spreadY[1] - cfg.spreadY[0]);
        base[ix] = (Math.random() - 0.5) * cfg.spreadX;
        base[iz] = (Math.random() - 0.5) * cfg.spreadZ;
        base[iy] = pos[iy];
        pos[ix] = base[ix];
        pos[iz] = base[iz];
      }
    }

    this.particles.geometry.attributes.position.needsUpdate = true;

    this.particles.position.set(
      Math.round(cameraPos.x / 32) * 32,
      0,
      Math.round(cameraPos.z / 32) * 32,
    );
  }

  dispose() {
    this.clear();
  }
}
