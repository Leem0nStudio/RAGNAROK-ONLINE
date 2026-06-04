# Dirección de Arte — Ragnarok Online Sandbox

> **Documento maestro de identidad visual.**
> Define el estilo, la paleta, el pipeline de texturas y la jerarquía visual del juego.
> Todo asset visual debe validarse contra este documento antes de integración.

---

## Índice

1. [Filosofía Visual](#1-filosofía-visual)
2. [Paleta de Color y Lenguaje Cromático](#2-paleta-de-color-y-lenguaje-cromático)
3. [Terreno — Texturas de Piso](#3-terreno--texturas-de-piso)
4. [Sistema de Edificios Low-Poly](#4-sistema-de-edificios-low-poly)
5. [Árboles y Vegetación](#5-árboles-y-vegetación)
6. [Iluminación y Postprocesado](#6-iluminación-y-postprocesado)
7. [Pipeline de Assets Generados](#7-pipeline-de-assets-generados)
8. [Plan de Implementación por Prioridad](#8-plan-de-implementación-por-prioridad)
9. [Especificaciones Técnicas](#9-especificaciones-técnicas)

---

## 1. Filosofía Visual

### Referencia Estética

Ragnarok Online original usa un estilo **2.5D isométrico** con estas características distintivas:

- **Sprites 2D dibujados a mano** para personajes, monstruos y objetos sobre un terreno 3D con texturas pintadas.
- **Color saturado y vibrante** — los mapas usan paletas amplias con sombras coloreadas (no grises).
- **Iluminación cálida y direccional** — luz de sol lateral que genera sombras largas y definidas.
- **Vegetación estilizada** — árboles con copas redondeadas y colores planos, casi caricaturescos.
- **Arquitectura europea medieval** — techos de teja naranja, paredes encaladas, piedra clara.
- **Borde negro/contorno suave** en ciertos elementos para dar legibilidad.

### Nuestra Interpretación (3D Browser)

Dado que trabajamos con geometría procedural en Three.js sin modelo externo:

- **Low-poly intencional** — caras planas y aristas visibles como decisión estética, no limitación.
- **Texturas pintadas proceduralmente** vía Canvas2D para el terreno y fachadas.
- **Billboards 2D** para árboles y vegetación — sprites dibujados en Canvas2D que siempre miran a cámara.
- **Colores planos con flatShading** — sin PBR, usando `MeshLambertMaterial` o `MeshStandardMaterial` con `roughness: 0.9`, `metalness: 0.0`, `flatShading: true`.
- **Contorno negro en geometría** como toque opcional vía `EdgesGeometry` + `LineBasicMaterial`.

### Reglas de Oro

| Regla | Descripción |
|-------|-------------|
| **R1: Saturación primero** | Prefiere colores saturados sobre apagados. Un verde #4ade80 es mejor que #6b8e6b. |
| **R2: Sombra coloreada** | Las sombras usan azul/púrpura oscuro (#1a1a3a), nunca negro puro. |
| **R3: Flat shading** | `flatShading: true` en todos los materiales de terreno y props. |
| **R4: Sin texturas realistas** | Todo es pintado o generado proceduralmente — sin fotos, sin PBR. |
| **R5: Legibilidad ante todo** | El jugador debe poder leer el mapa instantáneamente. Silueta de edificios contrastante con el cielo. |

---

## 2. Paleta de Color y Lenguaje Cromático

### Colores Base del Mundo Ragnarok

```
── Tierra / Pasto ──────────────────────────────────────
  Pasto soleado:    #7ec850   (126, 200, 80)
  Pasto oscuro:     #5a9e3a   (90, 158, 58)
  Tierra:           #c4a46c   (196, 164, 108)
  Camino:           #b8956a   (184, 149, 106)
  Piedra:           #9aa9b6   (154, 169, 182)
  Arena:            #e8d5a3   (232, 213, 163)

── Arquitectura Prontera ──────────────────────────────
  Teja (barro):     #d4743a   (212, 116, 58)
  Muro encalado:    #f5efe0   (245, 239, 224)  + sombra #d4c9b0
  Madera:           #b8865a   (184, 134, 90)
  Piedra sillar:    #c8bda8   (200, 189, 168)
  Hierro forjado:   #3a3a4a   (58, 58, 74)
  Vidrio:           #7ab8e0   (122, 184, 224)

── Vegetación ─────────────────────────────────────────
  Copa árbol:       #4a9e3a   (74, 158, 58)
  Copa claro:       #6abe4a   (106, 190, 74)
  Copa oscuro:      #2d7a2d   (45, 122, 45)
  Tronco:           #6a4a2a   (106, 74, 42)

── Agua ───────────────────────────────────────────────
  Agua somera:      #4a9ac8   (74, 154, 200)
  Agua profunda:    #1a5a8a   (26, 90, 138)

── Cielo ──────────────────────────────────────────────
  Día claro:        #87ceeb   (135, 206, 235)  →  fondo de escena
  Horizonte:        #c8d8c8   (200, 216, 200)  →  fog color
```

### Significado de Colores por Contexto

| Contexto | Color | Hex | Uso |
|----------|-------|-----|-----|
| Interactivo | Amarillo Kafra | `#fbbf24` | NPCs, portales, objetivos |
| Peligro | Rojo combate | `#ef4444` | Bosses, daño, enemigos |
| Magia amigable | Azul cielo | `#38bdf8` | Hechizos aliados, curas |
| Magia hostil | Púrpura veneno | `#a855f7` | Magia enemiga, veneno |
| Recompensa | Dorado | `#f59e0b` | Loot, XP, nivel, zeny |
| Neutral | Gris pizarra | `#94a3b8` | NPCs neutrales, texto secundario |

### Paletas por Bioma

Cada bioma define una variación cromática coherente (ver `biomePresets.ts`):

| Bioma | Tono dominante | Acento | Fog |
|-------|---------------|--------|-----|
| `city` | Crema / piedra | Teja naranja | `#d4c9b0` |
| `plains` | Verde pasto | Azul cielo | `#c8d8c8` |
| `forest` | Verde bosque | Marrón tierra | `#c8d4b8` |
| `desert` | Amarillo arena | Naranja | `#d4c8a0` |
| `snow` | Blanco hielo | Azul claro | `#d8dce8` |
| `dungeon` | Gris oscuro | Rojo lava | `#1a1a2a` |

---

## 3. Terreno — Texturas de Piso

### Problema Actual

Las texturas del terreno son tiles de Minecraft (16x16px ampliados a 64px) descargados de GitHub, con estilo pixelado realista. No transmiten la sensación pintada a mano de Ragnarok.

### Solución: Generación Procedural de Texturas Ragnarok

Crear un script `scripts/generate-ragnarok-atlas.mjs` que genere texturas **64×64 píxeles** pintadas proceduralmente vía Canvas2D (usando Sharp como el actual, pero dibujando patrones en vez de escalar downloads).

#### Patrones de Tile por Índice

El atlas será un grid 4×4 (16 tiles, 64px c/u → atlas de 256×256px). Mantenemos la convención de `[0,1,2,3]` para pesos del shader.

| Índice | Tipo | Descripción Visual | Técnica de Generación |
|--------|------|--------------------|----------------------|
| 0 | `grass` | Pasto verde brillante con pequeñas motas | Base #7ec850 + ruido Perlin en tono + puntitos #5a9e3a aleatorios |
| 1 | `grass_dark` | Pasto oscuro | Base #5a9e3a + motas más grandes, menos brillo |
| 2 | `dirt` | Tierra marrón clara | Base #c4a46c + ruido + pequeñas piedrecitas #b8956a |
| 3 | `dirt_dark` | Tierra oscura (camino) | Base #b8956a + menos saturación, más ruido |
| 4 | `stone` | Piedra gris azulada | Base #9aa9b6 + grietas finas (líneas de 1px) + moteado |
| 5 | `stone_brick` | Patrón de ladrillo de piedra | Base #a8b8c8 + líneas de mortero #8a9aaa en patrón de ladrillos |
| 6 | `cobble` | Adoquín | Base #8a9aaa + círculos/polígonos irregulares superpuestos con borde #6a7a8a |
| 7 | `gravel` | Gravilla | Base #9a9a9a + puntos #7a7a7a de 2-3px aleatorios |
| 8 | `sand` | Arena clara | Base #e8d5a3 + puntilleo muy fino #d4c49a |
| 9 | `sand_dark` | Arena húmeda | Base #c4b48a + menos brillo |
| 10 | `water` | Agua (no se usa en peso del terreno actual) | Degradado azul #4a9ac8 con ondas sinusoidales (se usa como plano aparte) |
| 11 | `mud` | Barro | Base #8a7a5a + manchas difusas más oscuras |
| 12 | `snow` | Nieve | Base #f0f4f8 + mínimo ruido casi blanco |
| 13 | `ice` | Hielo | Base #d0e4f0 + 40% de brillo + líneas blancas finas |
| 14 | `lava` | Lava (futuro) | Base #f44a1a + manchas #eab308 amarillas |
| 15 | `pavement` | Loseta de plaza | Base #c8bda8 + patrón cuadriculado #b8ada0 fino |

#### Técnica de Generación de Cada Tile

Cada tile se genera con Sharp/Skia dibujando capas:
1. **Fondo sólido** con el color base
2. **Ruido orgánico** aplicando variación `(Math.random() - 0.5) * 20` a cada píxel
3. **Detalles específicos del tipo** (puntitos, líneas de grieta, patrón de ladrillos)
4. **Sombra interna leve** en bordes superior e izquierdo para dar profundidad

```javascript
// Pseudocódigo para generar tile grass
function generateGrassTile(size = 64) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');

  // 1. Base color
  ctx.fillStyle = '#7ec850';
  ctx.fillRect(0, 0, size, size);

  // 2. Perlin noise variation
  const imageData = ctx.getImageData(0, 0, size, size);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const noise = (perlin(x * 0.1, y * 0.1, 42) - 0.5) * 30;
      const idx = (y * size + x) * 4;
      imageData.data[idx]     = clamp(126 + noise, 0, 255);     // R
      imageData.data[idx + 1] = clamp(200 + noise, 0, 255);     // G
      imageData.data[idx + 2] = clamp(80 + noise * 0.5, 0, 255); // B
    }
  }

  // 3. Grass tufts (small darker dots)
  for (let i = 0; i < 40; i++) {
    const gx = Math.random() * size;
    const gy = Math.random() * size;
    ctx.fillStyle = `rgba(58, 128, 40, ${0.3 + Math.random() * 0.4})`;
    ctx.beginPath();
    ctx.arc(gx, gy, 1 + Math.random() * 2, 0, Math.PI * 2);
    ctx.fill();
  }
  return canvas;
}
```

#### Nuevos Archivos de Atlas

Se generarán 6 atlas, uno por bioma, reemplazando los actuales de Minecraft:

| Atlas | Path | Descripción |
|-------|------|-------------|
| `terrain_atlas.png` | `public/textures/tiles/terrain_atlas.png` | Biomas plains, city, mountain |
| `forest_atlas.png` | `public/textures/tiles/forest_atlas.png` | Forest, swamp (más verde) |
| `desert_atlas.png` | `public/textures/tiles/desert_atlas.png` | Desert (arenoso) |
| `snow_atlas.png` | `public/textures/tiles/snow_atlas.png` | Snow, ice |
| `dungeon_atlas.png` | `public/textures/tiles/dungeon_atlas.png` | Dungeon (oscuro) |
| `lava_atlas.png` | `public/textures/tiles/lava_atlas.png` | Volcano, lava |

### Actualización del WeightMapShader

El `WeightMapShader` actual (`lib/game/terrain/WeightMapShader.ts`) usa `texture2D` con tiles del atlas. **No necesita cambios** — solo se reemplazan los archivos PNG. El sistema de pesos por bioma ya funciona con `biomePresets.ts`.

### La Transición Visual

Antes: textura Minecraft pixelada → Después: textura pintada con colores planos saturados.

| Antes | Después |
|-------|---------|
| Grass tile Minecraft (45, 90, 39) con textura de tierra | Pasto verde saturado #7ec850 con motitas |
| Tile cuadrado visible con bordes duros | Mezcla suave entre tiles vía weight map |
| Sin variación de matiz | Variación Perlin en tono y saturación |

---

## 4. Sistema de Edificios Low-Poly

### Estado Actual

Los edificios son geometry procedural simple (BoxGeometry, CylinderGeometry) con `MeshStandardMaterial` de color plano. No hay edificios completos en `PropLibrary.ts` — solo componentes como `stall`, `fountain`, `windmill`. No hay un sistema de "casa" con paredes, techo, ventanas, puerta.

### Objetivo: Sistema de Edificios Ragnarok

Crear un sistema de **Edificios Modulares** donde una casa se construye de partes:

```
Casa Ragnarok Típica (Prontera)
┌─────────────────────────────────┐
│         Teja naranja            │  ← ConeTruncated o CustomGeometry
│       ╱─────────────────╲       │
│      │  ┌──┐    ┌──┐   │       │  ← Pared blanca + ventanas
│      │  │ ■│    │■ │   │       │
│      │  └──┘    └──┘   │       │
│      │      ┌─┐        │       │
│      │      │ │        │       │  ← Puerta madera
│      │      └─┘        │       │
└──────┴─────────────────┴───────┘
```

#### Casa de 3 Tamaños

Se registrarán 3 blueprints en `PropLibrary.ts`:

| Blueprint ID | Descripción | Dimensiones (ancho × alto × fondo) | Uso |
|-------------|-------------|-----------------------------------|-----|
| `house_small` | Casa de 1 piso con techo a 2 aguas | 3.0 × 2.4 × 2.5 | Viviendas, tiendas pequeñas |
| `house_medium` | Casa de 2 pisos con techo a 2 aguas | 3.5 × 4.0 × 3.0 | Edificios principales, posadas |
| `house_large` | Edificio público (iglesia, ayuntamiento) | 5.0 × 3.5 × 4.0 | Catedral, castillo |

#### Construcción Procedural de una Casa

En `getGeometry()` de `PropLibrary.ts`, añadiremos casos para `house_small`, `house_medium`, `house_large`:

```typescript
case 'house_small': {
  const parts: THREE.BufferGeometry[] = [];

  // 1. Paredes (caja sin techo)
  const walls = new THREE.BoxGeometry(3.0, 1.6, 2.5);
  walls.translate(0, 0.8, 0);
  parts.push(walls);

  // 2. Techo a dos aguas (prisma triangular = CylinderGeometry con 3 segmentos radiales, escalado)
  const roof = new THREE.ConeGeometry(2.2, 0.9, 3); // 3 lados → triángulo visto de frente
  roof.rotateY(Math.PI / 6); // alinear
  roof.scale(1, 1, 0.8);
  roof.translate(0, 1.6 + 0.45, 0);
  parts.push(roof);

  // 3. Puerta (rectángulo marrón en la pared frontal)
  const door = new THREE.BoxGeometry(0.5, 0.9, 0.05);
  door.translate(0, 0.45, 1.26); // centro de la cara frontal
  parts.push(door);

  // 4. Ventanas (2 pequeñas)
  const win = new THREE.BoxGeometry(0.4, 0.4, 0.05);
  win.translate(-0.8, 0.9, 1.26);
  parts.push(win);

  const win2 = new THREE.BoxGeometry(0.4, 0.4, 0.05);
  win2.translate(0.8, 0.9, 1.26);
  parts.push(win2);

  const merged = mergeBufferGeometries(parts);
  geo = merged || walls;
  break;
}
```

#### Asignación de Colores por Componente

Cada parte de la casa necesita un color diferente. Pero con `InstancedMesh`, todas las instancias comparten un solo `MeshStandardMaterial`. Solución: usar **vertex colors** en vez de material único.

En `getGeometry()`, asignar colores a vértices:

```typescript
// Después de mergeBufferGeometries, asignar vertex colors
function assignVertexColors(geo: THREE.BufferGeometry, faceColors: number[]) {
  const pos = geo.getAttribute('position');
  if (!pos) return;
  const colors = new Float32Array(pos.count * 3);
  // Cada triángulo (3 vértices) recibe un color del array faceColors
  // Simplificación: usar una textura pequeña de 1×N píxeles como palette lookup
  // ... o mejor: usar MeshLambertMaterial con vertexColors: true
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
}
```

**Alternativa más simple y eficiente:** usar un **Sprite frontal** para la fachada (como hacen los juegos isométricos). La casa es una caja simple, y una textura Canvas2D con la fachada pintada se aplica como textura UV en la cara frontal.

#### Edificios con Fachada Pintada (Recomendado)

Para el mayor impacto visual con la menor complejidad geométrica:

1. La geometría de la casa es una **caja baja** (BoxGeometry) para el cuerpo + **cilindro de 3 lados** para el techo.
2. La **textura de la fachada** (puerta, ventanas, detalles) se genera en Canvas2D y se aplica como textura UV a la cara frontal.
3. El techo usa un color sólido (teja naranja).
4. Las paredes laterales usan un color sólido (encalado crema).

Esto requiere modificar `getMaterial()` para usar `map` en la cara frontal, o alternativamente crear un material con textura de fachada.

**Implementación con textura UV:**

```typescript
case 'house_small': {
  // Cuerpo: BoxGeometry con UVs para textura de fachada
  const body = new THREE.BoxGeometry(3.0, 1.6, 2.5);
  // UVs por defecto de BoxGeometry mapean cada cara al 0-1 completo
  // La textura fachada se aplica al material y la cara frontal (z+) la muestra
  body.translate(0, 0.8, 0);

  // Techo: prisma triangular simple
  const roof = new THREE.CylinderGeometry(0.01, 2.0, 0.8, 3);
  roof.rotateY(Math.PI / 2);
  roof.translate(0, 1.6 + 0.4, 0);

  const merged = mergeBufferGeometries([body, roof]);
  geo = merged;
  break;
}
```

Y en `getMaterial()`:

```typescript
case 'house_small': {
  const facadeTex = generateFacadeTexture('house_small'); // Canvas2D
  const mat = new THREE.MeshLambertMaterial({
    map: facadeTex,
    color: 0xf5efe0, // Tint base para caras sin textura
    flatShading: true,
  });
  return mat;
}
```

#### Generación de Fachadas (Canvas2D)

Crear función `generateFacadeTexture(type: string): THREE.CanvasTexture`:

```typescript
function generateFacadeTexture(type: string): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d')!;

  if (type === 'house_small') {
    // Pared crema
    ctx.fillStyle = '#f5efe0';
    ctx.fillRect(0, 0, 128, 128);

    // Textura de piedra sutil (líneas finas horizontales)
    ctx.strokeStyle = '#e8dcc8';
    ctx.lineWidth = 1;
    for (let y = 0; y < 128; y += 12) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(128, y);
      ctx.stroke();
    }

    // Puerta (centro, abajo)
    ctx.fillStyle = '#6a4a2a'; // madera oscura
    ctx.fillRect(50, 80, 28, 48);
    // Marco puerta
    ctx.strokeStyle = '#4a3020';
    ctx.lineWidth = 2;
    ctx.strokeRect(50, 80, 28, 48);
    // Manija
    ctx.fillStyle = '#fbbf24'; // dorado
    ctx.beginPath();
    ctx.arc(72, 104, 2, 0, Math.PI * 2);
    ctx.fill();

    // Ventana izquierda
    ctx.fillStyle = '#7ab8e0'; // vidrio azul
    ctx.fillRect(18, 40, 28, 28);
    ctx.strokeStyle = '#3a3a4a';
    ctx.lineWidth = 2;
    ctx.strokeRect(18, 40, 28, 28);
    // Cruz de ventana
    ctx.beginPath();
    ctx.moveTo(32, 40); ctx.lineTo(32, 68);
    ctx.moveTo(18, 54); ctx.lineTo(46, 54);
    ctx.stroke();

    // Ventana derecha
    ctx.fillStyle = '#7ab8e0';
    ctx.fillRect(82, 40, 28, 28);
    ctx.strokeStyle = '#3a3a4a';
    ctx.lineWidth = 2;
    ctx.strokeRect(82, 40, 28, 28);
    ctx.beginPath();
    ctx.moveTo(96, 40); ctx.lineTo(96, 68);
    ctx.moveTo(82, 54); ctx.lineTo(110, 54);
    ctx.stroke();

    // Repisa de flores (ventana izquierda)
    ctx.fillStyle = '#d4743a';
    ctx.fillRect(16, 68, 32, 4);
    // Macetas
    ctx.fillStyle = '#4a9e3a';
    ctx.beginPath();
    ctx.arc(24, 66, 3, 0, Math.PI * 2);
    ctx.arc(32, 66, 3, 0, Math.PI * 2);
    ctx.arc(40, 66, 3, 0, Math.PI * 2);
    ctx.fill();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.minFilter = THREE.NearestFilter;
  tex.magFilter = THREE.NearestFilter;
  return tex;
}
```

### Catálogo de Edificios

| Blueprint ID | Pisos | Techo | Fachada | Uso típico |
|-------------|-------|-------|---------|------------|
| `house_small` | 1 | 2 aguas naranja | Crema con puerta y 2 ventanas | Viviendas, tiendas |
| `house_medium` | 2 | 2 aguas naranja | Crema, balcón, 4 ventanas | Posadas, talleres |
| `house_large` | 1-2 | Cúpula/catedral | Piedra clara, arcos, rosetón | Iglesia, ayuntamiento |
| `shop_awning` | 1 | Plano con toldo | Abierto con mercancía visible | Puesto de mercado |
| `tower_round` | 3+ | Cónico gris | Piedra sillar, aspilleras | Torre de vigilancia |
| `wall_segment` | 1 | Almenas | Piedra gris | Muralla de ciudad |
| `gate_arch` | 1 | Arco | Piedra sillar + puerta | Entrada de ciudad |

### Mapping de Props en Mapas

Cada mapa define sus edificios como `PropSpawn[]` en `MapDefinition.props`:

```typescript
props: [
  // Edificios
  { propId: 'house_small', position: { x: 20, z: 20 }, rotation: 0, scale: 1 },
  { propId: 'house_small', position: { x: 24, z: 20 }, rotation: 0, scale: 1 },
  { propId: 'house_medium', position: { x: 28, z: 20 }, rotation: Math.PI / 2, scale: 1 },
  { propId: 'house_large', position: { x: 32, z: 32 }, rotation: 0, scale: 1.2 },
]
```

---

## 5. Árboles y Vegetación

### Problema Actual

Los árboles son ConeGeometry (copa) + CylinderGeometry (tronco) con colores planos. Se ven geométricamente simples y no tienen el estilo "pintado" de Ragnarok.

### Solución: Árboles Billboard + Vegetación 2D

#### Árboles Grandes (Copa Redondeada)

Para árboles de ciudad y bosque, reemplazar la geometría 3D por **billboards 2D**: un Sprite (plano que siempre mira a cámara) con una textura Canvas2D de un árbol pintado con colores planos y borde.

```typescript
case 'tree_deciduous': {
  // Generar textura de árbol pintado
  const tex = generateTreeTexture('deciduous', 128, 128);

  // Sprite (billboard)
  const spriteMat = new THREE.SpriteMaterial({
    map: tex,
    transparent: true,
    alphaTest: 0.3,
    depthWrite: false,
    blending: THREE.NormalBlending,
  });
  const sprite = new THREE.Sprite(spriteMat);
  sprite.scale.set(2.0, 2.0, 1);
  return sprite; // No es InstancedMesh — requiere grupo separado
}
```

> **IMPORTANTE:** Los billboards con `Sprite` NO se pueden usar con `InstancedMesh`. Habrá que manejar árboles como `THREE.Sprite[]` individuales, o usar `THREE.InstancedMesh` con un `PlaneGeometry` que tenga UVs calculados y un ShaderMaterial que siempre mire a cámara.

#### Alternativa Performante: InstancedMesh con PlaneGeometry Always-Facing

Para poder usar InstancedMesh (necesario para grandes cantidades), usar un `PlaneGeometry` con un `ShaderMaterial` personalizado que rota el plano hacia la cámara:

```typescript
// Vertex shader para billboards instanciados
const billboardVertexShader = `
  attribute vec2 aCenter;  // centro de cada instancia
  attribute float aScale;
  uniform vec3 uCameraPosition;

  varying vec2 vUv;

  void main() {
    vUv = uv;
    vec3 worldPos = vec3(aCenter.x, 0.0, aCenter.y);
    vec3 toCamera = normalize(uCameraPosition - worldPos);

    // Calcular los ejes del billboard (always-facing)
    vec3 up = vec3(0.0, 1.0, 0.0);
    vec3 right = normalize(cross(toCamera, up));
    up = cross(right, toCamera);

    // Posición del vértice en el billboard
    vec3 localPos = position * aScale;
    vec3 billboardPos = worldPos + right * localPos.x + up * localPos.y;

    gl_Position = projectionMatrix * modelViewMatrix * vec4(billboardPos, 1.0);
  }
`;
```

**Simplificación inmediata:** Usar `THREE.Sprite` para árboles decorativos (< 50 por mapa) y `InstancedMesh` solo para pasto/arbustos. Para la escala de Prontera (ciudad), 20-30 árboles como Sprites es perfectamente aceptable.

#### Generación de Texturas de Árbol (Canvas2D)

```typescript
function generateTreeTexture(type: string, w: number, h: number): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;

  if (type === 'deciduous') {
    // Copa redondeada verde con volumen
    const gradient = ctx.createRadialGradient(64, 50, 5, 64, 50, 40);
    gradient.addColorStop(0, '#6abe4a');   // centro claro
    gradient.addColorStop(0.6, '#4a9e3a'); // medio
    gradient.addColorStop(1, '#2d7a2d');   // borde oscuro (sombra)
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(64, 50, 40, 0, Math.PI * 2);
    ctx.fill();

    // Tronco
    ctx.fillStyle = '#6a4a2a';
    ctx.fillRect(58, 75, 12, 30);

    // Algunas hojas sueltas (detalles)
    for (let i = 0; i < 8; i++) {
      ctx.fillStyle = `rgba(106, 190, 74, ${0.3 + Math.random() * 0.5})`;
      ctx.beginPath();
      ctx.arc(
        40 + Math.random() * 50,
        25 + Math.random() * 50,
        3 + Math.random() * 6,
        0, Math.PI * 2
      );
      ctx.fill();
    }
  }

  if (type === 'conifer') {
    // Forma de cono con gradiente vertical
    for (let i = 0; i < 5; i++) {
      const yBase = 70 - i * 12;
      const width = 60 - i * 10;
      ctx.fillStyle = i % 2 === 0 ? '#2d7a2d' : '#3a8a3a';
      ctx.beginPath();
      ctx.moveTo(64 - width/2, yBase + 10);
      ctx.lineTo(64, yBase);
      ctx.lineTo(64 + width/2, yBase + 10);
      ctx.closePath();
      ctx.fill();
    }
    // Tronco
    ctx.fillStyle = '#5a3a1a';
    ctx.fillRect(60, 72, 8, 20);
  }

  if (type === 'palm') {
    // Tronco curvo
    ctx.strokeStyle = '#8a6a3a';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(64, 100);
    ctx.quadraticCurveTo(70, 65, 64, 40);
    ctx.stroke();
    // Hojas
    for (let a = 0; a < 6; a++) {
      const angle = (a / 6) * Math.PI * 2;
      ctx.strokeStyle = '#4a9e3a';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(64, 40);
      const ex = 64 + Math.cos(angle) * 35;
      const ey = 40 + Math.sin(angle) * 20;
      ctx.quadraticCurveTo(64 + Math.cos(angle - 0.3) * 20, 30, ex, ey);
      ctx.stroke();
    }
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.minFilter = THREE.NearestFilter;
  tex.magFilter = THREE.NearestFilter;
  tex.generateMipmaps = true;
  return tex;
}
```

### Sistema de Vegetación por Capas

El `VegetationSystem.ts` actual soporta tres tipos: `tree`, `bush`, `grass`. Se migrará de la siguiente manera:

| Tipo actual | Nuevo enfoque | Renderizado |
|-------------|---------------|-------------|
| `tree` → `tree_billboard` | Sprite con textura pintada | `THREE.Sprite` con CanvasTexture |
| `bush` → `bush_billboard` | Sprite pequeño redondeado | `THREE.Sprite` (escala menor) |
| `grass` → `grass_instanced` | InstancedMesh de Planos con textura de pasto | `THREE.InstancedMesh` con PlaneGeometry |

### Catálogo de Árboles

| ID | Tipo | Altura (unidades) | Copa | Bioma |
|----|------|-------------------|------|-------|
| `tree_deciduous` | Caducifolio | 2.5 | Redonda verde | plains, city, forest |
| `tree_conifer` | Conífera | 3.0 | Cónica verde oscuro | forest, snow |
| `tree_palm` | Palmera | 3.5 | Hojas en abanico | desert |
| `tree_dead` | Muerto | 2.0 | Sin copa, ramas | desert, volcano |
| `tree_blossom` | Florido | 2.5 | Copa rosada | city (primavera) |

---

## 6. Iluminación y Postprocesado

### Configuración Three.js para Look Ragnarok

La iluminación actual en `engine.ts` es:
```typescript
this.scene.background = new THREE.Color(0x87ceeb);
this.scene.fog = new THREE.FogExp2(0xc8d8c8, 0.012);
```

Esto es un buen punto de partida. Vamos a refinarlo:

#### Iluminación Principal (en LightingManager.ts)

```typescript
// SOL PRINCIPAL — dirección este-sureste (tarde cálida)
this.directional = new THREE.DirectionalLight(0xffedd5, 1.3);
this.directional.position.set(25, 30, -20); // Este ligeramente sur

// Sombra con bias negativo para evitar acne
this.directional.shadow.bias = -0.001;
this.directional.shadow.normalBias = 0.02; // Suaviza bordes de sombra

// LUZ AMBIENTE — azul cielo reflejado, baja intensidad
this.ambient = new THREE.AmbientLight(0xb0d0ff, 0.35);

// LUZ HEMISFERIO — cielo azul, suelo reflejo verde
this.hemisphere = new THREE.HemisphereLight(0x87ceeb, 0x4a8c3f, 0.45);

// LUZ DE RELLENO — contraluz suave desde el oeste
this.fillLight = new THREE.DirectionalLight(0xd0e8ff, 0.25);
this.fillLight.position.set(-15, 10, 25);
```

#### Sombras Cartoon

Para el estilo Ragnarok, las sombras deben ser **duras y definidas** (no suaves como PCFSoft):

```typescript
this.renderer.shadowMap.type = THREE.PCFShadowMap; // Cambiar de PCFSoftShadowMap a PCFShadowMap
// Esto da sombras con bordes más marcados, estilo cartoon
```

#### Cámara Isométrica

La cámara actual en `engine.ts` usa FOV 40° con posición (0, 9, 13). Esto da una compresión isométrica aceptable. Ajustes finales:

```typescript
// Cámara con FOV más cerrado para efecto isométrico más marcado
this.camera = new THREE.PerspectiveCamera(35, width / height, 0.1, 1000);
// Posición: vista 3/4 desde arriba (estilo Ragnarok)
this.camera.position.set(0, 10.0, 14.0);
this.camera.lookAt(0, 0, 0);  // Mirar al centro del mundo
```

### Fog para Profundidad de Campo

El fog actual (`FogExp2`) es adecuado. Ajustes por bioma:

| Bioma | Color Fog | Densidad |
|-------|-----------|----------|
| city | `#d4c9b0` | 0.010 |
| plains | `#c8d8c8` | 0.012 |
| forest | `#a8b898` | 0.018 |
| desert | `#d4c8a0` | 0.008 |
| dungeon | `#1a1a2a` | 0.025 |

### Postprocesado (Futuro, Prioridad Baja)

Para el look "cel-shaded" completo, en el futuro se puede añadir un `EffectComposer` con:

1. **Outline pass** — bordes negros en geometría (vía `UnrealBloomPass` con `threshold: 0.1` o `OutlinePass`)
2. **Vignette** — oscurecimiento en bordes de pantalla para enfoque
3. **Color grading** — Curvas de color para saturación extra

**No implementar ahora** — el impacto visual del cambio de terreno + edificios + árboles será suficiente.

---

## 7. Pipeline de Assets Generados

### Script 1: `scripts/generate-texture-atlas.mjs`

Reemplaza a `generate-minecraft-atlas.mjs`. Genera todas las texturas proceduralmente.

**Output:**

| Archivo | Tamaño | Formato | Contenido |
|---------|--------|---------|-----------|
| `public/textures/tiles/terrain_atlas.png` | 256×256 | PNG-8 | Atlas de 16 tiles para biomas plains/city/mountain |
| `public/textures/tiles/forest_atlas.png` | 256×256 | PNG-8 | Atlas variante forestal (tiles 0,1,8,9 más verdes) |
| `public/textures/tiles/desert_atlas.png` | 256×256 | PNG-8 | Atlas variante desértica (tiles 0→sand, 1→red_sand) |
| `public/textures/tiles/snow_atlas.png` | 256×256 | PNG-8 | Atlas variante nieve (tiles 0→snow, 1→ice) |
| `public/textures/tiles/dungeon_atlas.png` | 256×256 | PNG-8 | Atlas variante mazmorra (tiles 0→stone, 1→cobble) |
| `public/textures/tiles/lava_atlas.png` | 256×256 | PNG-8 | Atlas variante volcánica |

### Script 2: `scripts/generate-building-facades.mjs` (Futuro)

Genera texturas de fachadas para edificios:

| Archivo | Tamaño | Formato | Contenido |
|---------|--------|---------|-----------|
| `public/textures/facades/house_small.png` | 128×128 | PNG-8 | Fachada casa pequeña con puerta y 2 ventanas |
| `public/textures/facades/house_medium.png` | 128×128 | PNG-8 | Fachada casa 2 pisos con balcón |
| `public/textures/facades/shop_awning.png` | 128×128 | PNG-8 | Fachada tienda con toldo y mercancía |

> **Nota:** Inicialmente, las fachadas se generan en tiempo de ejecución vía Canvas2D (como `generateFacadeTexture` en PropLibrary.ts). El script es para pre-generar versiones optimizadas si el rendimiento es insuficiente.

### Script 3: `scripts/generate-vegetation-sprites.mjs` (Futuro)

Pre-genera sprites de vegetación como PNGs:

| Archivo | Tamaño | Formato | Contenido |
|---------|--------|---------|-----------|
| `public/textures/vegetation/tree_deciduous.png` | 128×128 | PNG-8 | Árbol caducifolio (fondo transparente) |
| `public/textures/vegetation/tree_conifer.png` | 128×128 | PNG-8 | Árbol conífero |
| `public/textures/vegetation/tree_palm.png` | 128×128 | PNG-8 | Palmera |
| `public/textures/vegetation/bush_round.png` | 64×64 | PNG-8 | Arbusto redondeado |

> **Nota:** Ídem, inicialmente se generan en runtime vía Canvas2D en `renderer.ts` o `PropLibrary.ts`.

### Flujo de Construcción

```
npm run generate-atlas  →  ejecuta scripts/generate-texture-atlas.mjs
                            ↓
                      genera 6 archivos PNG en public/textures/tiles/
                            ↓
                      biomePresets.ts apunta a los archivos
                            ↓
                      WeightMapShader los carga y texturiza el terreno
```

---

## 8. Plan de Implementación por Prioridad

Ordenado por **máximo impacto visual con mínimo esfuerzo**.

### Fase 1: Texturas de Terreno (Alto Impacto, Esfuerzo Medio)

**Duración estimada:** 1-2 sprints

| Tarea | Archivos | Descripción |
|-------|----------|-------------|
| 1.1 | `scripts/generate-texture-atlas.mjs` (nuevo) | Escribir script que genera 16 tiles procedurales con Canvas2D/Sharp |
| 1.2 | `scripts/generate-minecraft-atlas.mjs` (reemplazar) | Reemplazar el script de Minecraft con el nuevo |
| 1.3 | `public/textures/tiles/*.png` | Generar los 6 atlas limpiando archivos antiguos |
| 1.4 | `biomePresets.ts` | Ajustar `tileSet` si los nuevos índices cambian |
| 1.5 | Prueba visual | Verificar mezcla entre tiles en distintos biomas |

**Criterio de éxito:** El terreno pasa de verse como Minecraft a verse como un mapa pintado de Ragnarok.

### Fase 2: Árboles Billboard (Alto Impacto, Esfuerzo Bajo)

**Duración estimada:** 1 sprint

| Tarea | Archivos | Descripción |
|-------|----------|-------------|
| 2.1 | `PropLibrary.ts` | Añadir función `generateTreeTexture()` en `getMaterial()` para `tree_deciduous` y `tree_conifer` |
| 2.2 | `PropLibrary.ts` | Cambiar `getGeometry()` para `tree_*` de geometría 3D a `THREE.PlaneGeometry` (para InstancedMesh billboard) |
| 2.3 | `PropLibrary.ts` | O crear Sprites individuales para árboles (más simple) |
| 2.4 | `VegetationSystem.ts` | Migrar `spawnTrees()` para usar billboards |
| 2.5 | `sceneGraph.ts` | Ajustar `EntitySpriteNode` si es necesario para árboles |

**Criterio de éxito:** Los árboles se ven como ilustraciones 2D pintadas que siempre miran a cámara.

### Fase 3: Edificios con Fachadas (Alto Impacto, Esfuerzo Medio-Alto)

**Duración estimada:** 2-3 sprints

| Tarea | Archivos | Descripción |
|-------|----------|-------------|
| 3.1 | `PropLibrary.ts` | Diseñar geometría de `house_small` (caja + techo triangular) |
| 3.2 | `PropLibrary.ts` | Diseñar geometría de `house_medium` |
| 3.3 | `PropLibrary.ts` | Diseñar geometría de `house_large` |
| 3.4 | `PropLibrary.ts` | Crear `generateFacadeTexture()` para cada tipo |
| 3.5 | `PropLibrary.ts` | Crear material con textura de fachada + vertex colors para techo |
| 3.6 | `map-definitions/prontera_city.ts` | Colocar edificios en la ciudad (reemplazar stalls/crates con casas) |
| 3.7 | `map-definitions/prontera_field.ts` | Colocar granjas/casas rurales |

**Criterio de éxito:** Prontera parece una ciudad medieval europea con techos naranja y fachadas pintadas.

### Fase 4: Ajustes de Iluminación (Impacto Medio, Esfuerzo Bajo)

**Duración estimada:** Medio sprint

| Tarea | Archivos | Descripción |
|-------|----------|-------------|
| 4.1 | `engine.ts` | Cambiar `shadowMap.type` a `PCFShadowMap` para sombras duras |
| 4.2 | `LightingManager.ts` | Ajustar posición del sol a (25, 30, -20) para luz más lateral |
| 4.3 | `LightingManager.ts` | Ajustar `targetState.directionalColor` a `#ffd8a0` (cálido) |
| 4.4 | `engine.ts` | Ajustar FOV a 35° y posición de cámara a (0, 10, 14) |
| 4.5 | `biomePresets.ts` | Refinar colores de fog y ambientLight por bioma |

**Criterio de éxito:** Las sombras son marcadas, la luz es cálida, el horizonte se siente como Ragnarok.

### Fase 5: Vegetación Billboard y Pasto (Impacto Medio, Esfuerzo Medio)

**Duración estimada:** 1 sprint

| Tarea | Archivos | Descripción |
|-------|----------|-------------|
| 5.1 | `PropLibrary.ts` | Añadir `bush_billboard` con textura de arbusto redondeado |
| 5.2 | `VegetationSystem.ts` | Cambiar `spawnBushes()` a billboards |
| 5.3 | `VegetationSystem.ts` | Cambiar `spawnGrass()` a usar PlaneGeometry texturizado con textura de pasto (no CylinderGeometry) |
| 5.4 | `map-definitions/*.ts` | Poblar vegetación en cada mapa |

**Criterio de éxito:** La vegetación se ve pintada a mano, no geométrica.

### Fase 6: Mejoras de Agua y Cielo (Bajo Impacto, Esfuerzo Bajo)

**Duración estimada:** Medio sprint

| Tarea | Archivos | Descripción |
|-------|----------|-------------|
| 6.1 | `MapTerrain.ts` | Mejorar agua con animación de ondas vía `ShaderMaterial` (desplazamiento de UV) |
| 6.2 | `engine.ts` | Añadir un gradiente de cielo (top azul intenso → horizonte crema) con un Sky shader o un gradient mesh |

---

## 9. Especificaciones Técnicas

### Convenciones de Materiales

| Propiedad | Valor | Excepciones |
|-----------|-------|-------------|
| `flatShading` | `true` | Solo agua y vidrio usan `false` |
| `roughness` | `0.9` | Metales (faroles, manijas) usan `0.4` |
| `metalness` | `0.0` | Faroles usan `0.1` |
| `emissive` | `#000000` | Antorchas, lava, cristales mágicos usan color |
| `transparent` | `false` | Hojas de árbol (alphaTest: 0.5), agua (opacity: 0.45) |

### Convenciones de Geometría

| Propiedad | Valor | Notas |
|-----------|-------|-------|
| Segmentos radiales | `6` para cilindros, `8` para esferas pequeñas | Bajo polígono intencional |
| Segmentos de anillo | `8` para anillos decorativos | Suficiente para sombras |
| Escala de props | `0.8`–`1.2` | Variación natural |
| Rotación Y | `0`–`2π` aleatoria | Excepto faroles (orientación fija) |

### Presupuesto de Polígonos por Escena

| Elemento | Presupuesto | Notas |
|----------|-------------|-------|
| Terreno | 5,000 triángulos | PlaneGeometry 33×33 = ~2,000 triángulos |
| Edificios | 1,000 triángulos c/u | Max 20 edificios visibles |
| Árboles (billboard) | 2 triángulos c/u | Sprite = 2 triángulos siempre |
| Props pequeños | 50-200 triángulos c/u | Max 500 props instanciados |
| Entidades (sprites) | 2 triángulos c/u | Billboard sprites |
| **Total estimado** | **~25,000 triángulos** | Muy por debajo del límite móvil (~100k) |

### Presupuesto de Memoria de Texturas

| Recurso | Tamaño | Memoria (aprox) |
|---------|--------|-----------------|
| Atlas de terreno (6 × 256×256) | 6 × 65KB PNG | ~2MB en GPU (DXT1 comprimido) |
| Fachadas (5 × 128×128) | 5 × 16KB PNG | ~0.3MB |
| Sprites vegetación (4 × 128×128) | 4 × 20KB PNG | ~0.3MB |
| Texturas de entidad (canvas runtime) | 128×128 × entidades visibles | ~0.5MB |
| **Total texturas** | | **~3.5MB** |

### Nomenclatura de Assets

Consistente con la convención del proyecto:

```
[category]_[name]_[variant]_[size].[ext]

Ejemplos:
tex_terrain_plains_256.png     → Textura de atlas de terreno
facade_house_small_128.png     → Fachada de casa pequeña
sprite_tree_deciduous_128.png  → Sprite de árbol caducifolio
prop_bench_wood_01.png         → Textura para props (futuro)
```

---

## Apéndice A: Resumen de Cambios por Archivo

| Archivo | Cambio | Prioridad |
|---------|--------|-----------|
| `scripts/generate-minecraft-atlas.mjs` | **REEMPLAZAR** con `generate-ragnarok-atlas.mjs` | Fase 1 |
| `lib/game/terrain/WeightMapShader.ts` | Sin cambios (solo se reemplazan PNGs) | — |
| `lib/game/map/biomePresets.ts` | Posible ajuste de `tileSet` si cambian índices | Fase 1 |
| `lib/game/terrain/PropLibrary.ts` | **AÑADIR** `generateTreeTexture()`, `generateFacadeTexture()`, nuevos casos `house_*` y `tree_*` billboard | Fase 2, 3 |
| `lib/game/terrain/VegetationSystem.ts` | Migrar `spawnTrees()` a billboard, `spawnGrass()` a PlaneGeometry con textura | Fase 5 |
| `lib/game/engine.ts` | Ajustar FOV cámara, `shadowMap.type`, posición de luz | Fase 4 |
| `lib/game/terrain/LightingManager.ts` | Ajustar ángulo solar, color de luz, intensidades | Fase 4 |
| `lib/game/terrain/MapTerrain.ts` | Mejorar agua con animación de ondas (ShaderMaterial) | Fase 6 |
| `lib/game/map/map-definitions/prontera_city.ts` | Colocar edificios reales, árboles, vegetación | Fase 3, 5 |
| `lib/game/map/map-definitions/*.ts` | Poblar vegetación y props en los 14 mapas | Fase 5 |

---

## Apéndice B: Referencias Visuales

Para guiar la implementación, buscar estas referencias:

1. **Prontera (Ragnarok Online)** — ciudad de techos naranja con catedral al fondo
2. **Payon (Ragnarok Online)** — arquitectura de madera entre bosque de bambú
3. **Alberta (Ragnarok Online)** — puerto con casas de colores pastel
4. **Geffen (Ragnarok Online)** — ciudad mágica con torres y cúpulas azules
5. **Izlude (Ragnarok Online)** — isla con acantilados y faro

Estilo de textura: buscar "Ragnar Online map textures" o "RO grassland texture" — se caracterizan por colores planos, saturación alta, y pinceladas visibles.

---

> **Este documento es vivo.** Cada vez que se completa una fase, actualizar la sección de estado y ajustar prioridades.
>
> Última actualización: 2026-06-04
> Versión: 1.0
