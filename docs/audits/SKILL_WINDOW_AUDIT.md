# Auditoría 05 — Skill Window

## Resumen

Auditoría de la ventana de habilidades: árbol visual, progresión,
aprendizaje, costos, navegación y responsive.

---

## Problemas encontrados

### P-SKILL-01: Ancho fijo 500px no responsive
- **Severidad**: MAJOR
- **Archivo**: SkillsWindow.tsx:19
- **Problema**: `width={500}` no se adapta a móviles.
- **Propuesta**: Cambiar a `min(500px, calc(100vw - 48px))`.

### P-SKILL-02: Doble padding interior
- **Severidad**: MINOR
- **Archivo**: SkillsPanel.tsx:20
- **Problema**: UIWindow padding + SkillsPanel padding = 32px total.
- **Propuesta**: Eliminar padding redundante.

### P-SKILL-03: Sin indicación de tipo de habilidad (activa/pasiva)
- **Severidad**: MINOR
- **Archivo**: SkillsPanel.tsx:98-156
- **Problema**: No hay distinción visual entre habilidades activas (que se usan con
  la skillbar) y pasivas (efectos permanentes). El jugador no sabe cuáles son de
  cada tipo sin memorizarlas.
- **Propuesta**: Añadir badge "Activa"/"Pasiva" o "Auto" en cada skill card.

### P-SKILL-04: Sin costo de SP visible en skill card
- **Severidad**: MINOR
- **Archivo**: SkillsPanel.tsx:98-156
- **Problema**: El costo de SP de cada habilidad no se muestra en la card,
  solo se ve en el tooltip del skill slot del HUD.
- **Propuesta**: Mostrar costo de SP en la card de habilidad.

### P-SKILL-05: Botón de subir nivel sin feedback de costo
- **Severidad**: POLISH
- **Archivo**: SkillsPanel.tsx:133-153
- **Problema**: El botón "SUBIR NIVEL" no muestra cuántos puntos de habilidad
  cuesta (siempre 1, pero el jugador no lo sabe).
- **Propuesta**: Añadir texto "Costo: 1 Punto" en el botón o cerca.

---

## Resumen de cambios implementados

| ID | Archivo | Cambio | Severidad |
|---|---|---|---|
| P-SKILL-01 | SkillsWindow.tsx | width 500 → responsive | MAJOR |
| P-SKILL-02 | SkillsPanel.tsx | Eliminado padding redundante | MINOR |
| P-SKILL-03 | SkillsPanel.tsx | Badge de tipo (Activa/Pasiva) | MINOR |
| P-SKILL-04 | SkillsPanel.tsx | Costo SP visible en card | MINOR |
| P-SKILL-05 | SkillsPanel.tsx | Costo en botón de subir nivel | POLISH |

---

## Validación

### Desktop (1920x1080)
- ✅ Grid de habilidades legible (3 columnas)
- ✅ Badges de tipo visibles
- ✅ Costos SP visibles

### Mobile (390x844)
- ✅ Grid responsivo (1-2 columnas)
- ✅ Touch targets ≥ 48px
- ✅ Scrolling fluido
