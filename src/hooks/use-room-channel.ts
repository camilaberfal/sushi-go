"use client";

import { useEffect } from "react";
import { RealtimeChannel } from "@supabase/supabase-js";

import { RoomEventMap } from "@/domain/protocol";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";
import { useRoomStore } from "@/store/room-store";

type UseRoomChannelArgs = {
  roomId: string;
  playerId: string;
};

export function useRoomChannel({ roomId, playerId }: UseRoomChannelArgs) {
  const setMeta = useRoomStore((state) => state.setMeta);
  const setSnapshot = useRoomStore((state) => state.setSnapshot);
  const setLastError = useRoomStore((state) => state.setLastError);
  const setWaitingForPlayers = useRoomStore((state) => state.setWaitingForPlayers);
  const setPendingSelection = useRoomStore((state) => state.setPendingSelection);
  const setLastReveal = useRoomStore((state) => state.setLastReveal);

  useEffect(() => {
    setMeta({ roomId, playerId });

    const supabase = getSupabaseBrowserClient();
    const channel = supabase.channel(`room:${roomId}`);

    const bind = <TType extends keyof RoomEventMap>(event: TType, handler: (payload: RoomEventMap[TType]) => void) => {
      channel.on("broadcast", { event }, (packet) => {
        handler(packet.payload as RoomEventMap[TType]);
      });
    };

    bind("ALL_CONFIRMED", () => {
      setWaitingForPlayers(false);
    });

    bind("SYNC_AFTER_TURN", (payload) => {
      setSnapshot(payload);
      setPendingSelection(null);
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

    channel.subscribe((status) => {
      if (status === "CHANNEL_ERROR") {
        setLastError("No se pudo conectar al canal de la sala.");
      }
    });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [playerId, roomId, setLastError, setLastReveal, setMeta, setPendingSelection, setSnapshot, setWaitingForPlayers]);
}

export async function broadcastRoomEvent<TType extends keyof RoomEventMap>(
  roomId: string,
  event: TType,
  payload: RoomEventMap[TType]
): Promise<"ok" | "error" | "timed out"> {
  const supabase = getSupabaseBrowserClient();
  const channel: RealtimeChannel = supabase.channel(`room:${roomId}`);

  await channel.subscribe();

  const result = await channel.send({
    type: "broadcast",
    event,
    payload,
  });

  supabase.removeChannel(channel);
  return result;
}
