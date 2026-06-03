# Epicearth — Mobile Exploration Pass

## Filosofía

Este documento redefine el diseño de mapas para **sesiones mobile first** (360×640, 390×844, 412×915). La regla fundamental:

> **Cada mapa debe poder recorrerse por completo en 30–60 segundos. El jugador nunca camina más de 15 segundos sin encontrar algo interactuable.**

Esto elimina el diseño de "campos enormes y vacíos" típico de PC MMORPG y lo reemplaza por un ritmo de **exploración rápida con descubrimiento constante**.

---

## 1. Plantilla de mapa mobile

### 1.1 Elementos obligatorios por mapa

| # | Elemento | Función | Distancia desde spawn |
|---|----------|--------|----------------------|
| 1 | **Spawn Point** | Punto de entrada al mapa | — |
| 2 | **Landmark Principal** | Referencia visual, orientación | 10–20s |
| 3 | **Zona de Combate** | 3–5 spawns de monstruos, agrupados | 8–15s |
| 4 | **NPC Útil** | Mercader, Kafra, quest giver, o sanador | 10–20s |
| 5 | **Portal de Salida** | Conexión a siguiente zona | 20–30s (desde spawn) |

### 1.2 Distancias máximas (medidas a velocidad de caminata base ~4m/s)

| Segmento | Tiempo | Distancia en unidades |
|----------|--------|---------------------|
| Spawn → primer POI visible | ≤5s | ≤20u |
| Spawn → Landmark | 10–20s | 40–80u |
| Landmark → Portal de salida | 10–20s | 40–80u |
| Entre POIs consecutivos | ≤15s | ≤60u |
| Recorrido completo (spawn → portal más lejano) | 30–60s | 120–240u |

### 1.3 Layout espacial estándar

```
  ┌─────────────────────────────────┐
  │   Zona de entrada               │
  │   [Spawn] ──(5s)── [NPC]       │
  │       │                         │
  │       │(10s)                    │
  │       ▼                         │
  │   ◎ Landmark Principal          │
  │    (visible desde spawn)        │
  │       │                         │
  │   ╔══╪══╗                      │
  │   ║ ZC ║  Zona de Combate      │
  │   ╚══╪══╝  3-5 spawns          │
  │       │                         │
  │       │(10-20s)                 │
  │       ▼                         │
  │   [Portal de Salida]            │
  │   → Siguiente zona              │
  └─────────────────────────────────┘
```

- **Trayectoria lineal con desvíos**: el camino principal va del spawn al portal pasando por el landmark. La zona de combate es un desvío lateral de 5–10s.
- **Landmark visible desde spawn**: el jugador siempre sabe hacia dónde ir.
- **NPC en la ruta**: aparece antes del landmark o justo después, nunca en un callejón sin salida.

### 1.4 Tamaño del mapa

- **Área total**: 160×160u a 240×240u (1 chunk de 32×32 = 32u → 5×5 a 7.5×7.5 chunks)
- Prontera es la excepción: ocupa 2 chunks adyacentes por su densidad de edificios.
- Mapas de tipo `dungeon` pueden ser más pequeños (120×120u) por ser lineales.

---

## 2. Prontera — Plaza del Alba (mapa ciudad)

### Layout existente (ya cumple mobile)

```
      [CASTILLO] ← Landmark visible desde todo el mapa
          │
    [Gremios]   [Gremio]
          │
    [Kafra ★] ← NPC útil (E)
          │
    [⛲ FUENTE] ← SPAWN (centro)
        ╱ ╲
  [Mercado] [Instructor] ← NPCs útiles
      (SE)      (SO)
```

**Validación mobile**:

| Segmento | Distancia | Tiempo |
|----------|-----------|--------|
| Spawn → Kafra | 15 pasos (~12u) | ~3s |
| Spawn → Mercado | 20 pasos (~16u) | ~4s |
| Spawn → Instructor | 22 pasos (~18u) | ~4.5s |
| Spawn → Gremio Mago | 30 pasos (~24u) | ~6s |
| Spawn → Castillo (visual) | 60 pasos (~48u) | ~12s |
| Spawn → Portal CM1 | 35 pasos (~28u) | ~7s |
| Spawn → Portal CM2 | 35 pasos (~28u) | ~7s |
| **Recorrido completo** (visitar todos los servicios) | ~80u | **~20s** |

✅ Cumple. Prontera es un hub denso donde todo está a <30 pasos.

### Mejora propuesta

