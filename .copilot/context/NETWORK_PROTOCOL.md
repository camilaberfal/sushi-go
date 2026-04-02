# Protocolo de Red y Edge Cases (Network)

## Propósito
Definir los eventos de webSockets en base a Supabase Realtime Channels, además del control crítico de estados asíncronos y latencias en "Sushi Go! Online" dado que su modelo está basado 100% en acciones unánimes/paralelas.

## 1. Concurrencia de la Revelación Simultánea 

### A. Emisiones del Jugador (Pub)
- **`SELECT_CARD`:** Payload debe ser `{ cardId, timestamp, useChopsticks: boolean }`.
- Condición: Si un jugador juega antes, debe ver UI "Esperando a otros jugadores".

### B. Emisiones Globales del Servidor (Sub)
- **`ALL_CONFIRMED`:** El servidor escucha `N` eventos de selección. Si `N == totalPlayers`, se interrumpe la fase de selección.
- **`REVEAL_CARDS`:** El Servidor emite exactamente qué carta eligió cada uno para detonar la "Animación Principal" de revelación simultánea y sonido. 
- **`SYNC_AFTER_TURN`:** El servidor reparte el nuevo estado mutado por `REVEAL_CARDS` y transfiere las manos de los jugadores (rotación circular N-1).

## 2. Inconsistencias Aceptables e Inválidas
- **`INVALID_ACTION`:** Si tu ping generó que envíes una carta cuando ya terminó la ronda, el servidor devuelve Error y tu Frontend debe cancelar tu `Optimistic UI Update`.
- **Cartas Especiales:** Mandar a usar Palillos (`useChopsticks: true`) sin tener palillos mostrados devolverá infracción o hackeo directo y será denegado.

## 3. Desconexiones (Edge Cases Críticos)
- **El Bloqueo de la Mesa:** Si el jugador A se desconecta a mitad de ronda, todos quedarán atascados esperando (`status: "Esperando..."` por siempre).
- **Grace Period Inactivity:** Supabase Presence indicará `offline`. Se iniciará un contador automático (Ej: 30 segundos) de reconexión. 
  - En la UI, todos verán "X Jugador dejó la sala, esperando...".
  - Si el contador expira, el backend mutará o forzará al jugador a un Bot Local automatizado que seleccionará la primera carta válida de su mano al instante del siguiente turno, para no penalizar el tiempo promedio estadístico (`tiempo promedio por jugada`) de la partida del Scoreboard narrativo mediante su ausencia (las jugadas bot no se acumulan como estadísticas humanas lentas).
