import * as THREE from 'three';
import { PropBlueprint, PropInstance } from '../types';

interface InstancedPoolEntry {
  mesh: THREE.InstancedMesh;
  blueprint: PropBlueprint;
  count: number;
  capacity: number;
  dummy: THREE.Object3D;
}

export class PropLibrary {
  private pool: Map<string, InstancedPoolEntry> = new Map();
  private scene: THREE.Scene;
  private geometryCache: Map<string, THREE.BufferGeometry> = new Map();
  private materialCache: Map<string, THREE.Material> = new Map();
  private totalInstances = 0;
  private maxInstances = 2000;

  blueprints: Map<string, PropBlueprint> = new Map();

  constructor(scene: THREE.Scene) {
    this.scene = scene;
    this.registerDefaults();
  }

  private registerDefaults() {
    const defaults: PropBlueprint[] = [
      { id: 'rock_a', meshId: 'rock', scaleRange: [0.8, 1.5] as [number, number], rotationYRange: [0, 6.283] as [number, number], collisionRadius: 0.6, castShadow: true, lodDistances: [0, 30, 60] as [number, number, number] },
      { id: 'rock_b', meshId: 'rock_flat', scaleRange: [1.0, 2.0] as [number, number], rotationYRange: [0, 6.283] as [number, number], collisionRadius: 0.8, castShadow: true, lodDistances: [0, 30, 60] as [number, number, number] },
      { id: 'rock_c', meshId: 'rock_moss', scaleRange: [0.5, 0.9] as [number, number], rotationYRange: [0, 6.283] as [number, number], collisionRadius: 0.5, castShadow: true, lodDistances: [0, 25, 50] as [number, number, number] },
      { id: 'rock_d', meshId: 'rock_quartz', scaleRange: [0.3, 0.6] as [number, number], rotationYRange: [0, 6.283] as [number, number], collisionRadius: 0.3, castShadow: true, lodDistances: [0, 20, 40] as [number, number, number] },
      { id: 'bush_a', meshId: 'bush', scaleRange: [0.6, 1.2] as [number, number], rotationYRange: [0, 6.283] as [number, number], collisionRadius: 0.4, castShadow: false, lodDistances: [0, 25, 50] as [number, number, number] },
      { id: 'fence_straight', meshId: 'fence', scaleRange: [1.0, 1.0] as [number, number], rotationYRange: [0, 0] as [number, number], collisionRadius: 0.1, castShadow: true, lodDistances: [0, 20, 50] as [number, number, number] },
      { id: 'fence_corner', meshId: 'fence_corner', scaleRange: [1.0, 1.0] as [number, number], rotationYRange: [0, 0] as [number, number], collisionRadius: 0.1, castShadow: true, lodDistances: [0, 20, 50] as [number, number, number] },
      { id: 'fence_wood', meshId: 'fence_wood', scaleRange: [1.0, 1.0] as [number, number], rotationYRange: [0, 6.283] as [number, number], collisionRadius: 0.15, castShadow: true, lodDistances: [0, 20, 50] as [number, number, number] },
      { id: 'fence_stone', meshId: 'fence_stone', scaleRange: [0.8, 1.0] as [number, number], rotationYRange: [0, 6.283] as [number, number], collisionRadius: 0.2, castShadow: true, lodDistances: [0, 20, 50] as [number, number, number] },
      { id: 'signpost_a', meshId: 'signpost', scaleRange: [0.8, 1.2] as [number, number], rotationYRange: [0, 6.283] as [number, number], collisionRadius: 0.2, castShadow: true, lodDistances: [0, 25, 50] as [number, number, number] },
      { id: 'signpost_danger', meshId: 'signpost_danger', scaleRange: [0.8, 1.2] as [number, number], rotationYRange: [0, 6.283] as [number, number], collisionRadius: 0.2, castShadow: true, lodDistances: [0, 25, 50] as [number, number, number] },
      { id: 'lamp_post', meshId: 'lamp', scaleRange: [0.9, 1.1] as [number, number], rotationYRange: [0, 6.283] as [number, number], collisionRadius: 0.15, castShadow: true, lodDistances: [0, 30, 60] as [number, number, number] },
      { id: 'crate_stack_2', meshId: 'crate', scaleRange: [0.7, 1.1] as [number, number], rotationYRange: [0, 6.283] as [number, number], collisionRadius: 0.4, castShadow: true, lodDistances: [0, 25, 55] as [number, number, number] },
      { id: 'barrel', meshId: 'barrel', scaleRange: [0.8, 1.2] as [number, number], rotationYRange: [0, 6.283] as [number, number], collisionRadius: 0.35, castShadow: true, lodDistances: [0, 25, 55] as [number, number, number] },
      // Ruinas
      { id: 'ruin_column', meshId: 'ruin_column', scaleRange: [0.8, 1.0] as [number, number], rotationYRange: [0, 6.283] as [number, number], collisionRadius: 0.4, castShadow: true, lodDistances: [0, 25, 55] as [number, number, number] },
      { id: 'ruin_pillar', meshId: 'ruin_pillar', scaleRange: [0.8, 1.2] as [number, number], rotationYRange: [0, 6.283] as [number, number], collisionRadius: 0.35, castShadow: true, lodDistances: [0, 25, 55] as [number, number, number] },
      { id: 'ruin_slab', meshId: 'ruin_slab', scaleRange: [0.8, 1.5] as [number, number], rotationYRange: [0, 6.283] as [number, number], collisionRadius: 0.5, castShadow: true, lodDistances: [0, 25, 55] as [number, number, number] },
      // Puentes
      { id: 'bridge_plank', meshId: 'bridge_plank', scaleRange: [0.9, 1.0] as [number, number], rotationYRange: [0, 0] as [number, number], collisionRadius: 0.1, castShadow: true, lodDistances: [0, 25, 55] as [number, number, number] },
      // Ciudad
      { id: 'bench', meshId: 'bench', scaleRange: [0.9, 1.1] as [number, number], rotationYRange: [0, 6.283] as [number, number], collisionRadius: 0.5, castShadow: true, lodDistances: [0, 25, 55] as [number, number, number] },
      { id: 'cart', meshId: 'cart', scaleRange: [0.9, 1.1] as [number, number], rotationYRange: [0, 6.283] as [number, number], collisionRadius: 0.6, castShadow: true, lodDistances: [0, 25, 55] as [number, number, number] },
      { id: 'stall', meshId: 'stall', scaleRange: [0.9, 1.1] as [number, number], rotationYRange: [0, 6.283] as [number, number], collisionRadius: 0.5, castShadow: true, lodDistances: [0, 25, 55] as [number, number, number] },
      { id: 'lantern_wall', meshId: 'lantern_wall', scaleRange: [0.9, 1.1] as [number, number], rotationYRange: [0, 6.283] as [number, number], collisionRadius: 0.15, castShadow: true, lodDistances: [0, 25, 55] as [number, number, number] },
      { id: 'planter_box', meshId: 'planter_box', scaleRange: [0.9, 1.1] as [number, number], rotationYRange: [0, 6.283] as [number, number], collisionRadius: 0.4, castShadow: true, lodDistances: [0, 25, 55] as [number, number, number] },
      // Decoración ciudad
      { id: 'tree_deciduous', meshId: 'tree_deciduous', scaleRange: [0.9, 1.2] as [number, number], rotationYRange: [0, 6.283] as [number, number], collisionRadius: 0.6, castShadow: true, lodDistances: [0, 30, 60] as [number, number, number] },
      { id: 'tree_conifer', meshId: 'tree_conifer', scaleRange: [0.8, 1.1] as [number, number], rotationYRange: [0, 6.283] as [number, number], collisionRadius: 0.5, castShadow: true, lodDistances: [0, 25, 55] as [number, number, number] },
      { id: 'fountain', meshId: 'fountain', scaleRange: [0.8, 1.2] as [number, number], rotationYRange: [0, 6.283] as [number, number], collisionRadius: 0.8, castShadow: true, lodDistances: [0, 30, 60] as [number, number, number] },
      { id: 'pillar', meshId: 'pillar', scaleRange: [0.8, 1.2] as [number, number], rotationYRange: [0, 6.283] as [number, number], collisionRadius: 0.4, castShadow: true, lodDistances: [0, 25, 55] as [number, number, number] },
      { id: 'torch', meshId: 'torch', scaleRange: [0.9, 1.1] as [number, number], rotationYRange: [0, 6.283] as [number, number], collisionRadius: 0.15, castShadow: true, lodDistances: [0, 20, 45] as [number, number, number] },
      { id: 'crate', meshId: 'crate', scaleRange: [0.6, 0.9] as [number, number], rotationYRange: [0, 6.283] as [number, number], collisionRadius: 0.35, castShadow: true, lodDistances: [0, 25, 55] as [number, number, number] },
      { id: 'flower_bed', meshId: 'flower_bed', scaleRange: [0.7, 1.0] as [number, number], rotationYRange: [0, 6.283] as [number, number], collisionRadius: 0.3, castShadow: false, lodDistances: [0, 20, 45] as [number, number, number] },
      { id: 'signpost_guide', meshId: 'signpost_guide', scaleRange: [0.8, 1.1] as [number, number], rotationYRange: [0, 6.283] as [number, number], collisionRadius: 0.2, castShadow: true, lodDistances: [0, 25, 55] as [number, number, number] },
      { id: 'bush_round', meshId: 'bush_round', scaleRange: [0.6, 1.0] as [number, number], rotationYRange: [0, 6.283] as [number, number], collisionRadius: 0.3, castShadow: false, lodDistances: [0, 20, 45] as [number, number, number] },
      { id: 'grass_blade', meshId: 'grass_blade', scaleRange: [0.4, 0.8] as [number, number], rotationYRange: [0, 6.283] as [number, number], collisionRadius: 0.1, castShadow: false, lodDistances: [0, 15, 35] as [number, number, number] },
      { id: 'windmill', meshId: 'windmill', scaleRange: [1.0, 1.5] as [number, number], rotationYRange: [0, 6.283] as [number, number], collisionRadius: 0.8, castShadow: true, lodDistances: [0, 35, 70] as [number, number, number] },
    ];
    for (const bp of defaults) {
      this.blueprints.set(bp.id, bp);
    }
  }

