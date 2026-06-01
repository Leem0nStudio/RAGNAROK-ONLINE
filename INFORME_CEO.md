# INFORME EJECUTIVO — Epicearth

**Fecha:** Junio 2026
**Proyecto:** Epicearth — Ragnarok Online-inspired 3D World
**Stack:** Next.js 15 + Three.js r160 + TypeScript + Zustand
**Plataforma objetivo:** Mobile-first (Web)

---

## Estado Actual

### ✅ Finalizado — 100% funcional

| Sistema | Estado | Detalle |
|---------|--------|---------|
| **Mundo 3D** | ✅ | Terreno por weight-maps, 11 zonas, GPU palette LUT |
| **Transiciones** | ✅ | Cruce automático entre zonas: iluminación, atmósfera, monstruos |
| **Combate** | ✅ | 10 tipos de monstruos data-driven, 6 skills por clase, auto-battle |
| **Personaje** | ✅ | 8 job classes, 3 tiers, equipamiento, stats, level 99/70 |
| **Monstruos** | ✅ | Spawn/despawn por zona, stats centralizados, 6 nuevos tipos |
| **NPCs** | ✅ | Kafra (buff/heal/potions), Instructor (job change), quest givers |
| **Colisiones** | ✅ | Castillo, fortaleza, terreno, landmarks — todo integrado |
| **Audio** | ✅ | Síntesis Web Audio, 15+ efectos |
| **Persistencia** | ✅ | localStorage + Supabase opcional |
| **Rendimiento** | ✅ | InstancedMesh, object pooling, LOD, perfil mobile |
| **Sistema de Quests** | ✅ | 22 misiones (7 main + 15 side), cadena de progresión, recompensas |
| **Economía** | ✅ | Moneda Zeny, 18 items en tienda, loot tables por monstruo |
| **Logros** | ✅ | 8 logros con recompensas, 3 títulos desbloqueables |
| **Multi-pociones** | ✅ | Red/Orange/Yellow/White/Blue/Green + Flour Sack + Miller's Blessing |
| **Sistema de Cartas** | ✅ | 8 cartas insertables en equipamiento, stats bonus |
| **Asset Management** | ✅ | AssetRegistry, CanvasPool, SpriteManager + directorios en `public/` |
| **Skill Tree** | ✅ | 14 skills por clase, puntos de habilidad, UI de aprendizaje |
| **Next-level HUD** | ✅ | Barras EXP con contador de EXP restante a siguiente nivel |

### Pendientes

| Sistema | Progreso |
|---------|----------|
| **Quest markers en minimapa** | ✅ Waypoints amarillos para objetivos activos |
| **UI de quest en menú** | ✅ Panel de misiones con progreso, barras, completadas |
| **Multiplayer** | No iniciado |
| **Expansión zonas** | 5 zonas definidas en ZonePresets, desactivadas (Bosque, Desierto, Nieve, Volcán, Pantano) |

---

## Arquitectura del mundo

```
Prontera (ciudad hub, 4 chunks)
  ├── → CM1 Pradera del Alba (nvl 1-3) — Poring, Lunático
  │     └── → CM2 Llanura Écoles (nvl 4-7) — Fabre, Chonchon
  │           └── → Camino del Este (nvl 7-9) — Picky, PecoPeco
  └── → CM3 Laderas Molino (nvl 6-10) — Savage Baby, Picky, Mandrágora ★
        └── → Mazmorra Entrenamiento (nvl 5-10) — Fabre, Chonchon
```

11 zonas definidas, 6 conectadas en el mundo actual. Expansión documentada para 3 continentes, 10 regiones y 8 mazmorras.

---

## Sistema de Quests — Cadena de progresión

```
epic_01 ──▶ epic_02 ──▶ epic_03 ──▶ epic_04 ──▶ epic_05
                                                     │
                                                     ▼
                                               epic_06 ──▶ epic_07
                                                     │
                                                     ▼
                                               sq_07 (side)
```

22 quests: 7 épicas (main) + 15 secundarias. Cada una con objetivos tipo `kill`, `collect`, `talk`, `explore`, `reach`, `survive`. State machine: locked → available → active → completed. Recompensas en Zeny, EXP e items.

---

## Rendimiento

| Métrica | Objetivo | Actual |
|---------|----------|--------|
| Draw calls | <150 | ~182 (zona completa) |
| FPS mobile | 30 | 30-45 |
| FPS desktop | 60 | 55-60 |
| Chunks simultáneos | 9 | 9 (loadRadius=3) |
| Instancias de props | <8000 | ~7500 |
| Memoria texturas | <50MB | ~30MB |

---

## Línea base del código

| Métrica | Valor |
|---------|-------|
| Líneas totales | 16,391 |
| Módulos TypeScript | 38 (4 scripts JS eliminados) |
| Zonas definidas | 11 (6 activas) |
| Tipos de monstruo | 10 |
| Quest definidas | 22 (7 main + 15 side) |
| Items en tienda | 18 |
| Items en item DB | ~70 |
| Cartas | 8 |
| Logros | 8 |
| Tipos de poción | 6 + 2 especiales |
| Prop blueprints | 21 |
| Clases de personaje | 32 (3 tiers) |
| Skills implementadas | 14+ |
| Archivos documentación | 7 |

---

## Próximos pasos (priorizados)

1. ✅ **Trigger de objetivos** — Hooks engine para `collect`, `explore`, `talk`, `survive`, `reach` completados
2. ✅ **Quest markers en minimapa** — Waypoints amarillos renderizados
3. ✅ **UI de quest en menú** — Panel de misiones con progreso, barras y listado
4. **Limpieza de código muerto** — Assets/, poporing/baphomet, potCount, tipos, etc. ✅
5. **Expansión de zonas** — Bosque, desierto, nieve, volcán (definidos en ZonePresets, desactivados)
6. **Multiplayer** — WebSockets, sincronización de estado, chat

---

## Riesgos y mitigaciones

| Riesgo | Impacto | Mitigación |
|--------|---------|------------|
| Sprites procedurales escalan mal | Alto | SpriteManager con draw cache + sprite sheets (planificado) |
| Sin modelos 3D externos | Medio | Geometría procedural + voxel landmarks — mobile-friendly |
| Dependencia GitHub para sprites | Medio | Asset pipeline migrado a `public/assets/` local |
| Sin testing automatizado | Medio | Pruebas manuales en mobile y desktop |
