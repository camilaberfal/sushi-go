"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";

import { HandGrouped } from "@/components/game/hand-grouped";
import { PlayerHud } from "@/components/game/player-hud";
import { RevealLayer } from "@/components/game/reveal-layer";
import { TableView } from "@/components/game/table-view";
import { Badge, Button, Card, Separator, Skeleton } from "@/components/ui";
import { SyncAfterTurnPayload, SyncPlayerState } from "@/domain/protocol";
import { buildFullDeck, dealHands, shuffleDeck } from "@/domain/deck";
import { useGameActions } from "@/hooks/use-game-actions";
import { useRoomChannel } from "@/hooks/use-room-channel";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";
import { playSfx } from "@/lib/audio";
import {
  selectCurrentPlayer,
  selectGroupedHand,
  selectProjectedRoundScore,
  selectPuddings,
} from "@/store/selectors";
import { useRoomStore } from "@/store/room-store";

type RoomRow = {
  id: string;
  code: string;
};

type RoomPlayerRow = {
  user_id: string;
  display_name: string;
  seat_index: number;
  presence: "online" | "offline" | "bot";
};

function createSeededRng(seed: string): () => number {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i += 1) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }

  return () => {
    h += h << 13;
    h ^= h >>> 7;
    h += h << 3;
    h ^= h >>> 17;
    h += h << 5;
    return ((h >>> 0) % 1_000_000) / 1_000_000;
  };
}

function buildBootSnapshot(roomId: string, players: RoomPlayerRow[]): SyncAfterTurnPayload {
  const sorted = [...players].sort((a, b) => a.seat_index - b.seat_index);
  const deck = shuffleDeck(buildFullDeck(), createSeededRng(roomId));
  const { hands } = dealHands(deck, sorted.length as 2 | 3 | 4 | 5);

  const playerMap: Record<string, SyncPlayerState> = {};
  sorted.forEach((player, index) => {
    playerMap[player.user_id] = {
      id: player.user_id,
      hand: (hands[index] ?? []).map((card) => card.id),
      playedCards: [],
      puddings: 0,
      scoreByRound: [0, 0, 0],
      presence: player.presence,
    };
  });

  return {
    roomId,
    status: "ROUND_1",
    round: 1,
    turn: 1,
    players: playerMap,
  };
}

function LoadingState() {
  return (
    <main className="game-kawaii-bg min-h-screen px-4 py-8">
      <div className="mx-auto grid w-full max-w-6xl gap-4">
        <Skeleton className="h-36 rounded-2xl" />
        <Skeleton className="h-72 rounded-2xl" />
        <Skeleton className="h-56 rounded-2xl" />
      </div>
    </main>
  );
}

type GameStageProps = {
  roomId: string;
  roomCode: string;
  playerId: string;
  players: RoomPlayerRow[];
};

function GameStage({ roomId, roomCode, playerId, players }: GameStageProps) {
  useRoomChannel({ roomId, playerId });

  const snapshot = useRoomStore((state) => state.snapshot);
  const waitingForPlayers = useRoomStore((state) => state.waitingForPlayers);
  const lastReveal = useRoomStore((state) => state.lastReveal);
  const lastError = useRoomStore((state) => state.lastError);
  const setLastReveal = useRoomStore((state) => state.setLastReveal);
  const me = useRoomStore(selectCurrentPlayer(playerId));
  const grouped = useRoomStore(selectGroupedHand(playerId));
  const projectedScore = useRoomStore(selectProjectedRoundScore(playerId));
  const puddings = useRoomStore(selectPuddings(playerId));

  const { clearError, selectCard } = useGameActions({ roomId, playerId });

  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [revealOpen, setRevealOpen] = useState(false);

  useEffect(() => {
    if (lastReveal.length === 0) return;
    playSfx("reveal");
    setRevealOpen(true);
  }, [lastReveal]);

  const lockInSelection = useCallback(async () => {
    if (!selectedCardId) return;
    const ok = await selectCard(selectedCardId, false);
    if (ok) {
      playSfx("select");
    }
  }, [selectCard, selectedCardId]);

  const tablePlayers = useMemo(() => {
    if (!snapshot) return [];
    return Object.values(snapshot.players).map((player) => ({
      id: player.id,
      playedCards: player.playedCards,
      handCount: player.hand.length,
    }));
  }, [snapshot]);

  const otherPlayers = useMemo(() => {
    if (!snapshot) return [];
    return Object.values(snapshot.players)
      .filter((player) => player.id !== playerId)
      .map((player) => ({
        id: player.id,
        handCount: player.hand.length,
        puddings: player.puddings,
        score: player.scoreByRound.reduce((sum, value) => sum + value, 0),
      }));
  }, [playerId, snapshot]);

  const canLock = !!selectedCardId && !waitingForPlayers;

  return (
    <main className="game-kawaii-bg min-h-screen px-4 py-8">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-4">
        <Card className="border-2 border-border/75 bg-card/85 p-4 backdrop-blur">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Badge variant="secondary">Sala {roomCode}</Badge>
              <Badge variant="outline" className="gap-1">
                <span className="text-xs font-semibold">PJ</span>
                {players.length} jugadores
              </Badge>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span className="text-xs font-semibold">T</span>
              Turno simultaneo en progreso
            </div>
          </div>

          <Separator className="my-3" />

          <PlayerHud
            round={snapshot?.round ?? 1}
            turn={snapshot?.turn ?? 1}
            myHandCount={me?.hand.length ?? 0}
            myPuddings={puddings}
            myScore={projectedScore}
            others={otherPlayers}
          />
        </Card>

        <TableView players={tablePlayers} />

        <section
          className="relative"
          key={`${snapshot?.round ?? 1}-${snapshot?.turn ?? 1}`}
        >
          <Card className="border-2 border-primary/35 bg-card/90 p-5">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="font-heading text-3xl text-primary">Tu mano</h2>
              <Button disabled={!canLock} onClick={lockInSelection}>
                Confirmar carta
              </Button>
            </div>

            {lastError ? (
              <div className="mb-4 rounded-xl border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
                <p>{lastError}</p>
                <Button className="mt-2" onClick={clearError} size="sm" variant="outline">
                  Limpiar aviso
                </Button>
              </div>
            ) : null}

            <HandGrouped
              disabled={waitingForPlayers}
              onSelectCard={(cardId) => {
                setSelectedCardId(cardId);
                playSfx("hover");
              }}
              regularGroups={grouped.regularGroups}
              selectedCardId={selectedCardId}
              specials={grouped.specials}
            />
          </Card>

          {waitingForPlayers ? (
            <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-black/45 backdrop-blur-[2px]">
              <div className="waiting-glow rounded-xl border border-accent/70 bg-accent/20 px-4 py-2 text-sm font-semibold text-accent-foreground">
                Esperando a otros jugadores...
              </div>
            </div>
          ) : null}
        </section>
      </div>

      <RevealLayer
        onDone={() => {
          setRevealOpen(false);
          setLastReveal([]);
          playSfx("whoosh");
        }}
        open={revealOpen}
        reveals={lastReveal}
      />
    </main>
  );
}

