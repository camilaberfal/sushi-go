"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

import { PlayerList } from "@/components/lobby/player-list";
import { RoomCode } from "@/components/lobby/room-code";
import { Button } from "@/components/ui";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";
import { playSfx } from "@/lib/audio";
import { initSoundtrack } from "@/lib/soundtrack";

import { FloatingBackground } from "@/components/landing/floating-background";

type Room = { id: string; code: string; host_id: string; max_players: number; status: string; };
type LobbyPlayer = { user_id: string; display_name: string; is_host: boolean; seat_index: number; presence: "online" | "offline" | "bot"; };

export default function LobbyPage() {
  const params = useParams<{ roomCode: string }>();
  const router = useRouter();
  const roomCode = (params.roomCode ?? "").toUpperCase();

  const [loading, setLoading] = useState(true);
  const [room, setRoom] = useState<Room | null>(null);
  const [players, setPlayers] = useState<LobbyPlayer[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const isHost = useMemo(() => !!room && !!currentUserId && room.host_id === currentUserId, [room, currentUserId]);

  const loadLobby = useCallback(async () => {
    const supabase = getSupabaseBrowserClient();
    const auth = await supabase.auth.getUser();
    setCurrentUserId(auth.data.user?.id ?? null);

    const roomRes = await supabase.from("rooms").select("id, code, host_id, max_players, status").eq("code", roomCode).single();

    if (roomRes.error || !roomRes.data) {
      setError("La sala no existe o ya fue cerrada.");
      setLoading(false);
      return;
    }

    const lobbyRoom = roomRes.data as Room;
    setRoom(lobbyRoom);

    const playersRes = await supabase
      .from("room_players")
      .select("user_id, display_name, is_host, seat_index, presence")
      .eq("room_id", lobbyRoom.id)
      .order("seat_index", { ascending: true });

    if (!playersRes.error) {
      setPlayers((prevPlayers) => {
        if (prevPlayers.length > 0 && playersRes.data && playersRes.data.length > prevPlayers.length) {
          playSfx("reveal");
        }
        return (playersRes.data ?? []) as LobbyPlayer[];
      });
    } else {
      setError(playersRes.error.message);
    }
    setLoading(false);
  }, [roomCode]);

  useEffect(() => {
    initSoundtrack();
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => void loadLobby(), 0);
    return () => window.clearTimeout(timer);
  }, [loadLobby]);

  useEffect(() => {
    if (!room?.id) return;
    const supabase = getSupabaseBrowserClient();
    const channel = supabase
      .channel(`lobby:${room.id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "rooms", filter: `id=eq.${room.id}` }, () => void loadLobby())
      .on("postgres_changes", { event: "*", schema: "public", table: "room_players", filter: `room_id=eq.${room.id}` }, () => void loadLobby());

    channel.subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [loadLobby, room?.id]);

  useEffect(() => {
    if (!room?.code) return;

    const shouldEnterGame = room.status === "ROUND_1" || room.status === "ROUND_2" || room.status === "ROUND_3";
    if (!shouldEnterGame) return;

    playSfx("whoosh");
    router.push(`/game/${room.code}`);
  }, [room?.code, room?.status, router]);

  const startMatch = async () => {
    if (!room || !isHost) return;
    if (players.length < 2) {
      playSfx("reveal");
      setError("Mínimo 2 jugadores.");
      return;
    }

    playSfx("select");
    const supabase = getSupabaseBrowserClient();
    const result = await supabase.from("rooms").update({ status: "ROUND_1" }).eq("id", room.id);
    if (result.error) setError(result.error.message);
  };

  const handleLeaveLobby = async () => {
    playSfx("reveal");
    if (room?.id) {
      const supabase = getSupabaseBrowserClient();
      const { data: auth } = await supabase.auth.getUser();
      if (auth.user) await supabase.from("room_players").delete().eq("room_id", room.id).eq("user_id", auth.user.id);
    }
    router.push("/");
  };

  if (loading) {
    return (
      <main className="flex min-h-screen bg-[#1a0f14] items-center justify-center text-white">
        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }} className="h-16 w-16 border-4 border-rose-500 border-t-transparent rounded-full shadow-[0_0_15px_rgba(225,29,72,0.5)]" />
      </main>
    );
  }

  if (!room) {
    return (
      <main className="flex min-h-screen bg-[#1a0f14] items-center justify-center text-white p-4">
        <div className="w-full max-w-md rounded-3xl border-2 border-white/10 bg-[#1c0d12] p-8 shadow-[inset_0_2px_4px_rgba(255,255,255,0.05),0_24px_50px_rgba(0,0,0,0.9)] text-center relative z-10">
            <h2 className="font-heading text-4xl text-rose-400">Error</h2>
            <p className="mt-4 font-bold text-rose-200">{error || "Sala no encontrada"}</p>
            <Button onClick={() => router.push("/")} className="mt-8 h-14 w-full rounded-xl border-b-4 border-rose-900 bg-rose-600 font-bold uppercase text-white shadow-[0_4px_8px_rgba(225,29,72,0.4)] transition-all hover:-translate-y-1 hover:bg-rose-500 active:translate-y-1 active:border-b-0 active:mt-1">Regresar</Button>
        </div>
      </main>
    );
  }

  return (
    <main className="relative min-h-screen w-full bg-[#1a0f14] px-4 py-8 text-white overflow-hidden">
      <FloatingBackground />
      <div className="pointer-events-none absolute inset-0 z-0 opacity-20" style={{ backgroundImage: "radial-gradient(circle, #fbbf24 1px, transparent 1px)", backgroundSize: "32px 32px" }}></div>

      <div className="relative z-10 mx-auto max-w-4xl pt-8">
        <motion.div initial={{ y: -30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ type: "spring", bounce: 0.5 }} className="flex justify-between items-center mb-10">
            <div>
              <h1 className="font-heading text-5xl sm:text-6xl text-rose-400 drop-shadow-[0_4px_6px_rgba(225,29,72,0.6)]">Lobby</h1>
              <p className="font-bold uppercase tracking-widest text-rose-200/50 mt-1 ml-1 text-sm">Sala de espera</p>
            </div>
            <Button onClick={handleLeaveLobby} className="h-12 px-6 rounded-xl border-b-4 border-zinc-900 bg-zinc-700 font-black uppercase tracking-widest text-zinc-200 shadow-[inset_0_2px_4px_rgba(255,255,255,0.1),0_4px_8px_rgba(0,0,0,0.6)] transition-all hover:-translate-y-1 hover:bg-zinc-600 active:translate-y-1 active:border-b-0 active:mt-1">
              Salir
            </Button>
        </motion.div>

        <div className="grid gap-6 md:grid-cols-[1fr_320px]">
          <motion.div initial={{ x: -30, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.2, type: "spring", bounce: 0.4 }} className="space-y-6">
            <PlayerList players={players} maxPlayers={room.max_players} />
          </motion.div>

          <motion.div initial={{ x: 30, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.3, type: "spring", bounce: 0.4 }} className="space-y-6">
            <RoomCode roomCode={room.code} />

            <div className="rounded-3xl border-2 border-white/5 bg-[#170911] p-6 shadow-[inset_0_4px_8px_rgba(0,0,0,0.8)] relative overflow-hidden">
                {isHost ? (
                    <div className="space-y-4 relative z-10">
                        <Button 
                            className="w-full h-16 rounded-xl border-b-4 border-emerald-900 bg-emerald-600 text-xl font-black uppercase tracking-widest text-white shadow-[inset_0_2px_4px_rgba(255,255,255,0.3),0_8px_16px_rgba(16,185,129,0.4)] transition-all hover:-translate-y-1 hover:bg-emerald-500 hover:shadow-[inset_0_2px_4px_rgba(255,255,255,0.5),0_12px_20px_rgba(16,185,129,0.6)] active:translate-y-1 active:border-b-0 active:mt-1 disabled:opacity-50 disabled:translate-y-0 disabled:border-b-4 disabled:mt-0"
                            onClick={startMatch}
                            disabled={players.length < 2}
                        >
                            ¡Iniciar Juego!
                        </Button>
                        {players.length < 2 && (
                            <p className="text-center text-xs font-bold uppercase tracking-wider text-rose-400 mt-2">Mínimo 2 jugadores</p>
                        )}
                        {error && <p className="text-center text-sm font-bold text-rose-400 bg-black/40 rounded-lg shadow-[inset_0_2px_4px_rgba(0,0,0,0.5)] p-2 mt-2">{error}</p>}
                    </div>
                ) : (
                    <div className="text-center space-y-3 relative z-10 py-4">
                        <p className="font-heading text-3xl text-amber-400 animate-pulse drop-shadow-[0_0_10px_rgba(251,191,36,0.3)]">Esperando</p>
                        <p className="text-xs font-bold uppercase tracking-widest text-amber-200/60 leading-relaxed">El host iniciará la partida pronto...</p>
                    </div>
                )}
            </div>
          </motion.div>
        </div>
      </div>
    </main>
  );
}
