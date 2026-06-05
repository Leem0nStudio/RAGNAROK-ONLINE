# Implementation Plan: 3D Asset Pipeline — GLTF Model Replacement

## Overview

Replace 100% procedural Three.js geometry with GLTF/GLB models across 4 phases. Each phase is independently rollback-able and produces its own set of file changes.

**Principle**: No changes to collision data (`characterController.ts`). No changes to deterministic placement logic. Only geometry creation changes from procedural constructors to GLTF-loaded geometry.

---

## Phase 0: Infrastructure (Foundation)

This phase creates the asset loading pipeline that all subsequent phases depend on. It must be completed first and tested end-to-end before any visual replacement begins.

### Files to Create

#### 1. `public/assets/models/manifest.json`
```json
{
  "version": "1.0.0",
  "assets": {
    "rocks": {
      "rock_column": "/assets/models/rocks/rock_column.glb"
    },
    "trees": {
      "tree_trunk": "/assets/models/trees/tree_trunk.glb",
      "tree_leaves": "/assets/models/trees/tree_leaves.glb"
    },
    "props": {
      "crate": "/assets/models/props/crate.glb",
      "barrel": "/assets/models/props/barrel.glb",
      "signpost": "/assets/models/props/signpost.glb"
    },
    "landmarks": {
      "arch_gate": "/assets/models/landmarks/arch_gate.glb",
      "campfire_base": "/assets/models/landmarks/campfire_base.glb",
      "campfire_flame": "/assets/models/landmarks/campfire_flame.glb"
    }
  }
}
```

#### 2. `lib/game/assetLoader.ts` — NEW FILE

This is the core loading infrastructure. It provides:
- Async GLTF loading via `GLTFLoader`
- Geometry extraction (single-mesh assumption — uses `scene.children[0]` geometry)
- In-memory geometry cache (`Map<string, THREE.BufferGeometry>`)
- Preloading by phase
- Progress tracking

**Design decisions:**
- Uses a singleton pattern (or exported module-level state) — no instantiation needed
- Each GLB is expected to contain exactly **one mesh** (merged in Blender before export)
- Geometry is cached indefinitely (static environment never changes)
- Errors are caught per-file; a failed load for one asset doesn't block the whole phase

**Key code sketch:**

```typescript
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

const loader = new GLTFLoader();
const geometryCache = new Map<string, THREE.BufferGeometry>();
let loadProgress = 0;

export async function loadGLTF(key: string, url: string): Promise<THREE.BufferGeometry> {
  if (geometryCache.has(key)) return geometryCache.get(key)!;
  
  const gltf = await loader.loadAsync(url);
  const mesh = gltf.scene.children[0] as THREE.Mesh;
  
  if (!mesh || !mesh.geometry) {
    throw new Error(`GLTF at ${url} has no valid mesh at scene.children[0]`);
  }
  
  // Clone geometry so material changes don't affect the cache
  const geo = mesh.geometry.clone();
  
  // Ensure the geometry has computed bounding info
  geo.computeVertexNormals();
  
  geometryCache.set(key, geo);
  return geo;
}

export function getGeometry(key: string): THREE.BufferGeometry | null {
  return geometryCache.get(key) ?? null;
}

export async function preloadAssets(manifest: Record<string, Record<string, string>>): Promise<void> {
  const entries = Object.entries(manifest).flatMap(([category, assets]) =>
    Object.entries(assets).map(([key, url]) => ({ key, url }))
  );
  
  let completed = 0;
  const total = entries.length;
  
  await Promise.all(entries.map(async ({ key, url }) => {
    try {
      await loadGLTF(key, url);
    } catch (err) {
      console.error(`[AssetLoader] Failed to load ${key} from ${url}:`, err);
    }
    completed++;
    loadProgress = completed / total;
  }));
}

export function getLoadProgress(): number {
  return loadProgress;
}
```

**Important edge cases:**
- **Material handling**: The GLTF mesh's material is discarded — we use the geometry only. Materials come from the GLB for visual fidelity (use `mesh.material` directly when creating InstancedMesh). Per the decision, use GLTF materials as-is.
- **Geometry origin**: GLB must be authored with origin at bottom-center, Y-up. Scale: 1 unit = 1 meter.
- **Non-uniform scale**: Since we use InstancedMesh, per-instance scale must be uniform. The `dummy.scale.set(s, s, s)` pattern already used in the codebase works perfectly.

