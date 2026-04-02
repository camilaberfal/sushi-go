import { advanceTurn, canHandleEvent, GameMachineState } from "@/domain/state-machine";
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
  cardId: string;
  useChopsticks: boolean;
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

function resolveTurn(state: AuthoritativeRoomState): EngineResolution {
  const reveals: RevealCardEntry[] = [];

  const nextPlayers: Record<string, AuthoritativePlayerState> = {};
  const handsAfterPlay: CardInstance[][] = [];

  for (const playerId of state.turnOrder) {
    const player = state.players[playerId];
    const selection = state.pendingSelections[playerId];

    if (!player || !selection) {
      return {
        state,
        events: [invalidAction(playerId, "ROUND_ALREADY_RESOLVED", "Missing pending selection while resolving turn.")],
        resolvedTurn: false,
      };
    }

    const selected = player.hand.find((card) => card.id === selection.cardId);
    if (!selected) {
      return {
        state,
        events: [invalidAction(playerId, "CARD_NOT_IN_HAND", "Selected card no longer exists in player hand.")],
        resolvedTurn: false,
      };
    }

    const nextHand = removeSelectedCardFromHand(player.hand, selection.cardId);
    handsAfterPlay.push(nextHand);

    nextPlayers[playerId] = {
      ...player,
      hand: nextHand,
      playedCards: [...player.playedCards, selected],
      availableChopsticks: selection.useChopsticks
        ? Math.max(0, player.availableChopsticks - 1)
        : player.availableChopsticks,
    };

    reveals.push({
      playerId,
      cardId: selected.id,
      cardType: selected.type as CardType,
      useChopsticks: selection.useChopsticks,
    });
  }

  const passedHands = passHandsToLeft(handsAfterPlay);
  state.turnOrder.forEach((playerId, index) => {
    nextPlayers[playerId].hand = passedHands[index] ?? [];
  });

  const machine = advanceTurn(state.machine);
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
        timestamp: payload.timestamp,
      },
    },
  };

  if (Object.keys(nextState.pendingSelections).length < state.turnOrder.length) {
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
          timestamp: nowMs,
        },
      },
    };
  }

  return currentState;
}
