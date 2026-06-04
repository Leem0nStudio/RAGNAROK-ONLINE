import { MapDefinition, PortalDefinition } from './types';
import { getMapById, findSpawn } from './worldMaps';
import { MapLoader } from '../terrain/MapLoader';
import { PortalManager } from './PortalManager';
import { useGameStore } from '../state';

export type MapContentCallback = (mapDef: MapDefinition) => void;

export class MapManager {
  private loader: MapLoader;
  private portalManager: PortalManager;
  private currentMapId: string | null = null;
  private onMapLoad: MapContentCallback | null = null;

  constructor(loader: MapLoader, portalManager: PortalManager) {
    this.loader = loader;
    this.portalManager = portalManager;

    this.portalManager.onActivateCallback = (portal) => {
      this.transitionTo(portal.targetMapId, portal.targetSpawnId);
    };
  }

  set onMapLoadCallback(cb: MapContentCallback | null) {
    this.onMapLoad = cb;
  }

  async init(entryMapId: string, entrySpawnId: string): Promise<void> {
    const map = getMapById(entryMapId);
    if (!map) {
      console.error(`MapManager: map "${entryMapId}" not found`);
      return;
    }

    const spawn = findSpawn(map, entrySpawnId);
    this.currentMapId = map.id;

    const store = useGameStore.getState();
    store.setCurrentMapId(map.id);
    store.setCurrentMapName(map.name);

    this.loader.load(map);
    this.onMapLoad?.(map);

    if (spawn) {
      // The engine will pick up player position from here
      store.setActivePortal(null);
    }
  }

  async transitionTo(mapId: string, spawnId: string): Promise<void> {
    const targetMap = getMapById(mapId);
    if (!targetMap) {
      console.error(`MapManager: target map "${mapId}" not found`);
      return;
    }

    const store = useGameStore.getState();

    // 1. Fade OUT
    store.setTransitionState('fading_out');
    await this.delay(500);

    // 2. Unload current map
    this.loader.clearCurrentMap();

    // 3. Loading state
    store.setTransitionState('loading');
    await this.delay(200);

    // 4. Load new map
    const spawn = findSpawn(targetMap, spawnId);
    this.currentMapId = targetMap.id;

    store.setCurrentMapId(targetMap.id);
    store.setCurrentMapName(targetMap.name);
    store.addCombatLog(`🌍 Viajando a ${targetMap.name}`, 'system');

    this.loader.load(targetMap);
    this.onMapLoad?.(targetMap);

    // 5. Fade IN
    store.setTransitionState('fading_in');
    await this.delay(500);

    store.setTransitionState('idle');
    store.setActivePortal(null);
  }

  update(playerX: number, playerZ: number, portals: PortalDefinition[]): void {
    this.portalManager.update(playerX, playerZ, portals);
    const activePortal = this.portalManager.getActivePortal();
    useGameStore.getState().setActivePortal(activePortal);
  }

  activatePortal(): void {
    this.portalManager.activate();
  }

  getCurrentMapId(): string | null {
    return this.currentMapId;
  }

  getCurrentMap(): MapDefinition | null {
    return this.currentMapId ? getMapById(this.currentMapId) ?? null : null;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
