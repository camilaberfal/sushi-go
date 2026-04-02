import {
  applyFinalPuddingScoring,
  scoreGyoza,
  scoreMakiForPlayers,
  scoreNigiriWithWasabi,
  scorePlayerRound,
  scorePuddings,
  scoreRoundForPlayers,
  scoreSashimi,
  scoreTempura,
} from "../scoring";

function assertEqual<T>(actual: T, expected: T, message: string): void {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new Error(`${message}\nExpected: ${JSON.stringify(expected)}\nActual: ${JSON.stringify(actual)}`);
  }
}

export function runScoringTests(): void {
  assertEqual(scoreTempura(1), 0, "Tempura score for 1 card should be 0");
  assertEqual(scoreTempura(2), 5, "Tempura score for 2 cards should be 5");
  assertEqual(scoreTempura(5), 10, "Tempura score for 5 cards should be 10");

  assertEqual(scoreSashimi(2), 0, "Sashimi score for 2 cards should be 0");
  assertEqual(scoreSashimi(3), 10, "Sashimi score for 3 cards should be 10");
  assertEqual(scoreSashimi(7), 20, "Sashimi score for 7 cards should be 20");

  assertEqual(scoreGyoza(0), 0, "Gyoza score for 0 cards should be 0");
  assertEqual(scoreGyoza(1), 1, "Gyoza score for 1 card should be 1");
  assertEqual(scoreGyoza(2), 3, "Gyoza score for 2 cards should be 3");
  assertEqual(scoreGyoza(3), 6, "Gyoza score for 3 cards should be 6");
  assertEqual(scoreGyoza(4), 10, "Gyoza score for 4 cards should be 10");
  assertEqual(scoreGyoza(10), 15, "Gyoza score for 10 cards should be 15");

  assertEqual(scoreNigiriWithWasabi(["wasabi", "nigiri_squid"]), 9, "Wasabi + squid nigiri");
  assertEqual(
    scoreNigiriWithWasabi(["nigiri_salmon", "wasabi", "nigiri_egg"]),
    5,
    "Salmon before wasabi and egg after wasabi"
  );
  assertEqual(
    scoreNigiriWithWasabi(["wasabi", "wasabi", "nigiri_salmon"]),
    6,
    "Only one nigiri should consume one wasabi"
  );

  assertEqual(scoreMakiForPlayers([4, 4, 2]).pointsByPlayer, [3, 3, 0], "Maki tie on first");
  assertEqual(
    scoreMakiForPlayers([5, 3, 3]).pointsByPlayer,
    [6, 1, 1],
    "Maki unique first and tied second"
  );
  assertEqual(
    scoreMakiForPlayers([2, 0]).pointsByPlayer,
    [6, 0],
    "Second place with zero maki should be 0 points"
  );

  assertEqual(scorePuddings([3, 1]), [6, 0], "Pudding 2-player positive only");
  assertEqual(scorePuddings([2, 2]), [0, 0], "Pudding tie should score zero");
  assertEqual(scorePuddings([4, 2, 0]), [6, 0, -6], "Pudding 3-player min penalty");
  assertEqual(scorePuddings([3, 1, 1]), [6, -3, -3], "Pudding split min penalty");

  assertEqual(
    scorePlayerRound([
      "tempura",
      "tempura",
      "sashimi",
      "sashimi",
      "sashimi",
      "wasabi",
      "nigiri_salmon",
      "maki_3",
      "pudding",
    ]),
    {
      tempuraPoints: 5,
      sashimiPoints: 10,
      gyozaPoints: 0,
      nigiriPoints: 6,
      makiIcons: 3,
      makiPoints: 0,
      puddingCount: 1,
      totalRoundPoints: 21,
    },
    "Player round breakdown"
  );

  const multi = scoreRoundForPlayers([
    ["maki_3", "tempura", "tempura"],
    ["maki_2", "sashimi", "sashimi", "sashimi"],
    ["maki_2", "gyoza", "gyoza"],
  ]);
  assertEqual(
    multi.map((entry) => entry.totalRoundPoints),
    [11, 11, 4],
    "Total points by player in one round"
  );
  assertEqual(
    multi.map((entry) => entry.makiPoints),
    [6, 1, 1],
    "Maki points by player in one round"
  );

  assertEqual(
    applyFinalPuddingScoring([30, 28, 27], [3, 1, 1]),
    [
      { totalPoints: 36, puddingPoints: 6 },
      { totalPoints: 25, puddingPoints: -3 },
      { totalPoints: 24, puddingPoints: -3 },
    ],
    "Final pudding scoring over cumulative rounds"
  );
}