#### 3. `public/assets/models/` directory structure

Create these directories (empty initially, filled per phase):
```
public/assets/models/
  rocks/
  trees/
  props/
  landmarks/
```

#### 4. `public/assets/models/.gitkeep` in each directory

### Files to Modify

#### 5. `lib/game/engine.ts`

Add an async initialization step before `initWorld()`:

```typescript
// In initThree() or a new async init method:
import { preloadAssets } from './assetLoader';
import manifest from '../../public/assets/models/manifest.json';

// Before initWorld():
await preloadAssets(manifest);
// Show loading screen progress via getLoadProgress()
```

Since the engine constructor is synchronous, we need to either:
- **Option A**: Make `initWorld()` return a `Promise<void>` and handle async in the constructor
- **Option B**: Add a separate `async init()` method called after construction
- **Option C**: Use a loading callback pattern

**Recommendation**: Option B — add an `async init(): Promise<void>` method that preloads assets then calls `initWorld()`. The container shows a loading state until `init()` resolves.

```typescript
// Modified engine.ts
export class RagnarokEngine {
  // ...existing fields...
  
  constructor(container: HTMLDivElement) {
    this.container = container;
    MAP_REGISTRY.register(PRONTERA_FIELD);
    this.initThree();
    // Don't call initWorld() here anymore
    this.setupTouchListeners();
    // Start loading
    this.init().then(() => {
      this.animate();
      useGameStore.getState().loadGame();
      useGameStore.getState().registerEngine(this);
    });
  }
  
  async init() {
    const store = useGameStore.getState();
    store.setLoading(true, 'Loading assets...');
    
    try {
      await preloadAssets(MANIFEST.assets);
    } catch (err) {
      console.error('Asset preload failed, continuing with loaded assets:', err);
    }
    
    store.setLoading(false);
    this.initWorld();
  }
}
```

#### 6. `app/page.tsx` or `app/layout.tsx`

If not already present, add loading state rendering:
```tsx
const isLoading = useGameStore(s => s.isLoading);
const loadingMessage = useGameStore(s => s.loadingMessage);

if (isLoading) {
  return (
    <div className="loading-screen">
      <div className="loading-spinner" />
      <p>{loadingMessage}</p>
    </div>
  );
}
```

#### 7. `lib/game/state.ts`

Add loading state to the Zustand store:
```typescript
interface GameState {
  // ...existing state...
  isLoading: boolean;
  loadingMessage: string;
  setLoading: (loading: boolean, message?: string) => void;
}

// In the store:
isLoading: false,
loadingMessage: '',
setLoading: (loading, message = '') => set({ isLoading: loading, loadingMessage: message }),
```

### Test: Phase 0 Validation

1. Create a test GLB (simple colored cube at `public/assets/models/test/test.glb`)
2. Load it via `loadGLTF('test', '/assets/models/test/test.glb')`
3. Create an InstancedMesh from the loaded geometry with 5 instances at known positions
4. Verify in browser that the cube renders at correct positions
5. Verify that removing the test code cleanly restores original behavior

---

## Phase 1: Rocks (30 instances)

### What Changes

**Before**: `spawnInstancedRocks()` creates 4 procedural geometries per instance:
- `CylinderGeometry(0.44, 0.44, 1.0, 8)` — drum
- `BoxGeometry(1.05, 0.12, 1.05)` — base
- `BoxGeometry(0.95, 0.1, 0.95)` — capital
- `DodecahedronGeometry(0.24, 0)` — fragment
Each painted with `paintGeometry()` then merged via `mergeBufferGeometries()`.

**After**: One GLB (`rock_column.glb`) authored in Blender as a merged mesh of all column parts with baked vertex colors or a baked 256×256 texture. Loaded via `assetGeometryCache.get('rock')`.

### Files to Create

- `public/assets/models/rocks/rock_column.glb`

### Blender Authoring Notes for `rock_column.glb`

- Origin: (0, 0, 0) at bottom-center
- Scale: 1 Blender unit = 1 meter
- Total height: ~1.0 units (the `height` / `visualScale` fields control final scale)
- Mesh: Single merged mesh (Ctrl+J all parts, then apply)
- Materials: One material, baked from vertex colors or with a simple 256×256 color texture
- UVs: Optional (only needed if using texture instead of vertex colors)
- Export settings: GLTF Binary (.glb), Selected Only, +Y Up, Apply modifiers, Include: Mesh only (no cameras/lights)
- Keep file size under 100 KB — low-poly stylized look

