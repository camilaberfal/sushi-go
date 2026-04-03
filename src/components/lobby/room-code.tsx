"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui";
import { playSfx } from "@/lib/audio";

import Image from "next/image";
import makiImg from "@/app/assets/illustrations/maki-illustration-x2.png";

type RoomCodeProps = { roomCode: string; };

export function RoomCode({ roomCode }: RoomCodeProps) {
  const [copied, setCopied] = useState(false);

  const copyCode = async () => {
    playSfx("reveal");
    await navigator.clipboard.writeText(roomCode);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative rounded-3xl border-2 border-white/10 bg-[#1c0d12] p-6 shadow-[inset_0_2px_4px_rgba(255,255,255,0.05),0_16px_32px_rgba(0,0,0,0.8)] overflow-hidden">
      <Image src={makiImg} alt="Makis" width={100} height={100} className="absolute -right-4 -bottom-4 opacity-10 rotate-12 drop-shadow-2xl" />

      <p className="text-center text-xs font-bold uppercase tracking-[0.3em] text-cyan-200/50 mb-4 relative z-10">Código de sala</p>
      
      <div className="relative z-10">
        <div className="absolute inset-0 rounded-2xl bg-cyan-500/10 blur-xl pointer-events-none" />
        <div className="relative flex flex-col items-center gap-4 rounded-xl border-2 border-cyan-900/50 bg-black/60 p-4 shadow-[inset_0_8px_16px_rgba(0,0,0,0.8)]">
            <p className="font-heading text-4xl sm:text-5xl tracking-[0.1em] text-cyan-400 drop-shadow-[0_0_15px_rgba(34,211,238,0.4)] animate-pulse ml-2">{roomCode}</p>      
            
            <Button 
                className="w-full h-14 rounded-xl border-b-4 border-cyan-900 bg-cyan-700 font-bold uppercase tracking-widest text-white shadow-[inset_0_2px_4px_rgba(255,255,255,0.2),0_4px_8px_rgba(34,211,238,0.2)] transition-all hover:-translate-y-1 hover:bg-cyan-600 hover:shadow-[inset_0_2px_4px_rgba(255,255,255,0.3),0_8px_16px_rgba(34,211,238,0.4)] active:translate-y-1 active:border-b-0 active:mt-1 focus-visible:ring-cyan-500 overflow-hidden" 
                onClick={copyCode}
            >
              <AnimatePresence mode="popLayout" initial={false}>
                {copied ? (
                   <motion.div key="copied" initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -20, opacity: 0 }} className="flex items-center gap-2 text-amber-300">
                     ¡COPIADO!
                   </motion.div> 
                ) : (
                   <motion.div key="copy" initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -20, opacity: 0 }} className="flex items-center gap-2">
                     COPIAR CÓDIGO
                   </motion.div>
                )}
              </AnimatePresence>
            </Button>
        </div>
      </div>
    </div>
  );
}
