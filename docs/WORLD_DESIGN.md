# 🌍 Epicearth — World Design Document

> **Estado de implementación:** Las zonas sombreadas en verde (✅) están implementadas en el motor actual. El resto es diseño documentado para expansión futura.

## Filosofía

Explorable a pie (sin monturas hasta late-game), con campos conectados visualmente. Cada región se siente distinta por bioma, paleta, vegetación y arquitectura de landmarks. Progresión coherente: el jugador avanza en una **dirección geográfica** clara desde Prontera hacia el exterior.

---

## 1. Continentes

| # | Continente | Tema | Rango Nivel | Ciudad Capital | Estado |
|--|-----------|------|-------------|----------------|--------|
| 1 | **Aeloria** | Praderas, bosques, montañas, costa | 1—50 | Prontera | ✅ Parcial |
| 2 | **Noxia** | Pantanos, ruinas, costa fantasmal | 40—80 | Aldea Sombría | ❌ |
| 3 | **Helios** | Desierto, meseta, volcán | 70—99+ | Santuario del Sol | ❌ |

Cada continente tiene **1 puerto** y **1 paso de montaña** que lo conectan con el siguiente. No hay teletransporte gratuito — el jugador debe caminar.

---

## 2. Regiones de Aeloria (Tutorial → Mid-game)

### 2.1 Campos de la Mañana ✅
| Campo | | |
|------|---|---|
| Ciudad base | **Prontera** | |
| Nivel | 1—10 | |
| Bioma | `grassland` | |
| Landmark | Castillo de Prontera | |
| Función | Tutorial, primeras misiones, familiarización con combate | |
| Monstruos | Poring, Lunático, Fabre, Chonchon | |
| NPCs clave | Kafra Clarice, Instructor Kurt, Guardia, Mensajero, Jardinero, Artesano, Cocinero, Granjero, Curandera, Molinero | |
| Conexiones | → Bosque Umbrío (este, ❌), → Llanuras del Viento (sur, ❌), Mazmorra de Entrenamiento (subsuelo de Prontera ✅) | |

#### Campos adjuntos
- **Campo Mañana 1** ✅ (nvl 1-3) — Poring, Lunático. Chunk en `ZonePresets.ts`.
- **Campo Mañana 2** ✅ (nvl 4-7) — Fabre, Chonchon.
- **Campo Mañana 3** ✅ (nvl 6-10) — Savage Baby, Picky. Mini-boss: **Mandrágora Gigante** (nvl 10).

### 2.2 Bosque Umbrío ❌
| Campo | | |
|------|---|---|
| Ciudad base | **Aldea Roble** | |
| Nivel | 10—22 | |
| Bioma | `forest` | |
| Landmark | Santuario del Bosque (templo de madera con tejado de tejas verdes) | |
| Función | Segunda zona. Introduce monstruos mágicos y plant. | |
| Monstruos | Willow, Thief Bug, Hornet, Eggyra, Creamy | |
| NPCs clave | Druida (vende gemas elementales), Cazador de recompensas | |
| Conexiones | → Montañas de Cristal (norte), → Bosque de las Almas (dungeon, este) | |

> Zona definida en `ZonePresets.ts` como `bosque_umbrio_1/2/3` pero desactivada. Pendiente de habilitar cuando se expanda el mundo más allá de los Campos de la Mañana.

### 2.3 Montañas de Cristal
| Campo | | |
|------|---|---|
| Ciudad base | **Fuerte Hielo** | |
| Nivel | 20—32 | |
| Bioma | `snow` | |
| Landmark | Fortaleza de Hielo Azul (base militar en la montaña) | |
| Función | Zona de nieve. Introduce defensa contra frío y monstruos duros. | |
| Monstruos | Wolf, Orc Warrior, Argiope, Petite, Frilldora | |
| NPCs clave | Herrero de armas de hielo, Mensajero de la guardia | |
| Conexiones | → Llanuras del Viento (sur), → Torre de Hielo (dungeon, cima) | |

