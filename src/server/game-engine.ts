import { advanceTurn, canHandleEvent, GameMachineState } from "@/domain/state-machine";
import { scoreRoundForPlayers } from "@/domain/scoring";
import {
  CardType,
  CardInstance,
} from "@/domain/types";
import {
  InvalidActionReason,
  PlayerPresence,
  RevealCardEntry,
  RoomEvent,
  SelectCardPayload,
  SyncPlayerState,
} from "@/domain/protocol";
import { passHandsToLeft, removeSelectedCardFromHand } from "@/domain/round";
import { validateSelectCardInContext, validateSelectCardPayload } from "@/domain/validators";
import {
  buildAllConfirmedEvent,
  buildInvalidActionEvent,
  buildRevealCardsEvent,
  buildSyncAfterTurnEvent,
} from "@/server/realtime-events";

export type AuthoritativePlayerState = {
  id: string;
  hand: CardInstance[];
  playedCards: CardInstance[];
  puddings: number;
  scoreByRound: number[];
  presence: PlayerPresence;
  availableChopsticks: number;
  disconnectedAtMs?: number;
};

export type PendingSelection = {
  cardId: string | [string, string];
  useChopsticks: boolean;
  useWasabi: boolean;
  timestamp: number;
};

export type AuthoritativeRoomState = {
  roomId: string;
  machine: GameMachineState;
  turnOrder: string[];
  players: Record<string, AuthoritativePlayerState>;
  pendingSelections: Record<string, PendingSelection>;
  gracePeriodMs: number;
};

export type EngineResolution = {
  state: AuthoritativeRoomState;
  events: RoomEvent[];
  resolvedTurn: boolean;
};

function mapValidatorReason(reason: "INVALID_PAYLOAD" | "MISSING_CARD" | "INVALID_TIMESTAMP" | "NOT_IN_ACTION_PHASE" | "CHOPSTICKS_REQUIRED"): InvalidActionReason {
  if (reason === "CHOPSTICKS_REQUIRED") return "CHOPSTICKS_NOT_AVAILABLE";
  if (reason === "MISSING_CARD") return "CARD_NOT_IN_HAND";
  return "STATE_NOT_ACCEPTING_ACTIONS";
}

function syncPlayerState(player: AuthoritativePlayerState): SyncPlayerState {
  return {
    id: player.id,
    hand: player.hand.map((card) => card.id),
    playedCards: player.playedCards.map((card) => card.id),
    puddings: player.puddings,
    scoreByRound: player.scoreByRound,
    presence: player.presence,
  };
}

function invalidAction(playerId: string, reason: InvalidActionReason, message: string): RoomEvent<"INVALID_ACTION"> {
  return buildInvalidActionEvent({
    playerId,
    reason,
    message,
  });
}

function isNigiriCardType(cardType: string): boolean {
  return cardType === "nigiri_egg" || cardType === "nigiri_salmon" || cardType === "nigiri_squid";
}

function firstOpenWasabiIndex(cards: readonly CardInstance[]): number {
  const openWasabiIndexes: number[] = [];

  cards.forEach((card, index) => {
    if (card.type === "wasabi") {
      openWasabiIndexes.push(index);
      return;
    }

    if (isNigiriCardType(card.type) && openWasabiIndexes.length > 0) {
      openWasabiIndexes.shift();
    }
  });

  return openWasabiIndexes[0] ?? -1;
}

function appendSelectionRespectingWasabi(
  currentPlayedCards: readonly CardInstance[],
  selectedCards: readonly CardInstance[],
  useWasabi: boolean
): CardInstance[] {
  const next = [...currentPlayedCards];

  for (const selected of selectedCards) {
    const selectedIsNigiri = isNigiriCardType(selected.type);
    if (selectedIsNigiri) {
      const insertionIndex = firstOpenWasabiIndex(next);
      if (insertionIndex >= 0) {
        // useWasabi=true => apilar con wasabi (nigiri va despues del wasabi abierto)
        // useWasabi=false => mantener separado (nigiri va antes del wasabi abierto)
        next.splice(useWasabi ? insertionIndex + 1 : insertionIndex, 0, selected);
        continue;
      }
    }

    next.push(selected);
  }

  return next;
}

