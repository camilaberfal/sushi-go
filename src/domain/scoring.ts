import { getMakiIcons, getNigiriBaseValue, isNigiri } from "./cards";
import { CardType, FinalScoreResult, PlayerRoundBreakdown } from "./types";

type MakiResult = {
  pointsByPlayer: number[];
};

function splitPoints(points: number, playerCount: number): number {
  return Math.floor(points / playerCount);
}

function countByType(cards: readonly CardType[]): Record<CardType, number> {
  const counts: Record<CardType, number> = {
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
    counts[card] += 1;
  }

  return counts;
}

export function scoreTempura(count: number): number {
  return Math.floor(count / 2) * 5;
}

export function scoreSashimi(count: number): number {
  return Math.floor(count / 3) * 10;
}

export function scoreGyoza(count: number): number {
  if (count <= 0) return 0;
  if (count === 1) return 1;
  if (count === 2) return 3;
  if (count === 3) return 6;
  if (count === 4) return 10;
  return 15;
}

export function scoreNigiriWithWasabi(cardsInPlayOrder: readonly CardType[]): number {
  let openWasabi = 0;
  let points = 0;

  for (const card of cardsInPlayOrder) {
    if (card === "wasabi") {
      openWasabi += 1;
      continue;
    }

    if (isNigiri(card)) {
      const base = getNigiriBaseValue(card);
      if (openWasabi > 0) {
        points += base * 3;
        openWasabi -= 1;
      } else {
        points += base;
      }
    }
  }

  return points;
}

export function getMakiIconsTotal(cards: readonly CardType[]): number {
  return cards.reduce((sum, card) => sum + getMakiIcons(card), 0);
}

export function scoreMakiForPlayers(makiIconsByPlayer: readonly number[]): MakiResult {
  const pointsByPlayer = Array.from({ length: makiIconsByPlayer.length }, () => 0);

  const firstScore = Math.max(...makiIconsByPlayer);
  if (firstScore <= 0) {
    return { pointsByPlayer };
  }

  const firstWinners = makiIconsByPlayer
    .map((score, index) => ({ score, index }))
    .filter((entry) => entry.score === firstScore)
    .map((entry) => entry.index);

  const firstPoints = splitPoints(6, firstWinners.length);
  for (const playerIndex of firstWinners) {
    pointsByPlayer[playerIndex] += firstPoints;
  }

  // If first place is tied, second place points are not awarded.
  if (firstWinners.length > 1) {
    return { pointsByPlayer };
  }

  const otherScores = makiIconsByPlayer.filter((_, index) => !firstWinners.includes(index));
  const secondScore = Math.max(0, ...otherScores);

  // A second place with zero maki icons does not receive points.
  if (secondScore <= 0) {
    return { pointsByPlayer };
  }

  const secondWinners = makiIconsByPlayer
    .map((score, index) => ({ score, index }))
    .filter((entry) => entry.score === secondScore)
    .map((entry) => entry.index);

  const secondPoints = splitPoints(3, secondWinners.length);
  for (const playerIndex of secondWinners) {
    pointsByPlayer[playerIndex] += secondPoints;
  }

  return { pointsByPlayer };
}

export function scorePuddings(puddingsByPlayer: readonly number[]): number[] {
  const totalPlayers = puddingsByPlayer.length;
  const pointsByPlayer = Array.from({ length: totalPlayers }, () => 0);
  const maxPudding = Math.max(...puddingsByPlayer);
  const minPudding = Math.min(...puddingsByPlayer);

  if (maxPudding === minPudding) {
    return pointsByPlayer;
  }

  const maxWinners = puddingsByPlayer
    .map((count, index) => ({ count, index }))
    .filter((entry) => entry.count === maxPudding)
    .map((entry) => entry.index);

  const plusPoints = splitPoints(6, maxWinners.length);
  for (const playerIndex of maxWinners) {
    pointsByPlayer[playerIndex] += plusPoints;
  }

  if (totalPlayers === 2) {
    return pointsByPlayer;
  }

  const minWinners = puddingsByPlayer
    .map((count, index) => ({ count, index }))
    .filter((entry) => entry.count === minPudding)
    .map((entry) => entry.index);

  const minusPoints = splitPoints(6, minWinners.length);
  for (const playerIndex of minWinners) {
    pointsByPlayer[playerIndex] -= minusPoints;
  }

  return pointsByPlayer;
}

export function scorePlayerRound(cardsInPlayOrder: readonly CardType[]): PlayerRoundBreakdown {
  const counts = countByType(cardsInPlayOrder);
  const tempuraPoints = scoreTempura(counts.tempura);
  const sashimiPoints = scoreSashimi(counts.sashimi);
  const gyozaPoints = scoreGyoza(counts.gyoza);
  const nigiriPoints = scoreNigiriWithWasabi(cardsInPlayOrder);

  return {
    tempuraPoints,
    sashimiPoints,
    gyozaPoints,
    nigiriPoints,
    makiIcons: getMakiIconsTotal(cardsInPlayOrder),
    makiPoints: 0,
    puddingCount: counts.pudding,
    totalRoundPoints: tempuraPoints + sashimiPoints + gyozaPoints + nigiriPoints,
  };
}

export function scoreRoundForPlayers(playersCardsInPlayOrder: readonly CardType[][]): PlayerRoundBreakdown[] {
  const base = playersCardsInPlayOrder.map((cards) => scorePlayerRound(cards));
  const maki = scoreMakiForPlayers(base.map((entry) => entry.makiIcons));

  return base.map((entry, index) => {
    const makiPoints = maki.pointsByPlayer[index] ?? 0;
    return {
      ...entry,
      makiPoints,
      totalRoundPoints: entry.totalRoundPoints + makiPoints,
    };
  });
}

export function applyFinalPuddingScoring(
  roundPointsByPlayer: readonly number[],
  puddingsByPlayer: readonly number[]
): FinalScoreResult[] {
  const puddingPoints = scorePuddings(puddingsByPlayer);
  return roundPointsByPlayer.map((roundPoints, index) => ({
    totalPoints: roundPoints + (puddingPoints[index] ?? 0),
    puddingPoints: puddingPoints[index] ?? 0,
  }));
}
