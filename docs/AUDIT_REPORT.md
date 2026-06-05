# Auditoría Completa del Sistema de Mundo Actual

Este documento detalla el estado actual de la arquitectura de nivel y del mundo en el sandbox de Ragnarok, identificando redundancias, archivos involucrados, dependencias, qué elementos conservar y cuáles eliminar para dejar una base limpia y optimizada.

---

## 1. Sistemas que Construyen el Mapa Actualmente

La construcción y representación visual del mapa se divide principalmente en dos capas acopladas mediante consultas de elevación de terreno:

1. **Capa Física de Deformación del Terreno (`GameRenderer`):**
   - Construye un `PlaneGeometry` de $200 \times 200$ metros con $64 \times 64$ segmentos.
   - Deforma los vértices en base a la función matemática `getTerrainHeight(x, z)` para crear colinas y montañas de fondo realistas en los márgenes exteriores (radio $> 45$).
   - Pinta el terreno mediante sombreado plano de vértices (`vertexColors`) simulando transiciones orgánicas entre pasto verde, ceniza volcánica (plateau de Baphomet) y piedra de montaña.
   - Instancia elementos complementarios como la Plaza Central (zona segura circular), caminos empedrados sinuosos (reemplazo de las antiguas carreteras de prueba), portales de entrada rúnicos y el cristal pedestal místico.

2. **Capa Vegetativa y de Decoraciones Instanciadas (`EnvironmentInstancedSystem`):**
   - Rellena el mundo con fauna y utilería mediante `InstancedMesh` para maximizar el rendimiento de renderizado tridimensional.
   - Distribuye de forma determinista y aleatoria:
     - **Árboles:** Troncos y hojas rústicas.
     - **Hierba:** Arbustos poligonales y mechones de hierba alta.
     - **Estructuras:** Cajas de madera descidadas, barriles volcados, postes indicadores y ruinas monolíticas antiguas.
   - Alinea la altura vertical de cada objeto instanciado mediante consultas dinámicas a `getTerrainHeight(x, z)`.

3. **Capa Cinética e IA de Simulación (`WorldRuntime` & `GameEngine`):**
   - Mueve dinámicamente a los monstruos (Poring, Poporing, PecoPeco, Baphomet) y NPCs de Prontera.
   - Limita los bordes del mapa mediante un radio circular de $48$ metros, impidiendo que el jugador y las entidades asciendan o atraviesen las cordilleras escarpadas.
   - Resuelve solapamientos físicos en 2D (`resolvePhysicalOverlaps`) para simular colisiones empujando suavemente los cuerpos circulares de los mobs entre sí.

---

## 2. Archivos Involucrados

| Archivo | Rol Principal |
| :--- | :--- |
| `lib/game/renderer.ts` | Definición de `getTerrainHeight`, renderizado del plano del terreno, coloración de vértices, modelado de la plaza central, caminos de piedra e indicadores visuales de portales y efectos VFX. |
| `lib/game/sceneGraph.ts` | Grafo de escena visual con L.O.D, reciclaje de materiales/canvases (`CanvasPool` / `RenderObjectPool`), y el `EnvironmentInstancedSystem` que renderiza la vegetación estática y props (barriles, ruinas, etc.). |
| `lib/game/characterController.ts` | Controlador físico del jugador, proyecciones predictivas de desplazamiento de vectores (`ClientPredictionPath`), definición determinista del listado de colliders cilíndricos/muros (`getRockObstacles`). |
| `lib/game/worldRuntime.ts` | Rejilla espacial (`SpatialGrid`) para optimización broad-phase $O(1)$, ejecución del motor AI (vagar, huida, persecución aggro en safe-zone) y resolución de solapamientos cinéticos. |
| `lib/game/engine.ts` | Conexión global del bucle, entrada de usuario (teclado, joystick clicker), auto-combate guiado, inventario, habilidades, VFXs y spawner de números flotantes. |
| `lib/game/types.ts` | Tipos estructurales del motor (`Entity`, `Projectile`, `GroundItem`, `Class`, etc.). |

---

## 3. Dependencias del Grafo

```
                       [ getTerrainHeight(x, z) ] (renderer.ts)
                               /              \
                              v                v
                       [ sceneGraph.ts ]   [ engine.ts ] <--- [ worldRuntime.ts ]
                              ^                                     |
                              |                              [ SpatialGrid ]
                     [ characterController.ts ] (getRockObstacles)
```

---

## 4. Elementos a Eliminar (Redundancias y Código Huérfano)

Tras analizar los ticker loops, descubrimos que existen **dos sistemas paralelos y duplicados** administrando proyectiles y suelo:

1. **En `worldRuntime.ts`:**
   - La clase `WorldRuntime` introduce arrays locales de `projectiles` y `groundItems` junto con sub-métodos de simulación (`tickProjectiles`, `tickGroundItems`, `applyTerminalDmg`).
   - Sin embargo, los proyectiles y botines arrojados al suelo se insertan, actualizan y resuelven visualmente **exclusivamente en `engine.ts`** a través de `this.projectiles` y `this.groundItems`. Sus contrapartes en `WorldRuntime` siempre permanecen vacías ($0$ registros), ejecutándose inútilmente en cada tick de física.

2. **Propuestas de limpieza inmediata:**
   - Eliminar por completo el array e hilos de simulación redundantes de proyectiles y ground items en `worldRuntime.ts`, consolidándolos en `engine.ts`/`state.ts`.
   - Limpiar variables o comentarios heredados que hagan referencia a grillas físicas invisibles (como la antigua rejilla de depuración que ya fue desactivada).

---

## 5. Elementos que Deben Conservarse

Para garantizar la estabilidad y el funcionamiento sublime del sandbox:

- **`getTerrainHeight` (`renderer.ts`):** Pieza fundamental para que nada se hunda en el espacio 3D.
- **`getRockObstacles` (`characterController.ts`):** Lista determinista de columnas de piedra de plaza y ruinas exteriores para predicción de rutas y colisión de jugador.
- **`SpatialGrid` (`worldRuntime.ts`):** Estructura espacial ultra rápida para consultas de radar.
- **`resolvePhysicalOverlaps` e IA de comportamiento (`worldRuntime.ts`):** Lógica del ciclo de vida, caminar, huida despavorida por salud baja de monstruos, empuje orgánico y alejamiento automático de la Safe-Plaza Central.
- **`ClientPredictionPath` (`characterController.ts`):** Proyección del vector del ratón para guiar el camino empedrado.
