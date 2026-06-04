import * as THREE from 'three';
import { MapDefinition } from '../map/types';
import { getBiomePreset } from '../map/biomePresets';
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

  load(mapDef: MapDefinition): void {
    this.clearCurrentMap();

    const preset = getBiomePreset(mapDef.biome);

    // Terrain
    this.mapTerrain.build(mapDef.width, mapDef.height, mapDef.biome);

    // Props from map definition
    for (const prop of mapDef.props) {
      this.propLibrary.addInstances(prop.propId, [{
        blueprintId: prop.propId,
        x: prop.position.x,
        z: prop.position.z,
        scale: prop.scale ?? 1,
        rotationY: prop.rotation ?? 0,
      }]);
    }

    // Biome preset trees & rocks
    const override = mapDef.biomeOverrides;
    const trees = override?.trees ?? preset.trees;
    for (const t of trees) {
      this.propLibrary.addInstances(t.propId, [{
        blueprintId: t.propId,
        x: t.position.x,
        z: t.position.z,
        scale: t.scale ?? 1,
        rotationY: t.rotation ?? Math.random() * Math.PI * 2,
      }]);
    }

    const rocks = override?.rocks ?? preset.rocks;
    for (const r of rocks) {
      this.propLibrary.addInstances(r.propId, [{
        blueprintId: r.propId,
        x: r.position.x,
        z: r.position.z,
        scale: r.scale ?? 1,
        rotationY: r.rotation ?? 0,
      }]);
    }

    // Landmarks: new maps use props instead of voxel landmarks
    // (landmark system preserved for future use)

    // Vegetation will be regenerated each load via
    // the engine's VegetationSystem using biome as key
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
