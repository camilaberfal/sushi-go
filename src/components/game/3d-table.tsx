"use client";

import { useEffect, useRef, useState } from "react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { getCardAssetFromId } from "@/components/game/card-art";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

type TablePlayer = {
  id: string;
  displayName: string;
  playedCards: string[];
};

type TableView3DProps = {
  players: TablePlayer[];
  currentPlayerId: string;
  canDropCard?: boolean;
  draggingCardId?: string | null;
  optimisticWasabiNigiriId?: string | null;
  onDropCard?: (cardId: string, useWasabi: boolean) => void;
  onClickPlayedCard?: (playerId: string, cardId: string) => void;
};

const formatCardName = (id: string) => id.replace(/[\d_-]+/g, ' ').trim().toUpperCase();

export function TableView3D({
  players,
  currentPlayerId,
  canDropCard,
  draggingCardId,
  optimisticWasabiNigiriId,
  onDropCard,
  onClickPlayedCard,
}: TableView3DProps) {
  const [hoveredWasabiId, setHoveredWasabiId] = useState<string | null>(null);
  const [optimisticStackedDrop, setOptimisticStackedDrop] = useState<{ nigiriId: string } | null>(null);
  const wasabiSlotRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const isNigiriDragging = Boolean(draggingCardId && draggingCardId.includes("nigiri_"));
  const isNigiriCardId = (cardId: string) => cardId.includes("nigiri_");

  const findClosestWasabiSlotId = (cursorX: number, cursorY: number): string | null => {
    const SNAP_PADDING_PX = 52;
    let closestId: string | null = null;
    let closestDistance = Number.POSITIVE_INFINITY;

    for (const [slotId, element] of Object.entries(wasabiSlotRefs.current)) {
      if (!element) continue;
      const rect = element.getBoundingClientRect();
      const expandedLeft = rect.left - SNAP_PADDING_PX;
      const expandedRight = rect.right + SNAP_PADDING_PX;
      const expandedTop = rect.top - SNAP_PADDING_PX;
      const expandedBottom = rect.bottom + SNAP_PADDING_PX;

      const insideExpanded =
        cursorX >= expandedLeft &&
        cursorX <= expandedRight &&
        cursorY >= expandedTop &&
        cursorY <= expandedBottom;

      if (!insideExpanded) continue;

      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const distance = Math.hypot(cursorX - centerX, cursorY - centerY);

      if (distance < closestDistance) {
        closestDistance = distance;
        closestId = slotId;
      }
    }

    return closestId;
  };

  useEffect(() => {
    return () => {
      wasabiSlotRefs.current = {};
    };
  }, []);

  useEffect(() => {
    if (!optimisticStackedDrop) return;

    let timeoutId: NodeJS.Timeout | null = null;
    const myCards = players.find((player) => player.id === currentPlayerId)?.playedCards ?? [];
    const cardAlreadyInTable = myCards.includes(optimisticStackedDrop.nigiriId);
    
    if (cardAlreadyInTable) {
      setOptimisticStackedDrop(null);
    } else {
      timeoutId = setTimeout(() => {
        setOptimisticStackedDrop(null);
      }, 8000); // 8-second grace period for server roundtrip
    }

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [players, optimisticStackedDrop, currentPlayerId]);

  const activeOptimisticNigiriId = optimisticWasabiNigiriId ?? optimisticStackedDrop?.nigiriId ?? null;

  return (
    <div
      className={cn(
        "absolute inset-0 right-[300px] top-[2%] -translate-y-[10px] flex items-center justify-center p-8",
        canDropCard && draggingCardId && "pointer-events-none"
      )}
      style={{ perspective: "1000px" }}
    >
      <TooltipProvider>
        <div
          className={cn(
            "relative flex h-[50vh] w-[88vw] max-w-6xl flex-wrap items-center justify-center gap-12 rounded-[50px] border-4 border-white/5 shadow-[inset_0_20px_50px_rgba(0,0,0,0.8),0_40px_100px_rgba(0,0,0,0.9)] transition-all duration-300",
            canDropCard && draggingCardId && "pointer-events-auto ring-[20px] ring-primary/20",
            !canDropCard && "opacity-80"
          )}
          style={{
            backgroundImage: "radial-gradient(ellipse at center, rgba(46,74,52,0.8) 0%, rgba(20,38,25,0.9) 100%)",
            transform: "rotateX(20deg) scale(0.9)",
            transformStyle: "preserve-3d",
          }}
          onDragOver={(event) => {
            if (!canDropCard || !draggingCardId) return;
            event.preventDefault();
            event.dataTransfer.dropEffect = "move";

            // Snap por proximidad: si el puntero está cerca de un wasabi abierto, previsualizamos ahí.
            if (!isNigiriDragging) {
              if (hoveredWasabiId !== null) setHoveredWasabiId(null);
              return;
            }

            const closestId = findClosestWasabiSlotId(event.clientX, event.clientY);

            if (hoveredWasabiId !== closestId) {
              setHoveredWasabiId(closestId);
            }
          }}
          onDrop={(event) => {
            if (!canDropCard || !onDropCard) return;
            event.preventDefault();
            const cardId = event.dataTransfer.getData("text/plain");
            if (!cardId) return;

            const closestWasabiAtDrop = findClosestWasabiSlotId(event.clientX, event.clientY);
            const droppedOnNearbyWasabi = Boolean(isNigiriCardId(cardId) && (closestWasabiAtDrop ?? hoveredWasabiId));
            if (droppedOnNearbyWasabi) {
              setOptimisticStackedDrop({ nigiriId: cardId });
            }

            setHoveredWasabiId(null);
            onDropCard(cardId, droppedOnNearbyWasabi);
          }}
        >
          {/* Sutil Grid/Line divisor (CSS pseudo-elemento visual) */}
          <div className="pointer-events-none absolute inset-0 rounded-[50px] bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCI+PGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMSIgZmlsbD0icmdiYSgyNTUsMjU1LDI1NSwwLjA1KSIvPjwvc3ZnPg==')] opacity-40 mix-blend-overlay" />

          {(() => {
            const others = players.filter((p) => p.id !== currentPlayerId);
            const me = players.find((p) => p.id === currentPlayerId);

            const renderPlayer = (player: TablePlayer, isMe: boolean) => {
              const playedCards = player.playedCards;

              return (
                <div
                  key={player.id}
                  className={cn(
                    "relative z-10 flex flex-col items-center justify-center rounded-3xl border border-white/10 bg-black/20 p-4 shadow-[0_10px_30px_rgba(0,0,0,0.5)] backdrop-blur-md",
                    "min-h-[160px] min-w-[240px]"
                  )}
                  style={{ transform: "translateZ(10px)" }}
                >
                  <div className={cn(
                    "absolute -top-4 rounded-full border border-white/20 bg-black/60 px-4 py-1 text-sm font-semibold text-white/80 shadow-md"
                  )}>
                    {isMe ? "¡Tu lado!" : player.displayName}
                  </div>

                  <div className="mt-4 flex flex-wrap justify-center gap-3">
                    {playedCards.length > 0 ? (
                      (() => {
                        const groupedCards: { base: string; stacked: string[]; id: string }[] = [];
                        const openWasabis: { base: string; stacked: string[]; id: string }[] = [];
                        let firstPuddingGroup: { base: string; stacked: string[]; id: string } | null = null;

                        playedCards.forEach((cardId, i) => {
                          if (cardId.includes("wasabi")) {
                            const group = { base: cardId, stacked: [], id: `${cardId}-${i}` };
                            groupedCards.push(group);
                            openWasabis.push(group);
                          } else if (cardId.includes("nigiri") && openWasabis.length > 0) {
                            const target = openWasabis.shift()!;
                            target.stacked.push(cardId);
                          } else if (cardId.includes("pudding")) {
                            if (!firstPuddingGroup) {
                              firstPuddingGroup = { base: cardId, stacked: [], id: `${cardId}-${i}` };
                              groupedCards.push(firstPuddingGroup);
                            } else {
                              firstPuddingGroup.stacked.push(cardId);
                            }
                          } else {
                            groupedCards.push({ base: cardId, stacked: [], id: `${cardId}-${i}` });
                          }
                        });

                        const firstOpenWasabiGroup = groupedCards.find(
                          (candidate) => candidate.base.includes("wasabi") && candidate.stacked.length === 0
                        );

                        return groupedCards.map((group, index) => {
                          const isPulsing = group.base.includes("wasabi") && group.stacked.length === 0;
                          const centerOffset = index - (groupedCards.length - 1) / 2;
                          const sideBias = isMe ? 2 : -2;
                          const baseRotation = centerOffset * 4 + sideBias;
                          const canSnapNigiriToWasabi =
                            isMe &&
                            canDropCard &&
                            isNigiriDragging &&
                            group.base.includes("wasabi") &&
                            group.stacked.length === 0;
                          const isDropCandidateWasabi = isMe && group.base.includes("wasabi") && group.stacked.length === 0;
                          const isSnapTarget = hoveredWasabiId === group.id && canSnapNigiriToWasabi;

                          return (
                            <div
                              key={group.id}
                              ref={(element) => {
                                if (!isDropCandidateWasabi) return;
                                wasabiSlotRefs.current[group.id] = element;
                              }}
                              className={cn(
                                "relative transition-all hover:-translate-y-2 hover:z-20",
                                isMe && group.base.includes("chopsticks") && "cursor-pointer"
                              )}
                              onClick={() => {
                                if (onClickPlayedCard) {
                                  onClickPlayedCard(player.id, group.base);
                                }
                              }}
                              onDragOver={(event) => {
                                if (!canSnapNigiriToWasabi) return;
                                event.preventDefault();
                                event.stopPropagation();
                                event.dataTransfer.dropEffect = "move";
                                if (hoveredWasabiId !== group.id) {
                                  setHoveredWasabiId(group.id);
                                }
                              }}
                              onDragEnter={(event) => {
                                if (!canSnapNigiriToWasabi) return;
                                event.preventDefault();
                                event.stopPropagation();
                              }}
                              onDragLeave={(event) => {
                                // Evitar parpadeos de dragLeave si el cursor entra a hijos del div (las cartas adentro)
                                const related = event.relatedTarget as Node | null;
                                if (related && event.currentTarget.contains(related)) return;
                              }}
                              onDrop={(event) => {
                                if (!canDropCard || !onDropCard) return;
                                event.preventDefault();
                                event.stopPropagation();

                                const droppedCardId = event.dataTransfer.getData("text/plain");
                                if (!droppedCardId || !isNigiriCardId(droppedCardId)) return;

                                setHoveredWasabiId(null);
                                setOptimisticStackedDrop({ nigiriId: droppedCardId });

                                onDropCard?.(droppedCardId, true);
                              }}
                            >
                              <Tooltip>
                                <TooltipTrigger>
                                  <motion.img
                                    alt={group.base}
                                    initial={{ scale: 0.8, opacity: 0, rotateZ: baseRotation + (isMe ? 3 : -3) }}
                                    animate={{ scale: 1, opacity: 1, rotateZ: baseRotation }}
                                    className={cn(
                                      "h-32 w-[5.5rem] rounded-xl object-cover shadow-[4px_12px_16px_rgba(0,0,0,0.6)]",
                                      isPulsing && "animate-pulse ring-2 ring-green-400/80 shadow-[0_0_20px_rgba(74,222,128,0.5)]"
                                    )}
                                    // if it has stacked cards, push it down slightly to simulate the stack
                                    style={{ transform: group.stacked.length > 0 ? "translateY(5px)" : "none" }}
                                    src={getCardAssetFromId(group.base)}
                                  />
                                </TooltipTrigger>
                                <TooltipContent className="border-none bg-black/80 font-semibold text-white">
                                  {formatCardName(group.base)}
                                </TooltipContent>
                              </Tooltip>

                              {isSnapTarget && draggingCardId && (
                                <motion.img
                                  alt={draggingCardId}
                                  initial={{ opacity: 0, y: -20, z: 20, rotateZ: baseRotation + (isMe ? 1 : -1) }}
                                  animate={{ opacity: 0.95, y: 8, z: 30, scale: 1, rotateZ: baseRotation + (isMe ? 3 : -3) }}
                                  transition={{ duration: 0.18, ease: "easeOut" }}
                                  className="pointer-events-none absolute bottom-0 left-0 h-32 w-[5.5rem] rounded-xl object-cover shadow-[4px_14px_20px_rgba(0,0,0,0.85)]"
                                  src={getCardAssetFromId(draggingCardId)}
                                />
                              )}

                              {group.stacked.map((stackedCard, sIdx) => (
                                <motion.img
                                  key={`stack-${stackedCard}-${sIdx}`}
                                  alt={stackedCard}
                                  initial={{ scale: 0.95, opacity: 0.8, y: 2, x: 0, z: 20, rotateZ: baseRotation + (isMe ? 3 : -3) }}
                                  animate={{ 
                                    scale: 1, 
                                    opacity: 1, 
                                    y: 8 + (sIdx * 10), 
                                    x: group.base.includes("pudding") ? (sIdx % 2 === 0 ? 4 : -4) : 0,
                                    z: 30 + (sIdx * 2), 
                                    rotateZ: baseRotation + (isMe ? 3 : -3) + (sIdx * 2) 
                                  }}
                                  className="pointer-events-none absolute bottom-0 left-0 h-32 w-[5.5rem] rounded-xl object-cover shadow-[6px_16px_28px_rgba(0,0,0,0.65)]"
                                  src={getCardAssetFromId(stackedCard)}
                                  transition={{ duration: 0.32, ease: "easeOut" }}
                                />
                              ))}

                              {activeOptimisticNigiriId &&
                                isMe &&
                                firstOpenWasabiGroup?.id === group.id &&
                                !playedCards.includes(activeOptimisticNigiriId) && (
                                  <motion.img
                                    key={`optimistic-drop-${activeOptimisticNigiriId}`}
                                    alt={activeOptimisticNigiriId}
                                    initial={{ scale: 0.98, opacity: 0.95, y: 14, z: 24, rotateZ: baseRotation + (isMe ? 3 : -3) }}
                                    animate={{ scale: [0.98, 1.06, 1], opacity: 1, y: [14, -2, 8], z: [24, 68, 30], rotateZ: baseRotation + (isMe ? 3 : -3) }}
                                    transition={{ duration: 0.32, ease: "easeOut" }}
                                    className="pointer-events-none absolute bottom-0 left-0 h-32 w-[5.5rem] rounded-xl object-cover shadow-[6px_16px_28px_rgba(0,0,0,0.95)]"
                                    src={getCardAssetFromId(activeOptimisticNigiriId)}
                                  />
                                )}
                            </div>
                          );
                        });
                      })()
                    ) : (
                      <div className="flex h-28 items-center justify-center rounded-xl border border-dashed border-white/20 px-8 opacity-50">
                        <p className="text-sm font-semibold uppercase tracking-wider text-white">Vacío</p>
                      </div>
                    )}
                  </div>
                </div>
              );
            };

            return (
              <div className="flex h-full w-full flex-col justify-between py-6 px-10">
                <div className="flex w-full flex-wrap justify-center gap-8">
                  {others.map((p) => renderPlayer(p, false))}
                </div>
                <div className="flex w-full justify-center">
                  {me && renderPlayer(me, true)}
                </div>
              </div>
            );
          })()}

          
        </div>
      </TooltipProvider>
    </div>
  );
}
