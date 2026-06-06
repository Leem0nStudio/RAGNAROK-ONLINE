# Arquitectura de Diseño de Mapas (Inspirado en Ragnarok Online)

Este documento describe la nueva arquitectura conceptual y los principios fundamentales de diseño para los mapas tridimensionales de nuestro sandbox. Inspirado fuertemente en el estilo clásico de los mapas de campo (*fields*) de Ragnarok Online (como *prt_fild* o *pay_fild*), este sistema prioriza la inmersión por encima del azar algorítmico pura, logrando un entorno artesanal que se siente vivo y orgánico.

---

## 1. Estructura del Mapa y Filosofía "Teatral" *(Stage-Craft)*

La estructura del escenario utiliza una filosofía de **teatro tridimensional**. Al igual que en Ragnarok Online, la cámara mantiene una perspectiva fija o isométrica/semiaérea que podemos aprovechar estratégicamente para controlar lo que el jugador ve.

- **El "Vacío Escondido":** Para garantizar que el jugador **nunca vea el vacío** ni los bordes del plano de renderizado, el mapa utiliza un sistema de capas concéntricas con elevación ascendente.
- **Plano de Terreno Sobredimensionado:** Aunque el área de juego jugable está limitada a un radio de $48$ metros, el plano del terreno real se extiende dinámicamente hasta un radio de $100$ metros. De esta forma, el horizonte visual siempre queda cubierto por geografía o vegetación lejana.
- **Planimetría No Linear:** En lugar de una cuadrícula monótona, el mapa se diseña usando curvas sinusoidales y ruido de baja frecuencia para simular valles y elevaciones naturales.

---

## 2. Jerarquía de Zonas y Puntos de Interés (PoI)

El mapa se estructura como una **red jerárquica de sub-zonas interconectadas**, guiando de forma orgánica el flujo de tráfico táctico y los desafíos de nivel.

```
                                [ ZONA ESCARPADA (Norte) ]
                                            ^
                                            |
   [ RUINAS MONOLÍTICAS (Oeste) ] <--- [ PLAZA CENTRAL ] ---> [ BOSQUETE DE HIERBA (Este) ]
                                            |
                                            v
                               [ POZO VOLCÁNICO (Sur) ]
```

### A. La Plaza Central (Zona Segura / Safe-Zone)
- **Concepto:** Una pequeña fortaleza circular pavimentada en piedra lisa ubicada en el origen $(0, 0)$.
- **Función:** Alberga portales de teletransporte, el cristal de sanación y la presencia de NPCs mercaderes.
- **IA Behavior:** Los monstruos agresivos tienen vetado el paso físico a esta zona; el `worldRuntime` calcula automáticamente un vector de rechazo cuando un mob intenta invadir el perímetro pavimentado.

### B. El Camino Principal (Navegación Intuitiva)
- **Concepto:** Una calzada empedrada serpenteante que cruza las sub-zonas y sirve de guía visual primaria para el jugador.
- **Función:** Ofrece un tránsito limpio de colisiones. El jugador que siga el camino puede desplazarse rápidamente sabiendo que la densidad de monstruos hostiles y props es nula en esta franja.

### C. Áreas Secundarias de Exploración y Spawns Tácticos
- **Norte (La Franja Montañosa):** Zona escarpada con riscos. Concentra spawns de criaturas ágiles y de larga distancia.
- **Este (El Bosquete Silencioso):** Densidad arbórea y arbustiva muy alta. Ideal para recolectar recursos flotantes o para el farmeo de monstruos dóciles de experiencia media.
- **Oeste (Las Ruinas Monolíticas):** Bloques de piedra colosales caídos, postes rúnicos y ruinas antiguas. El terreno es laberíntico, ofreciendo cobertura al jugador para esquivar ataques directos.
- **Sur (El Plateau Cenizo / Pozo de Baphomet):** El suelo cambia a un color volcánico oscuro. Es el área de influencia del Boss MVP (*Baphomet*), rodeado de sus esbirros hostiles.

---

## 3. Hermetismo y Límites Naturales (Adiós a los Muros Invisibles)

En lugar de delegar el confinamiento del usuario en barreras físicas artificiales e invisibles, el mapa se cierra a sí mismo utilizando **capas de colisión visualmente justificadas**:

1. **La Cordillera Perimetral (Primer Bloqueo Terrestre):**
   - El terreno incrementa exponencialmente su pendiente vertical a partir del radio de $45$ metros, usando la fórmula matemática del terreno deformado.
   - Las montañas escarpadas resultantes son físicamente impracticables gracias a los ángulos de inclinación del terreno y a los colisionadores de base.
2. **La Barrera Forestal (Segundo Bloqueo):**
   - Árboles colosales de tronco grueso colisionable, agrupados densamente sobre el pie de monte en los bordes exteriores.
   - Estos árboles obstruyen las vistas y bloquean la cámara, camuflando la lejanía.
3. **Pilas de Rocas y Monolitos de Contención:**
   - En las aberturas lógicas de las lomas de montaña donde el jugador pudiera sentir la tentación de escalar, se posicionan de forma preestablecida rocas y restos arqueológicos insalvables (`getRockObstacles`).

---

## 4. Escalas del Mundo y Proporciones

Para preservar la legibilidad clásica tipo "SD/Chibi" que caracteriza a Ragnarok Online, definimos las siguientes correlaciones de proporción y velocidad de simulación:

- **La Escala Métrica:** $1.0$ unidad en Three.js equivale exactamente a $1.0$ metro en el mundo de juego.
- **El Jugador:** Posee una altura de cápsula física aproximada de $1.2$ metros de alto por $0.65$ de radio.
- **Los Monstruos Comunales (Poring, Poporing):** Tienen un diámetro de aproximadamente $0.8$ metros, permitiendo que se desplacen limpiamente por pasajes estrechos.
- **El Boss MVP (Baphomet):** Escala multiplicada por $2.5$ ($3.0$ metros de alto), imponiendo un respeto visual inmediato nada más asomar en pantalla.
- **Velocidad de Movimiento:**
  - Jugador: $5.5$ a $8.0$ metros/segundo (escalable mediante la estadística de Agilidad/velocidad de movimiento).
  - Monstruos: $2.5$ a $4.8$ metros/segundo.

---

## 5. Densidad y Distribución de Elementos Decorativos

La colocación sistemática de vegetación estática evita el cansancio visual distribuyendo la densidad de forma asimétrica, simulando microclimas:

| Tipo de Prop | Densidad por área jugable | Propósito en el Escenario |
| :--- | :--- | :--- |
| **Árboles (Katar Trees)** | Alta en bordes, nula en caminos y centro. | Delimitar el mapa, crear sombras tridimensionales y bloquear la visibilidad del vacío de fondo. |
| **Piedras y Rocas** | Alta en el perímetro y norte rústico. | Servir de obstáculos deterministas que el jugador debe sortear en sus clicks tácticos. |
| **Barriles y Cajas** | Concentrados en la Plaza Central y ruinas. | Aportar atmósfera de puesto de avanzada o ruinas saqueadas. |
| **Arbustos y Flores** | Media uniforme (aleatoria determinista). | Romper la linealidad cromática del plano horizontal de tierra. |
