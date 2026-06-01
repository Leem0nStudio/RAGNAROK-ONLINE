# Visual Scale Pass — Epicearth

> **Lead Visual Director & Senior UX/UI Engineer**
> Auditoría completa de escala visual, legibilidad y jerarquía — previo a implementación.

---

## 1. Diagnóstico: Estado Actual

### 1.1 Cámara

| Parámetro | Valor | Cálculo |
|-----------|-------|---------|
| FOV | 40° (vertical) | `PerspectiveCamera(40, ...)` |
| Posición base | (0, 9.0, 13.0) | |
| Distancia cámara→jugador | **15.81 unidades** | √(9² + 13²) |
| Ángulo de inclinación | **34.7°** sobre horizontal | atan(9/13) |
| Cobertura vertical del mundo | **11.51 unidades** | 2 × 15.81 × tan(20°) |
| Zoom combate | (y: 11, z: 16) → 19.42 unidades | **se ALEJA del jugador** |

### 1.2 Proyección en Pantalla (360×640)

| Elemento | Escala mundo | Píxeles en 640px | % pantalla |
|----------|-------------|-------------------|------------|
| **Player sprite** (2.5u, idle) | 2.5 | **139 px** | **21.7%** |
| **Player sprite** (2.5u, combate) | 2.5 | **113 px** | **17.7%** |
| **Monstruo normal** (1.8u) | 1.8 | **100 px** | **15.6%** |
| **Monstruo boss** (4.9u) | 4.9 | **273 px** | **42.6%** |

### 1.3 Escala de Sprites (Billboard System)

| Tipo | Escala actual | Origen |
|------|--------------|--------|
| Player/NPC | **2.5** | `sceneGraph.ts:267-270` |
| Monster (normal) | **1.8** | `sceneGraph.ts:267-270` |
| Boss | **4.9** | `sceneGraph.ts:267-270` |
| Pecopeco | **2.5** | `sceneGraph.ts:267-270` |

### 1.4 Cadena de Renderizado de Sprites

```
Sprite fuente (500×500) → Crop (184×480)
  → Canvas drawImage (70px de alto, imageSmoothingEnabled=true/false)
    → THREE.CanvasTexture (128×128, NearestMipmapNearestFilter)
      → THREE.SpriteMaterial (alphaTest: 0.5)
        → THREE.Sprite (billboard, escala por tipo)
```

### 1.5 Terreno

| Parámetro | Valor | Impacto visual |
|-----------|-------|---------------|
| Grid vértices | 33×33 por chunk | 1u espaciado |
| Chunk size | 32×32 unidades | |
| Amplitud grassland | 1.5 | ±0.75u = **60% del sprite player** |
| Amplitud forest | 2.5 | ±1.25u = **100% del sprite — compite** |
| Amplitud volcanic | 4.0 | ±2.0u = **160% del sprite — domina** |
| Amplitud desert | 0.8 | ±0.4u = **32% del sprite — OK** |

### 1.6 Props

| Prop | Base size | Scale range | Máximo visual | Relación con player (2.5u) |
|------|-----------|-------------|---------------|---------------------------|
| rock_b | Dodecahedron r=0.6 | 1.0–2.0 | r=1.2 (Ø 2.4u) | **95%** |
| ruin_pillar | Box 0.5×2.0×0.5 | 0.8–1.2 | 2.4u alto | **96%** |
| lamp_post | Pole 1.8u + sphere | 0.9–1.1 | 1.98u alto | **79%** |
| barrel | Cyl r=0.3, h=0.7 | 0.8–1.2 | 0.84u alto | 34% |
| signpost | Pole 1.4u + board | 0.8–1.2 | ~1.6u | 64% |

### 1.7 Jerarquía Visual Actual (NO intencional)

```
Nivel 1 (más visible): Terreno (amplitud 4.0 en volcánico) — ROBA LA ATENCIÓN
Nivel 2: Bosses (4.9u)
Nivel 3: Props grandes (rocas 2.4u, pillars 2.4u)
Nivel 4: Player/NPC (2.5u) — DEMASIADO PEQUEÑOS
Nivel 5: Monstruos (1.8u) — ILEGIBLES
```

---

## 2. Plan de Mejora Priorizado

### FASE 1 — Cambios Rápidos de Alto Impacto

#### P0 — Invertir Zoom de Combate

