"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import pudinImg from "@/app/assets/illustrations/pudin-illustration.png";
import sashimiImg from "@/app/assets/illustrations/sashimi-illustration.png";

type LobbyPlayer = { user_id: string; display_name: string; is_host: boolean; seat_index: number; presence: "online" | "offline" | "bot"; };

type PlayerListProps = { players: LobbyPlayer[]; maxPlayers: number; };

export function PlayerList({ players, maxPlayers }: PlayerListProps) {
  const emptySeats = Math.max(0, maxPlayers - players.length);
  
  return (
    <div className="rounded-3xl border-2 border-white/10 bg-[#1c0d12] p-6 shadow-[inset_0_2px_4px_rgba(255,255,255,0.05),0_16px_32px_rgba(0,0,0,0.8)] relative overflow-hidden">
      <div className="flex items-center gap-3 mb-8">
        <Image src={sashimiImg} alt="Players" width={48} height={48} className="drop-shadow-[0_0_15px_rgba(251,191,36,0.4)]" />
        <div>
           <h3 className="font-heading text-4xl text-amber-400 drop-shadow-[0_2px_4px_rgba(245,158,11,0.5)]">Jugadores</h3>
        </div>
        <span className="ml-auto rounded-xl bg-black/60 px-4 py-2 text-base font-black uppercase tracking-wider text-amber-200/50 shadow-[inset_0_2px_4px_rgba(0,0,0,0.8)] border border-white/5">
          {players.length}/{maxPlayers}
        </span>
      </div>      

      <div className="space-y-4">
        {players.slice().sort((a, b) => a.seat_index - b.seat_index).map((player, i) => (
            <motion.div 
                initial={{ opacity: 0, x: -20, scale: 0.95 }} 
                animate={{ opacity: 1, x: 0, scale: 1 }} 
                transition={{ type: "spring", delay: i * 0.1, bounce: 0.5 }}
                key={player.user_id} 
                className="group flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border-2 border-white/5 bg-[#170911]/80 p-4 shadow-[inset_0_4px_8px_rgba(0,0,0,0.5),0_4px_8px_rgba(0,0,0,0.3)] transition-all hover:bg-[#1a0c14] hover:border-white/10 hover:-translate-y-1 hover:shadow-[inset_0_4px_8px_rgba(0,0,0,0.5),0_8px_16px_rgba(0,0,0,0.5)]"
            >
              <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-[#2a1720] border-2 border-[hsl(330,80%,20%)] shadow-[inset_0_2px_4px_rgba(255,255,255,0.1),0_4px_8px_rgba(0,0,0,0.8)] transition-all group-hover:scale-110 group-hover:rotate-6">
                    <p className="font-heading text-3xl text-rose-300 drop-shadow-[0_2px_2px_rgba(225,29,72,0.8)]">{player.display_name.slice(0, 2).toUpperCase()}</p>
                </div>
                <div>
                  <p className="font-heading text-2xl text-white group-hover:text-amber-200 transition-colors drop-shadow-md sm:text-3xl">{player.display_name}</p>
                  <p className="text-xs font-bold uppercase tracking-widest text-white/40">Asiento {player.seat_index + 1}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {player.is_host && <span className="rounded-xl bg-amber-500/20 border-2 border-amber-500/50 px-3 py-1.5 font-bold tracking-widest text-amber-400 text-[10px] sm:text-xs shadow-[inset_0_2px_4px_rgba(0,0,0,0.6)]">HOST</span>} 
                <span className={`w-3 h-3 rounded-full shadow-[0_0_8px_rgba(0,0,0,0.6)] ${player.presence === 'online' ? 'bg-emerald-500 shadow-emerald-500/50' : 'bg-zinc-500 shadow-zinc-500/50'}`} title={player.presence.toUpperCase()} />
              </div>
            </motion.div>
        ))}

        {Array.from({ length: emptySeats }).map((_, i) => (
            <motion.div 
               initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 + i * 0.1 }}
               key={`empty-${i}`} 
               className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border-2 border-dashed border-white/10 bg-black/20 p-4 shadow-[inset_0_4px_8px_rgba(0,0,0,0.5)]"
            >
                <div className="flex items-center gap-4 opacity-40">
                  <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-[#2a1720] border-2 border-[hsl(330,80%,10%)] shadow-[inset_0_2px_4px_rgba(0,0,0,0.9)]">
                    <Image src={pudinImg} alt="Empty" width={32} height={32} className="opacity-50 grayscale drop-shadow-md" />
                  </div>
                  <div>
                    <p className="font-heading text-3xl text-white">Vacío</p>
                    <p className="text-xs font-bold uppercase tracking-widest text-white/40">Esperando jugador...</p>
                  </div>
                </div>
            </motion.div>
        ))}
      </div>
    </div>
  );
}
