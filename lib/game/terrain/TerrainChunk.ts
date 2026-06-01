import * as THREE from 'three';
import { TerrainChunkData, BiomeType } from '../types';
import { WeightMapShader } from './WeightMapShader';
import { TextureCatalog } from './TextureCatalog';

const GRID_RES = 33;
const CHUNK_SIZE = 32;
const SEGMENTS = GRID_RES - 1;
const HALF = CHUNK_SIZE / 2;

const BIOME_HEIGHT: Record<BiomeType, { amplitude: number; roughness: number }> = {
  grassland: { amplitude: 1.5, roughness: 0.5 },
  forest:    { amplitude: 2.5, roughness: 0.7 },
  desert:    { amplitude: 0.8, roughness: 0.3 },
  swamp:     { amplitude: 0.6, roughness: 0.4 },
  volcanic:  { amplitude: 4.0, roughness: 1.2 },
  snow:      { amplitude: 2.0, roughness: 0.6 },
  dungeon:   { amplitude: 0.5, roughness: 0.3 },
};

export class TerrainChunk {
  private mesh: THREE.Mesh | null = null;
  private waterMesh: THREE.Mesh | null = null;
  private scene: THREE.Scene;
  private cx = 0;
  private cz = 0;
  private biome: BiomeType = 'grassland';
  private visible = true;
  private waterHeight = -0.15;

  private weightMap: THREE.DataTexture | null = null;
  private shaderMat: THREE.ShaderMaterial | null = null;

  private heightGrid: Float32Array = new Float32Array(GRID_RES * GRID_RES);
  private worldOriginX = 0;
  private worldOriginZ = 0;

  public collisionCells: Array<{ x: number; z: number; radius: number }> = [];

  constructor(scene: THREE.Scene) {
    this.scene = scene;
  }

  async build(data: TerrainChunkData): Promise<void> {
    this.cx = data.cx;
    this.cz = data.cz;
    this.biome = data.biome;
    this.worldOriginX = data.cx * CHUNK_SIZE;
    this.worldOriginZ = data.cz * CHUNK_SIZE;

    this.clear();

    this.weightMap = WeightMapShader.generateWeightMap(data.biome);

    let atlas: THREE.Texture;
    try {
      atlas = await TextureCatalog.get().loadAtlas(data.tileAtlas);
    } catch {
      atlas = this.createFallbackAtlas();
    }

    const paletteKey = this.getPaletteKey(data.biome);
    const palette = TextureCatalog.get().getPaletteColors(paletteKey);

    const geo = this.buildGeometry();

    const worldX = this.worldOriginX;
    const worldZ = this.worldOriginZ;

    this.shaderMat = WeightMapShader.createMaterial(
      this.weightMap,
      atlas,
      palette,
      [worldX, worldZ]
    );

    this.mesh = new THREE.Mesh(geo, this.shaderMat);
    this.mesh.position.set(worldX + HALF, 0, worldZ + HALF);
    this.mesh.visible = this.visible;

    this.scene.add(this.mesh);

    this.generateCollision();

    if (this.hasWater()) {
      this.createWater(data);
    }
  }

  private buildGeometry(): THREE.BufferGeometry {
    const geo = new THREE.PlaneGeometry(CHUNK_SIZE, CHUNK_SIZE, SEGMENTS, SEGMENTS);
    geo.rotateX(-Math.PI / 2);

    const pos = geo.attributes.position;
    this.heightGrid = this.generateHeightGrid();

    for (let iz = 0; iz < GRID_RES; iz++) {
      for (let ix = 0; ix < GRID_RES; ix++) {
        const idx = iz * GRID_RES + ix;
        const vIdx = iz * GRID_RES + ix;
        pos.setY(vIdx, this.heightGrid[idx]);
      }
    }
    pos.needsUpdate = true;
    geo.computeVertexNormals();

    return geo;
  }

  private generateHeightGrid(): Float32Array {
    const grid = new Float32Array(GRID_RES * GRID_RES);
    const cfg = BIOME_HEIGHT[this.biome] || BIOME_HEIGHT.grassland;
    const seed = 42;

    for (let iz = 0; iz < GRID_RES; iz++) {
      for (let ix = 0; ix < GRID_RES; ix++) {
        const wx = this.worldOriginX + ix;
        const wz = this.worldOriginZ + iz;
        grid[iz * GRID_RES + ix] = sampleTerrainHeight(wx, wz, cfg.amplitude, cfg.roughness, seed);
      }
    }
    return grid;
  }

