import {
  AuthoritativeRoomState,
  submitUnknownSelectCard,
} from "../../../src/server/game-engine";

type RoomCommandRequest = {
  roomId: string;
  playerId: string;
  payload: unknown;
  state: AuthoritativeRoomState;
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

export async function handleRoomCommand(req: Request): Promise<Response> {
  if (req.method === "OPTIONS") {
    return json({ ok: true });
  }

  if (req.method !== "POST") {
    return json({ error: "Method not allowed" }, 405);
  }

  const body = (await req.json()) as Partial<RoomCommandRequest>;

  if (!body.roomId || !body.playerId || !body.state) {
    return json({ error: "roomId, playerId and state are required" }, 400);
  }

  const result = submitUnknownSelectCard(body.state, body.playerId, body.payload);

  return json({
    ok: true,
    roomId: body.roomId,
    state: result.state,
    events: result.events,
    resolvedTurn: result.resolvedTurn,
  });
}
