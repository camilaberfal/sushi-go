import assert from "node:assert/strict";
import test from "node:test";

import { initialGameMachineState } from "../../src/domain/state-machine";
import { CardInstance } from "../../src/domain/types";
import {
  AuthoritativeRoomState,
  resolveGracePeriodBots,
  setPlayerPresence,
  submitSelectCard,
} from "../../src/server/game-engine";

function card(id: string, type: CardInstance["type"]): CardInstance {
  return { id, type };
}

function buildRoomState(): AuthoritativeRoomState {
  return {
    roomId: "room-1",
    machine: {
      ...initialGameMachineState(),
      status: "ROUND_1",
      round: 1,
      turn: 1,
    },
    turnOrder: ["p1", "p2"],
    players: {
      p1: {
        id: "p1",
        hand: [card("tempura-1", "tempura")],
        playedCards: [],
        puddings: 0,
        scoreByRound: [0, 0, 0],
        presence: "online",
        availableChopsticks: 0,
      },
      p2: {
        id: "p2",
        hand: [card("sashimi-1", "sashimi")],
        playedCards: [],
        puddings: 0,
        scoreByRound: [0, 0, 0],
        presence: "online",
        availableChopsticks: 0,
      },
    },
    pendingSelections: {},
    gracePeriodMs: 30_000,
  };
}

test("turno se resuelve al completar N selecciones", () => {
  const initial = buildRoomState();
  const one = submitSelectCard(initial, "p1", { cardId: "tempura-1", timestamp: 10, useChopsticks: false });
  assert.equal(one.resolvedTurn, false);

  const two = submitSelectCard(one.state, "p2", { cardId: "sashimi-1", timestamp: 11, useChopsticks: false });
  assert.equal(two.resolvedTurn, true);
  assert.equal(two.events.some((event) => event.type === "ALL_CONFIRMED"), true);
  assert.equal(two.events.some((event) => event.type === "REVEAL_CARDS"), true);
  assert.equal(two.events.some((event) => event.type === "SYNC_AFTER_TURN"), true);
});

test("desconexion supera grace period y cambia a bot", () => {
  const initial = buildRoomState();
  const offline = setPlayerPresence(initial, "p2", "offline", 1_000);
  const afterGrace = resolveGracePeriodBots(offline, 32_000);

  assert.equal(afterGrace.players.p2.presence, "bot");
  assert.equal(afterGrace.pendingSelections.p2?.cardId, "sashimi-1");
});
