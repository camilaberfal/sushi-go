# Flujo de la Partida y Pantallas (Game Flow)

## Propósito
Describir exhaustivamente todas las pantallas (views), los popups, y la transición lineal del jugador a través de la aplicación en el tiempo. Desde el inicio hasta el botón de revancha.

## 1. Menú Principal (Landing)
- **Concepto:** Sin registros, fluida. 
- **Presentación:** Logo de Sushi Go!, estético, colorido y minimalista.
- **Acciones (Modal Popups):**
  - **"Crea una sala"**: Lanza modal. El *Host* escoge límite de jugadores (2 a 5) y contraseña opcional. Post-creación, redirige al **Lobby**.
  - **"Únete a una sala"**: Lanza modal. Pide "Código de sala" y checkeo de contraseña. Manejo de error claro: aviso si la sala no existe o está llena. Post-unión, redirige al **Lobby**.

## 2. Lobby de Espera (Vista de Sala)
- **Información Global:** Listado de jugadores presentes. Código de sala visible con botón/ícono de "Copiar" al portapapeles.
- **Vista de Host:** 
  - Configuraciones (Límite de jugadores, contraseña) son *editables*.
  - Botón: "Iniciar Partida" (Activo si >= 2).
- **Vista de Participante:** 
  - Configuraciones de lectura (*disabled*). 
  - Texto central: "Esperando a que el host inicie la partida".

## 3. Juego Activo (Rondas 1, 2, y 3)
- **Estructura de Turno:**
  1. Todos tienen cartas en su mano (agrupadas automáticamente por el tipo de carta, aislando especiales como Wasabi/Palillos).
  2. Todos eligen la carta a jugar frente a la mesa. (Señalador visual de estado "Esperando a otros jugadores" cuando uno finaliza).
  3. Fase Crítica: **Revelación simultánea** con alta fidelidad de animaciones.
  4. Rotación del mazo o "Paso de la Mano".
- **Cartas Visibles en Mesa (Tanto tuyas como de los otros):** Las cartas que los jugadores ya bajaron.
- **Elementos HUD de Juego:**
  - Rondómetro ("Ronda 1/3").
  - Cartas restantes en la mano.
  - Puntuación acumulada de todos.
  - Pudines acumulados de todos.

## 4. Scoreboard de Ronda (Pantalla Intermedia)
- Aparece lógicamente tras jugar la última carta de la mano de cada ronda.
- **Contenido:** Desglose transaccional de puntos por jugador y categoría (cuántas cartas y puntos por cada tipo en esa ronda).
- **Condición:** Los Pudines se muestran pero NO suman puntuación hasta la ronda final.
- **Transición:** Botón de "Continuar a la siguiente ronda".

## 5. Scoreboard Final y Pantalla de Logros
- **Componente Principal:** Un podio ordenado por el total final (Rondas 1+2+3 sumado + Puntos de pudines calculados). Destacando al Ganador absoluto.
- **Pantalla de Logros (Achievements):**
  - Medallas o listado resaltando premios narrativos por hitos en las reglas (ej: "Más pudines", "Más palillos usados", "Terminar con más de 5 pudines", "Acumular 5 gyozas/dumplings", "Completar 2 pares de tempura o sashimi", "Más makis").
- **Breakdown Narrativo / Highlights (Reporte Forense):**
  - Tiempo total de la partida.
  - Carta más jugada a nivel general.
  - Tiempo promedio por jugada de cada jugador (incluyendo su jugada más rápida y más lenta y QUÉ carta la provocó).
  - Puntuación promedio por ronda.
  - Rendimiento: "Carta más rentable de la partida" (puntos vs costo de uso) y "Carta que generó más puntos totales".
- **Acciones Globales:**
  - **Botón "Revancha"**: Redirige al mismo *Lobby de espera* con las mismas personas. 
  - **Botón "Volver al inicio"**: Redirige al *Menú Principal*.

## 6. Historial de Partidas
Una vista lista/grid donde cada partida pasada, grabada en Supabase, muestra "Fecha" y listado simple de "Jugadores". Al hacer clic, re-despliega el *Scoreboard Completo*.
