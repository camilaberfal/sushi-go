"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";

import { Hand3D } from "@/components/game/3d-hand";
import { GlassScoreboard } from "@/components/game/glass-scoreboard";
import { ComboOverlay } from "@/components/game/combo-overlay";
import { RevealLayer3D } from "@/components/game/3d-reveal";
import { TableView3D } from "@/components/game/3d-table";
import { OpponentsHud } from "@/components/game/opponents-hud";
import { Button, Card, Skeleton } from "@/components/ui";
import { SyncAfterTurnPayload, SyncPlayerState } from "@/domain/protocol";
import { buildFullDeck, dealHands, shuffleDeck } from "@/domain/deck";
import { scoreRoundForPlayers } from "@/domain/scoring";
import { useGameActions } from "@/hooks/use-game-actions";
import { useRoomChannel } from "@/hooks/use-room-channel";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";
import { useSoundEffects } from "@/hooks/use-sound-effects";
import { cycleSoundtrackLevel, getSoundtrackLevel, initSoundtrack, setSoundtrackLevel as setGlobalSoundtrackLevel, SoundtrackLevel } from "@/lib/soundtrack";
import { motion, AnimatePresence } from "framer-motion";
import { LogOut, Volume1, Volume2, VolumeX } from "lucide-react";
import Image from "next/image";

import pudinImg from "@/app/assets/illustrations/pudin-illustration.png";
import makiImg from "@/app/assets/illustrations/maki-illustration-x2.png";
import gyozaImg from "@/app/assets/illustrations/gyoza-illustration.png";
import sashimiImg from "@/app/assets/illustrations/sashimi-illustration.png";

function BackgroundArt() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden mix-blend-overlay opacity-10">
      <motion.div animate={{ y: [0, -30, 0], rotateZ: [0, 8, 0] }} transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }} className="absolute top-[5%] left-[5%]">
        <Image src={pudinImg} alt="" width={600} height={600} className="grayscale brightness-150 drop-shadow-2xl" />
      </motion.div>
      <motion.div animate={{ y: [0, 40, 0], rotateZ: [0, -12, 0] }} transition={{ duration: 24, repeat: Infinity, ease: "easeInOut" }} className="absolute top-[40%] right-[3%]">
        <Image src={sashimiImg} alt="" width={700} height={700} className="grayscale brightness-150 drop-shadow-2xl" />
      </motion.div>
      <motion.div animate={{ y: [0, -50, 0], rotateZ: [0, 15, 0] }} transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }} className="absolute bottom-[2%] left-[30%] rotate-180">
        <Image src={makiImg} alt="" width={450} height={450} className="grayscale brightness-150 drop-shadow-2xl" />
      </motion.div>
      <motion.div animate={{ y: [0, 25, 0], rotateZ: [0, -8, 0] }} transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }} className="absolute top-[15%] left-[45%]">
        <Image src={gyozaImg} alt="" width={350} height={350} className="grayscale brightness-150 drop-shadow-2xl" />
      </motion.div>
    </div>
  );
}
import {
  selectCurrentPlayer,
  selectGroupedHand,
  selectProjectedRoundScore,
  selectPuddings,
} from "@/store/selectors";
import { useRoomStore } from "@/store/room-store";
import { cn } from "@/lib/utils";

function cardTypeFromId(cardId: string): string {
  const separator = cardId.lastIndexOf("-");
  return separator > 0 ? cardId.slice(0, separator) : cardId;
}

function isNigiriCard(cardId: string | null): boolean {
  if (!cardId) return false;
  const type = cardTypeFromId(cardId);
  return type === "nigiri_egg" || type === "nigiri_salmon" || type === "nigiri_squid";
}

function countOpenWasabiSlots(playedCards: string[]): number {
  let openWasabi = 0;
  for (const cardId of playedCards) {
    const type = cardTypeFromId(cardId);
    if (type === "wasabi") {
      openWasabi += 1;
      continue;
    }
    if (openWasabi > 0 && (type === "nigiri_egg" || type === "nigiri_salmon" || type === "nigiri_squid")) {
      openWasabi -= 1;
    }
  }
  return openWasabi;
}

function findFirstOpenWasabiIndex(playedCards: string[]): number {
  const openWasabiIndexes: number[] = [];

  playedCards.forEach((cardId, index) => {
    const cardType = cardTypeFromId(cardId);
    if (cardType === "wasabi") {
      openWasabiIndexes.push(index);
    } else if (isNigiriCard(cardId) && openWasabiIndexes.length > 0) {
      openWasabiIndexes.shift();
    }
  });

  return openWasabiIndexes.length > 0 ? openWasabiIndexes[0] : -1;
}

function insertNigiriAfterFirstOpenWasabi(playedCards: string[], nigiriCardId: string): string[] {
  const next = [...playedCards];
  const firstOpenWasabiIndex = findFirstOpenWasabiIndex(next);

  if (firstOpenWasabiIndex >= 0) {
    next.splice(firstOpenWasabiIndex + 1, 0, nigiriCardId);
    return next;
  }

  next.push(nigiriCardId);
  return next;
}

function insertNigiriBeforeFirstOpenWasabi(playedCards: string[], nigiriCardId: string): string[] {
  const next = [...playedCards];
  const firstOpenWasabiIndex = findFirstOpenWasabiIndex(next);

  if (firstOpenWasabiIndex >= 0) {
    next.splice(firstOpenWasabiIndex, 0, nigiriCardId);
    return next;
  }

  next.push(nigiriCardId);
  return next;
}

type RoomRow = {
  id: string;
  code: string;
  host_id: string;
  settings: { total_rounds?: number } | null;
};

