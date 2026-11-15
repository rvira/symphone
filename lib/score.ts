export const STEPS_PER_BAR = 16;
export const BARS = 8;
export const TOTAL_STEPS = STEPS_PER_BAR * BARS;
export const MAX_LAYERS = 3;

export const INSTRUMENTS = [
  {
    id: "strings",
    name: "Violins",
    family: "Strings",
    role: "A soaring melodic voice",
    soundfont: "violin",
    color: "#b8c593",
    register: 72,
    gain: 0.38,
    pan: -0.32,
  },
  {
    id: "cello",
    name: "Cellos",
    family: "Strings",
    role: "Warmth beneath the melody",
    soundfont: "cello",
    color: "#a1b68c",
    register: 48,
    gain: 0.46,
    pan: 0.3,
  },
  {
    id: "woodwinds",
    name: "Flute",
    family: "Woodwinds",
    role: "Air, space and a little wonder",
    soundfont: "flute",
    color: "#93b8be",
    register: 72,
    gain: 0.48,
    pan: -0.16,
  },
  {
    id: "brass",
    name: "French horns",
    family: "Brass",
    role: "The weight of the ensemble",
    soundfont: "french_horn",
    color: "#d3b379",
    register: 60,
    gain: 0.44,
    pan: 0.22,
  },
  {
    id: "harp",
    name: "Harp",
    family: "Plucked",
    role: "A thread of shimmering notes",
    soundfont: "orchestral_harp",
    color: "#c0a5bc",
    register: 60,
    gain: 0.55,
    pan: -0.4,
  },
  {
    id: "percussion",
    name: "Timpani",
    family: "Percussion",
    role: "An orchestral heartbeat",
    soundfont: "timpani",
    color: "#bf917d",
    register: 36,
    gain: 0.5,
    pan: 0.08,
  },
  {
    id: "pulse",
    name: "Analog pulse",
    family: "Electronic",
    role: "Forward motion from the synths",
    soundfont: null,
    color: "#c5bd85",
    register: 48,
    gain: 0.3,
    pan: 0,
  },
  {
    id: "texture",
    name: "Atmosphere",
    family: "Electronic",
    role: "A slow-moving cloud of sound",
    soundfont: null,
    color: "#9b9cbf",
    register: 60,
    gain: 0.3,
    pan: 0,
  },
] as const;
export type InstrumentId = (typeof INSTRUMENTS)[number]["id"];
export type MusicalNote = {
  step: number;
  duration: number;
  midi: number;
  velocity: number;
  layer?: number;
};
export type Part = {
  notes: MusicalNote[];
  muted: boolean;
  volume: number;
  layers: number;
};
export type SceneId = "horizon" | "momentum" | "nocturne";
export const SCENES = [
  {
    id: "horizon",
    name: "Open horizon",
    subtitle: "Expansive · hopeful",
    bpm: 88,
    root: 2,
    mode: "D major",
    scale: [0, 2, 4, 5, 7, 9, 11],
    progression: [0, 0, 4, 4, 5, 3, 4, 0],
  },
  {
    id: "momentum",
    name: "In motion",
    subtitle: "Driving · cinematic",
    bpm: 116,
    root: 2,
    mode: "D minor",
    scale: [0, 2, 3, 5, 7, 8, 10],
    progression: [0, 0, 5, 5, 3, 3, 4, 0],
  },
  {
    id: "nocturne",
    name: "After midnight",
    subtitle: "Intimate · atmospheric",
    bpm: 72,
    root: 9,
    mode: "A dorian",
    scale: [0, 2, 3, 5, 7, 9, 10],
    progression: [0, 0, 3, 3, 6, 3, 4, 0],
  },
] as const;
export type Scene = (typeof SCENES)[number];
export type Score = {
  seed: number;
  scene: SceneId;
  bpm: number;
  energy: number;
  parts: Record<InstrumentId, Part>;
  generation: number;
};
export type CapturedNote = { midi: number; time: number };
export const sceneFor = (id: SceneId): Scene =>
  SCENES.find((s) => s.id === id)!;
export const instrumentFor = (id: InstrumentId) =>
  INSTRUMENTS.find((i) => i.id === id)!;
