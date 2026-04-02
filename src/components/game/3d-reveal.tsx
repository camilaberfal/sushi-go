"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { RevealCardEntry } from "@/domain/protocol";
import { getCardAssetFromId, CARD_BACK_ASSET } from "@/components/game/card-art";
import { useSoundEffects } from "@/hooks/use-sound-effects";

type Reveal3DProps = {
  open: boolean;
  reveals: RevealCardEntry[];
  playerNames: Record<string, string>;
  onDone?: () => void;
};

export function RevealLayer3D({ open, reveals, playerNames, onDone }: Reveal3DProps) {
  const { playReveal, playRotate } = useSoundEffects();
  const [flipped, setFlipped] = useState(false);

  useEffect(() => {
    if (!open) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setFlipped(false);
      return;
    }

    // Trigger flip half-way
    const flipTimer = setTimeout(() => {
      setFlipped(true);
      playReveal(); // ta-da
    }, 400);

    const doneTimer = setTimeout(() => {
      onDone?.();
      playRotate(); // whoosh when leaving
    }, 2800);

    return () => {
      clearTimeout(flipTimer);
      clearTimeout(doneTimer);
    };
  }, [open, onDone, playReveal, playRotate]);

  if (!open) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, backdropFilter: "blur(0px)" }}
        animate={{ opacity: 1, backdropFilter: "blur(12px)" }}
        exit={{ opacity: 0, backdropFilter: "blur(0px)" }}
        transition={{ duration: 0.5, ease: "easeInOut" }}
        className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/80 pointer-events-none"
        style={{ perspective: "1200px" }}
      >
        {flipped && (
          <motion.div
            initial={{ scale: 3, opacity: 0, y: -200 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.5, opacity: 0 }}
            transition={{ type: "spring", stiffness: 200, damping: 10 }}
            className="absolute top-[18%] mb-12"
          >
            <h1 className="font-heading text-[120px] font-black leading-none text-primary drop-shadow-[0_10px_30px_rgba(255,107,95,0.8)]">
              ¡SUSHI GO!
            </h1>
          </motion.div>
        )}

        <div className="flex flex-wrap items-center justify-center gap-12 px-8 max-w-7xl pt-[8%]">
          {reveals.map((entry, i) => (
            <div
              key={`${entry.playerId}-${entry.cardId}`}
              className="relative flex flex-col items-center"
            >
              {/* Player Name Tag */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: flipped ? 1 : 0, y: flipped ? 0 : 20 }}
                transition={{ delay: 0.2 + i * 0.05 }}
                className="absolute -top-10 whitespace-nowrap rounded-lg border border-white/20 bg-black/60 px-4 py-1 text-sm font-bold text-white shadow-xl backdrop-blur-md"
              >
                {playerNames[entry.playerId] ?? entry.playerId.slice(0, 6)}
              </motion.div>

              {/* 3D Flipping Card */}
              <motion.div
                initial={{ rotateY: 0, scale: 0.5, y: 100, z: -500 }}
                animate={{
                  rotateY: flipped ? 180 : 0,
                  scale: flipped ? 1.4 : 1.2,
                  y: 0,
                  z: 0,
                }}
                transition={{
                  rotateY: { duration: 0.6, type: "spring", stiffness: 120, damping: 15, delay: 0.1 },
                  scale: { duration: 0.5, type: "spring" },
                  y: { duration: 0.5, type: "spring" },
                  z: { duration: 0.5 },
                }}
                className="relative h-64 w-44 rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.8)]"
                style={{ transformStyle: "preserve-3d" }}
              >
                {/* Back side */}
                <div
                  className="absolute inset-0 rounded-2xl bg-cover bg-center border-4 border-white/10"
                  style={{
                    backgroundImage: `url(${CARD_BACK_ASSET})`,
                    backfaceVisibility: "hidden",
                    transform: "rotateY(0deg)", // Native CSS to hide when flipped
                  }}
                />

                {/* Front side */}
                <div
                  className="absolute inset-0 rounded-2xl bg-cover bg-center border-4 border-accent/80"
                  style={{
                    backgroundImage: `url(${getCardAssetFromId(entry.cardId)})`,
                    backfaceVisibility: "hidden",
                    transform: "rotateY(180deg)", // Native CSS to hide until flipped
                  }}
                >
                  {flipped && (
                    <motion.div
                      initial={{ opacity: 1, scale: 0 }}
                      animate={{ opacity: 0, scale: 2.5 }}
                      transition={{ duration: 1, ease: "easeOut" }}
                      className="absolute inset-0 rounded-xl bg-white/60 blur-[30px]"
                    />
                  )}
                </div>
              </motion.div>
            </div>
          ))}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
