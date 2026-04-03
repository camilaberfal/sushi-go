$forensicFile = 'C:\Proyectos\sushi-go\src\components\scoreboard\ForensicReport.tsx'
$content = @"
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
         <Image src={image} alt="Icono highlight" fill className="object-contain drop-shadow-[0_8px_10px_rgba(0,0,0,0.8)] scale-[1.2]" />
      </div>
    </motion.div>
  );
}
"@
[System.IO.File]::WriteAllText($forensicFile, $content, (New-Object System.Text.UTF8Encoding $false))