function resolveTurn(state: AuthoritativeRoomState): EngineResolution {
  const reveals: RevealCardEntry[] = [];

  const nextPlayers: Record<string, AuthoritativePlayerState> = {};
  const handsAfterPlay: CardInstance[][] = [];

  for (const playerId of state.turnOrder) {
    const player = state.players[playerId];
      let selection = state.pendingSelections[playerId];

      if (player.presence === "offline" && !selection && player.hand.length > 0) {
        selection = {
          cardId: player.hand[0].id,
          useChopsticks: false,
          useWasabi: true,
          timestamp: 0,
        };
      }

    if (!player || !selection) {
      return {
        state,
        events: [invalidAction(playerId, "ROUND_ALREADY_RESOLVED", "Missing pending selection while resolving turn.")],
        resolvedTurn: false,
      };
    }

    const actionCardIds = Array.isArray(selection.cardId) ? selection.cardId : [selection.cardId];
    
    const selectedCards = [];
    let missingCard = false;

    for (const cid of actionCardIds) {
      const selected = player.hand.find((card) => card.id === cid);
      if (!selected) {
        missingCard = true;
        break;
      }
      selectedCards.push(selected);
    }

    if (missingCard) {
      return {
        state,
        events: [invalidAction(playerId, "CARD_NOT_IN_HAND", "Selected card no longer exists in player hand.")],
        resolvedTurn: false,
      };
    }

    let nextHand = player.hand.filter((card) => !actionCardIds.includes(card.id));
    let nextPlayedCards = appendSelectionRespectingWasabi(player.playedCards, selectedCards, selection.useWasabi);

    if (selection.useChopsticks) {
      const chopIndex = nextPlayedCards.findIndex(c => c.type === "chopsticks");
      if (chopIndex !== -1) {
        nextHand.push(nextPlayedCards.splice(chopIndex, 1)[0]);
      }
    }

    handsAfterPlay.push(nextHand);

    nextPlayers[playerId] = {
      ...player,
      hand: nextHand,
      playedCards: nextPlayedCards,
      availableChopsticks: selection.useChopsticks
        ? Math.max(0, player.availableChopsticks - 1)
        : player.availableChopsticks,
    };

    for (const selected of selectedCards) {
      reveals.push({
        playerId,
        cardId: selected.id,
        cardType: selected.type as CardType,
        useChopsticks: selection.useChopsticks,
      });
    }
  }

  const passedHands = passHandsToLeft(handsAfterPlay);
  state.turnOrder.forEach((playerId, index) => {
    nextPlayers[playerId].hand = passedHands[index] ?? [];
  });

  const machine = advanceTurn(state.machine);

  if (machine.status === "WAITING_SCOREBOARD" && state.machine.status !== "WAITING_SCOREBOARD") {
    // La ronda terminó, procesamos el puntaje de la ronda y los pudines extras
    
    // Convertimos las cartas jugadas al formato CardType[] requerido
    const cardsInPlayArr = state.turnOrder.map((pid) =>
      nextPlayers[pid].playedCards.map((c) => c.type as CardType)
    );
    
    const liveScores = scoreRoundForPlayers(cardsInPlayArr);
    
    state.turnOrder.forEach((pid, index) => {
      const p = nextPlayers[pid];
      const newScoreArr = [...p.scoreByRound];
      newScoreArr[state.machine.round - 1] = liveScores[index].totalRoundPoints;
      
      // Actualizamos array inmutable
      p.scoreByRound = newScoreArr;
      p.puddings = liveScores[index].puddingCount;
    });
  }

  const nextState: AuthoritativeRoomState = {
    ...state,
    machine,
    players: nextPlayers,
    pendingSelections: {},
  };

  const events: RoomEvent[] = [
    buildAllConfirmedEvent({
      round: state.machine.round,
      turn: state.machine.turn,
      totalPlayers: state.turnOrder.length,
    }),
    buildRevealCardsEvent({
      roomId: state.roomId,
      round: state.machine.round,
      turn: state.machine.turn,
      reveals,
    }),
    buildSyncAfterTurnEvent({
      roomId: state.roomId,
      status: nextState.machine.status,
      round: nextState.machine.round,
      totalRounds: nextState.players[nextState.turnOrder[0]]?.scoreByRound.length ?? 3,
      turn: nextState.machine.turn,
      players: Object.fromEntries(
        Object.entries(nextState.players).map(([playerId, player]) => [playerId, syncPlayerState(player)])
      ),
    }),
  ];

  return {
    state: nextState,
    events,
    resolvedTurn: true,
  };
}

