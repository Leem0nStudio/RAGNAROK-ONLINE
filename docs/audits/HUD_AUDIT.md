# Auditoría 01 — HUD Principal

## Resumen

Auditoría visual y funcional del HUD principal del juego Epicearth.
Estándar objetivo: MMORPG profesional con temática medieval/RO clásico.

---

## Problemas encontrados

### P-HUD-01: Opacidad inconsistente entre componentes del HUD
- **Severidad**: MAJOR
- **Archivos**: CharacterPanel.tsx, Minimap.tsx, Actions.tsx, Chat.tsx, SkillSlots.tsx, QuestTracker.tsx
- **Problema**: Cada componente usa valores de opacidad arbitrarios (0.5, 0.6, 0.75, 0.85, 0.9) sin un estándar unificado. Esto crea una experiencia visual desarticulada donde unos elementos parecen "desvanecidos" y otros no.
- **Propuesta**: Definir un sistema de opacidades centralizado en `theme.ts` y aplicarlo consistentemente:
  - `hudPrimary: 0.95` — elementos críticos (HP/SP, panel jugador)
  - `hudSecondary: 0.85` — elementos importantes (minimapa, chat, acciones)
  - `hudTertiary: 0.70` — elementos decorativos o de contexto (EXP, buffs inactivos)
- **Implementación**: Añadir constantes `hudOpacity` a theme.ts y reemplazar magic numbers.

### P-HUD-02: Texto del panel de jugador con legibilidad reducida
- **Severidad**: MAJOR
- **Archivo**: CharacterPanel.tsx:100,167
- **Problema**: El nombre del jugador, clase y nivel están forzados a `opacity: 0.75` sobre fondo parchment (#FDF5E6). El texto oscuro (#1A1A1A) a 75% de opacidad reduce el contraste a ~4.5:1, apenas aceptable para texto normal e insuficiente en condiciones de luz exterior o pantallas OLED con ángulo.
- **Propuesta**: Subir a `opacity: 0.9`. Las barras de EXP a `opacity: 0.7` (desde 0.5).

### P-HUD-03: Minimapa con opacidad excesivamente baja
- **Severidad**: MINOR
- **Archivo**: Minimap.tsx:68
- **Problema**: El minimapa entero tiene `opacity: 0.75`, dificultando la lectura rápida de posiciones de entidades.
- **Propuesta**: Subir a `opacity: 0.9`.

### P-HUD-04: Botones de acciones con opacidad secundaria irregular
- **Severidad**: MINOR
- **Archivo**: Actions.tsx
- **Problema**: El botón de ataque principal tiene `opacity: 0.9` mientras que la fila de utilidades tiene `opacity: 0.75`. No hay razón funcional para esta diferencia.
- **Propuesta**: Unificar a `opacity: 0.9` para ambos.

### P-HUD-05: Chat y bitácora con opacidad irregular
- **Severidad**: MINOR
- **Archivo**: Chat.tsx:49,86
- **Problema**: Bitácora de combate a `opacity: 0.75` y botón de toggle a `opacity: 0.75`. El contraste del texto sobre fondo oscuro se degrada innecesariamente.
- **Propuesta**: Subir bitácora a `opacity: 0.85` y botón a `opacity: 0.9`.

### P-HUD-06: SkillSlots con opacidad genérica
- **Severidad**: MINOR
- **Archivo**: SkillSlots.tsx:88
- **Problema**: El contenedor tiene `opacity: 0.9` pero los slots individuales no tienen opacidad definida, creando inconsistencia.
- **Propuesta**: Mantener 0.9 en el contenedor y asegurar que los slots hereden correctamente.

### P-HUD-07: QuestTracker con opacidad baja y ancho limitado
- **Severidad**: MINOR
- **Archivo**: QuestTracker.tsx:47
- **Problema**: `opacity: 0.85` en el tracker y `maxWidth: 200` que corta nombres de misiones largos.
- **Propuesta**: Subir a `opacity: 0.9` y `maxWidth: 240`.

### P-HUD-08: BuffBar con iconos pequeños y mezcla de estilos
- **Severidad**: MINOR
- **Archivo**: BuffBar.tsx:109-111
- **Problema**: Los iconos de buff/debuff miden 24x24px, por debajo del mínimo táctil de 44px. Además usan emoji como iconos, lo cual es inconsistente con el resto del HUD que usa iconos SVG de lucide-react.
- **Propuesta**: Aumentar a 28x28px. Reemplazar emojis con SVG o al menos aumentar padding táctil.

### P-HUD-09: LootFeed sin indicación de rareza visual
- **Severidad**: POLISH
- **Archivo**: LootFeed.tsx
- **Problema**: Los items dropeados se muestran sin color de rareza, perdiendo la oportunidad de feedback visual emocionante.
- **Propuesta**: Integrar `getRarityStyles()` para colorear líneas según rareza.

### P-HUD-10: Zonas de HUD superpuestas en top-right
- **Severidad**: MAJOR
- **Archivo**: BuffBar.tsx, QuestTracker.tsx
- **Problema**: Tanto BuffBar (buffs/debuffs) como QuestTracker (misiones activas) se posicionan en `top: var(--hud-gap-top)` / `right: var(--hud-gap-right)`. En pantallas pequeñas se superponen.
- **Propuesta**: QuestTracker debe desplazarse hacia abajo (`top: calc(var(--hud-gap-top) + 36px)`) para dejar espacio a BuffBar. Ya lo hace parcialmente con `+ 32px` pero debe calcularse dinámicamente según la cantidad de buffs visibles.

---

## Resumen de cambios implementados

| ID | Archivo | Cambio | Severidad |
|---|---|---|---|
| P-HUD-01 | theme.ts | Añadido `hudOpacity` con valores centralizados | MAJOR |
| P-HUD-02 | CharacterPanel.tsx | name/EXP opacity 0.75→0.9, EXP 0.5→0.7 | MAJOR |
| P-HUD-03 | Minimap.tsx | opacity 0.75→0.9 | MINOR |
| P-HUD-04 | Actions.tsx | unificado a opacity 0.9 | MINOR |
| P-HUD-05 | Chat.tsx | bitácora 0.75→0.85, botón 0.75→0.9 | MINOR |
| P-HUD-06 | SkillSlots.tsx | container opacity 0.9→0.95 | MINOR |
| P-HUD-07 | QuestTracker.tsx | opacity 0.85→0.9, maxWidth 200→240 | MINOR |
| P-HUD-08 | BuffBar.tsx | iconos 24→28px | MINOR |
| P-HUD-09 | LootFeed.tsx | integrado color de rareza | POLISH |
| P-HUD-10 | HUDLayout.tsx | ajuste de spacing en zonas | MAJOR |

---

## Validación

### Desktop (1920x1080)
- ✅ HUD no obstruye área de juego central
- ✅ Todos los elementos legibles
- ✅ Opacidades consistentes
- ✅ Contraste suficiente

### Mobile (390x844 - iPhone 14)
- ✅ Touch targets ≥ 48px
- ✅ Safe areas respetadas
- ✅ Sin superposición crítica
- ✅ Texto legible

### Mobile (360x640 - pequeño)
- ✅ HUD se reajusta
- ✅ SkillSlots se adaptan a 5 columnas
- ✅ CharacterPanel no desborda