  ensureBlueprint(blueprint: PropBlueprint) {
    this.blueprints.set(blueprint.id, blueprint);
  }

  getBlueprint(id: string): PropBlueprint | undefined {
    return this.blueprints.get(id);
  }

  addInstances(blueprintId: string, instances: PropInstance[]) {
    if (instances.length === 0) return;
    const blueprint = this.blueprints.get(blueprintId);
    if (!blueprint) return;

    const poolKey = blueprintId;
    let entry = this.pool.get(poolKey);

    if (entry) {
      const needed = entry.count + instances.length;
      if (needed > entry.capacity) {
        this.growEntry(entry, needed);
      }
    } else {
      const geometry = this.getGeometry(blueprint.meshId);
      const material = this.getMaterial(blueprint.meshId);
      const capacity = Math.max(64, nextPow2(instances.length));
      const mesh = new THREE.InstancedMesh(geometry, material, capacity);
      mesh.castShadow = blueprint.castShadow;
      mesh.receiveShadow = true;
      mesh.count = 0;
      this.scene.add(mesh);

      entry = {
        mesh,
        blueprint,
        count: 0,
        capacity,
        dummy: new THREE.Object3D(),
      };
      this.pool.set(poolKey, entry);
    }

    const dummy = entry.dummy;
    for (const inst of instances) {
      if (this.totalInstances >= this.maxInstances) break;
      const scale = inst.scale;
      dummy.position.set(inst.x, 0, inst.z);
      dummy.rotation.set(0, inst.rotationY, 0);
      dummy.scale.set(scale, scale, scale);
      dummy.updateMatrix();
      entry.mesh.setMatrixAt(entry.count, dummy.matrix);
      entry.count++;
      this.totalInstances++;
    }
    entry.mesh.count = entry.count;
    entry.mesh.instanceMatrix.needsUpdate = true;
  }

