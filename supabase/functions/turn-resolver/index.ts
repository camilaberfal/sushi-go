import {
  AuthoritativeRoomState,
  resolveGracePeriodBots,
  submitSelectCard,
} from "../../../src/server/game-engine";

type TurnResolverRequest = {
  state: AuthoritativeRoomState;
  nowMs?: number;
};

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
    },
  });
}

export async function handleTurnResolver(req: Request): Promise<Response> {
  if (req.method === "OPTIONS") {
    return json({ ok: true });
  }

  if (req.method !== "POST") {
    return json({ error: "Method not allowed" }, 405);
  }

  const body = (await req.json()) as Partial<TurnResolverRequest>;
  if (!body.state) {
    return json({ error: "state is required" }, 400);
  }

  const nowMs = body.nowMs ?? Date.now();
  const withBots = resolveGracePeriodBots(body.state, nowMs);

  let workingState = withBots;
  let events = [] as ReturnType<typeof submitSelectCard>["events"];
  let resolvedTurn = false;

  const pendingIds = new Set(Object.keys(workingState.pendingSelections));

  for (const playerId of workingState.turnOrder) {
    if (pendingIds.has(playerId)) continue;
    const player = workingState.players[playerId];
    if (!player || player.presence !== "bot") continue;

    const firstCard = player.hand[0];
    if (!firstCard) continue;

    const result = submitSelectCard(workingState, playerId, {
      cardId: firstCard.id,
      timestamp: nowMs,
      useChopsticks: false,
    });

    workingState = result.state;
    events = [...events, ...result.events];
    resolvedTurn = resolvedTurn || result.resolvedTurn;
  }

  return json({
    ok: true,
    state: workingState,
    events,
    resolvedTurn,
  });
}