export default function GameRoomPage() {
  const params = useParams<{ roomCode: string }>();
  const roomCode = (params.roomCode ?? "").toUpperCase();

  const setMeta = useRoomStore((state) => state.setMeta);
  const setSnapshot = useRoomStore((state) => state.setSnapshot);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [roomId, setRoomId] = useState<string | null>(null);
  const [playerId, setPlayerId] = useState<string | null>(null);
  const [players, setPlayers] = useState<RoomPlayerRow[]>([]);

  useEffect(() => {
    const load = async () => {
      if (!roomCode) {
        setError("Codigo de sala invalido.");
        setLoading(false);
        return;
      }

      const supabase = getSupabaseBrowserClient();
      const auth = await supabase.auth.getUser();
      const currentUserId = auth.data.user?.id ?? null;

      const roomRes = await supabase.from("rooms").select("id, code").eq("code", roomCode).single();
      if (roomRes.error || !roomRes.data) {
        setError("No se encontro la sala solicitada.");
        setLoading(false);
        return;
      }

      const room = roomRes.data as RoomRow;
      const playersRes = await supabase
        .from("room_players")
        .select("user_id, display_name, seat_index, presence")
        .eq("room_id", room.id)
        .order("seat_index", { ascending: true });

      if (playersRes.error) {
        setError(playersRes.error.message);
        setLoading(false);
        return;
      }

      const roomPlayers = (playersRes.data ?? []) as RoomPlayerRow[];
      if (roomPlayers.length < 2 || roomPlayers.length > 5) {
        setError("Cantidad de jugadores invalida para iniciar una ronda.");
        setLoading(false);
        return;
      }

      const resolvedPlayerId =
        roomPlayers.find((player) => player.user_id === currentUserId)?.user_id ?? roomPlayers[0]?.user_id ?? null;

      if (!resolvedPlayerId) {
        setError("No se pudo resolver el jugador activo.");
        setLoading(false);
        return;
      }

      setRoomId(room.id);
      setPlayers(roomPlayers);
      setPlayerId(resolvedPlayerId);
      setMeta({ roomId: room.id, playerId: resolvedPlayerId });
      setSnapshot(buildBootSnapshot(room.id, roomPlayers));
      setLoading(false);
    };

    void load();
  }, [roomCode, setMeta, setSnapshot]);

  if (loading) return <LoadingState />;

  if (error || !roomId || !playerId) {
    return (
      <main className="game-kawaii-bg flex min-h-screen items-center justify-center px-4">
        <Card className="w-full max-w-xl border-destructive/40 p-5">
          <h1 className="font-heading text-3xl">Mesa no disponible</h1>
          <p className="mt-2 text-sm text-destructive">{error ?? "No se pudo iniciar el estado de juego."}</p>
        </Card>
      </main>
    );
  }

  return <GameStage playerId={playerId} players={players} roomCode={roomCode} roomId={roomId} />;
}
