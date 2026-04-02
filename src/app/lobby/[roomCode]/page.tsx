"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";

import { PlayerList } from "@/components/lobby/player-list";
import { RoomCode } from "@/components/lobby/room-code";
import { Button, Card, Input, Label } from "@/components/ui";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";

type Room = {
  id: string;
  code: string;
  host_id: string;
  max_players: number;
  password_hash: string | null;
  status: string;
};

type LobbyPlayer = {
  user_id: string;
  display_name: string;
  is_host: boolean;
  seat_index: number;
  presence: "online" | "offline" | "bot";
};

export default function LobbyPage() {
  const params = useParams<{ roomCode: string }>();
  const router = useRouter();
  const roomCode = (params.roomCode ?? "").toUpperCase();

  const [loading, setLoading] = useState(true);
  const [room, setRoom] = useState<Room | null>(null);
  const [players, setPlayers] = useState<LobbyPlayer[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [maxPlayersInput, setMaxPlayersInput] = useState("4");
  const [passwordInput, setPasswordInput] = useState("");

  const isHost = useMemo(() => !!room && !!currentUserId && room.host_id === currentUserId, [room, currentUserId]);

  const loadLobby = useCallback(async () => {
    setLoading(true);
    setError(null);

    const supabase = getSupabaseBrowserClient();
    const auth = await supabase.auth.getUser();
    setCurrentUserId(auth.data.user?.id ?? null);

    const roomRes = await supabase
      .from("rooms")
      .select("id, code, host_id, max_players, password_hash, status")
      .eq("code", roomCode)
      .single();

    if (roomRes.error || !roomRes.data) {
      setError("La sala no existe o ya fue cerrada.");
      setLoading(false);
      return;
    }

    const lobbyRoom = roomRes.data as Room;
    setRoom(lobbyRoom);
    setMaxPlayersInput(String(lobbyRoom.max_players));
    setPasswordInput(lobbyRoom.password_hash ?? "");

    const playersRes = await supabase
      .from("room_players")
      .select("user_id, display_name, is_host, seat_index, presence")
      .eq("room_id", lobbyRoom.id)
      .order("seat_index", { ascending: true });

    if (playersRes.error) {
      setError(playersRes.error.message);
      setLoading(false);
      return;
    }

    setPlayers((playersRes.data ?? []) as LobbyPlayer[]);
    setLoading(false);
  }, [roomCode]);

  useEffect(() => {
    void loadLobby();
  }, [loadLobby]);

  useEffect(() => {
    if (!room?.id) return;

    const supabase = getSupabaseBrowserClient();
    const channel = supabase
      .channel(`lobby:${room.id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "rooms", filter: `id=eq.${room.id}` }, () => {
        void loadLobby();
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "room_players", filter: `room_id=eq.${room.id}` }, () => {
        void loadLobby();
      });

    channel.subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [loadLobby, room?.id]);

  const updateRoomSettings = async () => {
    if (!room || !isHost) return;

    const nextMaxPlayers = Number(maxPlayersInput);
    if (!Number.isInteger(nextMaxPlayers) || nextMaxPlayers < 2 || nextMaxPlayers > 5) {
      setError("El límite debe estar entre 2 y 5 jugadores.");
      return;
    }

    if (players.length > nextMaxPlayers) {
      setError("No puedes bajar el límite por debajo de los jugadores actuales.");
      return;
    }

    const supabase = getSupabaseBrowserClient();
    const result = await supabase
      .from("rooms")
      .update({ max_players: nextMaxPlayers, password_hash: passwordInput.trim() ? passwordInput.trim() : null })
      .eq("id", room.id);

    if (result.error) {
      setError(result.error.message);
      return;
    }

    setError(null);
    void loadLobby();
  };

  const startMatch = async () => {
    if (!room || !isHost) return;
    if (players.length < 2) {
      setError("Necesitas al menos 2 jugadores para iniciar.");
      return;
    }

    const supabase = getSupabaseBrowserClient();
    const result = await supabase.from("rooms").update({ status: "ROUND_1" }).eq("id", room.id);

    if (result.error) {
      setError(result.error.message);
      return;
    }

    router.push(`/game/${room.code}`);
  };

  if (loading) {
    return <main className="mx-auto flex min-h-screen w-full max-w-5xl items-center justify-center px-4">Cargando lobby...</main>;
  }

  if (!room) {
    return (
      <main className="mx-auto flex min-h-screen w-full max-w-5xl items-center justify-center px-4">
        <Card className="p-6">
          <p className="text-destructive">{error ?? "No se pudo cargar la sala."}</p>
        </Card>
      </main>
    );
  }

  return (
    <main className="relative mx-auto min-h-screen w-full max-w-6xl px-4 py-10">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_20%_20%,rgba(255,107,95,0.2),transparent_40%),radial-gradient(circle_at_80%_15%,rgba(72,199,195,0.22),transparent_38%),radial-gradient(circle_at_50%_80%,rgba(255,210,103,0.22),transparent_42%)]" />

      <div className="grid gap-5 md:grid-cols-[1.1fr_1fr]">
        <section className="space-y-5">
          <RoomCode roomCode={room.code} />
          <PlayerList players={players} />
        </section>

        <section>
          <Card className="border-2 border-border/80 bg-card/95 p-5">
            <h1 className="font-heading text-3xl text-foreground">Lobby de espera</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {isHost ? "Configura la sala y empieza cuando estén listos." : "Esperando a que el host inicie la partida."}
            </p>

            <div className="mt-5 space-y-4">
              <div className="space-y-2">
                <Label>Límite de jugadores</Label>
                <Input
                  disabled={!isHost}
                  value={maxPlayersInput}
                  onChange={(event) => setMaxPlayersInput(event.target.value)}
                  type="number"
                  min={2}
                  max={5}
                />
              </div>

              <div className="space-y-2">
                <Label>Contraseña</Label>
                <Input
                  disabled={!isHost}
                  value={passwordInput}
                  onChange={(event) => setPasswordInput(event.target.value)}
                  placeholder={isHost ? "Opcional" : "Solo el host puede editar"}
                  type="password"
                />
              </div>

              {error ? <p className="text-sm text-destructive">{error}</p> : null}

              {isHost ? (
                <div className="flex flex-col gap-2 sm:flex-row">
                  <Button className="flex-1" onClick={updateRoomSettings} variant="outline">
                    Guardar ajustes
                  </Button>
                  <Button className="flex-1" disabled={players.length < 2} onClick={startMatch}>
                    Iniciar partida
                  </Button>
                </div>
              ) : (
                <Card className="border border-secondary/40 bg-secondary/10 p-3 text-sm text-secondary-foreground">
                  Esperando a que el host inicie la partida.
                </Card>
              )}
            </div>
          </Card>
        </section>
      </div>
    </main>
  );
}
