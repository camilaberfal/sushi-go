import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { motion } from "framer-motion";
import Image from "next/image";
import { Star } from "lucide-react";
import cardBackImg from "@/app/assets/cards/reverso.png";

import gyozaImg from "@/app/assets/illustrations/gyoza-illustration.png";
import makisX1Img from "@/app/assets/illustrations/maki-illustration-x1.png";
import makisX2Img from "@/app/assets/illustrations/maki-illustration-x2.png";
import makisX3Img from "@/app/assets/illustrations/maki-illustration-x3.png";
import nigiriCalamarImg from "@/app/assets/illustrations/nigiri-calamar-illustration.png";
import nigiriHuevoImg from "@/app/assets/illustrations/nigiri-huevo-illustration.png";
import nigiriSalmonImg from "@/app/assets/illustrations/nigiri-salmon-illustration.png";
import palillosImg from "@/app/assets/illustrations/palillos-illustration.png";
import pudinImg from "@/app/assets/illustrations/pudin-illustration.png";
import sashimiImg from "@/app/assets/illustrations/sashimi-illustration.png";
import tempuraImg from "@/app/assets/illustrations/tempura-illustration.png";
import wasabiImg from "@/app/assets/illustrations/wasabi-illustration.png";

type HudPlayer = {
  id: string;
  displayName: string;
  handCount: number;
  puddings: number;
  score: number;
};

type GlassScoreboardProps = {
  round: number;
  totalRounds: number;
  turn: number;
  myHandCount: number;
  myPuddings: number;
  myScore: number;
  myPlayedCards?: string[];
  others: HudPlayer[];
  waitingForPlayers: boolean; 
  canLock: boolean; 
  onLockInSelection: () => void;
  hasChopsticks?: boolean;
  useChopsticksAction?: boolean;
  onToggleChopsticks?: () => void;
  hasOpenWasabi?: boolean;
  useWasabiAction?: boolean;
  onToggleWasabi?: () => void;
};

const CAT_INFO: Record<string, { label: string; img: any }> = {
  "Makis x1": { label: "Makis x1", img: makisX1Img },
  "Makis x2": { label: "Makis x2", img: makisX2Img },
  "Makis x3": { label: "Makis x3", img: makisX3Img },
  "Nigiri huevo": { label: "Nigiri huevo", img: nigiriHuevoImg },
  "Nigiri salmón": { label: "Nigiri salmón", img: nigiriSalmonImg },
  "Nigiri calamar": { label: "Nigiri calamar", img: nigiriCalamarImg },
  "Nigiris": { label: "Nigiris", img: nigiriSalmonImg },
  "Tempura": { label: "Tempura", img: tempuraImg },
  "Sashimi": { label: "Sashimi", img: sashimiImg },
  "Gyozas": { label: "Gyozas", img: gyozaImg },
  "Wasabi": { label: "Wasabi", img: wasabiImg },
  "Pudín": { label: "Pudín", img: pudinImg },
  "Palillos": { label: "Palillos", img: palillosImg },
  "Otros": { label: "Otros", img: nigiriSalmonImg }, // Fallback since no generic back exists
};

type CollectionStat = { count: number; points: number };

function categoryFromBase(base: string): string {
  if (base === "maki_1") return "Makis x1";
  if (base === "maki_2") return "Makis x2";
  if (base === "maki_3") return "Makis x3";
  if (base === "nigiri_egg") return "Nigiri huevo";
  if (base === "nigiri_salmon") return "Nigiri salmón";
  if (base === "nigiri_squid") return "Nigiri calamar";
  if (base.startsWith("nigiri")) return "Nigiris";
  if (base === "tempura") return "Tempura";
  if (base === "sashimi") return "Sashimi";
  if (base === "gyoza") return "Gyozas";
  if (base === "wasabi") return "Wasabi";
  if (base === "pudding") return "Pudín";
  if (base === "chopsticks") return "Palillos";
  return "Otros";
}

function nigiriBasePoints(base: string): number {
  if (base === "nigiri_egg") return 1;
  if (base === "nigiri_salmon") return 2;
  if (base === "nigiri_squid") return 3;
  return 0;
}

