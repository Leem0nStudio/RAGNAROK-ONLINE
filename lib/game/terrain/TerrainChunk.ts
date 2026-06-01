import * as THREE from 'three';
import { TerrainChunkData, BiomeType } from '../types';
import { WeightMapShader } from './WeightMapShader';
import { TextureCatalog } from './TextureCatalog';

export class TerrainChunk {
  private mesh: THREE.Mesh | null = null;
  private waterMesh: THREE.Mesh | null = null;
  private scene: THREE.Scene;
  private cx = 0;
  private cz = 0;
  private biome: BiomeType = 'grassland';
  private size = 32;
  private visible = true;
  private waterHeight = -0.15;

  private weightMap: THREE.DataTexture | null = null;
  private shaderMat: THREE.ShaderMaterial | null = null;

  // Collision data
  public collisionCells: Array<{ x: number; z: number; radius: number }> = [];

  constructor(scene: THREE.Scene) {
    this.scene = scene;
  }

  async build(data: TerrainChunkData): Promise<void> {
    this.cx = data.cx;
    this.cz = data.cz;
    this.biome = data.biome;

    this.clear();

    // Generate the weight map texture procedurally
    this.weightMap = WeightMapShader.generateWeightMap(data.biome);

    // Load atlas texture (use fallback generated texture if not available)
    let atlas: THREE.Texture;
    try {
      atlas = await TextureCatalog.get().loadAtlas(data.tileAtlas);
    } catch {
      atlas = this.createFallbackAtlas();
    }

    // Get palette colors for biome
    const paletteKey = this.getPaletteKey(data.biome);
    const palette = TextureCatalog.get().getPaletteColors(paletteKey);

    // Build geometry
    const geo = new THREE.PlaneGeometry(this.size, this.size);
    geo.rotateX(-Math.PI / 2);

    // Compute world position
    const worldX = data.cx * this.size;
    const worldZ = data.cz * this.size;

    // Create shader material
    this.shaderMat = WeightMapShader.createMaterial(
      this.weightMap,
      atlas,
      palette,
      [worldX, worldZ]
    );

    this.mesh = new THREE.Mesh(geo, this.shaderMat);
    this.mesh.position.set(worldX + this.size / 2, 0, worldZ + this.size / 2);
    this.mesh.visible = this.visible;

    this.scene.add(this.mesh);

    // Generate collision data
    this.generateCollision();

    // Add water if biome supports it
    if (this.hasWater()) {
      this.createWater(data);
    }
  }

  private hasWater(): boolean {
    return this.biome === 'grassland' || this.biome === 'forest' || this.biome === 'swamp';
  }

  private createWater(data: TerrainChunkData) {
    const geo = new THREE.PlaneGeometry(this.size, this.size);
    geo.rotateX(-Math.PI / 2);

    const waterColor = this.getWaterColor();
    const mat = new THREE.MeshBasicMaterial({
      color: waterColor,
      transparent: true,
      opacity: 0.45,
      depthWrite: false,
    });

    this.waterMesh = new THREE.Mesh(geo, mat);
    const worldX = data.cx * this.size;
    const worldZ = data.cz * this.size;
    this.waterMesh.position.set(worldX + this.size / 2, this.waterHeight, worldZ + this.size / 2);
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
    const rng = mulberry32(hash(this.cx * 1000 + this.cz));

    for (let i = 0; i < 5; i++) {
      this.collisionCells.push({
        x: this.cx * this.size + rng() * this.size,
        z: this.cz * this.size + rng() * this.size,
        radius: 0.3 + rng() * 0.5,
      });
    }
  }

  getWorldCenter(): [number, number] {
    return [
      this.cx * this.size + this.size / 2,
      this.cz * this.size + this.size / 2,
    ];
  }

  getHeightAt(_worldX: number, _worldZ: number): number {
    return 0;
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
    this.waterMesh.position.y = this.waterHeight + wave;
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

      // Add noise
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
