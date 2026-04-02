"use client";

import { cn } from "@/lib/utils";
import { getCardAssetFromId } from "@/components/game/card-art";

type HandGroupedProps = {
  regularGroups: Record<string, string[]>;
  specials: string[];
  selectedCardId: string | null;
  disabled?: boolean;
  onSelectCard: (cardId: string) => void;
};

function CardButton({
  cardId,
  selected,
  disabled,
  onClick,
}: {
  cardId: string;
  selected: boolean;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      className={cn(
        "relative h-36 w-24 overflow-hidden rounded-xl border-2 bg-white shadow-md transition duration-200",
        !disabled && "hover:-translate-y-2 hover:scale-105 active:scale-95",
        selected ? "border-accent ring-2 ring-accent/60" : "border-border",
        disabled ? "opacity-70" : "cursor-pointer"
      )}
      disabled={disabled}
      onClick={onClick}
      type="button"
    >
      <img alt={cardId} className="h-full w-full object-cover" src={getCardAssetFromId(cardId)} />
    </button>
  );
}

export function HandGrouped({ regularGroups, specials, selectedCardId, disabled, onSelectCard }: HandGroupedProps) {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3">
        {Object.entries(regularGroups).map(([groupKey, cards]) => (
          <div className="flex -space-x-12" key={groupKey}>
            {cards.map((cardId) => (
              <CardButton
                cardId={cardId}
                disabled={disabled}
                key={cardId}
                onClick={() => onSelectCard(cardId)}
                selected={selectedCardId === cardId}
              />
            ))}
          </div>
        ))}
      </div>

      {specials.length > 0 ? (
        <div className="ml-6 flex flex-wrap gap-3 border-l-4 border-accent/60 pl-4">
          {specials.map((cardId) => (
            <CardButton
              cardId={cardId}
              disabled={disabled}
              key={cardId}
              onClick={() => onSelectCard(cardId)}
              selected={selectedCardId === cardId}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}
