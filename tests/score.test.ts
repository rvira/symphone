import { test } from "node:test";
import assert from "node:assert/strict";
import {
  INSTRUMENTS,
  MAX_LAYERS,
  SCENES,
  BARS,
  stepsPerBar,
  totalSteps,
  secondsPerStep,
  compose,
  evolve,
  padNotes,
  reorchestrate,
  undoLayer,
  weave,
  melodize,
  chordNotes,
  sceneForScore,
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
          assert.ok(Number.isInteger(note.step));
          assert.ok(note.step >= 0 && note.step < totalSteps(score));
          assert.ok(
            note.duration > 0 && note.step + note.duration <= totalSteps(score),
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

test("weaving composes from the selected notes, ignores performed placement, and caps layers", () => {
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
    woven,
    weave(
      score,
      "strings",
      [...capture].reverse().map((n, i) => ({ ...n, time: i * 90000 })),
    ),
  );
  assert.notDeepEqual(
    woven.parts.strings.notes.slice(0, 3).map((n) => n.step),
    [0, 3, 7],
  );
  assert.ok(
    woven.parts.strings.notes.every((n) =>
      capture.some((input) => input.midi === n.midi),
    ),
  );
  assert.equal(woven.parts.strings.layers, 1);
  for (let i = 0; i < 10; i++) woven = weave(woven, "strings", capture);
  assert.equal(woven.parts.strings.layers, MAX_LAYERS);
  for (let layer = 1; layer <= MAX_LAYERS; layer++)
    assert.ok(woven.parts.strings.notes.some((n) => n.layer === layer));
});

test("melodizing follows each instrument and scene, anchors to offered chord tones and tolerates sparse input", () => {
  for (const scene of SCENES) {
    const score = compose(scene.id, 71);
    for (const inst of INSTRUMENTS) {
      const palette = padNotes(score, inst.id);
      const input = palette.map((midi, i) => ({ midi, time: i * 25000 }));
      const before = structuredClone(score);
      const melody = melodize(score, inst.id, input);
      assert.ok(melody.length > 0);
      assert.deepEqual(
        melody,
        melodize(
          score,
          inst.id,
          input.map((n) => ({ ...n, time: 0 })),
        ),
      );
      for (const note of melody) {
        assert.ok(palette.includes(note.midi));
        assert.ok(Number.isInteger(note.step) && note.step >= 0);
        assert.ok(
          note.duration > 0 && note.step + note.duration <= totalSteps(score),
        );
        assert.ok(note.velocity > 0 && note.velocity <= 1);
        if (note.step % scene.beatSteps === 0) {
          const bar = Math.floor(note.step / scene.stepsPerBar);
          const chord = chordNotes(
            sceneForScore(score),
            score.progression![bar],
          );
          assert.ok(chord.some((n) => n % 12 === note.midi % 12));
        }
      }
      assert.deepEqual(score, before);
      const single = melodize(score, inst.id, [input[0]]);
      assert.ok(
        single.length > 0 && single.every((n) => n.midi === input[0].midi),
      );
    }
    assert.deepEqual(melodize(score, "strings", []), []);
    assert.deepEqual(
      melodize(score, "strings", [
        { midi: NaN, time: 0 },
        { midi: 128, time: 0 },
      ]),
      [],
    );
  }
  const input = [72, 76, 79].map((midi) => ({ midi, time: 0 }));
  const rhythm = (scene: "horizon" | "ballet" | "jig") =>
    melodize(compose(scene, 71), "strings", input).map((n) => [
      n.step,
      n.velocity,
    ]);
  assert.notDeepEqual(rhythm("horizon"), rhythm("ballet"));
  assert.notDeepEqual(rhythm("ballet"), rhythm("jig"));
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
  for (const scene of SCENES) {
    const score = compose(scene.id, 1),
      bar = stepsPerBar(score);
    for (let step = 0; step < totalSteps(score); step++) {
      const duration = crescendoLength(step, bar);
      assert.ok(duration >= bar + 1 && duration <= bar * 2);
      assert.equal((step + duration) % bar, 0);
    }
  }
});

test("the scene library has unique styles and valid musical metadata", () => {
  assert.equal(SCENES.length, 12);
  assert.equal(new Set(SCENES.map((s) => s.id)).size, SCENES.length);
  for (const scene of SCENES) {
    assert.equal(scene.progression.length, BARS);
    assert.equal(scene.scale.length, 7);
    assert.ok(scene.bpm >= 50 && scene.bpm <= 160);
    assert.ok(scene.description.length > 40);
    assert.equal(scene.stepsPerBar, scene.meter === "4/4" ? 16 : 12);
    for (const level of Object.values(scene.mix ?? {}))
      assert.ok(level >= 0 && level <= 1);
  }
});

test("waltzes and jigs use the same subdivisions but different beat groupings", () => {
  const ballet = compose("ballet", 1),
    jig = compose("jig", 1);
  ballet.bpm = jig.bpm = 90;
  assert.equal(totalSteps(ballet), 96);
  assert.equal(totalSteps(jig), 96);
  assert.equal(stepsPerBar(ballet) * secondsPerStep(ballet), (3 * 60) / 90);
  assert.equal(stepsPerBar(jig) * secondsPerStep(jig), (2 * 60) / 90);
  assert.equal(totalSteps(compose("horizon", 1)), 128);
});

test("every meter composes an eight-bar melody without overflowing", () => {
  for (const scene of SCENES) {
    const score = compose(scene.id, 6),
      phrase = stepsPerBar(score) * 2;
    const ms = secondsPerStep(score) * 1000;
    const woven = weave(score, "strings", [
      { midi: 72, time: 1000 },
      { midi: 76, time: 1000 + ms * 5 },
      { midi: 79, time: 1000 + ms * (phrase - 1) },
      { midi: 81, time: 1000 + ms * phrase }, // Timing no longer excludes notes.
    ]);
    assert.ok(woven.parts.strings.notes.length > 4);
    for (const note of woven.parts.strings.notes)
      assert.ok(note.step + note.duration <= totalSteps(score));
    assert.deepEqual(
      undoLayer(woven, "strings").parts.strings.notes,
      score.parts.strings.notes,
    );
    assert.deepEqual(evolve(woven).parts.strings, woven.parts.strings);
    assert.deepEqual(
      reorchestrate(woven, 1).parts.strings,
      woven.parts.strings,
    );
  }
});

test("new scenes change orchestration, rhythm and mix rather than only the key", () => {
  const profiles = new Set(
    SCENES.map((scene) => {
      const score = compose(scene.id, 314);
      return JSON.stringify(
        INSTRUMENTS.map((inst) => ({
          volume: score.parts[inst.id].volume,
          rhythm: score.parts[inst.id].notes
            .filter((n) => n.step < scene.stepsPerBar)
            .map((n) => [n.step, n.duration]),
        })),
      );
    }),
  );
  assert.equal(profiles.size, SCENES.length);
  const ballet = compose("ballet", 314);
  assert.deepEqual(
    [
      ...new Set(
        ballet.parts.harp.notes.filter((n) => n.step < 12).map((n) => n.step),
      ),
    ],
    [4, 8],
  );
  const jig = compose("jig", 314);
  assert.deepEqual(
    jig.parts.strings.notes.filter((n) => n.step < 12).map((n) => n.step),
    [0, 2, 4, 6, 8, 10],
  );
  assert.ok(
    jig.parts.pulse.volume < compose("momentum", 314).parts.pulse.volume,
  );
});
