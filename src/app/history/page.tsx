"use client";

import { useEffect, useMemo, useState } from "react";

import { MatchList } from "@/components/history/match-list";
import { Badge, Card, ScrollArea, Skeleton } from "@/components/ui";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";

type MatchHistoryRow = {
  game_id: string;
  total_duration_ms: number;
  created_at: string;
};

type GameRow = {
  id: string;
  room_id: string | null;
};

type RoomRow = {
  id: string;
  code: string;
};

type GamePlayerRow = {
  game_id: string;
  display_name: string;
};

export default function HistoryPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [historyRows, setHistoryRows] = useState<MatchHistoryRow[]>([]);
  const [games, setGames] = useState<GameRow[]>([]);
  const [rooms, setRooms] = useState<RoomRow[]>([]);
  const [players, setPlayers] = useState<GamePlayerRow[]>([]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);

      const supabase = getSupabaseBrowserClient();

      const historyRes = await supabase
        .from("match_history")
        .select("game_id, total_duration_ms, created_at")
        .order("created_at", { ascending: false })
        .limit(50);

      if (historyRes.error) {
        setError(historyRes.error.message);
        setLoading(false);
        return;
      }

      const history = (historyRes.data ?? []) as MatchHistoryRow[];
      setHistoryRows(history);

      const gameIds = history.map((row) => row.game_id);
      if (gameIds.length === 0) {
        setLoading(false);
        return;
      }

      const [gamesRes, playersRes] = await Promise.all([
        supabase.from("games").select("id, room_id").in("id", gameIds),
        supabase.from("game_players").select("game_id, display_name").in("game_id", gameIds),
      ]);

      if (gamesRes.error) {
        setError(gamesRes.error.message);
        setLoading(false);
        return;
      }

      if (playersRes.error) {
        setError(playersRes.error.message);
        setLoading(false);
        return;
      }

      const gameRows = (gamesRes.data ?? []) as GameRow[];
      setGames(gameRows);
      setPlayers((playersRes.data ?? []) as GamePlayerRow[]);

      const roomIds = gameRows.map((row) => row.room_id).filter((value): value is string => Boolean(value));
      if (roomIds.length > 0) {
        const roomsRes = await supabase.from("rooms").select("id, code").in("id", roomIds);
        if (roomsRes.error) {
          setError(roomsRes.error.message);
          setLoading(false);
          return;
        }
        setRooms((roomsRes.data ?? []) as RoomRow[]);
      }

      setLoading(false);
    };

    void load();
  }, []);

  const matches = useMemo(() => {
    const gameById = new Map(games.map((game) => [game.id, game]));
    const roomCodeById = new Map(rooms.map((room) => [room.id, room.code]));

    return historyRows.map((row) => {
      const game = gameById.get(row.game_id);
      const roomCode = game?.room_id ? roomCodeById.get(game.room_id) ?? "" : "";
      const playerNames = players.filter((player) => player.game_id === row.game_id).map((player) => player.display_name);

      return {
        gameId: row.game_id,
        roomCode,
        createdAt: row.created_at,
        totalDurationMs: row.total_duration_ms,
        players: playerNames,
      };
    });
  }, [games, historyRows, players, rooms]);

  if (loading) {
    return (
      <main className="mx-auto min-h-screen w-full max-w-6xl space-y-4 px-4 py-10">
        <Skeleton className="h-24 rounded-2xl" />
        <Skeleton className="h-80 rounded-2xl" />
      </main>
    );
  }

  if (error) {
    return (
      <main className="mx-auto flex min-h-screen w-full max-w-4xl items-center justify-center px-4 py-10">
        <Card className="w-full p-6 text-destructive">{error}</Card>
      </main>
    );
  }

  return (
    <main className="relative mx-auto min-h-screen w-full max-w-6xl px-4 py-10">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_20%_15%,rgba(72,199,195,0.2),transparent_38%),radial-gradient(circle_at_70%_10%,rgba(255,107,95,0.2),transparent_36%),radial-gradient(circle_at_50%_90%,rgba(255,210,103,0.2),transparent_40%)]" />

      <Card className="border-2 border-border/80 bg-card/95 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="font-heading text-4xl">Historial de partidas</h1>
          <Badge variant="secondary">{matches.length} partidas</Badge>
        </div>
      </Card>

      <Card className="mt-5 border border-border/80 bg-card/95 p-4">
        <ScrollArea className="max-h-[70vh]">
          <MatchList matches={matches} />
        </ScrollArea>
      </Card>
    </main>
  );
}
