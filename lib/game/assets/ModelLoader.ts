import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

export class ModelLoader {
  private loader = new GLTFLoader();
  private cache = new Map<string, THREE.Group>();
  private loading = new Map<string, Promise<THREE.Group>>();

  async load(path: string): Promise<THREE.Group> {
    const cached = this.cache.get(path);
    if (cached) return cached;

    const inflight = this.loading.get(path);
    if (inflight) return inflight;

    const promise = new Promise<THREE.Group>((resolve, reject) => {
      this.loader.load(
        path,
        (gltf) => {
          const group = gltf.scene;
          group.traverse((child) => {
            if (child instanceof THREE.Mesh) {
              child.frustumCulled = true;
            }
          });
          this.cache.set(path, group);
          this.loading.delete(path);
          resolve(group);
        },
        undefined,
        (err) => {
          this.loading.delete(path);
          reject(err);
        },
      );
    });
    this.loading.set(path, promise);
    return promise;
  }

  isLoaded(path: string): boolean {
    return this.cache.has(path);
  }

  get(path: string): THREE.Group | undefined {
    return this.cache.get(path);
  }

  async preload(paths: string[]): Promise<void> {
    await Promise.allSettled(paths.map(p => this.load(p)));
  }

  dispose(): void {
    this.cache.forEach((group) => {
      group.traverse((child: THREE.Object3D) => {
        if (child instanceof THREE.Mesh) {
          child.geometry.dispose();
          if (Array.isArray(child.material)) {
            child.material.forEach(m => m.dispose());
          } else {
            child.material.dispose();
          }
        }
      });
    });
    this.cache.clear();
    this.loading.clear();
  }
}
