# Auditoría 10 — Notification System

## Resumen

Auditoría del sistema de notificaciones: loot, experiencia,
level up, quests, logros y mensajes del sistema.

---

## Problemas encontrados

### P-NOTIF-01: Sin sistema de notificaciones centralizado
- **Severidad**: MAJOR
- **Archivo**: components/LootFeed.tsx, components/ZoneDiscoveryToast.tsx
- **Problema**: Las notificaciones están fragmentadas en componentes separados
  sin un sistema unificado. LootFeed maneja loot/EXP, ZoneDiscoveryToast maneja
  zonas. No hay cola de notificaciones, priorización, ni stacking.
- **Propuesta**: Crear un NotificationProvider centralizado que agrupe todos los
  tipos de notificaciones con prioridad, duración configurable y stacking
  inteligente. Para esta auditoría, solo alinear visualmente los existentes.

### P-NOTIF-02: LootFeed sin indicador de rareza
- **Severidad**: MINOR
- **Archivo**: LootFeed.tsx
- **Problema**: Ya auditado en P-HUD-09. Añadido borde izquierdo dorado como
  mejora visual. Pendiente integrar colores de rareza cuando los datos lo
  soporten.
- **Propuesta**: Ya implementado (borde dorado + opacidad mejorada).

### P-NOTIF-03: Notificaciones sin dismiss manual
- **Severidad**: POLISH
- **Archivo**: LootFeed.tsx, ZoneDiscoveryToast.tsx
- **Problema**: Las notificaciones desaparecen solas por timeout pero no se
  pueden descartar manualmente. En pantallas táctiles, el jugador no puede
  limpiar notificaciones que obstruyen la vista.
- **Propuesta**: Añadir tap-to-dismiss en LootFeed y ZoneDiscoveryToast.

### P-NOTIF-04: Sin notificación de level up
- **Severidad**: MAJOR
- **Archivo**: N/A
- **Problema**: Cuando el jugador sube de nivel, no hay una notificación visual
  destacada. Solo aparece en el loot feed como "+X EXP".
- **Propuesta**: Añadir un toast especial de LEVEL UP con animación de
  celebración (partículas, glow, sonido).

---

## Resumen de cambios implementados

| ID | Archivo | Cambio | Severidad |
|---|---|---|---|
| P-NOTIF-03 | LootFeed.tsx | Añadido onClick dismiss | POLISH |
| P-NOTIF-03 | ZoneDiscoveryToast.tsx | Añadido onClick dismiss | POLISH |

---

## Validación

### Desktop (1920x1080)
- ✅ Notificaciones visibles sin obstruir
- ✅ Dismiss manual funciona

### Mobile (390x844)
- ✅ Tap-to-dismiss táctil
- ✅ Notificaciones no bloquean UI
