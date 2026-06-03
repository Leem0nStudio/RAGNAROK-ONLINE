# Auditoría 11 — Tooltip System

## Resumen

Auditoría del sistema de tooltips: consistencia, rarezas,
estadísticas, posicionamiento y responsive.

---

## Problemas encontrados

### P-TOOLTIP-01: Sin sistema de tooltips centralizado
- **Severidad**: MAJOR
- **Archivo**: Múltiples
- **Problema**: Cada componente implementa sus propios tooltips inline:
  - BuffBar.tsx: tooltip inline con motion
  - StatusPanel.tsx (StatRow): tooltip inline (nuevo en esta auditoría)
  - SkillSlots.tsx: usa `title` attribute nativo del browser
  - No hay un TooltipProvider o componente Tooltip reutilizable
- **Propuesta**: Crear un componente `Tooltip` reutilizable que soporte:
  - Posicionamiento (top, bottom, left, right)
  - Animación consistente
  - Rarity coloring
  - Responsive (no clips en bordes)
  - Touch support (long-press)

### P-TOOLTIP-02: Uso inconsistente de tooltip nativo vs personalizado
- **Severidad**: MINOR
- **Archivo**: SkillSlots.tsx:113
- **Problema**: SkillSlots usa `title` attribute (tooltip nativo del navegador)
  que no se ve en iOS y tiene estilo inconsistente en Android.
  El resto del HUD usa tooltips animados personalizados.
- **Propuesta**: Migrar a tooltip personalizado consistente.

### P-TOOLTIP-03: Tooltips sin indicación de rareza
- **Severidad**: POLISH
- **Archivo**: InventoryPanel.tsx
- **Problema**: Los tooltips de items en inventario no muestran el color de rareza
  del item, perdiendo información visual importante.
- **Propuesta**: Integrar `getRarityStyles()` en los tooltips de items.

---

## Resumen de cambios implementados

| ID | Archivo | Cambio | Severidad |
|---|---|---|---|
| P-TOOLTIP-01 | ui/Tooltip.tsx | Nuevo componente Tooltip reutilizable | MAJOR |
| P-TOOLTIP-02 | SkillSlots.tsx | Migrado de title nativo a Tooltip componente | MINOR |

---

## Validación

### Desktop (1920x1080)
- ✅ Tooltips con animación consistente
- ✅ Posicionamiento correcto

### Mobile (390x844)
- ✅ Tooltips visibles en touch
- ✅ Sin clipping en bordes