1. Añadir **2 carteles direccionales** (ya existen como `signpost_guide` en GATE_ARCH) visibles desde la fuente que señalen: "→ Campo Mañana 1" (Oeste) y "→ Campo Mañana 2" (Este).
2. Marcar el suelo con **línea de piedra clara** desde la fuente hasta cada salida (guía visual sin minimapa).

---

## 3. Campo Mañana 1 — Pradera del Alba

### Layout actual

```
               ┌─────────────────────────────────┐
               │   [Spawn] (centro, 16,16)       │
               │       │                         │
               │       │(2s)                     │
               │   [Guide Post] (4,20)           │
               │       │                         │
               │       │(5-8s)                   │
               │   ◎ Centinela Tree (20,10)      │
               │       │                         │
               │   ╔══╪══╗                      │
               │   ║ ZC ║  Rocas + escombros    │
               │   ╚══╪══╝  ~25 props           │
               │       │                         │
               │       │(10-15s)                 │
               │   [Portal → CM2] → (32,16)      │
               └─────────────────────────────────┘
```

**Validación mobile**:

| Segmento | Posiciones | Distancia | Tiempo |
|----------|-----------|-----------|--------|
| Spawn → Guide Post | (16,16)→(4,20) | ~12.6u | ~3s |
| Spawn → Centinela Tree | (16,16)→(20,10) | ~7.2u | ~2s |
| Centinela → ZC más lejana | (20,10)→~28u | ~20u | ~5s |
| Spawn → Portal CM2 | (16,16)→(32,16) | 16u | **4s** ❌ demasiado corto |
| **Recorrido completo** | spawn→ZC→portal | ~60u | **~15s** ❌ |

**Problemas**:
- El mapa es demasiado pequeño (1 chunk de 32×32u centrado en (16,16)).
- El portal está a solo 16u del spawn — el jugador lo cruza sin explorar.
- No hay NPC útil en el mapa.

### Rediseño CM1

Expandir a **2 chunks** (64×64u ≈ 16s de punta a punta):

```
               ┌─────────────────────────────────────┐
     spawn     │                                        │
  [Prontera]───┤  [Spawn]  ──(5s)── [Kafra Portátil]    │
               │      │              (NPC, guarda/venta) │
               │      │(8s)                              │
               │      ▼                                  │
               │  ◎ Centinela Tree (Landmark)            │
               │      │                                  │
               │  ╔═══╪═══╗   Zona de Combate (8 spawns)│
               │  ║ ZC-A ║   Poring, Lunático            │
               │  ╚═══╪═══╝                              │
               │      │(10s)                             │
               │  ╔═══╪═══╗                              │
               │  ║ ZC-B ║   Fabre, Chonchon             │
               │  ╚═══╪═══╝  (sube de nivel rápido)      │
               │      │                                  │
               │  [Portal → CM2]                         │
     portal───┤                                        │
               └─────────────────────────────────────┘
```

**Nuevas validaciones**:

| Segmento | Distancia | Tiempo |
|----------|-----------|--------|
| Spawn → Kafra Portátil | ~20u | ~5s |
| Spawn → Centinela Tree | ~32u | ~8s |
| Centinela → ZC más lejana | ~24u | ~6s |
| ZC → Portal CM2 | ~40u | ~10s |
| **Recorrido completo** | ~120u | **~30s** ✅ |

### Elementos a añadir

1. **Kafra Portátil** (nuevo NPC, carpa pequeña con toldo azul en (8, 20)) — guarda partida, vende pociones básicas.
2. **Zona de Combate B** (expansión de monstruos hacia el este antes del portal).
3. **Cartel en el portal**: "→ Campo Mañana 2 — Llanura de los Écoles [nvl 4-7]".
4. **Caminos de tierra** que conecten visualmente spawn → landmark → portal.

---

## 4. Campo Mañana 2 — Llanura de los Écoles

### Layout actual

```
               ┌─────────────────────────────────┐
               │  [Spawn] (48,16)                │
               │      │                          │
               │      │(5s)                      │
               │  [Stone Circle] (42,10)          │
               │      │                          │
               │      │(8s)                      │
               │  ◎ Ecoles Nest (52,20)          │
               │      │                          │
               │  ╔═══╪═══╗                     │
               │  ║ ZC ║  Ruinas + rocas        │
               │  ╚═══╪═══╝  ~50 props          │
               │      │                          │
               │      │(10s)                     │
               │  [Portal → Camino Este] → (64,16)│
               └─────────────────────────────────┘
```

**Validación mobile**:

