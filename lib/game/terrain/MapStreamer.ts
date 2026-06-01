import * as THREE from 'three';
import { TerrainChunkData, PropInstance, MapZone, SubzoneDef, RegionDef } from '../types';
import { TerrainChunk } from './TerrainChunk';
import { PropLibrary } from './PropLibrary';
import { VegetationSystem } from './VegetationSystem';
import { LandmarkSystem } from './LandmarkSystem';

interface ZoneEntry {
  zone: MapZone;
  cxStart: number;
  cxEnd: number;
  czStart: number;
  czEnd: number;
}

interface ChunkInstance {
  chunk: TerrainChunk;
  cx: number;
  cz: number;
  lastActive: number;
  distance: number;
}

export type ZoneChangeCallback = (zone: MapZone) => void;
export type SubzoneChangeCallback = (subzone: SubzoneDef) => void;

export class MapStreamer {
  private scene: THREE.Scene;
  private activeChunks: Map<string, ChunkInstance> = new Map();
  private chunkPool: TerrainChunk[] = [];
  private maxActiveChunks = 9;
  private loadRadius = 3;
  private chunkSize = 32;

  private propLibrary: PropLibrary;
  private vegetationSystem: VegetationSystem;
  private landmarkSystem: LandmarkSystem;

  private currentZone: MapZone | null = null;
  private currentZoneId: string | null = null;
  private playerChunkX = 0;
  private playerChunkZ = 0;

  private predictionDx = 0;
  private predictionDz = 0;

  private pendingLoads: Map<string, Promise<void>> = new Map();

  private zoneRegistry: ZoneEntry[] = [];
  private subzoneRegistry: Map<string, SubzoneDef> = new Map();
  private currentSubzoneId: string | null = null;
  public onZoneChange: ZoneChangeCallback | null = null;
  public onSubzoneChange: SubzoneChangeCallback | null = null;

  constructor(
    scene: THREE.Scene,
    propLibrary: PropLibrary,
    vegetationSystem: VegetationSystem,
    landmarkSystem: LandmarkSystem
  ) {
    this.scene = scene;
    this.propLibrary = propLibrary;
    this.vegetationSystem = vegetationSystem;
    this.landmarkSystem = landmarkSystem;
  }

  registerZones(zones: MapZone[]) {
    for (const zone of zones) {
      let cxMin = Infinity, cxMax = -Infinity, czMin = Infinity, czMax = -Infinity;
      for (const ch of zone.chunks) {
        if (ch.cx < cxMin) cxMin = ch.cx;
        if (ch.cx > cxMax) cxMax = ch.cx;
        if (ch.cz < czMin) czMin = ch.cz;
        if (ch.cz > czMax) czMax = ch.cz;
      }
      this.zoneRegistry.push({ zone, cxStart: cxMin, cxEnd: cxMax, czStart: czMin, czEnd: czMax });
    }
  }

  registerSubzones(regions: RegionDef[]) {
    for (const region of regions) {
      for (const subzone of region.subzones) {
        this.subzoneRegistry.set(subzone.zoneId, subzone);
      }
    }
  }

  private detectZone(cx: number, cz: number): MapZone | null {
    for (const entry of this.zoneRegistry) {
      if (cx >= entry.cxStart && cx <= entry.cxEnd && cz >= entry.czStart && cz <= entry.czEnd) {
        return entry.zone;
      }
    }
    return null;
  }

  async loadZone(zone: MapZone) {
    this.unloadAll();
    this.currentZone = zone;
    this.currentZoneId = zone.id;

    // Limpiar props, vegetación y landmarks del zone anterior
    this.propLibrary.clearAll();
    this.vegetationSystem.clear();
    this.landmarkSystem.clear();

    for (const def of zone.landmarks) {
      this.landmarkSystem.addLandmark(def);
    }

    const loadPromises = zone.chunks.map(chunk =>
      this.loadChunk(chunk.cx, chunk.cz)
    );
    await Promise.all(loadPromises);
  }

  async loadChunk(cx: number, cz: number): Promise<void> {
    const key = `${cx},${cz}`;
    if (this.activeChunks.has(key)) return;
    if (this.pendingLoads.has(key)) return this.pendingLoads.get(key)!;

    // Buscar chunk en todas las zonas registradas
    let chunkData: TerrainChunkData | undefined;
    for (const entry of this.zoneRegistry) {
      chunkData = entry.zone.chunks.find(c => c.cx === cx && c.cz === cz);
      if (chunkData) break;
    }
    if (!chunkData) return;

    const promise = this.instantiateChunk(chunkData);
    this.pendingLoads.set(key, promise);
    await promise;
    this.pendingLoads.delete(key);
  }

