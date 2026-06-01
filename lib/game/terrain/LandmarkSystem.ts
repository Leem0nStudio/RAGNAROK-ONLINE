import * as THREE from 'three';
import { LandmarkDefinition, VoxelBlock } from '../types';

interface LandmarkInstance {
  def: LandmarkDefinition;
  group: THREE.Group;
  lodMeshes: THREE.Object3D[];
  currentLOD: number;
  position: THREE.Vector3;
  boundingSphere: THREE.Sphere;
}

export class LandmarkSystem {
  private scene: THREE.Scene;
  private landmarks: Map<string, LandmarkInstance> = new Map();
  private blockColors: Map<string, THREE.Color> = new Map();

  private silhouetteMaterial: THREE.Material;
  private lowMat: THREE.Material;
  private fullMat: THREE.MeshStandardMaterial;

  constructor(scene: THREE.Scene) {
    this.scene = scene;

    this.silhouetteMaterial = new THREE.MeshBasicMaterial({
      color: 0x1a1a2e,
      transparent: true,
      opacity: 0.4,
      depthWrite: false,
    });

    this.lowMat = new THREE.MeshStandardMaterial({
      color: 0x3a3a5e,
      roughness: 0.8,
      flatShading: true,
    });

    this.fullMat = new THREE.MeshStandardMaterial({
      roughness: 0.8,
      metalness: 0.1,
      flatShading: true,
    });
  }

  addLandmark(def: LandmarkDefinition) {
    if (this.landmarks.has(def.id)) return;

    const group = new THREE.Group();
    const pos = new THREE.Vector3(def.position[0], def.position[1], def.position[2]);
    group.position.copy(pos);
    group.rotation.y = def.rotation;
    group.scale.set(def.scale, def.scale, def.scale);

    const lodMeshes: THREE.Object3D[] = [];

    // LOD 2: Full detail
    const fullGroup = this.buildFullDetail(def);
    fullGroup.visible = true;
    fullGroup.userData.lodLevel = 2;
    group.add(fullGroup);
    lodMeshes.push(fullGroup);

    // LOD 1: Simplified
    const lowGroup = this.buildLowDetail(def);
    lowGroup.visible = false;
    lowGroup.userData.lodLevel = 1;
    group.add(lowGroup);
    lodMeshes.push(lowGroup);

    // LOD 0: Silhouette
    const silGroup = this.buildSilhouette(def);
    silGroup.visible = false;
    silGroup.userData.lodLevel = 0;
    group.add(silGroup);
    lodMeshes.push(silGroup);

    let minX = Infinity, maxX = -Infinity;
    let minZ = Infinity, maxZ = -Infinity;
    for (const b of def.blocks) {
      if (b.ox < minX) minX = b.ox;
      if (b.ox > maxX) maxX = b.ox;
      if (b.oz < minZ) minZ = b.oz;
      if (b.oz > maxZ) maxZ = b.oz;
    }
    const spanX = (maxX - minX + 1) * def.scale;
    const spanZ = (maxZ - minZ + 1) * def.scale;
    const radius = Math.max(Math.sqrt(spanX * spanX + spanZ * spanZ) * 0.5, 2);
    const boundingSphere = new THREE.Sphere(pos, radius);

    this.scene.add(group);

    this.landmarks.set(def.id, {
      def,
      group,
      lodMeshes,
      currentLOD: 2,
      position: pos,
      boundingSphere,
    });
  }

  removeLandmark(id: string) {
    const inst = this.landmarks.get(id);
    if (!inst) return;
    this.scene.remove(inst.group);
    this.disposeGroup(inst.group);
    this.landmarks.delete(id);
  }

  updateLOD(cameraPos: THREE.Vector3) {
    for (const inst of Array.from(this.landmarks.values())) {
      const dist = inst.position.distanceTo(cameraPos);
      let targetLOD: number;

      if (dist > 50) {
        targetLOD = 0;
      } else if (dist > 20) {
        targetLOD = 1;
      } else {
        targetLOD = 2;
      }

      if (targetLOD !== inst.currentLOD) {
        for (const mesh of inst.lodMeshes) {
          mesh.visible = mesh.userData.lodLevel === targetLOD;
        }
        inst.currentLOD = targetLOD;
      }
    }
  }

  getLandmarkCount(): number {
    return this.landmarks.size;
  }

  getLandmarkPositions(): Array<{ x: number; z: number; radius: number }> {
    const result: Array<{ x: number; z: number; radius: number }> = [];
    for (const inst of Array.from(this.landmarks.values())) {
      result.push({
        x: inst.position.x,
        z: inst.position.z,
        radius: inst.boundingSphere.radius,
      });
    }
    return result;
  }

  clear() {
    for (const inst of Array.from(this.landmarks.values())) {
      this.scene.remove(inst.group);
      this.disposeGroup(inst.group);
    }
    this.landmarks.clear();
  }

  dispose() {
    this.clear();
    this.silhouetteMaterial.dispose();
    this.lowMat.dispose();
    this.fullMat.dispose();
    this.blockColors.clear();
  }

