# Auditoría 06 — Quest Window

## Resumen

Auditoría de la ventana de misiones: objetivos, progreso,
recompensas, quests activas, completadas y claridad visual.

---

## Problemas encontrados

### P-QUEST-01: Ancho fijo 500px no responsive
- **Severidad**: MAJOR
- **Archivo**: QuestWindow.tsx:19
- **Propuesta**: Cambiar a `min(500px, calc(100vw - 48px))`.

### P-QUEST-02: Doble padding interior
- **Severidad**: MINOR
- **Archivo**: QuestsPanel.tsx:21
- **Propuesta**: Eliminar padding redundante.

### P-QUEST-03: Botón de abandonar misión con estilo insuficiente
- **Severidad**: MINOR
- **Archivo**: QuestsPanel.tsx:118-134
- **Problema**: El botón "Abandonar Misión" no tiene fondo ni borde distintivo,
  solo un cambio de brillo en hover. Una acción destructiva como abandonar
  una misión debería tener más énfasis visual (rojo/ámbar).
- **Propuesta**: Añadir `colors.accentRedBg` como fondo y `colors.accentReddark`
  como color de texto para diferenciar la acción destructiva.

### P-QUEST-04: Sin recompensas visibles en la card de misión
- **Severidad**: POLISH
- **Archivo**: QuestsPanel.tsx:67-136
- **Problema**: Las recompensas de la misión (zeny, EXP, items) están definidas
  en `questDef.rewards` pero no se muestran al jugador.
- **Propuesta**: Añadir sección de recompensas debajo de los objetivos.

---

## Resumen de cambios implementados

| ID | Archivo | Cambio | Severidad |
|---|---|---|---|
| P-QUEST-01 | QuestWindow.tsx | width 500 → responsive | MAJOR |
| P-QUEST-02 | QuestsPanel.tsx | Eliminado padding redundante | MINOR |
| P-QUEST-03 | QuestsPanel.tsx | Estilo destructivo en botón abandonar | MINOR |

---

## Validación

### Desktop (1920x1080)
- ✅ Quests activas legibles
- ✅ Objetivos claros con progreso
- ✅ Botón abandonar visible como acción destructiva

### Mobile (390x844)
- ✅ Cards de quest con scroll vertical
- ✅ Touch targets ≥ 48px
- ✅ Contenido legible
