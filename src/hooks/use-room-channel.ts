"use client";

import { useEffect, useRef } from "react";
import { RealtimeChannel } from "@supabase/supabase-js";

import { RoomEventMap, SelectCardPayload, SyncAfterTurnPayload } from "@/domain/protocol";
import { buildFullDeck, dealHands, shuffleDeck } from "@/domain/deck";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";
import { AuthoritativeRoomState, submitSelectCard } from "@/server/game-engine";
import { getRoomStoreState, useRoomStore } from "@/store/room-store";

type UseRoomChannelArgs = {
  roomId: string;
  playerId: string;
};

const activeRoomChannels = new Map<string, RealtimeChannel>();

function cardTypeFromCardId(cardId: string): string {
  const separator = cardId.lastIndexOf("-");
  return separator > 0 ? cardId.slice(0, separator) : cardId;
}

function createSeededRng(seed: string): () => number {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i += 1) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }

  return () => {
    h += h << 13;
    h ^= h >>> 7;
    h += h << 3;
    h ^= h >>> 17;
    h += h << 5;
    return ((h >>> 0) % 1_000_000) / 1_000_000;
  };
}

function buildNextRoundSnapshot(snapshot: SyncAfterTurnPayload): SyncAfterTurnPayload | null {
  if (snapshot.status !== "WAITING_SCOREBOARD") return null;
  if (snapshot.round >= snapshot.totalRounds) return null;

  const playerIds = Object.keys(snapshot.players);
  if (playerIds.length < 2 || playerIds.length > 5) return null;

  const deck = shuffleDeck(buildFullDeck(), createSeededRng(`${snapshot.roomId}-round-${snapshot.round + 1}`));
  const { hands } = dealHands(deck, playerIds.length);
  const nextRound = snapshot.round + 1;
  const nextStatus = nextRound === 1 ? "ROUND_1" : nextRound === 2 ? "ROUND_2" : "ROUND_3";

  return {
    roomId: snapshot.roomId,
    status: nextStatus,
    round: nextRound,
    totalRounds: snapshot.totalRounds,
    turn: 1,
    players: Object.fromEntries(
      playerIds.map((playerId, index) => {
        const current = snapshot.players[playerId];
        return [
          playerId,
          {
            ...current,
            hand: (hands[index] ?? []).map((card) => card.id),
            playedCards: [],
          },
        ];
      })
    ),
  };
}

function toAuthoritativeState(snapshot: SyncAfterTurnPayload): AuthoritativeRoomState {
  const firstPlayer = Object.values(snapshot.players)[0];
  const remainingCards = firstPlayer?.hand.length ?? 0;
  const totalTurnsInRound = Math.max(snapshot.turn, snapshot.turn + remainingCards - 1);

  return {
    roomId: snapshot.roomId,
    machine: {
      status: snapshot.status,
      round: snapshot.round,
      turn: snapshot.turn,
      totalTurnsInRound,
    },
    turnOrder: Object.keys(snapshot.players),
    players: Object.fromEntries(
      Object.entries(snapshot.players).map(([id, player]) => [
        id,
        {
          id,
          hand: player.hand.map((cardId) => ({ id: cardId, type: cardTypeFromCardId(cardId) as never })),
          playedCards: player.playedCards.map((cardId) => ({ id: cardId, type: cardTypeFromCardId(cardId) as never })),
          puddings: player.puddings,
          scoreByRound: player.scoreByRound,
          presence: player.presence,
          availableChopsticks: player.playedCards.filter((cardId) => cardTypeFromCardId(cardId) === "chopsticks").length,
        },
      ])
    ),
    pendingSelections: {},
    gracePeriodMs: 30_000,
  };
}

