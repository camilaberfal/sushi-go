"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { Button, Card, Input, Label } from "@/components/ui";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";
import { ensureGuestUser } from "@/lib/guest-session";

type CreateRoomModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

type RoomRow = {
  id: string;
  code: string;
};

function generateRoomId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function generateRoomCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i += 1) {
    code += chars[Math.floor(Math.random() * chars.length)] ?? "A";
  }
  return code;
}

export function CreateRoomModal({ open, onOpenChange }: CreateRoomModalProps) {
  const router = useRouter();
  const [displayName, setDisplayName] = useState("");
  const [maxPlayers, setMaxPlayers] = useState(4);
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const disabled = useMemo(() => loading || displayName.trim().length < 2, [displayName, loading]);

  if (!open) return null;

  const handleCreate = async () => {
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
            id: roomId,
            code,
            host_id: userId,
            max_players: maxPlayers,
            password_hash: password.trim() ? password.trim() : null,
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
        setError("No se pudo generar un código de sala único. Intenta otra vez.");
        return;
      }

      const playerInsert = await supabase.from("room_players").insert({
        room_id: room.id,
        user_id: userId,
        display_name: displayName.trim(),
        is_host: true,
        seat_index: 0,
        presence: "online",
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
    } catch {
      setError("Ocurrió un error al crear la sala.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/45 p-4 backdrop-blur-sm">
      <Card className="w-full max-w-md rounded-2xl border-2 border-accent/70 bg-card/95 p-5 shadow-2xl">
        <h2 className="font-heading text-3xl text-primary">Crea una sala</h2>
        <p className="mt-1 text-sm text-muted-foreground">Configura tu partida y comparte el código.</p>

        <div className="mt-5 space-y-4">
          <div className="space-y-2">
            <Label>Tu nombre</Label>
            <Input value={displayName} onChange={(event) => setDisplayName(event.target.value)} placeholder="Ej. Nico" />
          </div>

          <div className="space-y-2">
            <Label>Límite de jugadores</Label>
            <select
              value={maxPlayers}
              onChange={(event) => setMaxPlayers(Number(event.target.value))}
              className="h-10 w-full rounded-lg border border-input bg-card px-3 text-sm"
            >
              <option value={2}>2</option>
              <option value={3}>3</option>
              <option value={4}>4</option>
              <option value={5}>5</option>
            </select>
          </div>

          <div className="space-y-2">
            <Label>Contraseña (opcional)</Label>
            <Input
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Deja vacío para sala pública"
              type="password"
            />
          </div>

          {error ? <p className="text-sm text-destructive">{error}</p> : null}

          <div className="flex gap-2">
            <Button className="flex-1" disabled={disabled} onClick={handleCreate}>
              {loading ? "Creando..." : "Crear sala"}
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
