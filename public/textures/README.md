# Texture Assets — Epicearth

## Directory Structure

```
public/textures/
├── tiles/        → Tile atlas textures (grass, dirt, stone, water, sand, snow)
├── terrain/      → Terrain weight-map / splat textures
└── skyboxes/     → Skybox cubemap faces (px, nx, py, ny, pz, nz)
```

## Current Status

All terrain rendering uses **procedural vertex colors** and **runtime-generated weight maps**
(via `lib/game/terrain/TextureCatalog.ts`). No external texture files are needed.

To add PNG texture support, use `AssetRegistry.loadTexture(path)` with the atlas system
described in `docs/ASSET_ARCHITECTURE.md`.
