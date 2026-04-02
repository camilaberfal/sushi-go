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
import { motion, AnimatePresence } from "framer-motion";
import { LogOut } from "lucide-react";
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

type RoomRow = {
  id: string;
  code: string;
  settings: { total_rounds?: number } | null;
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

type RoundIntroState = {
  id: number;
  round: number;
};

function GameStage({ roomId, roomCode, playerId, players }: GameStageProps) {
  const router = useRouter();
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
  const { playHover, playReveal, playRotate, playSelect, playTick, playWaiting, stopWaiting } = useSoundEffects();

  const [selectedCardIds, setSelectedCardIds] = useState<string[]>([]);
  const [draggingCardId, setDraggingCardId] = useState<string | null>(null);
  const [useChopsticksAction, setUseChopsticksAction] = useState(false);
  const [useWasabiAction, setUseWasabiAction] = useState(false);
  const [confirmLeaveOpen, setConfirmLeaveOpen] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);
  const [roundIntro, setRoundIntro] = useState<RoundIntroState | null>(null);
  const shownRoundIntroRef = useRef(0);
  const pendingRoundIntroRef = useRef<number | null>(null);
  const roundIntroIdRef = useRef(0);
  const revealOpen = lastReveal.length > 0;

  const handleAbandon = async () => {
    setIsLeaving(true);
    const supabase = getSupabaseBrowserClient();
    await supabase
      .from("room_players")
      .update({ presence: "offline", disconnected_at: new Date().toISOString() })
      .eq("room_id", roomId)
      .eq("user_id", playerId);
    setConfirmLeaveOpen(false);
    router.push("/");
  };

  useEffect(() => {
    if (waitingForPlayers) {
      playWaiting();
    } else {
      stopWaiting();
    }
  }, [waitingForPlayers, playWaiting, stopWaiting]);

  useEffect(() => {
    if (!snapshot) return;
    if (snapshot.status !== "WAITING_SCOREBOARD") return;
    if (snapshot.round < snapshot.totalRounds) return;

    const timer = window.setTimeout(() => {
      router.push(`/scoreboard/${roomCode}`);
    }, 900);

    return () => {
      window.clearTimeout(timer);
    };
  }, [roomCode, router, snapshot]);

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
    }, 260);
    const closeT = window.setTimeout(() => {
      setRoundIntro((current) => (current?.id === roundIntro.id ? null : current));
    }, 2300);

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
    }
  }, [selectCard, selectedCardIds, useChopsticksAction, useWasabiAction, playSelect]);

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
      
      const ok = await selectCard(
        useChopsticksAction ? [idsToPlay[0], idsToPlay[1]] : idsToPlay[0], 
        useChopsticksAction,
        droppedOnWasabi || useWasabiAction
      );
      if (ok) {
        playSelect();
        setSelectedCardIds([]);
        setUseChopsticksAction(false);
        setUseWasabiAction(false);
      }
      setDraggingCardId(null);
    },
    [selectCard, useChopsticksAction, useWasabiAction, playSelect, selectedCardIds]
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

          if (pendingIsNigiri && pendingSelection.useWasabi === false) {
            const firstOpenWasabiIndex = virtualPlayedCards.findIndex((playedCardId, idx) => {
              if (cardTypeFromId(playedCardId) !== "wasabi") return false;

              let openCount = 0;
              for (let i = 0; i <= idx; i += 1) {
                const t = cardTypeFromId(virtualPlayedCards[i]);
                if (t === "wasabi") openCount += 1;
                if (isNigiriCard(virtualPlayedCards[i]) && openCount > 0) openCount -= 1;
              }

              return openCount > 0;
            });

            if (firstOpenWasabiIndex >= 0) {
              virtualPlayedCards.splice(firstOpenWasabiIndex, 0, pendingCard);
            } else {
              virtualPlayedCards.push(pendingCard);
            }
          } else {
            virtualPlayedCards.push(pendingCard);
          }
        }
      }

      return {
        id: player.id,
        displayName: playerNames[player.id] ?? "Jugador",
        playedCards: virtualPlayedCards,
        handCount: player.hand.length,
      };
    });
  }, [playerNames, snapshot, playerId, pendingSelection]);

  const otherPlayers = useMemo(() => {
    if (!snapshot) return [];

    const allPlayersArr = Object.values(snapshot.players);
    const cardsInPlayArr = allPlayersArr.map((p) => p.playedCards.map((cardId) => cardTypeFromId(cardId) as any));
    const liveScores = scoreRoundForPlayers(cardsInPlayArr);

    return allPlayersArr
      .map((player, index) => {
        const baseScore = player.scoreByRound.reduce((sum, value) => sum + value, 0);
        const liveScore = liveScores[index]?.totalRoundPoints ?? 0;
        return {
          id: player.id,
          displayName: playerNames[player.id] ?? "Jugador",
          handCount: player.hand.length,
          puddings: player.puddings,
          score: baseScore + liveScore,
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
      <div className="fixed top-6 left-6 z-50">
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

      <ComboOverlay playedCards={myPlayedCards} />

      <AnimatePresence>
        {roundIntro && !revealOpen && (
          <motion.div
            key={`round-intro-${roundIntro.id}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="pointer-events-none fixed inset-0 z-[55]"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.7 }}
              animate={{ opacity: [0, 0.7, 0], scale: [0.7, 1.15, 1.6] }}
              transition={{ duration: 0.9, ease: "easeOut" }}
              className="absolute left-1/2 top-1/2 h-[50vh] w-[50vh] -translate-x-1/2 -translate-y-1/2 rounded-full bg-yellow-300/35 blur-3xl"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: 24 }}
              animate={{ opacity: [0, 1, 0], scale: [0.8, 1.08, 1], y: [24, 0, -4] }}
              transition={{ duration: 1.85, times: [0, 0.45, 1], ease: "easeOut" }}
              className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-white/25 bg-black/45 px-8 py-4 text-center shadow-[0_18px_40px_rgba(0,0,0,0.6)] backdrop-blur-md"
            >
              <p className="font-heading text-2xl uppercase tracking-[0.2em] text-white/80">Ronda</p>
              <p className="font-heading text-6xl font-black leading-none text-[#fbbf24] drop-shadow-[0_4px_16px_rgba(251,191,36,0.9)]">
                {roundIntro.round}
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 0.8, 0] }}
              transition={{ duration: 0.45, times: [0, 0.3, 1] }}
              className="absolute inset-0 bg-white/20"
            />
          </motion.div>
        )}
      </AnimatePresence>

      <TableView3D
        currentPlayerId={playerId}
        canDropCard={!waitingForPlayers}
        draggingCardId={draggingCardId}
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

      const roomRes = await supabase.from("rooms").select("id, code, settings").eq("code", roomCode).single();
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

  return <GameStage playerId={playerId} players={players} roomCode={roomCode} roomId={roomId} />;
}
