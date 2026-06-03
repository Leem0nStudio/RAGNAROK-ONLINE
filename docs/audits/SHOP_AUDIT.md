# Auditoría 07 — NPC Shop

## Resumen

Auditoría de la ventana de tienda NPC: compra, venta, comparación,
precios, filtros y experiencia táctil.

---

## Problemas encontrados

### P-SHOP-01: Ancho fijo 400px no responsive
- **Severidad**: MAJOR
- **Archivo**: ShopWindow.tsx:20
- **Problema**: `width={400}` no se adapta a pantallas pequeñas.
- **Propuesta**: Cambiar a `min(400px, calc(100vw - 48px))`.

### P-SHOP-02: Contenido placeholder sin funcionalidad de tienda
- **Severidad**: POLISH
- **Archivo**: ShopWindow.tsx:24-32
- **Problema**: La ventana solo muestra un mensaje placeholder. No hay grilla de
  productos, ni precios, ni acciones de compra/venta.
- **Propuesta**: El contenido se cargará cuando se implemente la lógica de tienda
  NPC. Mantener placeholder pero con mejor espaciado responsive.
- **Nota**: Esto es una limitación de datos/sistema, no de UI. No se modifica.

---

## Resumen de cambios implementados

| ID | Archivo | Cambio | Severidad |
|---|---|---|---|
| P-SHOP-01 | ShopWindow.tsx | width 400 → responsive | MAJOR |

---

## Validación

### Desktop (1920x1080)
- ✅ Placeholder centrado y legible

### Mobile (390x844)
- ✅ Placeholder se adapta al ancho