### Files to Modify

#### 1. `lib/game/sceneGraph.ts` — `spawnInstancedRocks()` (lines 769-848)

Replace the procedural geometry block (lines 774-808):

```typescript
// OLD (lines 774-808):
// const rockParts: THREE.BufferGeometry[] = [];
// const drum = new THREE.CylinderGeometry(0.44, 0.44, 1.0, 8);
// ... (35 lines of procedural code)
// this.instancedMesh = new THREE.InstancedMesh(colGeo, colMat, count);

// NEW:
const colGeo = getGeometry('rock_column');
if (!colGeo) {
  console.warn('[Rocks] GLB not loaded, skipping rock spawn');
  return;
}
const colMat = new THREE.MeshStandardMaterial({
  roughness: 0.82,
  flatShading: true
});
// If the GLB has a material, use it directly:
const colMat = new THREE.MeshStandardMaterial({
  roughness: 0.82,
  flatShading: true,
  // map: colGeo...  // Only if the GLB includes a texture
});
this.instancedMesh = new THREE.InstancedMesh(colGeo, colMat, count);
```

**Key detail**: The GLB material may include:
- `vertexColors` (if Blender baked vertex colors and exported them)
- A `map` texture (if Blender used a texture)
- `roughness`, `metalness`, `flatShading` from Blender

Since we decided to **use GLTF materials as-is**, we should extract the material from the GLB mesh:

```typescript
const gltf = await loadGLTF('rock_column', '/assets/models/rocks/rock_column.glb');
// gltf.scene.children[0] is the Mesh with its material
// BUT: we store only geometry in the cache, not materials
// OPTION: store material alongside geometry, or use geometry groups
```

**Better approach for InstancedMesh**: Since InstancedMesh uses one material for all instances, extract the material from the GLB and share it:

```typescript
// In assetLoader.ts, also cache materials:
const materialCache = new Map<string, THREE.Material>();

export async function loadGLTFWithMaterial(key: string, url: string) {
  if (geometryCache.has(key)) return { geometry: geometryCache.get(key)!, material: materialCache.get(key)! };
  
  const gltf = await loader.loadAsync(url);
  const mesh = gltf.scene.children[0] as THREE.Mesh;
  const geo = mesh.geometry.clone();
  const mat = Array.isArray(mesh.material) ? mesh.material[0].clone() : mesh.material.clone();
  
  geometryCache.set(key, geo);
  materialCache.set(key, mat);
  
  return { geometry: geo, material: mat };
}
```

**Recommendation**: Add a `loadGLTFWithMaterial()` function for assets used with InstancedMesh.

#### 2. `lib/game/sceneGraph.ts` — Keep placement logic (lines 813-836)

The `for` loop that positions instances using `dummy.position.set()`, `dummy.rotation.set()`, `dummy.scale.set()` remains **completely unchanged**. Only the geometry source changes.

### Collision Data: No Changes

The `visualScale` field in `RockObstacle` (characterController.ts line 10) already allows the visual scale to differ from collision radius. The GLB is authored at unit scale (1m tall), and `visualScale` + `height` control final size per-instance.

### Test: Phase 1 Validation

1. With Phase 0 infrastructure in place, place `rock_column.glb` in `public/assets/models/rocks/`
2. Load the game — rocks should appear visually identical in position but with higher-quality geometry and materials
3. Toggle off rock GLTF loading — fallback to procedural (if implemented) or verify game still works
4. Player collision with rocks must be identical to before (no physics change)

---

## Phase 2: Trees (180 instances)

### What Changes

**Before**: `spawnTrees()` creates 5 procedural geometries per tree:
- Trunk: `CylinderGeometry(0.24, 0.35, 3.2, 5)`
- Base flange: `CylinderGeometry(0.45, 0.55, 0.4, 5)`
- Leaves tier 1: `ConeGeometry(2.3, 2.0, 5)`
- Leaves tier 2: `ConeGeometry(1.8, 1.8, 5)`
- Leaves tier 3: `ConeGeometry(1.2, 1.5, 5)`

**After**: Two GLBs (`tree_trunk.glb`, `tree_leaves.glb`) — keeping the trunk/leaves separation so that each retains separate material properties.

