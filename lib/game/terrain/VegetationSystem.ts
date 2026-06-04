import * as THREE from 'three';
import { VegetationLayer } from '../types';

interface VegetationPoolEntry {
  mesh: THREE.InstancedMesh | THREE.Points;
  layer: VegetationLayer;
  count: number;
  capacity: number;
  dummy: THREE.Object3D;
}

export class VegetationSystem {
  private scene: THREE.Scene;
  private pools: VegetationPoolEntry[] = [];
  private windTime = 0;
  private totalInstances = 0;
  private maxInstances = 8000;
  private cameraPosition = new THREE.Vector3();
  private isMobile = false;

  private sharedGeometries: Map<string, THREE.BufferGeometry> = new Map();
  private sharedMaterials: Map<string, THREE.Material> = new Map();

  constructor(scene: THREE.Scene, isMobile: boolean = false) {
    this.scene = scene;
    this.isMobile = isMobile;
  }

  setMobile(val: boolean) {
    this.isMobile = val;
  }

  updateCamera(pos: THREE.Vector3) {
    this.cameraPosition.copy(pos);
  }

  addLayer(layer: VegetationLayer, instances: Array<{ x: number; z: number; scale: number }>) {
    if (instances.length === 0) return;
    if (this.isMobile) {
      const maxDist = layer.maxDistance || 25;
      instances = instances.filter(inst => {
        const dx = inst.x - this.cameraPosition.x;
        const dz = inst.z - this.cameraPosition.z;
        return dx * dx + dz * dz < maxDist * maxDist;
      });
    }

    const count = Math.min(instances.length, this.maxInstances - this.totalInstances);
    if (count <= 0) return;

    if (layer.type === 'tree') {
      this.spawnTrees(layer, instances.slice(0, count));
    } else if (layer.type === 'bush') {
      this.spawnBushes(layer, instances.slice(0, count));
    } else if (layer.type === 'grass') {
      this.spawnGrass(layer, instances.slice(0, count));
    } else if (layer.type === 'ground_cover') {
      this.spawnGroundCover(layer, count);
    }
  }

  private spawnTrees(layer: VegetationLayer, instances: Array<{ x: number; z: number; scale: number }>) {
    const trunkGeo = this.getOrCreateGeometry('tree_trunk', () => {
      const g = new THREE.CylinderGeometry(0.2, 0.35, 4.0, 5);
      g.translate(0, 2.0, 0);
      return g;
    });
    const trunkMatKey = 'tree_trunk_' + (layer.color || 'default');
    const trunkMat = this.sharedMaterials.get(trunkMatKey) || new THREE.MeshStandardMaterial({
      color: layer.secondaryColor ? parseInt(layer.secondaryColor.replace('#', ''), 16) : 0x3e2723,
      roughness: 0.9, flatShading: true,
    });
    if (!this.sharedMaterials.has(trunkMatKey)) {
      this.sharedMaterials.set(trunkMatKey, trunkMat);
    }
    const leavesGeo = this.getOrCreateGeometry('tree_leaves', () => {
      const g = new THREE.ConeGeometry(2.5, 5.0, 5);
      g.translate(0, 5.0, 0);
      return g;
    });
    const leavesMatKey = 'tree_leaves_' + (layer.color || 'default');
    const leavesMat = this.sharedMaterials.get(leavesMatKey) || new THREE.MeshStandardMaterial({
      color: layer.color ? parseInt(layer.color.replace('#', ''), 16) : 0x1b4332,
      roughness: 0.8, flatShading: true,
    });
    if (!this.sharedMaterials.has(leavesMatKey)) {
      this.sharedMaterials.set(leavesMatKey, leavesMat);
    }

    const count = instances.length;
    const trunkMesh = new THREE.InstancedMesh(trunkGeo, trunkMat, count);
    const leavesMesh = new THREE.InstancedMesh(leavesGeo, leavesMat, count);
    trunkMesh.castShadow = true;
    trunkMesh.receiveShadow = true;
    leavesMesh.castShadow = true;
    leavesMesh.receiveShadow = true;

    const dummy = new THREE.Object3D();
    for (let i = 0; i < count; i++) {
      const inst = instances[i];
      const s = inst.scale;

      dummy.position.set(inst.x, 0, inst.z);
      dummy.rotation.set(0, Math.random() * Math.PI * 2, 0);
      dummy.scale.set(s, s, s);
      dummy.updateMatrix();
      trunkMesh.setMatrixAt(i, dummy.matrix);

      dummy.scale.set(s * 1.1, s * (0.9 + Math.random() * 0.3), s * 1.1);
      dummy.updateMatrix();
      leavesMesh.setMatrixAt(i, dummy.matrix);
    }

    trunkMesh.instanceMatrix.needsUpdate = true;
    leavesMesh.instanceMatrix.needsUpdate = true;
    trunkMesh.count = count;
    leavesMesh.count = count;

    this.scene.add(trunkMesh);
    this.scene.add(leavesMesh);

    this.totalInstances += count;

    this.pools.push({
      mesh: trunkMesh, layer, count, capacity: count,
      dummy: new THREE.Object3D(),
    });
    this.pools.push({
      mesh: leavesMesh, layer, count, capacity: count,
      dummy: new THREE.Object3D(),
    });
  }

