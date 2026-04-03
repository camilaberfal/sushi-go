"use client";

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
    playSfx("select");
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
        playSfx("reveal");
        setError(mapJoinRoomError(result.error.message));
        return;
      }

      const payload = Array.isArray(result.data) ? result.data[0] : result.data;
      const joinedRoom = payload as JoinRoomRpcRow | null;
      if (!joinedRoom?.room_code) {
        playSfx("reveal");
        setError("Error al entrar a la sala.");
        return;
      }

      onOpenChange(false);
      router.push(`/lobby/${joinedRoom.room_code}`);
    } catch (error) {
      playSfx("reveal");
      setError(getErrorMessage(error, "Error interno."));
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
                  className="h-14 flex-1 rounded-xl border-b-4 border-indigo-900 bg-indigo-600 font-bold uppercase tracking-widest text-white shadow-[inset_0_2px_4px_rgba(255,255,255,0.3),0_8px_16px_rgba(79,70,229,0.4)] transition-all hover:-translate-y-1 hover:bg-indigo-500 active:translate-y-1 active:border-b-0 active:mt-1 disabled:opacity-50 disabled:translate-y-0 disabled:border-b-4"
                  style={{ backgroundColor: "#4f46e5", borderColor: "#312e81" }}
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