type RoomPlayerRow = {
  user_id: string;
  display_name: string;
  is_host: boolean;
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

function roundsByPlayers(playerCount: number): number {
  if (playerCount === 2) return 5;
  if (playerCount === 3) return 4;
  return 3;
}

function roundOptionsByPlayers(playerCount: number): number[] {
  if (playerCount === 2) return [3, 4, 5];
  if (playerCount === 3) return [3, 4];
  return [3];
}

function buildBootSnapshot(roomId: string, players: RoomPlayerRow[], totalRounds: number): SyncAfterTurnPayload {
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
      scoreByRound: Array.from({ length: totalRounds }, () => 0),
      presence: player.presence,
    };
  });

  return {
    roomId,
    status: "ROUND_1",
    round: 1,
    totalRounds,
    turn: 1,
    players: playerMap,
    analytics: {
      fastestPlayMs: 0,
      fastestPlayer: "",
      fastestCard: "nigiri_salmon",
      slowestPlayMs: 0,
      slowestPlayer: "",
      slowestCard: "tempura",
      cardPlayCount: {},
      totalPointsByCard: {},
      turnStartedAtMs: Date.now(),
    },
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
  hostPlayerId: string;
  players: RoomPlayerRow[];
};

type RoundIntroState = {
  id: number;
  round: number;
};

type PuddingAwardIntroState = {
  id: number;
  winnersText: string;
  pointsText: string;
  detailText: string;
  rows: Array<{
    id: string;
    name: string;
    puddings: number;
    delta: number;
  }>;
};

type OptimisticWasabiNigiriState = {
  id: string;
  round: number;
  turn: number;
};

function computePuddingAwardIntro(
  snapshot: SyncAfterTurnPayload,
  playerNames: Record<string, string>
): PuddingAwardIntroState {
  const players = Object.values(snapshot.players);
  const puddingByPlayer = players.map((player) => ({
    id: player.id,
    name: playerNames[player.id] ?? "Jugador",
    // Use canonical pudding counter from snapshot to avoid visual desync in final animation.
    puddings: player.puddings,
  }));

  const maxPuddings = Math.max(...puddingByPlayer.map((entry) => entry.puddings));
  const minPuddings = Math.min(...puddingByPlayer.map((entry) => entry.puddings));
  const winners = puddingByPlayer.filter((entry) => entry.puddings === maxPuddings);
  const losers = puddingByPlayer.filter((entry) => entry.puddings === minPuddings);
  const plusPoints = Math.floor(6 / Math.max(1, winners.length));
  const minusPoints = Math.floor(6 / Math.max(1, losers.length));

  const deltas = Object.fromEntries(puddingByPlayer.map((entry) => [entry.id, 0])) as Record<string, number>;

  winners.forEach((entry) => {
    deltas[entry.id] = plusPoints;
  });

  if (players.length > 2 && maxPuddings !== minPuddings) {
    losers.forEach((entry) => {
      deltas[entry.id] = -minusPoints;
    });
  }

  const rows = [...puddingByPlayer]
    .sort((a, b) => {
      if (b.puddings !== a.puddings) return b.puddings - a.puddings;
      return a.name.localeCompare(b.name);
    })
    .map((entry) => ({
      ...entry,
      delta: deltas[entry.id] ?? 0,
    }));

  if (maxPuddings === minPuddings) {
    return {
      id: Date.now(),
      winnersText: "Empate total en pudines",
      pointsText: "+0 pts",
      detailText: "Todos tienen la misma cantidad.",
      rows,
    };
  }

  const winnerNames = winners.map((entry) => entry.name).join(" / ");

  if (players.length <= 2) {
    return {
      id: Date.now(),
      winnersText: winnerNames,
      pointsText: `+${plusPoints} pts por pudines`,
      detailText: "En partida de 2, solo puntúa el que tiene más.",
      rows,
    };
  }

  return {
    id: Date.now(),
    winnersText: winnerNames,
    pointsText: `+${plusPoints} pts por más pudines`,
    detailText: `${losers.length > 1 ? "Últimos empatados" : "Último"}: -${minusPoints} pts`,
    rows,
  };
}

