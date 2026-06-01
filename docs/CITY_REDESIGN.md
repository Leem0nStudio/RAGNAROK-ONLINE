# EPICEARTH — Rediseño de Ciudad Inicial (Prontera)

## Filosofía Visual

El layout de Prontera no es decorativo: es **navegación silenciosa**. Cada distrito, cada edificio, cada árbol funciona como un waypoint visual. El jugador debe poder trazar su ruta mental sin abrir el minimapa.

---

## 1. Silueta General (Skyline)

```
            ╱  🏰  ╲                 ← Castillo al fondo (norte)
          ╱  ╱     ╲  ╲
         │  🏛️       🏛️  │            ← Edificios altos (ayuntamiento, gremios)
        ╱ │    🏪🏪🏪   │ ╲           ← Mercado / tiendas
       ╱  │ 🎪━━━━━━━🎪  │  ╲         ← Plaza circular con fuente
      ╱   │  🌳  ┃  🌳   │   ╲
     ╱    │ camino ┃ │   │    ╲       ← Entradas en cruz
```

- **Castillo/torre central al norte**: punto de referencia omnipresente
- **Cúpulas de edificios gremiales**: siluetas asimétricas (una aguda, una redonda)
- **Árboles altos (cipreses/palmeras)**: marcan ejes de camino
- **Iluminación**: sol siempre en ángulo pronunciado (sombras largas direccionales)

---

## 2. Mapa Funcional

```
                  ┌──────────────────────┐
                  │     CASTILLO         │  ← Norte, siempre visible
                  │   (no accesible)     │
                  └────────┬──┬──────────┘
                           │  │
              ┌────────────┘  └────────────┐
              │                             │
        ┌─────┤     GREMIO        GREMIO    ├─────┐
        │     │     (Mago)      (Guerrero)  │     │
        │     └──────────┬──┬───────────────┘     │
        │                │  │                     │
   ┌────┤                │  │                     ├────┐
   │    │    🌳🌳        │  │        🌳🌳         │    │
   │    │       ┌────────┘  └────────┐            │    │
   │    │       │                    │            │    │
   │    │       │    KAFRA ★        │            │    │
←──┤ CM1├───────┤                    ├────────────┤CM2 ├──→
   │    │       │     ⛲ FUENTE      │            │    │
   │    │       │                    │            │    │
   │    │       └────────────────────┘            │    │
   │    │    🏪🏪          🏪🏪🏪                    │    │
   │    │   MERCADO       INSTRUCTOR              │    │
   │    │                                         │    │
   └────┴─────────────────────────────────────────┴────┘
                  │                         │
                  │     ZONA DE DESCANSO    │
                  │     (bancos, árboles,    │
                  │      flores, pozo)      │
                  └─────────────────────────┘
```

---

## 3. Zonas / Distritos

### A. Plaza Central — El Corazón

- **Forma**: hexagonal o circular (~30m diámetro)
- **Piso**: loseta radial de piedra clara (8 puntas desde la fuente), alternando baldosa beige y terracota
- **Bordillo**: piedra oscura delimita el borde exacto

**Elementos:**
- Fuente de 3 niveles (agua vertical + base de piedra blanca con borde dorado)
- 4 farolas en esquinas NW/NE/SW/SE
- 4 bancos de piedra mirando a la fuente
- 2 árboles frondosos (sombra) al SW y SE

**Propósito**: Punto de aparición y orientación. Desde aquí se ven: castillo (N), gremios (NE/NW), mercado (SE/SW), Kafra (E).

---

### B. Distrito de Servicios (alrededor de la plaza)

#### Kafra ★ (Este, a 15 pasos de la fuente)
- **Estructura**: quiosco/cabina abierta, techo de madera con toldo azul cielo
- **Piso**: alfombra roja cuadrada
- **Laterales**: 2 maceteros con flores azules
- **Identificador visual**: dos banderas blancas con cruz azul a los lados + destello tenue sobre el techo (partículas tipo "luz divina")

#### Mercader (SE, 20 pasos)
- **Estructura**: toldo ancho rayado rojo/blanco soportado por 4 postes de madera
- **Mercancía visible**: 3 barriles, 2 jaulas vacías, un carro con ruedas
- **Suelo**: tabla de madera elevada 0.3m del piso

#### Instructor de Jobs (SO, 22 pasos)
- **Estructura**: templete abierto con columnas de piedra blancas y techo a dos aguas
- **Interior**: estatua de guerrero sosteniendo espada vertical (señal visual)
- **Suelo**: loseta en damero (blanco/gris)
- **Adyacente**: 3 postes de entrenamiento (palos verticales) al lado

---

### C. Vialidad — Caminos

**Eje Norte-Sur** (Camino Real):
- Ancho: 6m
- Pavimento: losa rectangular gris ceniza con junta de césped cada 2 losas
- Flanqueado por: 8 cipreses italianos altos (delgados, verticales, 6m de alto) espaciados 6m
- Estos árboles son la guía visual principal. El jugador los ve desde cualquier punto.

**Eje Este-Oeste** (Camino del Mercado):
- Ancho: 5m
- Pavimento: adoquín redondo pequeño, ocre
- Flanqueado por: farolas cada 8m, alternadas izquierda/derecha

**Calles secundarias** (conexiones distritales):
- Ancho: 3m
- Superficie: tierra compacta con huellas de carreta
- Bordes: piedras sueltas + pasto alto

