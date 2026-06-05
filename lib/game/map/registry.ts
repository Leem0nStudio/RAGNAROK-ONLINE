import { MapDefinition } from './types';

/**
 * MapRegistry – A simple registry of all available map definitions.
 *
 * Maps are registered once at startup and looked up by their string id.
 * This decouples the engine from any specific map's data: the engine
 * simply asks the registry for the current map.
 */
export class MapRegistry {
  private maps = new Map<string, MapDefinition>();

  /** Register a map definition. Overwrites if id already exists. */
  register(map: MapDefinition): void {
    this.maps.set(map.id, map);
  }

  /** Retrieve a map definition by id. Returns undefined if not found. */
  get(id: string): MapDefinition | undefined {
    return this.maps.get(id);
  }

  /** Get all registered map ids. */
  list(): string[] {
    return Array.from(this.maps.keys());
  }

  /** Number of registered maps. */
  get size(): number {
    return this.maps.size;
  }
}

/** Global singleton map registry for the game. */
export const MAP_REGISTRY = new MapRegistry();