- **Archivo**: `engine.ts:2589-2590`
- **Cambio**: `baseZoomY: 11→7.5`, `baseZoomZ: 16→11`
- **Impacto**: Player en combate pasa de 113px a 165px (+46%)
- **Esfuerzo**: 2 minutos

#### P1 — Reducir Distancia de Cámara 30%

- **Archivo**: `engine.ts:151`
- **Cambio**: `camera.position.set(0, 9.0, 13.0)` → `(0, 6.3, 9.1)`
- **Nueva distancia**: 11.07 unidades (vs 15.81 actual)
- **Impacto**: Player pasa de 21.7% a 31.0% de pantalla
- **Esfuerzo**: 2 minutos

#### P2 — Aumentar Escala de Sprites de Monstruos

- **Archivo**: `sceneGraph.ts:267-270`
- **Cambio**: Vincular escala visual a `MONSTER_STATS.size`
- **Fórmula**: `visualScale = 1.6 + (monster.size * 0.4)`
- **Nuevos valores**:

| Mob | size | Escala actual | Nueva escala |
|-----|------|--------------|-------------|
| poring | 1.0 | 1.8 | 2.0 |
| pecopeco | 1.3 | 2.5 | 2.12 (baja) |
| mandragora | 2.0 | 1.8 | 2.4 |
| dark_guardian | 2.8 | 1.8 | 2.72 |
| will_o_wisp | 0.7 | 1.8 | 1.88 |

- **Impacto**: Monstruos normales pasan de 15.6% a 24-34% de pantalla
- **Esfuerzo**: 5 minutos

#### P3 — Sombras Proporcionales al Tamaño

- **Archivo**: `sceneGraph.ts:281-294`
- **Cambio**: `shadowScale = visualScale * 0.6`
- **Impacto**: Coherencia visual entre tamaño del sprite y su sombra
- **Esfuerzo**: 5 minutos

#### P4 — Reducir Amplitud de Terreno

- **Archivo**: `TerrainChunk.ts:11-19`
- **Cambio**: Reducir amplitudes para que el terreno nunca supere ±0.75u (30% del sprite player)

| Biome | Amplitud actual | Propuesta |
|-------|----------------|-----------|
| grassland | 1.5 | 1.5 (sin cambio) |
| forest | 2.5 | **1.2** |
| desert | 0.8 | 0.8 (sin cambio) |
| swamp | 0.6 | **1.0** |
| volcanic | 4.0 | **2.0** |
| snow | 2.0 | **1.2** |
| dungeon | 0.5 | 0.5 (sin cambio) |

- **Impacto**: El terreno deja de competir visualmente con personajes
- **Esfuerzo**: 2 minutos

#### P5 — Reducir Escala de Props Grandes

- **Archivo**: `PropLibrary.ts:29-48`
- **Cambio**: Limitar escala máxima para que ningún prop exceda 80% de la altura del sprite player

| Prop | Scale max actual | Propuesta |
|------|-----------------|-----------|
| rock_b | 2.0 | **1.3** |
| ruin_pillar | 1.2 | **1.0** |
| lamp_post | 1.1 | **0.9** |
| ruin_slab | 1.5 | **1.0** |

- **Esfuerzo**: 5 minutos

#### P6 — Outline y Highlight de NPCs

- **Archivo**: `sceneGraph.ts:281-310`
- **Cambio**: Anillo de selección permanente con color distintivo en NPCs
  - Ring color idle: `#60a5fa` (azul)
  - Ring color en rango de interacción: `#34d399` (verde) con pulso
  - Opacidad idle: 0.3, en rango: 0.7 pulsante
- **Esfuerzo**: 15 minutos

#### P7 — LOD de Props No-Interactivos

- **Archivo**: `PropLibrary.ts:29-48`
- **Cambio**: Reducir LOD máximo de props no-interactivos (rocas, arbustos, vallas) a 40u
- **Impacto rendimiento**: -30% draw calls de props en escenas abiertas
- **Esfuerzo**: 5 minutos

---

### FASE 2 — Cambios Avanzados (Próximo Sprint)

#### P8 — Blob Shadows

- Sistema de sombras circulares suaves (SpriteMaterial con textura degradada)
- Sin ShadowMap (GPU-free)
- Escala: `spriteScale * 0.5`, Y: 0.02
- **Archivo**: `sceneGraph.ts` (nuevo método)
- **Esfuerzo**: 60 minutos

