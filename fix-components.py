grid = r"""
"use client";

import { useReducedMotion } from "framer-motion";
import { Achievement, AchievementBadge } from "./AchievementBadge";

interface AchievementsGridProps {
  achievements: Achievement[];
  baseDelay?: number;
}

export function AchievementsGrid({ achievements, baseDelay = 1.6 }: AchievementsGridProps) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <section className="w-full">
      <div className="py-0 mb-4 flex items-center justify-center gap-2">
         <div className="w-1.5 h-6 bg-gradient-to-b from-[#f59e0b] to-[#b45309] rounded-full shadow-[0_0_12px_rgba(245,158,11,0.8)]" />
         <h2 className="font-heading text-2xl md:text-3xl font-black text-white drop-shadow-md uppercase tracking-widest text-[#d8a870]">
           Sala de Trofeos
         </h2>
         <div className="w-1.5 h-6 bg-gradient-to-b from-[#f59e0b] to-[#b45309] rounded-full shadow-[0_0_12px_rgba(245,158,11,0.8)]" />
      </div>

      <div
        className="mx-auto flex w-full max-w-6xl snap-x snap-mandatory gap-4 overflow-x-auto pb-6 pt-2 px-6 lg:justify-center lg:flex-wrap [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:bg-white/10 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-track]:bg-black/20"
      >
        {achievements.map((achievement, index) => (
          <div key={achievement.id} className="snap-center shrink-0 w-[160px]">
            <AchievementBadge
              achievement={achievement}
              delay={(shouldReduceMotion ? 0 : baseDelay) + index * 0.08}
              shouldReduceMotion={shouldReduceMotion ?? false}
            />
          </div>
        ))}
      </div>
    </section>
  );
}
"""
with open('c:/Proyectos/sushi-go/src/components/scoreboard/AchievementsGrid.tsx', 'w', encoding='utf-8') as f: f.write(grid.strip())

