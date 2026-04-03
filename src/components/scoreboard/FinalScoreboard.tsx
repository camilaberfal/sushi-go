"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Achievement } from "./AchievementBadge";
import { AchievementsGrid } from "./AchievementsGrid";
import { ForensicReport, HighlightStats } from "./ForensicReport";
import { Podium, PlayerStat } from "./Podium";
import { useEffect } from "react";
import { Howl } from "howler";
import Image from "next/image";

interface FinalScoreboardProps {
  roomCode: string;
  statusText: string;
  players: PlayerStat[];
  achievements: Achievement[];
  stats: HighlightStats;
  totalDurationMs?: number | null;
  onRematch?: () => void;
  onHome?: () => void;
}

const FANFARE_DATA_URI =
  "data:audio/wav;base64,UklGRlQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YTAAAAAAAP///wAA//8AAP//AAD//wAA";

function localizeStatus(statusText: string): string {
  const normalized = statusText.trim().toUpperCase();

  if (normalized === "FINISHED" || normalized === "FINAL_PODIUM") return "Partida terminada";
  if (normalized === "WAITING_SCOREBOARD") return "Esperando scoreboard";
  if (normalized === "LOBBY") return "Lobby";

  if (normalized.startsWith("ROUND_")) {
    const round = normalized.split("_")[1] ?? "";
    return round ? `Ronda ${round}` : "En partida";
  }

  return "Partida terminada";
}

