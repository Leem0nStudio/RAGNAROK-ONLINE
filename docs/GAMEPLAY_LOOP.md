# Primer Gameplay Loop — Epicearth

**Diseñador:** Lead MMORPG Game Designer
**Duración:** 45–60 minutos (jugador nuevo)
**Plataforma:** Mobile-first (WebGL)
**Estado:** Documento de diseño listo para implementación

---

## 1. Main Quest Line

### 1.0 — EPIC-01: «El Despertar del Héroe»
* **NPC:** Kafra Assistant Clarice (x: -3, z: -2)
* **Zona:** Prontera — Plaza del Alba
* **Duración:** 2–3 min
* **Descripción:** El jugador aparece en Prontera. Clarice lo saluda, explica que los monstruos están apareciendo cerca de la ciudad y que el Instructor Kurt necesita reclutas valientes.
* **Objetivos:**
  1. Hablar con Clarice (texto automático al spawn)
  2. Caminar al centro de la plaza
  3. Hablar con el Swordsman Instructor Kurt (x: 4, z: 4)
* **Recompensas:** 50 Zeny, 25 EXP base, 25 EXP job
* **Diálogo clave:** *«Los campos del este solían ser seguros, pero ahora los Porings se han vuelto agresivos. El Instructor te está esperando.»*

### 1.1 — EPIC-02: «La Primera Cacería»
* **NPC:** Swordsman Instructor Kurt (x: 4, z: 4)
* **Zona:** Prontera — Plaza del Alba → CM1 — Pradera del Alba
* **Duración:** 5–8 min
* **Descripción:** Kurt explica los controles básicos (joystick táctil / click para mover, tap para atacar). Envía al jugador a los campos del este para cazar Porings.
* **Objetivos:**
  1. Salir de Prontera por la puerta este (x: 16, z: 0)
  2. Cruzar al chunk CM1 (x: 32, z: 0)
  3. Matar 3 Porings
  4. Regresar con Kurt
* **Recompensas:** 100 Zeny, 50 EXP base, 50 EXP job, 1 Red Potion
* **Nota:** El tutorial de combate se activa al golpear al primer Poring. Explicación de auto-battle, HP bar, y loot.

### 1.2 — EPIC-03: «El Lunático Problemático»
* **NPC:** Swordsman Instructor Kurt
* **Zona:** CM1 — Pradera del Alba
* **Duración:** 5–7 min
* **Descripción:** Un granjero de los campos reporta que un Lunático especialmente grande está destruyendo las cosechas en el sector noreste de CM1.
* **Objetivos:**
  1. Volver a CM1
  2. Matar 5 Lunáticos
  3. Encontrar y matar al **Lunático Gigante** (miniboss, x: 48, z: 20)
  4. Regresar con Kurt
* **Recompensas:** 150 Zeny, 120 EXP base, 100 EXP job, Wooden Sword (si es Novice, weapon ATK +5)
* **Diálogo clave:** *«Los granjeros me dijeron que hay un Lunático del tamaño de un carnero. Si puedes con él, estarás listo para lo que viene.»*

### 1.3 — EPIC-04: «El Camino Hacia el Poder»
* **NPC:** Swordsman Instructor Kurt
* **Zona:** Prontera
* **Duración:** 5–8 min (incluye decisión de clase)
* **Descripción:** Kurt dice que el jugador ya superó las pruebas básicas. Es hora de elegir un camino. Si el jugador tiene nivel 10+, puede cambiar de job. Si no, debe subir 2 niveles más.
* **Objetivos:**
  1. Alcanzar nivel base 10
  2. Elegir job: Swordsman, Mage, Archer (o seguir como Novice)
  3. Si elige Swordsman/Mage/Archer, Kurt le da el arma inicial de la clase
* **Recompensas:** Arma inicial de clase (ATK +8~12 según clase), 200 Zeny, 80 EXP job
* **Nota:** Aquí el jugador experimenta su primer power spike. Si elige no cambiar, puede volver más tarde.