  private spawnBushes(layer: VegetationLayer, instances: Array<{ x: number; z: number; scale: number }>) {
    const geo = this.getOrCreateGeometry('bush', () => new THREE.DodecahedronGeometry(0.8, 0));
    const matKey = 'bush_' + (layer.color || 'default');
    const mat = this.sharedMaterials.get(matKey) || new THREE.MeshStandardMaterial({
      color: layer.color ? parseInt(layer.color.replace('#', ''), 16) : 0x245a3a,
      roughness: 0.9, flatShading: true,
    });
    if (!this.sharedMaterials.has(matKey)) {
      this.sharedMaterials.set(matKey, mat);
    }

    const count = instances.length;
    const mesh = new THREE.InstancedMesh(geo, mat, count);
    mesh.castShadow = true;
    mesh.receiveShadow = true;

    const dummy = new THREE.Object3D();
    for (let i = 0; i < count; i++) {
      const inst = instances[i];
      const s = inst.scale;
      dummy.position.set(inst.x, s * 0.3, inst.z);
      dummy.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
      dummy.scale.set(s, s * 0.7, s);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    }

    mesh.instanceMatrix.needsUpdate = true;
    mesh.count = count;
    this.scene.add(mesh);
    this.totalInstances += count;

    this.pools.push({ mesh, layer, count, capacity: count, dummy: new THREE.Object3D() });
  }

  private spawnGrass(layer: VegetationLayer, instances: Array<{ x: number; z: number; scale: number }>) {
    const geo = this.getOrCreateGeometry('grass', () => {
      const g = new THREE.ConeGeometry(0.12, 0.6, 3);
      g.translate(0, 0.3, 0);
      return g;
    });
    const matKey = 'grass_' + (layer.color || 'default');
    const mat = this.sharedMaterials.get(matKey) || new THREE.MeshStandardMaterial({
      color: layer.color ? parseInt(layer.color.replace('#', ''), 16) : 0x2e6b45,
      roughness: 0.9, flatShading: true,
    });
    if (!this.sharedMaterials.has(matKey)) {
      this.sharedMaterials.set(matKey, mat);
    }

    const count = instances.length;
    const mesh = new THREE.InstancedMesh(geo, mat, count);
    mesh.receiveShadow = true;

    const dummy = new THREE.Object3D();
    for (let i = 0; i < count; i++) {
      const inst = instances[i];
      const s = inst.scale;
      dummy.position.set(inst.x, 0, inst.z);
      dummy.rotation.set((Math.random() - 0.5) * 0.3, Math.random() * Math.PI * 2, (Math.random() - 0.5) * 0.3);
      dummy.scale.set(s, s, s);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    }

    mesh.instanceMatrix.needsUpdate = true;
    mesh.count = count;
    this.scene.add(mesh);
    this.totalInstances += count;

    this.pools.push({ mesh, layer, count, capacity: count, dummy: new THREE.Object3D() });
  }

  private spawnGroundCover(layer: VegetationLayer, count: number) {
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const radius = 5 + Math.random() * 45;
      positions[i * 3] = Math.cos(angle) * radius;
      positions[i * 3 + 1] = 0.02;
      positions[i * 3 + 2] = Math.sin(angle) * radius;

      const shade = 0.3 + Math.random() * 0.4;
      colors[i * 3] = shade * 0.3;
      colors[i * 3 + 1] = shade * 0.7;
      colors[i * 3 + 2] = shade * 0.2;
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const mat = new THREE.PointsMaterial({
      size: 0.15,
      vertexColors: true,
      transparent: true,
      opacity: 0.6,
      depthWrite: false,
      blending: THREE.NormalBlending,
    });

    const points = new THREE.Points(geo, mat);
    this.scene.add(points);
    this.totalInstances += count;

    this.pools.push({
      mesh: points,
      layer,
      count,
      capacity: count,
      dummy: new THREE.Object3D(),
    } as VegetationPoolEntry);
  }

  getTotalInstances(): number {
    return this.totalInstances;
  }

  updateWind(delta: number) {
    this.windTime += delta;
    for (const entry of this.pools) {
      if (entry.layer.type === 'grass') {
        this.applyWindSway(entry);
      }
    }
  }

  private applyWindSway(entry: VegetationPoolEntry) {
    if (!(entry.mesh instanceof THREE.InstancedMesh)) return;
    const mesh = entry.mesh;
    const dummy = new THREE.Object3D();

    for (let i = 0; i < entry.count; i++) {
      mesh.getMatrixAt(i, dummy.matrix);
      dummy.matrix.decompose(dummy.position, dummy.quaternion, dummy.scale);
      const sway = Math.sin(this.windTime * 0.8 + i * 1.7) * 0.015;
      dummy.rotation.x += sway;
      dummy.rotation.z += Math.cos(this.windTime * 0.5 + i * 2.3) * 0.01;
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    }
    mesh.instanceMatrix.needsUpdate = true;
  }

  setVisibility(distance: number) {
    for (const entry of this.pools) {
      const maxDist = entry.layer.maxDistance || 30;
      entry.mesh.visible = distance < maxDist;
    }
  }

  clear() {
    for (const entry of this.pools) {
      this.scene.remove(entry.mesh);
      if (entry.mesh instanceof THREE.InstancedMesh || entry.mesh instanceof THREE.Points) {
        entry.mesh.geometry.dispose();
        (entry.mesh.material as THREE.Material).dispose();
      }
    }
    this.pools = [];
    this.totalInstances = 0;
  }

  dispose() {
    this.clear();
    this.sharedGeometries.forEach(g => g.dispose());
    this.sharedGeometries.clear();
    this.sharedMaterials.forEach(m => m.dispose());
    this.sharedMaterials.clear();
  }

  private getOrCreateGeometry(key: string, factory: () => THREE.BufferGeometry): THREE.BufferGeometry {
    if (!this.sharedGeometries.has(key)) {
      this.sharedGeometries.set(key, factory());
    }
    return this.sharedGeometries.get(key)!;
  }

  private getOrCreateMaterial(key: string, mat: THREE.Material): THREE.Material {
    if (!this.sharedMaterials.has(key)) {
      this.sharedMaterials.set(key, mat);
    }
    return this.sharedMaterials.get(key)!;
  }
}
