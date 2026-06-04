import * as THREE from 'three';

export type ParticleType = 'torch' | 'dust_mote' | 'firefly' | 'ember';

export interface ParticleSource {
  type: ParticleType;
  x: number;
  y: number;
  z: number;
  count: number;
  spreadX: number;
  spreadZ: number;
}

interface Particle {
  x: number; y: number; z: number;
  vx: number; vy: number; vz: number;
  life: number; maxLife: number;
  size: number;
  r: number; g: number; b: number;
  phase: number;
}

const MAX_PARTICLES: Record<ParticleType, number> = {
  torch: 30,
  dust_mote: 60,
  firefly: 20,
  ember: 25,
};

const textures: Record<ParticleType, THREE.CanvasTexture | null> = {
  torch: null,
  dust_mote: null,
  firefly: null,
  ember: null,
};

function createGlowTexture(size: number, r: number, g: number, b: number, a: number): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = size;
  c.height = size;
  const ctx = c.getContext('2d')!;
  const cx = size / 2;
  const grad = ctx.createRadialGradient(cx, cx, 0, cx, cx, cx);
  grad.addColorStop(0, `rgba(${r},${g},${b},${a})`);
  grad.addColorStop(0.3, `rgba(${r},${g},${b},${a * 0.5})`);
  grad.addColorStop(1, `rgba(${r},${g},${b},0)`);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);
  const tex = new THREE.CanvasTexture(c);
  tex.needsUpdate = true;
  return tex;
}

function getTexture(type: ParticleType): THREE.Texture {
  if (!textures[type]) {
    switch (type) {
      case 'torch':
        textures.torch = createGlowTexture(32, 255, 200, 100, 1);
        break;
      case 'dust_mote':
        textures.dust_mote = createGlowTexture(16, 230, 220, 180, 0.4);
        break;
      case 'firefly':
        textures.firefly = createGlowTexture(16, 180, 255, 180, 1);
        break;
      case 'ember':
        textures.ember = createGlowTexture(8, 255, 180, 80, 1);
        break;
    }
  }
  return textures[type]!;
}

function seededRandom(seed: number): number {
  let s = seed;
  s = (s * 9301 + 49297) % 233280;
  return s / 233280;
}

