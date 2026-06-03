# Guía Maestra de Interfaz de Usuario (UI) - Epicearth

## 1. Filosofía Visual

La interfaz de usuario de Epicearth se adhiere a los siguientes principios:

- **Inmersiva y no intrusiva**: La UI debe complementar el mundo del juego, no competir con él. Los elementos se mantienen en la periferia de la pantalla para maximizar el área de juego visible. El diseño es limpio y se integra con la estética de fantasía del juego.
- **Clara y consistente**: La información se presenta de forma clara y predecible. Todos los componentes de la UI comparten un lenguaje visual unificado, lo que garantiza que los jugadores puedan entender rápidamente el estado del juego.
- **Funcional y accesible**: Cada elemento de la UI tiene un propósito claro. El diseño es intuitivo y fácil de usar en dispositivos móviles, con controles táctiles grandes y legibles.

## 2. Sistema de Colores

La paleta de colores se basa en tonos tierra, pergamino y acentos vibrantes para la información del estado del juego. Los colores se definen como variables CSS en `app/globals.css` y se exportan desde `ui/theme.ts`.

### Paleta Principal
- `parchment`: Color de fondo principal para las ventanas y paneles.
- `brown`, `darkBrown`: Tonos para bordes, acentos y fondos secundarios.
- `gold`: Para elementos importantes, botones y recompensas.
- `textPrimary`, `textSecondary`, `textMuted`: Colores de texto para diferentes niveles de énfasis.

### Colores de Estado
- `hp`: Rojo para la barra de vida.
- `sp`: Azul para la barra de maná.
- `expPurple`: Morado para la barra de experiencia.
- `accentRed`: Para modo de combate y errores.
- `accentGreen`: Para acciones positivas y curación.
- `accentAmber`: Para advertencias y estados de aturdimiento.
- `accentIndigo`: Para la canalización de habilidades.

### Rarity Colors
- `rarityCommon`: Gris
- `rarityUncommon`: Verde
- `rarityRare`: Azul
- `rarityEpic`: Púrpura
- `rarityLegendary`: Naranja

## 3. Sistema de Espaciado

Se utiliza un sistema de espaciado consistente basado en una escala de 4px para mantener una alineación y un ritmo visual coherentes. Las claves de espaciado se definen en `ui/theme.ts`.

- `xs`: 4px
- `sm`: 8px
- `md`: 12px
- `lg`: 16px
- `xl`: 24px
- `2xl`: 32px
- `3xl`: 48px

## 4. Sistema de Tipografía

El juego utiliza tres fuentes principales para diferentes propósitos, definidas en `app/layout.tsx`:

- **`Inter` (Sans-serif)**: La fuente principal para todo el texto de la UI, elegida por su legibilidad. Variable: `--font-sans`.
- **`Space Grotesk` (Display)**: Para títulos, encabezados y elementos destacados que requieren un aspecto más estilizado. Variable: `--font-display`.
- **`JetBrains Mono` (Monoespaciada)**: Utilizada en la bitácora de combate y para mostrar números o información densa, garantizando una alineación clara. Variable: `--font-mono`.

Los tamaños de fuente están estandarizados en `ui/theme.ts`:
- `title`: 18px
- `name`: 16px
- `normal`: 14px
- `secondary`: 12px

## 5. Sistema de Iconografía

Utilizamos la librería `lucide-react` para todos los iconos del juego. Esto proporciona un conjunto de iconos limpio, consistente y ligero.

- **Consistencia**: Siempre que sea posible, se deben utilizar los iconos de Lucide para mantener un estilo visual unificado.
- **Claridad**: Los iconos deben ser fácilmente reconocibles y comunicar su función de forma inequívoca.
- **Implementación**: Importar los iconos necesarios directamente desde `lucide-react`.

## 6. Sistema de Ventanas

El sistema de ventanas está gestionado por el `windowManager` (`lib/game/windowManager.ts`), un store de Zustand que controla qué ventanas están abiertas, minimizadas y su orden de apilamiento (z-index).

