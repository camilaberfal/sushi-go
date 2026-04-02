# Plan de Implementacion - Sushi Go! Online

Nota de assets: las cartas del juego se consumen desde src/app/assets/cards.

## 1. [CRITICO] Fase 1 - Nucleo de reglas y scoring determinista
Objetivo: Modelar cartas, turnos, rondas y puntuacion completa de Sushi Go como logica pura testeable.

- Tipo: Logica pura (sin Supabase, sin Next.js).
- Las fotos de las cartas están en src/app/assets/ y deben usarse todas.
- Archivos a crear o modificar:
  - Nuevos: src/domain/cards.ts, src/domain/deck.ts, src/domain/scoring.ts, src/domain/round.ts, src/domain/types.ts, src/domain/__tests__/scoring.test.ts, src/domain/__tests__/round.test.ts.
  - Modificados: README.md.
- Dependencias: Ninguna.
- Criterio de exito: Todas las reglas del documento GAME_RULES quedan cubiertas por tests unitarios, incluyendo empates de maki, pudding en 2 jugadores, wasabi+nigiri y chopsticks.

## 2. [CRITICO] Fase 2 - Protocolo de eventos y maquina de estados de partida
Objetivo: Definir contrato unico de eventos de red y transiciones de estado del juego para cliente y servidor.

- Tipo: Logica pura (sin Supabase, sin Next.js).
- Archivos a crear o modificar:
  - Nuevos: src/domain/protocol.ts, src/domain/state-machine.ts, src/domain/validators.ts, src/domain/__tests__/protocol.test.ts.
  - Modificados: README.md.
- Dependencias: Fase 1.
- Criterio de exito: Existe una maquina de estados valida para LOBBY -> ROUND -> WAITING_SCOREBOARD -> FINAL_PODIUM, con validaciones de INVALID_ACTION y payload SELECT_CARD.

## 3. [CRITICO] Fase 3 - Fundaciones frontend y sistema de diseno base
Objetivo: Preparar dependencias, tipografias oficiales, tokens visuales y base de componentes UI reutilizable.

- Tipo: Infraestructura (Next.js, Tailwind, librerias UI).
- Archivos a crear o modificar:
  - Modificados: package.json, src/app/layout.tsx, src/app/globals.css, next.config.ts.
  - Nuevos: components.json (shadcn), src/lib/utils.ts, src/components/ui (carpeta base), src/components/system (theme/tokens).
- Dependencias: Fase 1 y Fase 2.
- Criterio de exito: Proyecto compila con fuentes Fredoka/Outfit aplicadas, tokens de color definidos, y shadcn inicializado.
- shadcn/ui: instalar e inicializar en esta fase (estado actual: no instalado).
- Componentes shadcn a agregar aqui: button, input, label, card, dialog, form, toast, badge, separator, avatar, tooltip.

## 4. [CRITICO] Fase 4 - Modelo de datos Supabase y seguridad
Objetivo: Crear esquema persistente para salas, partidas, jugadores, metricas y resultados, con politicas de seguridad.

