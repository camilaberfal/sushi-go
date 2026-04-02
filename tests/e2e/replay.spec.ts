import assert from "node:assert/strict";
import test from "node:test";

import {
  advanceTurn,
  continueFromScoreboard,
  initialGameMachineState,
  startGameFromLobby,
} from "../../src/domain/state-machine";

test("flujo permite finalizar partida y preparar revancha", () => {
  let state = startGameFromLobby(1);

  state = advanceTurn(state);
  state = continueFromScoreboard(state, 1);

  state = advanceTurn(state);
  state = continueFromScoreboard(state, 1);

  state = advanceTurn(state);
  state = continueFromScoreboard(state, 1);

  assert.equal(state.status, "FINAL_PODIUM");

  const replayState = startGameFromLobby(1);
  assert.equal(replayState.status, "ROUND_1");
  assert.equal(initialGameMachineState().status, "LOBBY");
});
