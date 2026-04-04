"use client";

import { ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { ConfettiEffect } from "./ConfettiEffect";
import Image from "next/image";
import pudinImg from "@/app/assets/illustrations/pudin-illustration.png";
import cardBackImg from "@/app/assets/cards/reverso.png";

export type PlayerStat = {
  id: string;
  name: string;
  score: number;
  puddings: number;
  puddingScore: number;
  rank: number;
  colorHex: string;
};

function formatPuddingDelta(points: number): ReactNode {
  if (points > 0)
    return (
      <span className="text-[10px] text-white">(+{points} <span className="text-[9px]">pt.</span>)</span>
    );
  if (points < 0)
    return (
      <span className="text-[10px] text-white">({points} <span className="text-[9px]">pt.</span>)</span>
    );
  return (
    <span className="text-[10px] text-white">(0 <span className="text-[9px]">pt.</span>)</span>
  );
}

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
                  <div className="mt-1 flex items-center gap-1 leading-none">
                    <Image src={pudinImg} alt="P" width={10} height={10} className="object-contain" />
                    <span className="text-[10px] font-bold text-[#f9a8d4]">{p.puddings}</span>
                    {formatPuddingDelta(p.puddingScore)}
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
          <div className="flex items-baseline gap-1 leading-none">
            <span className="text-sm font-bold text-[#f9a8d4] leading-none">{player.puddings}</span>
            {formatPuddingDelta(player.puddingScore)}
          </div>
        </div>
      </div>
    </div>
  );
}