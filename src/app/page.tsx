"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";

import { CreateRoomModal } from "@/components/landing/create-room-modal";
import { JoinRoomModal } from "@/components/landing/join-room-modal";
import { Button } from "@/components/ui";
import { FloatingBackground } from "@/components/landing/floating-background";
import { playSfx } from "@/lib/audio";


export default function Home() {
  const [createOpen, setCreateOpen] = useState(false);
  const [joinOpen, setJoinOpen] = useState(false);
  const [joinCodeParam, setJoinCodeParam] = useState("");

  useEffect(() => {
    const joinParam = new URLSearchParams(window.location.search).get("join") ?? "";
    setJoinCodeParam(joinParam.trim().toUpperCase());
  }, []);

  useEffect(() => {
    if (joinCodeParam.length < 4) return;
    setJoinOpen(true);
  }, [joinCodeParam]);

  const handleCreate = () => {
    playSfx("select");
    setCreateOpen(true);
  };

  const handleJoin = () => {
    playSfx("select");
    setJoinOpen(true);
  };

  return (
    <main className="relative min-h-screen w-full select-none bg-[#1a0f14] text-white overflow-hidden">
      <FloatingBackground />
      {/* Textura radial */}
      <div className="pointer-events-none absolute inset-0 z-0 opacity-20" style={{ backgroundImage: "radial-gradient(circle, #fbbf24 1px, transparent 1px)", backgroundSize: "32px 32px" }}></div>

      <div className="relative z-10 mx-auto flex w-full max-w-5xl flex-col items-center gap-10 px-4 py-20 text-center sm:py-32">
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", bounce: 0.5 }}
          className="relative"
        >
          <div className="absolute inset-0 scale-110 rounded-full bg-rose-500/20 blur-3xl" />
          <Image src="/sushigo-logo.png" alt="Sushi Go logo" width={480} height={160} className="relative drop-shadow-[0_12px_20px_rgba(0,0,0,0.8)]" priority />
        </motion.div>

        <motion.div 
          initial={{ y: 40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ type: "spring", bounce: 0.4, delay: 0.2 }}
          className="w-full max-w-2xl rounded-3xl border-2 border-white/10 bg-[#1c0d12] p-8 shadow-[inset_0_2px_4px_rgba(255,255,255,0.05),0_24px_40px_rgba(0,0,0,0.8)] sm:p-12"
        >
          <p className="mx-auto max-w-xl text-lg sm:text-xl font-bold uppercase tracking-wider text-rose-200 drop-shadow-md">
            Un juego con varias cartas delichochas.
          </p>

          <div className="mt-10 grid gap-6 sm:grid-cols-2">
            <Button
              className="h-16 rounded-xl border-b-4 border-rose-900 bg-rose-600 text-xl font-black uppercase tracking-widest text-white shadow-[inset_0_2px_4px_rgba(255,255,255,0.3),0_8px_16px_rgba(225,29,72,0.4)] transition-all hover:-translate-y-1 hover:bg-rose-500 hover:shadow-[inset_0_2px_4px_rgba(255,255,255,0.4),0_12px_20px_rgba(225,29,72,0.6)] active:translate-y-1 active:border-b-0 active:mt-1 focus-visible:ring-rose-500"
              onClick={handleCreate}
            >
              Crear sala
            </Button>
            <Button
              className="h-16 rounded-xl border-b-4 border-indigo-900 bg-indigo-600 text-xl font-black uppercase tracking-widest text-white shadow-[inset_0_2px_4px_rgba(255,255,255,0.3),0_8px_16px_rgba(79,70,229,0.4)] transition-all hover:-translate-y-1 hover:bg-indigo-500 hover:shadow-[inset_0_2px_4px_rgba(255,255,255,0.4),0_12px_20px_rgba(79,70,229,0.6)] active:translate-y-1 active:border-b-0 active:mt-1 focus-visible:ring-indigo-500"
              onClick={handleJoin}
              style={{ backgroundColor: "#4f46e5", borderColor: "#312e81" }}
            >
              Unirse
            </Button>
          </div>
        </motion.div>
      </div>

      <CreateRoomModal open={createOpen} onOpenChange={setCreateOpen} />
      <JoinRoomModal open={joinOpen} onOpenChange={setJoinOpen} initialRoomCode={joinCodeParam} />
    </main>
  );
}
