# MAP_DATABASE — Ragnarok Engine World

## Filosofía

14 mapas. Cada uno con propósito, identidad, y contenido propio.
Sin terreno vacío. Sin mapas de transición. El jugador siempre tiene algo que hacer,
un monstruo que cazar, un NPC con quien hablar, o un portal al que dirigirse.

Progresión de nivel:

```
Nivel 1-3   ▰▰▰▰▰▰▰▰▰▰▱▱▱▱▱▱▱▱▱▱▱▱▱▱▱  Campo de Prontera · Pradera del Alba
Nivel 4-7   ▰▰▰▰▰▰▰▰▰▰▰▰▰▱▱▱▱▱▱▱▱▱▱▱▱  Laderas del Molino · Camino del Este
Nivel 8-12  ▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▱▱▱▱▱▱▱  Bosque Umbrío · Colinas Ventosas
Nivel 10-16 ▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▱▱▱▱  Cuevas · Ruinas · Costa
Nivel 15-22 ▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▱  Santuario · Mazmorra Abandonada
Nivel 20-25 ▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰  Castillo Olvidado
```

Conexiones:

```
Prontera ──→ Campo Prontera ──→ Laderas Molino
   │                                │
   │                            Colinas Ventosas
   │                                │
   ↓                           Cueva de Cristal
Training Dungeon
   │
Prontera ──→ Pradera Alba ──→ Camino Este ──→ Bosque Umbrío
                                                  │    │
                                              Cueva    Costa
                                              Susurros  del Eco
                                                  │
                                              Ruinas Ancestrales ──→ Castillo Olvidado
                                                  │
                                            Santuario Olvidado ────┘
```

---

## MAPA 01 — Prontera · Plaza del Alba

| Campo | Valor |
|---|---|
| Propósito | Ciudad principal. Hub central del mundo. |
| Tamaño | 64×64 (pequeño) |
| Bioma | city |
| Nivel | — (zona segura) |
| Monstruos | Ninguno |
| NPCs | Kafra, Skill Trainer, Herrero, Alquimista, Quest Giver, 2 guardias |
| Portales | → Campo de Prontera, → Mazmorra de Entrenamiento |
| Landmarks | Fuente central, Castillo, Catedral |
| Estado | ✅ Existente |

## MAPA 02 — Campo de Prontera

| Campo | Valor |
|---|---|
| Propósito | Primer contacto con combate. Tutorial de combate y loot. |
| Tamaño | 80×80 (pequeño) |
| Bioma | plains |
| Nivel | 1-3 |
| Monstruos | Poring ×3, Lunatic ×2, Fabre ×1 |
| NPCs | Guía del Campo |
| Portales | → Prontera, → Laderas del Molino |
| Landmarks | Estanque, arboleda |
| Estado | ✅ Existente |

## MAPA 03 — Pradera del Alba

| Campo | Valor |
|---|---|
| Propósito | Ruta alternativa de inicio. Conexión al este. |
| Tamaño | 80×80 (pequeño) |
| Bioma | plains |
| Nivel | 1-4 |
| Monstruos | Poring ×2, Lunatic ×2, Pupa ×3 |
| NPCs | — |
| Portales | → Prontera, → Camino del Este |
| Landmarks | Ruina circular de piedra, flores brillantes |
| Estado | 🆕 A implementar |

## MAPA 04 — Camino del Este

| Campo | Valor |
|---|---|
| Propósito | Ruta comercial en desuso. Puente entre pradera y bosque. |
| Tamaño | 100×100 (estándar) |
| Bioma | plains |
| Nivel | 5-8 |
| Monstruos | Picky ×3, Fabre ×2, Chonchon ×2 |
| NPCs | Guardia del Bosque, Mercader Sombrío |
| Portales | → Pradera del Alba, → Bosque Umbrío |
| Landmarks | Puente de piedra, torre de vigilancia derrumbada |
| Estado | 🆕 A implementar |

## MAPA 05 — Laderas del Molino

| Campo | Valor |
|---|---|
| Propósito | Zona de colinas. Primeros monstruos agresivos. |
| Tamaño | 72×72 (pequeño) |
| Bioma | mountain |
| Nivel | 4-7 |
| Monstruos | Picky ×2, Savage Baby ×2, Lunatic ×2, Pecopeco ×1 |
| NPCs | Mol Molinero |
| Portales | → Campo de Prontera |
| Landmarks | Molino de viento gigante, afloramientos rocosos |
| Estado | ✅ Existente |

## MAPA 06 — Bosque Umbrío

| Campo | Valor |
|---|---|
| Propósito | Bosque denso y oscuro. Primer gran salto de dificultad. |
| Tamaño | 120×120 (estándar) |
| Bioma | forest |
| Nivel | 8-12 |
| Monstruos | Spore ×5, Drainliar ×3, Stalker ×2, Will-o'-Wisp ×2 |
| NPCs | Espíritu del Bosque |
| Portales | → Camino del Este, → Cueva de los Susurros, → Costa del Eco |
| Landmarks | Árbol ancestral, claro de lunazul, estanque de aguas negras |
| Estado | 🆕 A implementar |