  private buildFullDetail(def: LandmarkDefinition): THREE.Group {
    const group = new THREE.Group();
    const blockSize = 1;
    const half = blockSize / 2;

    for (const block of def.blocks) {
      const geo = block.type === 'arch'
        ? new THREE.TorusGeometry(half * 0.6, half * 0.2, 6, 8, Math.PI)
        : new THREE.BoxGeometry(blockSize * 0.9, blockSize * 0.9, blockSize * 0.9);

      const color = this.getColor(block.color);
      const mat = this.fullMat.clone();
      mat.color.copy(color);

      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(
        block.ox * blockSize,
        block.oy * blockSize + half,
        block.oz * blockSize
      );
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      group.add(mesh);

      if (block.type === 'window') {
        const windowGeo = new THREE.BoxGeometry(0.2, 0.05, 0.5);
        const windowMat = new THREE.MeshBasicMaterial({
          color: 0x88ccff,
          transparent: true,
          opacity: 0.5,
        });
        const win = new THREE.Mesh(windowGeo, windowMat);
        win.position.copy(mesh.position);
        win.position.z += 0.5;
        win.castShadow = false;
        group.add(win);
      } else if (block.type === 'door') {
        const doorGeo = new THREE.BoxGeometry(0.5, 0.8, 0.05);
        const doorMat = new THREE.MeshBasicMaterial({ color: 0x5c4033 });
        const door = new THREE.Mesh(doorGeo, doorMat);
        door.position.copy(mesh.position);
        door.position.z += 0.5;
        group.add(door);
      }
    }
    return group;
  }

  private buildLowDetail(def: LandmarkDefinition): THREE.Group {
    const group = new THREE.Group();
    const merged = this.mergeBlocks(def.blocks);

    for (const m of merged) {
      const geo = new THREE.BoxGeometry(m.sx, m.sy, m.sz);
      const mesh = new THREE.Mesh(geo, this.lowMat);
      mesh.position.set(m.cx, m.cy, m.cz);
      group.add(mesh);
    }
    return group;
  }

  private buildSilhouette(def: LandmarkDefinition): THREE.Group {
    const group = new THREE.Group();
    const merged = this.mergeBlocks(def.blocks, true);

    for (const m of merged) {
      const geo = new THREE.BoxGeometry(m.sx, m.sy, m.sz);
      const mesh = new THREE.Mesh(geo, this.silhouetteMaterial);
      mesh.position.set(m.cx, m.cy, m.cz);
      group.add(mesh);
    }
    return group;
  }

  private mergeBlocks(blocks: VoxelBlock[], silent: boolean = false): Array<{ cx: number; cy: number; cz: number; sx: number; sy: number; sz: number }> {
    const result: Array<{ cx: number; cy: number; cz: number; sx: number; sy: number; sz: number }> = [];
    const processed = new Set<string>();

    for (const block of blocks) {
      const key = `${block.ox},${block.oy},${block.oz}`;
      if (processed.has(key)) continue;

      let sx = 1, sz = 1;
      // Greedy merge in X
      while (true) {
        const nextKey = `${block.ox + sx},${block.oy},${block.oz}`;
        if (blocks.some(b => `${b.ox},${b.oy},${b.oz}` === nextKey) && !processed.has(nextKey)) {
          processed.add(nextKey);
          sx++;
        } else break;
      }
      // Greedy merge in Z
      while (true) {
        let allExist = true;
        for (let ix = 0; ix < sx; ix++) {
          const nextKey = `${block.ox + ix},${block.oy},${block.oz + sz}`;
          if (!blocks.some(b => `${b.ox},${b.oy},${b.oz}` === nextKey) || processed.has(nextKey)) {
            allExist = false;
            break;
          }
        }
        if (allExist) {
          for (let ix = 0; ix < sx; ix++) {
            processed.add(`${block.ox + ix},${block.oy},${block.oz + sz}`);
          }
          sz++;
        } else break;
      }

      processed.add(key);
      result.push({
        cx: block.ox + sx / 2,
        cy: block.oy + 0.5,
        cz: block.oz + sz / 2,
        sx: sx * 0.95,
        sy: 0.95,
        sz: sz * 0.95,
      });
    }
    return result;
  }

  private getColor(name: string): THREE.Color {
    if (!this.blockColors.has(name)) {
      switch (name) {
        case 'stone': this.blockColors.set(name, new THREE.Color(0x6b7280)); break;
        case 'brick': this.blockColors.set(name, new THREE.Color(0x92400e)); break;
        case 'wood': this.blockColors.set(name, new THREE.Color(0x5c4033)); break;
        case 'roof': this.blockColors.set(name, new THREE.Color(0x991b1b)); break;
        case 'marble': this.blockColors.set(name, new THREE.Color(0xe2e8f0)); break;
        case 'dark': this.blockColors.set(name, new THREE.Color(0x1e293b)); break;
        case 'sandstone': this.blockColors.set(name, new THREE.Color(0xc2a66b)); break;
        case 'gold': this.blockColors.set(name, new THREE.Color(0xffd700)); break;
        case 'ice': this.blockColors.set(name, new THREE.Color(0xaaddff)); break;
        case 'snow': this.blockColors.set(name, new THREE.Color(0xeeeeff)); break;
        default: this.blockColors.set(name, new THREE.Color(0x808080)); break;
      }
    }
    return this.blockColors.get(name)!;
  }

  private disposeGroup(group: THREE.Group) {
    group.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.geometry.dispose();
        if (Array.isArray(child.material)) {
          child.material.forEach(m => m.dispose());
        } else {
          child.material.dispose();
        }
      }
    });
  }
}
