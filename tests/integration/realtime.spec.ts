import assert from "node:assert/strict";
import test from "node:test";

import { initialGameMachineState } from "../../src/domain/state-machine";
import type { CardInstance } from "../../src/domain/types";
import {
  resolveGracePeriodBots,
  setPlayerPresence,
  submitSelectCard,
} from "../../src/server/game-engine";
import type { AuthoritativeRoomState } from "../../src/server/game-engine";

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

test("nigiri sobre wasabi persiste despues del turno siguiente", () => {
  const initial: AuthoritativeRoomState = {
    roomId: "room-wasabi",
    machine: {
      ...initialGameMachineState(),
      status: "ROUND_1",
      round: 1,
      turn: 1,
      totalTurnsInRound: 2,
    },
    turnOrder: ["p1", "p2"],
    players: {
      p1: {
        id: "p1",
        hand: [card("nigiri-squid-1", "nigiri_squid"), card("tempura-1", "tempura")],
        playedCards: [card("wasabi-1", "wasabi")],
        puddings: 0,
        scoreByRound: [0, 0, 0],
        presence: "online",
        availableChopsticks: 0,
      },
      p2: {
        id: "p2",
        hand: [card("maki-1", "maki_1"), card("sashimi-1", "sashimi")],
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

  const p1Turn1 = submitSelectCard(initial, "p1", {
    cardId: "nigiri-squid-1",
    timestamp: 100,
    useChopsticks: false,
    useWasabi: true,
  });
  const turn1Resolved = submitSelectCard(p1Turn1.state, "p2", {
    cardId: "maki-1",
    timestamp: 101,
    useChopsticks: false,
    useWasabi: false,
  });

  assert.equal(turn1Resolved.resolvedTurn, true);

  const p1AfterTurn1 = turn1Resolved.state.players.p1.playedCards.map((c) => c.id);
  assert.equal(p1AfterTurn1.includes("nigiri-squid-1"), true);
  assert.equal(p1AfterTurn1.includes("wasabi-1"), true);
  assert.equal(p1AfterTurn1.indexOf("wasabi-1") < p1AfterTurn1.indexOf("nigiri-squid-1"), true);

  const p1Turn2 = submitSelectCard(turn1Resolved.state, "p1", {
    cardId: "sashimi-1",
    timestamp: 102,
    useChopsticks: false,
    useWasabi: false,
  });
  const turn2Resolved = submitSelectCard(p1Turn2.state, "p2", {
    cardId: "tempura-1",
    timestamp: 103,
    useChopsticks: false,
    useWasabi: false,
  });

  assert.equal(turn2Resolved.resolvedTurn, true);
  assert.equal(turn2Resolved.state.machine.status, "WAITING_SCOREBOARD");

  const p1AfterTurn2 = turn2Resolved.state.players.p1.playedCards.map((c) => c.id);
  assert.equal(p1AfterTurn2.includes("nigiri-squid-1"), true);
  assert.equal(p1AfterTurn2.includes("wasabi-1"), true);
});

test("nigiri sin usar wasabi no se apila encima de wasabi abierto", () => {
  const initial: AuthoritativeRoomState = {
    roomId: "room-wasabi-off",
    machine: {
      ...initialGameMachineState(),
      status: "ROUND_1",
      round: 1,
      turn: 1,
      totalTurnsInRound: 1,
    },
    turnOrder: ["p1", "p2"],
    players: {
      p1: {
        id: "p1",
        hand: [card("nigiri-egg-1", "nigiri_egg")],
        playedCards: [card("wasabi-1", "wasabi")],
        puddings: 0,
        scoreByRound: [0, 0, 0],
        presence: "online",
        availableChopsticks: 0,
      },
      p2: {
        id: "p2",
        hand: [card("maki-1", "maki_1")],
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

  const p1Turn = submitSelectCard(initial, "p1", {
    cardId: "nigiri-egg-1",
    timestamp: 200,
    useChopsticks: false,
    useWasabi: false,
  });
  const resolved = submitSelectCard(p1Turn.state, "p2", {
    cardId: "maki-1",
    timestamp: 201,
    useChopsticks: false,
    useWasabi: false,
  });

  assert.equal(resolved.resolvedTurn, true);
  const order = resolved.state.players.p1.playedCards.map((c) => c.id);
  assert.equal(order.indexOf("nigiri-egg-1") < order.indexOf("wasabi-1"), true);
});
