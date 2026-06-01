# Persistence Plan — Epicearth

## Status: ✅ Implemented

## Arquitectura

Two-tier persistence: **localStorage** (default, offline-first) + **Supabase** (optional cloud).

```
GameStore (Zustand)
    │
    ├── saveGame()
    │     ├── localStorage.setItem('ragnarok_save', JSON.stringify(state))
    │     └── if supabase configured → upsert player_profiles
    │
    └── loadGame()
          ├── localStorage.getItem('ragnarok_save')
          ├── parse & hydrate store
          └── if supabase configured → fetch from cloud
```

## Qué se persiste (`lib/game/state.ts ~1300`)

| Campo | Tipo | Ejemplo |
|-------|------|---------|
| `stats.level` | number | 15 |
| `stats.jobLevel` | number | 12 |
| `jobClass` | JobClass | 'Swordsman' |
| `baseStats` | CharacterStats | { str: 18, agi: 12, ... } |
| `playerBaseExp` | number | 4500 |
| `playerJobExp` | number | 3200 |
| `inventory` | InventoryItem[] | [{ id: 'red_potion', name: 'Red Potion', ... }] |
| `equippedItems` | EquippedItems | { rightHand: { ... } } |
| `skills` | Skill[] | [{ id: 'bash', level: 3, ... }] |
| `skillPoints` | number | 2 |
| `currentHp` / `currentSp` | number | 850 / 120 |
| `zeny` | number | 1700 |
| `activeQuests` | string[] | ['epic_05'] |
| `completedQuests` | string[] | ['epic_01', 'epic_02'] |
| `questProgress` | Record<string, QuestObjective[]> | { epic_05: [...] } |
| `discoveredLandmarks` | string[] | ['lm_fountain', 'lm_tree'] |
| `achievements` | Achievement[] | [{ id: 'first_steps', unlocked: true }] |
| `headgear` | HeadgearId | 'goggles' |
| `potionSlots` | Record<string, number> | { red_potion: 5, orange_potion: 2 } |
| `playerTitle` | string | 'Salvador del Molino' |

## Frecuencia de guardado

- `saveGame()` se llama después de cada acción significativa:
  - Completar quest
  - Aceptar quest
  - Comprar/vender item
  - Equipar/desequipar
  - Subir de nivel
  - Ganar logro

## Schema Supabase (`docs/SCHEMA.sql`)

```sql
create table player_profiles (
  id uuid primary key,
  username text,
  save_data jsonb not null,       -- snapshot completo del store
  save_version int default 1,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
```

## Pendiente

- [ ] Migrar a guardado diferido con debounce (cada 30s en vez de cada acción)
- [ ] Comprimir JSON antes de localStorage (lz-string)
- [ ] Sincronización multi-dispositivo con resolución de conflictos