  private async instantiateChunk(data: TerrainChunkData) {
    const key = `${data.cx},${data.cz}`;

    // Encontrar la zona que contiene este chunk
    let zoneForChunk: MapZone | undefined;
    for (const entry of this.zoneRegistry) {
      if (data.cx >= entry.cxStart && data.cx <= entry.cxEnd &&
          data.cz >= entry.czStart && data.cz <= entry.czEnd) {
        zoneForChunk = entry.zone;
        break;
      }
    }
    if (!zoneForChunk) zoneForChunk = this.currentZone || undefined;
    if (!zoneForChunk) return;

    let chunk = this.chunkPool.pop();
    if (!chunk) {
      chunk = new TerrainChunk(this.scene);
    }

    await chunk.build(data);
    chunk.setVisible(true);

    this.activeChunks.set(key, {
      chunk,
      cx: data.cx,
      cz: data.cz,
      lastActive: performance.now(),
      distance: 0,
    });

    // Spawn props for this chunk
    const chunkProps = zoneForChunk.props.filter(p => {
      const px = p.x;
      const pz = p.z;
      const chunkMinX = data.cx * this.chunkSize;
      const chunkMinZ = data.cz * this.chunkSize;
      return (
        px >= chunkMinX && px < chunkMinX + this.chunkSize &&
        pz >= chunkMinZ && pz < chunkMinZ + this.chunkSize
      );
    });

    const byBlueprint = new Map<string, PropInstance[]>();
    for (const prop of chunkProps) {
      const list = byBlueprint.get(prop.blueprintId) || [];
      list.push(prop);
      byBlueprint.set(prop.blueprintId, list);
    }
    Array.from(byBlueprint.entries()).forEach(([bpId, instances]) => {
      this.propLibrary.addInstances(bpId, instances);
    });

    // Spawn vegetation for this chunk
    for (const vegLayer of zoneForChunk.vegetation) {
        const vegInstances: Array<{ x: number; z: number; scale: number }> = [];
        const seed = hash(data.cx * 1000 + data.cz);
        const rng = mulberry32(seed);

        const count = Math.floor(vegLayer.density * (this.chunkSize / 4));
        const chunkMinX = data.cx * this.chunkSize;
        const chunkMinZ = data.cz * this.chunkSize;

        for (let i = 0; i < count; i++) {
          vegInstances.push({
            x: chunkMinX + rng() * this.chunkSize,
            z: chunkMinZ + rng() * this.chunkSize,
            scale: 0.5 + rng() * 0.7,
          });
        }

        this.vegetationSystem.addLayer(vegLayer, vegInstances);
    }
  }

  update(playerX: number, playerZ: number, playerVx: number, playerVz: number) {
    const cx = Math.floor(playerX / this.chunkSize);
    const cz = Math.floor(playerZ / this.chunkSize);

    this.predictionDx = playerVx;
    this.predictionDz = playerVz;

    // Detectar cambio de zona y subzona
    if ((cx !== this.playerChunkX || cz !== this.playerChunkZ) && this.zoneRegistry.length > 0) {
      const newZone = this.detectZone(cx, cz);
      if (newZone && newZone.id !== this.currentZoneId) {
        this.currentZoneId = newZone.id;
        if (this.onZoneChange) {
          this.onZoneChange(newZone);
        }
        // Detectar cambio de subzona
        const subzone = newZone.subzoneId ? this.subzoneRegistry.get(newZone.id) : null;
        if (subzone && subzone.id !== this.currentSubzoneId) {
          this.currentSubzoneId = subzone.id;
          if (this.onSubzoneChange) {
            this.onSubzoneChange(subzone);
          }
        }
      } else if (newZone && newZone.id === this.currentZoneId) {
        // Mismo zone, verificar si la subzona cambió (e.g. via teleport)
        const subzone = newZone.subzoneId ? this.subzoneRegistry.get(newZone.id) : null;
        if (subzone && subzone.id !== this.currentSubzoneId) {
          this.currentSubzoneId = subzone.id;
          if (this.onSubzoneChange) {
            this.onSubzoneChange(subzone);
          }
        }
      }
    }

    if (cx === this.playerChunkX && cz === this.playerChunkZ) {
      this.updateDistances(playerX, playerZ);
      return;
    }

    this.playerChunkX = cx;
    this.playerChunkZ = cz;

    const toLoad: Array<{ cx: number; cz: number }> = [];

    for (let dz = -this.loadRadius; dz <= this.loadRadius; dz++) {
      for (let dx = -this.loadRadius; dx <= this.loadRadius; dx++) {
        const dist = Math.sqrt(dx * dx + dz * dz);
        if (dist > this.loadRadius) continue;

        // Weight toward predicted direction
        const dirWeight = (dx * this.predictionDx + dz * this.predictionDz) * 0.05;
        const priority = dist - dirWeight;

        const chunkCx = cx + dx;
        const chunkCz = cz + dz;
        const key = `${chunkCx},${chunkCz}`;

        if (!this.activeChunks.has(key) && !this.pendingLoads.has(key)) {
          toLoad.push({ cx: chunkCx, cz: chunkCz, priority } as any);
        }
      }
    }

    toLoad.sort((a, b) => (a as any).priority - (b as any).priority);
    for (const item of toLoad.slice(0, 3)) {
      this.loadChunk(item.cx, item.cz);
    }

    this.evictFarChunks(playerX, playerZ);
    this.updateDistances(playerX, playerZ);

    // Update landmark LOD
    const cameraPos = new THREE.Vector3(playerX, 0, playerZ);
    this.landmarkSystem.updateLOD(cameraPos);
  }

