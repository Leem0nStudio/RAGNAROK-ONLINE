# Ragnarok Engine Sandbox

Un simulador de RPG inspirado en los clásicos, optimizado para una experiencia móvil moderna y fluida. Este proyecto combina mecánicas de combate táctico, gestión de estadísticas y personalización de personajes en un entorno 3D interactivo.

## 🚀 Características Principales

### 📱 Interfaz Móvil Optimizada
*   **Menú de Aventurero**: Rediseñado completamente para pantallas táctiles con navegación por pestañas inferior.
*   **Gestión de Inventario**: Sistema de cuadrícula densa y paneles de detalles tipo "bottom-sheet" para facilitar el uso con una sola mano.
*   **Control de Cámara**: Soporte nativo para gestos táctiles (*pinch-to-zoom* y *swipe* lateral para rotación).

### ⚔️ Sistema de Combate y Habilidades
*   **Hotbar Personalizable**: Editor de acceso rápido que permite asignar habilidades arrastrando y soltando (*drag & drop*) directamente desde el libro de habilidades.
*   **Progreso de Clase**: Soporta múltiples trabajos (Novice, Swordman, Acolyte, Priest) con árboles de habilidades únicos.
*   **Estadísticas Inteligentes**: Sistema de atributos (STR, AGI, VIT, INT, DEX, LUK) que impactan directamente el desempeño en batalla.

### 🎒 Inventario y Equipo
*   **Control de Peso**: Mecánica de sobrecarga que afecta la regeneración y el combate.
*   **Sistema de Rareza**: Objetos clasificados por rareza (Común, Raro, Épico) con efectos visuales dinámicos.
*   **Ranuras de Equipo**: Gestión de equipo para cabeza, arma y accesorios.

## 🛠️ Tecnologías

*   **Framework**: Next.js 15+ (App Router)
*   **Styling**: Tailwind CSS
*   **Animaciones**: Framer Motion
*   **Estado**: Zustand (Persistence local activa)
*   **Motor**: Custom 3D Engine (Typescript)

## 🎮 Controles

*   **Escritorio**: Teclas Q, W, E, R para habilidades. Clic para moverte e interactuar.
*   **Móvil**: Joystick táctil para movimiento. Gestos para cámara. Interfaz táctil reactiva.

---

*Desarrollado como un sandbox experimental para mecánicas de RPG tipo Ragnarok.*
