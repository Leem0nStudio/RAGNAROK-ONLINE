import * as THREE from 'three';

const GRID_RES = 33;
const SEGMENTS = GRID_RES - 1;

interface HeightConfig {
  amplitude: number;
  roughness: number;
}

const BIOME_HEIGHTS: Record<string, HeightConfig> = {
  grassland: { amplitude: 1.5, roughness: 0.5 },
  forest:    { amplitude: 2.5, roughness: 0.7 },
  desert:    { amplitude: 0.8, roughness: 0.3 },
  swamp:     { amplitude: 0.6, roughness: 0.4 },
  volcanic:  { amplitude: 4.0, roughness: 1.2 },
  snow:      { amplitude: 2.0, roughness: 0.6 },
  dungeon:   { amplitude: 0.5, roughness: 0.3 },
};

const PRESET_TO_BIOME: Record<string, string> = {
  prontera_city: 'grassland',
  prontera_fields: 'grassland',
  camino_este: 'forest',
  training_dungeon: 'dungeon',
  bosque_umbrio_entrada: 'forest',
  bosque_umbrio_profundo: 'forest',
  ruinas_ancestrales: 'grassland',
  santuario_olvidado: 'dungeon',
  echo_dungeon: 'dungeon',
};

function hash2D(x: number, z: number, seed: number): number {
  let h = (x * 374761393 + z * 668265263 + seed) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  h = h ^ (h >>> 16);
  return (h & 0x7fffffff) / 0x7fffffff;
}

function smoothNoise(x: number, z: number, seed: number): number {
  const ix = Math.floor(x);
  const iz = Math.floor(z);
  const fx = x - ix;
  const fz = z - iz;
  const sx = fx * fx * (3 - 2 * fx);
  const sz = fz * fz * (3 - 2 * fz);
  const v00 = hash2D(ix, iz, seed);
  const v10 = hash2D(ix + 1, iz, seed);
  const v01 = hash2D(ix, iz + 1, seed);
  const v11 = hash2D(ix + 1, iz + 1, seed);
  const v0 = v00 * (1 - sx) + v10 * sx;
  const v1 = v01 * (1 - sx) + v11 * sx;
  return v0 * (1 - sz) + v1 * sz;
}

function fbm(x: number, z: number, seed: number, octaves: number): number {
  let value = 0;
  let amplitude = 0.5;
  let frequency = 1;
  for (let i = 0; i < octaves; i++) {
    const n = smoothNoise(x * frequency, z * frequency, seed + i * 137) * 2 - 1;
    value += amplitude * n;
    amplitude *= 0.5;
    frequency *= 2;
  }
  return value;
}

function sampleHeight(wx: number, wz: number, amp: number, rough: number, seed: number): number {
  const raw = fbm(wx * 0.04, wz * 0.04, seed, 4);
  return raw * amp * rough;
}

export class MapTerrain {
  private mesh: THREE.Mesh | null = null;
  private waterMesh: THREE.Mesh | null = null;
  private scene: THREE.Scene;
  private heightGrid: Float32Array = new Float32Array(0);
  private gridResX = 0;
  private gridResZ = 0;
  private originX = 0;
  private originZ = 0;
  private cellSizeX = 1;
  private cellSizeZ = 1;
  private biomeKey = 'grassland';
  private waterHeightOffset = -0.15;

  public collisionCells: Array<{ x: number; z: number; radius: number }> = [];

  constructor(scene: THREE.Scene) {
    this.scene = scene;
  }

  build(
    xMin: number, xMax: number,
    zMin: number, zMax: number,
    lightingPreset: string
  ): void {
    this.clear();

    const sizeX = xMax - xMin;
    const sizeZ = zMax - zMin;
    this.originX = xMin;
    this.originZ = zMin;
    this.biomeKey = PRESET_TO_BIOME[lightingPreset] || 'grassland';
    const cfg = BIOME_HEIGHTS[this.biomeKey] || BIOME_HEIGHTS.grassland;

    const resX = Math.max(GRID_RES, Math.ceil(sizeX) + 1);
    const resZ = Math.max(GRID_RES, Math.ceil(sizeZ) + 1);
    this.gridResX = resX;
    this.gridResZ = resZ;
    this.cellSizeX = sizeX / (resX - 1);
    this.cellSizeZ = sizeZ / (resZ - 1);

    const geo = new THREE.PlaneGeometry(sizeX, sizeZ, resX - 1, resZ - 1);
    geo.rotateX(-Math.PI / 2);

    const pos = geo.attributes.position;
    this.heightGrid = new Float32Array(resX * resZ);

    for (let iz = 0; iz < resZ; iz++) {
      for (let ix = 0; ix < resX; ix++) {
        const wx = xMin + ix * this.cellSizeX;
        const wz = zMin + iz * this.cellSizeZ;
        const h = sampleHeight(wx, wz, cfg.amplitude, cfg.roughness, 42);
        const idx = iz * resX + ix;
        this.heightGrid[idx] = h;
        pos.setY(idx, h);
      }
    }
    pos.needsUpdate = true;
    geo.computeVertexNormals();

    const mat = new THREE.MeshStandardMaterial({
      color: this.getTerrainColor(),
      roughness: 0.9,
      flatShading: true,
    });

    this.mesh = new THREE.Mesh(geo, mat);
    this.mesh.position.set(xMin + sizeX / 2, 0, zMin + sizeZ / 2);
    this.mesh.receiveShadow = true;
    this.scene.add(this.mesh);

    this.generateCollision();
    this.createWater(xMin, xMax, zMin, zMax);
  }

