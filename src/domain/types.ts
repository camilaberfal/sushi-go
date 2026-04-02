export type PlayerCount = 2 | 3 | 4 | 5;

export type CardType =
  | "tempura"
  | "sashimi"
  | "gyoza"
  | "maki_1"
  | "maki_2"
  | "maki_3"
  | "nigiri_egg"
  | "nigiri_salmon"
  | "nigiri_squid"
  | "pudding"
  | "wasabi"
  | "chopsticks";

export type CardCategory =
  | "set"
  | "maki"
  | "nigiri"
  | "special"
  | "dessert";

export type CardDefinition = {
  type: CardType;
  count: number;
  assetPath: string;
  category: CardCategory;
};

export type CardInstance = {
  id: string;
  type: CardType;
};

export type PlayerRoundBreakdown = {
  tempuraPoints: number;
  sashimiPoints: number;
  gyozaPoints: number;
  nigiriPoints: number;
  makiIcons: number;
  makiPoints: number;
  puddingCount: number;
  totalRoundPoints: number;
};

export type FinalScoreResult = {
  totalPoints: number;
  puddingPoints: number;
};
