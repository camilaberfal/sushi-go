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
      <main className="mx-auto min-h-screen w-full max-w-6xl space-y-4 px-4 py-10 text-white">
        <Skeleton className="h-24 rounded-2xl" />
        <Skeleton className="h-80 rounded-2xl" />
      </main>
    );
  }

  if (error) {
    return (
      <main className="mx-auto flex min-h-screen w-full max-w-4xl items-center justify-center px-4 py-10">
        <Card className="w-full border border-white/15 bg-[#120912]/95 p-6 text-red-300">{error}</Card>
      </main>
    );
  }

  return (
    <main className="relative mx-auto min-h-screen w-full max-w-6xl bg-gradient-to-b from-[#190a2d] via-[#10071c] to-[#09040f] px-4 py-10 text-white">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute left-[10%] top-[10%] h-[320px] w-[320px] rounded-full bg-cyan-500/20 blur-[120px]" />
        <div className="absolute right-[8%] top-[14%] h-[280px] w-[280px] rounded-full bg-rose-500/20 blur-[110px]" />
        <div className="absolute bottom-[8%] left-[42%] h-[360px] w-[360px] rounded-full bg-amber-400/12 blur-[130px]" />
      </div>

      <Card className="border border-white/15 bg-[#130915]/90 p-5 shadow-[0_24px_50px_rgba(0,0,0,0.6)] backdrop-blur-xl">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="font-heading text-4xl">Historial de partidas</h1>
          <Badge variant="secondary">{matches.length} partidas</Badge>
        </div>
      </Card>

      <Card className="mt-5 border border-white/15 bg-[#130915]/90 p-4 shadow-[0_24px_50px_rgba(0,0,0,0.6)] backdrop-blur-xl">
        <ScrollArea className="max-h-[70vh]">
          <MatchList matches={matches} />
        </ScrollArea>
      </Card>
    </main>
  );
}