| Segmento | Distancia | Tiempo |
|----------|-----------|--------|
| Spawn → Stone Circle | ~8.5u | ~2s ❌ |
| Stone Circle → Ecoles Nest | ~14u | ~3.5s ❌ |
| Spawn → Portal | 16u | **4s** ❌ |

**Problemas**: mismo problema que CM1 — el tamaño de 1 chunk hace que todo esté demasiado cerca.

### Rediseño CM2

Expandir a **2 chunks** (64×64u):

```
               ┌─────────────────────────────────────┐
               │  [Spawn ← CM1]                       │
               │      │                              │
               │      │(8s)                           │
               │  ◎ Ecoles Nest (Landmark)            │
               │      │  + Stone Circle (secundario)  │
               │      │                              │
               │  ╔═══╪═══╗   ZC-A: Thief Bug, Hornet │
               │  ║ ZC ║     (nvl 4-7)               │
               │  ╚═══╪═══╝                          │
               │      │                              │
               │  [NPC Cazador] (vende loot, da quest)│
               │      │                              │
               │      │(8-12s)                        │
               │  ╔═══╪═══╗                          │
               │  ║ ZC ║   ZC-B: Eggyra, Creamy      │
               │  ╚═══╪═══╝  (nvl 6-10)             │
               │      │                              │
               │  [Portal → CM3 / Bosque Umbrío]      │
               │      │                              │
               └─────────────────────────────────────┘
```

| Segmento | Distancia | Tiempo |
|----------|-----------|--------|
| Spawn → Ecoles Nest | ~30u | ~7.5s ✅ |
| Ecoles → NPC Cazador | ~16u | ~4s |
| NPC → ZC-B | ~24u | ~6s |
| ZC-B → Portal | ~32u | ~8s |
| **Recorrido completo** | ~130u | **~32s** ✅ |

---

## 5. Campo Mañana 3 — Laderas del Molino

### Layout actual

Chunks: (0-1, 1-2) = 2 chunks. `recommendedLevel: [15, 30]`. Props dispersas.

**Problema**: tiene el tamaño correcto (2 chunks) pero carece de elementos estructurados. Sin NPC, sin zona de combate claramente marcada, sin landmark visible desde spawn.

### Rediseño CM3

```
               ┌─────────────────────────────────────┐
               │  [Spawn ← CM1]                       │
               │      │                              │
               │      │(5s)                           │
               │  [NPC Pastor] (da quest "Lobos en    │
               │      │   las laderas")               │
               │      ▼                              │
               │  ◎ Molino de Viento (Landmark)       │
               │      │  (visible desde spawn)        │
               │      │                              │
               │  ╔═══╪═══╗   ZC-A: Savage Baby,      │
               │  ║ ZC ║     Picky (nvl 6-10)        │
               │  ╚═══╪═══╝                          │
               │      │                              │
               │      │(8-12s)                        │
               │  ╔═══╪═══╗                          │
               │  ║ ZC ║   ZC-B: Mini-boss            │
               │  ╚═══╪═══╝  Mandrágora Gigante      │
               │      │    (nvl 10, revive 5min)      │
               │      │                              │
               │  [Portal → Bosque Umbrío / Volcánica] │
               │      │                              │
               └─────────────────────────────────────┘
```

| Segmento | Distancia | Tiempo |
|----------|-----------|--------|
| Spawn → Pastor | ~20u | ~5s |
| Pastor → Molino | ~24u | ~6s |
| Molino → ZC-A | ~16u | ~4s |
| ZC-A → ZC-B (mini-boss) | ~28u | ~7s |
| ZC-B → Portal | ~20u | ~5s |
| **Recorrido completo** | ~140u | **~35s** ✅ |

---

## 6. Tabla resumen de todos los mapas

