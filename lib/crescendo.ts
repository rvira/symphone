import {
  chordNotes,
  instrumentFor,
  sceneForScore,
  stepsPerBar,
  totalSteps,
  type InstrumentId,
  type Score,
} from "./score";

export type CrescendoPlan = { start: number; end: number; breath: number };
export type CrescendoPhase =
  "Preparing" | "Gathering" | "Lifting" | "Surging" | "Breath" | "Resolve";
type Accent = {
  id: InstrumentId;
  midi: number;
  offset: number;
  duration: number;
  velocity: number;
};

// Queue to a downbeat, then make a four-bar phrase in the scene's own meter.
export const crescendoLength = (step: number, barLength = 16) =>
  barLength - (step % barLength) + barLength * 4;
export function planCrescendo(score: Score, step: number): CrescendoPlan {
  const bar = stepsPerBar(score);
  const end = step + crescendoLength(step, bar);
  return {
    start: end - bar * 4,
    end,
    breath: end - sceneForScore(score).beatSteps / 2,
  };
}

export function crescendoFrame(
  score: Score,
  plan: CrescendoPlan,
  step: number,
  solo: InstrumentId | null = null,
) {
  const scene = sceneForScore(score);
  const barLength = stepsPerBar(score);
  const progress = Math.max(
    0,
    Math.min(1, (step - plan.start) / (plan.end - plan.start)),
  );
  const resolving = step >= plan.end;
  const breathing = step >= plan.breath && !resolving;
  const phase: CrescendoPhase = resolving
    ? "Resolve"
    : step < plan.start
      ? "Preparing"
      : breathing
        ? "Breath"
        : progress < 0.25
          ? "Gathering"
          : progress < 0.65
            ? "Lifting"
            : "Surging";
  const notes: Accent[] = [];
  const allowed = (id: InstrumentId) =>
    score.parts[id].notes.length > 0 &&
    !score.parts[id].muted &&
    (!solo || solo === id);
  const bar = Math.floor((step % totalSteps(score)) / barLength);
  const degree = scene.progression[bar];
  const restrained = scene.family !== "Cinematic" || scene.id === "nocturne";
  const strength = restrained ? 0.7 : 1;
  const add = (
    id: InstrumentId,
    midi: number,
    duration: number,
    velocity: number,
    offset = 0,
  ) => {
    if (allowed(id))
      notes.push({
        id,
        midi,
        offset,
        duration: resolving
          ? duration
          : Math.min(duration, plan.breath - step - offset),
        velocity: Math.min(0.8, velocity * strength),
      });
  };
  if (resolving) {
    // Resolve to the chord actually under the playhead, not a fixed MIDI hit.
    for (const id of [
      "cello",
      "brass",
      "strings",
      "harp",
      "percussion",
    ] as const) {
      const chord = chordNotes(scene, degree, instrumentFor(id).register);
      for (const midi of id === "brass" ? chord : [chord[0]])
        add(id, midi, scene.beatSteps * 0.9, 0.55);
    }
  } else if (step >= plan.start && !breathing) {
    const elapsed = step - plan.start;
    const interval =
      progress < 0.5 ? scene.beatSteps : Math.max(1, scene.beatSteps / 2);
    if (elapsed % interval === 0) {
      const chord = chordNotes(
        scene,
        degree,
        instrumentFor("strings").register,
      );
      add(
        "strings",
        chord[Math.floor(elapsed / interval) % 3],
        interval * 0.65,
        0.15 + progress * 0.3,
      );
      if (progress >= 0.25) {
        const harp = chordNotes(scene, degree, instrumentFor("harp").register);
        add(
          "harp",
          harp[Math.floor(elapsed / interval) % 3],
          interval * 0.7,
          0.2 + progress * 0.25,
        );
      }
    }
    // A restrained roll grows only in the last two bars; no forced drum part
    // appears if the user has not added percussion to their ensemble.
    const roll = progress < 0.75 ? 2 : 1;
    if (progress >= 0.5 && elapsed % roll === 0) {
      const midi = chordNotes(
        scene,
        degree,
        instrumentFor("percussion").register,
      )[0];
      add("percussion", midi, 0.7, 0.16 + progress * 0.35);
      if (progress > 0.9 && !restrained)
        add("percussion", midi, 0.35, 0.3, 0.5);
    }
  }
  return {
    phase,
    progress,
    notes,
    gain: breathing
      ? 0
      : step < plan.start || resolving
        ? 1
        : 0.62 + 0.38 * (progress * progress * (3 - 2 * progress)),
  };
}
