# Asset Management Architecture — Epicearth

## Principios

1. **Cero modelos externos** — todo es geometría procedural + Canvas sprites. Mobile-first.
2. **Carga diferida con prioridades** — lo visible se carga primero.
3. **Pool agresivo** — reciclar objetos Three.js en vez de crear/liberar.
4. **Caché unificada** — un solo registry, no 4 sistemas separados.
5. **Sin dependencias de GitHub externo** — los assets van en `public/assets/` o CDN propio.

---

## 1. Asset Registry (`lib/game/assets/AssetRegistry.ts`)

Registry único y centralizado. Reemplaza los 3 sistemas actuales (`imageCache`, `TextureCatalog`, `RenderObjectPool.texturePool`).

```
AssetRegistry (singleton)
├── textures: Map<AssetId, TextureHandle>
├── sprites: Map<AssetId, SpriteHandle>
├── geometries: Map<MeshId, GeometryHandle>
├── materials: Map<MaterialId, MaterialHandle>
├── canvases: CanvasPool (reciclaje)
├── pending: Map<AssetId, Promise<…>>
└── stats: { totalLoaded, totalSize, cacheHits, cacheMisses }
```

### TextureHandle

```typescript
interface TextureHandle {
  texture: THREE.Texture;
  refCount: number;
  lastUsed: number;       // para LRU eviction
  category: 'sprite' | 'atlas' | 'ui' | 'effect';
  width: number;
  height: number;
  loaded: boolean;
}
```

### API

```typescript
class AssetRegistry {
  static get(): AssetRegistry;

  // Texturas de sprite (personajes, monstruos, NPCs)
  getSpriteTexture(entity: Entity): THREE.CanvasTexture;

  // Texturas de atlas (terreno)
  loadAtlas(url: string): Promise<THREE.Texture>;

  // Geometrias procedurales
  getGeometry(meshId: string): THREE.BufferGeometry;

  // Materiales
  getMaterial(key: string, params: MaterialParams): THREE.Material;

  // Canvas pooling
  getCanvas(w: number, h: number): HTMLCanvasElement;
  releaseCanvas(c: HTMLCanvasElement): void;

  // UI Textures (botones, iconos, retratos)
  loadUIImage(url: string): Promise<THREE.Texture>;

  // Mantenimiento
  releaseTexture(id: AssetId): void;
  evictLRU(maxAge: number): void;
  clearUnused(): void;        // refCount === 0
  dumpStats(): AssetStats;
}
```

### Estrategia de eviction

| Categoría | Prioridad | Eviction |
|-----------|-----------|----------|
| sprite (entity) | baja | LRU, 30s sin uso |
| atlas (terreno) | media | LRU, max 8 atlases |
| ui | alta | nunca (pocas, chicas) |
| effect | baja | LRU, 10s sin uso |

---

## 2. Asset Loader (`lib/game/assets/AssetLoader.ts`)

Carga progresiva con prioridades y cola.

```
AssetLoader
├── queue: PriorityQueue<LoadJob>
├── active: Set<AssetId>
├── maxConcurrent: number (3 mobile, 6 desktop)
├── totalProgress: number 0-1
└── callbacks: Map<Event, Set<Function>>
```

### Prioridades

| Tipo | Prioridad | Ejemplo |
|------|-----------|---------|
| player sprite | 1 (crítica) | sprite del personaje |
| chunk atlas | 2 (alta) | texturas de terreno visible |
| mob sprites | 3 (normal) | monstruos en rango |
| npc sprites | 3 (normal) | NPCs cercanos |
| effect textures | 4 (baja) | partículas, VFX |
| ui icons | 4 (baja) | iconos de items |

### API

```typescript
class AssetLoader {
  constructor(registry: AssetRegistry);

  enqueue(assetId: AssetId, priority: number): Promise<void>;

  loadZoneAssets(zone: MapZone): Promise<void>;
  // 1. atlases de los chunks
  // 2. textures de props (si tuvieran)
  // 3. mob sprites si hay alguno visible

  preloadEssential(): Promise<void>;
  // Carga bloqueante al inicio del juego:
  // - player sprites (todas las jobs)
  // - UI framework textures
  // - terrain atlas default

  getProgress(): number;

  onProgress(cb: (pct: number) => void): void;

  pause(): void;
  resume(): void;

  cancelZone(zoneId: string): void;
}
```

