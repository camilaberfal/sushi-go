# Gestión de Estado de la Partida (State Management)

## Propósito
Definir el modelo estricto de Zustand para la UI y Supabase para el *Game State Global*, previendo todas las métricas analíticas exigidas para los "Highlights".

## 1. El Estado Global de Supabase Realtime (Server-Side Source of Truth)

Debe gestionar no solo la lógica, sino registrar *timestamps* de cada selección.

```ts
type RoomState = {
  roomId: string,
  hostId: string,
  settings: {
    maxPlayers: number,
    password?: string
  },
  status: 'LOBBY' | 'ROUND_1' | 'WAITING_SCOREBOARD' | 'FINAL_PODIUM',
  analytics: {
    gameStartTime: number,         // Date().getTime()
    totalPlayTime: number,         // Calculado en el Game Over
    cardPlayCount: Record<CardType, number>, // [maki_2: 12, sashimi: 4...]
    totalPointsByCard: Record<CardType, number>
  },
  players: Record<string, PlayerStatus>
}

type PlayerStatus = {
  id: string,
  name: string,
  hand: string[],            // Cartas restantes
  playedCards: string[],     // Lo colocado en la mesa en esta ronda
  puddings: number,          // Persistente 
  scoreByRound: [number, number, number], 
  // MÉTRICAS PARA LOGROS Y BREAKDOWN:
  metrics: {
    tempurasPlayed: number,
    sashimisPlayed: number,
    gyozasPlayed: number,    // Dumplings
    makisTotal: number,      // Todos los rollos juntos
    wasabisUsed: number,
    chopsticksUsed: number,
    // TIEMPO y NARRATIVA:
    turnTimestamps: {
      roundStart: number,
      lockedInAction: number,
      selectedCardId: string
    }[]
  }
}
```

## 2. Zustand en Cliente (View Layer)
- **Mazo aglomerado:** Zustand debe tener *Selectors* que estructuren el mazo de forma automática (`hand.sort((a,b) => a.type - b.type)`), dejando los "Wasabis" y "Palillos" en una submatriz que los renderice aislados o destacados según el requirement.
- **Puntuación Proyectada:** Dado que la métrica intermedia de la ronda no cuenta los pudines, Zustand los mantendrá en un estado derivado pasivo. 
- **Time Tracking:** Zustand no debe hacer `Date.now()` para analíticas, esto debe ser enviado y computado por el backend para evitar desincronizaciones por lag (evitar trucar la "Jugada más veloz").

## 3. Estado vs Fases (Transiciones)
- **Inicio de Partida:** `LOBBY` -> `ROUND_1`. Limpia toda métrica anterior. Reparte baraja total de 108 cartas.
- **Cada Jugada:** Muta el arreglo local `hand` de tamaño `N` a `N-1`. Cuando *todos* reportan acción, se mutan las manos globalmente (rotabilidd circular `players[i].hand = tempHand[i-1]`) y se añaden las seleccionadas a `playedCards`.
- **Termina la Ronda:** Tras jugar la última carta de mano. Pasa a `WAITING_SCOREBOARD`.
- **Termina Partida:** Tras resolver score de Ronda 3, se calculan las diferencias de Puddings (Jugador con más pudines recibe 6, el que menos pierde 6. Empates se dividen), y se transiciona a `FINAL_PODIUM`.