  private getTerrainColor(): number {
    switch (this.biomeKey) {
      case 'grassland': return 0x4a8c3f;
      case 'forest': return 0x2d5a27;
      case 'desert': return 0x8a7a5a;
      case 'swamp': return 0x3a5a2a;
      case 'volcanic': return 0x4a3728;
      case 'snow': return 0xc8d0d8;
      case 'dungeon': return 0x3a3a4a;
      default: return 0x4a8c3f;
    }
  }

  private hasWater(): boolean {
    return this.biomeKey === 'grassland' || this.biomeKey === 'forest' || this.biomeKey === 'swamp';
  }

  private getWaterBaseHeight(): number {
    if (this.heightGrid.length === 0) return -0.15;
    const step = 4;
    const heights: number[] = [];
    for (let iz = 0; iz < this.gridResZ; iz += step) {
      for (let ix = 0; ix < this.gridResX; ix += step) {
        heights.push(this.heightGrid[iz * this.gridResX + ix]);
      }
    }
    heights.sort((a, b) => a - b);
    return heights[Math.floor(heights.length * 0.3)];
  }

  private getWaterColor(): number {
    switch (this.biomeKey) {
      case 'swamp': return 0x2d4a1a;
      case 'forest': return 0x1a4a6a;
      default: return 0x1a5a8a;
    }
  }

  private createWater(xMin: number, xMax: number, zMin: number, zMax: number): void {
    if (!this.hasWater()) return;
    const sizeX = xMax - xMin;
    const sizeZ = zMax - zMin;
    const waterGeo = new THREE.PlaneGeometry(sizeX, sizeZ, 1, 1);
    waterGeo.rotateX(-Math.PI / 2);
    const baseY = this.getWaterBaseHeight() + this.waterHeightOffset;
    const waterMat = new THREE.MeshBasicMaterial({
      color: this.getWaterColor(),
      transparent: true,
      opacity: 0.45,
      depthWrite: false,
    });
    this.waterMesh = new THREE.Mesh(waterGeo, waterMat);
    this.waterMesh.position.set(xMin + sizeX / 2, baseY, zMin + sizeZ / 2);
    this.waterMesh.renderOrder = 1;
    this.scene.add(this.waterMesh);
  }

  private generateCollision(): void {
    this.collisionCells = [];
    const cfg = BIOME_HEIGHTS[this.biomeKey] || BIOME_HEIGHTS.grassland;
    const threshold = cfg.amplitude * 0.6;
    const rng = mulberry32(42);

    for (let i = 0; i < 8; i++) {
      const wx = this.originX + rng() * (this.gridResX - 1) * this.cellSizeX;
      const wz = this.originZ + rng() * (this.gridResZ - 1) * this.cellSizeZ;
      const h = this.getHeightAt(wx, wz);
      if (h > threshold) {
        this.collisionCells.push({
          x: wx, z: wz,
          radius: 0.4 + rng() * 0.6,
        });
      }
    }
  }

  getHeightAt(worldX: number, worldZ: number): number {
    const resX = this.gridResX;
    const resZ = this.gridResZ;
    if (resX === 0 || resZ === 0) return 0;

    const localX = worldX - this.originX;
    const localZ = worldZ - this.originZ;
    const maxLocalX = (resX - 1) * this.cellSizeX;
    const maxLocalZ = (resZ - 1) * this.cellSizeZ;

    if (localX < 0 || localX > maxLocalX || localZ < 0 || localZ > maxLocalZ) {
      return 0;
    }

    const ix = Math.min(Math.floor(localX / this.cellSizeX), resX - 2);
    const iz = Math.min(Math.floor(localZ / this.cellSizeZ), resZ - 2);
    const fx = (localX - ix * this.cellSizeX) / this.cellSizeX;
    const fz = (localZ - iz * this.cellSizeZ) / this.cellSizeZ;
    const sx = fx * fx * (3 - 2 * fx);
    const sz = fz * fz * (3 - 2 * fz);

    const i00 = iz * resX + ix;
    const i10 = iz * resX + (ix + 1);
    const i01 = (iz + 1) * resX + ix;
    const i11 = (iz + 1) * resX + (ix + 1);

    const h00 = this.heightGrid[i00];
    const h10 = this.heightGrid[i10];
    const h01 = this.heightGrid[i01];
    const h11 = this.heightGrid[i11];

    const h0 = h00 * (1 - sx) + h10 * sx;
    const h1 = h01 * (1 - sx) + h11 * sx;
    return h0 * (1 - sz) + h1 * sz;
  }

  updateWater(time: number): void {
    if (!this.waterMesh || !this.waterMesh.visible) return;
    const wave = Math.sin(time * 0.8) * 0.03;
    this.waterMesh.position.y += wave * 0.05;
    const baseY = this.getWaterBaseHeight() + this.waterHeightOffset;
    this.waterMesh.position.y += (baseY + wave - this.waterMesh.position.y) * 0.02;
  }

  clear(): void {
    if (this.mesh) {
      this.scene.remove(this.mesh);
      this.mesh.geometry.dispose();
      (this.mesh.material as THREE.Material).dispose();
      this.mesh = null;
    }
    if (this.waterMesh) {
      this.scene.remove(this.waterMesh);
      this.waterMesh.geometry.dispose();
      (this.waterMesh.material as THREE.Material).dispose();
      this.waterMesh = null;
    }
    this.heightGrid = new Float32Array(0);
    this.gridResX = 0;
    this.gridResZ = 0;
    this.collisionCells = [];
  }

  dispose(): void {
    this.clear();
  }
}

function mulberry32(seed: number): () => number {
  return () => {
    seed |= 0; seed = seed + 0x6D2B79F5 | 0;
    let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}