  private updateDistances(playerX: number, playerZ: number) {
    for (const inst of Array.from(this.activeChunks.values())) {
      const centerX = (inst.cx + 0.5) * this.chunkSize;
      const centerZ = (inst.cz + 0.5) * this.chunkSize;
      inst.distance = Math.sqrt(
        (centerX - playerX) ** 2 + (centerZ - playerZ) ** 2
      );
      inst.lastActive = performance.now();

      const maxDist = (this.loadRadius + 1) * this.chunkSize;
      inst.chunk.setVisible(inst.distance < maxDist);
    }
  }

  private evictFarChunks(playerX: number, playerZ: number) {
    const cx = Math.floor(playerX / this.chunkSize);
    const cz = Math.floor(playerZ / this.chunkSize);
    const margin = this.loadRadius + 1;

    const toRemove: string[] = [];
    Array.from(this.activeChunks.entries()).forEach(([key, inst]) => {
      if (Math.abs(inst.cx - cx) > margin || Math.abs(inst.cz - cz) > margin) {
        toRemove.push(key);
      }
    });

    while (this.activeChunks.size - toRemove.length > this.maxActiveChunks) {
      let farthestKey = '';
      let farthestDist = -1;
      Array.from(this.activeChunks.entries()).forEach(([key, inst]) => {
        if (inst.distance > farthestDist && !toRemove.includes(key)) {
          farthestDist = inst.distance;
          farthestKey = key;
        }
      });
      if (farthestKey) toRemove.push(farthestKey);
    }

    for (let i = 0; i < toRemove.length; i++) {
      this.unloadChunk(toRemove[i]);
    }
  }

  unloadChunk(key: string) {
    const inst = this.activeChunks.get(key);
    if (!inst) return;

    inst.chunk.setVisible(false);
    inst.chunk.clear();

    this.chunkPool.push(inst.chunk);
    this.activeChunks.delete(key);
  }

  unloadAll() {
    for (const key of Array.from(this.activeChunks.keys())) {
      this.unloadChunk(key);
    }
    this.activeChunks.clear();
  }

  getActiveChunks(): ChunkInstance[] {
    return Array.from(this.activeChunks.values());
  }

  getActiveCollisionCells(): Array<{ x: number; z: number; radius: number }> {
    const cells: Array<{ x: number; z: number; radius: number }> = [];
    for (const inst of Array.from(this.activeChunks.values())) {
      const chunkCells = inst.chunk.getCollisionCells();
      for (let i = 0; i < chunkCells.length; i++) {
        cells.push(chunkCells[i]);
      }
    }
    // Also add landmark collision
    const landmarkPositions = this.landmarkSystem.getLandmarkPositions();
    for (let i = 0; i < landmarkPositions.length; i++) {
      cells.push(landmarkPositions[i]);
    }
    return cells;
  }

  getCurrentSubzone(): SubzoneDef | null {
    if (!this.currentSubzoneId) return null;
    return this.subzoneRegistry.get(this.currentSubzoneId) ?? null;
  }

  getCurrentZoneId(): string | null {
    return this.currentZoneId;
  }

  getCurrentZoneName(): string {
    if (!this.currentZoneId) return '—';
    for (const entry of this.zoneRegistry) {
      if (entry.zone.id === this.currentZoneId) return entry.zone.name;
    }
    return this.currentZoneId;
  }

  getPlayerChunkCoords(): [number, number] {
    return [this.playerChunkX, this.playerChunkZ];
  }

  dispose() {
    this.unloadAll();
    for (const chunk of this.chunkPool) {
      chunk.dispose();
    }
    this.chunkPool = [];
    this.pendingLoads.clear();
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
