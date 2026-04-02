import gyoza from "@/app/assets/cards/gyoza.png";
import maki1 from "@/app/assets/cards/makis-x1.png";
import maki2 from "@/app/assets/cards/makis-x2.png";
import maki3 from "@/app/assets/cards/makis-x3.png";
import nigiriSquid from "@/app/assets/cards/nigiri-de-calamar.png";
import nigiriEgg from "@/app/assets/cards/nigiri-de-huevo.png";
import nigiriSalmon from "@/app/assets/cards/nigiri-de-salmon.png";
import chopsticks from "@/app/assets/cards/palillos.png";
import pudding from "@/app/assets/cards/pudin.png";
import cardBack from "@/app/assets/cards/reverso.png";
import sashimi from "@/app/assets/cards/sashimi.png";
import tempura from "@/app/assets/cards/tempura.png";
import wasabi from "@/app/assets/cards/wasabi.png";

const CARD_ASSET_BY_TYPE: Record<string, string> = {
  tempura: tempura.src,
  sashimi: sashimi.src,
  gyoza: gyoza.src,
  maki_1: maki1.src,
  maki_2: maki2.src,
  maki_3: maki3.src,
  nigiri_egg: nigiriEgg.src,
  nigiri_salmon: nigiriSalmon.src,
  nigiri_squid: nigiriSquid.src,
  pudding: pudding.src,
  wasabi: wasabi.src,
  chopsticks: chopsticks.src,
};

function parseCardTypeFromCardId(cardId: string): string {
  const separator = cardId.lastIndexOf("-");
  if (separator <= 0) return cardId;
  return cardId.slice(0, separator);
}

export function getCardAssetFromId(cardId: string): string {
  const cardType = parseCardTypeFromCardId(cardId);
  return CARD_ASSET_BY_TYPE[cardType] ?? cardBack.src;
}

export const CARD_BACK_ASSET = cardBack.src;
