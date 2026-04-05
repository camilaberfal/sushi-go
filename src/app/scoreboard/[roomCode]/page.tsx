"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
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
import { AnimatePresence, motion } from "framer-motion";

import { Achievement } from "@/components/scoreboard/AchievementBadge";
import { FinalScoreboard } from "@/components/scoreboard/FinalScoreboard";
import { HighlightStats } from "@/components/scoreboard/ForensicReport";
import { PlayerStat } from "@/components/scoreboard/Podium";
import { SyncAfterTurnPayload } from "@/domain/protocol";
import { scorePuddings } from "@/domain/scoring";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";
import { getRoomStoreState } from "@/store/room-store";

type RoomRow = { id: string; code: string; host_id: string; status?: string };
type RoomPlayerRow = { user_id: string; display_name: string };
type GameRow = { id: string; room_id: string | null; status: string; ended_at: string | null; started_at: string };
type GamePlayerRow = {
  game_id: string;
  user_id: string;
  display_name: string;
  final_score: number;
  puddings: number;
  score_by_round: number[];
  turn_metrics?: unknown;
};

type CanonicalPlayer = GamePlayerRow & {
  normalizedPuddings: number;
  puddingPoints: number;
  totalScore: number;
};
type RoundSummaryRow = { game_id: string; round: number; payload: unknown };
type MatchHistoryRow = {
  game_id: string;
  total_duration_ms: number;
  card_play_count?: Record<string, unknown>;
  total_points_by_card?: Record<string, unknown>;
  highlights: Record<string, unknown>;
};

type TurnActionRow = {
  round: number;
  turn: number;
  user_id: string | null;
  selected_card_type: string;
  submitted_at: string;
  use_chopsticks: boolean;
};

