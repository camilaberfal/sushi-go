"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { Button, Card, Input, Label } from "@/components/ui";
import { getErrorMessage } from "@/lib/error-message";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";
import { ensureGuestUser } from "@/lib/guest-session";

type JoinRoomModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

type JoinRoomRpcRow = {
  room_id: string;
  room_code: string;
  seat_index: number;
};

function mapJoinRoomError(message: string): string {
  if (message.includes("ROOM_NOT_FOUND")) return "La sala no existe.";
  if (message.includes("INVALID_PASSWORD")) return "Contraseña incorrecta.";
  if (message.includes("ROOM_FULL")) return "La sala está llena.";
  if (message.includes("ROOM_NOT_JOINABLE")) return "La partida ya inició o no acepta ingresos.";
  if (message.includes("AUTH_REQUIRED")) return "Necesitas iniciar sesión para unirte a la sala.";
  if (message.includes("DISPLAY_NAME_REQUIRED")) return "Ingresa un nombre para continuar.";
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

  if (!open) return null;

  const handleJoin = async () => {
    setError(null);
    setLoading(true);

    try {
      const code = roomCode.trim().toUpperCase();
      const supabase = getSupabaseBrowserClient();

      const guest = await ensureGuestUser();
      const userId = guest.user?.id;

      if (!userId) {
        setError(guest.errorMessage ?? "No se pudo iniciar la sesion de invitado.");
        return;
      }

      const result = await supabase.rpc("join_room_by_code", {
        p_code: code,
        p_display_name: displayName.trim(),
        p_password: password.trim() ? password.trim() : null,
      });

      if (result.error) {
        setError(mapJoinRoomError(result.error.message));
        return;
      }

      const payload = Array.isArray(result.data) ? result.data[0] : result.data;
      const joinedRoom = payload as JoinRoomRpcRow | null;
      if (!joinedRoom?.room_code) {
        setError("No se pudo unir a la sala. Intenta de nuevo.");
        return;
      }

      onOpenChange(false);
      router.push(`/lobby/${joinedRoom.room_code}`);
    } catch (error) {
      console.error("join-room failed", error);
      setError(getErrorMessage(error, "Ocurrió un error al unirte a la sala."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/45 p-4 backdrop-blur-sm">
      <Card className="w-full max-w-md rounded-2xl border-2 border-secondary/70 bg-card/95 p-5 shadow-2xl">
        <h2 className="font-heading text-3xl text-secondary">Únete a una sala</h2>
        <p className="mt-1 text-sm text-muted-foreground">Ingresa código y, si aplica, contraseña.</p>

        <div className="mt-5 space-y-4">
          <div className="space-y-2">
            <Label>Tu nombre</Label>
            <Input value={displayName} onChange={(event) => setDisplayName(event.target.value)} placeholder="Ej. Vale" />
          </div>

          <div className="space-y-2">
            <Label>Código de sala</Label>
            <Input
              value={roomCode}
              onChange={(event) => setRoomCode(event.target.value.toUpperCase())}
              placeholder="ABC123"
              maxLength={6}
            />
          </div>

          <div className="space-y-2">
            <Label>Contraseña (si existe)</Label>
            <Input value={password} onChange={(event) => setPassword(event.target.value)} type="password" />
          </div>

          {error ? <p className="text-sm text-destructive">{error}</p> : null}

          <div className="flex gap-2">
            <Button className="flex-1" disabled={disabled} onClick={handleJoin} variant="secondary">
              {loading ? "Uniéndote..." : "Unirme"}
            </Button>
            <Button className="flex-1" onClick={() => onOpenChange(false)} variant="outline">
              Cancelar
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
