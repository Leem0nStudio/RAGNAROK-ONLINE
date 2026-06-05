# ADR-001: 3D Asset Pipeline — GLTF Model Replacement for Procedural Geometry

## Status
Accepted

## Date
2026-06-05

## Context

### Problem Statement
The current game world renders 100% of its static environment geometry (rocks, trees, props, landmarks) using procedural Three.js geometry constructors (`CylinderGeometry`, `BoxGeometry`, `ConeGeometry`, `DodecahedronGeometry`, etc.). This approach has several limitations:

1. **Visual fidelity ceiling** — Procedural geometry with vertex coloring cannot match the appearance of hand-authored, textured models
2. **Art iteration speed** — Changing a rock or tree requires editing TypeScript code, not modifying an asset in Blender
3. **Art pipeline nonexistent** — There is no path for an artist to contribute assets to the game
4. **Material complexity** — PBR materials, normal maps, emissive maps, and blending cannot be expressed through `vertexColors` + `flatShading`
5. **Memory inefficiency** — Each procedural geometry is regenerated every session; GLBs are cached once and reused

### Constraints
- **Asset loading must be asynchronous** — GLTFLoader is async by nature; the current system builds everything synchronously
- **Zero regression on collision** — Collision data lives entirely in `characterController.ts` (RockObstacle, TreeObstacle, PropObstacle interfaces) and must remain untouched
- **InstancedMesh must be preserved** — The current system uses `THREE.InstancedMesh` for all high-count objects (30 rocks, 180 trees, 128 props), keeping draw calls to ~7 for the entire environment. GLTF models must be compatible with `InstancedMesh`
- **No increase in draw calls** — Each asset category must produce exactly one `InstancedMesh` (or two for multi-part assets like trees with trunk + leaves)
- **Mobile performance target** — The game targets mobile browsers; GLB files must be small (< 100 KB per model), single-mesh (no multi-material), and use compressed textures
- **No engine dependency bump** — Three.js is currently pinned at v0.160.0; GLTFLoader is available via `three/examples/jsm/loaders/GLTFLoader.js`

### Requirements
- Must support loading GLB/GLTF files from `public/assets/models/`
- Must produce a `THREE.BufferGeometry` suitable for use with `THREE.InstancedMesh`
- Must keep the existing deterministic PRNG placement system (seeds: trees=1337, props=999) unchanged
- Must keep the existing collision system (circular, interface-based, decoupled) completely unchanged
- Must support per-instance rotation, position, and uniform scale (non-uniform scale is acceptable but must be uniform per-instance for InstancedMesh)
- Must load assets in phases: Rocks first, then Trees, then Props, then Landmarks — each phase must be independently reversible
- Character and monster models remain as 2D Canvas-drawn sprites (out of scope)

## Decision

Replace procedural geometry with GLTF/GLB models loaded via Three.js's GLTFLoader, using InstancedMesh with merged single-mesh GLBs. The replacement will proceed in four incremental phases, each replacing one category of procedural geometry while keeping all other systems (collision, placement, lighting) unchanged.

### Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                     public/assets/models/                    │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐    │
│  │ rocks/   │  │ trees/   │  │ props/   │  │ landmrks/│    │
│  │ rock.glb │  │ tree.glb │  │ crate.glb│  │ arch.glb │    │
│  └──────────┘  └──────────┘  │ brrl.glb │  │ camp.glb │    │
│                              │ sign.glb │  │ port.glb │    │
│                              └──────────┘  └──────────┘    │
└─────────────────────────────────────────────────────────────┘
         │                      │                      │
         ▼                      ▼                      ▼
┌─────────────────────────────────────────────────────────────┐
│                    AssetLoader (singleton)                    │
│  - loadGLTF(url): Promise<THREE.BufferGeometry>              │
│  - getGeometry(key): THREE.BufferGeometry | null             │
│  - preloadAll(): Promise<void>                               │
│  - Geometry cache (Map<string, BufferGeometry>)              │
└─────────────────────────────────────────────────────────────┘
         │                      │                      │
         ▼                      ▼                      ▼
