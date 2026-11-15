import { test } from "node:test";
import assert from "node:assert/strict";
import {
  INSTRUMENTS,
  MAX_LAYERS,
  SCENES,
  TOTAL_STEPS,
  compose,
  evolve,
  padNotes,
  reorchestrate,
  undoLayer,
  weave,
} from "../lib/score";
import { crescendoLength } from "../lib/audio";

test("all scenes produce deterministic, bounded, in-key eight-bar scores", () => {
  for (const scene of SCENES)
    for (const energy of [0, 0.5, 1]) {
      const score = compose(scene.id, 12345, energy);
      assert.deepEqual(score, compose(scene.id, 12345, energy));
      for (const instrument of INSTRUMENTS) {
        assert.ok(score.parts[instrument.id].notes.length > 0);
        for (const note of score.parts[instrument.id].notes) {
          assert.ok(note.step >= 0 && note.step < TOTAL_STEPS);
          assert.ok(
            note.duration > 0 && note.step + note.duration <= TOTAL_STEPS,
          );
          assert.ok(note.velocity > 0 && note.velocity <= 1);
          assert.ok(note.midi >= 0 && note.midi <= 127);
          assert.ok(
            (scene.scale as readonly number[]).includes(
              (((note.midi - scene.root) % 12) + 12) % 12,
            ),
          );
        }
      }
    }
});

test("phrase weaving keeps performed rhythm, repeats at two bars, and caps layers", () => {
  const score = compose("horizon", 7),
    midi = padNotes(score, "strings");
  const stepMs = 60000 / score.bpm / 4;
  const capture = [
    { midi: midi[0], time: 1000 },
    { midi: midi[2], time: 1000 + stepMs * 3 },
    { midi: midi[4], time: 1000 + stepMs * 7 },
  ];
  let woven = weave(score, "strings", capture);
  assert.deepEqual(
    woven.parts.strings.notes.slice(0, 3).map((n) => n.step),
    [0, 3, 7],
  );
  assert.deepEqual(
    woven.parts.strings.notes.slice(3, 6).map((n) => n.step),
    [32, 35, 39],
  );
  assert.equal(woven.parts.strings.layers, 1);
  for (let i = 0; i < 10; i++) woven = weave(woven, "strings", capture);
  assert.equal(woven.parts.strings.layers, MAX_LAYERS);
  assert.equal(
    woven.parts.strings.notes.length,
    capture.length * 4 * MAX_LAYERS,
  );
});

test("evolution and intensity preserve user layers and mix state", () => {
  let score = compose("momentum", 42);
  score.parts.cello.volume = 0.22;
  score = weave(score, "strings", [
    { midi: 74, time: 0 },
    { midi: 77, time: 300 },
  ]);
  const userPart = structuredClone(score.parts.strings);
  const original = structuredClone(score);
  for (let i = 0; i < 30; i++) score = evolve(score);
  assert.deepEqual(score.parts.strings, userPart);
  assert.equal(score.parts.cello.volume, 0.22);
  assert.notDeepEqual(score.parts, original.parts);
  assert.deepEqual(reorchestrate(score, 1).parts.strings, userPart);
  assert.deepEqual(original.parts.strings, userPart);
});

test("undo removes the newest layer and restores the generated part at zero", () => {
  const original = compose("nocturne", 9);
  const capture = [
    { midi: 81, time: 0 },
    { midi: 84, time: 250 },
  ];
  const one = weave(original, "woodwinds", capture),
    two = weave(one, "woodwinds", capture);
  assert.deepEqual(
    undoLayer(two, "woodwinds").parts.woodwinds.notes,
    one.parts.woodwinds.notes,
  );
  assert.deepEqual(
    undoLayer(one, "woodwinds").parts.woodwinds.notes,
    original.parts.woodwinds.notes,
  );
  assert.equal(undoLayer(one, "woodwinds").parts.woodwinds.layers, 0);
});

test("a new score does not share arrays or mutate another score", () => {
  const a = compose("horizon", 1),
    before = structuredClone(a),
    b = compose("horizon", 1);
  b.parts.harp.notes[0].midi = 0;
  assert.deepEqual(a, before);
});

test("every section can vary across seeds", () => {
  for (const instrument of INSTRUMENTS) {
    const variants = new Set(
      Array.from({ length: 8 }, (_, seed) =>
        JSON.stringify(compose("momentum", seed).parts[instrument.id].notes),
      ),
    );
    assert.ok(
      variants.size > 1,
      `${instrument.id} should have more than one orchestration`,
    );
  }
});

test("crescendo always spans to the next bar plus a complete bar", () => {
  for (let step = 0; step < TOTAL_STEPS; step++) {
    const duration = crescendoLength(step);
    assert.ok(duration >= 17 && duration <= 32);
    assert.equal((step + duration) % 16, 0);
  }
});
