# Ragnarok Engine Sandbox — AGENTS.md

## Quick start

```bash
npm install        # install dependencies
npm run dev        # dev server at localhost:3000
npm run build      # production build
npm run start      # start production server
npm run lint       # eslint . (config is empty — lint does nothing useful)
npx tsc --noEmit   # typecheck (no script defined in package.json)
```

## Architecture

- **Framework**: Next.js 15 (App Router), React 19, TypeScript 5.3
- **Styling**: Tailwind CSS v4 with `@tailwindcss/postcss` via `postcss.config.mjs`
- **3D Engine**: Three.js (`three` v0.160, `@types/three` v0.160) — all geometry is procedural, no external models
- **State**: Zustand (`lib/game/state.ts`) — single store for all game state
- **Persistence**: localStorage (default, offline-first) + Supabase (optional cloud). `saveGame()`/`loadGame()` on the store. `.env.example` expects `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`. The client (`lib/supabaseClient.ts`) is a no-op guard if env vars are empty.
- **Animation**: `motion` v11 (framer-motion successor) for React animations; Three.js `requestAnimationFrame` loop for 3D
- **Icons**: `lucide-react`
- **Path alias**: `@/*` maps to project root

## Key directory structure

```
app/                          # Next.js App Router pages
  layout.tsx                  # Root layout (fonts, metadata, dark bg)
  page.tsx                    # Single-page game client ('use client')
  globals.css                 # Tailwind v4 entrypoint
  not-found.tsx
lib/
  game/                       # All game engine code
    engine.ts                 # RagnarokEngine — Three.js main loop, touch input, combat
    state.ts                  # Zustand store + all actions
    types.ts                  # All game types
    renderer.ts, sceneGraph.ts, audio.ts, characterController.ts, worldRuntime.ts
    animationStateMachine.ts, cards.ts, effects.ts, lootTables.ts, quests.ts, shop.ts
    achievements.ts
    terrain/                  # Epicearth terrain system (MapStreamer, PropLibrary, etc.)
  supabaseClient.ts           # Supabase client stub
components/
  Minimap.tsx, RagnarokMenu.tsx  # React game UI components
docs/                         # Design documents (all in Spanish)
  ASSET_ARCHITECTURE.md       # Asset management plan (future, not implemented)
  PERSISTENCE_PLAN.md         # Persistence architecture (implemented)
  SCHEMA.sql, QUEST_ARCHITECTURE.md, WORLD_DESIGN.md, etc.
public/
  sprites/, textures/, audio/ # Asset directories (mostly placeholder)
```

## Important quirks

- **README.md is stale** — it references Google AI Studio and `GEMINI_API_KEY`. The real env vars are `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_ANON_KEY` (see `.env.example`). Trust `.env.example`, not README.
- **ESLint config is empty** (`eslintConfig = []` in `eslint.config.mjs`). `npm run lint` passes trivially. Real checking is `npx tsc --noEmit`.
- **No tests exist** in the project. No test runner configured.
- **No CI/CD** — no `.github/`, no pre-commit hooks, no task runner config.
- **All game content is in Spanish** — HUD, NPC dialogue, item descriptions, tooltips, combat logs.
- **`@/*` path alias** is configured in `tsconfig.json` paths — use `@/lib/game/engine` instead of relative imports.
- **`lib/game/terrain/`** implements a full voxel/Minecraft-style terrain system (Epicearth). `engine.ts` imports `PRONTERA_CITY`, `ALL_ZONES`, `MapStreamer`, `PropLibrary`, `VegetationSystem`, etc. from this module.

## Game engine conventions

- Single-page client app — everything renders inside `app/page.tsx` which mounts a Three.js canvas + React HUD overlay.
- `RagnarokEngine` class (`lib/game/engine.ts`) owns the 3D game loop (60 Hz fixed timestep), touch input, entity simulation, combat, loot, quest tracking.
- `useGameStore` (Zustand) is the single source of truth for UI state and the bridge between engine and React components.
- Engine reads from store via `useGameStore.getState()`, writes via `useGameStore.setState()`.
- Monster stats are hardcoded in `RagnarokEngine.MONSTER_STATS` (engine.ts:~65-86).
- Job classes, skills, and default stats are defined in `state.ts`. 33 job classes across 4 tiers (Novice → First → Second → Transcendent).
- The engine dynamically draws entity sprites on Canvas2D textures (procedural, no sprite sheets yet). See `renderer.ts` and `sceneGraph.ts`.
- Touch input supports tap-to-target (right half) and optional joystick (left half). Desktop mouse fallback included.

## NPM scripts

| Command | What it does |
|---------|-------------|
| `npm run dev` | `next dev` — HMR dev server |
| `npm run build` | `next build` — production build |
| `npm run start` | `next start` — serve production build |
| `npm run lint` | `eslint .` — no-op (empty config) |
| (none) | `npx tsc --noEmit` for typechecking |
