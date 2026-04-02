# Arquitectura del Sistema: Sushi Go! Online

## Propósito
Definir la arquitectura base, el stack tecnológico oficial y los principios de diseño técnicos para la aplicación web multijugador en tiempo real. 

## 1. Decisiones Técnicas y Tecnológicas (Stack)
- **Frontend / Framework Central:** Next.js, React, TypeScript.
- **Estilos y UI:** Tailwind CSS para layouts rápidos.
- **Base de Datos y Real-time:** Supabase. Se utilizará tanto para autenticación/persistencia (PostgreSQL) como para el flujo de estados efímeros vía WebSockets (Supabase Channels).
- **Animaciones:** Framer Motion (fundamental para el "game feel" y las revelaciones de cartas simultáneas).
- **Manejo de Estado Local:** Zustand, para el manejo de estados de sala sin prop-drilling en las pantallas activas.
- **Audio y SFX:** Howler.js, para reproducir múltiples efectos simultáneos en alta calidad.
- **Iconografía:** Lucide icons.
- **Infraestructura:** Vercel.

## 2. Tipografías Oficiales
- **Títulos y Headings:** `Fredoka`.
- **Textos de cuerpo (Body):** `Outfit`.

## 3. Paradigma de Arquitectura
- **Autoridad:** El servidor (Supabase Edge Functions / Backend) es la fuente única de verdad.
- **Simultaneidad:** El patrón principal de juego es la selección y revelación simultánea. El backend agregará los comandos de cada jugador y emitirá el resultado en bloque (batch) tras completarse el cupo de respuestas.
- **Persistencia Híbrida:** 
  - La *partida en curso* (salas, rondas activas, cartas en mano) existe primordialmente en canales en tiempo real.
  - El *historial de partidas* y métricas finales (tiempos totales, carta más jugada, etc.) se almacenan en la base de datos PostgreSQL de Supabase al terminar el "Scoreboard Final".
