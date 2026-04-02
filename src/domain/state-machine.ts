import { RoomEventType, RoomStatus } from "./protocol";

export type GameMachineState = {
  status: RoomStatus;
  round: number;
  turn: number;
  totalTurnsInRound: number;
};

export function initialGameMachineState(): GameMachineState {
  return {
    status: "LOBBY",
    round: 1,
    turn: 0,
    totalTurnsInRound: 0,
  };
}

function statusForRound(round: number): RoomStatus {
  if (round <= 1) return "ROUND_1";
  if (round === 2) return "ROUND_2";
  return "ROUND_3";
}

export function canHandleEvent(status: RoomStatus, eventType: RoomEventType): boolean {
  if (status === "LOBBY") {
    return eventType === "SYNC_AFTER_TURN" || eventType === "INVALID_ACTION";
  }

  if (status === "WAITING_SCOREBOARD") {
    return eventType === "SYNC_AFTER_TURN" || eventType === "INVALID_ACTION";
  }

  if (status === "FINAL_PODIUM") {
    return eventType === "INVALID_ACTION";
  }

  return (
    eventType === "SELECT_CARD" ||
    eventType === "ALL_CONFIRMED" ||
    eventType === "REVEAL_CARDS" ||
    eventType === "SYNC_AFTER_TURN" ||
    eventType === "INVALID_ACTION"
  );
}

export function startGameFromLobby(totalTurnsInRound: number): GameMachineState {
  if (totalTurnsInRound <= 0) {
    throw new Error("totalTurnsInRound must be a positive integer.");
  }

  return {
    status: "ROUND_1",
    round: 1,
    turn: 1,
    totalTurnsInRound,
  };
}

export function advanceTurn(state: GameMachineState): GameMachineState {
  if (state.status !== "ROUND_1" && state.status !== "ROUND_2" && state.status !== "ROUND_3") {
    throw new Error("advanceTurn can only run during round statuses.");
  }

  if (state.turn < state.totalTurnsInRound) {
    return {
      ...state,
      turn: state.turn + 1,
    };
  }

  return {
    ...state,
    status: "WAITING_SCOREBOARD",
  };
}

export function continueFromScoreboard(state: GameMachineState, nextTotalTurnsInRound: number): GameMachineState {
  if (state.status !== "WAITING_SCOREBOARD") {
    throw new Error("continueFromScoreboard can only run from WAITING_SCOREBOARD.");
  }

  if (nextTotalTurnsInRound <= 0) {
    throw new Error("nextTotalTurnsInRound must be a positive integer.");
  }

  if (state.round >= 3) {
    return {
      ...state,
      status: "FINAL_PODIUM",
    };
  }

  const nextRound = state.round + 1;

  return {
    status: statusForRound(nextRound),
    round: nextRound,
    turn: 1,
    totalTurnsInRound: nextTotalTurnsInRound,
  };
}

export function forceFinalPodium(state: GameMachineState): GameMachineState {
  return {
    ...state,
    status: "FINAL_PODIUM",
  };
}