#### Campos adjuntos
- **Montañas 1** (nvl 20-24) — Wolf, Argiope. Bosque nevado.
- **Montañas 2** (nvl 23-28) — Orc Warrior, Petite. Cuesta rocosa.
- **Montañas 3** (nvl 26-32) — Frilldora, Orc Archer. Cima con viento cortante. Mini-boss: **Yeti de Cristal** (nvl 32).

### 2.4 Llanuras del Viento ❌
| Campo | | |
|------|---|---|
| Ciudad base | **Puerto Brisa** | |
| Nivel | 30—44 | |
| Bioma | `grassland` (con acantilados costeros) | |
| Landmark | Faro de Puerto Brisa (torre de piedra blanca y cobre oxidado) | |
| Función | Zona de transición entre Aeloria y Noxia. Primer contacto con monstruos acuáticos. | |
| Monstruos | Marina, Vadon, Phen, Savage, Alligator | |
| NPCs clave | Capitán de barco (viaje a Noxia), Maestro de habilidades de viento | |
| Conexiones | → Puerto → Barco a Noxia, → Cueva Marina (dungeon, acantilado este) | |

> Zona definida en `ZonePresets.ts`, desactivada.

---

## 3. Regiones de Noxia (Mid-game → High-mid)

### 3.1 Pantano de Niebla
| Campo | | |
|------|---|---|
| Ciudad base | **Aldea Sombría** | |
| Nivel | 40—55 | |
| Bioma | `swamp` | |
| Landmark | Torre del Pantano (torre de madera podrida con luz verde) | |
| Función | Zona de veneno, niebla, sigilo. | |
| Monstruos | Drainliar, Flora, Hydra, Anacondaq, Pitman | |
| NPCs clave | Alquimista (vende antídotos), Chamán de la niebla | |
| Conexiones | → Ruinas Abisales (este), → Aldea Sombría → Barco a Puerto Brisa | |

#### Campos adjuntos
- **Pantano 1** (nvl 40-44) — Drainliar, Flora. Niebla ligera.
- **Pantano 2** (nvl 43-48) — Hydra, Anacondaq. Agua venenosa.
- **Pantano 3** (nvl 46-55) — Pitman, Myst. Niebla espesa. Mini-boss: **Serpiente de Niebla** (nvl 55).

### 3.2 Ruinas Abisales
| Campo | | |
|------|---|---|
| Ciudad base | **Campamento Ruina** | |
| Nivel | 50—65 | |
| Bioma | `dungeon` (exteriores en ruinas, interiores de mazmorra) | |
| Landmark | Puerta Abisal (arco de piedra negro de 30 m de alto) | |
| Función | Zona de ruinas de civilización antigua. | |
| Monstruos | Golem, Succubus, Incubus, Baphomet Jr., Nightmare | |
| NPCs clave | Arqueólogo, Mercader de reliquias, Guardián de la Puerta | |
| Conexiones | → Criptas Abisales (dungeon, subterráneo), → Costa Fantasma (sur) | |

#### Campos adjuntos
- **Ruinas 1** (nvl 50-55) — Golem, Nightmare. Columnas caídas.
- **Ruinas 2** (nvl 54-60) — Succubus, Incubus. Interior de templo derrumbado.
- **Ruinas 3** (nvl 58-65) — Baphomet Jr., Wraith. Sala del trono destruida. Mini-boss: **Espectro Real** (nvl 65).

### 3.3 Costa Fantasma
| Campo | | |
|------|---|---|
| Ciudad base | — (postas de guardia, sin ciudad) | |
| Nivel | 60—75 | |
| Bioma | `dungeon` / `volcanic` (acantilados oscuros, agua negra) | |
| Landmark | Buque Fantasma (barco varado gigante) | |
| Función | Zona de transición a Helios. Atravesar en barco fantasma. | |
| Monstruos | Deviace, Strouf, Marc, Ghostring, Swordfish | |
| NPCs clave | Capitán fantasma (maldición — te lleva a Helios si vences su trial) | |
| Conexiones | → Barco fantasma → Desierto Solar (Helios) | |

#### Campos adjuntos
- **Costa 1** (nvl 60-65) — Deviace, Marc. Acantilados con niebla negra.
- **Costa 2** (nvl 64-70) — Strouf, Swordfish. Rompeolas.
- **Costa 3** (nvl 68-75) — Ghostring, Demon Pungus. Interior del buque fantasma. Mini-boss: **Capitán Maldito** (nvl 75).

