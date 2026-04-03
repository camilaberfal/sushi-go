$gridFile = 'C:\Proyectos\sushi-go\src\components\scoreboard\AchievementsGrid.tsx'
$content = @"
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
"@
[System.IO.File]::WriteAllText($gridFile, $content, (New-Object System.Text.UTF8Encoding $false))
