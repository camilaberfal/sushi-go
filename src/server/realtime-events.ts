import {
  InvalidActionPayload,
  RevealCardEntry,
  RoomEvent,
  RoomEventMap,
  RoomEventType,
  SelectCardPayload,
  SyncAfterTurnPayload,
  createRoomEvent,
} from "@/domain/protocol";

export const REALTIME_EVENTS = {
  SELECT_CARD: "SELECT_CARD",
  ALL_CONFIRMED: "ALL_CONFIRMED",
  REVEAL_CARDS: "REVEAL_CARDS",
  SYNC_AFTER_TURN: "SYNC_AFTER_TURN",
  INVALID_ACTION: "INVALID_ACTION",
} as const;

export type RealtimeEventName = (typeof REALTIME_EVENTS)[keyof typeof REALTIME_EVENTS];

export type RealtimeEnvelope<TType extends RoomEventType = RoomEventType> = {
  event: RealtimeEventName;
  data: RoomEventMap[TType];
};

export function toRealtimeEnvelope<TType extends RoomEventType>(event: RoomEvent<TType>): RealtimeEnvelope<TType> {
  return {
    event: event.type,
    data: event.payload,
  };
}

export function buildSelectCardEvent(payload: SelectCardPayload): RoomEvent<"SELECT_CARD"> {
  return createRoomEvent("SELECT_CARD", payload);
}

export function buildAllConfirmedEvent(payload: RoomEventMap["ALL_CONFIRMED"]): RoomEvent<"ALL_CONFIRMED"> {
  return createRoomEvent("ALL_CONFIRMED", payload);
}

export function buildRevealCardsEvent(payload: {
  roomId: string;
  round: number;
  turn: number;
  reveals: RevealCardEntry[];
}): RoomEvent<"REVEAL_CARDS"> {
  return createRoomEvent("REVEAL_CARDS", payload);
}

export function buildSyncAfterTurnEvent(payload: SyncAfterTurnPayload): RoomEvent<"SYNC_AFTER_TURN"> {
  return createRoomEvent("SYNC_AFTER_TURN", payload);
}

export function buildInvalidActionEvent(payload: InvalidActionPayload): RoomEvent<"INVALID_ACTION"> {
  return createRoomEvent("INVALID_ACTION", payload);
}