- Tipo: Infraestructura (Supabase Postgres, RLS, migraciones).
- Archivos a crear o modificar:
  - Nuevos: supabase/migrations/*_init_core.sql, supabase/migrations/*_rls.sql, supabase/migrations/*_indexes.sql, supabase/seed.sql.
  - Modificados: supabase/config.toml, README.md.
- Dependencias: Fase 2.
- Criterio de exito: Tablas y politicas RLS aplicadas, consultas basicas de crear sala/unirse/finalizar partida funcionando, y seeds reproducibles.

## 5. [CRITICO] Fase 5 - Motor autoritativo de partida en tiempo real
Objetivo: Implementar procesamiento servidor de turnos simultaneos, revelacion en batch y sync por canal realtime.

- Tipo: Infraestructura (Supabase Realtime + Edge Functions).
- Archivos a crear o modificar:
  - Nuevos: supabase/functions/room-command/index.ts, supabase/functions/turn-resolver/index.ts, src/server/game-engine.ts, src/server/realtime-events.ts.
  - Modificados: README.md.
- Dependencias: Fase 2 y Fase 4.
- Criterio de exito: Eventos ALL_CONFIRMED, REVEAL_CARDS y SYNC_AFTER_TURN se emiten correctamente con N jugadores, incluyendo manejo de desconexion y grace period.

## 6. [CRITICO] Fase 6 - Capa cliente de datos y store de sala
Objetivo: Conectar cliente Next.js con el estado autoritativo y crear store Zustand con selectores derivados.

- Tipo: Mixta (logica de cliente + infraestructura realtime).
- Archivos a crear o modificar:
  - Nuevos: src/store/room-store.ts, src/store/selectors.ts, src/hooks/use-room-channel.ts, src/hooks/use-game-actions.ts, src/lib/supabase-browser.ts, src/lib/supabase-server.ts, src/lib/supabase-middleware.ts.
  - Modificados: src/lib/supabase.ts, README.md.
- Dependencias: Fase 3 y Fase 5.
- Criterio de exito: Cliente recibe snapshots de estado en vivo, puede emitir SELECT_CARD y renderizar estado derivado sin prop drilling.
- Nota de consistencia: El contexto dice que ya existen 3 clientes Supabase; esta fase formaliza y valida esa estructura dentro del codigo de src/lib.

## 7. Fase 7 - Landing y Lobby completos
Objetivo: Construir flujo inicial de creacion/union de sala y vista de espera host/participante.

- Tipo: UI + infraestructura (navegacion y llamadas reales).
- Archivos a crear o modificar:
  - Modificados: src/app/page.tsx, src/app/globals.css.
  - Nuevos: src/app/lobby/[roomCode]/page.tsx, src/components/landing/create-room-modal.tsx, src/components/landing/join-room-modal.tsx, src/components/lobby/player-list.tsx, src/components/lobby/room-code.tsx.
- Dependencias: Fase 3 y Fase 6.
- Criterio de exito: Usuario crea sala o se une con validaciones, ve lobby actualizado y host puede iniciar partida si hay 2 o mas jugadores.
- shadcn/ui: usar componentes de Fase 3 (ya instalados).
- Componentes shadcn necesarios: dialog, form, input, label, button, card, badge, tooltip, toast, avatar.

## 8. Fase 8 - Mesa de juego activa, animaciones y audio
Objetivo: Implementar la experiencia de turno, seleccion, espera, revelacion simultanea y rotacion visual de mano.

- Tipo: UI + infraestructura realtime.
- Archivos a crear o modificar:
  - Nuevos: src/app/game/[roomCode]/page.tsx, src/components/game/table-view.tsx, src/components/game/hand-grouped.tsx, src/components/game/player-hud.tsx, src/components/game/reveal-layer.tsx, src/lib/audio.ts.
  - Modificados: package.json, src/app/globals.css.
  - Assets consumidos: src/app/assets/cards/*.
- Dependencias: Fase 6 y Fase 7.
- Criterio de exito: Turno completo jugable con estado Esperando, REVEAL_CARDS animado y rotacion de mano sincronizada.
- shadcn/ui: reutiliza instalados; no requiere bootstrap nuevo.
- Componentes shadcn necesarios: card, badge, tooltip, separator, avatar, skeleton.
- Dependencias de libreria de esta fase: framer-motion, howler, lucide-react, zustand (si faltan).

## 9. Fase 9 - Scoreboards, logros e historial
Objetivo: Entregar pantalla de resumen por ronda, podio final, achievements narrativos e historial persistido.

- Tipo: UI + infraestructura (persistencia y lectura de partidas).
- Archivos a crear o modificar:
  - Nuevos: src/app/scoreboard/[roomCode]/page.tsx, src/app/history/page.tsx, src/components/scoreboard/round-breakdown.tsx, src/components/scoreboard/final-podium.tsx, src/components/scoreboard/achievements.tsx, src/components/history/match-list.tsx.
  - Modificados: README.md.
- Dependencias: Fase 5, Fase 6 y Fase 8.
- Criterio de exito: Se visualiza breakdown por categoria, podio final con desempate por pudding, y listado de partidas historicas navegable.
- shadcn/ui: reutiliza instalados.
- Componentes shadcn necesarios: table, card, badge, accordion, tabs, scroll-area, button.

## 10. Fase 10 - Robustez final, QA y despliegue
Objetivo: Cerrar estabilidad de red, pruebas end-to-end, metricas minimas y checklist de deploy.

- Tipo: Infraestructura + calidad.
- Archivos a crear o modificar:
  - Nuevos: tests/e2e/*.spec.ts, tests/integration/realtime.spec.ts, docs/runbook.md.
  - Modificados: README.md, package.json, supabase/config.toml.
- Dependencias: Todas las fases anteriores.
- Criterio de exito: Casos criticos pasan (desconexion, reconexion, empate, timeout, replay), build limpio y guia operativa lista para Vercel + Supabase.

## Priorizacion critica

- Bloqueantes absolutos: Fases 1, 2, 4 y 5.
- Bloqueante de consistencia visual/tecnica de UI: Fase 3.
- El resto depende de esas fundaciones, en especial toda la UX de juego simultaneo y scoreboards.