### 1.4 — EPIC-05: «La Plaga de los Écoles»
* **NPC:** Kafra Assistant Clarice
* **Zona:** Prontera
* **Duración:** 8–10 min
* **Descripción:** Clarice recibe un mensaje urgente de los guardias del este. Los Fabres y Chonchons están migrando hacia el sur y amenazan la ruta comercial hacia Prontera. El jugador debe ir a CM2 (Llanura de los Écoles).
* **Objetivos:**
  1. Ir a CM2 (x: 64, z: 0)
  2. Matar 8 Fabres
  3. Matar 5 Chonchons
  4. Investigar el origen de la plaga (un Chonchon Gigante cerca de x: 80, z: 16)
* **Recompensas:** 300 Zeny, 300 EXP base, 220 EXP job, Ring of Life (ACC, HP +25)
* **Nota:** Primera vez que el jugador enfrenta monstruos voladores (Fabre, Chonchon). La mecánica de FLEE se vuelve importante.

### 1.5 — EPIC-06: «El Molino Silenciado»
* **NPC:** Guardia en la entrada de CM3 (x: 2, z: 32)
* **Zona:** CM3 — Laderas del Molino
* **Duración:** 10–15 min
* **Descripción:** El molino de viento de CM3 ha dejado de funcionar. Los molineros desaparecieron. El guardia pide al jugador que investigue.
* **Objetivos:**
  1. Explorar el molino (x: 12, z: 40)
  2. Encontrar al molinero herido
  3. Matar 6 Savage Babies que acampan en la colina
  4. Matar 4 Pickies que robaron el grano
  5. Enfrentar a la **Mandrágora Gigante ★** (boss, x: 16, z: 48)
* **Recompensas:** 500 Zeny, 800 EXP base, 600 EXP job, Leather Armor (DEF +8), Molinero's Blessing (consumible, restaura 100% HP una vez)
* **Diálogo clave (molinero):** *«Una planta monstruosa creció de la nada en el claro del norte. Sus raíces rompieron el mecanismo del molino. Sus vines... se llevaron a mis ayudantes.»*

### 1.6 — EPIC-07: «El Velo del Este»
* **NPC:** Kafra Assistant Clarice
* **Zona:** Prontera
* **Duración:** 8–10 min
* **Descripción:** Con el molino recuperado, Clarice revela que el Camino del Este (Camino del Este, x: 96, z: 0) está siendo tomado por monstruos del bosque. Es la ruta hacia la siguiente región del juego.
* **Objetivos:**
  1. Llegar al Camino del Este (cx=3, cz=0)
  2. Matar 5 Pickies (variante del bosque)
  3. Matar 3 PecoPecos
  4. Despejar el camino hasta el final de la zona (x: 124, z: 0)
  5. Activar el portal de retorno
* **Recompensas:** 400 Zeny, 500 EXP base, 400 EXP job, Wing Boots (ACC, SPD +3%)
* **Nota:** Cierra el arco narrativo de la región de Prontera. El portal activado es un gancho para la siguiente región (Foresta Umbría, no implementada). El jugador siente que completó algo importante.

---

## 2. Side Quests

### 2.1 — Prontera (Ciudad)

| ID | Nombre | NPC | Objetivo | Recompensa | Zona |
|----|--------|-----|----------|------------|------|
| SQ-01 | «El Gremio Necesita Madera» | Kurt | Recolectar 8 Jellopy (drop de Poring) | 80 Zeny, 45 EXP | CM1 |
| SQ-02 | «El Gato de Clarice» | Clarice | Encontrar al gato perdido en CM1 (x: 42, z: 14) | 60 Zeny, 30 EXP, Cat's Whisker (ACC) | CM1 |
| SQ-03 | «Entregas al Molino» | Mensajero (x: -6, z: 4) | Llevar paquete al molinero en CM3 | 120 Zeny, 100 EXP | CM3 |
| SQ-04 | «Flores para la Plaza» | Jardinero (x: 4, z: -6) | Recolectar 5 Sticky Mucus (Fabre) + 5 Flores | 100 Zeny, 80 EXP | CM2 |
| SQ-05 | «Primeros Auxilios» | Clarice | Llevar 3 Red Potions al guardia de la entrada de CM3 | 80 Zeny, 60 EXP | CM3 |
| SQ-06 | «Marcas de Cacería» | Kurt | Matar 15 Porings total (acumulativo) | 200 Zeny, 150 EXP, accesorio Poring Ear | CM1 |