export class AmbientParticleSystem {
  private scene: THREE.Scene;
  private pointsMap: Map<ParticleType, THREE.Points> = new Map();
  private particlesMap: Map<ParticleType, Particle[]> = new Map();
  private activeSources: ParticleSource[] = [];
  private currentMapId: string | null = null;
  private clock = 0;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
  }

  loadMap(mapId: string, sources: ParticleSource[]) {
    this.unload();
    this.currentMapId = mapId;
    this.activeSources = sources;

    const typeKeys = Object.keys(MAX_PARTICLES) as ParticleType[];
    for (let ti = 0; ti < typeKeys.length; ti++) {
      const type = typeKeys[ti];
      const maxCount = MAX_PARTICLES[type];

      const positions = new Float32Array(maxCount * 3);
      const colors = new Float32Array(maxCount * 3);
      const sizes = new Float32Array(maxCount);
      const alphas = new Float32Array(maxCount);

      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
      geo.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
      geo.setAttribute('alpha', new THREE.BufferAttribute(alphas, 1));

      const mat = new THREE.PointsMaterial({
        size: type === 'ember' ? 0.08 : type === 'dust_mote' ? 0.15 : type === 'torch' ? 0.25 : 0.12,
        map: getTexture(type),
        transparent: true,
        blending: type === 'firefly' || type === 'torch' ? THREE.AdditiveBlending : THREE.NormalBlending,
        depthWrite: false,
        vertexColors: true,
        opacity: 0.8,
        sizeAttenuation: true,
      });

      const points = new THREE.Points(geo, mat);
      points.frustumCulled = true;
      points.visible = false;
      this.scene.add(points);
      this.pointsMap.set(type, points);

      const particles: Particle[] = [];
      for (let i = 0; i < maxCount; i++) {
        particles.push({
          x: 0, y: 0, z: 0,
          vx: 0, vy: 0, vz: 0,
          life: 0, maxLife: 1,
          size: 0.1,
          r: 1, g: 1, b: 1,
          phase: seededRandom(i * 137 + type.charCodeAt(0)) * Math.PI * 2,
        });
      }
      this.particlesMap.set(type, particles);
    }

    this.clock = 0;
    this.spawnInitialParticles();
  }

  unload() {
    const entries = Array.from(this.pointsMap.entries());
    for (let ei = 0; ei < entries.length; ei++) {
      const [type, points] = entries[ei];
      this.scene.remove(points);
      points.geometry.dispose();
      if (!Array.isArray(points.material)) {
        const mat = points.material as THREE.PointsMaterial;
        if (mat.map) mat.map.dispose();
        mat.dispose();
      }
    }
    this.pointsMap.clear();
    this.particlesMap.clear();
    this.activeSources = [];
    this.currentMapId = null;
  }

  update(dt: number) {
    if (this.particlesMap.size === 0) return;
    this.clock += dt;

    const typeKeys = Array.from(this.particlesMap.keys());
    for (let tk = 0; tk < typeKeys.length; tk++) {
      const type = typeKeys[tk];
      const particles = this.particlesMap.get(type)!;
      const points = this.pointsMap.get(type);
      if (!points) continue;

      const posAttr = points.geometry.getAttribute('position') as THREE.BufferAttribute;
      const colAttr = points.geometry.getAttribute('color') as THREE.BufferAttribute;
      const sizeAttr = points.geometry.getAttribute('size') as THREE.BufferAttribute;
      const alphaAttr = points.geometry.getAttribute('alpha') as THREE.BufferAttribute;

      let activeCount = 0;

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.life -= dt;

        if (p.life <= 0) {
          this.respawnParticle(p, type, i);
        }

        if (p.life <= 0) {
          alphaAttr.array[i] = 0;
          continue;
        }

        const lifeRatio = p.life / p.maxLife;
        const fadeIn = Math.min(1, (1 - lifeRatio) * 4);
        const fadeOut = Math.min(1, lifeRatio * 4);
        const alpha = fadeIn * fadeOut;

        let flicker = 1;
        switch (type) {
          case 'torch': {
            flicker = 0.85 + 0.15 * Math.sin(this.clock * 12 + p.phase);
            p.vy += (1.2 - p.vy) * dt * 3;
            p.vx += (Math.sin(this.clock * 0.5 + p.phase) * 0.3 - p.vx) * dt * 4;
            p.vz += (Math.cos(this.clock * 0.7 + p.phase) * 0.3 - p.vz) * dt * 4;
            break;
          }
          case 'dust_mote': {
            p.vx += (Math.sin(this.clock * 0.1 + p.phase * 0.5) * 0.02 - p.vx) * dt;
            p.vz += (Math.cos(this.clock * 0.08 + p.phase * 0.5) * 0.02 - p.vz) * dt;
            p.vy = 0.02;
            break;
          }
          case 'firefly': {
            const wander = Math.sin(this.clock * 0.5 + p.phase) * 0.3;
            p.vx += (wander - p.vx) * dt * 2;
            p.vz += (Math.cos(this.clock * 0.4 + p.phase * 1.3) * 0.3 - p.vz) * dt * 2;
            p.vy += (Math.sin(this.clock * 0.6 + p.phase * 0.7) * 0.2 - p.vy) * dt * 2;
            break;
          }
          case 'ember': {
            p.vy += 0.1 * dt;
            p.vx *= 0.99;
            p.vz *= 0.99;
            break;
          }
        }

        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.z += p.vz * dt;

        const sizeMult =
          type === 'torch' ? 0.6 + 0.4 * flicker :
          type === 'firefly' ? 0.3 + 0.7 * (0.5 + 0.5 * Math.sin(this.clock * 2 + p.phase)) :
          1;

        posAttr.array[i * 3] = p.x;
        posAttr.array[i * 3 + 1] = p.y;
        posAttr.array[i * 3 + 2] = p.z;
        colAttr.array[i * 3] = p.r;
        colAttr.array[i * 3 + 1] = p.g;
        colAttr.array[i * 3 + 2] = p.b;
        sizeAttr.array[i] = p.size * sizeMult;
        alphaAttr.array[i] = alpha * (type === 'dust_mote' ? 0.3 : 1);

        activeCount++;
      }

      posAttr.needsUpdate = true;
      colAttr.needsUpdate = true;
      sizeAttr.needsUpdate = true;
      alphaAttr.needsUpdate = true;

      points.visible = activeCount > 0;
    }
  }

  private spawnInitialParticles() {
    for (let si = 0; si < this.activeSources.length; si++) {
      const source = this.activeSources[si];
      const particles = this.particlesMap.get(source.type);
      if (!particles) continue;
      const count = Math.min(source.count, particles.length);
      let assigned = 0;
      for (let i = 0; i < particles.length && assigned < count; i++) {
        const p = particles[i];
        if (p.life <= 0) {
          this.respawnParticleAtSource(p, source);
          assigned++;
        }
      }
    }
  }

  private respawnParticle(p: Particle, type: ParticleType, index: number) {
    const sources = this.activeSources.filter(s => s.type === type);
    if (sources.length === 0) {
      p.life = 0;
      return;
    }
    const src = sources[Math.floor(seededRandom(index * 73 + this.clock) * sources.length)];
    this.respawnParticleAtSource(p, src);
  }

  private respawnParticleAtSource(p: Particle, src: ParticleSource) {
    const r = seededRandom((p.phase * 1000 + this.clock * 100) % 2147483647);
    const r2 = seededRandom((p.phase * 1000 + this.clock * 100 + 137) % 2147483647);
    const angle = r * Math.PI * 2;
    const dist = Math.sqrt(r2) * Math.min(src.spreadX, src.spreadZ) * 0.5;

    p.x = src.x + Math.cos(angle) * dist;
    p.z = src.z + Math.sin(angle) * dist;
    p.y = src.y;

    switch (src.type) {
      case 'torch':
        p.vy = 0.5 + r * 0.8;
        p.vx = (r - 0.5) * 0.3;
        p.vz = (r2 - 0.5) * 0.3;
        p.maxLife = 0.6 + r * 0.8;
        p.size = 0.15 + r * 0.15;
        p.r = 1.0;
        p.g = 0.5 + r * 0.3;
        p.b = 0.05 + r * 0.1;
        p.phase = r * Math.PI * 2;
        break;
      case 'dust_mote':
        p.vy = 0.01 + r * 0.02;
        p.vx = (r - 0.5) * 0.01;
        p.vz = (r2 - 0.5) * 0.01;
        p.maxLife = 15 + r * 20;
        p.size = 0.08 + r * 0.12;
        p.r = 0.9;
        p.g = 0.85 + r * 0.1;
        p.b = 0.7 + r * 0.2;
        p.phase = r * Math.PI * 2;
        break;
      case 'firefly':
        p.vy = (r - 0.5) * 0.1;
        p.vx = (r - 0.5) * 0.2;
        p.vz = (r2 - 0.5) * 0.2;
        p.maxLife = 4 + r * 6;
        p.size = 0.06 + r * 0.08;
        p.r = 0.4 + r * 0.2;
        p.g = 0.9 + r * 0.1;
        p.b = 0.3 + r * 0.2;
        p.phase = r * Math.PI * 2;
        break;
      case 'ember':
        p.vy = 0.3 + r * 0.5;
        p.vx = (r - 0.5) * 0.2;
        p.vz = (r2 - 0.5) * 0.2;
        p.maxLife = 1.5 + r * 2;
        p.size = 0.04 + r * 0.06;
        p.r = 1.0;
        p.g = 0.5 + r * 0.3;
        p.b = 0.1;
        p.phase = r * Math.PI * 2;
        break;
    }

    p.life = p.maxLife;
  }

  getMapId(): string | null {
    return this.currentMapId;
  }
}