function gyozaPointsByCount(count: number): number {
  if (count <= 0) return 0;
  if (count === 1) return 1;
  if (count === 2) return 3;
  if (count === 3) return 6;
  if (count === 4) return 10;
  return 15;
}

function buildCollectionStats(cardIds: string[]): Record<string, CollectionStat> {
  const stats: Record<string, CollectionStat> = {};

  for (const cardId of cardIds) {
    const base = cardId.split("-")[0];
    const category = categoryFromBase(base);
    if (!stats[category]) {
      stats[category] = { count: 0, points: 0 };
    }
    stats[category].count += 1;
  }

  // Point scoring by card order for nigiri+wasabi interaction.
  let openWasabi = 0;
  for (const cardId of cardIds) {
    const base = cardId.split("-")[0];

    if (base === "wasabi") {
      openWasabi += 1;
      continue;
    }

    const nigiriBase = nigiriBasePoints(base);
    if (nigiriBase > 0) {
      const category = categoryFromBase(base);
      const multiplier = openWasabi > 0 ? 3 : 1;
      stats[category].points += nigiriBase * multiplier;
      if (openWasabi > 0) openWasabi -= 1;
    }
  }

  const tempuraCount = stats["Tempura"]?.count ?? 0;
  if (tempuraCount > 0) {
    stats["Tempura"].points += Math.floor(tempuraCount / 2) * 5;
  }

  const sashimiCount = stats["Sashimi"]?.count ?? 0;
  if (sashimiCount > 0) {
    stats["Sashimi"].points += Math.floor(sashimiCount / 3) * 10;
  }

  const gyozaCount = stats["Gyozas"]?.count ?? 0;
  if (gyozaCount > 0) {
    stats["Gyozas"].points += gyozaPointsByCount(gyozaCount);
  }

  return stats;
}