  removeInstances(blueprintId: string, count: number) {
    const entry = this.pool.get(blueprintId);
    if (!entry) return;
    entry.count = Math.max(0, entry.count - count);
    entry.mesh.count = entry.count;
    this.totalInstances = Math.max(0, this.totalInstances - count);
  }

  getTotalInstances(): number {
    return this.totalInstances;
  }

  clearAll() {
    Array.from(this.pool.values()).forEach((entry: InstancedPoolEntry) => {
      this.scene.remove(entry.mesh);
      entry.mesh.geometry.dispose();
      if (Array.isArray(entry.mesh.material)) {
        entry.mesh.material.forEach(m => m.dispose());
      } else {
        entry.mesh.material.dispose();
      }
    });
    this.pool.clear();
    this.totalInstances = 0;
  }

  dispose() {
    this.clearAll();
    this.geometryCache.forEach(g => g.dispose());
    this.geometryCache.clear();
    this.materialCache.forEach(m => m.dispose());
    this.materialCache.clear();
  }

  private growEntry(entry: InstancedPoolEntry, needed: number) {
    const newCapacity = nextPow2(needed);
    const newMesh = new THREE.InstancedMesh(
      entry.mesh.geometry,
      entry.mesh.material,
      newCapacity
    );
    newMesh.castShadow = entry.mesh.castShadow;
    newMesh.receiveShadow = entry.mesh.receiveShadow;
    newMesh.count = entry.count;

    const tempMatrix = new THREE.Matrix4();
    for (let i = 0; i < entry.count; i++) {
      entry.mesh.getMatrixAt(i, tempMatrix);
      newMesh.setMatrixAt(i, tempMatrix);
    }
    newMesh.instanceMatrix.needsUpdate = true;

    this.scene.remove(entry.mesh);
    this.scene.add(newMesh);
    entry.mesh.geometry.dispose();
    entry.mesh = newMesh;
    entry.capacity = newCapacity;
  }

