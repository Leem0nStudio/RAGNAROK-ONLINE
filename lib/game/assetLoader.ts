import * as THREE from 'three';

export interface AssetManifestEntry {
  key: string;
  path: string;
  phase: 'rocks' | 'trees' | 'props' | 'landmarks';
}

export type AssetManifest = AssetManifestEntry[];

export class AssetLoader {
  private static instance: AssetLoader;
  private geometryCache = new Map<string, THREE.BufferGeometry>();
  private _progress = 0;
  private _total = 0;
  private _loaded = 0;
  private _isReady = false;
  private _manifest: AssetManifest = [];

  static getInstance(): AssetLoader {
    if (!AssetLoader.instance) {
      AssetLoader.instance = new AssetLoader();
    }
    return AssetLoader.instance;
  }

  get isReady() { return this._isReady; }
  get progress() { return this._total === 0 ? 1 : this._loaded / this._total; }
  get manifest() { return this._manifest; }

  async loadManifest(): Promise<AssetManifest> {
    try {
      const resp = await fetch('/assets/models/manifest.json');
      if (!resp.ok) return [];
      this._manifest = await resp.json();
    } catch {
      this._manifest = [];
    }
    return this._manifest;
  }

  async preloadAll(): Promise<void> {
    if (this._isReady) return;

    const manifest = await this.loadManifest();
    if (manifest.length === 0) {
      this._isReady = true;
      return;
    }

    const { GLTFLoader } = await import('three/examples/jsm/loaders/GLTFLoader.js');
    const { FBXLoader } = await import('three/examples/jsm/loaders/FBXLoader.js');
    const gltfLoader = new GLTFLoader();
    const fbxLoader = new FBXLoader();

    this._total = manifest.length;
    this._loaded = 0;

    await Promise.allSettled(
      manifest.map(entry =>
        new Promise<void>(resolve => {
          const isFBX = entry.path.toLowerCase().endsWith('.fbx');
          const loadFn = isFBX
            ? (cb: (obj: THREE.Group) => void, onError: () => void) => {
                fbxLoader.load(entry.path, cb, undefined, onError);
              }
            : (cb: (gltf: any) => void, onError: () => void) => {
                gltfLoader.load(entry.path, cb, undefined, onError);
              };

          loadFn(
            (result: any) => {
              const meshes: THREE.BufferGeometry[] = [];
              const root = isFBX ? (result as THREE.Group) : (result as any).scene;
              root.traverse((child: any) => {
                if (child.isMesh) {
                  const geo = child.geometry.clone();
                  geo.applyMatrix4(child.matrixWorld);
                  meshes.push(geo);
                }
              });
              if (meshes.length > 0) {
                const finalGeo = meshes.length === 1
                  ? meshes[0]
                  : this.mergeGeometries(meshes);
                finalGeo.computeVertexNormals();
                this.geometryCache.set(entry.key, finalGeo);
              }
              this._loaded++;
              resolve();
            },
            () => {
              this._loaded++;
              resolve();
            }
          );
        })
      )
    );

    this._isReady = true;
  }

  getGeometry(key: string): THREE.BufferGeometry | undefined {
    return this.geometryCache.get(key);
  }

  hasGeometry(key: string): boolean {
    return this.geometryCache.has(key);
  }

  private mergeGeometries(geos: THREE.BufferGeometry[]): THREE.BufferGeometry {
    if (geos.length === 0) return new THREE.BufferGeometry();
    if (geos.length === 1) return geos[0];

    const merged = new THREE.BufferGeometry();

    let totalVerts = 0;
    let totalIdx = 0;
    for (const g of geos) {
      totalVerts += g.attributes.position.count;
      if (g.index) totalIdx += g.index.count;
    }

    const positions = new Float32Array(totalVerts * 3);
    const normals = geos[0].attributes.normal ? new Float32Array(totalVerts * 3) : null;
    const uvs = geos[0].attributes.uv ? new Float32Array(totalVerts * 2) : null;
    const indices = totalIdx > 0 ? new Uint32Array(totalIdx) : null;

    let vOffset = 0;
    let iOffset = 0;

    for (const g of geos) {
      const pos = g.attributes.position.array as Float32Array;
      const count = g.attributes.position.count;
      positions.set(pos, vOffset * 3);

      if (normals && g.attributes.normal) {
        normals.set(g.attributes.normal.array as Float32Array, vOffset * 3);
      }
      if (uvs && g.attributes.uv) {
        uvs.set(g.attributes.uv.array as Float32Array, vOffset * 2);
      }
      if (indices && g.index) {
        const srcIdx = g.index.array;
        indices.set(srcIdx, iOffset);
        for (let j = 0; j < srcIdx.length; j++) {
          indices[iOffset + j] += vOffset;
        }
        iOffset += srcIdx.length;
      }
      vOffset += count;
    }

    merged.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    if (normals) merged.setAttribute('normal', new THREE.BufferAttribute(normals, 3));
    if (uvs) merged.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
    if (indices) merged.setIndex(new THREE.BufferAttribute(indices, 1));

    return merged;
  }

  preloadPhase(phase: string): Promise<void> {
    const phaseEntries = this._manifest.filter(e => e.phase === phase);
    if (phaseEntries.length === 0) return Promise.resolve();
    return this.preloadAll();
  }

  destroy() {
    Array.from(this.geometryCache.values()).forEach(geo => geo.dispose());
    this.geometryCache.clear();
    this._isReady = false;
    this._total = 0;
    this._loaded = 0;
    this._progress = 0;
  }
}

export const gameAssets = AssetLoader.getInstance();