### Algoritmo de cola

```
1. Ordenar por prioridad (1 = más alto)
2. Máximo 3 load simultáneos en mobile
3. Al cambiar de zona: cancelar loads de zona anterior
4. Cachear en IndexedDB atlases grandes (>50KB)
```

---

## 3. Sistema de Caché

### Caché en memoria (L1)

- `AssetRegistry` con LRU
- Texturas: max 50MB en mobile, 150MB en desktop
- Geometrías: se comparten por blueprint (no se eliminan)
- Materiales: se comparten por clave material + color

### Caché persistente (L2) — IndexedDB

```typescript
interface PersistentCache {
  get(key: string): Promise<ArrayBuffer | null>;
  set(key: string, data: ArrayBuffer, category: string): Promise<void>;
  has(key: string): Promise<boolean>;
  evict(category: string, maxSize: number): Promise<void>;
  clear(): Promise<void>;
}
```

Se cachea en IndexedDB:
- Atlas de terreno (>50KB, fetch lento)
- Mapas de peso generados (se regeneran, no se cachean)
- NO se cachean sprites procedurales (se generan al vuelo)

### Flujo de carga

```
Solicitud de textura
  ├─ ¿En L1 (AssetRegistry)? → retornar, ++refCount
  ├─ ¿En L2 (IndexedDB)? → cargar a L1, retornar
  └─ Fetch remoto → guardar en L2 → guardar en L1 → retornar
```

---

## 4. Sprite Management (`lib/game/assets/SpriteManager.ts`)

Centraliza la creación y renderizado de sprites de entidades. Reemplaza el dibujo procedural disperso en `renderer.ts`.

```
SpriteManager
├── registry: AssetRegistry
├── canvasPool: CanvasPool
├── drawCache: Map<string, SpriteCacheEntry>
│     key = entityId + job + equipment + state
│     value = { texture, lastFrame, hits }
└── drawFunctions: Map<MobType, DrawFunction>
```

### Draw Cache (optimización crítica)

El cuello de botella actual: se redibuja el canvas **cada frame** para cada entidad.

```
SpriteManager.drawCache:
  key: hash(entity.mobType, entity.state, hitColor, isDead)
  value: THREE.CanvasTexture
  ttl: 500ms (se invalida al cambiar state o tomar daño)
```

Esto reduce el draw rate de 60fps por entidad a ~2-3fps por entidad.

### Draw Functions Registry

```typescript
type DrawFunction = (
  ctx: CanvasRenderingContext2D,
  entity: Entity,
  params: { isDead: boolean; hitColor: string | null; bounceY: number }
) => void;

registerMobDraw(mobType: string, fn: DrawFunction): void;
```

Los draw functions se registran al iniciar y se buscan por mobType. Caen a default si no existe.

### EntitySpriteNode refactor

```typescript
class EntitySpriteNode extends VisualNode {
  onUpdate(dt, cameraPos) {
    const cached = spriteManager.getCachedTexture(this.entity);
    if (cached !== this.currentTexture) {
      this.sprite.material.map = cached;
      this.sprite.material.needsUpdate = true;
      this.currentTexture = cached;
    }
  }
}
```

---

## 5. Model Management (`lib/game/assets/ModelManager.ts`)

Maneja geometrías procedurales y su instanciación. NO hay GLTF/OBJ — todo es generado en código.

```
ModelManager
├── geometryCache: Map<string, THREE.BufferGeometry>
├── materialCache: Map<string, THREE.Material>
├── mergedGeometries: Map<string, THREE.BufferGeometry>
├── instancedPools: Map<string, InstancedPoolEntry>
└── totalInstances: number
```

### Geometrías registradas

| MeshId | Geometría | Uso |
|--------|-----------|-----|
| `cube` | BoxGeometry(1,1,1) | props base |
| `cylinder` | CylinderGeometry(0.2,0.35,4) | tronco árbol |
| `cone` | ConeGeometry(2.5,5) | copa árbol |
| `dodecahedron` | DodecahedronGeometry(0.8) | arbusto |
| `sphere` | SphereGeometry(0.5) | roca pequeña |
| `torch` | merged Cylinder+Sphere | antorcha |
| `lamp_post` | merged | farola |
| `signpost` | merged Cylinder+Box | cartel |
| `fence_wood` | merged | valla |
| `cube_marble` | material preset | castillo |
| `cube_stone` | material preset | castillo |
| `cube_roof` | material preset | tejado |