### 2.2 — Campo Abierto

| ID | Nombre | NPC | Objetivo | Recompensa | Zona |
|----|--------|-----|----------|------------|------|
| SQ-07 | «El Guardián del Molino» | Molinero (CM3) | Proteger el molino por 3 minutos (ola de Savage Babies) | 250 Zeny, 300 EXP, Flour Sack (consumible) | CM3 |
| SQ-08 | «Plumas de Chonchon» | Artesano (x: -10, z: 6) | Recolectar 8 Chonchon Wings | 150 Zeny, 120 EXP | CM2 |
| SQ-09 | «Receta Secreta» | Cocinero (x: 8, z: -10) | Traer 3 Picky Eggs (drop raro de Picky) | 200 Zeny, 180 EXP, Apple of the Sun (ACC) | Camino del Este |
| SQ-10 | «El Huevo Perdido» | Granjero (x: 6, z: -8) | Encontrar un huevo de PecoPeco en el Camino del Este | 130 Zeny, 90 EXP | Camino del Este |
| SQ-11 | «Herbolaria» | Curandera (x: -10, z: -6) | Recolectar 10 hierbas verdes (drop de vegetación en CM1-CM2) | 90 Zeny, 70 EXP | CM1 / CM2 |

### 2.3 — Mazmorra

| ID | Nombre | NPC | Objetivo | Recompensa | Zona |
|----|--------|-----|----------|------------|------|
| SQ-12 | «El Primer Paso» | Guardia de Mazmorra (x: 0, z: -28) | Entrar a la Mazmorra de Entrenamiento y llegar al final | 350 Zeny, 400 EXP, Training Amulet (ACC, DEF +3) | Mazmorra |
| SQ-13 | «Luz en la Oscuridad» | Guardia de Mazmorra | Activar 3 antorchas en la Mazmorra | 200 Zeny, 250 EXP | Mazmorra |
| SQ-14 | «Ecos del Pasado» | Guardia de Mazmorra | Leer 2 inscripciones en las paredes de la Mazmorra | 150 Zeny, 180 EXP | Mazmorra |
| SQ-15 | «Depuración Total» | Guardia de Mazmorra | Matar 15 monstruos dentro de la Mazmorra | 400 Zeny, 500 EXP, Mazmorra Cleared (medal) | Mazmorra |

### 2.4 — Landmarks (Discovery)

| ID | Nombre | Ubicación | Descubrimiento | Recompensa |
|----|--------|-----------|----------------|------------|
| D-01 | «La Fuente de Prontera» | (0, 6) en Prontera | Acercarse a la fuente | 25 EXP |
| D-02 | «El Castillo» | (0, -12) en Prontera | Llegar a la puerta del castillo | 25 EXP |
| D-03 | «El Árbol Centinela» | (20, 10) en CM1 | Llegar al gran árbol | 35 EXP |
| D-04 | «Las Ruinas Antiguas» | (48, 8) en CM2 | Encontrar las ruinas de piedra | 45 EXP |
| D-05 | «El Molino» | (12, 40) en CM3 | Llegar al molino restaurado | 50 EXP |
| D-06 | «El Mirador del Este» | (120, 12) en Camino del Este | Llegar al final del camino | 60 EXP |
| D-07 | «El Altar Subterráneo» | (16, -56) en Mazmorra | Encontrar el altar en la mazmorra | 75 EXP |

---

## 3. Economía Inicial

### 3.1 — Recompensas de Zeny por nivel

| Nivel del monstruo | Zeny base | Zeny bonus (raro) |
|--------------------|-----------|-------------------|
| 1-3 (Poring, Lunático) | 2–5 Zeny | 8–12 Zeny |
| 4-7 (Fabre, Chonchon) | 5–10 Zeny | 15–25 Zeny |
| 6-10 (Savage, Picky) | 8–15 Zeny | 20–35 Zeny |
| Boss (Mandrágora) | 50–80 Zeny | — |
| Boss (MVP) | 200–500 Zeny | — |

### 3.2 — Precios de Pociones

| Ítem | Precio | Efecto |
|------|--------|--------|
| Red Potion | 50 Zeny | Restaura 25% HP |
| Orange Potion | 150 Zeny | Restaura 45% HP |
| Yellow Potion | 400 Zeny | Restaura 65% HP |
| Blue Potion | 200 Zeny | Restaura 30% SP |
| White Potion | 800 Zeny | Restaura 100% HP |