podium = r"""
"use client";

import { motion, useReducedMotion } from "framer-motion";
import { ConfettiEffect } from "./ConfettiEffect";
import Image from "next/image";
import pudinImg from "@/app/assets/illustrations/pudin-illustration.png";
import cardBackImg from "@/app/assets/cards/reverso.png";

export type PlayerStat = {
  id: string;
  name: string;
  score: number;
  puddingScore: number;
  rank: number;
  colorHex: string;
};

interface PodiumProps {
  players: PlayerStat[];
}

export function Podium({ players }: PodiumProps) {
  const shouldReduceMotion = useReducedMotion();

  const getRankPlayer = (rank: number) => players.find((p) => p.rank === rank);
  const first = getRankPlayer(1);
  const second = getRankPlayer(2);
  const third = getRankPlayer(3);
  const others = players.filter(p => p.rank > 3);

  const podiumVariants = {
    hidden: { y: 200, opacity: 0 },
    visible: (custom: number) => ({
      y: 0,
      opacity: 1,
      transition: {
        delay: shouldReduceMotion ? 0 : custom,
        duration: 0.7,
        ease: "easeOut" as const,
      },
    }),
  };

  const firstDelay = shouldReduceMotion ? 0 : 0.6;

  return (
    <section className="w-full">
      <div className="mx-auto flex h-[350px] w-full max-w-4xl items-end justify-center gap-1 sm:gap-4 px-2">
        {second && (
          <motion.div
            custom={0.3}
            variants={podiumVariants}
            initial="hidden"
            animate="visible"
            className="relative z-20 flex h-[70%] w-28 flex-col items-center justify-end md:w-40"
          >
            <PlayerAvatar player={second} rank={2} />
            <div
              style={{ clipPath: "polygon(10% 0, 90% 0, 100% 100%, 0 100%)" }}
              className="flex h-full w-full flex-col items-center bg-gradient-to-b from-[#e2e8f0] to-[#64748b] pt-6 shadow-[inset_0_4px_10px_rgba(255,255,255,0.7),inset_0_-8px_15px_rgba(15,23,42,0.6)]"
            >
              <span className="font-heading text-[32px] md:text-[40px] font-black leading-none text-[#0f172a] drop-shadow-[0_2px_4px_rgba(255,255,255,0)]">{second.score}</span>
              <span className="text-[10px] font-bold text-[#1e293b] uppercase tracking-wider mt-1 opacity-70">Pts</span>
            </div>
          </motion.div>
        )}

        {first && (
          <motion.div
            custom={firstDelay}
            variants={podiumVariants}
            initial="hidden"
            animate="visible"
            className="relative z-30 flex h-[100%] w-36 flex-col items-center justify-end md:w-48"
          >
            <ConfettiEffect />
            <PlayerAvatar player={first} rank={1} />
             <div
              style={{ clipPath: "polygon(10% 0, 90% 0, 100% 100%, 0 100%)", borderWidth: "4px 0 0 0", borderTopColor: "#fbbf24" }}
              className="flex h-full w-full flex-col items-center bg-gradient-to-b from-[#fde047] to-[#b45309] pt-8 shadow-[inset_0_8px_18px_rgba(255,255,255,0.6),inset_0_-14px_20px_rgba(69,26,3,0.6)]"
            >
              <span className="font-heading text-[48px] md:text-[56px] font-black leading-none text-[#451a03] drop-shadow-[0_2px_4px_rgba(255,255,255,0.4)]">{first.score}</span>
              <span className="text-[12px] font-bold text-[#451a03] uppercase tracking-widest mt-1 opacity-80">Pts</span>
            </div>
          </motion.div>
        )}

        {third && (
          <motion.div
            custom={0.1}
            variants={podiumVariants}
            initial="hidden"
            animate="visible"
            className="relative z-10 flex h-[55%] w-28 flex-col items-center justify-end md:w-40"
          >
            <PlayerAvatar player={third} rank={3} />
            <div
              style={{ clipPath: "polygon(10% 0, 90% 0, 100% 100%, 0 100%)" }}
              className="flex h-full w-full flex-col items-center bg-gradient-to-b from-[#fca5a5] to-[#991b1b] pt-5 shadow-[inset_0_4px_10px_rgba(255,255,255,0.5),inset_0_-8px_15px_rgba(69,10,10,0.6)]"
            >
              <span className="font-heading text-[28px] md:text-[34px] font-black leading-none text-[#450a0a] drop-shadow-[0_2px_4px_rgba(255,255,255,0.2)]">{third.score}</span>
              <span className="text-[10px] font-bold text-[#450a0a] uppercase tracking-wider mt-1 opacity-70">Pts</span>
            </div>
          </motion.div>
        )}
      </div>

      {others.length > 0 && (
        <div className="mx-auto mt-6 flex max-w-4xl flex-wrap justify-center gap-3 px-4">
          {others.map((p, idx) => (
            <motion.div
              key={p.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: shouldReduceMotion ? 0 : 1.2 + (idx * 0.1) }}
              className="flex items-center justify-between w-[220px] rounded-xl bg-[#1c0d12] p-2.5 shadow-[0_8px_15px_rgba(0,0,0,0.6),inset_0_2px_4px_rgba(255,255,255,0.02),inset_0_-3px_8px_rgba(0,0,0,0.6)]"
            >
              <div className="flex items-center gap-2">
                 <div
                  className="flex h-9 w-9 items-center justify-center rounded-full shadow-[inset_0_2px_4px_rgba(0,0,0,0.8)] font-heading text-lg font-black text-[#11070A]"
                  style={{ backgroundColor: p.colorHex || "#4ECDC4" }}
                >
                  {p.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex flex-col max-w-[80px]">
                  <span className="font-bold text-[13px] leading-none text-white truncate">{p.name}</span>
                  <div className="flex gap-1 mt-1">
                     <Image src={pudinImg} alt="P" width={10} height={10} className="object-contain" />
                     <span className="text-[10px] font-bold text-[#f9a8d4] leading-none">{p.puddingScore}</span>
                  </div>
                </div>
              </div>
              <div className="bg-[#0a0406] px-2 py-1 rounded shadow-[inset_0_3px_5px_rgba(0,0,0,0.8)] min-w-[50px] text-center">
                 <span className="font-heading font-black text-[#fbbf24] text-lg leading-none drop-shadow-[0_2px_2px_rgba(0,0,0,1)]">{p.score}</span>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </section>
  );
}

function PlayerAvatar({
  player,
  rank,
}: {
  player: PlayerStat;
  rank: number;
}) {
  const shouldReduceMotion = useReducedMotion();

  const isWinner = rank === 1;

  const getRankBadge = () => {
    switch (rank) {
      case 1: return "🥇";
      case 2: return "🥈";
      case 3: return "🥉";
      default: return "";
    }
  }

  return (
    <div className="relative mb-3 flex flex-col items-center">
      {isWinner && !shouldReduceMotion && (
        <motion.div
           className="absolute -top-12 z-30 drop-shadow-[0_4px_6px_rgba(0,0,0,0.8)]"
           animate={{ y: [0, -6, 0] }}
           transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        >
          <span className="text-5xl">👑</span>
        </motion.div>
      )}
      
      <div className="relative z-20">
        <div
          className={`flex ${isWinner ? 'h-24 w-24' : 'h-16 w-16'} items-center justify-center overflow-hidden rounded-full text-3xl font-heading font-black text-white shadow-[0_8px_16px_rgba(0,0,0,0.8),inset_0_4px_8px_rgba(255,255,255,0.3)] border-[3px] border-[#2a131a] relative group`}
          style={{ backgroundColor: player.colorHex || "#FF6B6B" }}
        >
          <div className="absolute inset-0 bg-black/10" />
          <span className="relative z-10 drop-shadow-md">{player.name.charAt(0).toUpperCase()}</span>
          
          <div className="absolute -bottom-1 w-full bg-black/60 pt-1 pb-2 flex justify-center backdrop-blur-sm">
             <span className="text-xl z-20 leading-none shadow-black drop-shadow-xl">{getRankBadge()}</span>
          </div>
        </div>
      </div>

      <div className="z-20 mt-3 bg-black/60 px-3 py-1 rounded-lg backdrop-blur-sm border border-white/10 shadow-md flex flex-col items-center">
         <span className="font-heading text-lg font-bold text-white drop-shadow-md leading-none truncate max-w-[100px] text-center">
           {player.name}
         </span>
         <div className="flex items-center gap-1.5 bg-[#0a0406] px-2 py-0.5 rounded shadow-[inset_0_2px_4px_rgba(0,0,0,0.8)] mt-2">
            <Image src={pudinImg} alt="Pudin" width={16} height={16} className="object-contain" />
            <span className="text-sm font-bold text-[#f9a8d4] leading-none mb-0.5">{player.puddingScore}</span>
         </div>
      </div>
    </div>
  );
}
"""
with open('c:/Proyectos/sushi-go/src/components/scoreboard/Podium.tsx', 'w', encoding='utf-8') as f: f.write(podium.strip())

