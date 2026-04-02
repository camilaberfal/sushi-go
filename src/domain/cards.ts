import { CardDefinition, CardType, PlayerCount } from "./types";

export const CARD_DEFINITIONS: readonly CardDefinition[] = [
  { type: "tempura", count: 14, assetPath: "src/app/assets/cards/tempura.png", category: "set" },
  { type: "sashimi", count: 14, assetPath: "src/app/assets/cards/sashimi.png", category: "set" },
  { type: "gyoza", count: 14, assetPath: "src/app/assets/cards/gyoza.png", category: "set" },
  { type: "maki_2", count: 12, assetPath: "src/app/assets/cards/makis-x2.png", category: "maki" },
  { type: "maki_3", count: 8, assetPath: "src/app/assets/cards/makis-x3.png", category: "maki" },
  { type: "maki_1", count: 6, assetPath: "src/app/assets/cards/makis-x1.png", category: "maki" },
  {
    type: "nigiri_salmon",
    count: 10,
    assetPath: "src/app/assets/cards/nigiri-de-salmon.png",
    category: "nigiri",
  },
  { type: "pudding", count: 10, assetPath: "src/app/assets/cards/pudin.png", category: "dessert" },
  {
    type: "nigiri_squid",
    count: 5,
    assetPath: "src/app/assets/cards/nigiri-de-calamar.png",
    category: "nigiri",
  },
  {
    type: "nigiri_egg",
    count: 5,
    assetPath: "src/app/assets/cards/nigiri-de-huevo.png",
    category: "nigiri",
  },
  { type: "wasabi", count: 6, assetPath: "src/app/assets/cards/wasabi.png", category: "special" },
  {
    type: "chopsticks",
    count: 4,
    assetPath: "src/app/assets/cards/palillos.png",
    category: "special",
  },
] as const;

export const ALL_CARD_TYPES: readonly CardType[] = CARD_DEFINITIONS.map((card) => card.type);

export const HAND_SIZE_BY_PLAYER_COUNT: Record<PlayerCount, number> = {
  2: 10,
  3: 9,
  4: 8,
  5: 7,
};

export const ROUNDS_BY_PLAYER_COUNT: Record<PlayerCount, number> = {
  2: 5,
  3: 4,
  4: 3,
  5: 3,
};

export function getNigiriBaseValue(type: CardType): number {
  if (type === "nigiri_squid") return 3;
  if (type === "nigiri_salmon") return 2;
  if (type === "nigiri_egg") return 1;
  return 0;
}

export function getMakiIcons(type: CardType): number {
  if (type === "maki_1") return 1;
  if (type === "maki_2") return 2;
  if (type === "maki_3") return 3;
  return 0;
}

export function isNigiri(type: CardType): boolean {
  return type === "nigiri_squid" || type === "nigiri_salmon" || type === "nigiri_egg";
}