export function useRoomChannel({ roomId, playerId }: UseRoomChannelArgs) {
  const resolverStateRef = useRef<AuthoritativeRoomState | null>(null);

  const setMeta = useRoomStore((state) => state.setMeta);
  const setSnapshot = useRoomStore((state) => state.setSnapshot);
  const setLastError = useRoomStore((state) => state.setLastError);
  const setWaitingForPlayers = useRoomStore((state) => state.setWaitingForPlayers);
  const setPendingSelection = useRoomStore((state) => state.setPendingSelection);
  const setLastReveal = useRoomStore((state) => state.setLastReveal);

  useEffect(() => {
    setMeta({ roomId, playerId });

    const supabase = getSupabaseBrowserClient();
    const channel = supabase.channel(`room:${roomId}`, {
      config: {
        broadcast: {
          self: true,
        },
      },
    });

    const bind = <TType extends keyof RoomEventMap>(event: TType, handler: (payload: RoomEventMap[TType]) => void) => {
      channel.on("broadcast", { event }, (packet) => {
        handler(packet.payload as RoomEventMap[TType]);
      });
    };

    bind("ALL_CONFIRMED", () => {
      setWaitingForPlayers(false);
    });

    bind("SELECT_CARD", async (payload: SelectCardPayload) => {
      if (!payload.playerId) return;

      const currentSnapshot = getRoomStoreState().snapshot;
      if (!currentSnapshot) return;

      const resolverCandidates = Object.values(currentSnapshot.players)
        .filter((player) => player.presence !== "offline")
        .map((player) => player.id)
        .sort();
      const resolverId = resolverCandidates[0] ?? Object.keys(currentSnapshot.players).sort()[0];
      if (resolverId !== playerId) return;

      const baseState = resolverStateRef.current ?? toAuthoritativeState(currentSnapshot);
      const result = submitSelectCard(baseState, payload.playerId, {
        cardId: payload.cardId,
        timestamp: payload.timestamp,
        useChopsticks: payload.useChopsticks,
        useWasabi: payload.useWasabi,
      });

      resolverStateRef.current = result.state;

      for (const event of result.events) {
        await broadcastRoomEvent(roomId, event.type, event.payload as never);
      }

      const syncEvent = result.events.find((event) => event.type === "SYNC_AFTER_TURN");
      if (!syncEvent) return;

      const resolvedSnapshot = syncEvent.payload as SyncAfterTurnPayload;
      const nextRoundSnapshot = buildNextRoundSnapshot(resolvedSnapshot);
      if (!nextRoundSnapshot) return;

      window.setTimeout(async () => {
        await broadcastRoomEvent(roomId, "SYNC_AFTER_TURN", nextRoundSnapshot);
      }, 1200);
    });

    bind("SYNC_AFTER_TURN", (payload) => {
      setSnapshot(payload);
      setPendingSelection(null);
      setWaitingForPlayers(false);
      resolverStateRef.current = toAuthoritativeState(payload);
    });

    bind("REVEAL_CARDS", (payload) => {
      setLastReveal(payload.reveals);
    });

    bind("INVALID_ACTION", (payload) => {
      if (payload.playerId === playerId) {
        setLastError(payload.message);
        setPendingSelection(null);
        setWaitingForPlayers(false);
      }
    });

    channel.on("broadcast", { event: "REQUEST_SYNC" } as any, async (packet) => {
      const p = packet.payload as { playerId: string };
      const currentSnapshot = getRoomStoreState().snapshot;
      if (!currentSnapshot) return;

      const resolverCandidates = Object.values(currentSnapshot.players)
        .filter((player) => player.presence !== "offline")
        .map((player) => player.id)
        .sort();
      
      const resolverId = resolverCandidates[0] ?? Object.keys(currentSnapshot.players).sort()[0];
      
      if (resolverId === playerId) {
        await broadcastRoomEvent(roomId, "SYNC_AFTER_TURN", currentSnapshot);
      }
    });

    channel.subscribe((status) => {
      if (status === "SUBSCRIBED") {
        activeRoomChannels.set(roomId, channel);
        // Pedir sincronización al canal por si nos perdimos el evento mientras estábamos desconectados o cambiando de pestaña
        broadcastRoomEvent(roomId, "REQUEST_SYNC" as any, { playerId });
      }

      if (status === "CHANNEL_ERROR") {
        setLastError("No se pudo conectar al canal de la sala.");
      }
    });

    return () => {
      const activeChannel = activeRoomChannels.get(roomId);
      if (activeChannel === channel) {
        activeRoomChannels.delete(roomId);
      }

      resolverStateRef.current = null;
      supabase.removeChannel(channel);
    };
  }, [playerId, roomId, setLastError, setLastReveal, setMeta, setPendingSelection, setSnapshot, setWaitingForPlayers]);
}

async function waitForSubscribed(channel: RealtimeChannel): Promise<"SUBSCRIBED" | "CHANNEL_ERROR" | "TIMED_OUT"> {
  return new Promise((resolve) => {
    const timeout = window.setTimeout(() => resolve("TIMED_OUT"), 5_000);

    channel.subscribe((status) => {
      if (status === "SUBSCRIBED") {
        window.clearTimeout(timeout);
        resolve("SUBSCRIBED");
      }

      if (status === "CHANNEL_ERROR") {
        window.clearTimeout(timeout);
        resolve("CHANNEL_ERROR");
      }

      if (status === "TIMED_OUT") {
        window.clearTimeout(timeout);
        resolve("TIMED_OUT");
      }
    });
  });
}

export async function broadcastRoomEvent<TType extends keyof RoomEventMap>(
  roomId: string,
  event: TType,
  payload: RoomEventMap[TType]
): Promise<"ok" | "error" | "timed out"> {
  const supabase = getSupabaseBrowserClient();
  const activeChannel = activeRoomChannels.get(roomId);
  if (activeChannel) {
    return activeChannel.send({
      type: "broadcast",
      event,
      payload,
    });
  }

  const channel: RealtimeChannel = supabase.channel(`room:${roomId}`, {
    config: {
      broadcast: {
        self: true,
      },
    },
  });

  const status = await waitForSubscribed(channel);
  if (status === "CHANNEL_ERROR") {
    supabase.removeChannel(channel);
    return "error";
  }

  if (status === "TIMED_OUT") {
    supabase.removeChannel(channel);
    return "timed out";
  }

  const result = await channel.send({
    type: "broadcast",
    event,
    payload,
  });

  supabase.removeChannel(channel);
  return result;
}