### 3.3 — Precios de Equipamiento (NPC Kafra)

| Ítem | Precio | Tipo | Stats |
|------|--------|------|-------|
| Wooden Sword | 200 Zeny | Arma Novice | ATK +5 |
| Sword | 500 Zeny | Arma Swordsman | ATK +15 |
| Staff | 500 Zeny | Arma Mage | ATK +8, MATK +12 |
| Short Bow | 500 Zeny | Arma Archer | ATK +10 |
| Cotton Shirt | 300 Zeny | Armadura | DEF +3 |
| Leather Armor | 800 Zeny | Armadura | DEF +8 |
| Copper Armor | 1,500 Zeny | Armadura | DEF +14 |
| Ring of Life | 400 Zeny | Accesorio | HP +25 |
| Feather Brooch | 600 Zeny | Accesorio | SPD +2% |
| Cat's Whisker | 250 Zeny | Accesorio | FLEE +3 |
| Apple of the Sun | 500 Zeny | Accesorio | ATK +3 |

### 3.4 — Curva Económica Inicial (primeros 60 min)

| Hito | Zeny acumulado | Gasto típico | Ratio ahorro |
|------|---------------|--------------|:------------:|
| Inicio | 0 Zeny | — | — |
| EPIC-01 | 50 Zeny | — | 100% |
| EPIC-02 | 150 Zeny | 1 Red Potion (50) | 66% |
| EPIC-03 | 300 Zeny | 2 Red Potions (100) | 66% |
| EPIC-04 (job) | 500 Zeny | Arma (200-500) | 0-60% |
| EPIC-05 | 800 Zeny | 3 Red Potions (150) | 80% |
| EPIC-06 (boss) | 1,300 Zeny | 3 Orange Potions (450) | 65% |
| EPIC-07 | 1,700 Zeny | Armor upgrade (800) | 52% |

**Nota:** El ratio de ahorro se mantiene positivo. El jugador nunca se queda sin Zeny si juega normalmente. La economía está diseñada para que el jugador pueda comprar 1-2 pociones entre misiones sin farmear.

---

## 4. Loot Tables

### 4.1 — Poring (nvl 1-3)

| Ítem | Tipo | Probabilidad | Cantidad |
|------|------|:------------:|:--------:|
| Jellopy | Material | 65% | 1–2 |
| Sticky Mucus | Material | 25% | 1 |
| Red Potion | Consumible | 8% | 1 |
| Poring Ear | Accesorio (raro) | 1.5% | 1 |
| Poring Card | Carta (ultra-raro) | 0.5% | 1 |

### 4.2 — Lunatic (nvl 1-3)

| Ítem | Tipo | Probabilidad | Cantidad |
|------|------|:------------:|:--------:|
| Fur | Material | 60% | 1 |
| Claw | Material | 30% | 1 |
| Orange Potion | Consumible | 8% | 1 |
| Lunatic Tail | Accesorio (raro) | 1.5% | 1 |
| Lunatic Card | Carta (ultra-raro) | 0.5% | 1 |

### 4.3 — Fabre (nvl 4-7)

| Ítem | Tipo | Probabilidad | Cantidad |
|------|------|:------------:|:--------:|
| Sticky Mucus | Material | 55% | 1–2 |
| Fabre Wing | Material | 30% | 1 |
| Green Herb | Material | 10% | 1 |
| Blue Potion | Consumible | 4% | 1 |
| Fabre Card | Carta (ultra-raro) | 0.5% | 1 |

### 4.4 — Chonchon (nvl 4-7)

| Ítem | Tipo | Probabilidad | Cantidad |
|------|------|:------------:|:--------:|
| Chonchon Wing | Material | 50% | 1 |
| Feeler | Material | 35% | 1 |
| Yellow Potion | Consumible | 8% | 1 |
| Chonchon Ear | Accesorio (raro) | 1.5% | 1 |
| Chonchon Card | Carta (ultra-raro) | 0.5% | 1 |

### 4.5 — Picky (nvl 6-9)

