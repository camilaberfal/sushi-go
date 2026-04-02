import { CardType } from "./types";

export type RoomStatus = "LOBBY" | "ROUND_1" | "ROUND_2" | "ROUND_3" | "WAITING_SCOREBOARD" | "FINAL_PODIUM";

export type PlayerPresence = "online" | "offline" | "bot";

export type SelectCardPayload = {
  playerId?: string;
  cardId: string;
  timestamp: number;
  useChopsticks: boolean;
};

export type InvalidActionReason =
  | "ROUND_ALREADY_RESOLVED"
  | "CARD_NOT_IN_HAND"
  | "CHOPSTICKS_NOT_AVAILABLE"
  | "PLAYER_NOT_IN_ROOM"
  | "STATE_NOT_ACCEPTING_ACTIONS";

export type InvalidActionPayload = {
  playerId: string;
  reason: InvalidActionReason;
  message: string;
};

export type RevealCardEntry = {
  playerId: string;
  cardId: string;
  cardType: CardType;
  useChopsticks: boolean;
};

export type SyncPlayerState = {
  id: string;
  hand: string[];
  playedCards: string[];
  puddings: number;
  scoreByRound: number[];
  presence: PlayerPresence;
};

export type SyncAfterTurnPayload = {
  roomId: string;
  status: RoomStatus;
  round: number;
  totalRounds: number;
  turn: number;
  players: Record<string, SyncPlayerState>;
};

export type RoomEventMap = {
  SELECT_CARD: SelectCardPayload;
  ALL_CONFIRMED: { round: number; turn: number; totalPlayers: number };
  REVEAL_CARDS: { roomId: string; round: number; turn: number; reveals: RevealCardEntry[] };
  SYNC_AFTER_TURN: SyncAfterTurnPayload;
  INVALID_ACTION: InvalidActionPayload;
};

export type RoomEventType = keyof RoomEventMap;

export type RoomEvent<TType extends RoomEventType = RoomEventType> = {
  type: TType;
  payload: RoomEventMap[TType];
};

export function createRoomEvent<TType extends RoomEventType>(
  type: TType,
  payload: RoomEventMap[TType]
): RoomEvent<TType> {
  return { type, payload };
}