**Why keep two GLBs?** The current system renders trunk and leaves as separate InstancedMeshes because:
- Trunk uses `roughness: 0.95` (wood)
- Leaves use `roughness: 0.85` (foliage)
- Wind sway is applied to leaves independently
- This gives more natural visual variety (trunk brown vs leaves green)

Merging into one GLB would lose this separation. **Recommendation**: Keep 2 GLBs, matching the current architecture.

### Files to Create

- `public/assets/models/trees/tree_trunk.glb`
- `public/assets/models/trees/tree_leaves.glb`

### Blender Authoring Notes

**tree_trunk.glb:**
- Origin at bottom-center
- Height: ~3.2 units (trunk + base flange merged)
- Brown/dark wood colors baked in
- 5-sided cross-section matching current `segments=5` aesthetic

**tree_leaves.glb:**
- Origin at bottom-center (aligned with trunk top at ~1.6m)
- Three merged cones (tiers 1-3) matching current proportions
- Green vertex colors baked in (dark bottom, lighter top)
- Bottom is open (not a closed mesh — saves polygons and matches current look)

### Files to Modify

#### 1. `lib/game/sceneGraph.ts` — `spawnTrees()` (lines 979-1052)

Replace procedural geometry blocks (lines 984-1026):

```typescript
// BEFORE:
// const trunkParts = [...]; // 2 procedural geometries
// const trunkGeo = mergeBufferGeometries(trunkParts);
// const trunkMat = new THREE.MeshStandardMaterial({...});
// this.treeTrunkMesh = new THREE.InstancedMesh(trunkGeo, trunkMat, treeCount);
//
// const leavesParts = [...]; // 3 procedural geometries
// const leavesGeo = mergeBufferGeometries(leavesParts);
// const leavesMat = new THREE.MeshStandardMaterial({...});
// this.treeLeavesMesh = new THREE.InstancedMesh(leavesGeo, leavesMat, treeCount);

// AFTER:
const trunkGeo = getGeometry('tree_trunk');
const leavesGeo = getGeometry('tree_leaves');

if (trunkGeo) {
  this.treeTrunkMesh = new THREE.InstancedMesh(trunkGeo, trunkMat, treeCount);
  // ... add to scene
}
if (leavesGeo) {
  this.treeLeavesMesh = new THREE.InstancedMesh(leavesGeo, leavesMat, treeCount);
  // ... add to scene
}
```

**Material extraction**: Same pattern as Phase 1 — extract material from GLB or use procedural fallback. Since leaves use `flatShading: true` and green vertex colors, the GLB should have these properties baked in.

**Placement logic (lines 1028-1051)**: **Unchanged**. The dummy matrix loop stays identical. The `tree.leavesScaleY` field in `TreeObstacle` continues to control the vertical stretch of leaves per-instance.

### Collision Data: No Changes

`TreeObstacle` interface (characterController.ts) remains untouched.

### Test: Phase 2 Validation

1. Place both GLBs in `public/assets/models/trees/`
2. Load — 180 trees should appear at correct positions with GLTF quality
3. Verify trunk and leaves have separate materials (brown trunk, green crown)
4. Wind sway (updateParticles) should still animate leaves if the InstancedMesh matrix update logic is preserved

---

## Phase 3: Props (128 instances)

### What Changes

**Before**: `spawnEnvironmentalProps()` creates 10+ procedural geometries:
- Crate: `BoxGeometry(0.72, 0.72, 0.72)` + 3 steel bands (BoxGeometry × 3)
- Barrel: 3 CylinderGeometry segments + 2 hoop rings
- Signpost: 1 BoxGeometry board + ConeGeometry tip + CylinderGeometry pole + CylinderGeometry base

**After**: 3 GLBs (`crate.glb`, `barrel.glb`, `signpost.glb`)

**Special case — Signpost**: Currently uses 2 InstancedMeshes (board + pole) because the board and pole have different pivot points and rotations. The board has `boardRotY` and `boardRotZ` offsets.

**Recommendation for Signpost**: Keep 2 GLBs OR merge into 1 GLB with the pivot at ground level and control rotation via the instance matrix. Since the board has independent rotation from the pole, 2 GLBs is safer.

### Files to Create

- `public/assets/models/props/crate.glb` — Wood box + steel bands, bottom-center origin
- `public/assets/models/props/barrel.glb` — Bulging wood barrel + iron hoops, bottom-center origin
- `public/assets/models/props/signpost_board.glb` — Wood board + arrow tip, pivot at board center
- `public/assets/models/props/signpost_pole.glb` — Wood pole + stone base, bottom-center origin

