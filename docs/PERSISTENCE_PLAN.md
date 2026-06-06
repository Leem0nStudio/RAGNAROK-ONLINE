# PERSISTENCE_PLAN.md

## Objetivo
Sistema de persistencia para Single Player usando Supabase.

## Arquitectura (Single Player -> Multiplayer Ready)
- Backend: Supabase (PostgreSQL).
- Cliente: `@supabase/supabase-js`.
- Persistencia: Tabla `player_profiles`.

## MVP (Prioridad)
- Guardar/Cargar: HP, Posición, Inventario (Equipamiento), Job, Nivel.

## Expansión
- Persistencia de Mundo: Estado de NPCs, Objetos del suelo.
- Multiplayer: Sincronización Real-time (Supabase Realtime).

## Riesgos
- Latencia en operaciones de escritura.
- Migración de Schema (usar JSONB para inventarios para mitigarlo).

## Tareas Pendientes
- [ ] Definir Schema SQL para `player_profiles`.
- [ ] Implementar Servicio Supabase.
- [ ] Conectar `GameStore` con servicio de guardado.
