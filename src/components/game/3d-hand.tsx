"use client";

import { useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { getCardAssetFromId } from "@/components/game/card-art";

type Hand3DProps = {
  regularGroups: Record<string, string[]>;
  specials: string[];
  selectedCardIds: string[];
  draggingCardId?: string | null;
  disabled?: boolean;
  onSelectCard: (cardId: string) => void;
  onDragStartCard?: (cardId: string) => void;
  onDragEndCard?: () => void;
};

// Math calculation for a perfect fan
function calculateArc(index: number, total: number) {
  const middle = (total - 1) / 2;
  const distance = index - middle;
  const absDistance = Math.abs(distance);

  // Diferencia constante de 6 grados por posición para que sea bien notorio entre cada carta
  const ROTATION_PER_CARD = 6;
  const rotation = distance * ROTATION_PER_CARD;

  // Ajustamos ligeramente la caída en Y para que el arco encaje mejor con la rotación lineal
  const yOffset = absDistance * 6.5;
  const zOffset = -absDistance * 2;

  return {
    rotateZ: rotation,
    y: Math.pow(yOffset, 1.25),
    z: zOffset,
    x: distance * 56,
  };
}

export function Hand3D({
  regularGroups,
  specials,
  selectedCardIds,
  draggingCardId,
  disabled,
  onSelectCard,
  onDragStartCard,
  onDragEndCard,
}: Hand3DProps) {
  // Combine all cards linearly first for the arc math
  const allCards = useMemo(() => {
    const list: { id: string; type: "regular" | "special" }[] = [];
    Object.values(regularGroups).forEach((group) => {
      group.forEach((cardId) => list.push({ id: cardId, type: "regular" }));
    });
    specials.forEach((cardId) => list.push({ id: cardId, type: "special" }));
    return list;
  }, [regularGroups, specials]);

  const totalCards = allCards.length;

  return (
    <div
      className="fixed bottom-[-45px] left-0 right-[300px] z-30 flex h-[350px] items-end justify-center pointer-events-none pb-12"
      style={{ perspective: "1500px", perspectiveOrigin: "center 80%" }}
    >
      <div 
        className="pointer-events-auto relative flex justify-center w-full"
        style={{ transformStyle: "preserve-3d", transform: "translateZ(100px)" }}
      >
        <AnimatePresence mode="popLayout">
          {allCards.map((item, index) => {
            const isSelected = selectedCardIds.includes(item.id);
            const isDragging = draggingCardId === item.id;
            const isDisabled = disabled && !isSelected;

            const arc = calculateArc(index, totalCards);
            
            return (
              <motion.button
                key={item.id}
                onClick={() => onSelectCard(item.id)}
                draggable={!disabled}
                onDragStart={(event) => {
                  const dataTransfer = (event as unknown as DragEvent).dataTransfer;
                  if (dataTransfer) {
                    dataTransfer.setData("text/plain", item.id);
                    dataTransfer.effectAllowed = "move";
                  }
                  onDragStartCard?.(item.id);
                }}
                onDragEnd={() => onDragEndCard?.()}
                initial={{ y: 200, opacity: 0, rotateZ: arc.rotateZ * 2 }}
                animate={{
                  x: arc.x,
                  y: isSelected ? -50 : isDragging ? -60 : arc.y,
                  z: isSelected || isDragging ? 60 : arc.z,
                  rotateZ: isSelected || isDragging ? arc.rotateZ : arc.rotateZ,
                  scale: isSelected ? 1.15 : isDragging ? 1.1 : 1,
                  opacity: isDisabled ? 0.9 : 1,
                  filter: isDisabled ? "saturate(0.2) brightness(0.8)" : "saturate(1) brightness(1)",
                }}
                whileHover={{
                  y: isSelected ? -50 : -30,
                  z: 50,
                  rotateZ: arc.rotateZ * 1.08,
                  scale: isSelected ? 1.15 : 1.08,
                  transition: { type: "spring", stiffness: 220, damping: 22 },
                }}
                exit={{ y: -300, scale: 0.5, opacity: 0, rotateZ: Math.sin(index) * 360 }}
                transition={{ type: "spring", stiffness: 200, damping: 20, mass: 1.2 }}
                className={cn(
                  "absolute bottom-0 h-[200px] w-[145px] origin-bottom overflow-hidden rounded-[18px] border border-white/30 shadow-[0_10px_30px_rgba(0,0,0,0.8),0_0_15px_rgba(255,255,255,0.1)] backdrop-blur-2xl transition-shadow duration-300 hover:shadow-[0_20px_50px_rgba(0,0,0,0.9),0_0_25px_rgba(255,255,255,0.2)]",
                  isSelected && "border-2 border-[#fbbf24] ring-4 ring-[#fbbf24]/50 shadow-[0_0_80px_rgba(251,191,36,1),0_20px_40px_rgba(0,0,0,0.8)] z-50",
                  isDragging && "opacity-95 ring-2 ring-primary mix-blend-screen",
                  isDisabled ? "cursor-not-allowed" : "cursor-grab active:cursor-grabbing",
                  item.type === "special" && !isSelected && "ring-2 ring-[#d946ef]/40 shadow-[0_0_20px_rgba(217,70,239,0.3)]"
                )}
                style={{
                  backgroundImage: `linear-gradient(to bottom, rgba(255,255,255,0.05), rgba(0,0,0,0.4)), url(${getCardAssetFromId(item.id)})`,
                  backgroundSize: "100% 100%",
                }}
              >
                <div className="absolute inset-0 bg-gradient-to-tr from-black/20 to-transparent mix-blend-overlay" />
                {item.type === "special" && (
                  <div className="absolute -top-1 left-1/2 -translate-x-1/2 rounded-b-md bg-fuchsia-600/90 px-2 py-[2px] text-[10px] font-bold tracking-widest text-white shadow-sm backdrop-blur">
                    ESPECIAL
                  </div>
                )}
              </motion.button>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}
