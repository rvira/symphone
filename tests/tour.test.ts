import { test } from "node:test";
import assert from "node:assert/strict";
import {
  TOUR_STEPS,
  TOUR_STORAGE_KEY,
  shouldOfferTour,
  rememberTour,
  placeTourCard,
} from "../lib/tour";

function storage() {
  const data = new Map<string, string>();
  return {
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => {
      data.set(key, value);
    },
  };
}

test("only new players are offered the tour automatically", () => {
  const fresh = storage();
  assert.equal(shouldOfferTour(fresh), true);
  for (const status of ["offered", "skipped", "completed"] as const) {
    rememberTour(status, fresh);
    assert.equal(fresh.getItem(TOUR_STORAGE_KEY), status);
    assert.equal(shouldOfferTour(fresh), false);
  }
  for (const key of ["symphone.score.v1", "symphone.legacy.score.v1"]) {
    const returning = storage();
    returning.setItem(key, "{}");
    assert.equal(shouldOfferTour(returning), false);
  }
});

test("tour persistence does not change scores and tolerates unavailable storage", () => {
  const local = storage();
  local.setItem("symphone.score.v1", "my score");
  rememberTour("completed", local);
  assert.equal(local.getItem("symphone.score.v1"), "my score");
  const blocked = {
    getItem: () => {
      throw new Error("Storage disabled");
    },
    setItem: () => {
      throw new Error("Storage disabled");
    },
  };
  assert.equal(shouldOfferTour(blocked), true);
  assert.doesNotThrow(() => rememberTour("skipped", blocked));
});

test("the walkthrough covers every main section with a concrete suggestion", () => {
  assert.equal(new Set(TOUR_STEPS.map((s) => s.id)).size, TOUR_STEPS.length);
  assert.deepEqual(
    TOUR_STEPS.map((s) => s.id),
    [
      "welcome",
      "entrance",
      "scenes",
      "stage",
      "playback",
      "score",
      "instrument",
      "pads",
      "phrase",
      "mix",
      "movement",
      "save",
    ],
  );
  for (const step of TOUR_STEPS) {
    assert.ok(step.body.length > 50);
    assert.ok(step.tip.length > 50);
    assert.ok(step.id === "welcome" || step.target);
  }
});

test("tour cards stay within desktop and mobile viewports", () => {
  for (const width of [360, 375, 768, 1440]) {
    for (const height of [560, 900]) {
      for (const target of [
        null,
        { top: 10, left: -20, width: 100, height: 30 },
        { top: 450, left: width - 40, width: 40, height: 400 },
      ]) {
        const card = placeTourCard(target, { width, height }, 400);
        assert.ok(card.left >= 16 && card.top >= 16);
        assert.ok(card.left + card.width <= width - 16);
        assert.ok(card.top + 400 <= height - 16);
      }
    }
  }
});

test("positioning prefers free space around the highlighted section", () => {
  assert.equal(
    placeTourCard(
      { top: 100, left: 50, width: 200, height: 80 },
      { width: 1200, height: 900 },
      300,
    ).top,
    196,
  );
  assert.equal(
    placeTourCard(
      { top: 700, left: 50, width: 200, height: 80 },
      { width: 1200, height: 900 },
      300,
    ).top,
    384,
  );
});
