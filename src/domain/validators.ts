import { SelectCardPayload, RoomStatus } from "./protocol";

type ValidationResult =
  | { ok: true }
  | {
      ok: false;
      reason:
        | "INVALID_PAYLOAD"
        | "MISSING_CARD"
        | "INVALID_TIMESTAMP"
        | "NOT_IN_ACTION_PHASE"
        | "CHOPSTICKS_REQUIRED";
      message: string;
    };

export function isActionPhase(status: RoomStatus): boolean {
  return status === "ROUND_1" || status === "ROUND_2" || status === "ROUND_3";
}

export function validateSelectCardPayload(payload: unknown): ValidationResult {
  if (typeof payload !== "object" || payload === null) {
    return { ok: false, reason: "INVALID_PAYLOAD", message: "Payload must be an object." };
  }

  const candidate = payload as Partial<SelectCardPayload>;

  if (
    typeof candidate.cardId !== "string" &&
    !Array.isArray(candidate.cardId)
  ) {
    return { ok: false, reason: "MISSING_CARD", message: "cardId is required and must be a string or array of strings." };
  }

  if (candidate.useChopsticks && (!Array.isArray(candidate.cardId) || candidate.cardId.length !== 2)) {
     return { ok: false, reason: "INVALID_PAYLOAD", message: "With chopsticks you must select exactly two cards." };
  }

  if (typeof candidate.timestamp !== "number" || !Number.isFinite(candidate.timestamp) || candidate.timestamp <= 0) {
    return {
      ok: false,
      reason: "INVALID_TIMESTAMP",
      message: "timestamp must be a positive finite number.",
    };
  }

  if (typeof candidate.useChopsticks !== "boolean") {
    return {
      ok: false,
      reason: "INVALID_PAYLOAD",
      message: "useChopsticks must be boolean.",
    };
  }

  if (candidate.useWasabi !== undefined && typeof candidate.useWasabi !== "boolean") {
    return {
      ok: false,
      reason: "INVALID_PAYLOAD",
      message: "useWasabi must be boolean when provided.",
    };
  }

  return { ok: true };
}

export function validateSelectCardInContext(args: {
  status: RoomStatus;
  payload: SelectCardPayload;
  handCardIds: readonly string[];
  availableChopsticks: number;
}): ValidationResult {
  if (!isActionPhase(args.status)) {
    return {
      ok: false,
      reason: "NOT_IN_ACTION_PHASE",
      message: "Current room status does not accept SELECT_CARD.",
    };
  }

  const cardsToCheck = Array.isArray(args.payload.cardId) ? args.payload.cardId : [args.payload.cardId];
  for (const cid of cardsToCheck) {
    if (!args.handCardIds.includes(cid)) {
      return {
        ok: false,
        reason: "MISSING_CARD",
        message: "One or more selected cards are not in the player's hand.",
      };
    }
  }

  if (args.payload.useChopsticks && args.availableChopsticks <= 0) {
    return {
      ok: false,
      reason: "CHOPSTICKS_REQUIRED",
      message: "Cannot use chopsticks when none are available.",
    };
  }

  return { ok: true };
}
