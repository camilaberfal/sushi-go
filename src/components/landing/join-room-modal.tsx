"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { Button, Card, Input, Label } from "@/components/ui";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";
import { ensureGuestUser } from "@/lib/guest-session";

type JoinRoomModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

type RoomRow = {
  id: string;
  code: string;
  max_players: number;
  password_hash: string | null;
};

type PlayerSeat = {
  seat_index: number;
};

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

      const roomResult = await supabase.from("rooms").select("id, code, max_players, password_hash").eq("code", code).single();
      if (roomResult.error || !roomResult.data) {
        setError("La sala no existe.");
        return;
      }

      const room = roomResult.data as RoomRow;
      if (room.password_hash && room.password_hash !== password.trim()) {
        setError("Contraseña incorrecta.");
        return;
      }

      const seatsResult = await supabase.from("room_players").select("seat_index").eq("room_id", room.id);
      if (seatsResult.error) {
        setError(seatsResult.error.message);
        return;
      }

      const seats = (seatsResult.data ?? []) as PlayerSeat[];
      if (seats.length >= room.max_players) {
        setError("La sala está llena.");
        return;
      }

      const usedSeat = new Set(seats.map((entry) => entry.seat_index));
      let nextSeat = 0;
      while (usedSeat.has(nextSeat)) {
        nextSeat += 1;
      }

      const upsert = await supabase.from("room_players").insert({
        room_id: room.id,
        user_id: userId,
        display_name: displayName.trim(),
        is_host: false,
        seat_index: nextSeat,
        presence: "online",
      });

      if (upsert.error) {
        if (upsert.error.code === "23505") {
          onOpenChange(false);
          router.push(`/lobby/${room.code}`);
          return;
        }
        setError(upsert.error.message);
        return;
      }

      onOpenChange(false);
      router.push(`/lobby/${room.code}`);
    } catch {
      setError("Ocurrió un error al unirte a la sala.");
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