function GameStage({ roomId, roomCode, playerId, hostPlayerId, players }: GameStageProps) {
  const router = useRouter();
  useRoomChannel({ roomId, playerId });

  const snapshot = useRoomStore((state) => state.snapshot);
  const waitingForPlayers = useRoomStore((state) => state.waitingForPlayers);
  const lastReveal = useRoomStore((state) => state.lastReveal);
  const lastError = useRoomStore((state) => state.lastError);
  const setLastReveal = useRoomStore((state) => state.setLastReveal);
  const setPendingSelection = useRoomStore((state) => state.setPendingSelection);
  const setWaitingForPlayers = useRoomStore((state) => state.setWaitingForPlayers);
  const me = useRoomStore(selectCurrentPlayer(playerId));
  const grouped = useRoomStore(selectGroupedHand(playerId));
  const projectedScore = useRoomStore(selectProjectedRoundScore(playerId));
  const puddings = useRoomStore(selectPuddings(playerId));

  const { clearError, selectCard } = useGameActions({ roomId, playerId });
  const { playHover, playReveal, playRotate, playSelect, playTick, playWaiting, stopWaiting } = useSoundEffects();

  const [selectedCardIds, setSelectedCardIds] = useState<string[]>([]);
  const [draggingCardId, setDraggingCardId] = useState<string | null>(null);
  const [useChopsticksAction, setUseChopsticksAction] = useState(false);
  const [useWasabiAction, setUseWasabiAction] = useState(false);
  const [optimisticWasabiNigiri, setOptimisticWasabiNigiri] = useState<OptimisticWasabiNigiriState | null>(null);
  const [confirmLeaveOpen, setConfirmLeaveOpen] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);
  const [soundtrackLevel, setSoundtrackLevel] = useState<SoundtrackLevel>(() => getSoundtrackLevel());
  const [roundIntro, setRoundIntro] = useState<RoundIntroState | null>(null);
  const [puddingAwardIntro, setPuddingAwardIntro] = useState<PuddingAwardIntroState | null>(null);
  const [hostEndedOpen, setHostEndedOpen] = useState(false);
  const shownRoundIntroRef = useRef(0);
  const pendingRoundIntroRef = useRef<number | null>(null);
  const roundIntroIdRef = useRef(0);
  const finalPuddingIntroShownRef = useRef(false);
  const hostEndHandledRef = useRef(false);
  const revealOpen = lastReveal.length > 0;

  useEffect(() => {
    initSoundtrack();
  }, []);

  useEffect(() => {
    setGlobalSoundtrackLevel(soundtrackLevel);
  }, [soundtrackLevel]);

  const handleAbandon = async () => {
    setIsLeaving(true);
    const supabase = getSupabaseBrowserClient();

    if (playerId === hostPlayerId) {
      await supabase
        .from("rooms")
        .update({ status: "LOBBY" })
        .eq("id", roomId);
    }

    await supabase
      .from("room_players")
      .update({ presence: "offline", disconnected_at: new Date().toISOString() })
      .eq("room_id", roomId)
      .eq("user_id", playerId);
    setConfirmLeaveOpen(false);
    router.push("/");
  };

  const triggerHostEndedUx = useCallback(() => {
    if (hostEndHandledRef.current) return;
    if (playerId === hostPlayerId) return;

    hostEndHandledRef.current = true;
    setHostEndedOpen(true);
    setPendingSelection(null);
    setWaitingForPlayers(false);

    window.setTimeout(() => {
      router.push(`/lobby/${roomCode}`);
    }, 1700);
  }, [hostPlayerId, playerId, roomCode, router, setPendingSelection, setWaitingForPlayers]);

  useEffect(() => {
    if (!snapshot) return;
    const hostState = snapshot.players[hostPlayerId];
    if (!hostState) return;
    if (hostState.presence === "offline") {
      triggerHostEndedUx();
    }
  }, [hostPlayerId, snapshot, triggerHostEndedUx]);

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    const channel = supabase
      .channel(`host-watch:${roomId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "room_players", filter: `room_id=eq.${roomId}` }, async () => {
        if (hostEndHandledRef.current || playerId === hostPlayerId) return;

        const hostRowRes = await supabase
          .from("room_players")
          .select("presence")
          .eq("room_id", roomId)
          .eq("user_id", hostPlayerId)
          .maybeSingle();

        if (!hostRowRes.error && hostRowRes.data?.presence === "offline") {
          triggerHostEndedUx();
        }
      })
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "rooms", filter: `id=eq.${roomId}` }, (payload) => {
        if (hostEndHandledRef.current || playerId === hostPlayerId) return;
        const nextStatus = (payload.new as { status?: string } | null)?.status;
        if (nextStatus === "LOBBY") {
          triggerHostEndedUx();
        }
      });

    channel.subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [hostPlayerId, playerId, roomId, triggerHostEndedUx]);

  useEffect(() => {
    if (waitingForPlayers) {
      playWaiting();
    } else {
      stopWaiting();
    }
  }, [waitingForPlayers, playWaiting, stopWaiting]);

  useEffect(() => {
    if (!optimisticWasabiNigiri || !snapshot) return;

    const snapshotRound = snapshot.round ?? 1;

    // Si cambió de ronda, la carta ya debería estar confirmada en el snapshot anterior.
    if (snapshotRound > optimisticWasabiNigiri.round) {
      setOptimisticWasabiNigiri(null);
      return;
    }

    // Solo limpiar el estado optimista si la carta YA existe en el playedCards real del snapshot.
    // Esto evita que la carta desaparezca antes de que el servidor confirme.
    const myPlayer = snapshot.players[playerId];
    if (myPlayer && myPlayer.playedCards.includes(optimisticWasabiNigiri.id)) {
      setOptimisticWasabiNigiri(null);
    }
  }, [optimisticWasabiNigiri, playerId, snapshot]);

  useEffect(() => {
    if (!snapshot) return;
    if (snapshot.status !== "WAITING_SCOREBOARD") return;
    if (snapshot.round < snapshot.totalRounds) return;
    if (revealOpen) return;
    if (finalPuddingIntroShownRef.current) return;

    const playerNamesAtClose = Object.fromEntries(
      players.map((player, index) => {
        const fallbackName = `Jugador ${index + 1}`;
        const resolvedName = player.display_name?.trim() || fallbackName;
        return [player.user_id, resolvedName] as const;
      })
    ) as Record<string, string>;

    finalPuddingIntroShownRef.current = true;
    const intro = computePuddingAwardIntro(snapshot, playerNamesAtClose);
    setPuddingAwardIntro(intro);
    playTick();
    playReveal();

    const timer = window.setTimeout(() => {
      try {
        window.localStorage.setItem(
          `sushi-go:last-final:${roomCode}`,
          JSON.stringify({
            savedAt: Date.now(),
            snapshot,
          })
        );
      } catch {
        // ignore storage failures and continue navigation
      }
      router.push(`/scoreboard/${roomCode}`);
    }, 3200);

    return () => {
      window.clearTimeout(timer);
    };
  }, [players, playReveal, playTick, revealOpen, roomCode, router, snapshot]);

  useEffect(() => {
    if (!snapshot) return;

    const isRoundStatus =
      snapshot.status === "ROUND_1" || snapshot.status === "ROUND_2" || snapshot.status === "ROUND_3";

    if (!isRoundStatus || snapshot.turn !== 1) return;
    if (snapshot.round <= shownRoundIntroRef.current) return;

    if (revealOpen) {
      pendingRoundIntroRef.current = snapshot.round;
      return;
    }

    shownRoundIntroRef.current = snapshot.round;
    roundIntroIdRef.current += 1;
    setRoundIntro({ id: roundIntroIdRef.current, round: snapshot.round });
  }, [revealOpen, snapshot]);

  useEffect(() => {
    if (revealOpen || pendingRoundIntroRef.current === null) return;

    const pendingRound = pendingRoundIntroRef.current;
    pendingRoundIntroRef.current = null;

    if (pendingRound <= shownRoundIntroRef.current) return;

    shownRoundIntroRef.current = pendingRound;
    roundIntroIdRef.current += 1;
    setRoundIntro({ id: roundIntroIdRef.current, round: pendingRound });
  }, [revealOpen]);

  useEffect(() => {
    if (!roundIntro) return;

    playRotate();
    const tickT = window.setTimeout(() => {
      playTick();
    }, 120);
    const revealT = window.setTimeout(() => {
      playReveal();
    }, 420);
    const closeT = window.setTimeout(() => {
      setRoundIntro((current) => (current?.id === roundIntro.id ? null : current));
    }, 3600);

    return () => {
      window.clearTimeout(tickT);
      window.clearTimeout(revealT);
      window.clearTimeout(closeT);
    };
  }, [playReveal, playRotate, playTick, roundIntro]);

  const lockInSelection = useCallback(async () => {
    if (selectedCardIds.length === 0) return;
    if (useChopsticksAction && selectedCardIds.length !== 2) {
      // Must select 2 cards
      return;
    }
    
    // Si la API acepta string o array
    const nigiriSelectedForWasabi =
      useWasabiAction && selectedCardIds.length > 0 && isNigiriCard(selectedCardIds[0])
        ? selectedCardIds[0]
        : null;

    if (nigiriSelectedForWasabi) {
      setOptimisticWasabiNigiri({
        id: nigiriSelectedForWasabi,
        round: snapshot?.round ?? 1,
        turn: snapshot?.turn ?? 1,
      });
    }

    const ok = await selectCard(
      useChopsticksAction ? [selectedCardIds[0], selectedCardIds[1]] : selectedCardIds[0], 
      useChopsticksAction,
      useWasabiAction
    );
    if (ok) {
      playSelect();
      setSelectedCardIds([]);
      setUseChopsticksAction(false);
      setUseWasabiAction(false);
    } else if (nigiriSelectedForWasabi) {
      setOptimisticWasabiNigiri(null);
    }
  }, [playSelect, selectCard, selectedCardIds, snapshot?.round, snapshot?.turn, useChopsticksAction, useWasabiAction]);

  const playFromDrop = useCallback(
    async (cardId: string, droppedOnWasabi = false) => {
      // Solo permite drop de 1 en 1 si no usa chopsticks, o lo trata como 1 normal?
      // Por simplicidad, el drag and drop se desactiva con chopsticks, o si lo dropea, solo usa esa
      let idsToPlay = [cardId];
      if (useChopsticksAction) {
        if (!selectedCardIds.includes(cardId)) idsToPlay = [...selectedCardIds, cardId];
        if (idsToPlay.length < 2) {
          setSelectedCardIds(idsToPlay);
          setDraggingCardId(null);
          return;
        }
      }
      
      const shouldUseWasabi = droppedOnWasabi || useWasabiAction;
      const nigiriSelectedForWasabi = shouldUseWasabi && isNigiriCard(cardId) ? cardId : null;

      if (nigiriSelectedForWasabi) {
        setOptimisticWasabiNigiri({
          id: nigiriSelectedForWasabi,
          round: snapshot?.round ?? 1,
          turn: snapshot?.turn ?? 1,
        });
      }

      const ok = await selectCard(
        useChopsticksAction ? [idsToPlay[0], idsToPlay[1]] : idsToPlay[0], 
        useChopsticksAction,
        shouldUseWasabi
      );
      if (ok) {
        playSelect();
        setSelectedCardIds([]);
        setUseChopsticksAction(false);
        setUseWasabiAction(false);
      } else if (nigiriSelectedForWasabi) {
        setOptimisticWasabiNigiri(null);
      }
      setDraggingCardId(null);
    },
    [playSelect, selectCard, selectedCardIds, snapshot?.round, snapshot?.turn, useChopsticksAction, useWasabiAction]
  );

  const playerNames = useMemo(() => {
    const entries = players.map((player, index) => {
      const fallbackName = `Jugador ${index + 1}`;
      const resolvedName = player.display_name?.trim() || fallbackName;
      return [player.user_id, resolvedName] as const;
    });

    return Object.fromEntries(entries) as Record<string, string>;
  }, [players]);

  const pendingSelection = useRoomStore((state) => state.pendingSelection);

  const tablePlayers = useMemo(() => {
    if (!snapshot) return [];
    return Object.values(snapshot.players).map((player) => {
      let virtualPlayedCards = [...player.playedCards];
      if (player.id === playerId && pendingSelection) {
        if (Array.isArray(pendingSelection.cardId)) {
          virtualPlayedCards.push(...pendingSelection.cardId);
        } else {
          const pendingCard = pendingSelection.cardId;
          const pendingIsNigiri = isNigiriCard(pendingCard);

          if (pendingIsNigiri && pendingSelection.useWasabi) {
            virtualPlayedCards = insertNigiriAfterFirstOpenWasabi(virtualPlayedCards, pendingCard);
          } else if (pendingIsNigiri && !pendingSelection.useWasabi) {
            virtualPlayedCards = insertNigiriBeforeFirstOpenWasabi(virtualPlayedCards, pendingCard);
          } else {
            virtualPlayedCards.push(pendingCard);
          }
        }
      }

      if (
        player.id === playerId &&
        optimisticWasabiNigiri?.id &&
        !virtualPlayedCards.includes(optimisticWasabiNigiri.id)
      ) {
        virtualPlayedCards = insertNigiriAfterFirstOpenWasabi(virtualPlayedCards, optimisticWasabiNigiri.id);
      }

      return {
        id: player.id,
        displayName: playerNames[player.id] ?? "Jugador",
        playedCards: virtualPlayedCards,
        handCount: player.hand.length,
      };
    });
  }, [optimisticWasabiNigiri, pendingSelection, playerId, playerNames, snapshot]);

  const otherPlayers = useMemo(() => {
    if (!snapshot) return [];

    const allPlayersArr = Object.values(snapshot.players);
    const cardsInPlayArr = allPlayersArr.map((p) => p.playedCards.map((cardId) => cardTypeFromId(cardId) as any));
    const liveScores = scoreRoundForPlayers(cardsInPlayArr);

    return allPlayersArr
      .map((player, index) => {
        const baseScore = player.scoreByRound.reduce((sum, value) => sum + value, 0);
        const liveScore = liveScores[index]?.totalRoundPoints ?? 0;
        const livePuddings = player.playedCards.filter((cardId) => cardTypeFromId(cardId) === "pudding").length;
        return {
          id: player.id,
          displayName: playerNames[player.id] ?? "Jugador",
          handCount: player.hand.length,
          puddings: livePuddings,
          score: baseScore + liveScore,
          playedCards: player.playedCards,
          scoreByRound: player.scoreByRound,
        };
      })
      .filter((player) => player.id !== playerId);
  }, [playerId, playerNames, snapshot]);

  // Can lock only if standard turn length matches what chopsticks implies
  const canLock = useChopsticksAction 
      ? selectedCardIds.length === 2 
      : selectedCardIds.length === 1 && !waitingForPlayers;
  const myPlayedCards = me?.playedCards ?? [];
  const hasChopsticks = myPlayedCards.some((cardId) => cardTypeFromId(cardId) === "chopsticks");
  const hasOpenWasabi = countOpenWasabiSlots(myPlayedCards) > 0;
  const totalRounds = snapshot?.totalRounds ?? 3;
  const roundScores = me?.scoreByRound ?? Array.from({ length: totalRounds }, () => 0);
  const currentRoundIndex = Math.max(0, Math.min(totalRounds - 1, (snapshot?.round ?? 1) - 1));
  const finalizedBeforeCurrent = roundScores.slice(0, currentRoundIndex).reduce((sum, value) => sum + value, 0);
  const liveCurrentRoundScore = projectedScore - finalizedBeforeCurrent;

  return (
    <main className="fixed inset-0 overflow-hidden bg-gradient-to-b from-[#1a0a2e] to-[#0a0410]">
      {/* Background Ambience Layers */}
      <div className="pointer-events-none absolute inset-0 mix-blend-screen opacity-20">
        <div className="absolute top-[20%] left-[10%] h-[400px] w-[400px] rounded-full bg-cyan-600/30 blur-[100px]" />
        <div className="absolute bottom-[10%] right-[30%] h-[500px] w-[500px] rounded-full bg-fuchsia-600/20 blur-[120px]" />
      </div>

      {/* Animated Subtle Art */}
      <BackgroundArt />

      {/* Exit Game Button */}
      <div className="fixed top-6 left-6 z-50 flex items-center gap-3">
        <button
          className="relative group cursor-pointer active:scale-95 hover:-translate-y-0.5 transition-transform duration-100"
          onClick={() => {
            setSoundtrackLevel(cycleSoundtrackLevel());
          }}
          onMouseEnter={playHover}
          type="button"
        >
          <div className="relative flex items-center justify-center h-12 w-12 rounded-xl bg-gradient-to-b from-[#4b5563] to-[#1f2937] shadow-[0_15px_30px_rgba(0,0,0,0.6),inset_0_2px_5px_rgba(255,255,255,0.2),inset_0_-6px_15px_rgba(0,0,0,0.4)] group-hover:brightness-110 group-hover:shadow-[0_20px_32px_rgba(0,0,0,0.7),inset_0_2px_5px_rgba(255,255,255,0.25),inset_0_-6px_15px_rgba(0,0,0,0.35)] group-active:shadow-[0_5px_10px_rgba(0,0,0,0.6),inset_0_2px_5px_rgba(255,255,255,0.1),inset_0_-2px_5px_rgba(0,0,0,0.4)] transition-all">
            {soundtrackLevel === 0 ? (
              <VolumeX className="text-white drop-shadow-[0_3px_5px_rgba(0,0,0,0.8)] w-5 h-5" />
            ) : soundtrackLevel === 1 ? (
              <Volume1 className="text-white drop-shadow-[0_3px_5px_rgba(0,0,0,0.8)] w-5 h-5" />
            ) : (
              <Volume2 className="text-white drop-shadow-[0_3px_5px_rgba(0,0,0,0.8)] w-5 h-5" />
            )}
          </div>
        </button>

        <button
          className="relative group cursor-pointer active:scale-95 hover:-translate-y-0.5 transition-transform duration-100"
          onClick={() => setConfirmLeaveOpen(true)}
          onMouseEnter={playHover}
          type="button"
        >
          <div className="relative flex items-center justify-center h-12 w-12 rounded-xl bg-gradient-to-b from-[#4b5563] to-[#1f2937] shadow-[0_15px_30px_rgba(0,0,0,0.6),inset_0_2px_5px_rgba(255,255,255,0.2),inset_0_-6px_15px_rgba(0,0,0,0.4)] group-hover:brightness-110 group-hover:shadow-[0_20px_32px_rgba(0,0,0,0.7),inset_0_2px_5px_rgba(255,255,255,0.25),inset_0_-6px_15px_rgba(0,0,0,0.35)] group-active:shadow-[0_5px_10px_rgba(0,0,0,0.6),inset_0_2px_5px_rgba(255,255,255,0.1),inset_0_-2px_5px_rgba(0,0,0,0.4)] transition-all">
            <LogOut className="text-white drop-shadow-[0_3px_5px_rgba(0,0,0,0.8)] w-5 h-5 ml-1" />
          </div>
        </button>
      </div>

      <AnimatePresence>
        {hostEndedOpen && (
          <>
            <motion.div
              animate={{ opacity: 1 }}
              className="fixed inset-0 z-[58] bg-black/65 backdrop-blur-sm"
              exit={{ opacity: 0 }}
              initial={{ opacity: 0 }}
            />
            <motion.div
              animate={{ opacity: 1, scale: 1, y: 0 }}
              className="fixed left-1/2 top-1/2 z-[72] w-[90vw] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-white/10 bg-[#120912] p-5 text-white shadow-[0_25px_60px_rgba(0,0,0,0.7)]"
              exit={{ opacity: 0, scale: 0.95, y: 12 }}
              initial={{ opacity: 0, scale: 0.95, y: 12 }}
            >
              <h2 className="font-heading text-2xl font-black tracking-wide">Partida finalizada por host</h2>
              <p className="mt-2 text-sm text-white/75">
                El host terminó la sesión. Te llevamos de vuelta al lobby para continuar con buena sincronización.
              </p>
              <div className="mt-5 flex justify-end">
                <Button
                  className="bg-amber-600 hover:bg-amber-700 text-white"
                  onClick={() => router.push(`/lobby/${roomCode}`)}
                  type="button"
                >
                  Ir al lobby
                </Button>
              </div>
            </motion.div>
          </>
        )}

        {confirmLeaveOpen && (
          <>
            <motion.div
              animate={{ opacity: 1 }}
              className="fixed inset-0 z-[60] bg-black/65 backdrop-blur-sm"
              exit={{ opacity: 0 }}
              initial={{ opacity: 0 }}
              onClick={() => {
                if (!isLeaving) setConfirmLeaveOpen(false);
              }}
            />
            <motion.div
              animate={{ opacity: 1, scale: 1, y: 0 }}
              className="fixed left-1/2 top-1/2 z-[70] w-[90vw] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-white/10 bg-[#120912] p-5 text-white shadow-[0_25px_60px_rgba(0,0,0,0.7)]"
              exit={{ opacity: 0, scale: 0.95, y: 12 }}
              initial={{ opacity: 0, scale: 0.95, y: 12 }}
            >
              <h2 className="font-heading text-2xl font-black tracking-wide">Abandonar sala</h2>
              <p className="mt-2 text-sm text-white/75">
                Vas a salir de la partida actual y volver al inicio. Esta accion te marcara como desconectado.
              </p>
              <div className="mt-5 flex justify-end gap-2">
                <Button
                  disabled={isLeaving}
                  onClick={() => setConfirmLeaveOpen(false)}
                  type="button"
                  variant="secondary"
                >
                  Cancelar
                </Button>
                <Button
                  className="bg-red-600 hover:bg-red-700 text-white"
                  disabled={isLeaving}
                  onClick={() => {
                    void handleAbandon();
                  }}
                  type="button"
                >
                  {isLeaving ? "Saliendo..." : "Si, abandonar"}
                </Button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <OpponentsHud players={otherPlayers} />

      {(snapshot?.round ?? 1) > 0 && (
        <div className="pointer-events-none fixed right-[376px] top-5 z-45 hidden lg:flex items-start gap-4">
          {roundScores
            .map((score, index) => ({ score, index }))
            .filter(({ index }) => index <= currentRoundIndex)
            .map(({ score, index }) => {
              const isCurrentRound = index === currentRoundIndex;
              const displayScore = isCurrentRound ? liveCurrentRoundScore : score;

              return (
              <motion.div
                key={`round-badge-${index}`}
                initial={{ opacity: 0, y: -24, scale: 0.85 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ delay: 0.08 * index, duration: 0.35, ease: "easeOut" }}
                className="flex flex-col items-center"
              >
                <span className="mb-1 text-[10px] font-black uppercase tracking-[0.12em] text-[#f8deb1] drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                  {`Ronda ${index + 1}`}
                </span>
                <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-[radial-gradient(circle_at_30%_25%,rgba(255,255,255,0.22),rgba(255,107,107,0.16)_45%,rgba(78,205,196,0.18)_70%,rgba(18,10,28,0.95)_100%)] border border-[#f6c28e]/45 shadow-[0_14px_28px_rgba(0,0,0,0.55),inset_0_4px_10px_rgba(255,255,255,0.12),inset_0_-10px_16px_rgba(0,0,0,0.45)]">
                  <div className="absolute inset-1 rounded-full border border-white/15" />
                  <span className="font-heading text-3xl font-black leading-none text-[#FFE66D] drop-shadow-[0_2px_8px_rgba(255,230,109,0.55)]">
                    {displayScore}
                  </span>
                </div>
              </motion.div>
            );})}
        </div>
      )}

      <ComboOverlay playedCards={myPlayedCards} />

      <AnimatePresence>
        {roundIntro && !revealOpen && (
          <motion.div
            key={`round-intro-${roundIntro.id}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="pointer-events-none fixed inset-y-0 left-0 right-0 lg:right-[360px] z-[55] flex items-center justify-center"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.7 }}
              animate={{ opacity: [0, 0.65, 0], scale: [0.7, 1.25, 1.95] }}
              transition={{ duration: 1.6, ease: "easeOut" }}
              className="absolute h-[72vh] w-[72vh] rounded-full bg-yellow-300/35 blur-3xl"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.72, y: 40 }}
              animate={{ opacity: [0, 1, 1, 0], scale: [0.72, 1.16, 1.14, 1.1], y: [40, 0, 0, -10] }}
              transition={{ duration: 3.25, times: [0, 0.3, 0.78, 1], ease: "easeOut" }}
              className="rounded-3xl border border-white/30 bg-black/50 px-14 py-9 text-center shadow-[0_28px_70px_rgba(0,0,0,0.72)] backdrop-blur-md"
            >
              <p className="font-heading text-4xl uppercase tracking-[0.28em] text-white/85">Ronda</p>
              <p className="font-heading text-8xl font-black leading-none text-[#fbbf24] drop-shadow-[0_8px_24px_rgba(251,191,36,0.92)]">
                {roundIntro.round}
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 0.72, 0] }}
              transition={{ duration: 1.2, times: [0, 0.34, 1] }}
              className="absolute inset-0 bg-white/20"
            />
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {puddingAwardIntro && !revealOpen && (
          <motion.div
            key={`pudding-award-${puddingAwardIntro.id}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35 }}
            className="pointer-events-none fixed inset-y-0 left-0 right-0 lg:right-[360px] z-[56] flex items-center justify-center"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.75 }}
              animate={{ opacity: [0, 0.6, 0.35], scale: [0.75, 1.08, 1.25] }}
              transition={{ duration: 1.9, ease: "easeOut" }}
              className="absolute h-[78vh] w-[78vh] rounded-full bg-[#f9a8d4]/30 blur-3xl"
            />
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 0.28, 0.14] }}
              transition={{ duration: 2.1, ease: "easeOut" }}
              className="absolute inset-0 bg-[radial-gradient(circle_at_50%_35%,rgba(255,255,255,0.32),rgba(250,204,21,0.1)_36%,rgba(0,0,0,0.72)_82%)]"
            />

            {Array.from({ length: 8 }).map((_, index) => {
              const baseX = -240 + index * 70;
              const driftX = (index % 2 === 0 ? 26 : -22) + index;
              const delay = index * 0.08;
              const scale = 0.5 + ((index % 3) * 0.14);
              return (
                <motion.div
                  key={`pudding-particle-${index}`}
                  initial={{ opacity: 0, x: baseX, y: 140, scale: 0.35 }}
                  animate={{ opacity: [0, 0.75, 0], x: [baseX, baseX + driftX, baseX + driftX * 1.3], y: [140, 18, -92], scale: [0.35, scale, 0.42] }}
                  transition={{ duration: 1.9, delay, ease: "easeOut" }}
                  className="absolute"
                >
                  <Image src={pudinImg} alt="" width={44} height={44} className="drop-shadow-[0_8px_14px_rgba(0,0,0,0.55)]" />
                </motion.div>
              );
            })}

            <motion.div
              initial={{ opacity: 0, scale: 0.72, y: 32 }}
              animate={{ opacity: [0, 1, 1], scale: [0.72, 1.08, 1], y: [32, 0, 0] }}
              transition={{ duration: 0.9, ease: "easeOut" }}
              className="relative overflow-hidden rounded-3xl border border-white/35 bg-black/55 px-10 py-7 text-center shadow-[0_28px_70px_rgba(0,0,0,0.72)] backdrop-blur-md"
            >
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_18%,rgba(255,255,255,0.2),rgba(255,255,255,0)_56%)]" />
              <motion.div
                initial={{ opacity: 0, y: -12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.12, duration: 0.35 }}
                className="relative mx-auto w-fit"
              >
                <Image src="/sushigo-logo.png" alt="Sushi Go" width={150} height={72} className="mx-auto h-auto w-[132px] drop-shadow-[0_8px_16px_rgba(0,0,0,0.75)]" priority />
                <p className="mt-1 font-heading text-3xl uppercase tracking-[0.2em] text-[#f9a8d4]">Premio Pudín</p>
              </motion.div>
              <p className="mt-3 font-heading text-5xl font-black leading-none text-[#FFE66D] drop-shadow-[0_8px_24px_rgba(251,191,36,0.88)]">
                {puddingAwardIntro.pointsText}
              </p>
              <p className="mt-2 text-lg font-bold text-white drop-shadow-md">{puddingAwardIntro.winnersText}</p>
              <p className="mt-1 text-sm font-semibold uppercase tracking-[0.08em] text-white/75">{puddingAwardIntro.detailText}</p>
              <div className="mt-4 rounded-2xl border border-white/15 bg-black/35 px-4 py-3">
                <p className="text-[11px] font-black uppercase tracking-[0.15em] text-white/65">Resumen de pudines</p>
                <div className="mt-2 space-y-1.5">
                  {puddingAwardIntro.rows.map((row) => (
                    <div key={row.id} className="grid grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-2 text-sm">
                      <span className="truncate text-left text-white/90">{row.name}</span>
                      <span className="text-right font-bold text-[#f9a8d4]">{row.puddings} pudines</span>
                      <span
                        className={cn(
                          "text-right font-black",
                          row.delta > 0 && "text-emerald-300",
                          row.delta < 0 && "text-red-300",
                          row.delta === 0 && "text-white/70"
                        )}
                      >
                        {row.delta > 0 ? `+${row.delta}` : row.delta} pts
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <TableView3D
        currentPlayerId={playerId}
        canDropCard={!waitingForPlayers}
        draggingCardId={draggingCardId}
        optimisticWasabiNigiriId={optimisticWasabiNigiri?.id ?? null}
        onDropCard={(cardId, droppedOnWasabi) => {
          if (waitingForPlayers) return;
          void playFromDrop(cardId, droppedOnWasabi);
        }}
        onClickPlayedCard={(pId, cardId) => {
          // Si hace click en sus propios palillos en la mesa
          if (pId === playerId && cardTypeFromId(cardId) === "chopsticks" && !waitingForPlayers) {
            setUseChopsticksAction((prev) => {
              if (prev) {
                // If turning off, clear the second card if we had 2
                if (selectedCardIds.length > 1) {
                   setSelectedCardIds([selectedCardIds[0]]);
                }
              }
              return !prev;
            });
            playHover();
          }
        }}
        players={tablePlayers}
      />

      <Hand3D
        disabled={waitingForPlayers}
        draggingCardId={draggingCardId}
        onDragEndCard={() => {
          setDraggingCardId(null);
        }}
        onDragStartCard={(cardId) => {
          if (!useChopsticksAction) {
            setDraggingCardId(cardId);
            playHover();
          }
        }}
        onSelectCard={(cardId) => {
          if (useChopsticksAction) {
             if (selectedCardIds.includes(cardId)) {
                setSelectedCardIds(selectedCardIds.filter(id => id !== cardId));
             } else if (selectedCardIds.length < 2) {
                setSelectedCardIds([...selectedCardIds, cardId]);
             }
          } else {
             setSelectedCardIds([cardId]);
          }
          playHover();
        }}
        regularGroups={grouped.regularGroups}
        selectedCardIds={selectedCardIds}
        specials={grouped.specials}
      />

      <GlassScoreboard
        round={snapshot?.round ?? 1}
        totalRounds={snapshot?.totalRounds ?? 3}
        turn={snapshot?.turn ?? 1}
        myHandCount={me?.hand.length ?? 0}
        myPuddings={puddings}
        myScore={projectedScore}
        myPlayedCards={myPlayedCards}
        others={otherPlayers}
        waitingForPlayers={waitingForPlayers}
        canLock={canLock}
        onLockInSelection={lockInSelection}
        hasChopsticks={hasChopsticks}
        useChopsticksAction={useChopsticksAction}
        onToggleChopsticks={() => {
          setUseChopsticksAction((prev) => {
            if (prev && selectedCardIds.length > 1) {
              setSelectedCardIds([selectedCardIds[0]]);
            }
            return !prev;
          });
          setUseWasabiAction(false);
        }}
        hasOpenWasabi={hasOpenWasabi}
        useWasabiAction={useWasabiAction}
        onToggleWasabi={() => {
          setUseWasabiAction((prev) => !prev);
          setUseChopsticksAction(false);
        }}
      />

      {/* Error Toast Float */}
      {lastError && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-50 rounded-xl border border-destructive/50 bg-destructive/90 px-6 py-3 text-sm text-white shadow-2xl backdrop-blur-md">
          <p className="font-bold">{lastError}</p>
          <Button className="mt-2 text-xs h-7" onClick={clearError} size="sm" variant="secondary">
            Cerrar
          </Button>
        </div>
      )}

      <RevealLayer3D
        onDone={() => {
          setLastReveal([]);
        }}
        open={revealOpen}
        playerNames={playerNames}
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
  const resetRoomState = useRoomStore((state) => state.resetRoomState);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [roomId, setRoomId] = useState<string | null>(null);
  const [playerId, setPlayerId] = useState<string | null>(null);
  const [players, setPlayers] = useState<RoomPlayerRow[]>([]);

  useEffect(() => {
    const load = async () => {
      resetRoomState();

      if (!roomCode) {
        setError("Codigo de sala invalido.");
        setLoading(false);
        return;
      }

      const supabase = getSupabaseBrowserClient();
      const auth = await supabase.auth.getUser();
      const currentUserId = auth.data.user?.id ?? null;

      const roomRes = await supabase.from("rooms").select("id, code, host_id, settings").eq("code", roomCode).single();
      if (roomRes.error || !roomRes.data) {
        setError("No se encontro la sala solicitada.");
        setLoading(false);
        return;
      }

      const room = roomRes.data as RoomRow;
      const playersRes = await supabase
        .from("room_players")
        .select("user_id, display_name, is_host, seat_index, presence")
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

      const allowedRounds = roundOptionsByPlayers(roomPlayers.length);
      const configuredRounds = room.settings?.total_rounds;
      const totalRounds =
        typeof configuredRounds === "number" && allowedRounds.includes(configuredRounds)
          ? configuredRounds
          : roundsByPlayers(roomPlayers.length);

      setRoomId(room.id);
      setPlayers(roomPlayers);
      setPlayerId(resolvedPlayerId);
      setMeta({ roomId: room.id, playerId: resolvedPlayerId });
      setSnapshot(buildBootSnapshot(room.id, roomPlayers, totalRounds));
      setLoading(false);
    };

    void load();
  }, [resetRoomState, roomCode, setMeta, setSnapshot]);

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

  const hostPlayerId = players.find((player) => player.is_host)?.user_id ?? players[0]?.user_id ?? playerId;

  return <GameStage playerId={playerId} hostPlayerId={hostPlayerId} players={players} roomCode={roomCode} roomId={roomId} />;
}
