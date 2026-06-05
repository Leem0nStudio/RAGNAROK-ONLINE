# Arquitectura de Mapas — Diseño Técnico

> **Versión:** 2.0  
> **Inspiración:** Ragnarok Online (campos, ciudades, mazmorras)  
> **Motor:** Three.js + Next.js + TypeScript  
> **Estado:** Diseño completo para implementación

---

## Tabla de Contenidos

1. [Estructura del Mapa](#1-estructura-del-mapa)
2. [Sistema de Coordenadas y Cuadrícula](#2-sistema-de-coordenadas-y-cuadrícula)
3. [Jerarquía de Zonas](#3-jerarquía-de-zonas)
4. [Sistema de Navegación y Transiciones](#4-sistema-de-navegación-y-transiciones)
5. [Sistema de Límites Naturales](#5-sistema-de-límites-naturales)
6. [Escalas del Mundo](#6-escalas-del-mundo)
7. [Densidad de Elementos Decorativos](#7-densidad-de-elementos-decorativos)
8. [Sistema Data-Driven](#8-sistema-data-driven)
9. [Cargas de Renderizado y Draw Distance](#9-cargas-de-renderizado-y-draw-distance)
10. [Migración desde el Sistema Actual](#10-migración-desde-el-sistema-actual)
11. [Plan de Implementación](#11-plan-de-implementación)

---

## 1. Estructura del Mapa

### 1.1 Definición

Un **mapa** es una escena autocontenida con los siguientes elementos:

- Un **terreno** continuo con altura variable (heightmap)
- Un conjunto de **objetos estáticos** (árboles, rocas, props, estructuras)
- Una o más **zonas** que definen biomas, música, ambientación y spawns
- **Puntos de transición** (warp points) que conectan a otros mapas
- **Límites naturales** que cierran el perímetro visualmente
- **Datos de minimapa** para la interfaz

Cada mapa es una **unidad de carga atómica**: cuando el jugador transiciona, se descarga el mapa anterior y se carga el nuevo (pantalla de carga estilo RO: "Now Loading...", ~1-3 segundos).

### 1.2 Anatomía de un Archivo de Mapa

Cada mapa se define como un archivo TypeScript en `lib/game/map/definitions/` que exporta un objeto `MapDefinition`:

```
lib/game/map/
├── registry.ts              # Registro global de mapas
├── loader.ts               # Cargador (terreno, objetos, spawns)
├── transitions.ts          # Sistema de transiciones entre mapas
├── types.ts                # Interfaces del sistema de mapas
├── minimap.ts             # Generador de minimapas
├── boundaries.ts           # Sistema de límites naturales
├── zone-manager.ts         # Gestor de zonas activas
├── definitions/            # Definiciones individuales de mapas
│   ├── prontera_city.ts
│   ├── pradera_alba.ts
│   ├── bosque_umbrio.ts
│   ├── campo_sur.ts
│   ├── dungeon_ant.ts
│   └── ...
└── data/                   # Datos reutilizables
    ├── biomes.ts           # Definiciones de biomas
    ├── boundary-presets.ts # Configuraciones de bordes
    └── prop-libraries.ts   # Catálogos de props
```

### 1.3 Formato de Definición

```typescript
// types.ts — Interfaces principales

interface MapDefinition {
  /** ID único del mapa (ej: 'prontera_city', 'pradera_alba') */
  id: string;
  
  /** Nombre mostrado al jugador */
  displayName: string;
  
  /** Nombre interno tipo RO (ej: 'prt_fild01') */
  mapCode: string;
  
  /** Tamaño del mapa en tiles (ancho x alto) */
  size: { width: number; height: number };
  
  /** Bioma principal del mapa */
  biome: BiomeId;
  
  /** Altura base del terreno (Y inicial del jugador al spawnear) */
  baseHeight: number;
  
  /** Capas del mapa */
  layers: MapLayers;
  
  /** Zonas del mapa */
  zones: ZoneDefinition[];
  
  /** Puntos de transición a otros mapas */
  transitions: TransitionPoint[];
  
  /** Puntos de spawn predeterminados */
  spawnPoints: SpawnPoint[];
  
  /** Configuración de límites naturales */
  boundaries: BoundaryConfig;
  
  /** Referencias a assets necesarios para este mapa */
  assets: AssetReference[];
  
  /** Metadatos para el minimapa */
  minimap: MinimapConfig;
  
  /** Configuración ambiental */
  environment: EnvironmentConfig;
}

interface MapLayers {
  /** Terreno: heightmap + textura superficial */
  terrain: TerrainLayer;
  
  /** Objetos estáticos (árboles, rocas, props) */
  objects: ObjectLayer;
  
  /** Edificios y estructuras */
  structures: StructureLayer;
  
  /** Elementos decorativos no colisionables (hierba, flores) */
  decoration: DecorationLayer;
  
  /** Zonas de spawn de monstruos */
  spawns: SpawnLayer;
  
  /** Puntos de luz y efectos ambientales */
  fx: FxLayer;
}
```

---

## 2. Sistema de Coordenadas y Cuadrícula

### 2.1 Unidades

| Magnitud | Valor | Notas |
|----------|-------|-------|
| 1 unidad Three.js | = 1 metro | Consistente con el sistema actual |
| 1 tile | = 1 metro × 1 metro | Cuadrícula de datos, no de renderizado |
| Altura de cámara | 7.5 m (isométrica 3/4) | Ángulo tipo RO |
| Personaje | 1.2 m alto × 0.65 m radio | Cápsula de colisión |
| Poring | 0.8 m diámetro | ~0.8 tiles |
| Baphomet | 3.0 m alto | Ocupa ~2 tiles |

### 2.2 Sistema de Cuadrícula (No es un Tilemap Rígido)

El sistema NO usa un tilemap tradicional. En su lugar:

- **Cuadrícula lógica** de 1m × 1m para almacenar datos asociados (tipo de suelo, altura base, zona)
- **Renderizado suave** — el terreno es una malla continua sin alineación a tiles
- **Colisiones** — basadas en colisionadores circulares y rectangulares (no en tiles)
- **Spawn de monstruos** — áreas definidas por polígonos irregulares
- **Minimapa** — la cuadrícula lógica se rasteriza a una textura de minimapa

### 2.3 Dimensiones de Mapa

| Tipo | Tamaño en tiles | Área jugable (m²) | Tiempo de cruce* | Uso |
|------|-----------------|-------------------|-------------------|-----|
| **Mini** | 32 × 32 | ~800 m² | ~8 s | Mazmorras pequeñas, interiores |
| **Pequeño** | 64 × 64 | ~3,600 m² | ~18 s | Mazmorras, ciudades pequeñas |
| **Mediano** | 96 × 96 | ~8,100 m² | ~28 s | **Tamaño recomendado** para la mayoría de mapas |
| **Grande** | 128 × 128 | ~14,400 m² | ~38 s | Campos abiertos, zonas de caza |
| **Extra Grande** | 192 × 192 | ~32,400 m² | ~60 s | Zonas especiales (eventos, guerras) |

*Tiempo de cruce en línea recta a velocidad base (7 m/s)

**Recomendación principal: 96 × 96 tiles.** Es comparable al mapa actual (radio 48m → ~96m de diámetro) y ofrece buen balance entre área explorable y tiempo de carga.

### 2.4 Sistema de Coordenadas

```
    -X (Oeste)        +X (Este)
         ↑               ↓
         |               |
 -Z (Norte) ───────── +Z (Sur)
```

- **Eje X**: horizontal (Oeste → Este)
- **Eje Z**: vertical (Norte → Sur) — coincide con Three.js
- **Eje Y**: altura (suelo = altura del terreno)
- **Origen (0, 0)**: centro del mapa (no necesariamente la plaza central)
- **Coordenadas de tile**: `tileX = floor(worldX / 1.0)`, `tileZ = floor(worldZ / 1.0)`
- **El mapa se extiende** de `(-width/2, -height/2)` a `(width/2, height/2)`

### 2.5 Esquema de la Cuadrícula Lógica

```typescript
interface TileData {
  /** Altura del terreno en este tile */
  height: number;
  
  /** Identificador del tipo de suelo */
  groundType: GroundTypeId;
  
  /** Zona a la que pertenece este tile */
  zoneId: string;
  
  /** Flags de navegación */
  flags: TileFlag;
  
  /** Bioma local (puede diferir del bioma principal) */
  localBiome?: BiomeId;
}

enum TileFlag {
  None        = 0,
  Walkable    = 1 << 0,
  NoSpawn     = 1 << 1,   // No spawnean monstruos aquí
  SafeZone    = 1 << 2,   // Zona segura (como la plaza)
  Boundary    = 1 << 3,   // Tile de límite (no transitable)
  Road        = 1 << 4,   // Camino principal
  Water       = 1 << 5,   // Agua (no transitable)
  Cliff       = 1 << 6,   // Acantilado (no transitable)
}
```

---

## 3. Jerarquía de Zonas

### 3.1 Estructura Jerárquica

```
Mundo (Midgard)
  ├── Región (ej: "Praderas de Prontera")
  │   ├── Zona (ej: "Campo de Prontera Sur")
  │   │   ├── Subzona (ej: "Colina de los Porings")
  │   │   ├── Subzona (ej: "Puente del Río")
  │   │   └── Subzona (ej: "Ruinas Antiguas")
  │   ├── Zona (ej: "Bosque Umbrío")
  │   │   ├── Subzona (ej: "Claro del Bosque")
  │   │   └── Subzona (ej: "Cueva Oculta")
  │   └── Zona (ej: "Ciudad de Prontera")
  │       ├── Subzona (ej: "Plaza Central")
  │       ├── Subzona (ej: "Catedral")
  │       └── Subzona (ej: "Barrio Comercial")
  └── Región (ej: "Desierto de Morroc")
      └── ...
```

### 3.2 Definiciones

```typescript
interface RegionDefinition {
  id: string;                    // 'prontera_fields'
  displayName: string;           // 'Praderas de Prontera'
  description: string;
  maps: string[];                // IDs de mapas en esta región
  ambientSound?: string;         // Sonido ambiental base
  music?: string;                // Tema musical por defecto
}

interface ZoneDefinition {
  id: string;                    // 'pradera_alba.central_plains'
  displayName: string;           // 'Llanuras Centrales'
  mapId: string;                 // Mapa al que pertenece
  
  /** Polígono que delimita la zona (coordenadas mundiales) */
  boundary: Polygon2D;
  
  /** Subzonas contenidas */
  subzones: SubzoneDefinition[];
  
  /** Bioma de la zona */
  biome: BiomeId;
  
  /** Configuración de spawn de monstruos */
  monsterSpawns: MonsterSpawnConfig[];
  
  /** Efectos ambientales */
  ambientEffects: AmbientEffect[];
  
  /** Música que suena en esta zona */
  music?: string;
  
  /** Densidad de decoración (override) */
  decorationDensity?: number;    // 0.0 - 1.0, default del mapa
}

interface SubzoneDefinition {
  id: string;
  displayName: string;
  boundary: Polygon2D;
  type: 'exploration' | 'landmark' | 'safe_zone' | 'dungeon_entrance' | 'boss_arena' | 'transition';
  
  /** Punto central (para minimapa, nombres) */
  center: Vec2;
  
  /** Radio de detección para activar eventos */
  activationRadius?: number;
  
  /** Evento al entrar */
  onEnter?: string;              // ID de evento/trigger
}

interface Polygon2D {
  vertices: Vec2[];              // En orden horario o antihorario
}
```

### 3.3 Zonas vs Biomas

Los biomas definen la apariencia y sensación de una zona:

```typescript
type BiomeId = 
  | 'grassland'      // Pradera verde — Prontera
  | 'forest'         // Bosque denso — umbrío
  | 'desert'         // Desierto — Morroc
  | 'mountain'       // Montaña — Mt. Mjölnir
  | 'snow'           // Nieve — Lutie
  | 'volcanic'       // Volcánico — Baphomet
  | 'swamp'          // Pantano — Cunacuman
  | 'city'           // Ciudad — pavimento, edificios
  | 'dungeon'        // Mazmorra — oscura, cerrada
  | 'beach'          // Playa — Comodo
  | 'sky'            // Islas flotantes — Juno
  ;

interface BiomeConfig {
  id: BiomeId;
  colors: {
    ground: [number, number, number][];  // Paleta de 3-5 colores de suelo
    foliage: [number, number, number][]; // Paleta de vegetación
    sky?: [number, number, number];      // Color de cielo (override)
    fog?: [number, number, number];      // Color de niebla (override)
  };
  fogDensity: number;
  ambientLight: number;
  decorationDensity: number;      // 0.0 - 1.0
  allowedDecorations: string[];   // Tipos de decoración permitidos
  weather?: string[];             // Climas posibles
}
```

### 3.4 Subzonas Interiores vs Exteriores

| Tipo | Iluminación | Límites | Música | Ejemplo |
|------|-------------|---------|--------|---------|
| **Exterior** | Dinámica (día/noche opcional) | Límites naturales | Tema del bioma | Campos de Prontera |
| **Interior** | Estática (luz artificial) | Paredes/techo | Tema de mazmorra | Cueva, sótano |
| **Semi-interior** | Única dirección de luz | Paredes parciales | Tema híbrido | Cueva con entrada abierta |

Los interiores se definen como mapas independientes con su propio tileset y sistema de iluminación diferente (sin sol direccional, luces puntuales).

---

## 4. Sistema de Navegación y Transiciones

### 4.1 Tipos de Transición

```typescript
type TransitionType =
  | 'warp_point'      // Portal visible que el jugador toca (estilo RO clásico)
  | 'map_edge'        // El jugador cruza el borde del mapa y aparece en el borde opuesto de otro
  | 'doorway'         // Puerta que se abre al interactuar (interiores)
  | 'npc_warp'        // NPC que teletransporta (Kafra, etc.)
  ;

interface TransitionPoint {
  id: string;
  type: TransitionType;
  
  /** Posición del trigger en el mapa */
  position: Vec3;
  
  /** Radio de activación (distancia a la que se detecta al jugador) */
  radius: number;
  
  /** Mapa de destino */
  targetMapId: string;
  
  /** Punto de spawn en el mapa destino */
  targetSpawnPoint: string;
  targetPosition?: Vec3;          // Posición exacta (override de spawnPoint)
  
  /** Orientación del jugador al aparecer */
  targetFacing?: 'left' | 'right';
  
  /** Efecto visual al transicionar */
  transitionEffect?: 'fade' | 'flash' | 'portal_vortex' | 'none';
  
  /** Requisitos para usar esta transición (nivel, quest, item) */
  requirements?: TransitionRequirements;
  
  /** Nombre visible (ej: "Entrada a la Mazmorra") */
  displayName?: string;
  
  /** ¿Aparece en el minimapa? */
  showOnMinimap?: boolean;
}

interface TransitionRequirements {
  minLevel?: number;
  questCompleted?: string;
  hasItem?: string;
  jobClass?: JobClass[];
}
```

### 4.2 Warp Points (estilo RO)

Los warp points son **vórtices visuales** (animación de partículas) que el jugador pisa para transicionar:

```
                   ╔══════════════════════╗
                   ║   Mapa Origen        ║
                   ║                      ║
                   ║    [WARP]──────→     ║  ← Jugador toca el warp
                   ║                      ║
                   ╚══════════════════════╝
                           │
                           ↓  (Pantalla de carga)
                   ╔══════════════════════╗
                   ║   Mapa Destino       ║
                   ║                      ║
                   ║     →[PLAYER SPAWN]  ║  ← Aparece aquí
                   ║                      ║
                   ╚══════════════════════╝
```

### 4.3 Transiciones por Borde de Mapa

Para mapas contiguos (campos adyacentes), el jugador simplemente camina hasta el borde:

```
   Mapa A (campo_sur)          Mapa B (pradera_alba)
   ┌──────────────────┐┌──────────────────┐
   │                  ││                  │
   │     Zona         ││      Zona        │
   │     abierta      ││      abierta     │
   │                  ││                  │
   │   [Jugador]──────┘└──→[Aparece aquí] │
   │                  ││                  │
   └──────────────────┘└──────────────────┘
          Borde compartido
```

**Requisitos para map edge:**
- Los mapas deben estar en la misma región
- El borde debe estar alineado (ambos mapas tienen la misma coordenada de borde)
- Se recomienda un ~10% de área de solapamiento visual (zona de transición)

### 4.4 Spawn Points

```typescript
interface SpawnPoint {
  id: string;                    // 'prontera_center', 'north_gate'
  position: Vec3;
  facing: 'left' | 'right';
  type: 'default' | 'respawn' | 'transition';
  
  /** ¿Se usa al cargar el mapa por primera vez? */
  isDefault?: boolean;
  
  /** ¿Se usa al revivir? */
  isRespawnPoint?: boolean;
}
```

### 4.5 Caminos Principales vs Secundarios

```typescript
interface RoadDefinition {
  id: string;
  
  /** Curva del camino (serie de puntos) */
  path: Vec2[];
  
  /** Ancho del camino en metros */
  width: number;                  // 2-4m para principal, 1-2m para secundario
  
  /** Tipo de superficie */
  surface: 'dirt' | 'cobblestone' | 'paved' | 'wooden';
  
  /** Conecta estos puntos de interés */
  connects: [string, string];     // IDs de subzonas o landmarks
  
  /** ¿Aparece en minimapa? */
  visibleOnMinimap: boolean;
}
```

### 4.6 Datos del Minimapa

```typescript
interface MinimapConfig {
  /** Tamaño de la textura del minimapa (píxeles) */
  textureSize: 128 | 256 | 512;
  
  /** Escala: 1 tile = N píxeles en la textura */
  pixelsPerTile: number;          // 2-4px por tile
  
  /** Color de fondo del minimapa */
  backgroundColor: string;
  
  /** Zonas coloreadas en el minimapa */
  zones: MinimapZone[];
  
  /** Puntos de interés visibles */
  pois: MinimapPOI[];
  
  /** Caminos visibles */
  roads?: RoadDefinition[];
}

interface MinimapZone {
  zoneId: string;
  color: string;                  // Color para rellenar la zona
  opacity?: number;
}

interface MinimapPOI {
  id: string;
  position: Vec2;
  type: 'town' | 'dungeon' | 'landmark' | 'warp' | 'npc' | 'shop';
  displayName: string;
  icon: string;                   // Sprite o emoji
}
```

---

## 5. Sistema de Límites Naturales

### 5.1 Principio Fundamental

> **El jugador NUNCA debe ver vacío, bordes del mundo, ni muros invisibles.**

Cada límite tiene una **justificación visual y física**. No hay restricciones artificiales — el jugador no puede pasar porque hay una montaña, un río, o un bosque impenetrable.

### 5.2 Tipos de Límite

```typescript
type BoundaryType =
  | 'mountain_wall'       // Pared de montaña (el más común)
  | 'cliff'               // Acantilado vertical
  | 'deep_water'          // Agua profunda (no se puede cruzar)
  | 'dense_forest'        // Bosque impenetrable (árboles densos + colisión)
  | 'chasm'               // Abismo / grieta profunda
  | 'ruins_wall'          // Muro de ruinas antiguas
  | 'ocean'               /// Océano infinito (con horizonte)
  | 'city_wall'           // Muralla de ciudad
  | 'magic_barrier'       // Barrera mágica (visible, con partículas)
  ;

interface BoundaryConfig {
  /** Tipo de límite a usar por defecto en todo el perímetro */
  defaultType: BoundaryType;
  
  /** Segmentos específicos que sobreescriben el default */
  segments: BoundarySegment[];
  
  /** Configuración de niebla de altura */
  heightFog: HeightFogConfig;
  
  /** ¿Renderizar fondo lejano? (montañas de fondo, cielo) */
  renderDistantBackground: boolean;
}

interface BoundarySegment {
  /** Polígono que define el segmento de borde */
  polygon: Polygon2D;
  
  /** Tipo de límite en este segmento */
  type: BoundaryType;
  
  /** Parámetros específicos del tipo */
  params?: BoundaryParams;
}

interface BoundaryParams {
  /** Altura de la pared/acantilado (en metros) */
  height?: number;
  
  /** Ángulo de inclinación (grados) */
  slope?: number;                 // 0=vertical, 45=rampa
  
  /** Ancho de la banda de transición (metros) */
  transitionWidth?: number;
  
  /** Color de la roca/pared */
  color?: [number, number, number];
  
  /** Textura de la pared */
  texture?: string;
  
  /** ¿Tiene vegetación adicional? */
  hasVegetation?: boolean;
}
```

### 5.3 Tratamiento Visual por Tipo

| Tipo | Qué ve el jugador | Colisión | Altura mín. | Detalles |
|------|-------------------|----------|-------------|----------|
| **mountain_wall** | Pendiente pronunciada que sube hasta fuera de pantalla | Terreno inclinado + colisión | 15 m | Rocas + vegetación en la pendiente |
| **cliff** | Corte vertical con rocas al borde | Pared invisible en el borde + rocas | 10 m | El jugador ve el vacío pero hay un borde físico con rocas |
| **deep_water** | Agua que se extiende hasta el horizonte | Plano de agua con colisión | — | Niebla sobre el agua, ondas, juncos |
| **dense_forest** | Árboles extremadamente densos (>6/m²) | Malla continua de troncos | 8 m | Oscuro bajo el dosel, partículas de hojas |
| **chasm** | Grieta en el suelo con profundidad visible | Borde del abismo con barandilla de rocas | 20 m | Niebla que sale de la grieta |
| **ruins_wall** | Muro de piedra antigua (como las murallas de Prontera) | Muro físico | 8 m | Textura de piedra, enredaderas |
| **ocean** | Agua + horizonte + cielo | Plano de agua infinito | — | Oleaje suave, horizonte lineal |
| **city_wall** | Muralla de piedra con almenas | Muro físico con textura | 12 m | Torres cada cierto tramo |
| **magic_barrier** | Cortina de partículas brillantes | Efecto visual + pushback | — | Animada, colores según facción |

### 5.4 Estrategia de Capas (Layering)

Cada límite usa un sistema de **3 capas** para garantizar que el jugador nunca vea vacío:

```
Capa 1: Terreno elevado
    ┌─────────────────────────┐
    │  Altura del terreno     │  ← getTerrainHeight() eleva el terreno
    │  sube abruptamente      │     en los bordes (radio > 42)
    └─────────────────────────┘

Capa 2: Objetos densos
    ┌─────────────────────────┐
    │  Árboles / Rocas        │  ← InstancedMesh en la pendiente
    │  estratégicamente       │     del borde
    │  colocados              │
    └─────────────────────────┘

Capa 3: Niebla / Partículas
    ┌─────────────────────────┐
    │  Niebla de altura       │  ← Fog + partículas que ocultan
    │  + polvo / neblina      │     el horizonte lejano
    └─────────────────────────┘
```

**Implementación en el sistema actual:**
El engine ya implementa esto parcialmente:
- `getTerrainHeight()` tiene una subida exponencial en `dist > 42.0` (Capa 1)
- `getTreeObstacles()` coloca 100 árboles en el borde (Capa 2)
- `scene.fog = new THREE.FogExp2(...)` con densidad 0.022 (Capa 3)

La nueva arquitectura formaliza este patrón y lo hace configurable por mapa.

### 5.5 Configuración de Niebla de Altura

```typescript
interface HeightFogConfig {
  /** ¿Está activada la niebla de altura? */
  enabled: boolean;
  
  /** Color de la niebla */
  color: string;
  
  /** Densidad base */
  density: number;                // 0.0 - 0.1 (actual: 0.022)
  
  /** Altura a partir de la cual la niebla se espesa */
  heightStart: number;            // Metros Y
  
  /** Altura donde la niebla es completamente opaca */
  heightEnd: number;              // Metros Y
  
  /** ¿La niebla se espesa con la distancia? */
  exponentialDistance: boolean;
}
```

### 5.6 Reglas de Diseño por Tamaño de Mapa

| Tamaño | Default boundary | Segmentos recomendados | Altura de niebla |
|--------|-----------------|----------------------|-------------------|
| 32×32 | mountain_wall | 4 (uno por lado) | density: 0.035 |
| 64×64 | mountain_wall | 4-6 | density: 0.028 |
| 96×96 | mixed (montaña + bosque) | 6-8 | density: 0.022 |
| 128×128 | mixed (agua + montaña) | 8-12 | density: 0.018 |
| 192×192 | ocean + montaña | 12-16 | density: 0.015 |

### 5.7 Fallback: Fog Walls

Si por alguna razón un segmento de límite no se renderiza correctamente (asset faltante, error de carga):

```typescript
interface FallbackFogWall {
  /** Posición del muro de niebla */
  position: Vec2;
  
  /** Ancho del muro */
  width: number;
  
  /** Densidad de la niebla */
  density: number;
  
  /** Textura de la niebla */
  texture?: string;
}
```

Estos **Fog Walls** se renderizan como cortinas verticales de niebla densa. Son visualmente justificables (el jugador ve una pared de niebla impenetrable, un clásico en RPGs) y sirven como respaldo elegante.

---

## 6. Escalas del Mundo

### 6.1 Tabla de Dimensiones

| Elemento | Tamaño (metros) | Tamaño (tiles) | Notas |
|----------|-----------------|----------------|-------|
| Tile | 1.0 × 1.0 | 1 × 1 | Cuadrícula lógica |
| Jugador (cápsula) | 1.2 alto × 0.65 radio | 1.3 × 0.65 | Altura chibi/RO |
| Poring | 0.8 diámetro | 0.8 | Monstruo pequeño |
| PecoPeco | 1.8 alto | 1.8 | Montura / mob mediano |
| Baphomet | 3.0 alto × 1.5 radio | 3.0 × 1.5 | Boss MVP |
| Árbol (pino) | 0.7 tronco × 5-6 alto | 0.7 × 6 | Conífera estilizada |
| Roca (columna) | 1.0 diámetro × 4.2 alto | 1.0 × 4.2 | Ruina antigua |
| Camino principal | 3.0-4.0 ancho | 3-4 | Tierra / adoquín |
| Camino secundario | 1.5-2.0 ancho | 1.5-2 | Vereda de tierra |
| Puerta de ciudad | 6.0 ancho × 8.0 alto | 6 × 8 | Arco de piedra |

### 6.2 Velocidades de Movimiento

| Entidad | Velocidad (m/s) | Tiempo para cruzar mapa 96×96 |
|---------|-----------------|-------------------------------|
| Jugador (base) | 7.0 m/s | ~14 s (eje largo) |
| Jugador (max AGI) | 10.5 m/s | ~9 s |
| Poring (patrulla) | 0.84 m/s | — |
| PecoPeco (persecución) | 3.15 m/s | — |
| Baphomet (persecución) | 3.85 m/s | — |
| NPC (paseo) | 0.48 m/s | — |

### 6.3 Draw Distance y Render Budget

```typescript
interface RenderBudget {
  /** Distancia máxima de renderizado */
  maxDrawDistance: number;        // 60m (actual: ~48m de radio jugable)
  
  /** Distancia a la que los objetos entran en sleep */
  sleepDistance: number;          // 48m (ya implementado en VisualNode)
  
  /** Distancia para throttle a 30fps */
  throttle30Distance: number;     // 24m
  
  /** Distancia para throttle a 12fps */
  throttle12Distance: number;     // 12m
  
  /** Máximo de instanced meshes activos */
  maxInstancedMeshes: number;     // 25 (actual: ~10)
  
  /** Máximo de sprites de entidades */
  maxEntitySprites: number;       // 50
  
  /** Máximo de partículas */
  maxParticles: number;           // 500 (actual: ~450)
  
  /** Draw calls máximos */
  maxDrawCalls: number;           // 100 (mobile target)
}
```

**Nota de rendimiento:** El sistema actual ya implementa LOD por distancia en `VisualNode.update()` con sleep a 48m y throttle progresivo. Esto se mantiene y se extiende a los objetos del mapa (no solo entidades).

---

## 7. Densidad de Elementos Decorativos

### 7.1 Clasificación de Decoraciones

```typescript
type DecorationCategory =
  | 'terrain_feature'    // Rocas, formaciones, pequeñas colinas
  | 'vegetation'         // Árboles, arbustos, flores, hierba alta
  | 'structure'          // Edificios, muros, puentes, ruinas
  | 'prop'               // Barriles, cajas, carteles, hogueras
  | 'environmental_fx'   // Partículas, luces, niebla local, cascadas
  ;

interface DecorationRule {
  category: DecorationCategory;
  type: string;                    // 'pine_tree', 'wild_flower', 'crate'
  density: number;                 // 0.0 - 1.0 (escala según zona)
  collisionType: 'none' | 'solid' | 'blocking';
  renderBudget: {
    maxInstances: number;
    instanced: boolean;            // ¿Usa InstancedMesh?
  };
}
```

### 7.2 Densidad por Tipo de Zona

| Zona | Terrain | Vegetación | Props | FX | Total obj./mapa 96×96 |
|------|---------|-----------|-------|-----|----------------------|
| **Campo abierto** | Baja (10-15) | Media (80-120) | Baja (15-25) | Baja | ~150 |
| **Bosque** | Baja (5-10) | **Alta** (180-250) | Baja (10-20) | Media | ~250 |
| **Ciudad** | Baja (5-10) | Baja (20-40) | **Alta** (60-100) | Baja | ~120 |
| **Mazmorra** | Media (20-30) | Nula (0-5) | Media (30-50) | **Alta** | ~80 |
| **Montaña** | **Alta** (30-50) | Media (40-80) | Baja (10-20) | Media | ~140 |
| **Playa** | Media (10-20) | Baja (20-40) | Baja (5-15) | Alta (agua) | ~70 |
| **Pantano** | Media (15-25) | Alta (100-150) | Baja (5-15) | Alta (niebla) | ~180 |

> **Nota:** Estos son objetivos. El sistema actual con 180 árboles + 30 rocas + 128 props está en el rango correcto.

### 7.3 Budget de Rendimiento (Mobile First)

| Recurso | Límite | Prioridad |
|---------|--------|-----------|
| Draw calls totales | ≤ 120 | Crítico |
| Instanced meshes | ≤ 30 draw calls | Crítico |
| Objetos individuales | ≤ 50 | Alto |
| Partículas activas | ≤ 600 | Alto |
| Sprites de entidades | ≤ 60 | Medio |
| Luces dinámicas | ≤ 8 (puntuales) | Medio |
| Texturas únicas | ≤ 80 | Medio |

### 7.4 Integración con Colisión/Navegación

```typescript
interface CollisionObject {
  id: string;
  type: 'circle' | 'rectangle' | 'polygon';
  position: Vec2;
  
  /** Para círculos */
  radius?: number;
  
  /** Para rectángulos */
  size?: Vec2;
  rotation?: number;
  
  /** Para polígonos */
  vertices?: Vec2[];
  
  /** Altura para obstáculos verticales */
  height?: number;
  
  flags: CollisionFlag;
}

enum CollisionFlag {
  BlockMovement = 1 << 0,    // No se puede caminar
  BlockProjectile = 1 << 1,  // No pasan proyectiles
  BlockVision = 1 << 2,      // Bloquea línea de visión (para AI)
  BlockSpawn = 1 << 3,       // No spawnean monstruos aquí
  IsWalkable = 1 << 4,       // Se puede caminar encima (puentes)
}
```

---

## 8. Sistema Data-Driven

### 8.1 Principio

> **Cada mapa se define como datos puros en un archivo TS. No se toca el engine para añadir un mapa nuevo.**

### 8.2 Estructura Completa de un Archivo de Mapa

```typescript
// definitions/pradera_alba.ts
import { MapDefinition } from '../types';

const pradera_alba: MapDefinition = {
  id: 'pradera_alba',
  displayName: 'Pradera Alba',
  mapCode: 'prt_fild01',
  
  size: { width: 96, height: 96 },
  biome: 'grassland',
  baseHeight: 0.0,
  
  layers: {
    terrain: {
      /** Función de altura (puede ser por fórmula o por datos raster) */
      heightFunction: 'mathematical',
      heightParams: {
        rollingHills: { frequency: 0.08, amplitude: 0.6 },
        secondaryHills: { frequency: 0.035, amplitude: 0.25 },
        nwHill: { x: -26, z: -26, radius: 18, height: 2.8 },
        bossPlateau: { x: 48, z: -48, radius: 25, height: 1.4 },
        boundaryRise: { startRadius: 42, power: 1.95, multiplier: 0.35 },
      },
      /** Textura del suelo (colores por altura) */
      groundTexture: {
        type: 'gradient',
        levels: [
          { height: -0.5, color: [0.18, 0.35, 0.18] },  // Oscuro (agua/bajo)
          { height: 0.0, color: [0.22, 0.44, 0.24] },    // Césped base
          { height: 1.0, color: [0.28, 0.50, 0.26] },    // Césped alto
          { height: 2.5, color: [0.35, 0.40, 0.25] },    // Colina
          { height: 5.0, color: [0.32, 0.34, 0.35] },    // Rocoso
        ],
      },
      /** Precisión de la malla */
      meshResolution: { segments: 160 },
    },
    
    objects: {
      rocks: {
        count: 30,
        distribution: 'deterministic_points',
        points: [
          // Ruinas del perímetro (fortaleza circular)
          ...Array.from({ length: 12 }, (_, i) => ({
            angle: (i * Math.PI * 2) / 16,
            radius: 16,
            skipWhen: i % 4 === 0,
            height: 3.6 + Math.sin(i * 3.5) * 1.4,
            radius_scalar: 0.95,
          })),
          // Pilares de mazmorra NE
          { x: 44.5, z: -48, height: 7.2 },
          { x: 51.5, z: -48, height: 7.2 },
          // Ruinas dispersas
          { x: 38, z: 28, height: 3.5 },
          { x: -38, z: -35, height: 4.8 },
          { x: -12, z: 45, height: 3.2 },
        ],
      },
      
      trees: {
        count: 180,
        boundaryCount: 100,
        boundaryRadius: 44.5,
        clusters: [
          { center: { x: -26, z: -26 }, count: 20, spread: 9.5 },
          { center: { x: 28, z: 28 }, count: 20, spread: 9.5 },
          { center: { x: -32, z: 14 }, count: 20, spread: 9.5 },
          { center: { x: 42, z: -28 }, count: 20, spread: 9.5 },
        ],
        scaleRange: [0.72, 1.6],
      },
      
      props: {
        crates: { count: 65, seed: 999 },
        barrels: { count: 45, seed: 999 },
        signposts: { count: 18, seed: 999 },
      },
    },
    
    structures: {
      landmarks: [
        {
          id: 'boss_gate',
          type: 'ruin_gate',
          position: { x: 32, z: -32 },
          rotation: Math.PI / 4,
          scale: 1.0,
        },
        {
          id: 'campfire',
          type: 'campfire',
          position: { x: -12, z: 12 },
          rotation: 0,
          scale: 1.0,
        },
        {
          id: 'plaza_crystal',
          type: 'crystal_pedestal',
          position: { x: 0, z: -4.5 },
          rotation: 0,
          scale: 1.0,
        },
      ],
    },
    
    decoration: {
      grassDensity: 0.35,
      flowerDensity: 0.15,
      mushrooms: { count: 30, seed: 42 },
      ambientLife: {
        butterflies: { count: 15, seed: 100 },
        birds: { count: 6, seed: 200 },
        fireflies: { count: 35, seed: 300 },
      },
    },
    
    spawns: {
      monsters: [
        {
          type: 'poring',
          count: 4,
          zone: 'southeast_plains',
          respawnTime: [6000, 14000],
        },
        {
          type: 'poporing',
          count: 4,
          zone: 'south_plains',
          respawnTime: [6000, 14000],
        },
        {
          type: 'pecopeco',
          count: 4,
          zone: 'northwest_plains',
          respawnTime: [6000, 14000],
        },
        {
          type: 'boss_mvp',
          count: 1,
          zone: 'boss_altar',
          respawnTime: [300000, 300000],  // 5 min
        },
      ],
      
      npcs: [
        {
          id: 'npc_kafra',
          type: 'kafra',
          position: { x: -3, z: -2 },
          facing: 'right',
        },
        {
          id: 'npc_crusader',
          type: 'crusader_instructor',
          position: { x: 4, z: 4 },
          facing: 'left',
        },
      ],
    },
    
    fx: {
      ambientParticles: {
        dust: { count: 400, spread: 80, height: [0.5, 15] },
      },
      lights: [
        {
          type: 'campfire',
          position: { x: -12, z: 12, y: 0.5 },
          color: '#ff5500',
          intensity: 2.0,
          range: 6.0,
        },
      ],
    },
  },
  
  zones: [
    {
      id: 'pradera_alba.central_plaza',
      displayName: 'Plaza Central de Prontera',
      boundary: {
        vertices: [
          { x: -16, z: -16 },
          { x: 16, z: -16 },
          { x: 16, z: 16 },
          { x: -16, z: 16 },
        ],
      },
      subzones: [],
      biome: 'city',
      monsterSpawns: [],
      ambientEffects: [
        { type: 'particle', id: 'gentle_sparkles', density: 0.3 },
      ],
      music: 'theme_prontera.mp3',
      decorationDensity: 0.2,
    },
    {
      id: 'pradera_alba.southeast_plains',
      displayName: 'Llanuras del Sureste',
      boundary: {
        vertices: [
          { x: 16, z: 16 },
          { x: 48, z: 16 },
          { x: 48, z: 48 },
          { x: 16, z: 48 },
        ],
      },
      subzones: [],
      biome: 'grassland',
      monsterSpawns: [
        { type: 'poring', count: 4, respawnTime: [6000, 14000] },
      ],
      ambientEffects: [],
      decorationDensity: 0.4,
    },
    // ... más zonas
  ],
  
  transitions: [
    {
      id: 'pradera_to_bosque',
      type: 'map_edge',
      position: { x: -48, z: 0, y: 0 },
      radius: 2.0,
      targetMapId: 'bosque_umbrio',
      targetSpawnPoint: 'bosque_umbrio_south',
      targetPosition: { x: 47, z: 0, y: 0 },
      transitionEffect: 'fade',
      showOnMinimap: true,
    },
    {
      id: 'pradera_to_dungeon',
      type: 'warp_point',
      position: { x: 48, z: -48, y: 0 },
      radius: 1.5,
      targetMapId: 'dungeon_ant',
      targetSpawnPoint: 'entrance',
      transitionEffect: 'portal_vortex',
      displayName: 'Entrada a la Mazmorra de las Hormigas',
      showOnMinimap: true,
    },
  ],
  
  spawnPoints: [
    { id: 'center', position: { x: 0, z: 0, y: 0 }, facing: 'right', isDefault: true, isRespawnPoint: true },
  ],
  
  boundaries: {
    defaultType: 'mountain_wall',
    segments: [
      {
        polygon: {
          vertices: [
            { x: -48, z: -48 },
            { x: -40, z: -48 },
            { x: -40, z: -30 },
            { x: -48, z: -30 },
          ],
        },
        type: 'dense_forest',
        params: { height: 12, hasVegetation: true },
      },
    ],
    heightFog: {
      enabled: true,
      color: '#0a0f1c',
      density: 0.022,
      heightStart: 8,
      heightEnd: 20,
      exponentialDistance: true,
    },
    renderDistantBackground: true,
  },
  
  assets: [
    { type: 'texture', id: 'ground_grass_01' },
    { type: 'model', id: 'tree_pine_01' },
    { type: 'music', id: 'field_prontera_01' },
  ],
  
  minimap: {
    textureSize: 256,
    pixelsPerTile: 2,
    backgroundColor: '#1a3a2a',
    zones: [
      { zoneId: 'pradera_alba.central_plaza', color: '#8b7355', opacity: 0.6 },
      { zoneId: 'pradera_alba.southeast_plains', color: '#4ade80', opacity: 0.4 },
    ],
    pois: [
      { id: 'prontera', position: { x: 0, z: 0 }, type: 'town', displayName: 'Prontera', icon: '🏰' },
      { id: 'dungeon_ant', position: { x: 48, z: -48 }, type: 'dungeon', displayName: 'Mazmorra', icon: '⬇' },
    ],
    roads: [
      {
        id: 'main_road',
        path: [
          { x: -48, z: 0 },
          { x: -30, z: 5 },
          { x: -15, z: 0 },
          { x: 0, z: 0 },
          { x: 15, z: 0 },
          { x: 30, z: -5 },
          { x: 48, z: 0 },
        ],
        width: 3,
        surface: 'dirt',
        connects: ['bosque_umbrio', 'pradera_alba.central_plaza'],
        visibleOnMinimap: true,
      },
    ],
  },
  
  environment: {
    ambientLight: 0.35,
    directionalLight: {
      position: { x: 25, y: 45, z: -15 },
      color: '#ffedd5',
      intensity: 1.3,
    },
    fillLight: {
      position: { x: -20, y: 15, z: 25 },
      color: '#7dd3fc',
      intensity: 0.4,
    },
    shadows: {
      enabled: true,
      mapSize: 1024,
      bias: -0.001,
    },
  },
};

export default pradera_alba;
```

### 8.3 El Registro de Mapas

```typescript
// registry.ts
import { MapDefinition } from './types';

const mapRegistry = new Map<string, MapDefinition>();

export function registerMap(map: MapDefinition): void {
  if (mapRegistry.has(map.id)) {
    console.warn(`Mapa "${map.id}" ya registrado. Sobreescribiendo.`);
  }
  mapRegistry.set(map.id, map);
}

export function getMapDefinition(id: string): MapDefinition | undefined {
  return mapRegistry.get(id);
}

export function getAllMapIds(): string[] {
  return Array.from(mapRegistry.keys());
}
```

### 8.4 El Cargador de Mapas

```typescript
// loader.ts
interface MapLoaderInterface {
  /** Carga un mapa completo (terreno, objetos, spawns, FX) */
  loadMap(mapId: string): Promise<void>;
  
  /** Descarga el mapa actual */
  unloadCurrentMap(): Promise<void>;
  
  /** Transiciona de un mapa a otro */
  transitionTo(mapId: string, spawnPointId: string): Promise<void>;
  
  /** Obtiene el mapa actualmente cargado */
  getCurrentMap(): MapDefinition | null;
  
  /** Obtiene la altura del terreno en una coordenada */
  getTerrainHeight(x: number, z: number): number;
  
  /** Verifica si una coordenada está dentro del mapa */
  isInBounds(x: number, z: number): boolean;
}
```

### 8.5 Extensibilidad: Añadir un Mapa Nuevo

Para añadir un mapa nuevo **sin tocar el engine**:

```
1. Crear archivo: lib/game/map/definitions/mi_mapa_nuevo.ts
2. Exportar MapDefinition con todas las propiedades
3. Importar y registrar en lib/game/map/registry.ts:
     import mi_mapa_nuevo from './definitions/mi_mapa_nuevo';
     registerMap(mi_mapa_nuevo);
4. (Opcional) Añadir transiciones desde otros mapas
```

El engine itera sobre el registro; no hay switch statements ni if/else para mapas.

---

## 9. Cargas de Renderizado y Draw Distance

### 9.1 Estrategia de Carga

```
Estado del jugador → MapLoader.loadMap(id)
  ├── 1. Unload mapa anterior
  │     ├── Limpiar escena Three.js (remover meshes)
  │     ├── Liberar texturas (RenderObjectPool.clearAll)
  │     ├── Limpiar WorldRuntime (entidades)
  │     └── Liberar memoria de geometrías
  │
  ├── 2. Cargar assets del nuevo mapa
  │     ├── Texturas (caché)
  │     ├── Modelos 3D (si aplica)
  │     └── Audio (música, ambiente)
  │
  ├── 3. Construir terreno
  │     ├── Generar malla (PlaneGeometry + heightFunction)
  │     ├── Aplicar vertex colors (groundTexture)
  │     └── Calcular normales
  │
  ├── 4. Poblar objetos estáticos
  │     ├── Crear InstancedMeshes (rocas → 1 draw call)
  │     ├── Crear InstancedMeshes (árboles → 2 draw calls)
  │     ├── Crear InstancedMeshes (props → 1-3 draw calls)
  │     └── Crear mallas individuales (landmarks)
  │
  ├── 5. Configurar ambiente
  │     ├── Luces (direccional, fill, puntuales)
  │     ├── Niebla (fog color + density)
  │     ├── Partículas ambientales (polvo, luciérnagas)
  │     └── Vida ambiental (mariposas, pájaros)
  │
  ├── 6. Spawnear entidades
  │     ├── NPCs (posiciones fijas)
  │     ├── Monstruos (según zonas de spawn)
  │     └── Jugador (en spawn point indicado)
  │
  └── 7. Activar runtime
        ├── Registrar entidades en WorldRuntime
        ├── Iniciar música/ambiente
        └── Mostrar minimapa
```

### 9.2 Draw Call Budget por Fase de Carga

| Fase | Draw Calls | Notas |
|------|-----------|-------|
| Terreno (1 mesh) | 1 | PlaneGeometry con vertex colors |
| Rocas (1 instanced) | 1 | Todas las rocas en un InstancedMesh |
| Árboles troncos (1 instanced) | 1 | InstancedMesh de troncos |
| Árboles hojas (1 instanced) | 1 | InstancedMesh de copas |
| Props cajas (1 instanced) | 1 | InstancedMesh de cajas |
| Props barriles (1 instanced) | 1 | InstancedMesh de barriles |
| Props carteles (1 instanced) | 1 | InstancedMesh de carteles |
| Landmarks (individuales) | 3-8 | Puertas, hogueras, pedestales |
| Entidades (sprites) | 5-50 | Sprites billboard |
| Partículas (points) | 2-4 | Polvo, luciérnagas |
| **Total estático** | **~10-15** | Sin contar entidades |
| **Total con entidades** | **~15-65** | Depende de mobs activos |

### 9.3 Sistema de Carga por Cuadrantes (Opcional, Futuro)

Para mapas extra grandes (192×192+), se puede implementar carga por cuadrantes:

```
┌──────────┬──────────┐
│ Q1       │ Q2       │  Cada cuadrante = 64×64 tiles
│ (activo) │ (activo) │  Los cuadrantes lejanos se cargan
├──────────┼──────────┤  con LOD reducido
│ Q3       │ Q4       │
│ (cargando)│ (dormido)│
└──────────┴──────────┘
         ↑
      Jugador
```

Esto NO es necesario para la primera implementación. Se menciona como escalabilidad futura.

---

## 10. Migración desde el Sistema Actual

### 10.1 Qué se KEEPA (sin cambios)

- `getTerrainHeight()` → Se refactoriza para usar `heightFunction` del MapDefinition
- `EnvironmentInstancedSystem` con `spawnInstancedRocks()`, `spawnTrees()`, etc. → Se mantiene, se parametriza con datos del mapa
- `SpatialGrid` (worldRuntime) → Se mantiene, funciona por mapa
- `VisualNode` con LOD por distancia → Se mantiene, se extiende a objetos de mapa
- `EntitySpriteNode` → Se mantiene
- Sistema de colisiones circulares → Se mantiene, se extiende con datos del mapa
- `RPGCharacterController.updateMovement()` → Se mantiene
- `RendererObjectPool` y `CanvasPool` → Se mantienen

### 10.2 Qué se REFACTORIZA

| Sistema Actual | Nueva Versión | Cambio |
|---------------|---------------|--------|
| `getTerrainHeight(x, z)` | Parámetros vienen de `MapDefinition.layers.terrain.heightParams` | Parametrización |
| `getRockObstacles()` | Datos vienen de `MapDefinition.layers.objects.rocks` | De hardcode a data-driven |
| `getTreeObstacles()` | Datos vienen de `MapDefinition.layers.objects.trees` | De hardcode a data-driven |
| `getPropObstacles()` | Datos vienen de `MapDefinition.layers.objects.props` | De hardcode a data-driven |
| `spawnRoamers()` en engine.ts | Datos vienen de `MapDefinition.layers.spawns.monsters` | De hardcode a data-driven |
| `spawnNPCs()` en engine.ts | Datos vienen de `MapDefinition.layers.spawns.npcs` | De hardcode a data-driven |
| Terreno procedural único | Múltiples definiciones de terreno | Multi-mapa |
| Círculo radio 48 | Polígono rectangular de 96×96 | Forma del mapa |
| `initWorld()` | `MapLoader.loadMap(id)` | Generalización |

### 10.3 Qué se REEMPLAZA

| Sistema Actual | Nuevo Sistema | Razón |
|---------------|---------------|-------|
| Límite circular en `worldRuntime` y `characterController` | `BoundarySystem` con detección de tipos de límite | Necesitamos límites no-circulares |
| `initWorld()` con setup fijo | `MapLoader` genérico | Soporte multi-mapa |
| `getMinimapData()` simple (x, z del player) | `MinimapGenerator` que rasteriza datos del mapa | Minimapa rico con zonas, caminos, POIs |
| Monstruos hardcodeados en engine.ts | Spawn por zonas desde MapDefinition | Data-driven |
| Un solo bioma (grassland implícito) | Múltiples biomas configurables | Variedad de mapas |

### 10.4 Plan de Migración por Fases

```
Fase 1 (Semana 1-2): Infraestructura
  ├── Crear tipos (MapDefinition, ZoneDefinition, BoundaryConfig, etc.)
  ├── Crear registry.ts
  ├── Refactorizar getTerrainHeight() para aceptar parámetros
  └── Migrar pradera_alba actual a MapDefinition

Fase 2 (Semana 3-4): Cargador y Transiciones
  ├── Implementar MapLoader (load, unload, transition)
  ├── Sistema de transiciones (warp points)
  ├── BoundarySystem (montaña, bosque, agua)
  └── Soporte multi-mapa (2-3 mapas conectados)

Fase 3 (Semana 5-6): Zonas y Spawns
  ├── ZoneManager (detección de zona activa)
  ├── Spawn system data-driven (monstruos por zona)
  ├── Música y ambiente por zona
  └── Minimapa generado desde datos

Fase 4 (Semana 7-8): Contenido y Pulido
  ├── Definir ~10-12 mapas completos
  ├── Conectividad entre mapas
  ├── Pruebas de rendimiento
  └── Optimización de carga/descarga
```

---

## 11. Resumen de Archivos a Crear/Modificar

### Archivos NUEVOS en `lib/game/map/`

| Archivo | Propósito |
|---------|-----------|
| `types.ts` | Interfaces: MapDefinition, ZoneDefinition, BoundaryConfig, TransitionPoint, etc. |
| `registry.ts` | Registro global de definiciones de mapas |
| `loader.ts` | MapLoader: carga, descarga, transición de mapas |
| `transitions.ts` | Lógica de transiciones (warp points, map edges, doorways) |
| `minimap.ts` | Generación de texturas de minimapa desde datos |
| `boundaries.ts` | BoundarySystem: detección y tratamiento visual de límites |
| `zone-manager.ts` | ZoneManager: detección de zona activa, cambio de música/ambiente |
| `definitions/pradera_alba.ts` | Definición del mapa actual migrada a data-driven |
| `definitions/bosque_umbrio.ts` | Segundo mapa (ejemplo) |
| `data/biomes.ts` | Definiciones de biomas (colores, densidades, música) |
| `data/boundary-presets.ts` | Configuraciones predefinidas de límites |
| `data/prop-libraries.ts` | Catálogo de props reutilizables |

### Archivos a MODIFICAR

| Archivo | Cambio |
|---------|--------|
| `lib/game/engine.ts` | Delegar initWorld/loadMap a MapLoader; eliminar spawnRoamers/spawnNPCs hardcodeados |
| `lib/game/renderer.ts` | Parametrizar createGroundMap con MapDefinition en lugar de valores fijos |
| `lib/game/sceneGraph.ts` | EnvironmentInstancedSystem: aceptar datos de objetos desde MapDefinition |
| `lib/game/worldRuntime.ts` | Eliminar límite circular hardcodeado; delegar a BoundarySystem |
| `lib/game/characterController.ts` | Eliminar límite circular; usar datos de colisión desde el mapa activo |
| `lib/game/state.ts` | Añadir estado del mapa actual, zona activa |

---

## Apéndice A: Glosario

| Término | Definición |
|---------|------------|
| **Tile** | Unidad mínima de la cuadrícula lógica (1m × 1m). No es un tile de renderizado. |
| **Mapa** | Escena autocontenida con terreno, objetos, spawns y transiciones. |
| **Zona** | Subdivisión de un mapa con su propio bioma, música y spawns. |
| **Subzona** | Área dentro de una zona con un propósito específico (landmark, safe zone). |
| **Warp Point** | Punto de transición visible que teletransporta al jugador a otro mapa. |
| **Map Edge** | Transición que ocurre al caminar hasta el borde del mapa. |
| **Natural Boundary** | Elemento del paisaje que impide el paso (montaña, río, bosque). |
| **Fog Wall** | Pared de niebla densa que actúa como fallback de límite. |
| **Bioma** | Conjunto de reglas visuales y atmosféricas (colores, vegetación, clima). |
| **Heightmap** | Función o datos que definen la altura del terreno en cada punto. |
| **InstancedMesh** | Técnica de Three.js que renderiza múltiples copias de una malla en un solo draw call. |

---

## Apéndice B: Diagrama de Flujo de Transición

```
Jugador camina hacia warp point
         │
         ▼
¿Distancia al warp < radius?
         │
     ┌───┴───┐
     │       │
     NO      SÍ
     │       │
     │       ▼
     │   Mostrar pantalla de carga
     │   (overlay con "Now Loading...")
     │       │
     │       ▼
     │   MapLoader.unloadCurrentMap()
     │   ├── Remover meshes de escena
     │   ├── Liberar texturas
     │   ├── Limpiar WorldRuntime
     │   ├── Detener música
     │   └── Liberar assets
     │       │
     │       ▼
     │   MapLoader.loadMap(targetMapId)
     │   ├── Registrar definición
     │   ├── Construir terreno
     │   ├── Poblar objetos
     │   ├── Configurar ambiente/luces
     │   ├── Spawnear NPCs
     │   ├── Spawnear monstruos
     │   └── Posicionar jugador en spawn
     │       │
     │       ▼
     │   Ocultar pantalla de carga
     │   Iniciar música del mapa
     │       │
     │       ▼
     │   Jugador aparece en destino
     │
     └─────────┘
```

---

## Apéndice C: Checklist para Añadir un Mapa Nuevo

- [ ] Crear archivo en `lib/game/map/definitions/<id>.ts`
- [ ] Definir tamaño del mapa (96×96 recomendado)
- [ ] Configurar función de altura del terreno
- [ ] Definir colores de suelo (groundTexture)
- [ ] Colocar árboles (cantidad, clusters, borde)
- [ ] Colocar rocas (perímetro, clusters)
- [ ] Colocar props (cajas, barriles, carteles)
- [ ] Definir landmarks (puertas, hogueras, etc.)
- [ ] Definir zonas con polígonos
- [ ] Asignar bioma y densidades de decoración
- [ ] Configurar spawns de monstruos por zona
- [ ] Colocar NPCs
- [ ] Crear transiciones a/de otros mapas
- [ ] Configurar límites naturales del perímetro
- [ ] Configurar niebla y ambiente visual
- [ ] Generar datos de minimapa
- [ ] Importar y registrar en registry.ts
- [ ] Añadir transiciones desde mapas vecinos
- [ ] Probar: cargar, renderizar, caminar, transicionar
- [ ] Verificar: sin vacíos visibles, sin muros invisibles