export function submitUnknownSelectCard(
  state: AuthoritativeRoomState,
  playerId: string,
  payload: unknown
): EngineResolution {
  const shapeValidation = validateSelectCardPayload(payload);
  if (!shapeValidation.ok) {
    return {
      state,
      events: [invalidAction(playerId, mapValidatorReason(shapeValidation.reason), shapeValidation.message)],
      resolvedTurn: false,
    };
  }

  const validPayload = payload as SelectCardPayload;
  return submitSelectCard(state, playerId, validPayload);
}

export function submitSelectCard(
  state: AuthoritativeRoomState,
  playerId: string,
  payload: SelectCardPayload
): EngineResolution {
  const player = state.players[playerId];
  if (!player) {
    return {
      state,
      events: [invalidAction(playerId, "PLAYER_NOT_IN_ROOM", "Player is not part of this room.")],
      resolvedTurn: false,
    };
  }

  if (!canHandleEvent(state.machine.status, "SELECT_CARD")) {
    return {
      state,
      events: [invalidAction(playerId, "STATE_NOT_ACCEPTING_ACTIONS", "Room status is not accepting actions.")],
      resolvedTurn: false,
    };
  }

  if (state.pendingSelections[playerId]) {
    return {
      state,
      events: [invalidAction(playerId, "ROUND_ALREADY_RESOLVED", "Player has already locked action this turn.")],
      resolvedTurn: false,
    };
  }

  const inContext = validateSelectCardInContext({
    status: state.machine.status,
    payload,
    handCardIds: player.hand.map((card) => card.id),
    availableChopsticks: player.availableChopsticks,
  });

  if (!inContext.ok) {
    return {
      state,
      events: [invalidAction(playerId, mapValidatorReason(inContext.reason), inContext.message)],
      resolvedTurn: false,
    };
  }

  const nextState: AuthoritativeRoomState = {
    ...state,
    pendingSelections: {
      ...state.pendingSelections,
      [playerId]: {
        cardId: payload.cardId,
        useChopsticks: payload.useChopsticks,
          useWasabi: payload.useWasabi ?? false,
        timestamp: payload.timestamp,
      },
    },
  };

    const activePlayers = state.turnOrder.filter(
      (id) => state.players[id]?.presence !== "offline"
    );

    if (Object.keys(nextState.pendingSelections).length < activePlayers.length) {
    return {
      state: nextState,
      events: [],
      resolvedTurn: false,
    };
  }

  return resolveTurn(nextState);
}

export function setPlayerPresence(
  state: AuthoritativeRoomState,
  playerId: string,
  presence: PlayerPresence,
  nowMs: number
): AuthoritativeRoomState {
  const player = state.players[playerId];
  if (!player) return state;

  return {
    ...state,
    players: {
      ...state.players,
      [playerId]: {
        ...player,
        presence,
        disconnectedAtMs: presence === "offline" ? nowMs : undefined,
      },
    },
  };
}

export function resolveGracePeriodBots(state: AuthoritativeRoomState, nowMs: number): AuthoritativeRoomState {
  let currentState = state;

  for (const playerId of currentState.turnOrder) {
    const player = currentState.players[playerId];
    if (!player) continue;
    if (player.presence !== "offline") continue;
    if (player.disconnectedAtMs === undefined) continue;

    const graceExpired = nowMs - player.disconnectedAtMs >= currentState.gracePeriodMs;
    if (!graceExpired) continue;
    if (currentState.pendingSelections[playerId]) continue;

    const firstCard = player.hand[0];
    if (!firstCard) continue;

    currentState = {
      ...currentState,
      players: {
        ...currentState.players,
        [playerId]: {
          ...player,
          presence: "bot",
        },
      },
      pendingSelections: {
        ...currentState.pendingSelections,
        [playerId]: {
          cardId: firstCard.id,
          useChopsticks: false,
          useWasabi: false,
          timestamp: nowMs,
        },
      },
    };
  }

  return currentState;
}
