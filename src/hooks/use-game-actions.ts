"use client";

import { useCallback } from "react";

import { SelectCardPayload } from "@/domain/protocol";
import { broadcastRoomEvent } from "@/hooks/use-room-channel";
import { useRoomStore } from "@/store/room-store";

type UseGameActionsArgs = {
  roomId: string;
  playerId: string;
};

export function useGameActions({ roomId, playerId }: UseGameActionsArgs) {
  const snapshot = useRoomStore((state) => state.snapshot);
  const setLastError = useRoomStore((state) => state.setLastError);
  const setPendingSelection = useRoomStore((state) => state.setPendingSelection);
  const setWaitingForPlayers = useRoomStore((state) => state.setWaitingForPlayers);

  const selectCard = useCallback(
    async (cardId: string | [string, string], useChopsticks: boolean, useWasabi = false) => {
      const player = snapshot?.players[playerId];
      if (!player) {
        setLastError("No hay estado de jugador para esta sala.");
        return false;
      }

      const cardsToCheck = Array.isArray(cardId) ? cardId : [cardId];
      if (!cardsToCheck.every((id) => player.hand.includes(id))) {
        setLastError("La carta seleccionada no existe en tu mano.");
        return false;
      }

      const payload: SelectCardPayload = {
        playerId,
        cardId,
        useChopsticks,
        useWasabi,
        timestamp: Date.now(),
      };

      setPendingSelection(payload);
      setWaitingForPlayers(true);

      const result = await broadcastRoomEvent(roomId, "SELECT_CARD", payload);
      if (result !== "ok") {
        setLastError("No se pudo enviar la jugada al servidor.");
        setWaitingForPlayers(false);
        return false;
      }

      return true;
    },
    [playerId, roomId, setLastError, setPendingSelection, setWaitingForPlayers, snapshot]
  );

  const clearError = useCallback(() => {
    setLastError(null);
  }, [setLastError]);

  return {
    selectCard,
    clearError,
  };
}