| Ítem | Tipo | Probabilidad | Cantidad |
|------|------|:------------:|:--------:|
| Feather | Material | 60% | 1–2 |
| Picky Egg | Material (raro) | 12% | 1 |
| Orange Potion | Consumible | 15% | 1 |
| Picky Beak | Accesorio (raro) | 2% | 1 |
| Picky Card | Carta (ultra-raro) | 0.5% | 1 |

### 4.6 — PecoPeco (nvl 7-9)

| Ítem | Tipo | Probabilidad | Cantidad |
|------|------|:------------:|:--------:|
| Feather | Material | 55% | 2–3 |
| PecoPeco Egg | Material | 20% | 1 |
| Yellow Potion | Consumible | 12% | 1 |
| PecoPeco Feather Hat | Armadura (rara) | 2% | 1 |
| PecoPeco Card | Carta (ultra-raro) | 0.5% | 1 |

### 4.7 — Savage Baby (nvl 6-10)

| Ítem | Tipo | Probabilidad | Cantidad |
|------|------|:------------:|:--------:|
| Savage Tooth | Material | 55% | 1 |
| Leather | Material | 30% | 1 |
| Orange Potion | Consumible | 10% | 1 |
| Savage Baby Tail | Accesorio (raro) | 2% | 1 |
| Savage Baby Card | Carta (ultra-raro) | 0.5% | 1 |

### 4.8 — Mandrágora Gigante (boss, nvl 8)

| Ítem | Tipo | Probabilidad | Cantidad |
|------|------|:------------:|:--------:|
| Mandragora Root | Material (boss) | 100% | 1 |
| Mandragora Seed | Material (boss) | 60% | 1–2 |
| Mandragora Flower | Material (raro boss) | 35% | 1 |
| Green Potion (full heal) | Consumible | 25% | 1 |
| Mandragora Crown | Armadura (rara boss) | 10% | 1 |
| Mandragora Card | Carta (ultra-raro boss) | 2% | 1 |

---

## 5. Equipamiento Inicial

### 5.1 — Armas (nivel 1-10)

| Arma | Nvl req | Clase | ATK | MATK | Precio | Drop de |
|------|:-------:|:-----:|:---:|:----:|:------:|:--------|
| Training Sword | 1 | Novice | +5 | — | gratis (EPIC-03) | — |
| Wooden Sword | 1 | Novice | +5 | — | 200 Zeny | — |
| Sword | 10 | Swordsman | +15 | — | 500 Zeny | — |
| Broad Sword | 15 | Swordsman | +22 | — | 1,200 Zeny | — |
| Staff | 10 | Mage | +8 | +12 | 500 Zeny | — |
| Arc Wand | 15 | Mage | +10 | +20 | 1,200 Zeny | — |
| Short Bow | 10 | Archer | +10 | — | 500 Zeny | — |
| Long Bow | 15 | Archer | +18 | — | 1,200 Zeny | — |
| Dagger | 10 | Thief | +12 | — | 500 Zeny | Fase 2 |
| Mace | 10 | Acolyte | +10 | +5 | 500 Zeny | Fase 2 |

### 5.2 — Armaduras (nivel 1-10)

| Armadura | Nvl req | DEF | Efecto adicional | Precio | Drop de |
|----------|:-------:|:---:|:----------------:|:------:|:--------|
| Cotton Shirt | 1 | +3 | — | 300 Zeny | — |
| Leather Armor | 10 | +8 | — | 800 Zeny | EPIC-06 |
| Copper Armor | 15 | +14 | — | 1,500 Zeny | — |
| Forest Robe | 10 | +5 | MDEF +5 | 700 Zeny | — |
| Traveler's Hood | 1 | +2 | — | 100 Zeny | — |
| Leather Boots | 5 | +1 | SPD +2% | 200 Zeny | — |
| Wool Scarf | 10 | +2 | MDEF +3 | 300 Zeny | — |

### 5.3 — Accesorios (nivel 1-10)

