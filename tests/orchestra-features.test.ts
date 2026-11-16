import { test } from "node:test";
import assert from "node:assert/strict";
import { crescendoLength, OrchestraEngine } from "../lib/audio";
import {
  compose,
  weave,
  undoLayer,
  INSTRUMENTS,
  padNotes,
  secondsPerStep,
  emptyScore,
  buildFoundation,
  activeInstruments,
  playableScore,
  evolve,
  evolveAtBoundary,
  reorchestrate,
  SCENES,
  stepsPerBar,
  totalSteps,
  generatePart,
  sceneForScore,
  EVOLUTION_ORDER,
  type InstrumentId,
  type CapturedNote,
} from "../lib/score";

test("build mode starts genuinely empty, not muted or pregenerated", () => {
  for (const scene of SCENES) {
    const score = emptyScore(scene.id, 42);
    assert.equal(score.construction?.built, false);
    assert.deepEqual(activeInstruments(score), []);
    assert.equal(playableScore(score), false);
    assert.deepEqual(reorchestrate(score, 1).parts, score.parts);
    assert.equal(evolve(score), score);
    assert.equal(weave(score, "strings", [{ midi: 72, time: 0 }]), score);
    for (const inst of INSTRUMENTS) {
      assert.deepEqual(score.parts[inst.id].notes, []);
      assert.equal(score.parts[inst.id].muted, false);
    }
  }
});

test("Build creates only the chosen starting parts with the chosen harmony", () => {
  const progression = [0, 3, 5, 4, 0, 3, 4, 0];
  const draft = emptyScore("ballet", 13);
  const starting: InstrumentId[] = ["harp", "strings"];
  const score = buildFoundation(draft, starting, progression);
  assert.equal(score.construction?.built, true);
  assert.equal(playableScore(score), true);
  assert.deepEqual(activeInstruments(score).sort(), [...starting].sort());
  assert.deepEqual(score.progression, progression);
  assert.deepEqual(
    score.parts.strings.notes,
    generatePart("strings", sceneForScore(score), 13, score.energy),
  );
  assert.deepEqual(activeInstruments(draft), []);
  assert.throws(() => buildFoundation(draft, [], progression));
  assert.throws(() => buildFoundation(draft, starting, [0, 1]));
  assert.throws(() =>
    buildFoundation(draft, starting, [0, 1, 2, 3, 4, 5, 6, 7]),
  );
});

test("Auto-evolve adds exactly one section at two-bar boundaries in every meter", () => {
  assert.equal(new Set(EVOLUTION_ORDER).size, INSTRUMENTS.length);
  for (const scene of SCENES) {
    let score = buildFoundation(
      emptyScore(scene.id, 3),
      ["strings"],
      [0, 4, 5, 3, 0, 4, 3, 0],
    );
    const phraseLength = stepsPerBar(score) * 2;
    for (let count = 1; count < 8; count++) {
      const before = structuredClone(score);
      const step = count * phraseLength;
      assert.equal(evolveAtBoundary(score, step - 1, true), score);
      assert.equal(evolveAtBoundary(score, step, false), score);
      score = evolveAtBoundary(score, step, true);
      assert.equal(activeInstruments(score).length, count + 1);
      for (const id of activeInstruments(before))
        assert.deepEqual(score.parts[id], before.parts[id]);
      const entering = activeInstruments(score).find(
        (id) => !before.parts[id].notes.length,
      )!;
      assert.deepEqual(
        score.parts[entering].notes,
        generatePart(
          entering,
          sceneForScore(score),
          score.seed + score.generation * 8191,
          score.energy,
        ),
      );
      for (const note of score.parts[entering].notes)
        assert.ok(note.step + note.duration <= totalSteps(score));
    }
    assert.deepEqual(
      activeInstruments(score).sort(),
      INSTRUMENTS.map((i) => i.id).sort(),
    );
  }
});

