import { SyncPlayerState } from "@/domain/protocol";
import { RoomStoreState } from "@/store/room-store";
import { scoreRoundForPlayers } from "@/domain/scoring";
import { CardType } from "@/domain/types";

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
    if (!state.snapshot) return 0;
    
    const playersArr = Object.values(state.snapshot.players);
    const myIndex = playersArr.findIndex(p => p.id === playerId);
    if (myIndex === -1) return 0;

    const myBaseScore = playersArr[myIndex].scoreByRound.reduce((sum: number, value: number) => sum + value, 0);

    const cardsInPlayArr = playersArr.map(p => p.playedCards.map(cardId => parseCardTypeFromCardId(cardId) as CardType));
    const liveScores = scoreRoundForPlayers(cardsInPlayArr);

    return myBaseScore + (liveScores[myIndex]?.totalRoundPoints ?? 0);
  };
}

export function selectPuddings(playerId: string): (state: RoomStoreState) => number {
  return (state) => {
    const basePuddings = state.snapshot?.players[playerId]?.puddings ?? 0;
    
    if (!state.snapshot) return basePuddings;

    const playersArr = Object.values(state.snapshot.players);
    const myIndex = playersArr.findIndex(p => p.id === playerId);
    if (myIndex === -1) return basePuddings;

    const cardsInPlayArr = playersArr.map(p => p.playedCards.map(cardId => parseCardTypeFromCardId(cardId) as CardType));
    const liveScores = scoreRoundForPlayers(cardsInPlayArr);

    return basePuddings + (liveScores[myIndex]?.puddingCount ?? 0);
  };
}
