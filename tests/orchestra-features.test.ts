import { test } from "node:test";
import assert from "node:assert/strict";
import {
  BUILDUP_STAGES,
  BUILDUP_STAGE_NAMES,
  crescendoLength,
} from "../lib/audio";
import {
  compose,
  weave,
  undoLayer,
  INSTRUMENTS,
  padNotes,
  secondsPerStep,
  type CapturedNote,
} from "../lib/score";

test("buildup stages accurately map orchestral progression from foundation to full ensemble", () => {
  assert.equal(BUILDUP_STAGES.length, 4);
  assert.equal(BUILDUP_STAGE_NAMES.length, 4);

  // Stage 0: Foundation (Cellos and Atmosphere)
  assert.deepEqual(BUILDUP_STAGES[0], ["cello", "texture"]);
  assert.equal(BUILDUP_STAGE_NAMES[0].name, "Foundation");

  // Stage 1: Motion & Pluck (+ Harp and Pulse)
  assert.ok(BUILDUP_STAGES[1].includes("harp"));
  assert.ok(BUILDUP_STAGES[1].includes("pulse"));

  // Stage 2: Melodic Rise (+ Violins and Flute)
  assert.ok(BUILDUP_STAGES[2].includes("strings"));
  assert.ok(BUILDUP_STAGES[2].includes("woodwinds"));

  // Stage 3: Full Ensemble (+ French Horns and Timpani)
  assert.ok(BUILDUP_STAGES[3].includes("brass"));
  assert.ok(BUILDUP_STAGES[3].includes("percussion"));
  assert.equal(BUILDUP_STAGES[3].length, 8);
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

  // The woven layer repeats across the movement (4 repeats of 2-bar phrase = 8 bars)
  const layerNotes = updatedScore.parts.strings.notes.filter(
    (n) => n.layer === 1,
  );
  assert.equal(layerNotes.length, captured.length * 4);

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
    // When called on downbeat, spans to next bar + full bar = 32 steps (2 bars)
    assert.equal(len, 32);
  }
});