test("growth waits for Auto-evolve; intensity preserves empty parts and user layers", () => {
  let score = buildFoundation(
    emptyScore("jig", 12),
    ["cello", "harp"],
    [0, 0, 3, 3, 4, 4, 0, 0],
  );
  score = weave(score, "harp", [
    { midi: 62, time: 0 },
    { midi: 65, time: 200 },
  ]);
  const original = structuredClone(score);
  for (let step = 0; step < 1000; step++)
    score = evolveAtBoundary(score, step, false);
  assert.deepEqual(score, original);
  assert.deepEqual(
    activeInstruments(reorchestrate(score, 1)),
    activeInstruments(original),
  );
  for (let i = 0; i < 20; i++) score = evolve(score);
  assert.deepEqual(score.parts.harp, original.parts.harp);
  assert.deepEqual(score.progression, original.progression);
  assert.equal(activeInstruments(score).length, 8);
});

test("full orchestra remains an immediate eight-section alternative", () => {
  const score = compose("horizon", 2);
  assert.equal(score.construction, undefined);
  assert.equal(playableScore(score), true);
  assert.equal(activeInstruments(score).length, 8);
  assert.equal(activeInstruments(evolve(score)).length, 8);
});

test("the audio engine refuses to start an empty draft before initializing audio", async () => {
  const engine = new OrchestraEngine();
  engine.setScore(emptyScore("horizon", 1));
  await engine.start();
  assert.equal(engine.playing, false);
  assert.equal(engine.ctx, null);
});

test("stopping playback keeps the assembled parts and chosen progression", () => {
  const engine = new OrchestraEngine();
  const built = buildFoundation(
    emptyScore("ballet", 7),
    ["strings"],
    [3, 0, 4, 0, 5, 3, 4, 0],
  );
  const grown = evolve(built);
  engine.setScore(grown);
  engine.stop();
  assert.deepEqual(engine.score, grown);
  const woven = weave(grown, "strings", [{ midi: 72, time: 0 }]);
  assert.deepEqual(
    undoLayer(woven, "strings").parts.strings.notes,
    grown.parts.strings.notes,
  );
  assert.deepEqual(reorchestrate(grown, 1).progression, grown.progression);
});

test("phrase layers can be captured and woven into eventual score cycles", () => {
  const score = compose("horizon", 42);
  const stringsNotes = padNotes(score, "strings");

  // Simulate captured phrase notes
  const captured: CapturedNote[] = [
    { midi: stringsNotes[0], time: 0 },
    { midi: stringsNotes[2], time: 400 },
    { midi: stringsNotes[4], time: 800 },
  ];

  // Weave layer into strings
  const updatedScore = weave(score, "strings", captured);

  assert.equal(updatedScore.parts.strings.layers, 1);
  assert.ok(updatedScore.parts.strings.notes.some((n) => n.layer === 1));

  // The engine composes a full movement from the offered pitches, not tap count.
  const layerNotes = updatedScore.parts.strings.notes.filter(
    (n) => n.layer === 1,
  );
  assert.ok(layerNotes.length > captured.length);
  assert.ok(
    layerNotes.every((n) => captured.some((input) => input.midi === n.midi)),
  );
  assert.deepEqual(
    weave(
      score,
      "strings",
      captured.map((n) => ({ ...n, time: 0 })),
    ),
    updatedScore,
  );

  // Second layer stacking
  const captured2: CapturedNote[] = [
    { midi: stringsNotes[5], time: 0 },
    { midi: stringsNotes[3], time: 500 },
  ];
  const twoLayerScore = weave(updatedScore, "strings", captured2);
  assert.equal(twoLayerScore.parts.strings.layers, 2);

  // Undoing removes the newest layer
  const revertedScore = undoLayer(twoLayerScore, "strings");
  assert.equal(revertedScore.parts.strings.layers, 1);
  assert.deepEqual(
    revertedScore.parts.strings.notes,
    updatedScore.parts.strings.notes,
  );
});

test("crescendo timing is bounded and synchronizes with bar cycles", () => {
  for (let bar = 0; bar < 8; bar++) {
    const step = bar * 16;
    const len = crescendoLength(step, 16);
    // Queue to the next downbeat, then a full four-bar swell.
    assert.equal(len, 80);
  }
});
