import { test } from "node:test";
import assert from "node:assert/strict";
import {
  SCENES,
  assignChord,
  chordNotes,
  chordLabel,
  emptyScore,
  buildFoundation,
  evolve,
  sceneForScore,
  validProgression,
} from "../lib/score";

test("a chord pad changes only the selected bar without mutating the progression", () => {
  const original = [0, 0, 4, 4, 5, 3, 4, 0];
  const updated = assignChord(original, 2, 3);
  assert.deepEqual(updated, [0, 0, 3, 4, 5, 3, 4, 0]);
  assert.deepEqual(original, [0, 0, 4, 4, 5, 3, 4, 0]);
  assert.notEqual(updated, original);
  for (const [bar, degree] of [
    [-1, 0],
    [8, 0],
    [0, 7],
    [0, -1],
    [1.5, 0],
  ]) {
    assert.throws(() => assignChord(original, bar, degree));
  }
});

test("all seven chord pads produce ascending, in-key triads in every scene", () => {
  for (const scene of SCENES) {
    for (let degree = 0; degree < 7; degree++) {
      const notes = chordNotes(scene, degree);
      assert.equal(notes.length, 3);
      assert.ok(notes[0] < notes[1] && notes[1] < notes[2]);
      assert.ok(chordLabel(scene, degree).length > 0);
      for (const midi of notes) {
        assert.ok(scene.scale.includes((((midi - scene.root) % 12) + 12) % 12));
      }
    }
  }
});

test("pad-assigned harmony survives Build and Auto-evolve; previews do not change a score", () => {
  const draft = emptyScore("horizon", 42);
  let progression = [...sceneForScore(draft).progression];
  const chosen = [0, 3, 5, 4, 1, 3, 4, 0];
  chosen.forEach((degree, bar) => {
    progression = assignChord(progression, bar, degree);
  });
  assert.equal(validProgression(progression), true);
  const before = structuredClone(draft);
  chordNotes(sceneForScore(draft), 3);
  assert.deepEqual(draft, before);
  let built = buildFoundation(draft, ["cello", "harp"], progression);
  for (let i = 0; i < 8; i++) built = evolve(built);
  assert.deepEqual(built.progression, chosen);
});
