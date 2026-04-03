import os

FILES_TO_REWRITE = {
    "src/app/page.tsx": r""""use client";

import Image from "next/image";
import { useState } from "react";
import { motion } from "framer-motion";

import { CreateRoomModal } from "@/components/landing/create-room-modal";
import { JoinRoomModal } from "@/components/landing/join-room-modal";
import { Button } from "@/components/ui";
import { playSfx } from "@/lib/audio";

import pudinImg from "@/assets/cards/pudin.png";
import sashimiImg from "@/assets/cards/sashimi.png";
import makiImg from "@/assets/cards/makis-1.png";

export default function Home() {
  const [createOpen, setCreateOpen] = useState(false);
  const [joinOpen, setJoinOpen] = useState(false);

  const handleCreate = () => {
    playSfx("click");
    setCreateOpen(true);
  };

  const handleJoin = () => {
    playSfx("click");
    setJoinOpen(true);
  };

  return (
    <main className="relative min-h-screen w-full select-none bg-[#1a0f14] text-white overflow-hidden">
      {/* Textura radial */}
      <div className="pointer-events-none absolute inset-0 z-0 opacity-20" style={{ backgroundImage: "radial-gradient(circle, #fbbf24 1px, transparent 1px)", backgroundSize: "32px 32px" }}></div>

      {/* Floating game assets */}
      <motion.div 
        animate={{ y: [0, -20, 0], rotate: [0, 10, 0] }} 
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-[15%] left-[10%] w-24 h-24 opacity-60 drop-shadow-2xl"
      >
        <Image src={sashimiImg} alt="Sashimi" fill className="object-contain" />
      </motion.div>
      <motion.div 
        animate={{ y: [0, 25, 0], rotate: [0, -15, 0] }} 
        transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        className="absolute bottom-[20%] left-[15%] w-32 h-32 opacity-60 drop-shadow-2xl hidden md:block"
      >
        <Image src={makiImg} alt="Makis" fill className="object-contain" />
      </motion.div>
      <motion.div 
        animate={{ y: [0, -30, 0], rotate: [0, 5, 0] }} 
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 2 }}
        className="absolute top-[25%] right-[10%] w-28 h-28 opacity-80 drop-shadow-[0_10px_15px_rgba(0,0,0,0.8)]"
      >
        <Image src={pudinImg} alt="Pudin" fill className="object-contain" />
      </motion.div>

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
            Partidas rápidas, simultáneas y caóticamente kawaii.
          </p>

          <div className="mt-10 grid gap-6 sm:grid-cols-2">
            <Button
              className="h-16 rounded-xl border-b-4 border-rose-900 bg-rose-600 text-xl font-black uppercase tracking-widest text-white shadow-[inset_0_2px_4px_rgba(255,255,255,0.3),0_8px_16px_rgba(225,29,72,0.4)] transition-all hover:-translate-y-1 hover:bg-rose-500 hover:shadow-[inset_0_2px_4px_rgba(255,255,255,0.4),0_12px_20px_rgba(225,29,72,0.6)] active:translate-y-1 active:border-b-0 active:mt-1 focus-visible:ring-rose-500"
              onClick={handleCreate}
            >
              Crear sala
            </Button>
            <Button
              className="h-16 rounded-xl border-b-4 border-cyan-900 bg-cyan-600 text-xl font-black uppercase tracking-widest text-white shadow-[inset_0_2px_4px_rgba(255,255,255,0.3),0_8px_16px_rgba(6,182,212,0.4)] transition-all hover:-translate-y-1 hover:bg-cyan-500 hover:shadow-[inset_0_2px_4px_rgba(255,255,255,0.4),0_12px_20px_rgba(6,182,212,0.6)] active:translate-y-1 active:border-b-0 active:mt-1 focus-visible:ring-cyan-500"
              onClick={handleJoin}
            >
              Unirse
            </Button>
          </div>
        </motion.div>
      </div>

      <CreateRoomModal open={createOpen} onOpenChange={setCreateOpen} />
      <JoinRoomModal open={joinOpen} onOpenChange={setJoinOpen} />
    </main>
  );
}
""",
    "src/components/landing/create-room-modal.tsx": r""""use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

import { Button, Input, Label } from "@/components/ui";
import { playSfx } from "@/lib/audio";
import { getErrorMessage } from "@/lib/error-message";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";
import { ensureGuestUser } from "@/lib/guest-session";

type CreateRoomModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

type RoomRow = { id: string; code: string; };

function roundsByPlayers(playerCount: number): number {
  if (playerCount === 2) return 5;
  if (playerCount === 3) return 4;
  return 3;
}

function roundOptionsByPlayers(playerCount: number): number[] {
  if (playerCount === 2) return [3, 4, 5];
  if (playerCount === 3) return [3, 4];
  return [3];
}

function generateRoomId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") return crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function generateRoomCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i += 1) code += chars[Math.floor(Math.random() * chars.length)] ?? "A";
  return code;
}

export function CreateRoomModal({ open, onOpenChange }: CreateRoomModalProps) {
  const router = useRouter();
  const [displayName, setDisplayName] = useState("");
  const [maxPlayers, setMaxPlayers] = useState(4);
  const [roundCount, setRoundCount] = useState(3);
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const roundOptions = useMemo(() => roundOptionsByPlayers(maxPlayers), [maxPlayers]);

  useEffect(() => {
    const defaultRounds = roundsByPlayers(maxPlayers);
    setRoundCount((current) => (roundOptions.includes(current) ? current : defaultRounds));
  }, [maxPlayers, roundOptions]);

  const disabled = useMemo(() => loading || displayName.trim().length < 2, [displayName, loading]);

  const handleCreate = async () => {
    playSfx("click");
    setError(null);
    setLoading(true);

    try {
      const supabase = getSupabaseBrowserClient();
      const guest = await ensureGuestUser();
      const userId = guest.user?.id;

      if (!userId) {
        setError(guest.errorMessage ?? "No se pudo iniciar la sesion de invitado.");
        return;
      }

      let room: RoomRow | null = null;
      for (let attempt = 0; attempt < 5; attempt += 1) {
        const code = generateRoomCode();
        const roomId = generateRoomId();
        const insert = await supabase
          .from("rooms")
          .insert({
            id: roomId, code, host_id: userId, max_players: maxPlayers,
            password_hash: password.trim() ? password.trim() : null,
            settings: { total_rounds: roundCount },
          });

        if (!insert.error) {
          room = { id: roomId, code };
          break;
        }

        if (insert.error.code !== "23505") {
          setError(insert.error.message);
          return;
        }
      }

      if (!room) {
        setError("No se pudo generar un código único.");
        return;
      }

      const playerInsert = await supabase.from("room_players").insert({
        room_id: room.id, user_id: userId, display_name: displayName.trim(),
        is_host: true, seat_index: 0, presence: "online",
      });

      if (playerInsert.error) {
        if (playerInsert.error.code === "23505") {
          onOpenChange(false);
          router.push(`/lobby/${room.code}`);
          return;
        }
        setError(playerInsert.error.message);
        return;
      }

      onOpenChange(false);
      router.push(`/lobby/${room.code}`);
    } catch (error) {
      setError(getErrorMessage(error, "Ocurrió un error."));
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    playSfx("error");
    onOpenChange(false);
  };

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/80 px-4">
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: "spring", bounce: 0.4 }}
            className="relative w-full max-w-md rounded-3xl border-2 border-[hsl(330,80%,15%)] bg-[#1c0d12] p-8 shadow-[inset_0_2px_4px_rgba(255,255,255,0.05),0_24px_50px_rgba(0,0,0,0.9)] z-50"
          >
            <h2 className="font-heading text-4xl text-rose-400 drop-shadow-[0_2px_4px_rgba(225,29,72,0.5)]">Crear sala</h2>
            <p className="mt-2 text-sm font-bold uppercase tracking-wider text-rose-200/50">Configura la partida épica</p>

            <div className="mt-8 space-y-6">
              <div className="space-y-3">
                <Label className="text-sm font-bold uppercase tracking-wider text-rose-300">Tu nombre</Label>
                <Input
                  value={displayName}
                  onChange={(event) => setDisplayName(event.target.value)}
                  placeholder="Ej. Sushi Master"
                  className="h-14 rounded-xl border border-white/10 bg-black/60 text-lg font-bold text-amber-100 shadow-[inset_0_4px_8px_rgba(0,0,0,0.6)] placeholder:text-white/20 focus-visible:ring-2 focus-visible:ring-rose-500"
                />
              </div>

              <div className="space-y-3">
                <Label className="text-sm font-bold uppercase tracking-wider text-rose-300">Jugadores</Label>
                <div className="shadow-[inset_0_4px_8px_rgba(0,0,0,0.6)] bg-black/60 rounded-xl p-2 flex gap-2 border border-white/10">
                  {[2, 3, 4, 5].map((num) => (
                    <button
                      key={num}
                      onClick={() => { playSfx("reveal"); setMaxPlayers(num); }}
                      className={`flex-1 rounded-lg py-2 font-bold transition-all ${
                        maxPlayers === num ? 'bg-rose-600 text-white shadow-[0_4px_8px_rgba(225,29,72,0.4)]' : 'text-white/40 hover:bg-white/5'
                      }`}
                    >
                      {num}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <Label className="text-sm font-bold uppercase tracking-wider text-rose-300">Rondas</Label>
                <div className="shadow-[inset_0_4px_8px_rgba(0,0,0,0.6)] bg-black/60 rounded-xl p-2 flex gap-2 border border-white/10">
                  {roundOptions.map((num) => (
                    <button
                      key={num}
                      onClick={() => { playSfx("reveal"); setRoundCount(num); }}
                      className={`flex-1 rounded-lg py-2 font-bold transition-all ${
                        roundCount === num ? 'bg-amber-600 text-white shadow-[0_4px_8px_rgba(217,119,6,0.4)]' : 'text-white/40 hover:bg-white/5'
                      }`}
                    >
                      {num}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <Label className="text-sm font-bold uppercase tracking-wider text-rose-300">Contraseña (Opcional)</Label>
                <Input
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  type="password"
                  className="h-14 rounded-xl border border-white/10 bg-black/60 text-lg font-bold text-amber-100 shadow-[inset_0_4px_8px_rgba(0,0,0,0.6)] placeholder:text-white/20 focus-visible:ring-2 focus-visible:ring-rose-500"
                />
              </div>

              {error && (
                <div className="rounded-lg border border-red-500/20 bg-red-950/50 p-4 text-center shadow-[inset_0_2px_4px_rgba(0,0,0,0.5)]">
                  <p className="text-sm font-bold uppercase text-red-400">{error}</p>
                </div>
              )}

              <div className="flex gap-4 pt-4">
                <Button
                  className="h-14 flex-1 rounded-xl border-b-4 border-zinc-700 bg-zinc-600 font-bold uppercase tracking-widest text-white shadow-[inset_0_2px_4px_rgba(255,255,255,0.1)] transition-all hover:-translate-y-1 hover:bg-zinc-500 active:translate-y-1 active:border-b-0 active:mt-1 disabled:opacity-50"
                  onClick={handleClose}
                >
                  Regresar
                </Button>
                <Button
                  className="h-14 flex-1 rounded-xl border-b-4 border-rose-900 bg-rose-600 font-bold uppercase tracking-widest text-white shadow-[inset_0_2px_4px_rgba(255,255,255,0.3),0_8px_16px_rgba(225,29,72,0.4)] transition-all hover:-translate-y-1 hover:bg-rose-500 active:translate-y-1 active:border-b-0 active:mt-1 disabled:opacity-50 disabled:translate-y-0 disabled:border-b-4"
                  disabled={disabled}
                  onClick={handleCreate}
                >
                  {loading ? "Creando..." : "Crear"}
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
""",
    "src/components/landing/join-room-modal.tsx": r""""use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

import { Button, Input, Label } from "@/components/ui";
import { getErrorMessage } from "@/lib/error-message";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";
import { ensureGuestUser } from "@/lib/guest-session";
import { playSfx } from "@/lib/audio";

type JoinRoomModalProps = { open: boolean; onOpenChange: (open: boolean) => void; };

type JoinRoomRpcRow = { room_id: string; room_code: string; seat_index: number; };

function mapJoinRoomError(message: string): string {
  if (message.includes("ROOM_NOT_FOUND")) return "La sala no existe.";
  if (message.includes("INVALID_PASSWORD")) return "Contraseña incorrecta.";
  if (message.includes("ROOM_FULL")) return "La sala está llena.";
  if (message.includes("ROOM_NOT_JOINABLE")) return "La partida ya inició o está cerrada.";
  if (message.includes("AUTH_REQUIRED")) return "Error de sesión.";
  if (message.includes("DISPLAY_NAME_REQUIRED")) return "Ingresa un nombre.";
  return message;
}

export function JoinRoomModal({ open, onOpenChange }: JoinRoomModalProps) {
  const router = useRouter();
  const [displayName, setDisplayName] = useState("");
  const [roomCode, setRoomCode] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const disabled = useMemo(() => loading || displayName.trim().length < 2 || roomCode.trim().length < 4, [displayName, loading, roomCode]);

  const handleJoin = async () => {
    playSfx("click");
    setError(null);
    setLoading(true);

    try {
      const code = roomCode.trim().toUpperCase();
      const supabase = getSupabaseBrowserClient();
      const guest = await ensureGuestUser();
      const userId = guest.user?.id;

      if (!userId) {
        setError("Error inicializando invitado.");
        return;
      }

      const result = await supabase.rpc("join_room_by_code", {
        p_code: code,
        p_display_name: displayName.trim(),
        p_password: password.trim() ? password.trim() : null,
      });

      if (result.error) {
        playSfx("error");
        setError(mapJoinRoomError(result.error.message));
        return;
      }

      const payload = Array.isArray(result.data) ? result.data[0] : result.data;
      const joinedRoom = payload as JoinRoomRpcRow | null;
      if (!joinedRoom?.room_code) {
        playSfx("error");
        setError("Error al entrar a la sala.");
        return;
      }

      onOpenChange(false);
      router.push(`/lobby/${joinedRoom.room_code}`);
    } catch (error) {
      playSfx("error");
      setError(getErrorMessage(error, "Error interno."));
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    playSfx("error");
    onOpenChange(false);
  };

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[100] grid place-items-center bg-black/80 px-4">
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: "spring", bounce: 0.4 }}
            className="w-full max-w-md rounded-3xl border-2 border-cyan-900/50 bg-[#1c0d12] p-8 shadow-[inset_0_2px_4px_rgba(255,255,255,0.05),0_24px_50px_rgba(0,0,0,0.9)] relative z-50"
          >
            <h2 className="font-heading text-4xl text-cyan-400 drop-shadow-[0_2px_4px_rgba(34,211,238,0.3)]">Unirse</h2>
            <p className="mt-2 text-sm font-bold uppercase tracking-wider text-cyan-200/50">Ingresa tu pase al caos</p>

            <div className="mt-8 space-y-6">
              <div className="space-y-3">
                <Label className="text-sm font-bold uppercase tracking-wider text-cyan-300">Tu nombre</Label>
                <Input
                  value={displayName}
                  onChange={(event) => setDisplayName(event.target.value)}
                  placeholder="Ej. Maki Maestro"
                  className="h-14 rounded-xl border border-white/10 bg-black/60 text-lg font-bold text-amber-100 shadow-[inset_0_4px_8px_rgba(0,0,0,0.6)] placeholder:text-white/20 focus-visible:ring-2 focus-visible:ring-cyan-500"
                />
              </div>

              <div className="space-y-3">
                <Label className="text-sm font-bold uppercase tracking-wider text-cyan-300">Código de Sala</Label>
                <Input
                  value={roomCode}
                  onChange={(event) => setRoomCode(event.target.value.toUpperCase())}
                  placeholder="ABC123"
                  maxLength={6}
                  className="h-14 text-center font-heading tracking-[0.2em] rounded-xl border border-white/10 bg-black/60 text-3xl font-bold text-amber-200 shadow-[inset_0_4px_8px_rgba(0,0,0,0.6)] placeholder:text-white/20 focus-visible:ring-2 focus-visible:ring-cyan-500"
                />
              </div>

              <div className="space-y-3">
                <Label className="text-sm font-bold uppercase tracking-wider text-cyan-300">Contraseña (Si existe)</Label>
                <Input
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  type="password"
                  className="h-14 rounded-xl border border-white/10 bg-black/60 text-lg font-bold text-amber-100 shadow-[inset_0_4px_8px_rgba(0,0,0,0.6)] placeholder:text-white/20 focus-visible:ring-2 focus-visible:ring-cyan-500"
                />
              </div>

              {error && (
                <div className="rounded-lg border border-red-500/20 bg-red-950/50 p-4 text-center shadow-[inset_0_2px_4px_rgba(0,0,0,0.5)]">
                  <p className="text-sm font-bold uppercase text-red-400">{error}</p>
                </div>
              )}

              <div className="flex gap-4 pt-4">
                <Button
                  className="h-14 flex-1 rounded-xl border-b-4 border-zinc-700 bg-zinc-600 font-bold uppercase tracking-widest text-white shadow-[inset_0_2px_4px_rgba(255,255,255,0.1)] transition-all hover:-translate-y-1 hover:bg-zinc-500 active:translate-y-1 active:border-b-0 active:mt-1 disabled:opacity-50"
                  onClick={handleClose}
                >
                  Regresar
                </Button>
                <Button
                  className="h-14 flex-1 rounded-xl border-b-4 border-cyan-900 bg-cyan-600 font-bold uppercase tracking-widest text-white shadow-[inset_0_2px_4px_rgba(255,255,255,0.3),0_8px_16px_rgba(34,211,238,0.4)] transition-all hover:-translate-y-1 hover:bg-cyan-500 active:translate-y-1 active:border-b-0 active:mt-1 disabled:opacity-50 disabled:translate-y-0 disabled:border-b-4"
                  disabled={disabled}
                  onClick={handleJoin}
                >
                  {loading ? "Entrando..." : "Entrar"}
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
""",
    "src/app/lobby/[roomCode]/page.tsx": r""""use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

import { PlayerList } from "@/components/lobby/player-list";
import { RoomCode } from "@/components/lobby/room-code";
import { Button } from "@/components/ui";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";
import { playSfx } from "@/lib/audio";

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
    if (!room?.code || room.status === "LOBBY") return;
    playSfx("alert");
    router.push(`/game/${room.code}`);
  }, [room?.code, room?.status, router]);

  const startMatch = async () => {
    if (!room || !isHost) return;
    if (players.length < 2) {
      playSfx("error");
      setError("Mínimo 2 jugadores.");
      return;
    }

    playSfx("click");
    const supabase = getSupabaseBrowserClient();
    const result = await supabase.from("rooms").update({ status: "ROUND_1" }).eq("id", room.id);
    if (result.error) setError(result.error.message);
  };

  const handleLeaveLobby = async () => {
    playSfx("error");
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
""",
    "src/components/lobby/player-list.tsx": r""""use client";

import { motion } from "framer-motion";
import Image from "next/image";
import pudinImg from "@/assets/cards/pudin.png";
import sashimiImg from "@/assets/cards/sashimi.png";

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
                <span className={`rounded-xl border-2 px-3 py-1.5 font-bold tracking-widest text-[10px] sm:text-xs shadow-[inset_0_2px_4px_rgba(0,0,0,0.6)] ${player.presence === 'online' ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400' : 'bg-zinc-500/20 border-zinc-500/50 text-zinc-400'}`}>
                    {player.presence.toUpperCase()}
                </span>
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
""",
    "src/components/lobby/room-code.tsx": r""""use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui";
import { playSfx } from "@/lib/audio";

import Image from "next/image";
import makiImg from "@/assets/cards/makis-2.png";

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
            <p className="font-heading text-5xl sm:text-6xl tracking-[0.2em] text-cyan-400 drop-shadow-[0_0_15px_rgba(34,211,238,0.4)] animate-pulse ml-2">{roomCode}</p>      
            
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
"""
}

import os
import io
for p, c in FILES_TO_REWRITE.items():
    with io.open(p, 'w', encoding='utf-8') as f:
        f.write(c)

print('All modified components updated correctly.')