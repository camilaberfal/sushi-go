"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import gyozaImg from "@/app/assets/illustrations/gyoza-illustration.png";
import makisX3Img from "@/app/assets/illustrations/maki-illustration-x3.png";
import palillosImg from "@/app/assets/illustrations/palillos-illustration.png";
import pudinImg from "@/app/assets/illustrations/pudin-illustration.png";
import sashimiImg from "@/app/assets/illustrations/sashimi-illustration.png";
import tempuraImg from "@/app/assets/illustrations/tempura-illustration.png";
import wasabiImg from "@/app/assets/illustrations/wasabi-illustration.png";
import nigiriSalmonImg from "@/app/assets/illustrations/nigiri-salmon-illustration.png";
import Image, { StaticImageData } from "next/image";
import { motion } from "framer-motion";

import { Achievement } from "@/components/scoreboard/AchievementBadge";
import { FinalScoreboard } from "@/components/scoreboard/FinalScoreboard";
import { HighlightStats } from "@/components/scoreboard/ForensicReport";
import { PlayerStat } from "@/components/scoreboard/Podium";
import { SyncAfterTurnPayload } from "@/domain/protocol";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";
import { getRoomStoreState } from "@/store/room-store";

type RoomRow = { id: string; code: string };
type RoomPlayerRow = { user_id: string; display_name: string };
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

type LoadedState = {
  game: GameRow;
  players: GamePlayerRow[];
  history: MatchHistoryRow | null;
  roundSummaries: RoundSummaryRow[];
};

const LOADING_SHOWCASE: Array<{ id: string; image: StaticImageData; tint: string }> = [
  { id: "nigiri", image: nigiriSalmonImg, tint: "from-rose-500/25 to-transparent" },
  { id: "maki", image: makisX3Img, tint: "from-amber-400/25 to-transparent" },
  { id: "wasabi", image: wasabiImg, tint: "from-emerald-400/25 to-transparent" },
];

