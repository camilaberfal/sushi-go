"use client";

import { AnimatePresence, motion } from "framer-motion";
import { CARD_BACK_ASSET } from "@/components/game/card-art";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

type TablePlayer = {
  id: string;
  displayName: string;
  handCount: number;
};

type OpponentsHudProps = {
  players: TablePlayer[];
};

export function OpponentsHud({ players }: OpponentsHudProps) {
  return (
    <div className="pointer-events-none fixed left-0 right-[300px] top-4 z-20 flex justify-center gap-12 pt-3">
      {players.length === 0 && (
        <p className="text-white/30 text-base font-semibold uppercase tracking-wider backdrop-blur bg-black/20 px-4 py-2 rounded-full ring-1 ring-white/10">
          Esperando oponentes
        </p>
      )}
      
      {players.map((player) => (
        <div key={player.id} className="relative flex flex-col items-center">
          {/* Avatar and Name */}
          <div className="relative z-10 flex items-center justify-center gap-2.5 drop-shadow-xl">
            <Avatar className="h-12 w-12 border-2 border-white/20 bg-cover shadow-[0_4px_12px_rgba(0,0,0,0.5)]">
              <AvatarFallback className="bg-black/60 font-heading text-xl text-white">
                {player.displayName.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="rounded-lg bg-black/40 px-3 py-1 max-w-[120px] backdrop-blur-sm border border-white/10 shadow-md">
              <p className="text-center text-sm font-semibold text-white/90 truncate">
                {player.displayName}
              </p>
            </div>
          </div>

          {/* Cards Zone with 3D Perspective */}
          <div
            className="relative mt-[-5px] flex h-32 w-64 items-center justify-center"
            style={{ perspective: "1000px" }}
          >
            <div
              className="flex justify-center -space-x-12"
              style={{
                transform: "rotateX(15deg) translateY(14px)",
                transformStyle: "preserve-3d",
              }}
            >
              <AnimatePresence initial={false}>
                {Array.from({ length: player.handCount }, (_, index) => {
                  const middle = (player.handCount - 1) / 2;
                  const distanceFromCenter = index - middle;
                  const normalized = middle > 0 ? distanceFromCenter / middle : 0;
                  const targetRotation = normalized * 6;

                  return (
                    <motion.div
                      key={`${player.id}-card-${index}`}
                      initial={{ opacity: 0, z: -100, y: -40, rotateZ: targetRotation * 1.35 }}
                      animate={{
                        opacity: 1,
                        z: 0,
                        y: [0, -6, 0],
                        rotateZ: targetRotation,
                      }}
                      exit={{ opacity: 0, scale: 0.5, y: -20 }}
                      transition={{
                        opacity: { duration: 0.3 },
                        z: { duration: 0.4 },
                        y: {
                          duration: 3,
                          repeat: Infinity,
                          repeatType: "mirror",
                          ease: "easeInOut",
                          delay: index * 0.15, // staggered bounce
                        },
                      }}
                      className="relative h-28 w-20 overflow-hidden rounded-xl border border-white/20 shadow-[0_8px_16px_rgba(0,0,0,0.6)]"
                      style={{
                        backgroundImage: `url(${CARD_BACK_ASSET})`,
                        backgroundSize: "cover",
                        backgroundPosition: "center",
                      }}
                    >
                      <div className="absolute inset-0 transition-opacity" />
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