type LoadedState = {
  roomId: string;
  roomHostId: string;
  game: GameRow;
  players: GamePlayerRow[];
  history: MatchHistoryRow | null;
  roundSummaries: RoundSummaryRow[];
  turnActions: TurnActionRow[];
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
    roomId: snapshot.roomId,
    roomHostId: "",
    game: syntheticGame,
    players: syntheticPlayers,
    roundSummaries: syntheticRounds,
    history: null,
    turnActions: [],
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

function normalizeKey(raw: string): string {
  return raw.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function visitRecords(value: unknown, visitor: (record: Record<string, unknown>) => void): void {
  if (!value || typeof value !== "object") return;

  if (Array.isArray(value)) {
    value.forEach((entry) => visitRecords(entry, visitor));
    return;
  }

  const record = value as Record<string, unknown>;
  visitor(record);
  Object.values(record).forEach((entry) => visitRecords(entry, visitor));
}

function pickDeepValueByKeys(source: unknown, keys: string[]): unknown {
  const wanted = new Set(keys.map(normalizeKey));
  let found: unknown = undefined;

  visitRecords(source, (record) => {
    if (found !== undefined) return;
    for (const [key, value] of Object.entries(record)) {
      if (wanted.has(normalizeKey(key))) {
        found = value;
        return;
      }
    }
  });

  return found;
}

function pickDeepNumber(source: unknown, keys: string[], fallback = 0): number {
  const value = pickDeepValueByKeys(source, keys);
  return numberFromUnknown(value, fallback);
}

function pickDeepString(source: unknown, keys: string[], fallback = ""): string {
  const value = pickDeepValueByKeys(source, keys);
  return stringFromUnknown(value, fallback);
}

function pickDeepRecord(source: unknown, keys: string[]): Record<string, unknown> | null {
  const value = pickDeepValueByKeys(source, keys);
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
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

function aggregateMetricFromUnknown(value: unknown, metricKeys: string[]): number {
  const wanted = metricKeys.map(normalizeKey);
  let total = 0;

  visitRecords(value, (record) => {
    for (const [key, raw] of Object.entries(record)) {
      const normalized = normalizeKey(key);
      if (!wanted.some((candidate) => normalized.includes(candidate))) continue;

      const n = numberFromUnknown(raw, Number.NaN);
      if (Number.isFinite(n)) {
        total += n;
      }
    }
  });

  return total;
}

function extractTimingEntriesFromTurnMetrics(players: GamePlayerRow[]): Array<{ playerName: string; timeMs: number; cardId: string }> {
  const timeKeys = ["timems", "time_ms", "playms", "play_ms", "durationms", "duration_ms", "elapsedms", "elapsed_ms", "responsems", "response_ms"];
  const cardKeys = ["cardid", "card_id", "selectedcard", "selected_card", "selectedcardtype", "selected_card_type", "card"];

  const entries: Array<{ playerName: string; timeMs: number; cardId: string }> = [];

  for (const player of players) {
    visitRecords(player.turn_metrics, (record) => {
      const timePair = Object.entries(record).find(([key, value]) => {
        const normalized = normalizeKey(key);
        if (!timeKeys.includes(normalized)) return false;
        const n = numberFromUnknown(value, Number.NaN);
        return Number.isFinite(n) && n > 0;
      });

      if (!timePair) return;

      const timeMs = numberFromUnknown(timePair[1], Number.NaN);
      if (!Number.isFinite(timeMs) || timeMs <= 0) return;

      const cardPair = Object.entries(record).find(([key]) => cardKeys.includes(normalizeKey(key)));
      const cardId = stringFromUnknown(cardPair?.[1], "unknown");

      entries.push({
        playerName: player.display_name,
        timeMs,
        cardId: cardKey(cardId),
      });
    });
  }

  return entries;
}

function resolveWinnerFromTurnMetrics(
  players: GamePlayerRow[],
  metricKeys: string[]
): string | null {
  const ranked = players
    .map((player) => ({
      player,
      score: aggregateMetricFromUnknown(player.turn_metrics, metricKeys),
    }))
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score);

  return ranked[0]?.player.display_name ?? null;
}

function toPlayerName(candidate: unknown, players: GamePlayerRow[]): string | null {
  if (typeof candidate !== "string") return null;
  const normalized = candidate.trim();
  if (!normalized) return null;

  const byId = players.find((player) => player.user_id === normalized);
  if (byId) return byId.display_name;

  const byName = players.find((player) => player.display_name === normalized);
  if (byName) return byName.display_name;

  return normalized;
}

function computePuddingPoints(players: GamePlayerRow[]): Record<string, number> {
  const result = Object.fromEntries(players.map((p) => [p.user_id, 0])) as Record<string, number>;
  if (players.length === 0) return result;

  const puddingCounts = players.map((player) => numberFromUnknown(player.puddings, 0));
  const puddingPoints = scorePuddings(puddingCounts);
  players.forEach((player, index) => {
    result[player.user_id] = puddingPoints[index] ?? 0;
  });

  return result;
}

function buildCanonicalPlayers(players: GamePlayerRow[]): CanonicalPlayer[] {
  const puddingPointsByPlayer = computePuddingPoints(players);

  return players.map((player) => {
    const normalizedPuddings = numberFromUnknown(player.puddings, 0);
    const puddingPoints = puddingPointsByPlayer[player.user_id] ?? 0;
    const scoreByRound = Array.isArray(player.score_by_round) ? player.score_by_round : [];
    const roundScore = scoreByRound.reduce((sum, value) => sum + numberFromUnknown(value, 0), 0);
    const finalScoreRaw = numberFromUnknown(player.final_score, 0);
    const hasRoundBreakdown = scoreByRound.length > 0;

    // Canonicalizamos el puntaje final para evitar desfaces cuando final_score
    // no refleja correctamente el ajuste final de pudines.
    const totalScore = hasRoundBreakdown ? roundScore + puddingPoints : finalScoreRaw;

    return {
      ...player,
      normalizedPuddings,
      puddingPoints,
      totalScore,
    };
  });
}

function toPodiumPlayers(players: CanonicalPlayer[]): PlayerStat[] {
  const ranked = [...players].sort((a, b) => {
    if (b.totalScore !== a.totalScore) return b.totalScore - a.totalScore;
    if (b.puddingPoints !== a.puddingPoints) return b.puddingPoints - a.puddingPoints;
    return b.normalizedPuddings - a.normalizedPuddings;
  });

  return ranked.map((player, index) => ({
    id: player.user_id,
    name: player.display_name,
    score: player.totalScore,
    puddings: player.normalizedPuddings,
    puddingScore: player.puddingPoints,
    rank: index + 1,
    colorHex: colorFromSeed(player.user_id),
  }));
}

function readHighlightMetrics(
  highlights: Record<string, unknown>,
  players: GamePlayerRow[],
  persistedCardPlayCount?: Record<string, unknown> | null,
  persistedPointsByCard?: Record<string, unknown> | null,
  turnActions: TurnActionRow[] = []
): HighlightStats {
  const defaultPlayer = "Sin datos";

  const cardPlayCountFromActions = turnActions.reduce((acc, action) => {
    const cardType = stringFromUnknown(action.selected_card_type, "");
    if (!cardType) return acc;
    acc[cardType] = numberFromUnknown(acc[cardType], 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const cardPlayCountMap =
    persistedCardPlayCount ??
    pickDeepRecord(highlights, ["cardPlayCount", "card_play_count", "cardCounts", "cardsPlayedByType"]) ??
    cardPlayCountFromActions;
  const pointsByCardMap =
    persistedPointsByCard ??
    pickDeepRecord(highlights, ["totalPointsByCard", "total_points_by_card", "pointsByCard", "cardPointsMap"]) ??
    {};

  const mostPlayedFromMap = Object.entries(cardPlayCountMap)
    .map(([card, value]) => ({ card, count: numberFromUnknown(value, 0) }))
    .sort((a, b) => b.count - a.count)[0];

  const bestCardFromMap = Object.entries(pointsByCardMap)
    .map(([card, value]) => ({ card, points: numberFromUnknown(value, 0) }))
    .sort((a, b) => b.points - a.points)[0];

  const fastestName =
    stringFromUnknown(highlights.fastestPlayer) ||
    stringFromUnknown(highlights.fastest_player) ||
    pickDeepString(highlights, ["fastestPlayer", "fastest_player", "fastestPlayerId", "fastest_player_id"]);
  const slowestName =
    stringFromUnknown(highlights.slowestPlayer) ||
    stringFromUnknown(highlights.slowest_player) ||
    pickDeepString(highlights, ["slowestPlayer", "slowest_player", "slowestPlayerId", "slowest_player_id"]);

  const fastestCard =
    stringFromUnknown(highlights.fastestCard) ||
    stringFromUnknown(highlights.fastest_card);
  const slowestCard =
    stringFromUnknown(highlights.slowestCard) ||
    stringFromUnknown(highlights.slowest_card);

  const mostPlayedCard =
    stringFromUnknown(highlights.mostPlayedCard) ||
    stringFromUnknown(highlights.most_played_card) ||
    stringFromUnknown(mostPlayedFromMap?.card);

  const mostPlayedCount =
    numberFromUnknown(highlights.mostPlayedCount, 0) ||
    numberFromUnknown(highlights.most_played_count, 0) ||
    numberFromUnknown(mostPlayedFromMap?.count, 0) ||
    0;

  // Do NOT fall back to a player's best round total for "most profitable card";
  // that can produce inflated / misleading values (e.g. whole-round totals).
  const bestPointsCard =
    stringFromUnknown(highlights.cardMostPoints) ||
    stringFromUnknown(highlights.mostProfitableCard) ||
    stringFromUnknown(bestCardFromMap?.card);
  const bestPointsPlayer =
    stringFromUnknown(highlights.cardMostPointsPlayer) ||
    stringFromUnknown(highlights.mostProfitableCardPlayer) ||
    stringFromUnknown(highlights.card_most_points_player);
  const bestPointsValue =
    numberFromUnknown(highlights.totalPointsByBestCard, 0) ||
    numberFromUnknown(highlights.cardMostPointsValue, 0) ||
    numberFromUnknown(highlights.total_points_by_best_card, 0) ||
    numberFromUnknown(bestCardFromMap?.points, 0) ||
    0;

  const fastestRawSeconds =
    numberFromUnknown(highlights.fastestTimeSeconds, 0) ||
    numberFromUnknown(highlights.fastest_time_seconds, 0) ||
    pickDeepNumber(highlights, ["fastestTimeSeconds", "fastest_time_seconds"], 0);
  const fastestRawMs = pickDeepNumber(highlights, ["fastestPlayMs", "fastest_play_ms", "fastestTimeMs", "fastest_time_ms"], 0);
  const slowestRawSeconds =
    numberFromUnknown(highlights.slowestTimeSeconds, 0) ||
    numberFromUnknown(highlights.slowest_time_seconds, 0) ||
    pickDeepNumber(highlights, ["slowestTimeSeconds", "slowest_time_seconds"], 0);
  const slowestRawMs = pickDeepNumber(highlights, ["slowestPlayMs", "slowest_play_ms", "slowestTimeMs", "slowest_time_ms"], 0);

  const timingFromTurnMetrics = extractTimingEntriesFromTurnMetrics(players);
  const fastestMetric = [...timingFromTurnMetrics].sort((a, b) => a.timeMs - b.timeMs)[0];
  const slowestMetric = [...timingFromTurnMetrics].sort((a, b) => b.timeMs - a.timeMs)[0];

  const fastestSeconds =
    fastestRawSeconds > 0
      ? fastestRawSeconds
      : fastestRawMs > 0
        ? fastestRawMs / 1000
        : fastestMetric
          ? fastestMetric.timeMs / 1000
          : 0;
  const slowestSeconds =
    slowestRawSeconds > 0
      ? slowestRawSeconds
      : slowestRawMs > 0
        ? slowestRawMs / 1000
        : slowestMetric
          ? slowestMetric.timeMs / 1000
          : 0;

  return {
    fastestPlay: {
      playerName: fastestName || fastestMetric?.playerName || defaultPlayer,
      fastestTime: fastestSeconds,
      cardId: fastestCard ? cardKey(fastestCard) : fastestMetric?.cardId || "unknown",
    },
    slowestPlay: {
      playerName: slowestName || slowestMetric?.playerName || defaultPlayer,
      slowestTime: slowestSeconds,
      cardId: slowestCard ? cardKey(slowestCard) : slowestMetric?.cardId || "unknown",
    },
    mostPlayedCard: {
      cardId: mostPlayedCard ? cardKey(mostPlayedCard) : "unknown",
      count: Math.max(0, Math.round(mostPlayedCount)),
    },
    mostProfitableCard: {
      cardId: bestPointsCard ? cardKey(bestPointsCard) : "unknown",
      totalPointsGenerated: Math.max(0, Math.round(bestPointsValue)),
      playerName: bestPointsPlayer || defaultPlayer,
    },
  };
}

function normalizeForensicStats(
  stats: HighlightStats,
  _players: CanonicalPlayer[],
  totalDurationMs: number | null
): HighlightStats {
  void totalDurationMs;
  return {
    fastestPlay: {
      playerName: stats.fastestPlay.playerName || "Sin datos",
      fastestTime: stats.fastestPlay.fastestTime > 0 ? stats.fastestPlay.fastestTime : 0,
      cardId: stats.fastestPlay.cardId || "unknown",
    },
    slowestPlay: {
      playerName: stats.slowestPlay.playerName || "Sin datos",
      slowestTime: stats.slowestPlay.slowestTime > 0 ? stats.slowestPlay.slowestTime : 0,
      cardId: stats.slowestPlay.cardId || "unknown",
    },
    mostPlayedCard: {
      cardId: stats.mostPlayedCard.cardId || "unknown",
      count: stats.mostPlayedCard.count > 0 ? stats.mostPlayedCard.count : 0,
    },
    mostProfitableCard: {
      cardId: stats.mostProfitableCard.cardId || "unknown",
      totalPointsGenerated: stats.mostProfitableCard.totalPointsGenerated > 0 ? stats.mostProfitableCard.totalPointsGenerated : 0,
      playerName: stats.mostProfitableCard.playerName || "Sin datos",
    },
  };
}

function resolveWinnerName(highlights: Record<string, unknown>, keys: string[], players: GamePlayerRow[]): string | null {
  const nestedCandidateKeys = ["playerName", "player", "winner", "userName", "displayName", "playerId", "userId", "id"];

  for (const key of keys) {
    const raw = highlights[key] ?? pickDeepValueByKeys(highlights, [key]);
    const asName = toPlayerName(raw, players);
    if (asName) return asName;

    if (raw && typeof raw === "object") {
      const record = raw as Record<string, unknown>;

      // Handle maps like { "player_id": 3, ... } by taking max numeric value.
      const numericWinner = Object.entries(record)
        .map(([candidate, value]) => ({ candidate, score: numberFromUnknown(value, Number.NaN) }))
        .filter((entry) => Number.isFinite(entry.score))
        .sort((a, b) => b.score - a.score)[0];
      if (numericWinner) {
        const mapped = toPlayerName(numericWinner.candidate, players);
        if (mapped) return mapped;
      }

      for (const nestedKey of nestedCandidateKeys) {
        const nested = toPlayerName(record[nestedKey], players);
        if (nested) return nested;
      }
    }
  }
  return null;
}

function resolveWinnerFromPerPlayerCounters(
  highlights: Record<string, unknown>,
  players: GamePlayerRow[],
  counterMapKeys: string[],
  metricKeys: string[]
): string | null {
  const normalizedMetricKeys = metricKeys.map(normalizeKey);

  for (const mapKey of counterMapKeys) {
    const record = pickDeepRecord(highlights, [mapKey]);
    if (!record) continue;

    const directNumeric = Object.entries(record)
      .map(([candidate, value]) => ({ candidate, score: numberFromUnknown(value, Number.NaN) }))
      .filter((entry) => Number.isFinite(entry.score))
      .sort((a, b) => b.score - a.score)[0];

    if (directNumeric && directNumeric.score > 0) {
      const mapped = toPlayerName(directNumeric.candidate, players);
      if (mapped) return mapped;
    }

    const metricBucket = Object.entries(record).find(([key]) => normalizedMetricKeys.includes(normalizeKey(key)));
    if (metricBucket && metricBucket[1] && typeof metricBucket[1] === "object" && !Array.isArray(metricBucket[1])) {
      const metricRecord = metricBucket[1] as Record<string, unknown>;
      const winnerFromMetric = Object.entries(metricRecord)
        .map(([candidate, value]) => ({ candidate, score: numberFromUnknown(value, Number.NaN) }))
        .filter((entry) => Number.isFinite(entry.score))
        .sort((a, b) => b.score - a.score)[0];

      if (winnerFromMetric && winnerFromMetric.score > 0) {
        const mapped = toPlayerName(winnerFromMetric.candidate, players);
        if (mapped) return mapped;
      }
    }

    const nestedPerPlayer = Object.entries(record)
      .map(([candidate, value]) => {
        if (!value || typeof value !== "object" || Array.isArray(value)) return { candidate, score: Number.NaN };
        const nested = value as Record<string, unknown>;
        const score = Object.entries(nested)
          .filter(([nestedKey]) => normalizedMetricKeys.includes(normalizeKey(nestedKey)))
          .map(([, nestedValue]) => numberFromUnknown(nestedValue, Number.NaN))
          .filter((nestedScore) => Number.isFinite(nestedScore))[0];

        return { candidate, score: score ?? Number.NaN };
      })
      .filter((entry) => Number.isFinite(entry.score))
      .sort((a, b) => b.score - a.score)[0];

    if (nestedPerPlayer && nestedPerPlayer.score > 0) {
      const mapped = toPlayerName(nestedPerPlayer.candidate, players);
      if (mapped) return mapped;
    }
  }

  return null;
}

function buildAchievements(players: CanonicalPlayer[], highlights: Record<string, unknown>, stats: HighlightStats): Achievement[] {
  const winnerByPudding = [...players].sort((a, b) => b.normalizedPuddings - a.normalizedPuddings)[0]?.display_name ?? null;
  const champion = [...players].sort((a, b) => b.totalScore - a.totalScore)[0]?.display_name ?? null;

  const totalRounds = Math.max(...players.map((player) => player.score_by_round?.length ?? 0), 0);
  const roundWinners: string[] = Array.from({ length: totalRounds }, (_, roundIndex) => {
    const sorted = [...players].sort((a, b) => (b.score_by_round?.[roundIndex] ?? 0) - (a.score_by_round?.[roundIndex] ?? 0));
    return sorted[0]?.display_name ?? "";
  });

  const sweepWinner =
    totalRounds > 0 && roundWinners[0] && roundWinners.every((name) => name === roundWinners[0])
      ? roundWinners[0]
      : null;

  const round2Ordered = totalRounds >= 2
    ? [...players].sort((a, b) => (a.score_by_round?.[1] ?? 0) - (b.score_by_round?.[1] ?? 0))
    : [];
  const lastOnRound2 = round2Ordered[0]?.display_name ?? null;
  const comeback = totalRounds >= 2 && lastOnRound2 && champion && lastOnRound2 === champion ? champion : null;

  const chopsticksWinner =
    resolveWinnerName(
      highlights,
      [
        "chopsticksMaster",
        "chopsticks_master",
        "chopsticksMasterId",
        "chopsticks_master_id",
        "mostChopsticksPlayer",
        "most_chopsticks_player",
        "mostChopsticksUsedPlayer",
        "most_chopsticks_used_player",
        "mostChopsticksUsed",
        "most_chopsticks_used",
      ],
      players
    ) ??
    resolveWinnerFromPerPlayerCounters(
      highlights,
      players,
      [
        "chopsticksUsageByPlayer",
        "chopsticks_usage_by_player",
        "cardPlayCountByPlayer",
        "card_play_count_by_player",
        "cardsPlayedByPlayer",
        "cards_played_by_player",
      ],
      ["chopsticks", "palillos", "chopsticksUsed", "chopsticks_used"]
    );

  const wasabiWinner =
    resolveWinnerName(
      highlights,
      [
        "wasabiSniper",
        "wasabi_sniper",
        "wasabiSniperId",
        "wasabi_sniper_id",
        "mostWasabiPlayer",
        "most_wasabi_player",
        "mostWasabiUsedPlayer",
        "most_wasabi_used_player",
        "mostWasabiUsed",
        "most_wasabi_used",
        "wasabiMaster",
        "wasabi_master",
      ],
      players
    ) ??
    resolveWinnerFromPerPlayerCounters(
      highlights,
      players,
      [
        "wasabiUsageByPlayer",
        "wasabi_usage_by_player",
        "cardPlayCountByPlayer",
        "card_play_count_by_player",
        "cardsPlayedByPlayer",
        "cards_played_by_player",
      ],
      ["wasabi", "wasabiUsed", "wasabi_used", "wasabiCount", "wasabi_count"]
    ) ??
    resolveWinnerFromTurnMetrics(players, ["wasabi", "wasabiused", "wasabicount", "nigirionwasabi", "wasabisniper"]);

  const resolvedChopsticksWinner =
    chopsticksWinner ?? resolveWinnerFromTurnMetrics(players, ["chopsticks", "palillos", "chopsticksused", "chopstickscount"]);

  const achievements: Achievement[] = [
    {
      id: "maki-king",
      name: "Rey del Maki",
      accent: "#FFE66D",
      icon: makisX3Img,
      winnerPlayerName:
        resolveWinnerName(highlights, ["makiKing", "maki_king", "mostMakiPlayer", "makiKingPlayer", "maki_king_player", "mostMakiPlayerId"], players) ??
        champion,
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
      winnerPlayerName:
        resolveWinnerName(highlights, ["fastestPlayer", "fastest_player", "fastestPlayerId", "fastest_player_id"], players),
      description: "Promedio de jugada más bajo",
    },
    {
      id: "sin-prisa",
      name: "Sin Prisa",
      accent: "#93C5FD",
      icon: tempuraImg,
      winnerPlayerName:
        resolveWinnerName(highlights, ["slowestPlayer", "slowest_player", "slowestPlayerId", "slowest_player_id"], players),
      description: "Promedio de jugada más alto",
    },
    {
      id: "palillo-pro",
      name: "Palillo Pro",
      accent: "#4ECDC4",
      icon: palillosImg,
      winnerPlayerName: resolvedChopsticksWinner,
      description: "Más usos de palillos",
    },
    {
      id: "wasabi-sniper",
      name: "Wasabi Sniper",
      accent: "#6EE7B7",
      icon: wasabiImg,
      winnerPlayerName: wasabiWinner,
      description: "Más nigiris sobre wasabi",
    },
    {
      id: "dumpling-hoarder",
      name: "Dumpling Hoarder",
      accent: "#FFE66D",
      icon: makisX3Img,
      winnerPlayerName: resolveWinnerName(highlights, ["dumplingHoarder", "dumpling_hoarder", "dumplingHoarderId", "dumpling_hoarder_id"], players),
      description: "5 gyozas en una ronda",
    },
    {
      id: "collector",
      name: "Coleccionista",
      accent: "#FF6B6B",
      icon: sashimiImg, winnerPlayerName: resolveWinnerName(highlights, ["sashimiCollector", "sashimi_collector", "sashimiCollectorId", "sashimi_collector_id"], players),
      description: "Completó 2+ sets sashimi",
    },
    {
      id: "sweep",
      name: "Sweep",
      accent: "#FFE66D",
      icon: "👑",
      winnerPlayerName: sweepWinner,
      description: `Ganó las ${Math.max(1, totalRounds)} rondas`,
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
  const [showWinnerIntro, setShowWinnerIntro] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [startingRematch, setStartingRematch] = useState(false);

  const isRoomCodeValid = roomCode.length > 0;

  useEffect(() => {
    if (!isRoomCodeValid) return;

    const load = async () => {
      const supabase = getSupabaseBrowserClient();
      const auth = await supabase.auth.getUser();
      setCurrentUserId(auth.data.user?.id ?? null);

      const roomRes = await supabase.from("rooms").select("id, code, host_id, status").eq("code", roomCode).single();
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
        .in("status", ["WAITING_SCOREBOARD", "FINISHED", "FINAL_PODIUM"])
        .order("started_at", { ascending: false })
        .limit(1)
        .single();

      if (gameRes.error || !gameRes.data) {
        const snapshotFallback = readFinalSnapshotFallback(roomCode);
        if (snapshotFallback) {
          setState({
            ...hydrateFromSnapshot(snapshotFallback, nameByPlayerId),
            roomHostId: room.host_id,
          });
          setLoading(false);
          return;
        }

        setError("No hay partida finalizada para esta sala.");
        setLoading(false);
        return;
      }

      const game = gameRes.data as GameRow;
      const [playersRes, roundsRes, historyRes, turnActionsRes] = await Promise.all([
        supabase
          .from("game_players")
          .select("game_id, user_id, display_name, final_score, puddings, score_by_round, turn_metrics")
          .eq("game_id", game.id),
        supabase.from("round_summaries").select("game_id, round, payload").eq("game_id", game.id),
        supabase.from("match_history").select("game_id, total_duration_ms, card_play_count, total_points_by_card, highlights").eq("game_id", game.id).maybeSingle(),
        supabase
          .from("turn_actions")
          .select("round, turn, user_id, selected_card_type, submitted_at, use_chopsticks")
          .eq("game_id", game.id),
      ]);

      if (playersRes.error || roundsRes.error || historyRes.error || turnActionsRes.error) {
        setError(
          playersRes.error?.message ??
            roundsRes.error?.message ??
            historyRes.error?.message ??
            turnActionsRes.error?.message ??
            "Error inesperado"
        );
        setLoading(false);
        return;
      }

      const loadedTurnActions = (turnActionsRes.data ?? []) as TurnActionRow[];

      const loadedPlayers = (playersRes.data ?? []) as GamePlayerRow[];
      const loadedHistory = (historyRes.data ?? null) as MatchHistoryRow | null;
      const canonicalPlayers = buildCanonicalPlayers(loadedPlayers);
      const canonicalHighlights: Record<string, unknown> = {
        ...(loadedHistory?.highlights ?? {}),
      };

      setState({
        roomId: room.id,
        roomHostId: room.host_id,
        game,
        players: loadedPlayers,
        roundSummaries: (roundsRes.data ?? []) as RoundSummaryRow[],
        turnActions: loadedTurnActions,
        history: {
          game_id: game.id,
          total_duration_ms: loadedHistory?.total_duration_ms ?? 0,
          card_play_count: (loadedHistory?.card_play_count as Record<string, unknown> | undefined) ?? undefined,
          total_points_by_card: (loadedHistory?.total_points_by_card as Record<string, unknown> | undefined) ?? undefined,
          highlights: canonicalHighlights,
        },
      });
      setShowWinnerIntro(true);
      setLoading(false);
    };

    void load();
  }, [isRoomCodeValid, roomCode]);

  useEffect(() => {
    if (!state?.roomId) return;

    const supabase = getSupabaseBrowserClient();
    const channel = supabase
      .channel(`scoreboard-room-watch:${state.roomId}`)
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "rooms", filter: `id=eq.${state.roomId}` }, (payload) => {
        const nextStatus = (payload.new as { status?: string } | null)?.status;
        if (nextStatus === "ROUND_1" || nextStatus === "ROUND_2" || nextStatus === "ROUND_3") {
          router.push(`/game/${roomCode}`);
        }
      });

    channel.subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [roomCode, router, state?.roomId]);

  const handleRematch = useCallback(async () => {
    if (!state?.roomId) return;

    const isHost = Boolean(currentUserId && state.roomHostId && currentUserId === state.roomHostId);
    if (!isHost) {
      // Los no-host quedan esperando; al iniciar el host, los redirige el watcher de estado.
      return;
    }

    setStartingRematch(true);
    const supabase = getSupabaseBrowserClient();
    const updateRes = await supabase.from("rooms").update({ status: "ROUND_1" }).eq("id", state.roomId);
    setStartingRematch(false);

    if (!updateRes.error) {
      router.push(`/game/${roomCode}`);
    }
  }, [currentUserId, roomCode, router, state?.roomHostId, state?.roomId]);

  const data = useMemo(() => {
    if (!state) return null;

    const canonicalPlayers = buildCanonicalPlayers(state.players);
    const scoreboardPlayers = toPodiumPlayers(canonicalPlayers);
    const highlights = state.history?.highlights ?? {};
    const normalizedStats = normalizeForensicStats(
      readHighlightMetrics(
        highlights,
        canonicalPlayers,
        (state.history?.card_play_count as Record<string, unknown> | undefined) ?? null,
        (state.history?.total_points_by_card as Record<string, unknown> | undefined) ?? null,
        state.turnActions
      ),
      canonicalPlayers,
      state.history?.total_duration_ms ?? null
    );

    return {
      roomCode,
      statusText: state.game.status,
      players: scoreboardPlayers,
      achievements: buildAchievements(canonicalPlayers, highlights, normalizedStats),
      stats: normalizedStats,
      totalDurationMs: state.history?.total_duration_ms ?? null,
    };
  }, [roomCode, state]);

  useEffect(() => {
    if (!showWinnerIntro) return;
    if (!data?.players?.[0]) {
      setShowWinnerIntro(false);
      return;
    }

    const timer = window.setTimeout(() => {
      setShowWinnerIntro(false);
    }, 2400);

    return () => {
      window.clearTimeout(timer);
    };
  }, [data, showWinnerIntro]);

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
    <>
      <FinalScoreboard
        roomCode={data.roomCode}
        statusText={data.statusText}
        players={data.players}
        achievements={data.achievements}
        stats={data.stats}
        totalDurationMs={data.totalDurationMs}
        onRematch={startingRematch ? undefined : handleRematch}
        onHome={() => router.push("/")}
      />

      <AnimatePresence>
        {showWinnerIntro && data.players[0] && (
          <motion.div
            key={`winner-intro-${data.players[0].id}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35 }}
            className="pointer-events-none fixed inset-0 z-[70] flex items-center justify-center"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.7 }}
              animate={{ opacity: [0, 0.7, 0.35], scale: [0.7, 1.12, 1.35] }}
              transition={{ duration: 1.75, ease: "easeOut" }}
              className="absolute h-[76vh] w-[76vh] rounded-full bg-amber-300/30 blur-3xl"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.82, y: 28 }}
              animate={{ opacity: [0, 1, 1], scale: [0.82, 1.06, 1], y: [28, 0, 0] }}
              transition={{ duration: 0.85, ease: "easeOut" }}
              className="relative overflow-hidden rounded-3xl border border-white/35 bg-black/60 px-12 py-8 text-center shadow-[0_28px_70px_rgba(0,0,0,0.72)] backdrop-blur-md"
            >
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_18%,rgba(255,255,255,0.22),rgba(255,255,255,0)_56%)]" />
              <Image src="/sushigo-logo.png" alt="Sushi Go" width={160} height={78} className="relative mx-auto h-auto w-[140px] drop-shadow-[0_8px_16px_rgba(0,0,0,0.75)]" priority />
              <p className="relative mt-2 font-heading text-3xl uppercase tracking-[0.22em] text-[#f8deb1]">Ganador Final</p>
              <p className="relative mt-3 font-heading text-6xl font-black leading-none text-[#FFE66D] drop-shadow-[0_8px_24px_rgba(251,191,36,0.9)]">
                {data.players[0].name}
              </p>
              <p className="relative mt-2 text-sm font-semibold uppercase tracking-[0.12em] text-white/80">
                {data.players[0].score} pts totales
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