export function FinalScoreboard({
  roomCode,
  statusText,
  players,
  achievements,
  stats,
  totalDurationMs,
  onRematch,
  onHome,
}: FinalScoreboardProps) {
  const shouldReduceMotion = useReducedMotion();

  useEffect(() => {
    if (shouldReduceMotion) return;
    const fanfare = new Howl({ src: [FANFARE_DATA_URI], volume: 0.4 });
    const timer = window.setTimeout(() => {
      try {
        fanfare.play();
      } catch {
      }
    }, 1300);

    return () => {
      window.clearTimeout(timer);
      fanfare.unload();
    };
  }, [shouldReduceMotion]);

  const noMotion = shouldReduceMotion ?? false;
  const durationText = typeof totalDurationMs === "number" && totalDurationMs > 0 ? `${Math.floor(totalDurationMs / 1000)}s` : null;
  const localizedStatus = localizeStatus(statusText);

  return (
    <motion.main
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: noMotion ? 0 : 0.3 }}
      className="min-h-screen w-full bg-[#1a0f14] overflow-x-hidden font-sans text-white border-0 flex flex-col relative"
    >
      <div className="fixed inset-0 opacity-[0.03] bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:20px_20px] pointer-events-none" />

      <div className="relative z-10 w-full max-w-[1000px] mx-auto flex flex-col pt-5 pb-10 px-4">
        
        <motion.header
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: noMotion ? 0 : 0.45, delay: noMotion ? 0 : 0.05 }}
          className="mb-8 rounded-2xl bg-gradient-to-b from-[#221016] to-[#11070A] p-4 lg:p-6 shadow-[0_10px_20px_rgba(0,0,0,0.7),inset_0_2px_5px_rgba(255,255,255,0.05),inset_0_-4px_10px_rgba(0,0,0,0.5)] shrink-0 w-full flex flex-col md:flex-row items-center justify-between gap-4 border border-[#2a131a]"
        >
          <div className="flex flex-col md:flex-row items-center gap-4">
             <Image 
               src="/sushigo-logo.png" 
               alt="Sushi Go Logo" 
               width={160} 
               height={80} 
               className="w-[140px] md:w-[180px] h-auto drop-shadow-[0_10px_15px_rgba(0,0,0,0.8)] transition-transform hover:scale-[1.03] hover:-rotate-1 duration-300"
               priority
             />
             <div className="flex flex-col items-center md:items-start mt-2 md:mt-0">
               <h1 className="font-heading text-3xl md:text-5xl font-black text-[#fbbf24] tracking-widest uppercase shadow-black drop-shadow-lg">Victoria Final</h1>
               <div className="flex items-center gap-2 mt-1">
                 <span className="font-bold text-[#8a4c5e] text-xs md:text-sm uppercase tracking-wider bg-black/40 px-2 py-0.5 rounded shadow-[inset_0_2px_4px_rgba(0,0,0,0.8)]">SALA {roomCode}</span>
                 {durationText ? (
                   <span className="font-bold text-[#4a2a35] text-xs md:text-sm uppercase tracking-wider">{durationText}</span>
                 ) : null}
               </div>
             </div>
          </div>
          
          <div className="shrink-0 bg-[#000000] p-1.5 rounded-xl shadow-[inset_0_4px_6px_rgba(0,0,0,1)] border border-[#251319]">
             <span className="text-sm md:text-base font-black text-[#fbbf24] px-4 py-2 block uppercase tracking-wider drop-shadow-md">{localizedStatus}</span>
          </div>
        </motion.header>

        <motion.div
           initial={{ opacity: 0 }}
           animate={{ opacity: 1 }}
           transition={{ duration: noMotion ? 0 : 0.2, delay: noMotion ? 0 : 0.2 }}
           className="w-full flex justify-center mb-8"
        >
           <Podium players={players} />
        </motion.div>

        <motion.div
           initial={{ opacity: 0, y: 18 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ duration: noMotion ? 0 : 0.35, delay: noMotion ? 0 : 1.2 }}
           className="w-full"
        >
           <AchievementsGrid achievements={achievements} baseDelay={1.2} />
        </motion.div>

        <motion.div
           initial={{ opacity: 0, y: 20 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ duration: noMotion ? 0 : 0.35, delay: noMotion ? 0 : 1.5 }}
           className="w-full"
        >
           <ForensicReport stats={stats} baseDelay={1.5} />
        </motion.div>

        <motion.footer
          initial={{ opacity: 0, y: 45 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: noMotion ? 0 : 0.35, delay: noMotion ? 0 : 1.8 }}
          className="mt-12 pt-8 flex flex-col md:flex-row justify-center gap-4 relative"
        >
          <div className="absolute top-0 left-10 right-10 h-[2px] bg-gradient-to-r from-transparent via-[#4a1c26] to-transparent opacity-50" />
          
          <button
            type="button"
            onClick={() => {
              try {
                new Howl({ src: [FANFARE_DATA_URI], volume: 0.15 }).play();
              } catch { }
              onRematch?.();
            }}
            className="w-full md:w-auto relative group transition-transform duration-100 cursor-pointer active:scale-95"
          >
            <div className="relative w-full flex flex-col items-center justify-center py-3 px-8 rounded-xl bg-gradient-to-b from-[#f59e0b] to-[#b45309] shadow-[0_10px_20px_rgba(0,0,0,0.6),inset_0_2px_5px_rgba(255,255,255,0.2),inset_0_-4px_10px_rgba(0,0,0,0.5)] group-active:shadow-[0_5px_10px_rgba(0,0,0,0.8),inset_0_2px_5px_rgba(255,255,255,0.1),inset_0_-2px_5px_rgba(0,0,0,0.5)] transition-all border border-amber-500/20">
              <span className="font-heading text-2xl md:text-3xl tracking-widest text-[#fffbeb] font-black drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)] uppercase">
                Revancha
              </span>
              <p className="text-[10px] font-bold mt-1 md:mt-0 uppercase tracking-widest drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] text-[#fef3c7] opacity-80">
                misma sala, nuevos mazos
              </p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => {
              try {
                new Howl({ src: [FANFARE_DATA_URI], volume: 0.15 }).play();
              } catch { }
              onHome?.();
            }}
            className="w-full md:w-auto relative group transition-transform duration-100 cursor-pointer active:scale-95"
          >
            <div className="relative w-full flex flex-col items-center justify-center py-3 px-8 rounded-xl bg-gradient-to-b from-[#4b5563] to-[#374151] shadow-[0_10px_20px_rgba(0,0,0,0.6),inset_0_2px_5px_rgba(255,255,255,0.2),inset_0_-4px_10px_rgba(0,0,0,0.5)] group-active:shadow-[0_5px_10px_rgba(0,0,0,0.8),inset_0_2px_5px_rgba(255,255,255,0.1),inset_0_-2px_5px_rgba(0,0,0,0.5)] transition-all border border-gray-400/20">
              <span className="font-heading text-2xl md:text-3xl tracking-widest text-white font-black drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)] uppercase">
                Salir
              </span>
              <p className="text-[10px] font-bold mt-1 md:mt-0 uppercase tracking-widest drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] text-[#d1d5db] opacity-80">
                volver al menú principal
              </p>
            </div>
          </button>
        </motion.footer>
      </div>
    </motion.main>
  );
}