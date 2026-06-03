# Auditoría 03 — Equipment Window

## Resumen

Auditoría de la ventana de equipamiento: slots, comparación, organización,
iconografía y feedback táctil.

---

## Problemas encontrados

### P-EQUIP-01: Ancho fijo 400px no responsive
- **Severidad**: MAJOR
- **Archivo**: EquipmentWindow.tsx:47
- **Problema**: `width={400}` no se adapta a pantallas menores (360px, 390px).
- **Propuesta**: Cambiar a `min(400px, calc(100vw - 48px))`.

### P-EQUIP-02: Grid de 5 columnas fijo en móvil
- **Severidad**: MAJOR
- **Archivo**: EquipmentWindow.tsx:58
- **Problema**: `grid-cols-5` en pantallas de 360-390px produce slots de ~55px,
  demasiado pequeños para el icono y texto. Los slots ocupados con items emoji
  de 2rem pueden desbordar el contenedor.
- **Propuesta**: Cambiar a `grid-cols-5` (mantener) pero reducir gap y padding en móvil,
  o cambiar a responsive `grid-cols-3 sm:grid-cols-5`.

### P-EQUIP-03: Slots vacíos con contraste insuficiente
- **Severidad**: MINOR
- **Archivo**: EquipmentWindow.tsx:77
- **Problema**: Slots vacíos usan `colors.overlayLight` (rgba(0,0,0,0.15))
  sobre fondo ivory (#FFFFF0). Diferencia de contraste casi imperceptible.
- **Propuesta**: Usar un color de fondo más visible como `colors.glassExtra` o
  un tono más oscuro.

### P-EQUIP-04: Detalle de item sin scroll en contenido largo
- **Severidad**: MINOR
- **Archivo**: EquipmentWindow.tsx:95-162
- **Problema**: La descripción del item puede ser larga y no hay scroll interno
  en el panel de detalle. En móvil, la descripción puede quedar recortada.
- **Propuesta**: El panel ya está dentro de UIWindow que tiene `overflow-y-auto`.
  Solo asegurar que el contenido no se desborde.

### P-EQUIP-05: Sin indicación visual de slot ocupado vs vacío
- **Severidad**: POLISH
- **Archivo**: EquipmentWindow.tsx:64-93
- **Problema**: La diferencia entre slot ocupado (borde indigo) y vacío (borde gris)
  es sutil. Un jugador nuevo puede no diferenciarlos rápidamente.
- **Propuesta**: Añadir un indicador más claro: los slots ocupados tienen el icono
  del item + brillo, los vacíos muestran el icono del slot type en gris.

---

## Resumen de cambios implementados

| ID | Archivo | Cambio | Severidad |
|---|---|---|---|
| P-EQUIP-01 | EquipmentWindow.tsx | width 400 → responsive | MAJOR |
| P-EQUIP-02 | EquipmentWindow.tsx | Slots padding/gap responsive | MAJOR |
| P-EQUIP-03 | EquipmentWindow.tsx | Empty slot bg más visible | MINOR |
| P-EQUIP-05 | EquipmentWindow.tsx | Mejor diferenciación ocupado/vacío | POLISH |

---

## Validación

### Desktop (1920x1080)
- ✅ 5 slots visibles con espacio adecuado
- ✅ Detalle de item legible
- ✅ Rarity badges visibles

### Mobile (390x844)
- ✅ Slots mantienen touch targets ≥ 48px
- ✅ Ventana ocupa ancho completo
- ✅ Grid reajustado