export function GlassScoreboard({
  round,
  totalRounds,
  turn,
  myHandCount,
  myPuddings,
  myScore,
  myPlayedCards = [],
  others,
  waitingForPlayers,
  canLock,
  onLockInSelection,
  hasChopsticks = false,
  useChopsticksAction = false,
  onToggleChopsticks,
  hasOpenWasabi = false,
  useWasabiAction = false,
  onToggleWasabi,
}: GlassScoreboardProps) {
  return (
    <div className="fixed bottom-0 right-0 top-0 z-40 w-[360px] bg-[#1a0f14] border-l-4 border-l-[#251319] shadow-[-8px_0_25px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col font-sans text-white border-0">
      {/* Texture overlay */}
      <div className="absolute inset-0 opacity-[0.03] bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:20px_20px] pointer-events-none" />

      <div className="relative flex h-full flex-col p-4 z-10">
        
        {/* LOGO */}
        <div className="mb-4 flex justify-center drop-shadow-[0_10px_15px_rgba(0,0,0,0.8)] shrink-0">
          <Image 
            src="/sushigo-logo.png" 
            alt="Sushi Go Logo" 
            width={240} 
            height={100} 
            className="w-[160px] h-auto transition-transform hover:scale-[1.03] hover:-rotate-1 duration-300 drop-shadow-2xl"
            priority
          />
        </div>

        {/* Round Info */}
        <div className="mb-5 rounded-2xl bg-gradient-to-b from-[#221016] to-[#11070A] p-3 shadow-[0_10px_20px_rgba(0,0,0,0.7),inset_0_2px_5px_rgba(255,255,255,0.05),inset_0_-4px_10px_rgba(0,0,0,0.5)] shrink-0">
          <div className="flex items-end justify-between border-0">
            <div className="flex items-baseline gap-2 drop-shadow-md">
              <span className="font-heading text-3xl font-black text-white tracking-widest uppercase">RONDA {round}</span>
              <span className="font-bold text-[#8a4c5e] text-xl">/ {totalRounds}</span>
            </div>
            <div className="text-right">
              <span className="text-sm font-black text-[#fbbf24] bg-black/60 px-2 py-1 rounded shadow-[inset_0_2px_4px_rgba(0,0,0,0.8)] uppercase tracking-wider">TURNO {turn}</span>
            </div>
          </div>
          
          <div className="mt-3 flex gap-2 bg-[#000000] p-1.5 rounded-full shadow-[inset_0_4px_6px_rgba(0,0,0,1)]">
            {Array.from({ length: totalRounds }).map((_, i) => (
              <div
                key={i}
                className={`h-2 flex-1 rounded-full ${
                  i < round 
                  ? "bg-gradient-to-b from-[#fbbf24] to-[#b45309] shadow-[0_0_10px_rgba(251,191,36,0.5)]" 
                  : "bg-[#1f1115] shadow-[inset_0_2px_4px_rgba(0,0,0,0.8)]"
                }`}
              />
            ))}
          </div>
        </div>

        {/* User Stats Board */}
        <div className="mb-5 shrink-0">
          <div className="grid grid-cols-3 gap-2.5">
            {/* Puntos */}
            <div className="group rounded-2xl bg-gradient-to-b from-[#2a131a] to-[#11070A] py-2 px-1 text-center shadow-[0_10px_20px_rgba(0,0,0,0.6),inset_0_2px_4px_rgba(255,255,255,0.03),inset_0_-2px_5px_rgba(0,0,0,0.8)] transition-transform hover:-translate-y-1">
              <p className="text-[11px] uppercase font-bold text-white/50 mb-0.5 tracking-wider">Puntos</p>
              <div className="flex justify-center mb-1 drop-shadow-[0_4px_6px_rgba(0,0,0,0.5)] h-6 items-center">
                 <Star className="text-[#fbbf24] fill-[#fbbf24] w-6 h-6" />
              </div>
              <motion.p
                key={`p-${myScore}`}
                initial={{ scale: 1.5, color: "#fef08a" }}
                animate={{ scale: 1, color: "#ffffff" }}
                className="font-heading text-4xl font-black text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] leading-none"
              >
                {myScore}
              </motion.p>
            </div>

            {/* Pudines */}
            <div className="group rounded-2xl bg-gradient-to-b from-[#2a131a] to-[#11070A] py-2 px-1 text-center shadow-[0_10px_20px_rgba(0,0,0,0.6),inset_0_2px_4px_rgba(255,255,255,0.03),inset_0_-2px_5px_rgba(0,0,0,0.8)] transition-transform hover:-translate-y-1">
              <p className="text-[11px] uppercase font-bold text-white/50 mb-0.5 tracking-wider">Pudín</p>
              <div className="flex justify-center mb-1 drop-shadow-[0_4px_6px_rgba(0,0,0,0.5)] h-6 items-center">
                 <Image src={pudinImg} alt="Pudin" width={22} height={22} className="object-contain" />
              </div>
              <motion.p
                key={`pu-${myPuddings}`}
                initial={{ scale: 1.5, color: "#f9a8d4" }}
                animate={{ scale: 1, color: "#ffffff" }}
                className="font-heading text-4xl font-black text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] leading-none"
              >
                {myPuddings}
              </motion.p>
            </div>

            {/* Cartas */}
            <div className="group rounded-2xl bg-gradient-to-b from-[#2a131a] to-[#11070A] py-2 px-1 text-center shadow-[0_10px_20px_rgba(0,0,0,0.6),inset_0_2px_4px_rgba(255,255,255,0.03),inset_0_-2px_5px_rgba(0,0,0,0.8)] transition-transform hover:-translate-y-1">
              <p className="text-[11px] uppercase font-bold text-white/50 mb-0.5 tracking-wider">Mano</p>
              <div className="flex justify-center mb-1 drop-shadow-[0_4px_6px_rgba(0,0,0,0.5)] h-6 items-center">
                 <Image src={cardBackImg} alt="C" width={18} height={25} className="object-contain drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]" />
              </div>
              <motion.p
                key={`h-${myHandCount}`}
                initial={{ scale: 1.5, color: "#67e8f9" }}
                animate={{ scale: 1, color: "#ffffff" }}
                className="font-heading text-4xl font-black text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] leading-none"
              >
                {myHandCount}
              </motion.p>
            </div>
          </div>
        </div>

        {/* Categorías de Cartas Jugadas */}
        {myPlayedCards.length > 0 && (
          <div className="mb-4 flex-shrink-0 relative">
            <div className="py-0 mb-2 flex items-center gap-2">
               <div className="w-1 h-3.5 bg-gradient-to-b from-[#fbbf24] to-[#f59e0b] rounded-full shadow-[0_0_8px_rgba(251,191,36,0.6)]" />
               <span className="font-heading text-lg tracking-widest text-[#d8a870] uppercase drop-shadow-md">Colección</span>
            </div>
            
            <div className="flex flex-col gap-2 max-h-[160px] overflow-y-auto pr-1 [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:bg-white/20 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-track]:bg-black/20">
              {Object.entries(buildCollectionStats(myPlayedCards))
              .sort(([, statA], [, statB]) => {
                if (statB.points !== statA.points) return statB.points - statA.points;
                if (statB.count !== statA.count) return statB.count - statA.count;
                return 0;
              })
              .map(([cat, stat], index) => {
                const info = CAT_INFO[cat] || CAT_INFO["Otros"];
                const isMaki = cat.startsWith("Maki");
                const isNigiri = cat.startsWith("Nigiri");
                const rank = index + 1;
                const rankBadge = rank === 1 ? "🥇" : rank === 2 ? "🥈" : rank === 3 ? "🥉" : `${rank}.`;
                const tintColors = isMaki ? "bg-red-950/40 border-red-900/50" :
                                   isNigiri || cat === "Nigiris" ? "bg-yellow-950/40 border-yellow-900/50" :
                                   cat === "Gyozas" ? "bg-blue-950/40 border-blue-900/50" :
                                   cat === "Tempura" ? "bg-purple-950/40 border-purple-900/50" :
                                   cat === "Sashimi" ? "bg-emerald-950/40 border-emerald-900/50" :
                                   cat === "Pudín" ? "bg-pink-950/40 border-pink-900/50" :
                                   cat === "Wasabi" ? "bg-green-950/40 border-green-900/50" :
                                   cat === "Palillos" ? "bg-orange-950/40 border-orange-900/50" :
                                   "bg-[#1c0d12] border-transparent";

                return (
                  <div key={cat} className={`flex items-center justify-between rounded-xl p-2 shadow-[0_6px_10px_rgba(0,0,0,0.5),inset_0_2px_4px_rgba(255,255,255,0.02),inset_0_-2px_6px_rgba(0,0,0,0.6)] transition-colors border max-h-[52px] ${tintColors}`}>
                    <div className="flex items-center gap-3">
                       <div className="min-w-[28px] rounded-md bg-black/40 px-1 py-0.5 text-center text-xs font-black text-white/90 shadow-[inset_0_2px_4px_rgba(0,0,0,0.8)]">
                         {rankBadge}
                       </div>
                       <div className="relative w-8 h-8 drop-shadow-[0_4px_4px_rgba(0,0,0,0.7)] flex items-center justify-center">
                          <Image src={info.img} alt={info.label} fill className="object-contain scale-110" />
                       </div>
                       <span className="font-bold text-[13px] tracking-wide text-[#e8d5db] drop-shadow-md">{info.label}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="px-2 py-0.5 bg-[#0a0406] rounded-lg shadow-[inset_0_3px_5px_rgba(0,0,0,0.8)] flex items-center justify-center min-w-[32px]">
                        <span className="font-heading font-black text-[#fbbf24] text-lg drop-shadow-[0_2px_2px_rgba(0,0,0,1)]">x{stat.count}</span>
                      </div>
                      <div className="px-2 py-0.5 bg-[#0a0406] rounded-lg shadow-[inset_0_3px_5px_rgba(0,0,0,0.8)] flex items-center justify-center min-w-[44px]">
                        <span className="font-heading font-black text-cyan-300 text-sm drop-shadow-[0_2px_2px_rgba(0,0,0,1)]">{stat.points} pts</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Oponentes */}
        <div className="flex-1 min-h-[100px] flex flex-col mb-4">
          <div className="py-0 mb-2 flex items-center gap-2">
             <div className="w-1 h-3.5 bg-gradient-to-b from-[#f87171] to-[#ef4444] rounded-full shadow-[0_0_8px_rgba(248,113,113,0.6)]" />
             <span className="font-heading text-lg tracking-widest text-[#d87070] uppercase drop-shadow-md">Rivales</span>
          </div>
          <div className="space-y-2.5 overflow-y-auto pr-1 pb-1 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none'] flex-1">
            {others.length === 0 && (
              <div className="flex justify-center mt-4">
                 <p className="text-base italic font-medium text-[#7a4858] bg-[#1a0b12] px-3 py-1.5 rounded-full shadow-[inset_0_2px_4px_rgba(0,0,0,0.5)]">Esperando rivales...</p>
              </div>
            )}
            {others.map((player) => (
              <div
                key={player.id}
                className="group flex flex-col gap-1 rounded-xl bg-[#1c0d12] p-2.5 shadow-[0_8px_15px_rgba(0,0,0,0.6),inset_0_2px_4px_rgba(255,255,255,0.02),inset_0_-3px_8px_rgba(0,0,0,0.6)] transition-transform hover:-translate-y-1"
              >
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-2.5">
                    <Avatar className="h-9 w-9 shadow-[0_4px_8px_rgba(0,0,0,0.8),inset_0_2px_4px_rgba(255,255,255,0.2)] bg-[#2a131a] p-0.5">
                      <AvatarFallback className="bg-[#11070A] text-base font-black text-[#fbbf24] shadow-[inset_0_2px_4px_rgba(0,0,0,0.8)] rounded-full h-full w-full flex items-center justify-center">
                        {player.displayName.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col justify-center">
                      <p className="text-lg font-bold text-white tracking-wide truncate max-w-[100px] drop-shadow-md leading-tight">
                        {player.displayName}
                      </p>
                      {/* Sub stats */}
                      <div className="flex gap-1 items-center mt-0.5">
                        <div className="flex items-center gap-1 bg-[#0a0406] px-1.5 py-0.5 rounded shadow-[inset_0_2px_4px_rgba(0,0,0,0.8)]">
                          <Image src={pudinImg} alt="Pudin" width={10} height={10} className="object-contain" />
                          <span className="text-sm font-bold text-[#f9a8d4] leading-none mb-0.5 mt-0.5">{player.puddings}</span>
                        </div>
                        <div className="flex items-center gap-1 bg-[#0a0406] px-1.5 py-0.5 rounded shadow-[inset_0_2px_4px_rgba(0,0,0,0.8)]">
                          <Image src={cardBackImg} alt="C" width={10} height={14} className="object-contain drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)] ml-0.5" />
                          <span className="text-sm font-bold text-[#67e8f9] leading-none mb-0.5 mt-0.5">{player.handCount}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col items-center gap-0.5 bg-[#0a0406] px-2 py-1 rounded-lg shadow-[inset_0_3px_5px_rgba(0,0,0,0.8)] shrink-0 min-w-[50px] justify-center">
                    <div className="flex items-center gap-1">
                      <Star className="text-[#fbbf24] fill-[#fbbf24] w-6 h-6 shadow-black drop-shadow-md" />
                      <p className="font-heading text-2xl font-black text-white drop-shadow-[0_2px_2px_rgba(0,0,0,1)] leading-none mt-0.5">{player.score}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Status / Timer Button (Action Area) */}
        <div className="mt-auto shrink-0 pt-2 relative z-20 flex flex-col gap-2">
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#4a1c26] to-transparent opacity-50" />
          
          {!waitingForPlayers && hasChopsticks && (
            <div
              className={`w-full relative group transition-transform duration-100 cursor-pointer active:scale-95`}
              onClick={() => onToggleChopsticks?.()}
            >
              <div className={`relative w-full flex flex-col items-center justify-center py-2 rounded-xl bg-gradient-to-b ${useChopsticksAction ? "from-[#f59e0b] to-[#b45309]" : "from-[#4b5563] to-[#374151]"} shadow-[0_10px_20px_rgba(0,0,0,0.6),inset_0_2px_5px_rgba(255,255,255,0.2),inset_0_-4px_10px_rgba(0,0,0,0.5)] group-active:shadow-[0_5px_10px_rgba(0,0,0,0.8),inset_0_2px_5px_rgba(255,255,255,0.1),inset_0_-2px_5px_rgba(0,0,0,0.5)] transition-all`}>
                <div className="flex items-center gap-2">
                  <span className="font-heading text-2xl tracking-widest text-white font-black drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)] uppercase">
                    {useChopsticksAction ? "¡PALILLOS ACTIVOS!" : "USAR PALILLOS"}
                  </span>
                </div>
                <p className={`text-[8px] font-bold mt-0.5 uppercase tracking-widest drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] ${useChopsticksAction ? "text-[#fef3c7]" : "text-[#d1d5db]"}`}>
                  {useChopsticksAction ? "Selecciona 2 cartas" : "Clica para jugar 2 cartas"}
                </p>
              </div>
            </div>
          )}

          {!waitingForPlayers && hasOpenWasabi && (
            <div
              className={`w-full relative group transition-transform duration-100 cursor-pointer active:scale-95`}
              onClick={() => onToggleWasabi?.()}
            >
              <div className={`relative w-full flex flex-col items-center justify-center py-2 rounded-xl bg-gradient-to-b ${useWasabiAction ? "from-[#22c55e] to-[#166534]" : "from-[#4b5563] to-[#374151]"} shadow-[0_10px_20px_rgba(0,0,0,0.6),inset_0_2px_5px_rgba(255,255,255,0.2),inset_0_-4px_10px_rgba(0,0,0,0.5)] group-active:shadow-[0_5px_10px_rgba(0,0,0,0.8),inset_0_2px_5px_rgba(255,255,255,0.1),inset_0_-2px_5px_rgba(0,0,0,0.5)] transition-all`}>
                <div className="flex items-center gap-2">
                  <span className="font-heading text-2xl tracking-widest text-white font-black drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)] uppercase">
                    {useWasabiAction ? "¡WASABI ACTIVO!" : "USAR WASABI"}
                  </span>
                </div>
                <p className={`text-[8px] font-bold mt-0.5 uppercase tracking-widest drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] ${useWasabiAction ? "text-[#dcfce7]" : "text-[#d1d5db]"}`}>
                  {useWasabiAction ? "Tu nigiri se multiplica x3" : "Activa para multiplicar un nigiri"}
                </p>
              </div>
            </div>
          )}

          {waitingForPlayers ? (
            <div className="w-full relative flex flex-col items-center justify-center py-3 rounded-xl bg-gradient-to-b from-[#2a2a2e] to-[#18181b] shadow-[0_15px_30px_rgba(0,0,0,0.9),inset_0_2px_5px_rgba(255,255,255,0.05),inset_0_-4px_10px_rgba(0,0,0,0.8)]">
              <span className="animate-pulse font-heading text-3xl tracking-widest text-[#a1a1aa] font-black drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] uppercase">ESPERANDO</span>
              <p className="text-[#71717a] text-[11px] font-bold mt-0.5 uppercase tracking-widest drop-shadow-md">A los demás</p>
            </div>
          ) : (
            <div 
              className={`w-full relative group transition-transform duration-100 ${canLock ? "cursor-pointer active:scale-95" : "opacity-50 cursor-not-allowed"}`}
              onClick={() => {
                if (canLock) onLockInSelection();
              }}
            >
              <div className="relative w-full flex flex-col items-center justify-center py-3 rounded-xl bg-gradient-to-b from-[#22c55e] to-[#14532d] shadow-[0_15px_30px_rgba(0,0,0,0.9),inset_0_2px_5px_rgba(255,255,255,0.2),inset_0_-6px_15px_rgba(0,0,0,0.6)] group-active:shadow-[0_5px_10px_rgba(0,0,0,0.9),inset_0_2px_5px_rgba(255,255,255,0.1),inset_0_-2px_5px_rgba(0,0,0,0.6)] transition-all">
                <span className="font-heading text-4xl tracking-widest text-white font-black drop-shadow-[0_3px_5px_rgba(0,0,0,0.9)] uppercase">
                  {canLock ? "CONFIRMAR" : "TU TURNO"}
                </span>
                <p className="text-[#bbf7d0] text-[11px] font-bold mt-0.5 uppercase tracking-widest drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                  {canLock ? "Jugar carta" : "Selecciona una carta"}
                </p>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}