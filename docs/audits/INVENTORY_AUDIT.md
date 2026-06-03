# Auditoría 04 — Inventory Window

## Resumen

Auditoría de la ventana de inventario: grid, filtros, scroll, tamaños,
selección, stack display y rarezas.

---

## Problemas encontrados

### P-INV-01: Ancho fijo 500px no responsive
- **Severidad**: MAJOR
- **Archivo**: InventoryWindow.tsx:19
- **Problema**: `width={500}` no se adapta a móviles de 360-412px.
- **Propuesta**: Cambiar a `min(500px, calc(100vw - 48px))`.

### P-INV-02: Doble padding interior
- **Severidad**: MINOR
- **Archivo**: InventoryPanel.tsx:110
- **Problema**: UIWindow aplica `padding: spacing.lg` y InventoryPanel agrega otro `padding: spacing.lg`.
  Resultado: 32px de padding total.
- **Propuesta**: Eliminar padding redundante en InventoryPanel.

### P-INV-03: Tabs en inglés
- **Severidad**: MINOR
- **Archivo**: InventoryPanel.tsx:106
- **Problema**: Los tabs `'all', 'equipment', 'consumable', 'material', 'card'` se muestran
  en inglés, pero el juego está en español (HUD español, items en español, etc.).
- **Propuesta**: Mapear a etiquetas en español: 'Todo', 'Equipo', 'Consumible', 'Material', 'Cartas'.

### P-INV-04: Sin estado vacío en grid
- **Severidad**: MINOR
- **Archivo**: InventoryPanel.tsx:133-157
- **Problema**: Cuando no hay items en una categoría filtrada, el grid aparece vacío
  sin ningún mensaje informativo.
- **Propuesta**: Añadir mensaje de "No hay objetos" cuando `filteredInventory` está vacío.

### P-INV-05: Panel de detalle inconsistente en responsive
- **Severidad**: MINOR
- **Archivo**: InventoryPanel.tsx:161-305
- **Problema**: En móvil (flex-col), el panel de detalle ocupa todo el ancho debajo del grid.
  La altura se vuelve limitada (80vh ventana - padding - header - grid).
- **Propuesta**: Asegurar scroll interno en el panel de detalle.

---

## Resumen de cambios implementados

| ID | Archivo | Cambio | Severidad |
|---|---|---|---|
| P-INV-01 | InventoryWindow.tsx | width 500 → responsive | MAJOR |
| P-INV-02 | InventoryPanel.tsx | Eliminado padding redundante | MINOR |
| P-INV-03 | InventoryPanel.tsx | Tabs traducidos a español | MINOR |
| P-INV-04 | InventoryPanel.tsx | Añadido estado vacío | MINOR |
| P-INV-05 | InventoryPanel.tsx | Scroll en panel de detalle | MINOR |

---

## Validación

### Desktop (1920x1080)
- ✅ Grid con items legibles
- ✅ Detalle de item con acciones
- ✅ Rarezas coloreadas correctamente

### Mobile (390x844)
- ✅ Tabs scrolleables horizontalmente
- ✅ Grid responsivo de 3-4 columnas
- ✅ Detalle de item con scroll
- ✅ Touch targets ≥ 48px
