import assert from "node:assert/strict";
import test from "node:test";

import { scorePuddings } from "../../src/domain/scoring";

test("pudding en 2 jugadores no aplica penalizacion negativa", () => {
  const points = scorePuddings([4, 0]);

  assert.equal(points[0], 6);
  assert.equal(points[1], 0);
});

test("pudding en 4 jugadores reparte empate correctamente", () => {
  const points = scorePuddings([5, 5, 1, 1]);

  assert.equal(points[0], 3);
  assert.equal(points[1], 3);
  assert.equal(points[2], -3);
  assert.equal(points[3], -3);
});
