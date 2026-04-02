import { CARD_DEFINITIONS, HAND_SIZE_BY_PLAYER_COUNT } from "./cards";
import { CardInstance, CardType, PlayerCount } from "./types";

function assertValidPlayerCount(playerCount: number): asserts playerCount is PlayerCount {
  if (playerCount < 2 || playerCount > 5) {
    throw new Error("Player count must be between 2 and 5.");
  }
}

export function buildFullDeck(): CardInstance[] {
  const deck: CardInstance[] = [];

  for (const card of CARD_DEFINITIONS) {
    for (let i = 1; i <= card.count; i += 1) {
      deck.push({
        id: `${card.type}-${i}`,
        type: card.type,
      });
    }
  }

  return deck;
}

export function countCardsByType(cards: readonly CardInstance[]): Record<CardType, number> {
  const initial: Record<CardType, number> = {
    tempura: 0,
    sashimi: 0,
    gyoza: 0,
    maki_1: 0,
    maki_2: 0,
    maki_3: 0,
    nigiri_egg: 0,
    nigiri_salmon: 0,
    nigiri_squid: 0,
    pudding: 0,
    wasabi: 0,
    chopsticks: 0,
  };

  for (const card of cards) {
    initial[card.type] += 1;
  }

  return initial;
}

export function shuffleDeck<T>(deck: readonly T[], rng: () => number = Math.random): T[] {
  const shuffled = [...deck];

  for (let i = shuffled.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  return shuffled;
}

export function dealHands(
  deck: readonly CardInstance[],
  playerCount: number
): { hands: CardInstance[][]; remainder: CardInstance[] } {
  assertValidPlayerCount(playerCount);

  const cardsPerPlayer = HAND_SIZE_BY_PLAYER_COUNT[playerCount];
  const requiredCards = cardsPerPlayer * playerCount;

  if (deck.length < requiredCards) {
    throw new Error("Deck does not contain enough cards to deal this hand.");
  }

  const hands: CardInstance[][] = [];
  for (let playerIndex = 0; playerIndex < playerCount; playerIndex += 1) {
    const start = playerIndex * cardsPerPlayer;
    hands.push(deck.slice(start, start + cardsPerPlayer));
  }

  return {
    hands,
    remainder: deck.slice(requiredCards),
  };
}