| Accesorio | Nvl req | Efecto | Drop de |
|-----------|:-------:|:------:|:--------|
| Ring of Life | 5 | HP +25 | Comerciante (200 Zeny) |
| Cat's Whisker | 1 | FLEE +3 | SQ-02 |
| Poring Ear | 1 | LUK +1 | Poring (1.5%) |
| Feather Brooch | 10 | SPD +2% | Comerciante (600 Zeny) |
| Apple of the Sun | 10 | ATK +3 | SQ-09 |
| Chonchon Ear | 5 | INT +1 | Chonchon (1.5%) |
| Savage Baby Tail | 10 | STR +1 | Savage Baby (2%) |
| Picky Beak | 8 | DEX +1 | Picky (2%) |
| PecoPeco Feather Hat | 10 | AGI +1 | PecoPeco (2%) |
| Mandragora Crown | 12 | MaxHP +50 | Mandrágora (10%) |
| Training Amulet | 1 | DEF +3 | SQ-12 |

### 5.4 — Progresión de equipamiento por nivel

| Nivel | Arma recomendada | Armadura recomendada | Accesorio |
|:-----:|:-----------------:|:--------------------:|:----------|
| 1–4 | Training Sword | Cotton Shirt | Cat's Whisker |
| 5–9 | Training Sword | Cotton Shirt + Boots | Ring of Life |
| 10–14 | Sword / Staff / Short Bow | Leather Armor | Ring of Life + Brooch |
| 15+ | Broad Sword / Arc Wand / Long Bow | Copper Armor | Crown + Brooch |

---

## 6. Progresión

### 6.1 — Niveles recomendados por zona

| Zona | Nivel mínimo | Nivel recomendado | Nivel máximo útil |
|------|:------------:|:-----------------:|:-----------------:|
| Prontera | 1 | 1 | 5 |
| CM1 — Pradera del Alba | 1 | 1–3 | 8 |
| CM2 — Llanura de los Écoles | 3 | 4–7 | 12 |
| CM3 — Laderas del Molino | 5 | 6–10 | 15 |
| Camino del Este | 7 | 7–9 | 15 |
| Mazmorra de Entrenamiento | 5 | 5–10 | 15 |

### 6.2 — Experiencia obtenida

| Monstruo | EXP base | EXP job | Zeny | Golpes para matar (nvl rec) |
|----------|:--------:|:-------:|:----:|:---------------------------:|
| Poring | 12 | 10 | 2–5 | 2–3 |
| Lunático | 8 | 6 | 2–4 | 2 |
| Fabre | 28 | 22 | 5–10 | 3–4 |
| Chonchon | 32 | 25 | 5–10 | 3–4 |
| Picky | 55 | 42 | 8–15 | 4–5 |
| PecoPeco | 90 | 75 | 10–18 | 5–7 |
| Savage Baby | 75 | 60 | 8–15 | 4–6 |
| Mandrágora ★ | 400 | 320 | 50–80 | ~20 |

### 6.3 — Curva de nivel (jugador Novice, primeros 60 min)

| Hito | Nivel base | EXP total acumulada | Monstruos matados (aprox) |
|:------:|:----------:|:-------------------:|:-------------------------:|
| Inicio | 1 | 0 | 0 |
| EPIC-01 | 1→2 | 25 | 0 |
| EPIC-02 | 2→3 | 200 | 10 |
| EPIC-03 | 3→5 | 600 | 25 |
| Side quests (3–4) | 5→8 | 1,800 | 50 |
| EPIC-04 (job) | 8→10 | 2,800 | 70 |
| EPIC-05 | 10→12 | 4,500 | 100 |
| EPIC-06 (boss) | 12→14 | 7,000 | 140 |
| EPIC-07 | 14→15 | 9,500 | 170 |

**EXP requerida por nivel (Novice):**

| Nivel | EXP requerida | Acumulada |
|:-----:|:-------------:|:----------:|
| 1→2 | 30 | 30 |
| 2→3 | 60 | 90 |
| 3→4 | 110 | 200 |
| 4→5 | 180 | 380 |
| 5→6 | 280 | 660 |
| 6→7 | 400 | 1,060 |
| 7→8 | 550 | 1,610 |
| 8→9 | 750 | 2,360 |
| 9→10 | 1,000 | 3,360 |
| 10→11 | 1,300 | 4,660 |
| 11→12 | 1,700 | 6,360 |
| 12→13 | 2,200 | 8,560 |
| 13→14 | 2,800 | 11,360 |
| 14→15 | 3,500 | 14,860 |

