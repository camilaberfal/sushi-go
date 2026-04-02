import { SyncPlayerState } from "@/domain/protocol";
import { RoomStoreState } from "@/store/room-store";

const SPECIAL_CARD_PREFIX = ["wasabi", "chopsticks", "palillos"];

function parseCardTypeFromCardId(cardId: string): string {
  const separator = cardId.lastIndexOf("-");
  if (separator <= 0) {
    return cardId;
  }

  return cardId.slice(0, separator);
}

function isSpecialCard(cardId: string): boolean {
  const cardType = parseCardTypeFromCardId(cardId);
  return SPECIAL_CARD_PREFIX.some((prefix) => cardType.startsWith(prefix));
}

export function selectCurrentPlayer(playerId: string): (state: RoomStoreState) => SyncPlayerState | null {
  return (state) => {
    if (!state.snapshot) return null;
    return state.snapshot.players[playerId] ?? null;
  };
}

export function selectGroupedHand(playerId: string): (state: RoomStoreState) => {
  regularGroups: Record<string, string[]>;
  specials: string[];
} {
  return (state) => {
    const player = state.snapshot?.players[playerId];
    if (!player) {
      return { regularGroups: {}, specials: [] };
    }

    const regularGroups: Record<string, string[]> = {};
    const specials: string[] = [];

    for (const cardId of player.hand) {
      if (isSpecialCard(cardId)) {
        specials.push(cardId);
        continue;
      }

      const cardType = parseCardTypeFromCardId(cardId);
      regularGroups[cardType] = regularGroups[cardType] ? [...regularGroups[cardType], cardId] : [cardId];
    }

    return { regularGroups, specials };
  };
}

export function selectProjectedRoundScore(playerId: string): (state: RoomStoreState) => number {
  return (state) => {
    const player = state.snapshot?.players[playerId];
    if (!player) return 0;
    return player.scoreByRound.reduce((sum: number, value: number) => sum + value, 0);
  };
}

export function selectPuddings(playerId: string): (state: RoomStoreState) => number {
  return (state) => state.snapshot?.players[playerId]?.puddings ?? 0;
}