**Senderos peatonales** (jardines):
- Ancho: 1.5m
- Superficie: lajas irregulares hundidas en césped

---

### D. Zona de Descanso (Oeste)

- 6 bancos de madera dispuestos en U mirando un pequeño estanque circular
- 4 arbustos florales (rosas, lavanda — hitbox decorativa)
- 3 árboles grandes de copa ancha que cubren el área
- Pequeño pozo de piedra (decorativo, borde desgastado)
- 2 farolas tenues (luz anaranjada tenue, menos intensa que las de la plaza)
- Sonido ambiente: grillos, agua

---

### E. Edificios de Gremio (Noreste / Noroeste)

Ubicados al pie del castillo, flanqueando el camino real:

**Gremio de Magia** (NE):
- Forma: torre redonda de 2 pisos, techo cónico azul oscuro, ventanas ojivales
- Color: paredes blancas, detalles dorados
- 2 pinos flanqueando la entrada

**Gremio de Armas** (NW):
- Forma: edificio cuadrado macizo, techo a dos aguas rojo, almenas decorativas
- Color: paredes gris piedra, vigas de madera vista
- 1 bandera roja vertical al lado de la puerta

**Propósito**: Crear asimetría visual en el skyline. Desde cualquier punto, ambas siluetas son distintas.

---

### F. Castillo / Palacio (Norte, fondo escénico)

- Visible desde TODA la ciudad
- NO accesible (pared decorativa al pie)
- 3 torres: 1 central alta (aguja) + 2 laterales cortas con cúpula
- Fachada de piedra clara, ventanas estrechas
- Puente levadizo decorativo sobre foso seco con césped
- 4 banderas (dos rojas, dos doradas) ondeando en la muralla

---

### G. Periferia — Transición a zonas exteriores

**Salida a CM1** (Oeste):
- Arco de piedra rusticada con enredaderas
- Cartel de madera colgante "Campo Mañana — Zona de Entrenamiento"
- 2 antorchas a los lados

**Salida a CM2** (Este):
- Puente de madera corto sobre arroyo seco
- 2 postes con cuerda decorativa
- Pino solitario marcando el camino

---

## 4. Vegetación (Catálogo)

| Elemento | Uso | Altura | Sombra |
|----------|-----|--------|--------|
| Ciprés italiano | Eje N-S (x8) | 6m | Sí, delgada |
| Árbol frondoso | Plaza, descanso (x5) | 4m | Sí, ancha |
| Pino | Gremios, salidas (x4) | 5m | Sí, cónica |
| Arbusto floral | Descanso, Kafra (x6) | 1.2m | No |
| Macetero con flores | Kafra, fuente (x4) | 0.8m | No |
| Enredadera | Arco salida CM1 | — | Decorativa |
| Pasto alto | Calles secundarias | 0.3m | No |
| Césped | Toda la ciudad | Raso | No |

---

## 5. Iluminación y Atmósfera

- **Hora**: Atardecer dorado (sol bajo en el horizonte SW)
- **Color dominante**: #f5e6c8 (piedra) + #d4a373 (tejas) + #7ec8a0 (vegetación)
- **Sombras**: largas (ángulo 30°), dirección NW
- **Efecto**: neblina ligera al ras del suelo en calles secundarias
- **Luz focal**: la fuente tiene emisión tenue (luz cálida reflejada en el agua)
- **Farolas**: emisión anaranjada suave, radio ~4m

---

## 6. Estrategia de Navegación Visual (Sin Minimapa)

| Referencia | Qué indica al jugador |
|------------|----------------------|
| Castillo (N) | "Alí está el norte, el poder" |
| Cipreses (eje N-S) | "Camino principal, síganme" |
| Fuente (centro) | "Estás en el medio de todo" |
| Cúpula azul (NE) | "Gremio de magia" |
| Techo rojo (NW) | "Gremio de armas" |
| Toldo rayado (SE) | "Aquí se compran cosas" |
| Templete columnas (SO) | "Aquí se cambia de clase" |
| Quiosco azul (E) | "Kafra — servicios" |
| Arco verde (O) | "Salida a zona de monstruos" |

---

## 7. Efectos Visuales Clave

- **Agua de fuente**: 3 anillos de polígonos translúcidos elevándose y cayendo con animación looping
- **Partículas Kafra**: 6 destellos blancos rotando lentamente sobre el quiosco
- **Hojas cayendo**: 3-5 hojas visibles en zona de descanso (animación viento suave)
- **Polvo en camino real**: neblina tenue a ras de suelo en el eje N-S
- **Banderas**: animación de ondeo en castillo y gremios (seno simple en vertex shader o actualización por tick)

---

## 8. Checklist de Inmersión

- [ ] El jugador puede ver el castillo desde cualquier punto
- [ ] Los cipreses forman un corredor visual N-S
- [ ] La fuente es el primer thing que ve al spawnear
- [ ] Todos los servicios están a <30 pasos de la fuente
- [ ] Cada distrito tiene un COLOR dominante diferente
- [ ] Las salidas tienen marcos reconocibles (arco/puente)
- [ ] Hay sombra donde sentarse (zona de descanso)
- [ ] El suelo NO es una grilla — 4 texturas distintas (piedra, adoquín, tierra, laja)
- [ ] Edificios gremiales tienen siluetas asimétricas