### Instancing Strategy

```typescript
interface InstancedPoolEntry {
  mesh: THREE.InstancedMesh;
  blueprintId: string;
  maxInstances: number;
  currentCount: number;
  dirty: boolean;
}
```

Cada `blueprintId` tiene UNA `InstancedMesh`. Todas las instancias de ese blueprint comparten draw call.

```
Ejemplo: 150 árboles deciduos
→ 1 InstancedMesh con 150 instances
→ 1 draw call (en vez de 150)
→ ~182 draw calls totales para toda la región
```

### ModelManager API

```typescript
class ModelManager {
  registerBlueprint(id: string, meshId: string, materialParams: MaterialParams): void;

  addInstances(blueprintId: string, instances: InstanceData[]): void;
  // Crea o agranda el InstancedMesh

  removeInstances(blueprintId: string, count: number): void;

  clearBlueprint(blueprintId: string): void;

  clearAll(): void;

  getDrawCallCount(): number;
  getInstanceCount(): number;
}
```

---

## 6. Instancing para Props (PropLibrary refactor)

El `PropLibrary` actual ya usa `InstancedMesh`. La mejora es unificarlo con `ModelManager` y agregar:

### Mejoras

1. **LOD por instancia** — no por blueprint (árboles lejanos usan geometría simplificada)
2. **Frustum culling nativo** — Three.js ya lo hace, pero verificar que esté habilitado
3. **Batch updates** — `addInstances` acepta array, una sola llamada `setMatrix` por lote
4. **Auto-capacidad** — `nextPow2()` existente, mantenerlo
5. **Shadow culling** — solo las instancias visibles proyectan sombra

### Blueprint Registry

```typescript
interface PropBlueprint {
  id: string;
  meshId: string;
  materialParams: MaterialParams;
  scaleRange: [number, number];
  rotationYRange: [number, number];
  collisionRadius: number;
  castShadow: boolean;
  lodDistances: [number, number];
  maxInstances?: number;
}
```

---

## 7. Streaming de Assets (`lib/game/assets/AssetStreamer.ts`)

Integración con `MapStreamer` para cargar/descargar assets por zona.

```
AssetStreamer
├── loader: AssetLoader
├── registry: AssetRegistry
├── currentZone: MapZone | null
├── loadedZones: Set<ZoneId>
└── preloadRadius: number (1 = zona vecina)
```

### Flujo

```
1. MapStreamer.update() cambia chunk
2. MapStreamer.onZoneChange(zone)
3. AssetStreamer.onZoneEnter(zone)
   a. loader.loadZoneAssets(zone)
   b. preload vecinas (preloadRadius)
4. AssetStreamer.onZoneLeave(zoneId)
   a. registry.evictZoneAssets(zoneId)
   b. loader.cancelZone(zoneId)
```

### Preload predictivo

Cuando el jugador se mueve en dirección este, pre-cargar assets de la zona este antes de que llegue.

```typescript
predictivePreload(playerVelocity: { x, z }, zones: MapZone[]): void {
  // 1. Predecir zona destino según velocidad
  // 2. Si es distinta a current, pre-cargar sus assets
}
```

### AssetBundle

Cada zona define qué assets necesita:

```typescript
interface ZoneAssetBundle {
  zoneId: string;
  atlases: string[];          // texturas de terreno
  mobSprites: MobType[];      // tipos de monstruo que spawnean
  propBlueprints: string[];   // blueprints de props usados
  textures: string[];         // texturas adicionales
  estimatedSize: number;      // KB estimados
}
```

Se genera estáticamente desde `ZonePresets`:

```typescript
function generateAssetBundle(zone: MapZone): ZoneAssetBundle {
  return {
    zoneId: zone.id,
    atlases: [...new Set(zone.chunks.map(c => c.tileAtlas))],
    mobSprites: [...new Set(zone.monsterSpawns?.map(s => s.mobType).filter(Boolean) as MobType[])],
    propBlueprints: [...new Set(zone.props.map(p => p.blueprintId))],
    textures: [],
    estimatedSize: zone.chunks.length * 50 + (zone.monsterSpawns?.length ?? 0) * 2,
  };
}
```