### 6.4 — Momentos de Power Spike

| Hito | Spike | Qué cambia |
|:----:|:-----:|:-----------|
| Nivel 5 | ⚡ Menor | Ring of Life disponible (HP +25). El jugador nota que ya no muere en 3 golpes. |
| Job Change (lvl 10) | ⚡⚡ Mayor | ATK pasa de +5 a +15. Nuevas skills desbloqueadas. El daño se duplica. |
| EPIC-06 (lvl 12) | ⚡ Medio | Leather Armor (+8 DEF). Mandrágora Crown (+50 HP). El boss fight requiere estrategia. |
| Nivel 15 | ⚡⚡ Mayor | Arma tier 2 (ATK +18~22). Armadura Copper (+14 DEF). El jugador está listo para la siguiente región. |

### 6.5 — Momento ideal para cambio de job

| Clase | Nivel mínimo | Nivel ideal | Por qué |
|:-----:|:------------:|:-----------:|:--------|
| Swordsman | 10 | 10 | Gana Sword (+15 ATK) y provoca un spike de daño inmediato para CM2-CM3 |
| Mage | 10 | 10 | Gana Staff (+12 MATK) y habilidades mágicas. El boss del molino es más fácil con magia |
| Archer | 10 | 12 | Gana Short Bow (+10 ATK) y rango. Recomendado esperar a nivel 12 para maximizar DPS sostenido |
| Thief / Acolyte | 10 | 10+ | (Fase 2) |

**Regla general:** Si el jugador llega a nivel 10 durante EPIC-04 (después de CM1), debe cambiar de job inmediatamente. Si llega después (por hacer side quests), igual — es el momento óptimo.

---

## 7. Retención

### 7.1 — Objetivos visibles permanentes

| Objetivo | Visibilidad | Dónde se muestra |
|:---------|:------------|:-----------------|
| Main Quest activa | Siempre | HUD: texto "Main Quest: [nombre]" |
| Side Quest activa | Siempre | HUD: icono ! sobre NPC con quest pendiente |
| Siguiente zona | Siempre | Minimapa: áreas grises + texto "¿?" |
| Siguiente nivel | Siembre | Barra de EXP: número + texto "+X% hasta next" |
| Siguiente skill | Al abrir skills | Skill tree: skill bloqueada + nivel req |
| Siguiente equipo | Al abrir inventario | Item equipable: texto rojo "Nvl req: X" |
| Landmarks por descubrir | Al entrar a zona nueva | Notificación "Has descubierto [zona]. Hay [N] lugares por explorar." |

### 7.2 — Ganchos de progresión

| Momento | Gancho | Qué promete |
|:--------|:-------|:------------|
| Inicio del juego | «El Camino del Héroe» | La barra de main quest visible guía al jugador |
| Después de EPIC-01 | «La Primera Cacería» | Primer objetivo claro y alcanzable (3 Porings) |
| Al matar primer Poring | Notificación de EXP | "Ganas 12 EXP. Faltan X para nivel 2." Siempre visible. |
| Al llegar a nivel 5 | Notificación de equipamiento | "Nuevo equipo disponible en la tienda." |
| Al llegar a nivel 8 | Notificación de job | "¡Ya puedes cambiar de job! Habla con Kurt." |
| Después de job change | Notificación de skills | "¡Nuevas skills desbloqueadas!" Skill tree visible. |
| Al entrar a CM2 | Notificación de zona | Zonas bloqueadas visibles en minimapa. |
| Después de EPIC-06 | Logro + recompensa | "¡Primer Boss Derrotado!" + título desbloqueable. |
| Al completar EPIC-07 | Cinemática de portal | El portal se activa. Texto: "La siguiente aventura te espera..." |

### 7.3 — Sistema de Logros (primera oleada)

| Logro | Condición | Recompensa |
|:------|:----------|:-----------|
| «Primeros Pasos» | Completar EPIC-01 | 50 Zeny |
| «Cazador de Porings» | Matar 15 Porings | Poring Ear Hat (skin) |
| «Cambio de Rumbo» | Primer job change | 100 Zeny |
| «El Molino Está a Salvo» | Completar EPIC-06 | Título: «Salvador del Molino» |
| «Explorador» | Descubrir 5 landmarks | 200 Zeny |
| «Completista» | Completar 5 side quests | 300 Zeny |
| «Aprendiz de Héroe» | Alcanzar nivel 10 | 100 Zeny |
| «Guerrero» | Alcanzar nivel 15 | 200 Zeny, Copper Armor |