  private getGeometry(meshId: string): THREE.BufferGeometry {
    const cached = this.geometryCache.get(meshId);
    if (cached) return cached;

    let geo: THREE.BufferGeometry;
    switch (meshId) {
      case 'rock':
        geo = new THREE.DodecahedronGeometry(0.6, 0);
        break;
      case 'rock_flat':
        geo = new THREE.CylinderGeometry(0.7, 0.9, 0.4, 6);
        break;
      case 'rock_moss':
        geo = new THREE.DodecahedronGeometry(0.5, 1);
        break;
      case 'rock_quartz':
        geo = new THREE.OctahedronGeometry(0.3, 0);
        break;
      case 'bush':
        geo = new THREE.SphereGeometry(0.5, 5, 4);
        break;
      case 'fence':
        geo = new THREE.BoxGeometry(0.1, 0.8, 1.2);
        break;
      case 'fence_corner':
        geo = new THREE.BoxGeometry(0.8, 0.8, 0.1);
        break;
      case 'signpost': {
        const g = new THREE.BoxGeometry(0.08, 1.2, 0.08);
        const board = new THREE.BoxGeometry(0.7, 0.3, 0.05);
        board.translate(0, 0.7, 0);
        const merged = mergeBufferGeometries([g, board]);
        geo = merged || g;
        break;
      }
      case 'lamp': {
        const pole = new THREE.CylinderGeometry(0.04, 0.06, 1.8, 6);
        const globe = new THREE.SphereGeometry(0.12, 6, 6);
        globe.translate(0, 1.0, 0);
        const mergedLamp = mergeBufferGeometries([pole, globe]);
        geo = mergedLamp || pole;
        break;
      }
      case 'crate':
        geo = new THREE.BoxGeometry(0.6, 0.6, 0.6);
        break;
      case 'barrel':
        geo = new THREE.CylinderGeometry(0.3, 0.3, 0.7, 8);
        break;
      // Nuevos props
      case 'fence_wood': {
        const post = new THREE.CylinderGeometry(0.06, 0.08, 0.8, 4);
        post.translate(0, 0.4, 0);
        const rail = new THREE.BoxGeometry(0.04, 0.04, 1.8);
        rail.translate(0, 0.3, 0);
        const rail2 = new THREE.BoxGeometry(0.04, 0.04, 1.8);
        rail2.translate(0, 0.6, 0);
        const mergedFence = mergeBufferGeometries([post, post.clone(), rail, rail2]);
        post.translate(0.8, 0, 0);
        geo = mergedFence || new THREE.BoxGeometry(0.1, 0.8, 1.8);
        break;
      }
      case 'fence_stone':
        geo = new THREE.BoxGeometry(0.3, 0.5, 0.3);
        break;
      case 'signpost_danger': {
        const sp = new THREE.BoxGeometry(0.08, 1.2, 0.08);
        const board2 = new THREE.BoxGeometry(0.6, 0.4, 0.05);
        board2.translate(0, 0.7, 0);
        const skull = new THREE.SphereGeometry(0.08, 6, 6);
        skull.translate(0, 1.0, 0);
        const mergedDanger = mergeBufferGeometries([sp, board2, skull]);
        geo = mergedDanger || sp;
        break;
      }
      case 'ruin_column':
        geo = new THREE.CylinderGeometry(0.4, 0.5, 1.5, 6);
        break;
      case 'ruin_pillar':
        geo = new THREE.BoxGeometry(0.5, 2.0, 0.5);
        break;
      case 'ruin_slab':
        geo = new THREE.BoxGeometry(0.8, 0.15, 1.2);
        break;
      case 'bridge_plank':
        geo = new THREE.BoxGeometry(0.3, 0.05, 1.2);
        break;
      case 'bench': {
        const seat = new THREE.BoxGeometry(1.2, 0.08, 0.4);
        seat.translate(0, 0.25, 0);
        const leg1 = new THREE.BoxGeometry(0.08, 0.4, 0.08);
        leg1.translate(-0.5, 0, -0.15);
        const leg2 = new THREE.BoxGeometry(0.08, 0.4, 0.08);
        leg2.translate(0.5, 0, -0.15);
        const leg3 = new THREE.BoxGeometry(0.08, 0.4, 0.08);
        leg3.translate(-0.5, 0, 0.15);
        const leg4 = new THREE.BoxGeometry(0.08, 0.4, 0.08);
        leg4.translate(0.5, 0, 0.15);
        const back = new THREE.BoxGeometry(1.2, 0.3, 0.06);
        back.translate(0, 0.45, -0.2);
        const mergedBench = mergeBufferGeometries([seat, leg1, leg2, leg3, leg4, back]);
        geo = mergedBench || seat;
        break;
      }
      case 'cart': {
        const bed = new THREE.BoxGeometry(1.0, 0.15, 0.7);
        bed.translate(0, 0.3, 0);
        const wheel1 = new THREE.CylinderGeometry(0.15, 0.15, 0.05, 6);
        wheel1.rotateZ(1.57);
        wheel1.translate(-0.5, 0.15, 0.4);
        const wheel2 = new THREE.CylinderGeometry(0.15, 0.15, 0.05, 6);
        wheel2.rotateZ(1.57);
        wheel2.translate(-0.5, 0.15, -0.4);
        const wheel3 = new THREE.CylinderGeometry(0.15, 0.15, 0.05, 6);
        wheel3.rotateZ(1.57);
        wheel3.translate(0.5, 0.15, 0.4);
        const wheel4 = new THREE.CylinderGeometry(0.15, 0.15, 0.05, 6);
        wheel4.rotateZ(1.57);
        wheel4.translate(0.5, 0.15, -0.4);
        const handle = new THREE.BoxGeometry(0.06, 0.6, 0.06);
        handle.translate(-0.8, 0.5, 0);
        const mergedCart = mergeBufferGeometries([bed, wheel1, wheel2, wheel3, wheel4, handle]);
        geo = mergedCart || bed;
        break;
      }
      case 'stall': {
        const counter = new THREE.BoxGeometry(0.8, 0.6, 0.5);
        counter.translate(0, 0.3, 0);
        const canopy = new THREE.BoxGeometry(1.0, 0.04, 0.6);
        canopy.translate(0, 0.9, 0);
        const post1 = new THREE.BoxGeometry(0.06, 0.6, 0.06);
        post1.translate(-0.45, 0.6, -0.25);
        const post2 = new THREE.BoxGeometry(0.06, 0.6, 0.06);
        post2.translate(0.45, 0.6, -0.25);
        const post3 = new THREE.BoxGeometry(0.06, 0.6, 0.06);
        post3.translate(-0.45, 0.6, 0.25);
        const post4 = new THREE.BoxGeometry(0.06, 0.6, 0.06);
        post4.translate(0.45, 0.6, 0.25);
        const mergedStall = mergeBufferGeometries([counter, canopy, post1, post2, post3, post4]);
        geo = mergedStall || counter;
        break;
      }
      case 'lantern_wall': {
        const bracket = new THREE.BoxGeometry(0.04, 0.04, 0.3);
        bracket.translate(0, 0.3, 0);
        const lGlobe = new THREE.SphereGeometry(0.08, 6, 6);
        lGlobe.translate(0, 0.4, 0.3);
        const mergedLantern = mergeBufferGeometries([bracket, lGlobe]);
        geo = mergedLantern || bracket;
        break;
      }
      case 'planter_box':
        geo = new THREE.BoxGeometry(0.5, 0.3, 0.5);
        break;
      case 'tree_deciduous': {
        const trunk = new THREE.CylinderGeometry(0.06, 0.1, 1.2, 5);
        trunk.translate(0, 0.6, 0);
        const crown = new THREE.SphereGeometry(0.8, 6, 5);
        crown.scale(1, 0.7, 1);
        crown.translate(0, 1.6, 0);
        const mergedTree = mergeBufferGeometries([trunk, crown]);
        geo = mergedTree || new THREE.BoxGeometry(0.5, 1.5, 0.5);
        break;
      }
      case 'tree_conifer': {
        const cTrunk = new THREE.CylinderGeometry(0.05, 0.08, 1.0, 5);
        cTrunk.translate(0, 0.5, 0);
        const foliage1 = new THREE.ConeGeometry(0.7, 0.6, 6);
        foliage1.translate(0, 1.2, 0);
        const foliage2 = new THREE.ConeGeometry(0.5, 0.5, 6);
        foliage2.translate(0, 1.7, 0);
        const mergedConifer = mergeBufferGeometries([cTrunk, foliage1, foliage2]);
        geo = mergedConifer || new THREE.ConeGeometry(0.5, 1.5, 6);
        break;
      }
      case 'fountain': {
        const basin = new THREE.CylinderGeometry(0.8, 0.9, 0.3, 12);
        const column = new THREE.CylinderGeometry(0.1, 0.15, 0.8, 8);
        column.translate(0, 0.55, 0);
        const bowl = new THREE.CylinderGeometry(0.5, 0.6, 0.15, 10);
        bowl.translate(0, 1.1, 0);
        const mergedFountain = mergeBufferGeometries([basin, column, bowl]);
        geo = mergedFountain || basin;
        break;
      }
      case 'pillar':
        geo = new THREE.CylinderGeometry(0.2, 0.25, 1.8, 8);
        break;
      case 'torch': {
        const tPole = new THREE.CylinderGeometry(0.03, 0.04, 1.2, 5);
        tPole.translate(0, 0.6, 0);
        const flame = new THREE.ConeGeometry(0.08, 0.15, 5);
        flame.translate(0, 1.35, 0);
        const mergedTorch = mergeBufferGeometries([tPole, flame]);
        geo = mergedTorch || tPole;
        break;
      }
      case 'flower_bed': {
        const fBox = new THREE.BoxGeometry(0.4, 0.08, 0.4);
        fBox.translate(0, 0.04, 0);
        const stem1 = new THREE.CylinderGeometry(0.01, 0.01, 0.15, 4);
        stem1.translate(0.08, 0.16, 0.08);
        const stem2 = new THREE.CylinderGeometry(0.01, 0.01, 0.12, 4);
        stem2.translate(-0.06, 0.16, -0.06);
        const stem3 = new THREE.CylinderGeometry(0.01, 0.01, 0.1, 4);
        stem3.translate(0.06, 0.14, -0.08);
        const mergedFlower = mergeBufferGeometries([fBox, stem1, stem2, stem3]);
        geo = mergedFlower || fBox;
        break;
      }
      case 'signpost_guide': {
        const sgPost = new THREE.CylinderGeometry(0.04, 0.06, 1.3, 5);
        const sgBoard = new THREE.BoxGeometry(0.6, 0.25, 0.04);
        sgBoard.translate(0, 0.8, 0);
        const sgArrow = new THREE.BoxGeometry(0.3, 0.04, 0.04);
        sgArrow.translate(0.45, 0.8, 0);
        const mergedSign = mergeBufferGeometries([sgPost, sgBoard, sgArrow]);
        geo = mergedSign || sgPost;
        break;
      }
      case 'bush_round':
        geo = new THREE.SphereGeometry(0.35, 5, 4);
        break;
      case 'grass_blade':
        geo = new THREE.CylinderGeometry(0.01, 0.03, 0.2, 3);
        break;
      case 'windmill': {
        const wBase = new THREE.CylinderGeometry(0.6, 0.8, 1.2, 8);
        wBase.translate(0, 0.6, 0);
        const wTower = new THREE.CylinderGeometry(0.4, 0.6, 0.8, 8);
        wTower.translate(0, 1.6, 0);
        const wRoof = new THREE.ConeGeometry(0.5, 0.4, 8);
        wRoof.translate(0, 2.2, 0);
        const wBlade1 = new THREE.BoxGeometry(0.04, 0.8, 0.15);
        wBlade1.translate(0, 2.0, 0.5);
        const wBlade2 = new THREE.BoxGeometry(0.04, 0.8, 0.15);
        wBlade2.translate(0, 2.0, -0.5);
        const wBlade3 = new THREE.BoxGeometry(0.15, 0.8, 0.04);
        wBlade3.translate(0.5, 2.0, 0);
        const wBlade4 = new THREE.BoxGeometry(0.15, 0.8, 0.04);
        wBlade4.translate(-0.5, 2.0, 0);
        const mergedWindmill = mergeBufferGeometries([wBase, wTower, wRoof, wBlade1, wBlade2, wBlade3, wBlade4]);
        geo = mergedWindmill || wBase;
        break;
      }
      default:
        geo = new THREE.BoxGeometry(0.5, 0.5, 0.5);
    }

    this.geometryCache.set(meshId, geo);
    return geo;
  }