#### P9 — Nameplate de NPCs con Icono Comercial

- Icono según tipo (💬 quest, 🏪 shop, 📖 lore, ⚔ entrenador)
- Fondo de color por tipo de NPC
- Animación hover en rango de interacción
- **Archivo**: `sceneGraph.ts:331-357`
- **Esfuerzo**: 30 minutos

#### P10 — Ground Decals

- Mallas planas con textura procedural para caminos, plazas, zonas de spawn
- Integrar con sistema de chunks
- Reutilizar lógica de `createGroundMap()` (renderer.ts:113-318)
- **Esfuerzo**: 120 minutos

#### P11 — Desaturación de Terreno

- Reducir saturación del terreno -20%
- Aumentar brillo +5%
- **Archivo**: `TerrainChunk.ts` (material colors)
- **Esfuerzo**: 15 minutos

#### P12 — Cámaras Dinámicas por Zona

| SubzonePurpose | FOV | Distancia | Efecto |
|---------------|-----|-----------|--------|
| city | 40° | 12u | Estándar |
| field | 45° | 14u | Épico, más campo |
| dungeon | 35° | 9u | Claustrofóbico |
| boss_arena | 40° | 11u | Balance |

- **Archivo**: `engine.ts` + `SubzoneDef`
- **Esfuerzo**: 30 minutos

---

## 3. Matriz de Impacto

| # | Mejora | Esfuerzo | Impacto visual | Impacto rendimiento | Prioridad |
|---|--------|----------|---------------|-------------------|-----------|
| P0 | Invertir zoom combate | 2 min | ⭐⭐⭐⭐ | — | 🔴 |
| P1 | Cámara −30% | 2 min | ⭐⭐⭐⭐⭐ | — | 🔴 |
| P2 | Escala monstruos +22% | 5 min | ⭐⭐⭐⭐ | — | 🔴 |
| P3 | Sombras proporcionadas | 5 min | ⭐⭐ | — | 🟠 |
| P4 | Reducir terreno forest/volcanic | 2 min | ⭐⭐⭐ | — | 🟠 |
| P5 | Escala props grandes reducida | 5 min | ⭐⭐⭐ | — | 🟠 |
| P6 | Outline/highlight NPCs | 15 min | ⭐⭐⭐⭐ | — | 🟡 |
| P7 | LOD props no-interactivos | 5 min | ⭐ | ⭐⭐⭐⭐ | 🟡 |
| P8 | Blob shadows | 60 min | ⭐⭐⭐⭐ | — | 🔴* |
| P9 | Nameplate con icono | 30 min | ⭐⭐⭐ | — | 🔴* |
| P10 | Ground decals | 120 min | ⭐⭐⭐⭐ | ⭐⭐ | 🟠* |
| P11 | Desaturación terreno −20% | 15 min | ⭐⭐⭐ | — | 🟠* |
| P12 | Cámara por zona | 30 min | ⭐⭐⭐⭐ | — | 🟡* |

\* Fase 2

---

## 4. Jerarquía Visual Propuesta (Post-Fix)

```
Nivel 1: Jugador     → 2.5u @ 11.07u → 31% de pantalla (+43%)
Nivel 2: Bosses      → 4.9u @ 11.07u → 61% de pantalla (IMPONENTE)
Nivel 3: NPCs        → 2.5u + outline azul → reconocibles inmediatamente
Nivel 4: Monstruos   → 2.0–2.7u @ 11.07u → 25-34% de pantalla (legibles)
Nivel 5: Props       → reducidos 20-35% → fondo, no compiten
Nivel 6: Terreno     → saturación -20%, amplitud reducida → base visual neutra
```

---

## 5. Archivos a Modificar

| Archivo | Líneas | Cambios |
|---------|--------|---------|
| `lib/game/engine.ts` | 151, 2589-2590 | Cámara −30%, zoom combate invertido |
| `lib/game/sceneGraph.ts` | 267-270, 281-294, 281-310 | Escala monstruos, sombras, outline NPC |
| `lib/game/terrain/TerrainChunk.ts` | 11-19 | Amplitudes de biomas |
| `lib/game/terrain/PropLibrary.ts` | 29-48 | Escala máxima de props, LOD distances |

---

> Documento generado el 2026-06-01.
> Próximo paso: implementar Fase 1 (P0–P7) comenzando por P1 (cámara) y P2 (monstruos).
