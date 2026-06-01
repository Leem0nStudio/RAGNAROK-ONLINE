import * as THREE from 'three';

interface AtlasEntry {
  texture: THREE.Texture;
  refCount: number;
}

interface PaletteEntry {
  lut: THREE.DataTexture;
  refCount: number;
}

export class TextureCatalog {
  private static instance: TextureCatalog;
  private atlases: Map<string, AtlasEntry> = new Map();
  private palettes: Map<string, PaletteEntry> = new Map();
  private pendingLoads: Map<string, Promise<THREE.Texture>> = new Map();
  private lru: string[] = [];
  private maxAtlases = 8;

  private constructor() {}

  static get(): TextureCatalog {
    if (!TextureCatalog.instance) {
      TextureCatalog.instance = new TextureCatalog();
    }
    return TextureCatalog.instance;
  }

  async loadAtlas(url: string, paletteKey?: string): Promise<THREE.Texture> {
    const key = paletteKey ? `${url}::${paletteKey}` : url;
    if (this.atlases.has(key)) {
      this.touch(key);
      return this.atlases.get(key)!.texture;
    }

    if (this.pendingLoads.has(key)) {
      return this.pendingLoads.get(key)!;
    }

    const loadPromise = this.fetchDecode(url, key);
    this.pendingLoads.set(key, loadPromise);
    const tex = await loadPromise;
    this.pendingLoads.delete(key);

    this.evictIfNeeded();
    this.atlases.set(key, { texture: tex, refCount: 1 });
    this.lru.push(key);
    return tex;
  }

  release(url: string, paletteKey?: string) {
    const key = paletteKey ? `${url}::${paletteKey}` : url;
    const entry = this.atlases.get(key);
    if (!entry) return;
    entry.refCount--;
    if (entry.refCount <= 0) {
      entry.texture.dispose();
      this.atlases.delete(key);
      const idx = this.lru.indexOf(key);
      if (idx >= 0) this.lru.splice(idx, 1);
    }
  }

  getPaletteLUT(key: string): THREE.DataTexture {
    const existing = this.palettes.get(key);
    if (existing) return existing.lut;

    const colors = this.generatePalette(key);
    const data = new Uint8Array(32 * 32 * 4);
    for (let i = 0; i < 1024; i++) {
      const c = colors[i % colors.length];
      data[i * 4] = (c >> 24) & 0xff;
      data[i * 4 + 1] = (c >> 16) & 0xff;
      data[i * 4 + 2] = (c >> 8) & 0xff;
      data[i * 4 + 3] = c & 0xff;
    }
    const lut = new THREE.DataTexture(data, 32, 32, THREE.RGBAFormat);
    lut.needsUpdate = true;
    lut.minFilter = THREE.NearestFilter;
    lut.magFilter = THREE.NearestFilter;
    this.palettes.set(key, { lut, refCount: 1 });
    return lut;
  }

  getPaletteColors(key: string): number[] {
    return this.generatePalette(key);
  }

  releasePalette(key: string) {
    const entry = this.palettes.get(key);
    if (!entry) return;
    entry.refCount--;
    if (entry.refCount <= 0) {
      entry.lut.dispose();
      this.palettes.delete(key);
    }
  }

  dispose() {
    this.atlases.forEach(e => e.texture.dispose());
    this.atlases.clear();
    this.palettes.forEach(e => e.lut.dispose());
    this.palettes.clear();
    this.lru = [];
    this.pendingLoads.clear();
  }

  private async fetchDecode(url: string, _key: string): Promise<THREE.Texture> {
    const resp = await fetch(url);
    const blob = await resp.blob();
    const bitmap = await createImageBitmap(blob, { colorSpaceConversion: 'none' });
    const tex = new THREE.CanvasTexture(bitmap);
    tex.minFilter = THREE.LinearMipmapLinearFilter;
    tex.magFilter = THREE.LinearFilter;
    tex.generateMipmaps = true;
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.anisotropy = 4;
    tex.needsUpdate = true;
    return tex;
  }

  private touch(key: string) {
    const idx = this.lru.indexOf(key);
    if (idx >= 0) {
      this.lru.splice(idx, 1);
      this.lru.push(key);
    }
  }

  private evictIfNeeded() {
    while (this.atlases.size >= this.maxAtlases && this.lru.length > 0) {
      const oldest = this.lru.shift();
      if (!oldest) break;
      const entry = this.atlases.get(oldest);
      if (entry && entry.refCount <= 0) {
        entry.texture.dispose();
        this.atlases.delete(oldest);
      }
    }
  }

  private generatePalette(key: string): number[] {
    const palettes: Record<string, number[]> = {
      summer: [0xff4488ff, 0x44ff88ff, 0x8888ffff, 0xffaa44ff, 0x44ffffff],
      autumn: [0xcc4422ff, 0xdd8833ff, 0xeecc44ff, 0x883311ff, 0xaa5533ff],
      winter: [0xddeeffff, 0xaaccffff, 0x88aaffff, 0xccddffff, 0xeeffffff],
      night: [0x112244ff, 0x223366ff, 0x334488ff, 0x112233ff, 0x001122ff],
      dungeon: [0x332211ff, 0x443322ff, 0x221100ff, 0x554433ff, 0x443322ff],
      // Paletas de la región inicial — Amanecer Tardío
      pradera: [0xffe8c0ff, 0xc0d8a0ff, 0x7ab864ff, 0x4a8c3fff, 0x2d5a27ff],
      llanura: [0xf0e0b0ff, 0xb0c890ff, 0x8aba5aff, 0x6a9a4aff, 0x3a6a2aff],
      ecoles: [0xe8d0a0ff, 0xa0b880ff, 0xaaba5aff, 0x7a8a3aff, 0x4a5a1aff],
      laderas: [0xd8c090ff, 0x90a070ff, 0xbaaa5aff, 0x8a7a3aff, 0x5a4a1aff],
      claro: [0xc0a880ff, 0x708060ff, 0x8a6a3aff, 0x6a5a2aff, 0x3a2a10ff],
      prontera: [0xf0e8d8ff, 0xc8d0d0ff, 0x8b9bb4ff, 0x4a525aff, 0x2e3440ff],
    };
    return palettes[key] || palettes.summer;
  }
}
