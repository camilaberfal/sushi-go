import { ROUNDS_BY_PLAYER_COUNT } from "./cards";
import { CardInstance, PlayerCount } from "./types";

export function getRoundCount(playerCount: PlayerCount): number {
  return ROUNDS_BY_PLAYER_COUNT[playerCount];
}

export function passHandsToLeft<T>(hands: readonly T[][]): T[][] {
  if (hands.length <= 1) return hands.map((hand) => [...hand]);

  // Each player receives the hand from the player to their right.
  return hands.map((_, playerIndex) => {
    const rightPlayerIndex = (playerIndex + 1) % hands.length;
    return [...hands[rightPlayerIndex]];
  });
}

export function removeSelectedCardFromHand(hand: readonly CardInstance[], cardId: string): CardInstance[] {
  const index = hand.findIndex((card) => card.id === cardId);
  if (index < 0) {
    throw new Error(`Card ${cardId} is not in the player hand.`);
  }

  const next = [...hand];
  next.splice(index, 1);
  return next;
}

export function removeSelectedCardsFromHand(
  hand: readonly CardInstance[],
  cardIds: readonly string[]
): CardInstance[] {
  let next = [...hand];
  for (const cardId of cardIds) {
    next = removeSelectedCardFromHand(next, cardId);
  }
  return next;
}
