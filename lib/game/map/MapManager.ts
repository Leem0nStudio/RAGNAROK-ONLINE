import { MapDef, MapTransition, RegionDefMap, MapState } from './types';
import { MAP_INDEX, REGION_INDEX, findMapByPosition, findTransition } from './MapRegistry';

export type MapChangeCallback = (fromMap: MapDef | null, toMap: MapDef, transition: MapTransition | null) => void;

export class MapManager {
  private current: MapDef | null = null;
  private previous: MapDef | null = null;
  private onChange: MapChangeCallback | null = null;
  private _lastTransitionTime = 0;
  private readonly TRANSITION_COOLDOWN = 500; // ms between transitions

  set onChangeCallback(cb: MapChangeCallback | null) {
    this.onChange = cb;
  }

  getCurrentMap(): MapDef | null {
    return this.current;
  }

  getPreviousMap(): MapDef | null {
    return this.previous;
  }

  getCurrentRegion(): RegionDefMap | null {
    if (!this.current) return null;
    return REGION_INDEX[this.current.regionId] ?? null;
  }

  getState(): MapState {
    return {
      currentMapId: this.current?.id ?? null,
      previousMapId: this.previous?.id ?? null,
      transitionProgress: 0,
    };
  }

  /** Called every fixed tick from the engine */
  update(playerX: number, playerZ: number): void {
    const now = Date.now();
    if (now - this._lastTransitionTime < this.TRANSITION_COOLDOWN) return;

    const found = findMapByPosition(playerX, playerZ);

    if (!found) return;

    // Still inside the current map — check if player entered a transition trigger zone
    if (this.current && found.id === this.current.id) {
      const transition = findTransition(this.current, playerX, playerZ);
      if (transition) {
        const targetMap = MAP_INDEX[transition.targetMapId];
        if (targetMap) {
          const fromMap = this.current;
          this.previous = this.current;
          this.current = targetMap;
          this._lastTransitionTime = now;
          if (this.onChange) {
            this.onChange(fromMap, targetMap, transition);
          }
        }
      }
      return;
    }

    // Map changed!
    const fromMap = this.current;
    const transition = fromMap ? findTransition(fromMap, playerX, playerZ) : null;

    this.previous = this.current;
    this.current = found;

    if (this.onChange) {
      this.onChange(fromMap, found, transition);
    }
  }

  /** Teleport the player to a specific map */
  teleportTo(mapId: string, spawnX?: number, spawnZ?: number): boolean {
    const map = MAP_INDEX[mapId];
    if (!map) return false;

    const fromMap = this.current;
    this.previous = this.current;
    this.current = map;

    if (this.onChange) {
      this.onChange(fromMap, map, null);
    }
    return true;
  }

  /** Force-set the current map (used during init) */
  setCurrentMap(mapId: string): boolean {
    const map = MAP_INDEX[mapId];
    if (!map) return false;
    this.current = map;
    this.previous = null;
    return true;
  }
}