---

## 4. Regiones de Helios (High-level → Endgame)

### 4.1 Desierto Solar
| Campo | | |
|------|---|---|
| Ciudad base | **Oasis Dorado** | |
| Nivel | 70—85 | |
| Bioma | `desert` | |
| Landmark | Obeliscos Gemelos (torres de arenisca de 40 m) | |
| Función | Zona de calor extremo. Monstruos duros de tipo tierra/fuego. | |
| Monstruos | Sandman, Pasana, Mummy, Desert Wolf, Scorpion King | |
| NPCs clave | Mercader de agua, Guía del desierto, Sacerdote del Sol | |
| Conexiones | → Meseta del Cóndor (norte), → Templo del Sol (dungeon, este) | |

#### Campos adjuntos
- **Desierto 1** (nvl 70-74) — Sandman, Mummy. Dunas suaves.
- **Desierto 2** (nvl 73-79) — Pasana, Desert Wolf. Dunas altas con tormentas de arena.
- **Desierto 3** (nvl 77-85) — Scorpion King, Ammut. Ruinas del templo exterior. Mini-boss: **Rey Escorpión** (nvl 85).

### 4.2 Meseta del Cóndor
| Campo | | |
|------|---|---|
| Ciudad base | **Santuario del Sol** | |
| Nivel | 80—92 | |
| Bioma | `snow` (alta montaña) / `grassland` (pradera de altitud) | |
| Landmark | Santuario del Sol (templo circular abierto al cielo) | |
| Función | Zona de monjes, meditación, monstruos celestiales. | |
| Monstruos | Violy, Goat, Owl Baron, Ancient Mummy, Sky Petite | |
| NPCs clave | Sumo Sacerdote, Maestro de vuelo (habilidades de salto/globo) | |
| Conexiones | → Picos Ígneos (este), → Templo del Sol (oeste, entrada trasera) | |

#### Campos adjuntos
- **Meseta 1** (nvl 80-84) — Violy, Goat. Pradera de altitud con viento.
- **Meseta 2** (nvl 83-88) — Owl Baron, Sky Petite. Acantilados con nubes.
- **Meseta 3** (nvl 86-92) — Ancient Mummy, Medusa. Ruinas del santuario antiguo. Mini-boss: **Condor de Piedra** (nvl 92).

### 4.3 Picos Ígneos
| Campo | | |
|------|---|---|
| Ciudad base | **Refugio Ígneo** | |
| Nivel | 90—99+ | |
| Bioma | `volcanic` | |
| Landmark | Caldera del Juicio (cráter activo con núcleo de lava) | |
| Función | Endgame. Última zona antes de contenido de raid. | |
| Monstruos | Ifrit, Flame Skull, Salamander, Lava Golem, Phoenix | |
| NPCs clave | Herrero de lava (arma legendaria), Guardián del Núcleo | |
| Conexiones | → Núcleo Ígneo (dungeon final, interior del volcán) | |

#### Campos adjuntos
- **Picos 1** (nvl 90-93) — Flame Skull, Salamander. Faldas del volcán.
- **Picos 2** (nvl 92-96) — Lava Golem, Ifrit. Cráter exterior.
- **Picos 3** (nvl 95-99+) — Phoenix, Kasa. Cima del cráter. Mini-boss: **Fénix de Ceniza** (nvl 99). Raid opcional.

---

## 5. Dungeons

