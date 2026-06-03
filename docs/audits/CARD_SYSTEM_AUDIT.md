# Auditoría 08 — Card System

## Resumen

Auditoría del sistema de cartas: visualización, rarezas,
equipamiento, tooltips y feedback.

---

## Problemas encontrados

### P-CARD-01: Sin ventana dedicada de cartas
- **Severidad**: MAJOR
- **Archivo**: N/A
- **Problema**: El juego no tiene una ventana o sección dedicada para gestionar cartas.
  Las cartas aparecen mezcladas en el inventario bajo el filtro 'Cartas', sin
  distinción visual especial respecto a otros items.
- **Propuesta**: En el inventario, añadir indicador visual especial para items tipo
  'card': borde más brillante, badge "CARTA", y tooltip extendido.

### P-CARD-02: Slots de equipamiento sin ranuras de carta
- **Severidad**: MAJOR
- **Archivo**: EquipmentWindow.tsx
- **Problema**: La ventana de equipamiento no muestra ranuras de carta en los items
  equipados. No hay forma de ver qué cartas están equipadas en un item.
- **Propuesta**: Futura implementación. Marcar como gap de diseño.

### P-CARD-03: Sin indicación de rareza consistente
- **Severidad**: POLISH
- **Archivo**: InventoryPanel.tsx (BackpackItem)
- **Problema**: Los items tipo 'card' se renderizan igual que cualquier otro item.
  No hay un glow o badge de carta que los distinga visualmente.
- **Propuesta**: Añadir badge "C" o "CARTA" sobre el icono cuando item.type === 'card'.

---

## Resumen de cambios implementados

| ID | Archivo | Cambio | Severidad |
|---|---|---|---|
| P-CARD-03 | InventoryPanel.tsx | Badge "C" para items tipo card | POLISH |

---

## Validación

### Desktop (1920x1080)
- ✅ Cartas distinguibles en inventario

### Mobile (390x844)
- ✅ Badge visible sin obstruir icono
