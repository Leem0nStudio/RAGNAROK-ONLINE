import * as THREE from 'three';
import { MapDefinition } from '../map/types';
import { MapTerrain } from './MapTerrain';
import { PropLibrary } from './PropLibrary';
import { VegetationSystem } from './VegetationSystem';
import { LandmarkSystem } from './LandmarkSystem';

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

  async load(mapDef: MapDefinition): Promise<void> {
    this.clearCurrentMap();

    this.mapTerrain.build(mapDef.width, mapDef.height, mapDef.biome);

    // Preload 3D models for this map's props, then spawn them
    const usedBlueprintIds = new Set<string>();
    for (const prop of mapDef.props) {
      usedBlueprintIds.add(prop.propId);
    }
    const modelIds = Array.from(usedBlueprintIds).filter(id => {
      const bp = this.propLibrary.blueprints.get(id);
      return bp?.modelPath != null;
    });
    if (modelIds.length > 0) {
      await this.propLibrary.preloadBlueprintModels(modelIds);
    }

    for (const prop of mapDef.props) {
      this.propLibrary.addInstances(prop.propId, [{
        blueprintId: prop.propId,
        x: prop.position.x,
        z: prop.position.z,
        scale: prop.scale ?? 1,
        rotationY: prop.rotation ?? 0,
      }]);
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
