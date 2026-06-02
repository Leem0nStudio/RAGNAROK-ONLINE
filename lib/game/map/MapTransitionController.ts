import { MapDef, MapTransition } from './types';
import { MAP_INDEX } from './MapRegistry';
import { useGameStore } from '../state';

export type TransitionPhase = 'idle' | 'banner' | 'complete';

export class MapTransitionController {
  private phase: TransitionPhase = 'idle';
  private bannerTimer = 0;
  private readonly BANNER_DURATION_MS = 2000;

  getPhase(): TransitionPhase {
    return this.phase;
  }

  isTransitioning(): boolean {
    return this.phase !== 'idle';
  }

  startTransition(fromMap: MapDef | null, toMap: MapDef, transition: MapTransition | null): void {
    const store = useGameStore.getState();

    // 1. Show banner
    this.phase = 'banner';
    this.bannerTimer = 0;
    store.showMapTransitionBanner(toMap.name);

    // 2. Update store state
    store.setCurrentMapId(toMap.id);
    store.setCurrentMapName(toMap.name);
    if (toMap.regionId) {
      store.setCurrentRegionId(toMap.regionId);
    }

    // 3. Log the entry
    const fromName = fromMap?.name ?? '—';
    store.addCombatLog(`🌍 ${fromName} → ${toMap.name}`, 'system');
  }

  tick(dt: number): void {
    if (this.phase === 'idle') return;

    this.bannerTimer += dt * 1000;

    if (this.phase === 'banner' && this.bannerTimer >= this.BANNER_DURATION_MS) {
      const store = useGameStore.getState();
      store.hideMapTransitionBanner();
      this.phase = 'idle';
    }
  }

  /** Called when player teleports (no transition animation) */
  instantTeleport(mapId: string): void {
    const map = MAP_INDEX[mapId];
    if (!map) return;

    const store = useGameStore.getState();
    store.setCurrentMapId(map.id);
    store.setCurrentMapName(map.name);
    if (map.regionId) {
      store.setCurrentRegionId(map.regionId);
    }
    this.phase = 'idle';
    store.hideMapTransitionBanner();
  }
}