---

## 8. Organización de Carpetas

```
public/
  assets/
    characters/           ← sprites de personajes (locales, no GitHub)
      novice_f.png
      novice_m.png
      swordman_f.png
      archer_f.png
      mage_f.png
      thief_f.png
      acolyte_f.png
      knight_f.png
      wizard_f.png
      priest_f.png
      hunter_f.png
      sniper_f.png
      lord_knight_f.png
      high_wizard_f.png
      ...
    monsters/             ← sprites de monstruos
      poring.png
      poporing.png
      pecopeco.png
      baphomet.png
      lunatic.png
      fabre.png
      chonchon.png
      savage_baby.png
      picky.png
      mandragora.png
    npcs/
      kafra.png
      crusader.png
    props/                ← texturas de props (si se agregan)
      wood.png
      stone.png
      marble.png
    ui/                   ← UI textures
      btn_attack.png
      btn_skill.png
      icon_hp.png
      icon_sp.png
      icon_potion.png
      portrait_placeholder.png
      logo.png
    effects/              ← texturas de efectos/partículas
      fire.png
      ice.png
      holy.png
      particle.png
    atlas/                ← atlases de terreno
      terrain_atlas.png
      forest_atlas.png
      lava_atlas.png
      desert_atlas.png
      snow_atlas.png
      dungeon_atlas.png

lib/
  game/
    assets/               ← Nuevo módulo
      AssetRegistry.ts
      AssetLoader.ts
      AssetStreamer.ts
      SpriteManager.ts
      ModelManager.ts
      PersistentCache.ts
      CanvasPool.ts        ← extraído de sceneGraph
      index.ts
    terrain/              ← existente, sin cambios mayores
      ...
    renderer.ts           ← refactor: delegar sprite drawing a SpriteManager
    sceneGraph.ts         ← refactor: EntitySpriteNode usa SpriteManager
    engine.ts             ← init: AssetRegistry, preloadEssential
```

---

## Integración con el Sistema Actual

### Fase 1 (inmediata)

1. Crear `AssetRegistry` que unifique `imageCache` + `TextureCatalog` + `RenderObjectPool.texturePool`
2. Extraer `CanvasPool` de `sceneGraph.ts` a `assets/CanvasPool.ts`
3. Crear `SpriteManager.drawCache` — cache de texturas por (mobType, state, hit)
4. `EntitySpriteNode.onUpdate()` usa `SpriteManager.getCachedTexture()` en vez de `rendererRef.createEntityTexture()`

### Fase 2 (media)

5. `AssetLoader` con cola de prioridades
6. `AssetStreamer` integrado con `MapStreamer.onZoneChange`
7. `ModelManager` unifica `PropLibrary` + `EnvironmentInstancedSystem`

### Fase 3 (futuro)

8. Migrar sprites de GitHub a `public/assets/`
9. `PersistentCache` con IndexedDB para atlases
10. Predictive preload por velocidad del jugador

---

## Directorios de Assets

Se creó la estructura de directorios en `public/` para assets locales:

```
public/
  sprites/
    player/       → 4 PNGs (novice, swordsman, priest, acolyte)
    monsters/     → [placeholders]
    npcs/         → [placeholders]
    items/        → [placeholders]
    effects/      → [placeholders]
    ui/           → [placeholders]
    README.md
  textures/
    tiles/        → [placeholders]
    terrain/      → [placeholders]
    skyboxes/     → [placeholders]
    README.md
  audio/          → [placeholders]
```

El motor actual dibuja sprites proceduralmente via Canvas2D (`SpriteManager.ts`).
Los PNGs en `public/sprites/player/` son referencias; la Fase 3 migrará a sprite sheets cargados via `AssetRegistry`.

---

## Métricas Objetivo

| Métrica | Actual | Objetivo |
|---------|--------|----------|
| Draw calls por frame | ~200+ | <150 |
| Texturas de sprite por frame | N por entidad | 1 por entidad cada ~500ms |
| Memoria de texturas | ~100MB+ | <50MB mobile |
| Tiempo de carga inicial | ~3s | <1.5s |
| Tiempo de cambio de zona | ~500ms | <200ms |
| Cache hits | ~60% | >90% |
