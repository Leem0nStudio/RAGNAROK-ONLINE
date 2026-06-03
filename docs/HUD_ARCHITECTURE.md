# Arquitectura del HUD (Head-Up Display)

Este documento describe la arquitectura de la interfaz de usuario (HUD) del juego, que ha sido refactorizada para ser más modular, escalable y fácil de mantener.

## Filosofía de Diseño

El HUD está diseñado para ser:

- **No intrusivo**: La mayor parte de la pantalla está dedicada a la acción del juego. Los elementos del HUD se colocan en las esquinas para no obstruir la vista.
- **Cohesivo**: Todos los componentes del HUD comparten una paleta de colores y un estilo visual unificados para crear una experiencia de usuario consistente.
- **Informado**: El HUD proporciona al jugador toda la información esencial de un vistazo, sin abrumar.

## Estructura de Componentes

La interfaz de usuario se compone de varios componentes de React, cada uno con una responsabilidad específica. El componente principal es `HUDLayout.tsx`, que actúa como el contenedor y organizador de todos los demás elementos del HUD.

La estructura es la siguiente:

- `app/page.tsx`: El punto de entrada principal de la aplicación. Renderiza el `HUDLayout` y gestiona los estados de la interfaz de usuario a gran escala (como mostrar/ocultar el inventario).

- `components/HUDLayout.tsx`: El esqueleto del HUD. Organiza la disposición de los siguientes componentes en la pantalla:
    - `components/CharacterPanel.tsx`: Muestra las estadísticas del personaje, el nivel, los puntos de vida (HP) y los puntos de magia (SP).
    - `components/Minimap.tsx`: Un minimapa que muestra la ubicación del jugador y los enemigos cercanos.
    - `components/ExperienceBars.tsx`: Barras de experiencia para el nivel de base y el nivel de trabajo (Job).

## Flujo de Datos

El HUD se basa en el store de Zustand (`lib/game/state.ts`) como única fuente de verdad para el estado del juego.

- **Lectura de Datos**: Cada componente del HUD se suscribe al `useGameStore` para obtener los datos que necesita. Por ejemplo, `CharacterPanel` obtiene las estadísticas del jugador (`player.stats`) y `Minimap` obtiene la lista de entidades (`entities`).

- **Reactividad**: Gracias a Zustand, los componentes se vuelven a renderizar automáticamente cada vez que cambia una parte relevante del estado del juego, manteniendo la interfaz de usuario siempre sincronizada con la acción.

- **Guardas de Carga**: Componentes como `CharacterPanel` tienen guardas para asegurarse de que no intentan renderizarse hasta que los datos necesarios (como el objeto `player`) estén disponibles. Esto evita errores de renderizado durante la inicialización del juego.

## Estilos

Los estilos se gestionan a través de Tailwind CSS y un conjunto de variables de color globales definidas en `app/globals.css`. Esto asegura una apariencia consistente en toda la interfaz de usuario y facilita la realización de cambios de diseño a gran escala.

## Mejoras Futuras

La arquitectura actual sienta las bases para futuras mejoras:

- **Sistema de Notificaciones**: Implementar un sistema de "toasts" no intrusivo para mostrar actualizaciones de estado, como "Misión completada", "Has subido de nivel" o "Nuevo objeto recibido".

- **Mayor Interactividad**: Añadir tooltips detallados en el `CharacterPanel` al pasar el ratón sobre las estadísticas. Permitir hacer clic en el `Minimap` para establecer un punto de destino temporal.

- **Diseño Adaptativo (Responsive)**: Añadir media queries para ajustar la escala y la disposición del HUD en pantallas más pequeñas o en modo vertical.

- **Personalización del HUD**: En el futuro, se podría permitir a los jugadores arrastrar y soltar componentes del HUD para personalizar su disposición en la pantalla.
