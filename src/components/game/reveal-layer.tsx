"use client";

import { useEffect } from "react";

import { RevealCardEntry } from "@/domain/protocol";
import { getCardAssetFromId } from "@/components/game/card-art";

type RevealLayerProps = {
  open: boolean;
  reveals: RevealCardEntry[];
  onDone?: () => void;
};

const REVEAL_FADE_MS = 420;
const REVEAL_TITLE_MS = 520;
const CARD_FLIP_MS = 900;
const CARD_STAGGER_MS = 140;
const HOLD_AFTER_LAST_CARD_MS = 700;

export function RevealLayer({ open, reveals, onDone }: RevealLayerProps) {
  const totalHoldMs = CARD_FLIP_MS + Math.max(0, reveals.length - 1) * CARD_STAGGER_MS + HOLD_AFTER_LAST_CARD_MS;

  useEffect(() => {
    if (!open) return;

    const timer = window.setTimeout(() => {
      onDone?.();
    }, totalHoldMs);

    return () => {
      window.clearTimeout(timer);
    };
  }, [onDone, open, totalHoldMs]);

  if (!open) return null;

  return (
    <div className={`pointer-events-none fixed inset-0 z-40 flex animate-[reveal-fade_${REVEAL_FADE_MS}ms_ease-out] flex-col items-center justify-center bg-black/50 backdrop-blur-sm`}>
      <p className={`mb-6 animate-[reveal-title_${REVEAL_TITLE_MS}ms_ease-out] font-heading text-5xl text-accent`}>RESULTADO</p>

      <div className="flex flex-wrap items-center justify-center gap-3 px-4">
        {reveals.map((entry, index) => (
          <img
            alt={entry.cardId}
            className={`h-36 w-24 animate-[flip-in-hor_${CARD_FLIP_MS}ms_ease-out] rounded-xl border-2 border-accent/70 bg-white object-cover shadow-lg`}
            key={`${entry.playerId}:${entry.cardId}`}
            src={getCardAssetFromId(entry.cardId)}
            style={{ animationDelay: `${index * CARD_STAGGER_MS}ms`, animationFillMode: "both" }}
          />
        ))}
      </div>
    </div>
  );
}