Or for simplicity, 1 merged `crate.glb`, 1 merged `barrel.glb`, and 1 approach for signpost with 2 GLBs.

### Files to Modify

#### 1. `lib/game/sceneGraph.ts` — `spawnEnvironmentalProps()` (lines 1430-1611)

Replace procedural blocks:

**Crates (lines 1440-1466):**
```typescript
// BEFORE:
// const crateParts = [coreCrate, band1, band2, band3];
// const crateGeo = mergeBufferGeometries(crateParts);
// this.propsMesh = new THREE.InstancedMesh(crateGeo, crateMat, crates.length);

// AFTER:
const crateGeo = getGeometry('crate');
if (crateGeo) {
  this.propsMesh = new THREE.InstancedMesh(crateGeo, crateMat, crates.length);
}
```

**Barrels (lines 1469-1504):**
```typescript
const barrelGeo = getGeometry('barrel');
if (barrelGeo) {
  this.barrelMesh = new THREE.InstancedMesh(barrelGeo, barrelMat, barrels.length);
}
```

**Signposts (lines 1509-1544):**
```typescript
const boardGeo = getGeometry('signpost_board');
const poleGeo = getGeometry('signpost_pole');
if (boardGeo) {
  this.signBoardMesh = new THREE.InstancedMesh(boardGeo, boardMat, signposts.length);
}
if (poleGeo) {
  this.signPoleMesh = new THREE.InstancedMesh(poleGeo, poleMat, signposts.length);
}
```

**Placement logic (lines 1546-1610)**: **Unchanged**. The crate/barrel/signpost matrix loops remain identical.

### Collision Data: No Changes

`PropObstacle` interface (characterController.ts) untouched.

### Test: Phase 3 Validation

1. Place all 4 GLBs in `public/assets/models/props/`
2. Load — 128 props should appear in correct positions with look-through quality
3. Verify fallen barrels render correctly (barrel `isFallen` applies rotation via existing logic)
4. Verify signpost board still rotates independently from pole

---

## Phase 4: Landmarks (unique meshes)

### What Changes

**Before**: `spawnLandmarks()` creates ~15 procedural geometries merged into unique meshes:
- Arch gate: 6 geometries (2 pillars, 2 bases, lintel, 2 rubble blocks)
- Campfire: 10+ geometries (3 logs, 7 stones, flame cone)
- Portal: 3 geometries (cylinder ring, box base, additional ring)

**After**: 3 GLBs loaded as individual `THREE.Mesh` (not InstancedMesh)

### Files to Create

- `public/assets/models/landmarks/arch_gate.glb`
- `public/assets/models/landmarks/campfire.glb`
- `public/assets/models/landmarks/campfire_flame.glb` (separate for emissive animation)
- `public/assets/models/landmarks/portal.glb`

### Files to Modify

#### 1. `lib/game/sceneGraph.ts` — `spawnLandmarks()` (lines 851-977)

Replace procedural blocks:

**Arch gate (lines 866-923):**
```typescript
// BEFORE:
// const archParts = [leftPillar, leftBase, rightPillar, rightBase, lintel, rubble1, rubble2];
// const archGeo = mergeBufferGeometries(archParts);
// const archMesh = new THREE.Mesh(archGeo, stoneMat);

// AFTER:
const archGeo = getGeometry('arch_gate');
if (archGeo) {
  const archMat = ... // from GLB or fallback
  const archMesh = new THREE.Mesh(archGeo, archMat);
  archMesh.position.set(archX, archY, archZ);
  archMesh.rotation.set(0, Math.PI / 4, 0);
  scene.add(archMesh);
}
```

**Campfire (lines 926-976):**
```typescript
// Load base (logs + stones merged)
const campGeo = getGeometry('campfire_base');
if (campGeo) {
  const campMesh = new THREE.Mesh(campGeo, stoneMat);
  campMesh.position.set(campX, campY, campZ);
  scene.add(campMesh);
}

// Load flame (separate for emissive animation)
const flameGeo = getGeometry('campfire_flame');
if (flameGeo) {
  const flameMesh = new THREE.Mesh(flameGeo, fireMat);
  flameMesh.position.set(campX, campY, campZ);
  scene.add(flameMesh);
}

// Light stays unchanged
const campfireLight = new THREE.PointLight(0xff5500, 2.0, 6.0, 0.5);
```