┌─────────────────────────────────────────────────────────────┐
│              EnvironmentInstancedSystem (sceneGraph.ts)       │
│  - spawnInstancedRocks() ← uses loaded rock geometry         │
│  - spawnTrees()          ← uses loaded tree geometry         │
│  - spawnEnvironmentalProps() ← uses loaded prop geometries   │
│  - spawnLandmarks()      ← uses loaded landmark geometries   │
│                                                              │
│  All placement, rotation, scale logic is IDENTICAL to before │
│  Only the geometry source changes: from procedural → GLB     │
└─────────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────┐
│              characterController.ts (UNCHANGED)              │
│  - getRockObstacles() → RockObstacle[]  (x, z, radius,      │
│  - getTreeObstacles() → TreeObstacle[]    visualScale,      │
│  - getPropObstacles() → PropObstacle[]    height, ...)      │
│  - resolveCollisions()                                       │
└─────────────────────────────────────────────────────────────┘
```

### Key Interfaces

```typescript
// lib/game/assetLoader.ts

export interface AssetLoaderInterface {
  /** Load a GLB and return its merged geometry */
  loadGLTF(url: string): Promise<THREE.BufferGeometry>;

  /** Synchronous access to already-loaded geometry */
  getGeometry(key: string): THREE.BufferGeometry | null;

  /** Preload all assets for a given phase */
  preloadPhase(phase: AssetPhase): Promise<void>;

  /** Get load progress as 0-1 */
  getProgress(): number;
}

export type AssetPhase = 'rocks' | 'trees' | 'props' | 'landmarks';

/** Map from asset key to geometry — populated by AssetLoader */
export const assetGeometryCache = new Map<string, THREE.BufferGeometry>();
```

```typescript
// sceneGraph.ts — modified spawn method signatures
// OLD:
//   const drum = new THREE.CylinderGeometry(0.44, 0.44, 1.0, 8);
//   paintGeometry(drum, 0x4c566a);
//   rockParts.push(drum);
//   const colGeo = mergeBufferGeometries(rockParts);

