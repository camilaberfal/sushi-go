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
  const totalPlayers = players.length + 1;
  const isCompactTable = totalPlayers >= 3;

  return (
    <div className={
      isCompactTable
        ? "pointer-events-none fixed left-0 right-[300px] top-4 z-20 flex flex-wrap justify-center gap-x-8 gap-y-4 pt-3"
        : "pointer-events-none fixed left-0 right-[300px] top-4 z-20 flex justify-center gap-12 pt-3"
    }>
      {players.length === 0 && (
        <p className="text-white/30 text-base font-semibold uppercase tracking-wider backdrop-blur bg-black/20 px-4 py-2 rounded-full ring-1 ring-white/10">
          Esperando oponentes
        </p>
      )}
      
      {players.map((player) => {
        return (
        <div key={player.id} className={isCompactTable ? "relative flex w-[190px] flex-col items-center" : "relative flex flex-col items-center"}>
          {/* Avatar and Name */}
          <div className="relative z-10 flex items-center justify-center gap-2 drop-shadow-xl">
            <div className="flex flex-row items-center gap-2">
              <Avatar className={isCompactTable ? "h-9 w-9 border-2 border-white/20 bg-cover shadow-[0_4px_12px_rgba(0,0,0,0.5)]" : "h-12 w-12 border-2 border-white/20 bg-cover shadow-[0_4px_12px_rgba(0,0,0,0.5)]"}>
                <AvatarFallback className="bg-black/60 font-heading text-xl text-white">
                  {player.displayName.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className={isCompactTable ? "max-w-[126px] rounded-lg border border-white/10 bg-black/40 px-2 py-0.5 backdrop-blur-sm shadow-md" : "rounded-lg bg-black/40 px-3 py-1 max-w-[120px] backdrop-blur-sm border border-white/10 shadow-md"}>
                <p className={isCompactTable ? "text-center text-[11px] font-semibold text-white/90 truncate" : "text-center text-sm font-semibold text-white/90 truncate"}>
                  {player.displayName}
                </p>
              </div>
            </div>
          </div>

          {/* Cards Zone with 3D Perspective */}
          <div
            className={isCompactTable ? "relative mt-3 flex h-[4.7rem] w-[10.5rem] items-center justify-center" : "relative mt-1 flex h-32 w-64 items-center justify-center"}
            style={{ perspective: "1000px" }}
          >
            {isCompactTable ? (
              <div className="flex w-full flex-col items-center gap-0.5" style={{ transform: "rotateX(10deg) translateY(8px)", transformStyle: "preserve-3d" }}>
                {(() => {
                  const firstRowCapacity = totalPlayers === 3 ? 5 : 4;
                  const firstRowCount = Math.min(player.handCount, firstRowCapacity);
                  const secondRowCount = Math.max(0, player.handCount - firstRowCount);
                  const rows = [firstRowCount, secondRowCount].filter((count) => count > 0);

                  return rows.map((count, rowIndex) => {
                    const startIndex = rowIndex === 0 ? 0 : firstRowCount;

                    return (
                      <div key={`${player.id}-row-${rowIndex}`} className="flex justify-center -space-x-4">
                        <AnimatePresence initial={false}>
                          {Array.from({ length: count }, (_, localIndex) => {
                            const index = startIndex + localIndex;
                            const middle = (count - 1) / 2;
                            const distanceFromCenter = localIndex - middle;
                            const normalized = middle > 0 ? distanceFromCenter / middle : 0;
                            const targetRotation = normalized * 5;

                            return (
                              <motion.div
                                key={`${player.id}-card-${index}`}
                                initial={{ opacity: 0, z: -80, y: -24, rotateZ: targetRotation * 1.2 }}
                                animate={{
                                  opacity: 1,
                                  z: 0,
                                  y: [0, -2, 0],
                                  rotateZ: targetRotation,
                                }}
                                exit={{ opacity: 0, scale: 0.5, y: -16 }}
                                transition={{
                                  opacity: { duration: 0.25 },
                                  z: { duration: 0.35 },
                                  y: {
                                    duration: 2.8,
                                    repeat: Infinity,
                                    repeatType: "mirror",
                                    ease: "easeInOut",
                                    delay: index * 0.1,
                                  },
                                }}
                                className="relative h-[3.45rem] w-[2.35rem] shrink-0 overflow-hidden rounded-md border border-white/20 shadow-[0_7px_14px_rgba(0,0,0,0.58)]"
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
                    );
                  });
                })()}
              </div>
            ) : (
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
                            delay: index * 0.15,
                          },
                        }}
                        className="relative h-28 w-20 shrink-0 overflow-hidden rounded-xl border border-white/20 shadow-[0_8px_16px_rgba(0,0,0,0.6)]"
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
            )}
          </div>
        </div>
      );})}
    </div>
  );
}
