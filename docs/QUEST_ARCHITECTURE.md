# Quest System Architecture — Epicearth

## 1. Data Layer (`lib/game/types.ts`)

```typescript
type QuestState = 'locked' | 'available' | 'active' | 'completed'
type QuestObjectiveType = 'kill' | 'collect' | 'talk' | 'explore' | 'survive' | 'reach'

interface QuestObjective {
  type: QuestObjectiveType
  description: string
  mobType?: string         // para kill/collect
  targetId?: string        // para talk
  count: number            // total requerido
  current: number          // progreso actual
  location?: { zoneId: string; x: number; z: number }  // para explore/survive
}

interface QuestDefinition {
  id: string               // 'epic_01', 'sq_01'
  name: string
  description: string
  objectives: QuestObjective[]
  rewards: { zeny, baseExp, jobExp, items? }
  npcGiver: string         // display name
  npcGiverId: string       // npc_ entity ID
  zoneId: string
  nextQuestId?: string     // unlock chain
  requiredLevel?: number
  requiredQuestId?: string // lock until quest completed
  isMainQuest?: boolean
  state: QuestState
}
```

## 2. State Management (`lib/game/state.ts`)

```
┌─────────────────────────────────────────────┐
│           Zustand GameStore                  │
├─────────────────────────────────────────────┤
│  quests: QuestDefinition[]                   │── todas las quests con estado actual
│  activeQuests: string[]                      │── IDs de quests activas
│  completedQuests: string[]                   │── IDs de quests completadas
│  questProgress: Record<string, QuestObjective[]> │── prog. por questId
│  currentMainQuest: string | null             │── epic activa
├─────────────────────────────────────────────┤
│  acceptQuest(questId)                        │── available → active
│  updateQuestProgress(qId, idx, amount)       │── incrementa contador
│  completeQuest(questId)                      │── active → completed, otorga rewards
│  getActiveQuest(): QuestDefinition | null    │── retorna quest principal
└─────────────────────────────────────────────┘
```

### Lifecycle

```
locked  ──(requiredQuest completada)──▶  available
available ──(acceptQuest)─────────────▶  active
active   ──(todos objectives >= count)─▶  completed
```

## 3. Quest Definitions (`lib/game/quests.ts`)

**22 quests total:** 7 main quests + 15 side quests

| ID | Name | Zone | Prereq |
|---|---|---|---|
| **Main** | | | |
| epic_01 | El Despertar del Héroe | Prontera | — |
| epic_02 | La Primera Cacería | CM1 | epic_01 |
| epic_03 | El Lunático Problemático | CM1 | epic_02 |
| epic_04 | El Camino Hacia el Poder | Prontera | epic_03 |
| epic_05 | La Plaga de los Écoles | CM2 | epic_04 |
| epic_06 | El Molino Silenciado | CM3 | epic_05 |
| epic_07 | El Velo del Este | Camino Este | epic_06 |
| **Side** | | | |
| sq_01–sq_06 | Varios | CM1 | — |
| sq_07 | El Guardián del Molino | CM3 | epic_06 |
| sq_08–sq_10 | Varios | CM2/Camino Este | — |
| sq_11 | Herbolaria | CM1 | — |
| sq_12–sq_15 | Mazmorra | Dungeon | — |

## 4. NPC-Quest Integration (`lib/game/engine.ts`)

### Dialogue Flow

```
Player touches NPC
  │
  └─▶ openNpcDialogue(npc)
       │
       ├─ npcType === 'quest_giver'
       │   ├─ Busca quests donde npcGiverId === npc.id
       │   ├─ Si hay quests available → muestra opciones de aceptación
       │   ├─ Si hay quests active → muestra progreso
       │   └─ handleNpcAction('quest_accept_{id}') → store.acceptQuest(id)
       │
       ├─ npcType === 'kafra'
       │   └─ Buffs, Heal, Shop
       │
       └─ npcType === 'crusader_instructor'
           └─ Job change dialogue tree (Novice → First → Second)
```

### Objective Tracking (engine.ts ~1213)

```
On monster kill:
  store.activeQuests.forEach(qId → progress)
    progress.forEach(obj, idx)
      if obj.type === 'kill' && obj.mobType === mob.mobType
        store.updateQuestProgress(qId, idx, 1)
```

Missing: `collect` type tracking (picked loot), `explore` trigger (landmark proximity), `talk` completion (dialogue end). These need zones/npc proximity checks.

## 5. Progression Chain

```
epic_01 ──▶ epic_02 ──▶ epic_03 ──▶ epic_04 ──▶ epic_05
                                                     │
                                                     ▼
                                               epic_06 ──▶ epic_07
                                                     │
                                                     ▼
                                               sq_07 (side)

Achievements triggered on completion:
  first_steps  ← epic_01
  mill_savior  ← epic_06
  poring_hunter ← sq_06 (kill 15 porings)
```

## 6. Pending Implementations

| Feature | Location | Status |
|---|---|---|
| Collect objective trigger (loot pickup) | engine → spawnLoot path | Missing |
| Explore objective trigger (zone arrival) | engine → moveTo | Missing |
| Talk objective trigger (dialogue close) | engine → handleNpcAction | Missing |
| Survive objective (wave timer) | engine → worldRuntime | Missing |
| Reach objective (level check) | state → updateStats / addExp | Missing |
| Quest HUD tracker | app/page.tsx | Done |
| Quest detail in menu | components/RagnarokMenu.tsx | Partial |
| Quest item turn-in | shop/dialogue | Missing |
| Minimap quest markers | components/Minimap.tsx | Missing |
| Landmark discovery integration | state → checkAchievements | Done |

## 7. Data Flow Diagram

```
┌─────────────┐    acceptQuest()    ┌──────────────┐
│  NPC Touch  │──────────────────▶  │  GameStore   │
│  (engine)   │                     │  (state.ts)  │
└──────┬──────┘                    └──────┬───────┘
       │                                  │
       │  kill monster                    │ updateQuestProgress()
       │  pick loot                       │
       ▼                                  ▼
┌──────────────┐                  ┌──────────────┐
│  worldRuntime │ ◀──────────────  │  Quest HUD   │
│  (engine.ts)  │   re-render      │  (page.tsx)  │
└──────────────┘                  └──────────────┘
```

## 8. Reward Distribution

```
completeQuest(questId):
  1. Add reward.zeny to wallet
  2. Call addExp(reward.baseExp, reward.jobExp)
  3. For each reward.item → addItem()
  4. If nextQuestId → unlock next quest
  5. If isMainQuest → playLevelUp sound
  6. Call checkAchievements()
  7. saveGame()
```
