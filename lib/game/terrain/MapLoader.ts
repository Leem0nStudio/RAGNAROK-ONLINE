import * as THREE from 'three';
import { MapDef } from '../map/types';
import { PropInstance } from '../types';
import { MapTerrain } from './MapTerrain';
import { PropLibrary } from './PropLibrary';
import { VegetationSystem } from './VegetationSystem';
import { LandmarkSystem } from './LandmarkSystem';
import { getTerrainData } from './ZonePresets';

function mulberry32(seed: number): () => number {
  return () => {
    seed |= 0; seed = seed + 0x6D2B79F5 | 0;
    let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

export class MapLoader {
  private mapTerrain: MapTerrain;
  private propLibrary: PropLibrary;
  private vegetationSystem: VegetationSystem;
  private landmarkSystem: LandmarkSystem;
  private currentMapId: string | null = null;

  constructor(
    scene: THREE.Scene,
    propLibrary: PropLibrary,
    vegetationSystem: VegetationSystem,
    landmarkSystem: LandmarkSystem
  ) {
    this.mapTerrain = new MapTerrain(scene);
    this.propLibrary = propLibrary;
    this.vegetationSystem = vegetationSystem;
    this.landmarkSystem = landmarkSystem;
  }

  loadMap(mapDef: MapDef): void {
    const { xMin, xMax, zMin, zMax } = mapDef.bounds;
    const sizeX = xMax - xMin;
    const sizeZ = zMax - zMin;

    this.clearCurrentMap();

    this.mapTerrain.build(xMin, xMax, zMin, zMax, mapDef.lightingPreset);

    const data = getTerrainData(mapDef.id);
    if (data) {
      const byBlueprint = new Map<string, PropInstance[]>();
      for (const prop of data.props) {
        const list = byBlueprint.get(prop.blueprintId) ?? [];
        list.push(prop);
        byBlueprint.set(prop.blueprintId, list);
      }
      byBlueprint.forEach((instances, bpId) => {
        this.propLibrary.addInstances(bpId, instances);
      });

      const seed = hashString(mapDef.id);
      const rng = mulberry32(seed);
      for (const vegLayer of data.vegetation) {
        const vegInstances: Array<{ x: number; z: number; scale: number }> = [];
        const count = Math.min(
          vegLayer.instanceCount,
          Math.floor(vegLayer.density * (sizeX * sizeZ) / 16)
        );
        for (let i = 0; i < count; i++) {
          vegInstances.push({
            x: xMin + rng() * sizeX,
            z: zMin + rng() * sizeZ,
            scale: 0.5 + rng() * 0.7,
          });
        }
        this.vegetationSystem.addLayer(vegLayer, vegInstances);
      }

      for (const lm of data.landmarks) {
        this.landmarkSystem.addLandmark(lm);
      }
    }

    this.currentMapId = mapDef.id;
  }

  getHeightAt(x: number, z: number): number {
    return this.mapTerrain.getHeightAt(x, z);
  }

  getCollisionCells(): Array<{ x: number; z: number; radius: number }> {
    const cells: Array<{ x: number; z: number; radius: number }> = [];
    for (const c of this.mapTerrain.collisionCells) {
      cells.push(c);
    }
    const landmarkPositions = this.landmarkSystem.getLandmarkPositions();
    for (const lp of landmarkPositions) {
      cells.push(lp);
    }
    return cells;
  }

  updateWater(time: number): void {
    this.mapTerrain.updateWater(time);
  }

  getCurrentMapId(): string | null {
    return this.currentMapId;
  }

  clearCurrentMap(): void {
    this.mapTerrain.clear();
    this.propLibrary.clearAll();
    this.vegetationSystem.clear();
    this.landmarkSystem.clear();
    this.currentMapId = null;
  }

  dispose(): void {
    this.clearCurrentMap();
    this.mapTerrain.dispose();
  }
}

function hashString(s: string): number {
  let hash = 0;
  for (let i = 0; i < s.length; i++) {
    const char = s.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return Math.abs(hash);
}
