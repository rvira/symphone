import { test } from "node:test";
import assert from "node:assert/strict";
import { OrchestraEngine } from "../lib/audio";
import {
  SCENES,
  INSTRUMENTS,
  activeInstruments,
  buildFoundation,
  changeScene,
  compose,
  emptyScore,
  evolve,
  padNotes,
  playableScore,
  resetNotes,
  sceneForScore,
  totalSteps,
  weave,
} from "../lib/score";

test("every scene transition reuses the ensemble, chords and woven pitches across meters", () => {
  for (const source of SCENES) {
    let score = buildFoundation(
      emptyScore(source.id, 42),
      ["strings", "harp"],
      [0, 3, 5, 4, 0, 3, 4, 0],
    );
    score = evolve(score);
    score = weave(
      score,
      "strings",
      padNotes(score, "strings")
        .slice(0, 3)
        .map((midi, i) => ({ midi, time: i * 0.3 })),
    );
    score.parts.harp.muted = true;
    score.parts.harp.volume = 0.23;
    const before = structuredClone(score);
    for (const target of SCENES) {
      const next = changeScene(score, target.id);
      assert.equal(next.scene, target.id);
      assert.deepEqual(next.progression, score.progression);
      assert.deepEqual(next.construction, score.construction);
      assert.deepEqual(activeInstruments(next), activeInstruments(score));
      assert.equal(playableScore(next), true);
      assert.equal(next.parts.harp.muted, true);
      assert.equal(next.parts.harp.volume, 0.23);
      assert.equal(next.generation, score.generation);
      assert.deepEqual(
        next.parts.strings.notes.map((n) => n.midi),
        score.parts.strings.notes.map((n) => n.midi),
      );
      for (const { id } of INSTRUMENTS) {
        assert.equal(next.parts[id].layers, score.parts[id].layers);
        for (const n of next.parts[id].notes) {
          assert.ok(Number.isInteger(n.step) && n.step >= 0);
          assert.ok(n.duration > 0 && n.step + n.duration <= totalSteps(next));
        }
      }
    }
    assert.deepEqual(score, before);
  }
});

test("scene changes retain running transport, evolution and queued phrases", () => {
  const engine = new OrchestraEngine();
  const score = compose("horizon", 42);
  engine.setScore(score);
  engine.playing = true;
  engine.autoEvolve = true;
  engine.queueWeave("harp", [{ midi: 72, time: 0 }]);
  engine.setScore(changeScene(score, "ballet"));
  assert.equal(engine.playing, true);
  assert.equal(engine.autoEvolve, true);
  // The next boundary still has a phrase to apply; changing scene never cancels it.
  assert.equal(engine.hasQueuedWeave("harp"), true);
  assert.deepEqual(engine.getQueuedWeaves(), [
    { id: "harp", captured: [{ midi: 72, time: 0 }] },
  ]);
  engine.playing = false;
});

test("empty scene switches stay empty and reset removes all layers in either mode", () => {
  const draft = changeScene(emptyScore("horizon", 42), "jig");
  assert.equal(draft.construction?.built, false);
  assert.deepEqual(activeInstruments(draft), []);
  for (const score of [
    compose("ballet", 42),
    buildFoundation(draft, ["harp"], [0, 4, 5, 3, 0, 4, 3, 0]),
  ]) {
    const next = resetNotes(weave(score, "harp", [{ midi: 72, time: 0 }]));
    assert.equal(next.scene, score.scene);
    assert.equal(next.bpm, score.bpm);
    assert.deepEqual(next.progression, sceneForScore(score).progression);
    assert.deepEqual(activeInstruments(next), []);
    assert.equal(playableScore(next), false);
    assert.equal(next.construction?.built, false);
    assert.equal(next.generation, 0);
    for (const { id } of INSTRUMENTS) assert.equal(next.parts[id].layers, 0);
  }
});