| Dungeon | Zona | Nivel | Bioma | Jefe Final | Estado |
|---------|------|-------|-------|-----------|--------|
| **Mazmorra de Entrenamiento** | Prontera (subsuelo) | 5—10 | `dungeon` ✅ | Guardián de Cristal (nvl 10) | ✅ |
| **Bosque de las Almas** | Bosque Umbrío | 18—25 | `forest` | Dríada (nvl 25) | ❌ |
| **Torre de Hielo** | Montañas de Cristal | 28—38 | `snow` | Golem de Hielo (nvl 38) | ❌ |
| **Cueva Marina** | Llanuras del Viento | 38—48 | `dungeon` / agua | Kraken Joven (nvl 48) | ❌ |
| **Mazmorra Volcánica** | *(acceso desde Prontera)* | 15—25 | `volcanic` | Demonio de Lava (nvl 25) | ❌ |
| **Criptas Abisales** | Ruinas Abisales | 55—70 | `dungeon` | Lich Abisal (nvl 70) | ❌ |
| **Templo del Sol** | Desierto Solar | 78—90 | `desert` / `dungeon` | Faraón Solar (nvl 90) | ❌ |
| **Núcleo Ígneo** | Picos Ígneos | 95—105 | `volcanic` | Señor del Magma (nvl 105, raid 6 jugadores) | ❌ |

---

## 6. Mapa de Progresión

```
Campos de la Mañana (1-10) ✅
    │
    ├──→ Bosque Umbrío (10-22) ❌
    │         │
    │         └──→ Montañas de Cristal (20-32) ❌
    │                    │
    │                    └──→ Llanuras del Viento (30-44) ❌
    │                               │
    │                               └──→ [Barco] → Pantano de Niebla (40-55) ❌
    │                                             │
    │                                             └──→ Ruinas Abisales (50-65) ❌
    │                                                         │
    │                                                         └──→ Costa Fantasma (60-75) ❌
    │                                                                   │
    │                                                                   └──→ [Barco Fantasma] → Desierto Solar (70-85) ❌
    │                                                                                     │
    │                                                                                     ├──→ Templo del Sol [78-90] ❌
    │                                                                                     │
    │                                                                                     └──→ Meseta del Cóndor (80-92) ❌
    │                                                                                                │
    │                                                                                                └──→ Picos Ígneos (90-99+) ❌
    │                                                                                                           │
    │                                                                                                           └──→ Núcleo Ígneo [95-105] ❌
    │
    └──→ Mazmorra Volcánica [15-25] ❌ (desvío lateral desde Prontera)
```

### Rutas alternativas (exploración)
- **Prontera → Mazmorra Volcánica**: salida directa desde las alcantarillas de Prontera (nvl 15-25). Permite subir rápido si el jugador conoce el camino.
- **Puerto Brisa → Aldea Sombría**: barco directo (nvl 35+ recomendado).
- **Costa Fantasma → Oasis Dorado**: barco fantasma (requiere vencer trial del capitán).
- **Meseta del Cóndor → Templo del Sol (entrada trasera)**: atajo para grupos (nvl 80+).

---

## 7. NPCs Recurrentes (World Builders)

| NPC | Rol | Aparece en |
|-----|-----|-----------|
| **Viajero Errante** | Vende mapas, da pistas de áreas secretas | Todas las ciudades |
| **Maestro de Gremio** | Quests de clase, skills avanzadas | Prontera, Santuario del Sol |
| **Mercader Volante** | Inventario rotativo, objetos raros | Campos aleatorios |
| **Guardían de Paso** | Controla acceso a zonas de alto nivel | Entrada de Montañas, Costa Fantasma, Picos |
| **Chamán de los Vientos** | Teletransporte de un solo sentido (ciudad → campo lejano) | Aldea Roble, Oasis Dorado |

---

## 8. Principios de Diseño de Mapas (para implementación futura)

1. **Cada campo = 1 chunk de 32×32 del sistema TerrainChunk.** Ciudades pueden ocupar 1-4 chunks.
2. **Transiciones suaves**: los biomas adyacentes comparten un borde de 1 chunk de transición (gradiente de weight map).
3. **Cobertura visual**: cada campo tiene 1-2 landmarks visibles desde lejos para orientación.
4. **Densidad de monstruos**: ~8-12 spawns por chunk activo. Nunca más de 15 visibles a la vez (mobile-first).
5. **Caminos**: todo campo tiene al menos 1 camino de tierra que cruza de borde a borde (guía visual).
6. **Puntos de descanso**: cada 2-3 campos hay un puesto con NPC mercader y save point.
7. **Evitar callejones sin salida**: todo campo debe conectar a ≥2 salidas (excepto mapas de boss).
