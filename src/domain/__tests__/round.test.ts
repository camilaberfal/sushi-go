import { buildFullDeck, countCardsByType, dealHands, shuffleDeck } from "../deck";
import { CARD_DEFINITIONS } from "../cards";
import { getRoundCount, passHandsToLeft, removeSelectedCardFromHand } from "../round";

function assertEqual<T>(actual: T, expected: T, message: string): void {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new Error(`${message}\nExpected: ${JSON.stringify(expected)}\nActual: ${JSON.stringify(actual)}`);
  }
}

export function runRoundTests(): void {
  const deck = buildFullDeck();
  assertEqual(deck.length, 108, "Full deck should have 108 cards");

  const counts = countCardsByType(deck);
  for (const definition of CARD_DEFINITIONS) {
    assertEqual(counts[definition.type], definition.count, `Count mismatch for ${definition.type}`);
  }

  const hands2 = dealHands(deck, 2);
  assertEqual(hands2.hands.length, 2, "2-player deal should have 2 hands");
  assertEqual(hands2.hands[0].length, 10, "2-player hand size should be 10");

  const hands5 = dealHands(deck, 5);
  assertEqual(hands5.hands.length, 5, "5-player deal should have 5 hands");
  assertEqual(hands5.hands[0].length, 7, "5-player hand size should be 7");

  const source = [1, 2, 3, 4];
  const alwaysZero = () => 0;
  const shuffled = shuffleDeck(source, alwaysZero);
  assertEqual(shuffled, [2, 3, 4, 1], "Deterministic shuffle should be stable");

  assertEqual(getRoundCount(2), 5, "Rounds for 2 players should be 5");
  assertEqual(getRoundCount(3), 4, "Rounds for 3 players should be 4");
  assertEqual(getRoundCount(4), 3, "Rounds for 4 players should be 3");
  assertEqual(getRoundCount(5), 3, "Rounds for 5 players should be 3");

  const hands = [["a"], ["b"], ["c"]];
  assertEqual(passHandsToLeft(hands), [["b"], ["c"], ["a"]], "Hands should rotate left");

  const hand = [
    { id: "tempura-1", type: "tempura" as const },
    { id: "sashimi-1", type: "sashimi" as const },
  ];

  const nextHand = removeSelectedCardFromHand(hand, "tempura-1");
  assertEqual(nextHand, [{ id: "sashimi-1", type: "sashimi" }], "Selected card should be removed");
}