  private hasWater(): boolean {
    return this.biome === 'grassland' || this.biome === 'forest' || this.biome === 'swamp';
  }

  private getWaterBaseHeight(): number {
    const heights: number[] = [];
    const step = 4;
    for (let iz = 0; iz < GRID_RES; iz += step) {
      for (let ix = 0; ix < GRID_RES; ix += step) {
        heights.push(this.heightGrid[iz * GRID_RES + ix]);
      }
    }
    heights.sort((a, b) => a - b);
    return heights[Math.floor(heights.length * 0.3)];
  }

  private createWater(data: TerrainChunkData) {
    const geo = new THREE.PlaneGeometry(CHUNK_SIZE, CHUNK_SIZE, 1, 1);
    geo.rotateX(-Math.PI / 2);

    const baseY = this.getWaterBaseHeight() + this.waterHeight;

    const waterColor = this.getWaterColor();
    const mat = new THREE.MeshBasicMaterial({
      color: waterColor,
      transparent: true,
      opacity: 0.45,
      depthWrite: false,
    });

    this.waterMesh = new THREE.Mesh(geo, mat);
    const worldX = this.worldOriginX;
    const worldZ = this.worldOriginZ;
    this.waterMesh.position.set(worldX + HALF, baseY, worldZ + HALF);
    this.waterMesh.renderOrder = 1;
    this.waterMesh.visible = this.visible;
    this.scene.add(this.waterMesh);
  }

  private getWaterColor(): number {
    switch (this.biome) {
      case 'swamp': return 0x2d4a1a;
      case 'forest': return 0x1a4a6a;
      default: return 0x1a5a8a;
    }
  }

  private generateCollision() {
    this.collisionCells = [];
    const cfg = BIOME_HEIGHT[this.biome] || BIOME_HEIGHT.grassland;
    const threshold = cfg.amplitude * 0.6;
    const rng = mulberry32(hash(this.cx * 1000 + this.cz));

    for (let i = 0; i < 8; i++) {
      const x = this.worldOriginX + rng() * CHUNK_SIZE;
      const z = this.worldOriginZ + rng() * CHUNK_SIZE;
      const h = this.getHeightAt(x, z);
      if (h > threshold) {
        this.collisionCells.push({
          x, z,
          radius: 0.4 + rng() * 0.6,
        });
      }
    }
  }

  getWorldCenter(): [number, number] {
    return [
      this.worldOriginX + HALF,
      this.worldOriginZ + HALF,
    ];
  }

  getHeightAt(worldX: number, worldZ: number): number {
    const localX = worldX - this.worldOriginX;
    const localZ = worldZ - this.worldOriginZ;

    if (localX < 0 || localX > CHUNK_SIZE || localZ < 0 || localZ > CHUNK_SIZE) {
      return -Infinity;
    }
    const gi = localX;
    const gj = localZ;
    const ix = Math.min(Math.floor(gi), SEGMENTS);
    const iz = Math.min(Math.floor(gj), SEGMENTS);
    const fx = gi - ix;
    const fz = gj - iz;

    const sx = fx * fx * (3 - 2 * fx);
    const sz = fz * fz * (3 - 2 * fz);

    const i00 = iz * GRID_RES + ix;
    const i10 = iz * GRID_RES + Math.min(ix + 1, SEGMENTS);
    const i01 = Math.min(iz + 1, SEGMENTS) * GRID_RES + ix;
    const i11 = Math.min(iz + 1, SEGMENTS) * GRID_RES + Math.min(ix + 1, SEGMENTS);

    const h00 = this.heightGrid[i00];
    const h10 = this.heightGrid[i10];
    const h01 = this.heightGrid[i01];
    const h11 = this.heightGrid[i11];

    const h0 = h00 * (1 - sx) + h10 * sx;
    const h1 = h01 * (1 - sx) + h11 * sx;
    return h0 * (1 - sz) + h1 * sz;
  }

  getCollisionCells(): Array<{ x: number; z: number; radius: number }> {
    return this.collisionCells;
  }

  setVisible(v: boolean) {
    this.visible = v;
    if (this.mesh) {
      this.mesh.visible = v;
    }
    if (this.waterMesh) {
      this.waterMesh.visible = v;
    }
  }