// NEW:
//   const colGeo = assetGeometryCache.get('rock')!;
//   // No paintGeometry needed — GLB has vertex colors or materials baked in
```

## Alternatives Considered

### Alternative 1: Keep procedural geometry, add GLTF as optional overlay
- **Description**: Maintain the existing procedural geometry as a fallback. Load GLTF models only if available, otherwise use procedural geometry.
- **Pros**: Graceful degradation; no loading failures visible to players
- **Cons**: Maintenance burden of two parallel systems; testing matrix doubles; code complexity increases significantly; the procedural "fallback" would never look as good
- **Rejection Reason**: The project is not a toolkit — it ships one version. The procedural geometry is a placeholder, not a fallback. Maintaining both is unnecessary complexity.

### Alternative 2: Convert entire scene to a single GLTF scene loaded as a group
- **Description**: Author the entire map as a single Blender scene with all rocks, trees, props placed in Blender, export as one GLTF, and load it as a static scene group.
- **Pros**: Single file; artists have full control over placement; no code placement logic needed
- **Cons**: Loses the deterministic collision-data alignment (collision data would need to be exported from Blender too); loses InstancedMesh optimization (single scene group would be many individual meshes); makes it impossible to vary per-instance properties (scale, rotation) at runtime; couples asset authoring with gameplay data
- **Rejection Reason**: The decoupling of visual placement from collision data is a core architectural strength. We must not regress on this. InstancedMesh performance is critical for mobile.

### Alternative 3: Use GLTF with Draco / meshopt compression
- **Description**: Compress GLB files with Draco or meshoptimizer to reduce file size and loading time.
- **Pros**: Smaller downloads; faster parsing
- **Cons**: Requires additional decompression libraries; increases JS bundle size; works against the "small GLB" design goal (< 100 KB per model)
- **Rejection Reason**: For models under 100 KB with simple geometry (low-poly stylized), Draco/meshopt adds more overhead than it saves. Deferred as a future optimization if models grow complex.

### Alternative 4: Replace character/monster sprites with GLTF models
- **Description**: Also convert player, NPC, and monster 2D Canvas sprites to 3D GLTF character models.
- **Pros**: Full 3D visual consistency; animation via skeletal rigs
- **Cons**: Massive scope increase; requires rigging, animating, and skinning 10+ character types; the current Canvas-based sprite system supports dynamic equipment rendering (weapon, headgear) that would require a complete character customization system in 3D; animation state machine would need complete rewrite
- **Rejection Reason**: Deliberately deferred. The 2D sprite system works well for the current scope and provides dynamic equipment rendering with zero asset cost. Characters will be addressed in a future ADR.

## Consequences

### Positive
- **Visual quality jump** — Hand-authored models with baked PBR textures replace flat-shaded vertex-colored geometry
- **Artist-friendly pipeline** — An artist can contribute by exporting a GLB from Blender into `public/assets/models/` — no code changes needed
- **Faster iteration** — Model changes are asset swaps, not code edits
- **Smaller code footprint** — ~200 lines of procedural geometry constructor code removed per phase
- **Deterministic placement preserved** — The PRNG-based spawn system continues to control where things go, keeping collision and visuals perfectly aligned
- **InstancedMesh performance preserved** — Still ~7 draw calls for the entire static environment
- **Phase-by-phase reversibility** — Each phase is independent; if GLTF loading causes issues for one category, only that phase is rolled back

### Negative
- **Loading time increases** — GLTFLoader introduces async loading; the game must show a loading state while assets load
- **Asset management overhead** — GLB files must be tracked, versioned, and optimized; an asset manifest is needed
- **Bundle size increases** — GLB files add to the total download size (~200-400 KB total for all phases)
- **Blender dependency** — Model changes require Blender and an artist; procedural geometry could be tweaked by any developer
- **No more runtime geometry generation** — Some visual variety (e.g., random fragment shapes) was free with procedural geometry; GLTF models are fixed and need authored variants for variety

### Risks

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|-----------|
| GLTFLoader fails on some mobile browsers | Low | High | Test on target browsers (Chrome Android, Safari iOS). Fallback: skip loading, show error state. |
| GLB file size too large for mobile data | Medium | Medium | Keep models under 100 KB. Use PNG textures baked at 256×256 or 512×512. |
| GLB geometry doesn't align with collision radii | Medium | Medium | The `visualScale` field on obstacle interfaces allows per-instance visual scaling independent of collision radius. Tune in Blender or via `visualScale`. |
| Blender export produces incompatible GLTF | Low | Medium | Document exact Blender export settings. Use `Three.js` compatibility preset. |
| Instance matrix scaling breaks with non-uniform GLB origin | Low | Medium | GLB must be authored with origin at bottom-center and scale 1 unit = 1 meter. Validate with a test script. |

## Performance Implications

- **CPU**: Loading phase adds ~50-200ms of async parsing on first load. After cache, near-zero CPU impact. Runtime identical (same InstancedMesh update logic).
- **Memory**: Each GLB adds ~50-200 KB of GPU memory (geometry + textures). Total: ~400-800 KB for all phases. The current procedural geometry uses ~200-400 KB. Net increase: ~200-400 KB.
- **Load Time**: Phase 1 (rocks) adds ~50-100ms. Phase 2 (trees) adds ~100-200ms. Phase 3 (props) adds ~100-200ms. Phase 4 (landmarks) adds ~50-100ms. Total: ~300-600ms additional load time. Acceptable.
- **Network**: All GLB files together should be < 500 KB. Next.js static file serving adds ~1-2 HTTP requests per phase (or more if individual files). Mitigation: enable HTTP/2 on production.

## Migration Plan

### Phase 0 — Infrastructure (prerequisite for all phases)
1. Create `public/assets/models/` directory structure
2. Create `lib/game/assetLoader.ts` — GLTF loading wrapper with caching
3. Add GLTFLoader import to the project (from `three/examples/jsm/loaders/GLTFLoader.js`)
4. Create asset manifest (`public/assets/models/manifest.json`)
5. Update `engine.ts` to show a loading screen during asset preload
6. Create test GLB (a simple cube) to validate the pipeline end-to-end

### Phase 1 — Rocks (replaces `spawnInstancedRocks`, lines 769-848)
- Replace: 4 procedural geometries (drum, base, capital, fragment) with 1 GLB (merged rock column)
- New file: `public/assets/models/rocks/rock_column.glb`
- Modify: `sceneGraph.ts` → `spawnInstancedRocks()` uses `assetGeometryCache.get('rock')`
- Remove: ~35 lines of procedural geometry + mergeBufferGeometries + paintGeometry calls
- Keep: All placement logic (30 instances, 4 groups, tilting, visualScale)

### Phase 2 — Trees (replaces `spawnTrees`, lines 979-1052)
- Replace: 5 procedural geometries (trunk, baseFlange, tier1, tier2, tier3) with 2 GLBs (trunk, leaves) or 1 merged GLB per-instance
- Decision: Use 2 GLBs to preserve the trunk/leaves separation for wind sway — OR merge into 1 if wind sway is handled differently
- New files: `public/assets/models/trees/tree_trunk.glb`, `public/assets/models/trees/tree_leaves.glb`
- Modify: `sceneGraph.ts` → `spawnTrees()` uses asset cache
- Remove: ~40 lines of procedural geometry
- Keep: All 180 instances, 4 clusters, scale ranges

### Phase 3 — Props (replaces `spawnEnvironmentalProps` prop section, lines 1430-1611)
- Replace: 10+ procedural geometries (crate + 3 bands, barrel + 4 segments, signpost board + pole) with 3 GLBs
- New files: `public/assets/models/props/crate.glb`, `public/assets/models/props/barrel.glb`, `public/assets/models/props/signpost.glb`
- For signposts, may need 2 GLBs (board + pole) or 1 merged
- Modify: `sceneGraph.ts` → prop spawn methods use asset cache
- Remove: ~80 lines of procedural geometry
- Keep: 128 instances, deterministic placement, fallen barrel rotations

### Phase 4 — Landmarks (replaces `spawnLandmarks`, lines 851-977)
- Replace: ~15 procedural geometries (arch pillars, lintel, rubble, logs, stones, flame) with 3-4 GLBs
- New files: `public/assets/models/landmarks/arch_gate.glb`, `public/assets/models/landmarks/campfire.glb`, `public/assets/models/landmarks/portal.glb`
- These are single meshes, not instanced — loaded as individual `THREE.Mesh`
- Modify: `sceneGraph.ts` → `spawnLandmarks()` uses asset cache
- Remove: ~70 lines of procedural geometry
- Keep: Unique mesh placement, lighting, and rotation

## Validation Criteria

We will know this decision was correct when:

1. **Visual quality** — A side-by-side comparison shows clear visual improvement from procedural to GLTF
2. **Performance parity** — FPS on target mobile device is within 5% of the procedural version
3. **Collision accuracy** — Player cannot walk through any GLTF model that a procedural model would block, and vice versa
4. **Load time acceptable** — Total load time increase is under 1 second on a 4G connection
5. **Asset swap simplicity** — An artist can replace a GLB file and see the change without modifying TypeScript code
6. **Phase independence** — Each phase can be toggled on/off independently via a single configuration flag

## Related Decisions
- MAP_ARCHITECTURE.md — Documents the broader map data-driven system that this asset pipeline supports
- Future ADR: Character/Monster 3D model pipeline (deferred)
- Future ADR: Multi-map asset loading strategy
