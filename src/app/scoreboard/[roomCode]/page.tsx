"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

import { Achievements } from "@/components/scoreboard/achievements";
import { FinalPodium } from "@/components/scoreboard/final-podium";
import { RoundBreakdown } from "@/components/scoreboard/round-breakdown";
import { Badge, Button, Card, Skeleton, Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";

type RoomRow = { id: string; code: string };
type GameRow = { id: string; room_id: string | null; status: string; ended_at: string | null; started_at: string };
type GamePlayerRow = {
  game_id: string;
  user_id: string;
  display_name: string;
  final_score: number;
  puddings: number;
  score_by_round: number[];
};
type RoundSummaryRow = { game_id: string; round: number; payload: unknown };
type MatchHistoryRow = {
  game_id: string;
  total_duration_ms: number;
  highlights: Record<string, unknown>;
};

function parseRoundSummaries(rows: RoundSummaryRow[], players: GamePlayerRow[]) {
  return rows
    .sort((a, b) => a.round - b.round)
    .map((row) => {
      const payload = typeof row.payload === "object" && row.payload ? (row.payload as Record<string, unknown>) : {};
      const byPlayer = (payload.byPlayer ?? {}) as Record<string, Record<string, number>>;

      return {
        round: row.round,
        players: players.map((player) => {
          const byCategory = byPlayer[player.user_id] ?? {};
          const points = player.score_by_round?.[row.round - 1] ?? 0;
          return {
            playerId: player.user_id,
            displayName: player.display_name,
            points,
            byCategory,
          };
        }),
      };
    });
}

export default function ScoreboardPage() {
  const params = useParams<{ roomCode: string }>();
  const roomCode = (params.roomCode ?? "").toUpperCase();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [game, setGame] = useState<GameRow | null>(null);
  const [players, setPlayers] = useState<GamePlayerRow[]>([]);
  const [roundSummaries, setRoundSummaries] = useState<RoundSummaryRow[]>([]);
  const [history, setHistory] = useState<MatchHistoryRow | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);

      const supabase = getSupabaseBrowserClient();
      const roomRes = await supabase.from("rooms").select("id, code").eq("code", roomCode).single();
      if (roomRes.error || !roomRes.data) {
        setError("No se encontro la sala para este scoreboard.");
        setLoading(false);
        return;
      }

      const room = roomRes.data as RoomRow;
      const gameRes = await supabase
        .from("games")
        .select("id, room_id, status, ended_at, started_at")
        .eq("room_id", room.id)
        .order("started_at", { ascending: false })
        .limit(1)
        .single();

      if (gameRes.error || !gameRes.data) {
        setError("No hay partida finalizada para esta sala.");
        setLoading(false);
        return;
      }

      const gameRow = gameRes.data as GameRow;
      setGame(gameRow);

      const [playersRes, roundsRes, historyRes] = await Promise.all([
        supabase
          .from("game_players")
          .select("game_id, user_id, display_name, final_score, puddings, score_by_round")
          .eq("game_id", gameRow.id),
        supabase.from("round_summaries").select("game_id, round, payload").eq("game_id", gameRow.id),
        supabase.from("match_history").select("game_id, total_duration_ms, highlights").eq("game_id", gameRow.id).maybeSingle(),
      ]);

      if (playersRes.error) {
        setError(playersRes.error.message);
        setLoading(false);
        return;
      }

      if (roundsRes.error) {
        setError(roundsRes.error.message);
        setLoading(false);
        return;
      }

      if (historyRes.error) {
        setError(historyRes.error.message);
        setLoading(false);
        return;
      }

      setPlayers((playersRes.data ?? []) as GamePlayerRow[]);
      setRoundSummaries((roundsRes.data ?? []) as RoundSummaryRow[]);
      setHistory((historyRes.data ?? null) as MatchHistoryRow | null);
      setLoading(false);
    };

    if (roomCode) {
      void load();
    } else {
      setError("Codigo de sala invalido.");
      setLoading(false);
    }
  }, [roomCode]);

  const podiumPlayers = useMemo(
    () => players.map((player) => ({ playerId: player.user_id, displayName: player.display_name, finalScore: player.final_score, puddings: player.puddings })),
    [players]
  );

  const rounds = useMemo(() => parseRoundSummaries(roundSummaries, players), [roundSummaries, players]);

  if (loading) {
    return (
      <main className="mx-auto min-h-screen w-full max-w-6xl space-y-4 px-4 py-10">
        <Skeleton className="h-24 rounded-2xl" />
        <Skeleton className="h-56 rounded-2xl" />
        <Skeleton className="h-72 rounded-2xl" />
      </main>
    );
  }

  if (error || !game) {
    return (
      <main className="mx-auto flex min-h-screen w-full max-w-3xl items-center justify-center px-4 py-10">
        <Card className="w-full p-6">
          <p className="text-destructive">{error ?? "No se pudo cargar el scoreboard."}</p>
          <div className="mt-4">
            <Button asChild variant="outline">
              <Link href="/">Volver al inicio</Link>
            </Button>
          </div>
        </Card>
      </main>
    );
  }

  return (
    <main className="relative mx-auto min-h-screen w-full max-w-6xl px-4 py-10">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_25%_10%,rgba(255,107,95,0.22),transparent_35%),radial-gradient(circle_at_85%_20%,rgba(72,199,195,0.22),transparent_35%),radial-gradient(circle_at_50%_90%,rgba(255,210,103,0.25),transparent_40%)]" />

      <Card className="border-2 border-border/80 bg-card/95 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="font-heading text-4xl">Scoreboard Final</h1>
            <p className="mt-1 text-sm text-muted-foreground">Sala {roomCode}</p>
          </div>
          <Badge variant={game.status === "FINISHED" ? "secondary" : "outline"}>{game.status}</Badge>
        </div>
      </Card>

      <Tabs className="mt-5" defaultValue="podio">
        <TabsList>
          <TabsTrigger value="podio">Podio</TabsTrigger>
          <TabsTrigger value="rondas">Rondas</TabsTrigger>
          <TabsTrigger value="logros">Logros</TabsTrigger>
        </TabsList>

        <TabsContent value="podio">
          <FinalPodium players={podiumPlayers} />
        </TabsContent>

        <TabsContent value="rondas">
          <RoundBreakdown rounds={rounds} />
        </TabsContent>

        <TabsContent value="logros">
          <Achievements highlights={history?.highlights ?? {}} />
          <Card className="mt-4 p-4 text-sm text-muted-foreground">
            Duracion total: {history ? `${Math.floor(history.total_duration_ms / 1000)}s` : "N/A"}
          </Card>
        </TabsContent>
      </Tabs>

      <div className="mt-6 flex flex-wrap gap-2">
        <Button asChild>
          <Link href={`/lobby/${roomCode}`}>Revancha</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/history">Ver historial</Link>
        </Button>
        <Button asChild variant="ghost">
          <Link href="/">Volver al inicio</Link>
        </Button>
      </div>
    </main>
  );
}
