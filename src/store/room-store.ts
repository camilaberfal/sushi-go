import { useSyncExternalStore } from "react";

import { RevealCardEntry, SelectCardPayload, SyncAfterTurnPayload } from "@/domain/protocol";

export type LocalPlayerMeta = {
  playerId: string;
  roomId: string;
};

export type RoomStoreState = {
  meta: LocalPlayerMeta | null;
  snapshot: SyncAfterTurnPayload | null;
  waitingForPlayers: boolean;
  pendingSelection: SelectCardPayload | null;
  lastReveal: RevealCardEntry[];
  lastError: string | null;
  setMeta: (meta: LocalPlayerMeta) => void;
  setSnapshot: (snapshot: SyncAfterTurnPayload) => void;
  setWaitingForPlayers: (value: boolean) => void;
  setPendingSelection: (selection: SelectCardPayload | null) => void;
  setLastReveal: (reveal: RevealCardEntry[]) => void;
  setLastError: (message: string | null) => void;
  resetRoomState: () => void;
};

const initialRoomState: Omit<RoomStoreState, "setMeta" | "setSnapshot" | "setWaitingForPlayers" | "setPendingSelection" | "setLastReveal" | "setLastError" | "resetRoomState"> = {
  meta: null,
  snapshot: null,
  waitingForPlayers: false,
  pendingSelection: null,
  lastReveal: [],
  lastError: null,
};

type Listener = () => void;

const listeners = new Set<Listener>();

let storeState: RoomStoreState;

function notifyListeners() {
  listeners.forEach((listener) => listener());
}

function setStoreState(partial: Partial<RoomStoreState>) {
  storeState = { ...storeState, ...partial };
  notifyListeners();
}

function buildStoreState(): RoomStoreState {
  return {
    ...initialRoomState,
    setMeta: (meta: LocalPlayerMeta) => setStoreState({ meta }),
    setSnapshot: (snapshot: SyncAfterTurnPayload) => setStoreState({ snapshot }),
    setWaitingForPlayers: (waitingForPlayers: boolean) => setStoreState({ waitingForPlayers }),
    setPendingSelection: (pendingSelection: SelectCardPayload | null) => setStoreState({ pendingSelection }),
    setLastReveal: (lastReveal: RevealCardEntry[]) => setStoreState({ lastReveal }),
    setLastError: (lastError: string | null) => setStoreState({ lastError }),
    resetRoomState: () => setStoreState({ ...initialRoomState }),
  };
}

storeState = buildStoreState();

function subscribe(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getRoomStoreState(): RoomStoreState {
  return storeState;
}

export function useRoomStore<T>(selector: (state: RoomStoreState) => T): T {
  return useSyncExternalStore(subscribe, () => selector(storeState), () => selector(storeState));
}
