"use client";

import { cn } from "@/lib/utils";
import { getCardAssetFromId } from "@/components/game/card-art";

type HandGroupedProps = {
  regularGroups: Record<string, string[]>;
  specials: string[];
  selectedCardId: string | null;
  draggingCardId?: string | null;
  disabled?: boolean;
  onSelectCard: (cardId: string) => void;
  onDragStartCard?: (cardId: string) => void;
  onDragEndCard?: () => void;
};

function CardButton({
  cardId,
  selected,
  dragging,
  disabled,
  onClick,
  onDragStart,
  onDragEnd,
}: {
  cardId: string;
  selected: boolean;
  dragging: boolean;
  disabled?: boolean;
  onClick: () => void;
  onDragStart: () => void;
  onDragEnd: () => void;
}) {
  return (
    <button
      className={cn(
        "relative h-44 w-[7.5rem] overflow-hidden rounded-xl border-2 bg-white shadow-md transition duration-200",
        !disabled && "hover:-translate-y-2 hover:scale-105 active:scale-95",
        selected ? "border-accent ring-2 ring-accent/60" : "border-border",
        dragging && "ring-4 ring-primary/60 border-primary scale-105",
        disabled ? "opacity-70" : "cursor-pointer"
      )}
      disabled={disabled}
      onClick={onClick}
      draggable={!disabled}
      onDragStart={(event) => {
        event.dataTransfer.setData("text/plain", cardId);
        event.dataTransfer.effectAllowed = "move";
        onDragStart();
      }}
      onDragEnd={onDragEnd}
      type="button"
    >
      <img alt={cardId} className="h-full w-full object-cover" src={getCardAssetFromId(cardId)} />
    </button>
  );
}

export function HandGrouped({ regularGroups, specials, selectedCardId, draggingCardId, disabled, onSelectCard, onDragStartCard, onDragEndCard }: HandGroupedProps) {
  return (
    <div className="space-y-5">
      <div>
        <p className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">Normales y comodines</p>
      </div>
      <div className="flex flex-wrap gap-4">
        {Object.entries(regularGroups).map(([groupKey, cards]) => (
          <div className="flex -space-x-14" key={groupKey}>
            {cards.map((cardId) => (
              <CardButton
                cardId={cardId}
                disabled={disabled}
                dragging={draggingCardId === cardId}
                key={cardId}
                onClick={() => onSelectCard(cardId)}
                onDragStart={() => onDragStartCard?.(cardId)}
                onDragEnd={() => onDragEndCard?.()}
                selected={selectedCardId === cardId}
              />
            ))}
          </div>
        ))}
      </div>

      {specials.length > 0 ? (
        <div>
          <p className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">Especiales</p>
          <div className="flex flex-wrap gap-4">
          {specials.map((cardId) => (
            <CardButton
              cardId={cardId}
              disabled={disabled}
              dragging={draggingCardId === cardId}
              key={cardId}
              onClick={() => onSelectCard(cardId)}
              onDragStart={() => onDragStartCard?.(cardId)}
              onDragEnd={() => onDragEndCard?.()}
              selected={selectedCardId === cardId}
            />
          ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
