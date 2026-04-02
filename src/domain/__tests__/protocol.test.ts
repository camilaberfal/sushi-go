import { createRoomEvent } from "../protocol";
import {
  canHandleEvent,
  continueFromScoreboard,
  initialGameMachineState,
  startGameFromLobby,
  advanceTurn,
} from "../state-machine";
import { validateSelectCardInContext, validateSelectCardPayload } from "../validators";

function assertEqual<T>(actual: T, expected: T, message: string): void {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new Error(`${message}\nExpected: ${JSON.stringify(expected)}\nActual: ${JSON.stringify(actual)}`);
  }
}

function assertTrue(value: boolean, message: string): void {
  if (!value) {
    throw new Error(message);
  }
}

export function runProtocolTests(): void {
  const event = createRoomEvent("SELECT_CARD", {
    cardId: "tempura-1",
    timestamp: 123,
    useChopsticks: false,
  });
  assertEqual(event.type, "SELECT_CARD", "Event type should match");
  assertEqual(event.payload.cardId, "tempura-1", "Event payload cardId should match");

  assertEqual(
    validateSelectCardPayload({ cardId: "a", timestamp: 1, useChopsticks: false }),
    { ok: true },
    "Valid payload should pass"
  );

  assertEqual(
    validateSelectCardPayload({ cardId: "", timestamp: 1, useChopsticks: false }),
    { ok: false, reason: "MISSING_CARD", message: "cardId is required." },
    "Missing card should fail"
  );

  assertEqual(
    validateSelectCardPayload({ cardId: "a", timestamp: 0, useChopsticks: false }),
    {
      ok: false,
      reason: "INVALID_TIMESTAMP",
      message: "timestamp must be a positive finite number.",
    },
    "Invalid timestamp should fail"
  );

  assertEqual(
    validateSelectCardInContext({
      status: "ROUND_1",
      payload: { cardId: "a", timestamp: 1, useChopsticks: false },
      handCardIds: ["a", "b"],
      availableChopsticks: 0,
    }),
    { ok: true },
    "Valid in-context select should pass"
  );

  assertEqual(
    validateSelectCardInContext({
      status: "WAITING_SCOREBOARD",
      payload: { cardId: "a", timestamp: 1, useChopsticks: false },
      handCardIds: ["a", "b"],
      availableChopsticks: 0,
    }),
    {
      ok: false,
      reason: "NOT_IN_ACTION_PHASE",
      message: "Current room status does not accept SELECT_CARD.",
    },
    "Wrong status should fail"
  );

  assertEqual(
    validateSelectCardInContext({
      status: "ROUND_2",
      payload: { cardId: "z", timestamp: 1, useChopsticks: false },
      handCardIds: ["a", "b"],
      availableChopsticks: 0,
    }),
    {
      ok: false,
      reason: "MISSING_CARD",
      message: "Selected card is not present in player hand.",
    },
    "Card missing from hand should fail"
  );

  assertEqual(
    validateSelectCardInContext({
      status: "ROUND_3",
      payload: { cardId: "a", timestamp: 1, useChopsticks: true },
      handCardIds: ["a", "b"],
      availableChopsticks: 0,
    }),
    {
      ok: false,
      reason: "CHOPSTICKS_REQUIRED",
      message: "Cannot use chopsticks when none are available.",
    },
    "Chopsticks validation should fail when unavailable"
  );

  let state = initialGameMachineState();
  assertEqual(state.status, "LOBBY", "Initial state should start in lobby");

  state = startGameFromLobby(7);
  assertEqual(state.status, "ROUND_1", "Game should start at round 1");
  assertEqual(state.turn, 1, "Game should start at turn 1");

  state = advanceTurn(state);
  assertEqual(state.turn, 2, "Turn should advance while hand has cards");

  const lastTurnState = { ...state, turn: 7, totalTurnsInRound: 7 };
  const waiting = advanceTurn(lastTurnState);
  assertEqual(waiting.status, "WAITING_SCOREBOARD", "Last turn should transition to WAITING_SCOREBOARD");

  const round2 = continueFromScoreboard(waiting, 7);
  assertEqual(round2.status, "ROUND_2", "Scoreboard continue should enter round 2");

  const round3 = continueFromScoreboard({ ...round2, status: "WAITING_SCOREBOARD", round: 2 }, 7);
  assertEqual(round3.status, "ROUND_3", "Second scoreboard continue should enter round 3");

  const final = continueFromScoreboard({ ...round3, status: "WAITING_SCOREBOARD", round: 3 }, 7);
  assertEqual(final.status, "FINAL_PODIUM", "After round 3 scoreboard should end in FINAL_PODIUM");

  assertTrue(canHandleEvent("ROUND_1", "SELECT_CARD"), "ROUND_1 should handle SELECT_CARD");
  assertTrue(!canHandleEvent("FINAL_PODIUM", "SELECT_CARD"), "FINAL_PODIUM should reject SELECT_CARD");
}
