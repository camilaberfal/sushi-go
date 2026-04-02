"use client";

import { RevealCardEntry } from "@/domain/protocol";
import { getCardAssetFromId } from "@/components/game/card-art";

type RevealLayerProps = {
  open: boolean;
  reveals: RevealCardEntry[];
  onDone?: () => void;
};

export function RevealLayer({ open, reveals, onDone }: RevealLayerProps) {
  if (!open) return null;

  return (
    <div
      className="pointer-events-none fixed inset-0 z-40 flex animate-[reveal-fade_180ms_ease-out] flex-col items-center justify-center bg-black/50 backdrop-blur-sm"
      onAnimationEnd={() => {
        window.setTimeout(() => onDone?.(), 400);
      }}
    >
      <p className="mb-6 animate-[reveal-title_220ms_ease-out] font-heading text-5xl text-accent">RESULTADO</p>

      <div className="flex flex-wrap items-center justify-center gap-3 px-4">
        {reveals.map((entry) => (
          <img
            alt={entry.cardId}
            className="h-36 w-24 animate-[flip-in-hor_400ms_ease-out] rounded-xl border-2 border-accent/70 bg-white object-cover shadow-lg"
            key={`${entry.playerId}:${entry.cardId}`}
            src={getCardAssetFromId(entry.cardId)}
          />
        ))}
      </div>
    </div>
  );
}
