import { test } from "node:test";
import assert from "node:assert/strict";
import { crescendoFrame, planCrescendo } from "../lib/crescendo";
import { OrchestraEngine } from "../lib/audio";
import {
  SCENES,
  INSTRUMENTS,
  compose,
  emptyScore,
  buildFoundation,
  reEvolveInstrument,
  weave,
  padNotes,
  stepsPerBar,
  secondsPerStep,
  totalSteps,
  type InstrumentId,
} from "../lib/score";

test("per-instrument re-evolve leaves other sections, chords, seed and mixes untouched", () => {
  for (const scene of SCENES)
    for (const { id } of INSTRUMENTS) {
      const score = compose(scene.id, 42);
      score.parts[id].volume = 0.3;
      score.parts[id].muted = true;
      const before = structuredClone(score);
      const next = reEvolveInstrument(score, id);
      assert.equal(next.seed, score.seed);
      assert.equal(next.generation, score.generation + 1);
      assert.deepEqual(next.progression, score.progression);
      assert.equal(next.parts[id].volume, 0.3);
      assert.equal(next.parts[id].muted, true);
      for (const inst of INSTRUMENTS)
        if (inst.id !== id)
          assert.equal(next.parts[inst.id], score.parts[inst.id]);
      assert.deepEqual(score, before);
      for (const n of next.parts[id].notes)
        assert.ok(n.step + n.duration <= totalSteps(next));
      const woven = weave(
        score,
        id,
        padNotes(score, id).map((midi) => ({ midi, time: 0 })),
      );
      const varied = reEvolveInstrument(woven, id);
      assert.equal(varied.parts[id].layers, woven.parts[id].layers);
      assert.notDeepEqual(varied.parts[id].notes, woven.parts[id].notes);
      const palette = new Set(woven.parts[id].notes.map((n) => n.midi));
      assert.ok(varied.parts[id].notes.every((n) => palette.has(n.midi)));
    }
  const draft = emptyScore();
  assert.equal(reEvolveInstrument(draft, "harp"), draft);
  const built = buildFoundation(draft, ["strings"], [0, 4, 5, 3, 0, 4, 3, 0]);
  assert.equal(reEvolveInstrument(built, "harp"), built);
});

test("four-bar crescendos align, breathe and resolve in every meter without mutating the score", () => {
  for (const scene of SCENES) {
    const score = compose(scene.id, 42);
    const before = structuredClone(score);
    for (let request = 0; request < stepsPerBar(score); request++) {
      const plan = planCrescendo(score, request);
      assert.equal(plan.start % scene.stepsPerBar, 0);
      assert.equal(plan.end - plan.start, scene.stepsPerBar * 4);
      assert.equal(crescendoFrame(score, plan, request).phase, "Preparing");
      const phases = new Set<string>();
      for (let st = plan.start; st <= plan.end; st++) {
        const frame = crescendoFrame(score, plan, st);
        phases.add(frame.phase);
        assert.ok(frame.progress >= 0 && frame.progress <= 1);
        for (const note of frame.notes) {
          assert.ok(
            note.duration > 0 && note.velocity > 0 && note.velocity <= 0.8,
          );
          assert.ok(
            scene.scale.includes((((note.midi - scene.root) % 12) + 12) % 12),
          );
          if (st < plan.end)
            assert.ok(st + note.offset + note.duration <= plan.breath);
        }
        if (frame.phase === "Breath") {
          assert.equal(frame.gain, 0);
          assert.deepEqual(frame.notes, []);
        }
      }
      assert.deepEqual(
        [...phases],
        ["Gathering", "Lifting", "Surging", "Breath", "Resolve"],
      );
    }
    assert.deepEqual(score, before);
  }
});

test("crescendo accents respect empty parts, mute and solo, including resolution", () => {
  let score = buildFoundation(
    emptyScore("jig", 42),
    ["strings"],
    [0, 4, 5, 3, 0, 4, 3, 0],
  );
  const plan = planCrescendo(score, 0);
  for (let step = plan.start; step <= plan.end; step++) {
    assert.ok(
      crescendoFrame(score, plan, step).notes.every((n) => n.id === "strings"),
    );
    assert.deepEqual(crescendoFrame(score, plan, step, "harp").notes, []);
  }
  score = {
    ...score,
    parts: { ...score.parts, strings: { ...score.parts.strings, muted: true } },
  };
  for (let step = plan.start; step <= plan.end; step++)
    assert.deepEqual(crescendoFrame(score, plan, step).notes, []);
});

test("actual scheduler resolves without rewinding or replacing notes, and preserves cycle weaving", () => {
  for (const scene of SCENES) {
    const score = compose(scene.id, 42);
    const engine = new OrchestraEngine();
    engine.setScore(score);
    const start = scene.stepsPerBar * 4 + 1;
    const plan = planCrescendo(score, start);
    const seconds = secondsPerStep(score);
    const calls: Array<{
      id: InstrumentId;
      duration: number;
      velocity: number;
    }> = [];
    const clock = { currentTime: 0 };
    const internals = engine as unknown as {
      tick(): void;
      absoluteStep: number;
      build: unknown;
    };
    Object.assign(engine, {
      context: clock,
      absoluteStep: start,
      nextTime: 0,
      voice: (
        id: InstrumentId,
        _midi: number,
        _time: number,
        duration: number,
        velocity: number,
      ) => {
        calls.push({ id, duration, velocity });
        return () => {};
      },
    });
    engine.playing = true;
    assert.equal(engine.crescendo(), true);
    assert.equal(engine.crescendo(), false);
    engine.queueWeave("strings", [
      { midi: padNotes(score, "strings")[0], time: 0 },
    ]);
    for (let i = 0; i <= plan.end - start + 2; i++) {
      clock.currentTime = i * seconds;
      internals.tick();
    }
    assert.equal(internals.build, null);
    assert.ok(internals.absoluteStep > plan.end);
    assert.equal(engine.playing, true);
    assert.ok(engine.drain().some((event) => event.drop));
    assert.equal(engine.hasQueuedWeave(), false);
    assert.equal(engine.score!.parts.strings.layers, 1);
    for (const inst of INSTRUMENTS)
      if (inst.id !== "strings")
        assert.equal(engine.score!.parts[inst.id], score.parts[inst.id]);
    assert.ok(
      calls.every((n) => n.duration > 0 && Number.isFinite(n.velocity)),
    );
  }
});