forensic = r"""
"use client";

import { motion, useReducedMotion } from "framer-motion";
import Image, { StaticImageData } from "next/image";

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

export interface HighlightStats {
  fastestPlay: { playerName: string; fastestTime: number; cardId: string; };
  slowestPlay: { playerName: string; slowestTime: number; cardId: string; };
  mostPlayedCard: { cardId: string; count: number; };
  mostProfitableCard: { cardId: string; totalPointsGenerated: number; };
}

interface ForensicReportProps {
  stats: HighlightStats;
  baseDelay?: number;
}

const CARD_ART_BY_TYPE: Record<string, StaticImageData> = {
  maki_1: makisX1Img,
  maki_2: makisX2Img,
  maki_3: makisX3Img,
  nigiri_egg: nigiriHuevoImg,
  nigiri_salmon: nigiriSalmonImg,
  nigiri_squid: nigiriCalamarImg,
  tempura: tempuraImg,
  sashimi: sashimiImg,
  gyoza: gyozaImg,
  wasabi: wasabiImg,
  pudding: pudinImg,
  chopsticks: palillosImg,
};

export function ForensicReport({ stats, baseDelay = 2.0 }: ForensicReportProps) {
  const shouldReduceMotion = useReducedMotion();

  const getCardImg = (cardId: string) => {
    return CARD_ART_BY_TYPE[cardId] || nigiriSalmonImg;
  };

  return (
    <section className="mx-auto w-full max-w-4xl px-4 mt-6">
      <div className="py-0 mb-4 flex items-center justify-center gap-2">
         <div className="w-1.5 h-6 bg-gradient-to-b from-[#fbbf24] to-[#f59e0b] rounded-full shadow-[0_0_12px_rgba(251,191,36,0.8)]" />
         <h2 className="font-heading text-2xl md:text-3xl font-black text-white drop-shadow-md uppercase tracking-widest text-[#fbbf24]">
           Reporte Forense
         </h2>
         <div className="w-1.5 h-6 bg-gradient-to-b from-[#fbbf24] to-[#f59e0b] rounded-full shadow-[0_0_12px_rgba(251,191,36,0.8)]" />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 px-2">
        <MetricCard
          label="Jugada Más Rápida"
          value={<>{stats.fastestPlay.fastestTime.toFixed(1)}s <span className="text-[#fbbf24] text-xs">por {stats.fastestPlay.playerName}</span></>}
          icon="⚡"
          image={getCardImg(stats.fastestPlay.cardId)}
          delay={shouldReduceMotion ? 0 : baseDelay + 0.1}
        />
        <MetricCard
          label="Táctico Meditativo"
          value={<>{stats.slowestPlay.slowestTime.toFixed(1)}s <span className="text-cyan-300 text-xs">por {stats.slowestPlay.playerName}</span></>}
          icon="⏳"
          image={getCardImg(stats.slowestPlay.cardId)}
          delay={shouldReduceMotion ? 0 : baseDelay + 0.2}
          tint="cyan"
        />
        <MetricCard
          label="Carta Más Popular"
          value={<>{stats.mostPlayedCard.count}x <span className="text-rose-400 text-xs">jugadas</span></>}
          icon="🔥"
          image={getCardImg(stats.mostPlayedCard.cardId)}
          delay={shouldReduceMotion ? 0 : baseDelay + 0.3}
          tint="rose"
        />
        <MetricCard
          label="La Más Rentable"
          value={<>{stats.mostProfitableCard.totalPointsGenerated} pts <span className="text-emerald-400 text-xs">generados</span></>}
          icon="💰"
          image={getCardImg(stats.mostProfitableCard.cardId)}
          delay={shouldReduceMotion ? 0 : baseDelay + 0.4}
          tint="emerald"
        />
      </div>
    </section>
  );
}

function MetricCard({
  label,
  value,
  icon,
  image,
  delay,
  tint = "amber",
}: {
  label: string;
  value: React.ReactNode;
  icon: string;
  image: StaticImageData;
  delay: number;
  tint?: "amber" | "cyan" | "rose" | "emerald";
}) {
  const colors = {
    amber: "from-amber-950/40 to-yellow-950/20 shadow-[0_0_15px_rgba(251,191,36,0.15)] border-amber-900/50",
    cyan: "from-cyan-950/40 to-blue-950/20 shadow-[0_0_15px_rgba(34,211,238,0.15)] border-cyan-900/50",
    rose: "from-rose-950/40 to-red-950/20 shadow-[0_0_15px_rgba(251,113,133,0.15)] border-rose-900/50",
    emerald: "from-emerald-950/40 to-green-950/20 shadow-[0_0_15px_rgba(52,211,153,0.15)] border-emerald-900/50",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay, duration: 0.4, ease: "easeOut" }}
      className={`group relative flex items-center justify-between overflow-hidden rounded-2xl bg-gradient-to-br ${colors[tint]} p-4 border transition-transform hover:-translate-y-1 bg-[#1a0f14] shadow-[0_8px_15px_rgba(0,0,0,0.6),inset_0_2px_4px_rgba(255,255,255,0.02),inset_0_-3px_8px_rgba(0,0,0,0.6)]`}
    >
      <div className="flex flex-col">
        <div className="flex items-center gap-2">
          <span className="text-xl drop-shadow-md">{icon}</span>
          <span className="font-heading text-[13px] font-black uppercase tracking-wider text-white/50">{label}</span>
        </div>
        <div className="mt-2 font-heading text-2xl font-black leading-none text-white drop-shadow-md">
          {value}
        </div>
      </div>

      <div className="relative flex h-16 w-16 items-center justify-center shrink-0">
         <Image src={image} alt="Icono" fill className="object-contain drop-shadow-[0_8px_10px_rgba(0,0,0,0.8)] scale-[1.2]" />
      </div>
    </motion.div>
  );
}
"""
with open('c:/Proyectos/sushi-go/src/components/scoreboard/ForensicReport.tsx', 'w', encoding='utf-8') as f: f.write(forensic.strip())


finalb = r"""
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
  const durationText = totalDurationMs ? `${Math.floor(totalDurationMs / 1000)}s` : "N/A";

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
                 <span className="font-bold text-[#4a2a35] text-xs md:text-sm uppercase tracking-wider">{durationText}</span>
               </div>
             </div>
          </div>
          
          <div className="shrink-0 bg-[#000000] p-1.5 rounded-xl shadow-[inset_0_4px_6px_rgba(0,0,0,1)] border border-[#251319]">
             <span className="text-sm md:text-base font-black text-[#fbbf24] px-4 py-2 block uppercase tracking-wider drop-shadow-md">PARTIDA {statusText}</span>
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
"""
with open('c:/Proyectos/sushi-go/src/components/scoreboard/FinalScoreboard.tsx', 'w', encoding='utf-8') as f: f.write(finalb.strip())