- **Estado Global**: `useWindowManager` gestiona el estado de las ventanas.
- **Acciones**: `open()`, `close()`, `toggle()`, `minimize()` y `focus()` son las acciones para interactuar con las ventanas.
- **Capas**: Las ventanas se renderizan por encima del HUD principal, con un z-index base definido en `ui/layers.ts`. Cada nueva ventana recibe un z-index incremental para asegurar que la ventana activa esté siempre en la parte superior.

## 7. Sistema del HUD

El HUD está diseñado como una cuadrícula (`HUDGrid`) que posiciona los elementos en zonas predefinidas de la pantalla, como se describe en `docs/HUD_ARCHITECTURE.md`.

- **Componente Principal**: `HUDLayout.tsx` organiza todos los elementos del HUD.
- **Zonas del HUD**:
    - `player`: Panel del personaje.
    - `target`: Panel del objetivo.
    - `minimap`: Minimapa.
    - `chat`: Bitácora de combate y chat.
    - `skills`: Barra de habilidades.
    - `actions`: Botones de acción (inventario, menú, etc.).
- **Flujo de Datos**: Todos los componentes del HUD se suscriben al store `useGameStore` para obtener datos en tiempo real.

## 8. Reglas de Responsividad

Aunque el diseño adaptable completo es una mejora futura, se deben seguir las siguientes reglas:

- **Diseño "Mobile-First"**: Diseñar pensando primero en pantallas pequeñas.
- **Controles Táctiles Grandes**: Todos los elementos interactivos deben ser lo suficientemente grandes para ser pulsados fácilmente con un dedo.
- **Metatag `viewport`**: El `viewport` está configurado en `app/layout.tsx` para evitar el escalado por parte del usuario y garantizar una visualización consistente en todos los dispositivos.

## 9. Reglas de Animación

Las animaciones deben ser rápidas, fluidas y con un propósito. Se gestionan a través de `motion/react` y las configuraciones predefinidas en `ui/motions.ts`.

- **`MOTION.window`**: Animación estándar para la apertura y cierre de ventanas (fade y scale).
- **`MOTION.tooltip`**: Animación sutil para la aparición de tooltips.
- **`MOTION.notification`**: Animación para notificaciones y "toasts".
- **`MOTION.fadeSlide`**: Para la aparición de elementos en listas, como los mensajes de la bitácora de combate.
- **Duración**: Las transiciones deben ser rápidas (generalmente entre 100ms y 250ms) para no ralentizar la interacción del usuario.

## 10. Reglas de Interacción

Las interacciones del usuario deben proporcionar una respuesta visual clara.

- **Estado de Botón**: El hook `useButtonState` (`ui/buttonState.ts`) proporciona un estado `hovered` para aplicar estilos al pasar el ratón.
- **Respuesta Táctil**: Los botones y otros elementos interactivos deben cambiar de estilo al ser pulsados (`active:scale-95` es una clase de Tailwind comúnmente utilizada para esto).
- **Sonido de UI**: Las interacciones importantes deben ir acompañadas de una respuesta de audio sutil, gestionada por `lib/game/audio.ts`.

## 11. Reglas de Accesibilidad

La accesibilidad es crucial para garantizar que el juego pueda ser disfrutado por el mayor número de personas posible.

- **Contraste de Color**: Asegurar un contraste suficiente entre el texto y el fondo, especialmente en la información crítica.
- **Etiquetas `alt` y `aria-label`**: Aunque no se aplica a todos los elementos de un juego, los componentes de la UI basados en HTML deben utilizar atributos ARIA cuando sea apropiado.
- **Navegación por Teclado**: En la medida de lo posible, la UI debe ser navegable utilizando solo el teclado.
- **Lectores de Pantalla**: Utilizar roles y atributos ARIA para que los lectores de pantalla puedan interpretar la interfaz.