  updateWater(time: number) {
    if (!this.waterMesh || !this.waterMesh.visible) return;
    const wave = Math.sin(time * 0.8 + this.cx * 3.0 + this.cz * 5.0) * 0.03;
    this.waterMesh.position.y = this.waterMesh.position.y + wave * 0.05;
    const baseY = this.getWaterBaseHeight() + this.waterHeight;
    this.waterMesh.position.y += (baseY + wave - this.waterMesh.position.y) * 0.02;
  }

  clear() {
    if (this.mesh) {
      this.scene.remove(this.mesh);
      this.mesh.geometry.dispose();
      if (this.shaderMat) {
        this.shaderMat.dispose();
        this.shaderMat = null;
      }
      this.mesh = null;
    }
    if (this.waterMesh) {
      this.scene.remove(this.waterMesh);
      this.waterMesh.geometry.dispose();
      (this.waterMesh.material as THREE.Material).dispose();
      this.waterMesh = null;
    }
    if (this.weightMap) {
      this.weightMap.dispose();
      this.weightMap = null;
    }
    this.collisionCells = [];
  }

  dispose() {
    this.clear();
  }

  private getPaletteKey(biome: BiomeType): string {
    const map: Record<BiomeType, string> = {
      grassland: 'summer',
      forest: 'summer',
      desert: 'autumn',
      swamp: 'dungeon',
      volcanic: 'autumn',
      snow: 'winter',
      dungeon: 'dungeon',
    };
    return map[biome] || 'summer';
  }

  private createFallbackAtlas(): THREE.Texture {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d')!;

    const tiles = [
      { color: '#2d5a27', label: 'pasto' },
      { color: '#3a7a33', label: 'pasto2' },
      { color: '#5c4033', label: 'tierra' },
      { color: '#7a5a4a', label: 'tierra2' },
      { color: '#6b7280', label: 'piedra' },
      { color: '#4a5568', label: 'piedra2' },
      { color: '#8b7355', label: 'camino' },
      { color: '#a0896a', label: 'camino2' },
      { color: '#1a452a', label: 'bosque' },
      { color: '#245a3a', label: 'bosque2' },
      { color: '#3d3124', label: 'desierto' },
      { color: '#5a4a3a', label: 'desierto2' },
      { color: '#1e3a5f', label: 'agua' },
      { color: '#2a4a7a', label: 'agua2' },
      { color: '#4a3728', label: 'ceniza' },
      { color: '#6a4a3a', label: 'lava' },
    ];

    const tileSize = 64;
    for (let i = 0; i < 16; i++) {
      const tx = i % 4;
      const ty = Math.floor(i / 4);
      ctx.fillStyle = tiles[i]?.color || '#808080';
      ctx.fillRect(tx * tileSize, ty * tileSize, tileSize, tileSize);
      ctx.strokeStyle = '#00000020';
      ctx.lineWidth = 1;
      ctx.strokeRect(tx * tileSize, ty * tileSize, tileSize, tileSize);
      const imageData = ctx.getImageData(tx * tileSize, ty * tileSize, tileSize, tileSize);
      const pixels = imageData.data;
      for (let j = 0; j < pixels.length; j += 4) {
        const noise = (Math.random() - 0.5) * 20;
        pixels[j] = Math.max(0, Math.min(255, pixels[j] + noise));
        pixels[j + 1] = Math.max(0, Math.min(255, pixels[j + 1] + noise));
        pixels[j + 2] = Math.max(0, Math.min(255, pixels[j + 2] + noise));
      }
      ctx.putImageData(imageData, tx * tileSize, ty * tileSize);
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.minFilter = THREE.LinearMipmapLinearFilter;
    tex.magFilter = THREE.LinearFilter;
    tex.generateMipmaps = true;
    tex.needsUpdate = true;
    return tex;
  }
}

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

function sampleTerrainHeight(wx: number, wz: number, amplitude: number, roughness: number, seed: number): number {
  const baseFreq = 0.04;
  const octaves = 4;
  const raw = fbm(wx * baseFreq, wz * baseFreq, seed, octaves);
  return raw * amplitude * roughness;
}

function mulberry32(seed: number): () => number {
  return () => {
    seed |= 0; seed = seed + 0x6D2B79F5 | 0;
    let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

function hash(n: number): number {
  n = ((n >> 16) ^ n) * 0x45d9f3b;
  n = ((n >> 16) ^ n) * 0x45d9f3b;
  n = (n >> 16) ^ n;
  return n;
}