### Collision Data: No Changes

Landmarks have no collision entries (they're visual-only set dressing).

### Test: Phase 4 Validation

1. Place all landmark GLBs in `public/assets/models/landmarks/`
2. Load — arch gate, campfire, and portal should appear with GLTF quality
3. Campfire flame should still emit light (PointLight is separate code)
4. Emissive animation of flame can be done via material animation in `updateParticles()`

---

## Cross-Cutting Concerns

### Error Handling Strategy

Each GLB load is wrapped in try/catch in `assetLoader.ts`. If a file fails to load:
1. Log a warning to console
2. The geometry cache returns `null` for that key
3. The spawn method checks `getGeometry(key)` — if null, it either:
   - **Option A**: Skips spawning entirely (logged as warning)
   - **Option B**: Falls back to procedural geometry (if the code is preserved)
   
**Recommendation**: Option A for simplicity. The procedural code can be kept in comments or git history for rollback. In practice, once GLTFs are validated, they should never fail.

### Loading Screen States

```
┌──────────────────────────────────────┐
│                                      │
│           RAGNAROK ONLINE            │
│                                      │
│          [Loading Spinner]           │
│                                      │
│     Loading assets... (33%)          │
│     - Loading rocks...               │
│     - Loading trees... ✓             │
│     - Loading props...               │
│                                      │
└──────────────────────────────────────┘
```

Implementation: Track loaded assets count vs total. Update `loadingMessage` in the store after each phase completes.

### File Size Budget

| Asset | Target Size | Max Size |
|-------|------------|----------|
| rock_column.glb | 40 KB | 100 KB |
| tree_trunk.glb | 25 KB | 60 KB |
| tree_leaves.glb | 30 KB | 80 KB |
| crate.glb | 15 KB | 40 KB |
| barrel.glb | 20 KB | 50 KB |
| signpost_board.glb | 12 KB | 30 KB |
| signpost_pole.glb | 10 KB | 25 KB |
| arch_gate.glb | 50 KB | 120 KB |
| campfire.glb | 30 KB | 70 KB |
| campfire_flame.glb | 8 KB | 20 KB |
| portal.glb | 25 KB | 60 KB |
| **Total** | **~265 KB** | **~655 KB** |

### Blender Export Settings (Standard for all assets)

| Setting | Value |
|---------|-------|
| Format | GLTF Binary (.glb) |
| Selected Objects | ✓ |
| Include > Mesh | ✓ |
| Include > Cameras | ✗ |
| Include > Lights | ✗ |
| Transform > +Y Up | ✓ |
| Transform > Apply Unit | ✓ |
| Geometry > Apply Modifiers | ✓ |
| Geometry > UVs | ✓ (if using textures) |
| Geometry > Normals | ✓ |
| Geometry > Vertex Colors | ✓ (if using vertex colors) |
| Compression | None (deferred) |
| Texture > Images | Copy (embedded in GLB) |

### Git Strategy

Each phase should be a separate commit with a clear message:

```
Phase 0: Asset pipeline infrastructure (GLTFLoader, manifest, loading state)
Phase 1: Replace rock geometry with GLB models
Phase 2: Replace tree geometry with GLB models
Phase 3: Replace prop geometry with GLB models
Phase 4: Replace landmark geometry with GLB models
```

If using branches, each phase can be a short-lived branch merged into main after validation.

### Rollback Strategy

If a phase causes issues:
- **Phase 1 (Rocks)**: Revert the `spawnInstancedRocks()` changes to restore procedural rocks. All other phases work independently.
- **Phase 2 (Trees)**: Revert `spawnTrees()` changes.
- **Phase 3 (Props)**: Revert `spawnEnvironmentalProps()` prop section.
- **Phase 4 (Landmarks)**: Revert `spawnLandmarks()` changes.

Since each phase modifies only the geometry source in its spawn method, rollback is a focused code revert.

### Future Considerations (Out of Scope for This Plan)

- **LOD system**: When zoomed far out, load a lower-poly GLB variant
- **Texture atlas**: Combine multiple GLB textures into a single atlas for fewer GPU texture binds
- **Draco compression**: For complex models exceeding the size budget
- **Runtime asset hot-reload**: For development iteration speed
- **GLB variant system**: Multiple color/texture variants (e.g., autumn trees, snow-covered rocks)
- **Asset bundle versioning**: Cache-busting for deployed GLB files
