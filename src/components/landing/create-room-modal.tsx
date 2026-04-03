"use client";

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
    playSfx("select");
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
    playSfx("reveal");
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
            <p className="mt-2 text-sm font-bold uppercase tracking-wider text-rose-200/50">¡Configura la partida!</p>

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