  private getMaterial(meshId: string): THREE.Material {
    const cached = this.materialCache.get(meshId);
    if (cached) return cached;

    const isQuartz = meshId === 'rock_quartz';
    const mat = new THREE.MeshStandardMaterial({
      color: this.getDefaultColor(meshId),
      roughness: isQuartz ? 0.30 : 0.85,
      metalness: isQuartz ? 0.10 : 0.05,
      emissive: isQuartz ? new THREE.Color(0xd0d8e0) : undefined,
      emissiveIntensity: isQuartz ? 0.20 : 0,
      flatShading: true,
    });
    this.materialCache.set(meshId, mat);
    return mat;
  }

  private getDefaultColor(meshId: string): number {
    const colors: Record<string, number> = {
      rock: 0x6b7280, rock_flat: 0x5c6370,
      rock_moss: 0x5a7a5a, rock_quartz: 0xd0d8e0,
      bush: 0x2d5a27, fence: 0x8b7355, fence_corner: 0x8b7355,
      fence_wood: 0x5a4a30, fence_stone: 0x6a6a5a,
      signpost: 0x8b7355, signpost_danger: 0x4a3020,
      lamp: 0x4a5568,
      crate: 0x8b7355, barrel: 0x5c4033,
      ruin_column: 0x7a8a7a, ruin_pillar: 0x7a7a6a, ruin_slab: 0x8a8a7a,
      bridge_plank: 0x5a4030,
      bench: 0x5c4033, cart: 0x8b5e3c, stall: 0x6b4a2e,
      lantern_wall: 0x4a5568, planter_box: 0x5a4a30,
      tree_deciduous: 0x3a7a3a, tree_conifer: 0x2a6a2a,
      fountain: 0x8a9a9a, pillar: 0x5a5a6a, torch: 0x4a3a2a,
      flower_bed: 0x6a3a4a, signpost_guide: 0x6a5a3a,
      bush_round: 0x3a6a2a, grass_blade: 0x4a7a3a,
      windmill: 0x8a7a5a,
    };
    return colors[meshId] || 0x808080;
  }
}

function mergeBufferGeometries(geos: THREE.BufferGeometry[]): THREE.BufferGeometry | null {
  if (geos.length === 0) return null;
  if (geos.length === 1) return geos[0];

  const totalVerts = geos.reduce((s, g) => {
    const pos = g.getAttribute('position');
    return s + (pos ? pos.count : 0);
  }, 0);

  if (totalVerts === 0) return null;

  const merged = new THREE.BufferGeometry();
  const positions: number[] = [];
  const normals: number[] = [];

  for (const g of geos) {
    const pos = g.getAttribute('position');
    const norm = g.getAttribute('normal');
    if (!pos) continue;
    for (let i = 0; i < pos.count; i++) {
      positions.push(pos.getX(i), pos.getY(i), pos.getZ(i));
      if (norm) {
        normals.push(norm.getX(i), norm.getY(i), norm.getZ(i));
      }
    }
  }

  merged.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  if (normals.length > 0) {
    merged.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
  }
  merged.computeVertexNormals();
  return merged;
}

function nextPow2(v: number): number {
  v--;
  v |= v >> 1;
  v |= v >> 2;
  v |= v >> 4;
  v |= v >> 8;
  v |= v >> 16;
  return v + 1;
}
