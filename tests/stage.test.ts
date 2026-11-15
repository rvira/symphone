import { test } from "node:test";
import assert from "node:assert/strict";
import { compose, INSTRUMENTS } from "../lib/score";
import { playerPositions, sectionActivity, STAGE_SECTIONS } from "../lib/stage";

test("the physical stage covers every section once, with seats inside the floor", () => {
  assert.deepEqual(
    new Set(STAGE_SECTIONS.map((s) => s.id)),
    new Set(INSTRUMENTS.map((i) => i.id)),
  );
  for (const section of STAGE_SECTIONS)
    for (const p of playerPositions(section)) {
      assert.ok((p.x / 6.25) ** 2 + (p.z / 4.06) ** 2 < 1);
    }
});

test("stage activity follows score notes, playback, live pads, mute and solo", () => {
  const score = compose("horizon", 1);
  assert.equal(
    sectionActivity(score, "strings", 0, null, "strings", false, true),
    1,
  );
  assert.equal(
    sectionActivity(score, "strings", 0, null, "strings", false, false),
    0,
  );
  assert.equal(
    sectionActivity(score, "strings", -1, null, "strings", true, false),
    1,
  );
  assert.equal(
    sectionActivity(score, "strings", 0, "cello", "strings", true, true),
    0,
  );
  score.parts.strings.muted = true;
  assert.equal(
    sectionActivity(score, "strings", 0, null, "strings", true, true),
    0,
  );
});