function LoadingFinalScoreboard() {
  return (
    <main className="relative grid min-h-screen place-items-center overflow-hidden bg-[#130818] px-4 text-white">
      <div className="pointer-events-none absolute inset-0">
        <motion.div
          className="absolute -left-20 top-10 h-72 w-72 rounded-full bg-rose-500/20 blur-[90px]"
          animate={{ x: [0, 45, 0], y: [0, -10, 0] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute right-0 top-1/3 h-80 w-80 rounded-full bg-cyan-400/20 blur-[100px]"
          animate={{ x: [0, -50, 0], y: [0, 20, 0] }}
          transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute bottom-0 left-1/3 h-80 w-80 rounded-full bg-amber-400/15 blur-[110px]"
          animate={{ y: [0, -35, 0] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>

      <div className="relative z-10 w-full max-w-3xl rounded-3xl border border-white/10 bg-black/35 p-6 shadow-[0_20px_60px_rgba(0,0,0,0.55)] backdrop-blur-xl">
        <motion.h1
          className="text-center font-heading text-3xl font-black uppercase tracking-[0.18em] text-amber-300"
          initial={{ opacity: 0.6 }}
          animate={{ opacity: [0.55, 1, 0.55] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
        >
          Cargando Scoreboard Final
        </motion.h1>

        <p className="mt-2 text-center text-sm text-white/75">Preparando podio, logros y reporte forense...</p>

        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          {LOADING_SHOWCASE.map((item, index) => (
            <motion.div
              key={item.id}
              className="relative overflow-hidden rounded-2xl border border-white/10 bg-[#1a0e22] p-4"
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: [0.55, 1, 0.55], y: [8, -4, 8] }}
              transition={{ delay: index * 0.12, duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${item.tint}`} />
              <div className="relative flex h-24 items-center justify-center">
                <Image src={item.image} alt="" className="h-20 w-20 object-contain drop-shadow-[0_8px_18px_rgba(0,0,0,0.7)]" />
              </div>
              <motion.div
                className="mt-3 h-2 rounded-full bg-white/10"
                initial={{ scaleX: 0.1, originX: 0 }}
                animate={{ scaleX: [0.15, 1, 0.15] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
              />
            </motion.div>
          ))}
        </div>
      </div>
    </main>
  );
}

function hydrateFromSnapshot(snapshot: SyncAfterTurnPayload, nameByPlayerId: Record<string, string> = {}): LoadedState {
  const syntheticGame: GameRow = {
    id: `local-${snapshot.roomId}`,
    room_id: snapshot.roomId,
    status: "FINISHED",
    ended_at: new Date().toISOString(),
    started_at: new Date().toISOString(),
  };

  const syntheticPlayers: GamePlayerRow[] = Object.values(snapshot.players).map((player) => ({
    game_id: syntheticGame.id,
    user_id: player.id,
    display_name: nameByPlayerId[player.id] ?? player.id,
    final_score: (player.scoreByRound ?? []).reduce((sum, value) => sum + value, 0),
    puddings: player.puddings,
    score_by_round: player.scoreByRound,
  }));

  const roundCount = snapshot.totalRounds ?? 3;
  const syntheticRounds: RoundSummaryRow[] = Array.from({ length: roundCount }, (_, idx) => ({
    game_id: syntheticGame.id,
    round: idx + 1,
    payload: { byPlayer: {} },
  }));

  return {
    game: syntheticGame,
    players: syntheticPlayers,
    roundSummaries: syntheticRounds,
    history: null,
  };
}

function readFinalSnapshotFallback(roomCode: string): SyncAfterTurnPayload | null {
  const storeSnapshot = getRoomStoreState().snapshot;
  if (storeSnapshot?.status === "WAITING_SCOREBOARD" && storeSnapshot.round >= storeSnapshot.totalRounds) {
    return storeSnapshot;
  }

  try {
    const raw = window.localStorage.getItem(`sushi-go:last-final:${roomCode}`);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as { savedAt?: number; snapshot?: SyncAfterTurnPayload };
    const snapshot = parsed?.snapshot;
    if (!snapshot) return null;
    if (snapshot.status !== "WAITING_SCOREBOARD") return null;
    if (snapshot.round < snapshot.totalRounds) return null;

    return snapshot;
  } catch {
    return null;
  }
}

function numberFromUnknown(value: unknown, fallback = 0): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number.parseFloat(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return fallback;
}

function stringFromUnknown(value: unknown, fallback = ""): string {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : fallback;
}

function colorFromSeed(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash << 5) - hash + seed.charCodeAt(i);
    hash |= 0;
  }

  const palette = ["#FF6B6B", "#4ECDC4", "#FFE66D", "#F9A8D4", "#6EE7B7", "#93C5FD"];
  return palette[Math.abs(hash) % palette.length];
}

function cardKey(raw: string): string {
  return raw.split("-")[0];
}

function computePuddingPoints(players: GamePlayerRow[]): Record<string, number> {
  const result = Object.fromEntries(players.map((p) => [p.user_id, 0])) as Record<string, number>;
  if (players.length === 0) return result;

  const puddings = players.map((p) => ({ id: p.user_id, count: p.puddings }));
  const max = Math.max(...puddings.map((p) => p.count));
  const min = Math.min(...puddings.map((p) => p.count));

  const top = puddings.filter((p) => p.count === max);
  top.forEach((p) => {
    result[p.id] += Math.floor(6 / top.length);
  });

  if (players.length > 2 && max !== min) {
    const bottom = puddings.filter((p) => p.count === min);
    bottom.forEach((p) => {
      result[p.id] -= Math.floor(6 / bottom.length);
    });
  }

  return result;
}

function toPodiumPlayers(players: GamePlayerRow[]): PlayerStat[] {
  const puddingPoints = computePuddingPoints(players);
  const ranked = [...players].sort((a, b) => {
    if (b.final_score !== a.final_score) return b.final_score - a.final_score;
    return b.puddings - a.puddings;
  });

  return ranked.map((player, index) => ({
    id: player.user_id,
    name: player.display_name,
    score: player.final_score,
    puddingScore: puddingPoints[player.user_id] ?? 0,
    rank: index + 1,
    colorHex: colorFromSeed(player.user_id),
  }));
}

function readHighlightMetrics(highlights: Record<string, unknown>, players: GamePlayerRow[]): HighlightStats {
  const defaultPlayer = players[0]?.display_name ?? "Sin datos";

  const fastestName =
    stringFromUnknown(highlights.fastestPlayer) ||
    stringFromUnknown(highlights.fastest_player) ||
    defaultPlayer;
  const slowestName =
    stringFromUnknown(highlights.slowestPlayer) ||
    stringFromUnknown(highlights.slowest_player) ||
    defaultPlayer;

  const fastestCard =
    stringFromUnknown(highlights.fastestCard) ||
    stringFromUnknown(highlights.fastest_card) ||
    "nigiri_salmon";
  const slowestCard =
    stringFromUnknown(highlights.slowestCard) ||
    stringFromUnknown(highlights.slowest_card) ||
    "tempura";

  const mostPlayedCard =
    stringFromUnknown(highlights.mostPlayedCard) ||
    stringFromUnknown(highlights.most_played_card) ||
    "maki_2";

  const mostPlayedCount =
    numberFromUnknown(highlights.mostPlayedCount, 0) ||
    numberFromUnknown(highlights.most_played_count, 0) ||
    0;

  // Do NOT fall back to a player's best round total for "most profitable card";
  // that can produce inflated / misleading values (e.g. whole-round totals).
  const bestPointsCard =
    stringFromUnknown(highlights.cardMostPoints) ||
    stringFromUnknown(highlights.mostProfitableCard) ||
    mostPlayedCard;
  const bestPointsPlayer =
    stringFromUnknown(highlights.cardMostPointsPlayer) ||
    stringFromUnknown(highlights.mostProfitableCardPlayer) ||
    stringFromUnknown(highlights.card_most_points_player) ||
    defaultPlayer;
  const bestPointsValue =
    numberFromUnknown(highlights.totalPointsByBestCard, 0) ||
    numberFromUnknown(highlights.cardMostPointsValue, 0) ||
    numberFromUnknown(highlights.total_points_by_best_card, 0) ||
    0;

  return {
    fastestPlay: {
      playerName: fastestName,
      fastestTime: numberFromUnknown(highlights.fastestTimeSeconds, 0) || numberFromUnknown(highlights.fastest_time_seconds, 0) || 0,
      cardId: cardKey(fastestCard),
    },
    slowestPlay: {
      playerName: slowestName,
      slowestTime: numberFromUnknown(highlights.slowestTimeSeconds, 0) || numberFromUnknown(highlights.slowest_time_seconds, 0) || 0,
      cardId: cardKey(slowestCard),
    },
    mostPlayedCard: {
      cardId: cardKey(mostPlayedCard),
      count: Math.max(0, Math.round(mostPlayedCount)),
    },
    mostProfitableCard: {
      cardId: cardKey(bestPointsCard),
      totalPointsGenerated: Math.max(0, Math.round(bestPointsValue)),
      playerName: bestPointsPlayer,
    },
  };
}

function resolveWinnerName(highlights: Record<string, unknown>, keys: string[]): string | null {
  for (const key of keys) {
    const candidate = stringFromUnknown(highlights[key]);
    if (candidate) return candidate;
  }
  return null;
}

function buildAchievements(players: GamePlayerRow[], highlights: Record<string, unknown>): Achievement[] {
  const winnerByPudding = [...players].sort((a, b) => b.puddings - a.puddings)[0]?.display_name ?? null;
  const champion = [...players].sort((a, b) => b.final_score - a.final_score)[0]?.display_name ?? null;

  const roundWinners: string[] = [0, 1, 2].map((roundIndex) => {
    const sorted = [...players].sort((a, b) => (b.score_by_round?.[roundIndex] ?? 0) - (a.score_by_round?.[roundIndex] ?? 0));
    return sorted[0]?.display_name ?? "";
  });

  const sweepWinner = roundWinners[0] && roundWinners.every((name) => name === roundWinners[0]) ? roundWinners[0] : null;

  const round2Ordered = [...players].sort((a, b) => (a.score_by_round?.[1] ?? 0) - (b.score_by_round?.[1] ?? 0));
  const lastOnRound2 = round2Ordered[0]?.display_name ?? null;
  const comeback = lastOnRound2 && champion && lastOnRound2 === champion ? champion : null;

  const achievements: Achievement[] = [
    {
      id: "maki-king",
      name: "Rey del Maki",
      accent: "#FFE66D",
      icon: makisX3Img,
      winnerPlayerName: resolveWinnerName(highlights, ["makiKing", "maki_king", "mostMakiPlayer"]),
      description: "Más íconos de maki",
    },
    {
      id: "pudding-addict",
      name: "Pudin Addict",
      accent: "#FF6B6B",
      icon: pudinImg,
      winnerPlayerName: winnerByPudding,
      description: "Más pudines acumulados",
    },
    {
      id: "rayo",
      name: "Rayo",
      accent: "#4ECDC4",
      icon: nigiriSalmonImg,
      winnerPlayerName: resolveWinnerName(highlights, ["fastestPlayer", "fastest_player"]),
      description: "Promedio de jugada más bajo",
    },
    {
      id: "sin-prisa",
      name: "Sin Prisa",
      accent: "#93C5FD",
      icon: tempuraImg,
      winnerPlayerName: resolveWinnerName(highlights, ["slowestPlayer", "slowest_player"]),
      description: "Promedio de jugada más alto",
    },
    {
      id: "palillo-pro",
      name: "Palillo Pro",
      accent: "#4ECDC4",
      icon: palillosImg,
      winnerPlayerName: resolveWinnerName(highlights, ["chopsticksMaster", "chopsticks_master"]),
      description: "Más usos de palillos",
    },
    {
      id: "wasabi-sniper",
      name: "Wasabi Sniper",
      accent: "#6EE7B7",
      icon: wasabiImg,
      winnerPlayerName: resolveWinnerName(highlights, ["wasabiSniper", "wasabi_sniper"]),
      description: "Más nigiris sobre wasabi",
    },
    {
      id: "dumpling-hoarder",
      name: "Dumpling Hoarder",
      accent: "#FFE66D",
      icon: makisX3Img,
      winnerPlayerName: resolveWinnerName(highlights, ["dumplingHoarder", "dumpling_hoarder"]),
      description: "5 gyozas en una ronda",
    },
    {
      id: "collector",
      name: "Coleccionista",
      accent: "#FF6B6B",
      icon: sashimiImg, winnerPlayerName: resolveWinnerName(highlights, ["sashimiCollector", "sashimi_collector"]),
      description: "Completó 2+ sets sashimi",
    },
    {
      id: "sweep",
      name: "Sweep",
      accent: "#FFE66D",
      icon: "👑",
      winnerPlayerName: sweepWinner,
      description: "Ganó las 3 rondas",
    },
    {
      id: "comeback",
      name: "Comeback",
      accent: "#4ECDC4",
      icon: nigiriSalmonImg,
      winnerPlayerName: comeback,
      description: "Iba último en R2 y ganó",
    },
  ];

  return achievements.map((item) => ({
    ...item,
    winnerPlayerColor: item.winnerPlayerName ? colorFromSeed(item.winnerPlayerName) : undefined,
  }));
}

export default function ScoreboardPage() {
  const params = useParams<{ roomCode: string }>();
  const router = useRouter();
  const roomCode = (params.roomCode ?? "").toUpperCase();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [state, setState] = useState<LoadedState | null>(null);

  const isRoomCodeValid = roomCode.length > 0;

  useEffect(() => {
    if (!isRoomCodeValid) return;

    const load = async () => {
      const supabase = getSupabaseBrowserClient();
      const roomRes = await supabase.from("rooms").select("id, code").eq("code", roomCode).single();
      if (roomRes.error || !roomRes.data) {
        setError("No se encontro la sala para este scoreboard.");
        setLoading(false);
        return;
      }

      const room = roomRes.data as RoomRow;
      const roomPlayersRes = await supabase.from("room_players").select("user_id, display_name").eq("room_id", room.id);
      const roomPlayers = (roomPlayersRes.data ?? []) as RoomPlayerRow[];
      const nameByPlayerId = Object.fromEntries(roomPlayers.map((p) => [p.user_id, p.display_name]));

      const gameRes = await supabase
        .from("games")
        .select("id, room_id, status, ended_at, started_at")
        .eq("room_id", room.id)
        .order("started_at", { ascending: false })
        .limit(1)
        .single();

      if (gameRes.error || !gameRes.data) {
        const snapshotFallback = readFinalSnapshotFallback(roomCode);
        if (snapshotFallback) {
          setState(hydrateFromSnapshot(snapshotFallback, nameByPlayerId));
          setLoading(false);
          return;
        }

        setError("No hay partida finalizada para esta sala.");
        setLoading(false);
        return;
      }

      const game = gameRes.data as GameRow;
      const [playersRes, roundsRes, historyRes] = await Promise.all([
        supabase
          .from("game_players")
          .select("game_id, user_id, display_name, final_score, puddings, score_by_round")
          .eq("game_id", game.id),
        supabase.from("round_summaries").select("game_id, round, payload").eq("game_id", game.id),
        supabase.from("match_history").select("game_id, total_duration_ms, highlights").eq("game_id", game.id).maybeSingle(),
      ]);

      if (playersRes.error || roundsRes.error || historyRes.error) {
        setError(playersRes.error?.message ?? roundsRes.error?.message ?? historyRes.error?.message ?? "Error inesperado");
        setLoading(false);
        return;
      }

      const loadedPlayers = (playersRes.data ?? []) as GamePlayerRow[];
      const loadedHistory = (historyRes.data ?? null) as MatchHistoryRow | null;
      const computedStats = readHighlightMetrics(loadedHistory?.highlights ?? {}, loadedPlayers);
      const canonicalHighlights: Record<string, unknown> = {
        ...(loadedHistory?.highlights ?? {}),
        mostProfitableCard: computedStats.mostProfitableCard.cardId,
        mostProfitableCardPlayer: computedStats.mostProfitableCard.playerName,
        totalPointsByBestCard: computedStats.mostProfitableCard.totalPointsGenerated,
        cardMostPoints: computedStats.mostProfitableCard.cardId,
        cardMostPointsPlayer: computedStats.mostProfitableCard.playerName,
        cardMostPointsValue: computedStats.mostProfitableCard.totalPointsGenerated,
      };

      const shouldPersistHighlights =
        stringFromUnknown(loadedHistory?.highlights?.mostProfitableCard) !== computedStats.mostProfitableCard.cardId ||
        stringFromUnknown(loadedHistory?.highlights?.mostProfitableCardPlayer) !== computedStats.mostProfitableCard.playerName ||
        numberFromUnknown(loadedHistory?.highlights?.totalPointsByBestCard, -1) !== computedStats.mostProfitableCard.totalPointsGenerated;

      if (shouldPersistHighlights) {
        const persistedDuration = loadedHistory?.total_duration_ms ?? 0;
        await supabase.from("match_history").upsert(
          {
            game_id: game.id,
            total_duration_ms: persistedDuration,
            highlights: canonicalHighlights,
          },
          { onConflict: "game_id" }
        );
      }

      setState({
        game,
        players: loadedPlayers,
        roundSummaries: (roundsRes.data ?? []) as RoundSummaryRow[],
        history: {
          game_id: game.id,
          total_duration_ms: loadedHistory?.total_duration_ms ?? 0,
          highlights: canonicalHighlights,
        },
      });
      setLoading(false);
    };

    void load();
  }, [isRoomCodeValid, roomCode]);

  const data = useMemo(() => {
    if (!state) return null;

    const scoreboardPlayers = toPodiumPlayers(state.players);
    const highlights = state.history?.highlights ?? {};

    return {
      roomCode,
      statusText: state.game.status,
      players: scoreboardPlayers,
      achievements: buildAchievements(state.players, highlights),
      stats: readHighlightMetrics(highlights, state.players),
      totalDurationMs: state.history?.total_duration_ms ?? null,
    };
  }, [roomCode, state]);

  if (loading) {
    return <LoadingFinalScoreboard />;
  }

  if (!isRoomCodeValid || error || !data) {
    return (
      <main className="grid min-h-screen place-items-center bg-[#1a0a2e] px-4 text-white">
        <div className="rounded-2xl border border-white/15 bg-black/35 p-6 text-center backdrop-blur-md">
          <p>{error ?? "Codigo de sala invalido."}</p>
          <button
            type="button"
            onClick={() => router.push("/")}
            className="mt-4 rounded-xl bg-[#FF6B6B] px-4 py-2 font-heading font-bold text-white"
          >
            Volver al inicio
          </button>
        </div>
      </main>
    );
  }

  return (
    <FinalScoreboard
      roomCode={data.roomCode}
      statusText={data.statusText}
      players={data.players}
      achievements={data.achievements}
      stats={data.stats}
      totalDurationMs={data.totalDurationMs}
      onRematch={() => router.push(`/lobby/${roomCode}`)}
      onHome={() => router.push("/")}
    />
  );
}