| Mapa | Chunks | Tamaño | Tiempo recorrido | NPCs | Zonas Combate | Landmarks | Estado |
|------|--------|--------|-----------------|------|---------------|-----------|--------|
| Prontera | 2 | 64×64u | ~20s ✅ | 5+ | 0 (safe) | Castillo, Fuente | ✅ |
| CM1 | 1→**2** | 32×32→**64×64**u | 15s→**30s** ✅ | 0→1 | 1→2 | Centinela | 🔄 |
| CM2 | 1→**2** | 32×32→**64×64**u | 15s→**32s** ✅ | 0→1 | 1→2 | Ecoles Nest | 🔄 |
| CM3 | 2 | 64×64u | →**35s** ✅ | 0→1 | 1→2 | Molino | 🔄 |
| Bosque Umbrío 1 | 2 | 64×64u | **35s** ✅ | 1 | 2 | Santuario | 📝 |
| Bosque Umbrío 2 | 2 | 64×64u | **35s** ✅ | 1 | 2 | Claro | 📝 |
| Bosque Umbrío 3 | 2 | 64×64u | **40s** ✅ | 0 | 2+mini-boss | Árbol Alma | 📝 |
| Montañas 1 | 2 | 64×64u | **35s** | 1 | 2 | Fortaleza Hielo | 📝 |
| Montañas 2 | 2→**3** | 64×64→**80×80**u | **40s** | 1 | 2 | Cuesta Rocosa | 📝 |
| Montañas 3 | 3 | 80×80u | **45s** | 0 | 2+mini-boss | Cima | 📝 |
| Llanuras 1 | 2 | 64×64u | **35s** | 1 | 2 | Faro | 📝 |
| Llanuras 2 | 2 | 64×64u | **35s** | 1 | 2 | Acantilado | 📝 |
| Llanuras 3 | 2 | 64×64u | **40s** | 0 | 2+mini-boss | Cueva Marina | 📝 |

**Leyenda**: ✅ cumple | 🔄 necesita rediseño | 📝 pendiente de implementar

---

## 7. Principios de diseño mobile (adicionales)

### 7.1 Campo visual y orientación

- **El landmark principal debe ocupar ≥5% del ancho de pantalla** a 360px de resolución desde el spawn. Si el landmark es pequeño (como un poste), añadir un **árbol centinela** o **bandera alta** al lado que sea visible.
- **Nunca más de 2 decisiones de ruta por mapa**. El jugador mobile decide: ¿voy directo al portal o paso por la ZC a farmear? No más opciones.
- **Contraste de color**: el camino principal debe diferenciarse del terreno circundante. Senda de tierra (marrón) sobre pasto (verde).

### 7.2 Densidad de monstruos

- **5–8 monstruos visibles máximo** (por rendimiento mobile y claridad visual).
- Spawn en grupos de 2–3, no individuales.
- Distancia mínima entre grupos: 12u (3s de caminata) — evita aglomeraciones.
- Los monstruos **no deben estar en el camino directo al portal** — el jugador que solo quiere avanzar no debe ser forzado a combatir.

### 7.3 NPCs

- 1 NPC por mapa como mínimo (excepto mapas de boss/mini-boss donde el boss es el POI).
- NPC siempre en la ruta principal, nunca escondido.
- Distancia máxima NPC → banco/silla cercano: 4u.
- Los NPCs deben tener un **globo de diálogo visible** desde 20u (suficiente para que el jugador decida si acercarse).
- Usar el sistema de `purpose` + `subzoneId` ya definido en `MapZone` para asociar NPCs a mapas.

### 7.4 Portales

- Todo portal debe tener un **marco visual distintivo**: arco de piedra, puente de madera, puerta brillante.
- El nombre del destino debe ser visible en el portal (cartel o texto flotante).
- Los portales de salida están siempre en el **borde opuesto al spawn** para maximizar el recorrido.
- Mapas de 2 chunks: spawn en un extremo, portal en el extremo opuesto.

### 7.5 Implementación técnica (chunks y ZonePresets)

- Cada mapa mobile = 2 chunks contiguos (64×64u) como estándar.
- Chunk size actual: 32×32u. Esto da 64s de recorrido de punta a punta a 4m/s.
- Para mapas de 3 chunks (Montañas 3, Núcleo Ígneo), el tiempo aumenta proporcionalmente.
- Usar `connections[]` en `MapZone` para definir rutas de portal → siguiente zona.
- El `recommendedLevel` debe ser preciso para que el `MapStreamer` pueda hacer sugerencias en los carteles de portal.

---

## 8. Checklist de validación mobile por mapa

- [ ] Recorrido completo spawn → portal en 30–60s
- [ ] Landmark principal visible desde el spawn
- [ ] Distancia spawn → landmark ≤20s
- [ ] Distancia landmark → portal ≤20s
- [ ] Máximo 15s entre POIs consecutivos
- [ ] Al menos 1 NPC útil en la ruta principal
- [ ] 2 zonas de combate con 3–5 spawns cada una
- [ ≤ ] 8 monstruos visibles simultáneamente
- [ ] Portal con marco visual distintivo + nombre del destino
- [ ] Camino principal diferenciado visualmente del terreno
- [ ] Máximo 2 decisiones de ruta por mapa
- [ ] Tamaño de 2 chunks (64×64u) para mapas estándar
- [ ] Sin monstruos en el camino directo al portal
- [ ] NPCs con globo de diálogo visible desde 20u
