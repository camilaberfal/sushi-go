 "use client";

import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

type Combo = {
  id: number;
  title: string;
  subtitle: string;
  color: string;
};

let comboId = 0;

export function ComboOverlay({ playedCards }: { playedCards: string[] }) {
  const [combos, setCombos] = useState<Combo[]>([]);
  const prevCardsRef = useRef<string[]>([]);

  useEffect(() => {
    const prev = prevCardsRef.current;
    const curr = playedCards;

    // Reset de ronda o inicio de partida
    if (curr.length === 0 && prev.length > 0) {
      prevCardsRef.current = curr;
      return;
    }

    // Solo procesamos combos si la cantidad cambió
    if (curr.length === prev.length) {
      return;
    }

    const newCombos: Combo[] = [];
    const addCombo = (title: string, subtitle: string, color: string) => {
      newCombos.push({ id: ++comboId, title, subtitle, color });
    };

    const count = (cards: string[], type: string) => cards.filter((c) => c.startsWith(type)).length;
    const countNigiri = (cards: string[]) => cards.filter((c) => c.startsWith("nigiri")).length;

    // Tempura
    const prevTempura = count(prev, "tempura");
    const currTempura = count(curr, "tempura");
    if (Math.floor(currTempura / 2) > Math.floor(prevTempura / 2)) {
      addCombo("¡Par de Tempuras!", "+5 Puntos 🍤", "text-orange-400");
    }

    // Sashimi
    const prevSashimi = count(prev, "sashimi");
    const currSashimi = count(curr, "sashimi");
    if (Math.floor(currSashimi / 3) > Math.floor(prevSashimi / 3)) {
      addCombo("¡Set de Sashimi!", "+10 Puntos 🍣", "text-emerald-400");
    }

    // Gyoza
    const prevGyoza = count(prev, "gyoza");
    const currGyoza = count(curr, "gyoza");
    if (currGyoza > prevGyoza && currGyoza > 1) {
      const ptsList = [0, 1, 3, 6, 10, 15];
      const pts = ptsList[Math.min(currGyoza, 5)] || 15;
      addCombo("¡Gyozas Mejoradas!", `${currGyoza} gyozas = ${pts} Puntos 🥟`, "text-blue-400");
    }

    // Wasabi
    const prevNigiris = countNigiri(prev);
    const currNigiris = countNigiri(curr);
    const openWasabisPrev = count(prev, "wasabi") - prevNigiris;
    if (currNigiris > prevNigiris && openWasabisPrev > 0) {
      addCombo("¡Wasabi Activado!", "¡Nigiri x3 Puntos! 🌿🔥", "text-green-500");
    }

    // Palillos
    const prevChopsticks = count(prev, "chopsticks");
    const currChopsticks = count(curr, "chopsticks");
    if (currChopsticks < prevChopsticks) {
      addCombo("¡Palillos en Acción!", "🥢 Jugaste 2 cartas", "text-yellow-400");
    }

    if (newCombos.length > 0) {
      setCombos((c) => [...c, ...newCombos]);
      
      const newIds = newCombos.map((n) => n.id);
      setTimeout(() => {
        setCombos((c) => c.filter((combo) => !newIds.includes(combo.id)));
      }, 3500);
    }

    prevCardsRef.current = curr;
  }, [playedCards]);

  return (
    <div className="fixed inset-0 z-50 pointer-events-none flex flex-col items-center justify-center gap-6">
      <AnimatePresence>
        {combos.map((c) => (
          <motion.div
            key={c.id}
            initial={{ opacity: 0, scale: 0.3, y: 80, rotateX: 45 }}
            animate={{ opacity: 1, scale: 1, y: 0, rotateX: 0 }}
            exit={{ opacity: 0, scale: 1.1, y: -40, filter: "blur(10px)" }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
            className="flex flex-col items-center justify-center bg-black/70 backdrop-blur-md px-10 py-6 rounded-3xl border-2 border-white/20 shadow-[0_20px_60px_rgba(0,0,0,0.8)]"
          >
            <h1 className={`font-heading text-5xl tracking-wide font-bold drop-shadow-[0_4px_4px_rgba(0,0,0,0.8)] ${c.color}`}>
              {c.title}
            </h1>
            <p className="text-2xl font-bold text-white mt-2 drop-shadow-md">
              {c.subtitle}
            </p>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
