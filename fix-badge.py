badge = '''"use client";

import { motion } from "framer-motion";
import Image, { StaticImageData } from "next/image";

export interface Achievement {
  id: string;
  name: string;
  icon: StaticImageData | string;
  accent: string;
  winnerPlayerName: string | null;
  winnerPlayerColor?: string;
  description?: string;
}

interface AchievementBadgeProps {
  achievement: Achievement;
  delay?: number;
  shouldReduceMotion?: boolean;
}

export function AchievementBadge({ achievement, delay = 0, shouldReduceMotion = false }: AchievementBadgeProps) {
  const isUnlocked = achievement.winnerPlayerName !== null;

  return (
    <motion.div
      initial={shouldReduceMotion ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.8 }}
      animate={{ opacity: isUnlocked ? 1 : 0.4, scale: 1 }}
      transition={{ delay: shouldReduceMotion ? 0 : delay, duration: 0.4, ease: "easeOut" }}
      className={group flex flex-col items-center p-3 rounded-2xl bg-[#1c0d12] shadow-[0_8px_15px_rgba(0,0,0,0.6),inset_0_2px_4px_rgba(255,255,255,0.02),inset_0_-3px_8px_rgba(0,0,0,0.6)] }
      style={{ borderBottom: 4px solid 99 }}
    >
      <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-xl bg-black/40 shadow-[inset_0_2px_4px_rgba(0,0,0,0.8)] p-1">
        {typeof achievement.icon === "string" ? (
          <span className="text-3xl drop-shadow-md">{achievement.icon}</span>
        ) : (
          <Image src={achievement.icon} alt={achievement.name} width={40} height={40} className="object-contain drop-shadow-[0_4px_6px_rgba(0,0,0,0.7)]" />
        )}
      </div>

      <span className="mb-0.5 text-center font-heading text-[15px] font-black leading-tight text-[#e8d5db] drop-shadow-md truncate max-w-full px-1">
        {achievement.name}
      </span>

      {achievement.description ? (
        <span className="text-center text-[9px] uppercase font-bold text-white/40 tracking-wider h-6 leading-tight flex items-center justify-center mt-1">{achievement.description}</span>
      ) : <div className="h-6" />}

      {isUnlocked ? (
        <div className="mt-3 w-full rounded-lg bg-[#0a0406] py-1.5 text-center shadow-[inset_0_3px_5px_rgba(0,0,0,0.8)]">
          <span
            className="font-heading text-lg font-black block px-2 drop-shadow-[0_2px_2px_rgba(0,0,0,1)] truncate"
            style={{ color: achievement.winnerPlayerColor || "#fbbf24" }}
          >
            {achievement.winnerPlayerName}
          </span>
        </div>
      ) : (
        <div className="mt-3 w-full rounded-lg bg-[#0a0406]/50 py-1.5 text-center shadow-[inset_0_2px_4px_rgba(0,0,0,0.8)]">
          <span className="font-heading text-[11px] font-bold text-white/30 uppercase tracking-widest">Nadie lo logró</span>
        </div>
      )}
    </motion.div>
  );
}
'''
with open('c:/Proyectos/sushi-go/src/components/scoreboard/AchievementBadge.tsx', 'w', encoding='utf-8') as f:
    f.write(badge)