export function getParticleSourcesForMap(mapId: string, mapWidth: number, mapHeight: number): ParticleSource[] {
  const cx = Math.floor(mapWidth / 2);
  const cz = Math.floor(mapHeight / 2);

  const baseSources = getRawSources(mapId);
  for (let i = 0; i < baseSources.length; i++) {
    baseSources[i] = { ...baseSources[i], x: baseSources[i].x + cx, z: baseSources[i].z + cz };
  }
  return baseSources;
}

function getRawSources(mapId: string): ParticleSource[] {
  switch (mapId) {
    case 'prontera_city':
      return [
        { type: 'torch', x: -18, y: 0.8, z: 0, count: 4, spreadX: 0.3, spreadZ: 0.3 },
        { type: 'torch', x: -14, y: 0.8, z: 12, count: 4, spreadX: 0.3, spreadZ: 0.3 },
        { type: 'torch', x: -10, y: 0.8, z: -10, count: 4, spreadX: 0.3, spreadZ: 0.3 },
        { type: 'torch', x: 6, y: 0.8, z: 14, count: 4, spreadX: 0.3, spreadZ: 0.3 },
        { type: 'torch', x: 14, y: 0.8, z: 10, count: 3, spreadX: 0.3, spreadZ: 0.3 },
        { type: 'torch', x: 16, y: 0.8, z: -4, count: 3, spreadX: 0.3, spreadZ: 0.3 },
        { type: 'torch', x: 18, y: 0.8, z: -10, count: 3, spreadX: 0.3, spreadZ: 0.3 },
        { type: 'torch', x: -6, y: 0.8, z: -14, count: 3, spreadX: 0.3, spreadZ: 0.3 },
        { type: 'torch', x: 11, y: 1.0, z: -8, count: 2, spreadX: 0.5, spreadZ: 0.3 },
        { type: 'torch', x: 13, y: 1.0, z: -4, count: 2, spreadX: 0.5, spreadZ: 0.3 },
        { type: 'dust_mote', x: 0, y: 1.0, z: 0, count: 25, spreadX: 20, spreadZ: 20 },
        { type: 'dust_mote', x: -12, y: 0.5, z: -8, count: 15, spreadX: 10, spreadZ: 10 },
        { type: 'dust_mote', x: 12, y: 0.5, z: 6, count: 15, spreadX: 10, spreadZ: 10 },
        { type: 'firefly', x: 4, y: 0.3, z: 10, count: 4, spreadX: 2, spreadZ: 2 },
        { type: 'firefly', x: -4, y: 0.3, z: 10, count: 4, spreadX: 2, spreadZ: 2 },
        { type: 'firefly', x: 6, y: 0.3, z: -10, count: 4, spreadX: 2, spreadZ: 2 },
        { type: 'firefly', x: -6, y: 0.3, z: -10, count: 4, spreadX: 2, spreadZ: 2 },
      ];

    case 'prontera_field':
    case 'campos_de_prontera_oeste':
    case 'pradera_alba':
    case 'laderas_molino':
    case 'colinas_ventosas':
      return [
        { type: 'dust_mote', x: 0, y: 0.5, z: 0, count: 30, spreadX: 30, spreadZ: 30 },
        { type: 'dust_mote', x: 20, y: 0.3, z: -10, count: 15, spreadX: 15, spreadZ: 15 },
        { type: 'firefly', x: 5, y: 0.2, z: 5, count: 8, spreadX: 8, spreadZ: 8 },
        { type: 'firefly', x: -5, y: 0.2, z: -5, count: 7, spreadX: 8, spreadZ: 8 },
      ];

    case 'camino_del_este':
    case 'bosque_de_prontera_sur':
      return [
        { type: 'dust_mote', x: 0, y: 0.5, z: 0, count: 20, spreadX: 25, spreadZ: 25 },
        { type: 'firefly', x: 5, y: 0.5, z: 5, count: 8, spreadX: 10, spreadZ: 10 },
        { type: 'firefly', x: -8, y: 0.5, z: -3, count: 7, spreadX: 8, spreadZ: 8 },
      ];

    case 'bosque_umbrio':
    case 'bosque_umbrio_entrada':
    case 'bosque_umbrio_profundo':
      return [
        { type: 'dust_mote', x: 0, y: 0.8, z: 0, count: 15, spreadX: 25, spreadZ: 25 },
        { type: 'firefly', x: 5, y: 0.5, z: 5, count: 10, spreadX: 10, spreadZ: 10 },
        { type: 'firefly', x: -8, y: 0.5, z: -3, count: 8, spreadX: 8, spreadZ: 8 },
      ];

    case 'training_dungeon':
    case 'cueva_susurros':
    case 'cueva_cristal':
    case 'santuario_olvidado':
    case 'echo_dungeon':
    case 'castillo_olvidado':
      return [
        { type: 'ember', x: 0, y: 0.2, z: 0, count: 15, spreadX: 12, spreadZ: 12 },
        { type: 'ember', x: -5, y: 0.2, z: 5, count: 10, spreadX: 8, spreadZ: 8 },
      ];

    case 'ruinas_ancestrales':
    case 'costa_del_eco':
      return [
        { type: 'dust_mote', x: 0, y: 0.5, z: 0, count: 20, spreadX: 20, spreadZ: 20 },
        { type: 'ember', x: 3, y: 0.3, z: -2, count: 10, spreadX: 10, spreadZ: 10 },
        { type: 'firefly', x: -4, y: 0.4, z: 4, count: 5, spreadX: 6, spreadZ: 6 },
      ];

    default:
      return [
        { type: 'dust_mote', x: 0, y: 0.5, z: 0, count: 15, spreadX: 20, spreadZ: 20 },
      ];
  }
}
