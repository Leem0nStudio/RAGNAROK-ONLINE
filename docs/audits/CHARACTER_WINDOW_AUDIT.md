# Auditoría 02 — Character Window (StatusWindow)

## Resumen

Auditoría de la ventana de estadísticas del personaje, incluyendo distribución de stats,
progresión, equipamiento conceptual y legibilidad en móvil.

---

## Problemas encontrados

### P-CHAR-01: Ancho fijo de 520px no responsive
- **Severidad**: MAJOR
- **Archivo**: StatusWindow.tsx:19
- **Problema**: `width={520}` es fijo. En móviles de 360-412px, el contenido se desborda horizontalmente.
- **Propuesta**: Cambiar a `width="min(520px, 100vw - 24px)"` o usar `100%` con max-width.

### P-CHAR-02: Doble padding interior
- **Severidad**: MINOR
- **Archivo**: StatusPanel.tsx:143, UIWindow.tsx
- **Problema**: UIWindow aplica `padding: spacing.lg` (16px) al contenedor de children, y StatusPanel
  agrega otro `padding: spacing.lg` (16px) en su div raíz. Resultado: 32px de padding total.
- **Propuesta**: Eliminar el padding interno redundante del StatusPanel y usar solo el del UIWindow.

### P-CHAR-03: Barras de EXP con color inconsistente
- **Severidad**: MAJOR
- **Archivo**: StatusPanel.tsx:207
- **Problema**: La barra de EXP base usa `accentBlueSoft` (#3B82F6 con alpha) mientras que
  el HUD principal usa `colors.gold` (#F1C40F). Esto rompe la consistencia visual del juego.
- **Propuesta**: Cambiar a `colors.gold` para EXP base y `colors.expPurple` para EXP job,
  igual que en HUD.

### P-CHAR-04: Tooltip de stats no implementado
- **Severidad**: MINOR
- **Archivo**: StatusPanel.tsx:28-71
- **Problema**: `StatRow` recibe prop `tooltip` con datos de `statTooltips[stat]` pero nunca
  se utiliza. El jugador no puede ver qué hace cada stat.
- **Propuesta**: Implementar tooltip al hover/pulsar largamente el nombre del stat.

### P-CHAR-05: Fuente monospace en labels de stats
- **Severidad**: POLISH
- **Archivo**: StatusPanel.tsx:37-38
- **Problema**: Labels de stats usan `fontFamily: 'monospace'` con `fontSize: fontSizes.secondary`.
  El resto del juego usa la fuente sans-serif del sistema. Inconsistencia tipográfica.
- **Propuesta**: Cambiar a sans-serif (heredado) manteniendo `fontWeight: 'bold'` y color.

### P-CHAR-06: Altura de hileras de stats irregular
- **Severidad**: MINOR
- **Archivo**: StatusPanel.tsx:30
- **Problema**: Cada StatRow tiene `padding: 8px 0` sin altura mínima fija.
  En touch, 8px de padding vertical no es suficiente para un touch target cómodo.
- **Propuesta**: Asegurar `minHeight: 48px` en cada fila de stat.

### P-CHAR-07: Sin indicador de costo de stat
- **Severidad**: POLISH
- **Archivo**: StatusPanel.tsx:30-71
- **Problema**: `getStatCost(currentValue)` calcula el costo pero no se muestra al jugador.
  Un jugador no sabe cuántos puntos cuesta subir un stat hasta que intenta.
- **Propuesta**: Mostrar el costo en el tooltip del stat o como texto pequeño junto al valor.

---

## Resumen de cambios implementados

| ID | Archivo | Cambio | Severidad |
|---|---|---|---|
| P-CHAR-01 | StatusWindow.tsx | width 520 → responsive `min(520px, calc(100vw - 48px))` | MAJOR |
| P-CHAR-02 | StatusPanel.tsx | Eliminado padding redundante en div raíz | MINOR |
| P-CHAR-03 | StatusPanel.tsx | EXP bar colors: gold + expPurple (consistente con HUD) | MAJOR |
| P-CHAR-04 | StatusPanel.tsx | Añadido tooltip hover en nombres de stats | MINOR |
| P-CHAR-05 | StatusPanel.tsx | Labels de stats cambian a sans-serif | POLISH |
| P-CHAR-06 | StatusPanel.tsx | minHeight: 48px en filas de stats | MINOR |
| P-CHAR-07 | StatusPanel.tsx | Mostrar costo de stat en tooltip | POLISH |

---

## Validación

### Desktop (1920x1080)
- ✅ Ventana centrada con ancho adecuado
- ✅ Stats legibles con tooltips
- ✅ EXP bars consistentes con HUD

### Mobile (390x844)
- ✅ Ventana ocupa ancho completo con padding
- ✅ Touch targets ≥ 48px
- ✅ Tooltips accesibles por hover