export const randomSeed = () => Math.floor(Math.random() * 0x7fffffff);
export function random(seed: number) {
  let state = seed >>> 0;
  return () => {
    state += 0x6d2b79f5;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const choose = <T>(r: () => number, options: readonly T[]): T =>
  options[Math.floor(r() * options.length)];
const mod = (n: number, d: number) => ((n % d) + d) % d;
export function degreeMidi(scene: Scene, degree: number, register = 60) {
  return (
    register +
    scene.root +
    scene.scale[mod(degree, 7)] +
    Math.floor(degree / 7) * 12
  );
}
export const noteName = (midi: number) =>
  ["C", "C♯", "D", "E♭", "E", "F", "F♯", "G", "A♭", "A", "B♭", "B"][
    mod(midi, 12)
  ];
export const padNotes = (score: Score, instrument: InstrumentId) =>
  Array.from({ length: 8 }, (_, d) =>
    degreeMidi(sceneFor(score.scene), d, instrumentFor(instrument).register),
  );

// An eight-bar orchestration: shared harmony, different musical jobs per section.
// Everything here is pure data; the audio engine interprets this score later.
export function generatePart(
  id: InstrumentId,
  scene: Scene,
  seed: number,
  energy: number,
): MusicalNote[] {
  const r = random(seed),
    notes: MusicalNote[] = [];
  const register = instrumentFor(id).register;
  const add = (
    bar: number,
    local: number,
    duration: number,
    degree: number,
    velocity = 0.7,
  ) => {
    const step = bar * STEPS_PER_BAR + local;
    notes.push({
      step,
      duration: Math.min(duration, TOTAL_STEPS - step),
      midi: degreeMidi(scene, degree, register),
      velocity: velocity * (0.7 + energy * 0.3),
    });
  };
  // The motif returns in alternating phrases. Chord tones anchor the downbeats.
  const motif = [0, choose(r, [1, 2]), choose(r, [2, 4]), choose(r, [1, 2, 4])];
  const moving = scene.id === "momentum",
    quiet = scene.id === "nocturne";
  const pulseRhythm = moving
    ? choose(r, [
        [0, 2, 4, 6, 8, 10, 12, 14],
        [0, 3, 6, 8, 11, 14],
      ])
    : quiet
      ? [0, 8]
      : choose(r, [
          [0, 4, 8, 12],
          [0, 6, 8, 14],
        ]);
  const textureOctave = choose(r, [0, 0, 7]);
  for (let bar = 0; bar < BARS; bar++) {
    const chord = scene.progression[bar];
    const phraseEnd = bar === 3 || bar === 7;
    const lift = bar >= 4 ? 0.08 : 0;
    switch (id) {
      case "strings": {
        const rhythm = moving
          ? [0, 3, 6, 10]
          : quiet
            ? [0, 6, 12]
            : [0, 4, 10, 12];
        rhythm.forEach((st, i) => {
          if (phraseEnd && i > 1) return;
          const degree =
            i === 0
              ? chord
              : chord + motif[i % motif.length] + (bar % 2 && i === 2 ? 1 : 0);
          add(
            bar,
            st,
            phraseEnd && i === 1 ? 8 : Math.min(5, (rhythm[i + 1] ?? 16) - st),
            degree,
            0.64 + lift + (i === 0 ? 0.12 : 0),
          );
        });
        break;
      }
      case "cello":
        add(bar, 0, moving ? 3 : 7, chord - 7, 0.82);
        add(bar, 8, moving ? 3 : 7, chord + choose(r, [-3, -5]), 0.68);
        if (moving || energy > 0.68) {
          add(bar, 4, 3, chord - 7, 0.58);
          add(bar, 12, 3, chord - 5, 0.61);
        }
        break;
      case "woodwinds":
        if (bar % 2 || energy > 0.7) {
          add(bar, choose(r, [2, 4]), 4, chord + choose(r, [2, 4]), 0.56);
          add(bar, choose(r, [8, 10]), 3, chord + 2, 0.52);
          if (!phraseEnd) add(bar, 14, 2, chord + choose(r, [1, 2, 4]), 0.46);
        }
        break;
      case "brass":
        if (bar % 2 === 0 || energy > 0.65) {
          const inversion = choose(r, [0, 1]);
          for (const d of inversion ? [2, 4, 7] : [0, 2, 4])
            add(
              bar,
              moving ? 0 : 2,
              moving ? 5 : 10,
              chord + d - 7,
              0.48 + energy * 0.2,
            );
          if (moving)
            for (const d of [0, 4]) add(bar, 10, 4, chord + d - 7, 0.5);
        }
        break;
      case "harp": {
        const rhythm = quiet
          ? choose(r, [
              [0, 4, 8, 12],
              [0, 6, 10, 12],
            ])
          : choose(r, [
              [0, 2, 6, 8, 10, 14],
              [0, 3, 6, 8, 12, 14],
            ]);
        rhythm.forEach((st, i) => {
          if (r() > 0.06)
            add(
              bar,
              st,
              3,
              chord + [0, 2, 4, 7, 4, 2][i],
              0.47 + (i % 3 === 0 ? 0.14 : 0),
            );
        });
        break;
      }
      case "percussion":
        if (!quiet || bar % 2 === 0) add(bar, 0, 2, chord - 7, 0.7);
        if (moving || energy > 0.6)
          add(bar, choose(r, [6, 8, 10]), 2, chord - 7, 0.49);
        if (phraseEnd)
          for (const st of choose(r, [
            [12, 14, 15],
            [11, 12, 14, 15],
          ]))
            add(bar, st, 1, chord - 7, 0.4 + Math.max(0, st - 12) * 0.1);
        break;
      case "pulse":
        for (const st of pulseRhythm) {
          add(
            bar,
            st,
            1.3,
            chord - 7 + (st % 8 === 6 ? 4 : 0),
            st % 4 === 0 ? 0.66 : 0.44,
          );
        }
        break;
      case "texture":
        for (const d of [0, 4, 9])
          add(bar, 0, 15.5, chord + d - 7 + textureOctave, 0.31 + r() * 0.1);
        break;
    }
  }
  return notes;
}

export function compose(
  sceneId: SceneId = "horizon",
  seed = randomSeed(),
  energy = 0.58,
): Score {
  const scene = sceneFor(sceneId);
  return {
    seed,
    scene: sceneId,
    bpm: scene.bpm,
    energy,
    generation: 0,
    parts: Object.fromEntries(
      INSTRUMENTS.map((inst, i) => [
        inst.id,
        {
          notes: generatePart(inst.id, scene, seed + i * 7919, energy),
          muted: false,
          volume:
            inst.id === "texture" ? 0.55 : inst.id === "pulse" ? 0.65 : 0.8,
          layers: 0,
        },
      ]),
    ) as Record<InstrumentId, Part>,
  };
}

export function evolve(score: Score): Score {
  const generation = score.generation + 1;
  const available = INSTRUMENTS.filter((i) => score.parts[i.id].layers === 0);
  if (!available.length) return score;
  const r = random(score.seed + generation * 104729);
  const id = choose(r, available).id;
  return {
    ...score,
    generation,
    parts: {
      ...score.parts,
      [id]: {
        ...score.parts[id],
        notes: generatePart(
          id,
          sceneFor(score.scene),
          score.seed + generation * 8191,
          score.energy,
        ),
      },
    },
  };
}

// Capture timing as well as pitch. A two-bar phrase is quantized to sixteenths,
// repeated through the movement and stored separately from the generated part.
export function weave(
  score: Score,
  id: InstrumentId,
  captured: CapturedNote[],
): Score {
  if (!captured.length || score.parts[id].layers >= MAX_LAYERS) return score;
  const part = score.parts[id],
    layer = part.layers + 1;
  const stepMs = 60000 / score.bpm / 4;
  let previous = -1;
  const phrase: MusicalNote[] = [];
  for (const note of captured.slice(0, 16)) {
    const step = Math.max(
      previous + 1,
      Math.round((note.time - captured[0].time) / stepMs),
    );
    if (step >= 32) break;
    phrase.push({
      step,
      duration: 2,
      midi: note.midi,
      velocity: layer > 1 ? 0.65 : 0.83,
      layer,
    });
    previous = step;
  }
  phrase.forEach((n, i) => {
    n.duration = Math.min(4, (phrase[i + 1]?.step ?? 32) - n.step);
  });
  const repeated = Array.from({ length: 4 }, (_, i) =>
    phrase.map((n) => ({ ...n, step: n.step + i * 32 })),
  ).flat();
  const notes = [...(part.layers ? part.notes : []), ...repeated].sort(
    (a, b) => a.step - b.step,
  );
  return {
    ...score,
    parts: {
      ...score.parts,
      [id]: { ...part, notes, layers: layer, muted: false },
    },
  };
}

export function undoLayer(score: Score, id: InstrumentId): Score {
  const part = score.parts[id];
  if (!part.layers) return score;
  const layers = part.layers - 1;
  const notes = layers
    ? part.notes.filter((n) => n.layer !== part.layers)
    : generatePart(
        id,
        sceneFor(score.scene),
        score.seed + INSTRUMENTS.findIndex((i) => i.id === id) * 7919,
        score.energy,
      );
  return {
    ...score,
    parts: { ...score.parts, [id]: { ...part, notes, layers } },
  };
}

export function reorchestrate(score: Score, energy: number): Score {
  return {
    ...score,
    energy,
    parts: Object.fromEntries(
      INSTRUMENTS.map((inst, i) => [
        inst.id,
        {
          ...score.parts[inst.id],
          notes: score.parts[inst.id].layers
            ? score.parts[inst.id].notes
            : generatePart(
                inst.id,
                sceneFor(score.scene),
                score.seed + i * 7919,
                energy,
              ),
        },
      ]),
    ) as Score["parts"],
  };
}