## MAPA 07 — Colinas Ventosas

| Campo | Valor |
|---|---|
| Propósito | Terreno alto y abierto. Contraste al bosque. |
| Tamaño | 100×100 (estándar) |
| Bioma | plains |
| Nivel | 8-12 |
| Monstruos | Savage Baby ×3, Pecopeco ×3, Argiope ×2 |
| NPCs | — |
| Portales | → Laderas del Molino, → Cueva de Cristal |
| Landmarks | Cresta del viento, aerogenerador antiguo, nido de Pecopeco |
| Estado | 🆕 A implementar |

## MAPA 08 — Ruinas Ancestrales

| Campo | Valor |
|---|---|
| Propósito | Desierto con ruinas de civilización perdida. |
| Tamaño | 120×120 (estándar) |
| Bioma | desert |
| Nivel | 12-16 |
| Monstruos | Argiope ×3, Shining Plant ×3, Stalker ×2 |
| NPCs | Arqueólogo Eldric |
| Portales | → Cueva de los Susurros, → Santuario Olvidado |
| Landmarks | Templo en ruinas, obelisco, esfinge, oasis |
| Estado | 🆕 A implementar |

## MAPA 09 — Costa del Eco

| Campo | Valor |
|---|---|
| Propósito | Zona costera de acantilados y playa. Dead-end intencional. |
| Tamaño | 120×120 (estándar) |
| Bioma | mountain (con agua) |
| Nivel | 12-16 |
| Monstruos | Drainliar ×4, Argiope ×2, Shining Plant ×2 |
| NPCs | — |
| Portales | → Bosque Umbrío |
| Landmarks | Faro del Eco, barco encallado, gruta marina |
| Estado | 🆕 A implementar |

## MAPA 10 — Cueva de los Susurros

| Campo | Valor |
|---|---|
| Propósito | Primera cueva. Educación sobre mazmorras. |
| Tamaño | 80×80 (pequeño) |
| Bioma | dungeon |
| Nivel | 10-13 |
| Monstruos | Drainliar ×3, Will-o'-Wisp ×3, Spore ×3 |
| NPCs | — |
| Portales | → Bosque Umbrío, → Ruinas Ancestrales |
| Landmarks | Estalactitas, pozo sin fondo, altar de piedra |
| Estado | 🆕 A implementar |

## MAPA 11 — Cueva de Cristal

| Campo | Valor |
|---|---|
| Propósito | Cueva luminosa de cristales. Recurso minero. |
| Tamaño | 80×80 (pequeño) |
| Bioma | mountain (interior) |
| Nivel | 12-16 |
| Monstruos | Chonchon (variante cristal) ×4, Shining Plant ×3 |
| NPCs | — |
| Portales | → Colinas Ventosas |
| Landmarks | Sala de cristales, lago subterráneo, geoda gigante |
| Estado | 🆕 A implementar |

## MAPA 12 — Mazmorra de Entrenamiento

| Campo | Valor |
|---|---|
| Propósito | Mazmorra tutorial. Intro a mazmorras. |
| Tamaño | 48×48 (pequeño) |
| Bioma | dungeon |
| Nivel | 1-3 |
| Monstruos | Poring ×4, Lunatic ×2, Fabre ×2, Chonchon ×2 |
| NPCs | — |
| Portales | → Prontera |
| Landmarks | Pilares, antorchas, sala con cofre |
| Estado | ✅ Existente |

## MAPA 13 — Santuario Olvidado

| Campo | Valor |
|---|---|
| Propósito | Mazmorra templo. Penúltimo desafío. |
| Tamaño | 100×100 (estándar) |
| Bioma | dungeon |
| Nivel | 15-20 |
| Monstruos | Master Drainliar ★ ×2, Dark Guardian ×2, Argiope ×3 |
| NPCs | Sabio Mathius |
| Portales | → Ruinas Ancestrales, → Castillo Olvidado |
| Landmarks | Sala del altar, puerta sellada, estatua del guardián |
| Estado | 🆕 A implementar |

## MAPA 14 — Castillo Olvidado

| Campo | Valor |
|---|---|
| Propósito | Mapa final. Fortaleza tomada por las sombras. |
| Tamaño | 180×180 (grande) |
| Bioma | city (en ruinas) |
| Nivel | 20-25 |
| Monstruos | Dark Guardian ★★ ×4, Master Drainliar ★ ×3, Stalker ×3, Señor Oscuro ★★★ |
| NPCs | — |
| Portales | → Santuario Olvidado, → Ruinas Ancestrales (atajo one-way) |
| Landmarks | Torre del homenaje, sala del trono, patio de armas |
| Estado | 🆕 A implementar |