### 7.4 — Principios de retención

1. **Regla de los 3 segundos:** Siempre hay algo que hacer a 3 segundos de distancia (monstruo visible, NPC con quest, landmark por descubrir).
2. **Regla del próximo nivel:** La EXP para el próximo nivel siempre está a la vista. El jugador sabe cuántos monstruos más necesita matar.
3. **Regla del botín:** Cada monstruo deja algo (Zeny o ítem). Nunca hay muertes «vacías».
4. **Regla del gancho narrativo:** Cada misión termina con una razón para hacer la siguiente (NPC que menciona un problema, zona que se abre, item que habilita algo).
5. **Regla de la variedad:** El jugador nunca hace lo mismo más de 10 minutos seguidos. Alternar entre: combatir → explorar → hablar con NPCs → gestionar inventario.
6. **Regla del respiro:** Después de un boss fight o misión intensa, la siguiente misión es más tranquila (exploración, diálogo, entrega de ítems).

---

## Estado de Implementación

### ✅ Completado — MVP jugable

| # | Item | Estado | Componentes |
|:-:|:-----|:------:|:------------|
| 1 | Sistema de Quests | ✅ | `lib/game/state.ts` (acceptQuest, updateQuestProgress, completeQuest), `lib/game/quests.ts` (22 quests), `lib/game/types.ts` (QuestDefinition, QuestObjective, QuestState), `app/page.tsx` (quest HUD tracker), `lib/game/engine.ts` (NPC dialogue, kill tracking) |
| 2 | Main Quest EPIC-01 a EPIC-07 | ✅ | Siete épicas encadenadas: Despertar → Cacería → Lunático → Poder → Plaga → Molino → Velo |
| 3 | Zeny como recurso + compras | ✅ | `lib/game/state.ts` (zeny, addZeny, buyShopItem), `lib/game/shop.ts` (17 items), `components/RagnarokMenu.tsx` (tienda en menú) |
| 4 | Loot tables | ✅ | `lib/game/lootTables.ts` (8 tablas: Poring, Lunatic, Fabre, Chonchon, Picky, PecoPeco, Savage Baby, Mandrágora) |
| 5 | Side Quests SQ-01 a SQ-15 | ✅ | Quince secundarias: CM1 (6), CM2-3 (3), Camino Este (2), Mazmorra (4) |
| 6 | Curva de EXP | ✅ | `lib/game/state.ts` (addExp, curve de nivel), `lib/game/engine.ts` (MONSTER_STATS con EXP por tipo) |
| 7 | Equipamiento en tienda | ✅ | 9 armas, 5 armaduras, 5 accesorios, 3 headgears en shop |
| 8 | Landmarks discovery | ✅ | `lib/game/quests.ts` (7 landmarks), `lib/game/state.ts` (discoverLandmark), `lib/game/engine.ts` (proximity check) |
| 9 | Sistema de Logros | ✅ | `lib/game/achievements.ts` (8 logros), `lib/game/state.ts` (checkAchievements, recompensas) |
| 10 | Títulos desbloqueables | ✅ | 3 títulos (Salvador del Molino, Aprendiz de Héroe, Guerrero) mostrados en HUD |
| 11 | Notificaciones de progreso | ✅ | Combat log + quest tracker HUD en `app/page.tsx` |
| 12 | HUD de main quest activa | ✅ | Barra superior con quest activa, objetivos y progreso |

### 🚧 Pendiente

| # | Item | Notas |
|:-:|:-----|:------|
| 13 | Collect objective trigger | Hook en engine al recoger loot del suelo |
| 14 | Explore objective trigger | Verificación de proximidad a coordenada al moverse |
| 15 | Survive objective (wave timer) | Mecánica de oleadas temporizadas para SQ-07 |
| 16 | Quest markers en minimapa | Renderizar waypoints en `components/Minimap.tsx` |
| 17 | Quest detail en RagnarokMenu | Pestaña de quest activa con progreso detallado |

---

**Fin del documento.**
