# Auditoría 12 — Mobile UX

## Resumen

Auditoría completa de la experiencia móvil en dispositivos objetivo:
360×640, 390×844 (iPhone 14), 412×915 (Galaxy S21+).

Analiza: alcance de pulgar, botones, navegación, ventanas y accesibilidad.

---

## Evaluación por dispositivo

### 360×640 (Móvil pequeño — iPhone SE / Android compacto)

| Elemento | Estado | Observación |
|---|---|---|
| HUD CharacterPanel | ✅ OK | maxWidth 200px entra con padding |
| HUD Minimap | ✅ OK | 60px+padding ~70px en esquina |
| HUD SkillSlots | ⚠️ AJUSTADO | 5 col de 48px caben (5×48+4×4=256px) |
| HUD Actions | ✅ OK | 48px botones |
| Ventanas (w: min(...)) | ✅ OK | Se adaptan al viewport |
| Touch targets | ⚠️ MÍNIMO | La mayoría en 48px justos |
| Zona de pulgar | ✅ OK | Actions en bottom-right accesible |

### 390×844 (iPhone 14 — estándar)

| Elemento | Estado | Observación |
|---|---|---|
| HUD completo | ✅ OK | Espacio adecuado entre elementos |
| Ventanas | ✅ OK | Responsive, con padding |
| Safe areas | ✅ OK | Variables `--sa-*` aplicadas |
| Touch targets | ✅ OK | 48px+ en todos los interactivos |
| Scroll vertical | ✅ OK | Ventanas con overflow-y-auto |

### 412×915 (Galaxy S21+ — grande)

| Elemento | Estado | Observación |
|---|---|---|
| HUD completo | ✅ OK | Amplio espacio |
| Ventanas | ✅ OK | max-width 500px con padding |
| Touch targets | ✅ OK | Cómodos |

---

## Problemas encontrados

### P-MOBILE-01: Alcance de pulgar — botones de Actions en zona difícil
- **Severidad**: MINOR
- **Archivo**: Actions.tsx / HUDGrid.tsx
- **Problema**: Los botones de Actions están en bottom-right (grid area "actions").
  En dispositivos grandes (412×915), el pulgar derecho debe extenderse hasta
  la esquina inferior derecha, que está en el límite del alcance cómodo.
- **Propuesta**: Mantener posición actual (es estándar en MMORPG mobile).
  No cambiar para no romper expectativas de usuario.

### P-MOBILE-02: Ventanas ocupan demasiado espacio en vertical
- **Severidad**: MAJOR
- **Archivo**: Todos los windows con `height="80vh"` o `height="85vh"`
- **Problema**: En 360×640, 85vh = 544px. El header de UIWindow + padding
  deja ~480px de contenido. Suficiente pero ajustado. En landscape,
  85vh podría ser excesivo.
- **Propuesta**: Reducir a `min(85vh, 600px)` o similar para evitar
  ventanas que casi llenan la pantalla.

### P-MOBILE-03: Sin feedback háptico en interacciones
- **Severidad**: POLISH
- **Archivo**: N/A
- **Problema**: No hay feedback táctil (vibración) al tocar botones.
  En juegos móviles, el feedback háptico mejora la sensación de respuesta.
- **Propuesta**: Añadir `navigator.vibrate(10)` en `playUI()` para outputs
  táctiles breves.

### P-MOBILE-04: Scroll en ventanas sin indicador visible
- **Severidad**: MINOR
- **Archivo**: UIWindow.tsx (`.overflow-y-auto`)
- **Problema**: El scrollbar personalizado está definido en globals.css
  pero en algunas vistas puede no ser visible hasta que se hace scroll.
- **Propuesta**: Añadir `scrollbar-gutter: stable` para reservar espacio
  del scrollbar y evitar layout shift.

### P-MOBILE-05: Tooltips en dispositivos táctiles
- **Severidad**: MINOR
- **Archivo**: ui/Tooltip.tsx
- **Problema**: Los tooltips se activan con hover. En touch, no hay hover,
  solo tap. El Tooltip implementa `onPointerDown` toggle, pero no hay
  indicación visual de que el elemento tiene un tooltip.
- **Propuesta**: Añadir un indicador visual (puntos suspensivos, icono ?)
  en elementos con tooltip.

### P-MOBILE-06: Sin orientación landscape óptima
- **Severidad**: MAJOR
- **Archivo**: app/layout.tsx, globals.css
- **Problema**: No hay estilos específicos para landscape. En orientación
  horizontal, el espacio vertical es limitado (360×640 → 640×360).
  El HUD y ventanas no se reajustan.
- **Propuesta**: Añadir media query `@media (orientation: landscape)` para
  reducir tamaños de HUD y ventanas.

### P-MOBILE-07: Botón de chat puede confundirse con skill slots
- **Severidad**: POLISH
- **Archivo**: Chat.tsx
- **Problema**: El botón de toggle del chat (48×48) está en bottom-left,
  cerca de los skill slots en bottom-center. Visualmente similar en tamaño
  y estilo, el jugador puede confundirlos.
- **Propuesta**: Añadir un tooltip "Bitácora" al botón de chat (ya tiene
  `title` nativo, migrar al nuevo sistema Tooltip).

---

## Resumen de cambios implementados

| ID | Archivo | Cambio | Severidad |
|---|---|---|---|
| P-MOBILE-02 | StatusWindow, SkillsWindow, QuestWindow, InventoryWindow | height: min(85vh, 600px) | MAJOR |
| P-MOBILE-04 | globals.css | Añadido scrollbar-gutter: stable | MINOR |

---

## Conclusiones generales

### Fortalezas
- ✅ CSS Grid layout del HUD funciona bien en todos los tamaños
- ✅ Safe areas implementadas con CSS variables
- ✅ Touch targets mínimos de 48px (estándar Apple HIG)
- ✅ Sistema de opacidades centralizado mejora consistencia visual
- ✅ Ventanas responsive con `min(XXpx, calc(100vw - 48px))`

### Debilidades
- ❌ Sin orientación landscape optimizada
- ❌ Sin feedback háptico
- ❌ Sin ventana de logros
- ❌ Tooltips táctiles mejorables

### Recomendaciones post-auditoría
1. Implementar ventana de logros (datos ya existen)
2. Optimizar landscape con media queries
3. Añadir feedback háptico a `playUI()`
4. Crear sistema centralizado de notificaciones
5. Integrar tarjetas en slots de equipamiento
