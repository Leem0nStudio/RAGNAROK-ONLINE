# Sprite Assets — Epicearth

## Directory Structure

```
public/sprites/
├── player/       → Character sprites (Novice, Swordsman, Mage, Archer, etc.)
├── monsters/     → Monster sprites (Poring, Lunatic, Fabre, Chonchon, etc.)
├── npcs/         → NPC sprites (Kafra, Instructor, Guard, Miller, etc.)
├── items/        → Item icons (equipment, potions, materials, cards)
├── effects/      → VFX sprites (hit, heal, cast, levelup, etc.)
└── ui/           → UI elements (buttons, panels, minimap markers, quest markers)
```

## Current Assets

- `player/swordman_.png` — Swordsman sprite (downloaded from Leemonztuff/gameassets)
- `player/priest.png` — Priest sprite
- `player/novice.png` — Novice sprite
- `player/acolyte.png` — Acolyte sprite

## Loading Strategy

The engine currently uses **procedural Canvas2D drawing** (via `lib/game/assets/SpriteManager.ts`)
rather than loading these PNGs. PNGs serve as reference for the draw functions.

To enable PNG loading in the future, `lib/game/assets/AssetRegistry.ts` provides
`loadTexture(path)` → `TextureHandle` with LRU cache and atlas support.
