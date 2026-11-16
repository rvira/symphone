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
    color: "#7dbfbd",
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
    color: "#c0d2ad",
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
    color: "#9ecfcd",
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
    color: "#e8ddc9",
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
    color: "#905269",
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
    color: "#814a4c",
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
    color: "#444969",
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
    color: "#5d668c",
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
export type SceneId =
  | "horizon"
  | "momentum"
  | "nocturne"
  | "ballet"
  | "waltz"
  | "baroque"
  | "english-folk"
  | "jig"
  | "reel"
  | "nordic"
  | "ballad"
  | "storybook";
export const SCENE_FAMILIES = [
  "All scenes",
  "Ballet & classical",
  "Folk",
  "Cinematic",
] as const;
export type SceneFamily = (typeof SCENE_FAMILIES)[number];
export type Scene = {
  id: SceneId;
  name: string;
  subtitle: string;
  description: string;
  family: Exclude<SceneFamily, "All scenes">;
  bpm: number;
  root: number;
  mode: string;
  scale: readonly number[];
  progression: readonly number[];
  meter: "4/4" | "3/4" | "6/8";
  stepsPerBar: number;
  beatSteps: number;
  color: string;
  lead?: readonly number[];
  mix?: Partial<Record<InstrumentId, number>>;
};
const major = [0, 2, 4, 5, 7, 9, 11];
const minor = [0, 2, 3, 5, 7, 8, 10];
const dorian = [0, 2, 3, 5, 7, 9, 10];
const mixolydian = [0, 2, 4, 5, 7, 9, 10];
export const SCENES = [
  {
    id: "horizon",
    name: "Open horizon",
    subtitle: "Expansive · hopeful",
    description:
      "Broad violin phrases, open horn chords and a soft electronic undercurrent.",
    family: "Cinematic",
    meter: "4/4",
    stepsPerBar: 16,
    beatSteps: 4,
    color: "#7dbfbd",
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
    description:
      "Insistent bass, restless strings and a forward-moving analog pulse.",
    family: "Cinematic",
    meter: "4/4",
    stepsPerBar: 16,
    beatSteps: 4,
    color: "#c0d2ad",
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
    description:
      "Unhurried woodwind answers, sparse harp and a suspended wash of sound.",
    family: "Cinematic",
    meter: "4/4",
    stepsPerBar: 16,
    beatSteps: 4,
    color: "#444969",
    bpm: 72,
    root: 9,
    mode: "A dorian",
    scale: [0, 2, 3, 5, 7, 9, 10],
    progression: [0, 0, 3, 3, 6, 3, 4, 0],
  },
  {
    id: "ballet",
    name: "British ballet",
    subtitle: "Poised · dancing strings",
    description:
      "A ballet-inspired waltz: buoyant violins, delicate flute replies and light harp steps.",
    family: "Ballet & classical",
    meter: "3/4",
    stepsPerBar: 12,
    beatSteps: 4,
    color: "#905269",
    bpm: 96,
    root: 5,
    mode: "F major",
    scale: major,
    progression: [0, 3, 0, 4, 5, 3, 4, 0],
    lead: [0, 2, 4, 6, 8, 10],
    mix: {
      strings: 0.86,
      cello: 0.66,
      woodwinds: 0.72,
      brass: 0.35,
      harp: 0.8,
      percussion: 0.22,
      pulse: 0.1,
      texture: 0.18,
    },
  },
  {
    id: "waltz",
    name: "Chamber waltz",
    subtitle: "Turning · three-beat sway",
    description:
      "A grounded cello downbeat with two lifted chord steps and a circling violin melody.",
    family: "Ballet & classical",
    meter: "3/4",
    stepsPerBar: 12,
    beatSteps: 4,
    color: "#e8ddc9",
    bpm: 108,
    root: 7,
    mode: "G major",
    scale: major,
    progression: [0, 0, 3, 4, 5, 3, 4, 0],
    lead: [0, 4, 6, 8, 10],
    mix: {
      strings: 0.8,
      cello: 0.8,
      woodwinds: 0.55,
      brass: 0.46,
      harp: 0.72,
      percussion: 0.18,
      pulse: 0.08,
      texture: 0.12,
    },
  },
  {
    id: "baroque",
    name: "Baroque garden",
    subtitle: "Interlocking · ornate",
    description:
      "Running string figures, a walking cello line and harp arpeggios that answer the melody.",
    family: "Ballet & classical",
    meter: "4/4",
    stepsPerBar: 16,
    beatSteps: 4,
    color: "#7dbfbd",
    bpm: 104,
    root: 0,
    mode: "C major",
    scale: major,
    progression: [0, 4, 5, 2, 3, 0, 4, 0],
    lead: [0, 2, 4, 6, 8, 10, 12, 14],
    mix: {
      strings: 0.8,
      cello: 0.75,
      woodwinds: 0.62,
      brass: 0.26,
      harp: 0.88,
      percussion: 0.12,
      pulse: 0.08,
      texture: 0.1,
    },
  },
  {
    id: "english-folk",
    name: "English country",
    subtitle: "Folk · village dance",
    description:
      "A bright fiddle-like violin refrain with flute answers, open fifths and a steady dance step.",
    family: "Folk",
    meter: "4/4",
    stepsPerBar: 16,
    beatSteps: 4,
    color: "#c0d2ad",
    bpm: 104,
    root: 7,
    mode: "G mixolydian",
    scale: mixolydian,
    progression: [0, 0, 6, 0, 3, 0, 6, 0],
    lead: [0, 2, 4, 7, 8, 10, 12, 14],
    mix: {
      strings: 0.87,
      cello: 0.72,
      woodwinds: 0.8,
      brass: 0.18,
      harp: 0.72,
      percussion: 0.35,
      pulse: 0.12,
      texture: 0.1,
    },
  },
  {
    id: "jig",
    name: "Celtic jig",
    subtitle: "Folk · lilting pairs of three",
    description:
      "Two lilting beats per bar: quick violin and flute figures over a root-and-fifth foundation.",
    family: "Folk",
    meter: "6/8",
    stepsPerBar: 12,
    beatSteps: 6,
    color: "#7dbfbd",
    bpm: 92,
    root: 2,
    mode: "D dorian",
    scale: dorian,
    progression: [0, 0, 6, 0, 3, 3, 6, 0],
    lead: [0, 2, 4, 6, 8, 10],
    mix: {
      strings: 0.86,
      cello: 0.72,
      woodwinds: 0.85,
      brass: 0.12,
      harp: 0.75,
      percussion: 0.38,
      pulse: 0.16,
      texture: 0.1,
    },
  },
  {
    id: "reel",
    name: "Highland reel",
    subtitle: "Folk · quick-footed bowing",
    description:
      "An even eighth-note violin run, accented downbeats and an open drone beneath the dance.",
    family: "Folk",
    meter: "4/4",
    stepsPerBar: 16,
    beatSteps: 4,
    color: "#814a4c",
    bpm: 112,
    root: 9,
    mode: "A mixolydian",
    scale: mixolydian,
    progression: [0, 0, 6, 0, 3, 0, 4, 0],
    lead: [0, 2, 4, 6, 8, 10, 12, 14],
    mix: {
      strings: 0.92,
      cello: 0.78,
      woodwinds: 0.68,
      brass: 0.18,
      harp: 0.55,
      percussion: 0.4,
      pulse: 0.18,
      texture: 0.12,
    },
  },
  {
    id: "nordic",
    name: "Nordic folk",
    subtitle: "Folk · shadowed triple step",
    description:
      "An asymmetric three-beat violin phrase with a low open-fifth drone and spare accompaniment.",
    family: "Folk",
    meter: "3/4",
    stepsPerBar: 12,
    beatSteps: 4,
    color: "#444969",
    bpm: 90,
    root: 4,
    mode: "E minor",
    scale: minor,
    progression: [0, 0, 6, 0, 5, 3, 6, 0],
    lead: [0, 3, 4, 6, 8, 10],
    mix: {
      strings: 0.88,
      cello: 0.82,
      woodwinds: 0.45,
      brass: 0.16,
      harp: 0.56,
      percussion: 0.2,
      pulse: 0.1,
      texture: 0.28,
    },
  },
  {
    id: "ballad",
    name: "Fireside ballad",
    subtitle: "Folk · warm and unhurried",
    description:
      "A spacious, song-like string line with plucked harp and gentle flute echoes.",
    family: "Folk",
    meter: "4/4",
    stepsPerBar: 16,
    beatSteps: 4,
    color: "#905269",
    bpm: 68,
    root: 0,
    mode: "C major",
    scale: major,
    progression: [0, 5, 3, 0, 5, 3, 4, 0],
    lead: [0, 4, 6, 10],
    mix: {
      strings: 0.7,
      cello: 0.66,
      woodwinds: 0.68,
      brass: 0.12,
      harp: 0.88,
      percussion: 0.12,
      pulse: 0.08,
      texture: 0.24,
    },
  },
  {
    id: "storybook",
    name: "Storybook",
    subtitle: "Wonder · floating harp",
    description:
      "A gentle 6/8 sway, rippling harp and flute, with a little electronic shimmer behind the orchestra.",
    family: "Cinematic",
    meter: "6/8",
    stepsPerBar: 12,
    beatSteps: 6,
    color: "#c0d2ad",
    bpm: 68,
    root: 2,
    mode: "D major",
    scale: major,
    progression: [0, 5, 3, 4, 0, 3, 4, 0],
    lead: [0, 2, 6, 8, 10],
    mix: {
      strings: 0.65,
      cello: 0.58,
      woodwinds: 0.86,
      brass: 0.32,
      harp: 0.95,
      percussion: 0.2,
      pulse: 0.2,
      texture: 0.5,
    },
  },
] satisfies Scene[];
export type Score = {
  seed: number;
  scene: SceneId;
  bpm: number;
  energy: number;
  parts: Record<InstrumentId, Part>;
  generation: number;
  progression?: number[];
  construction?: { startingInstruments: InstrumentId[]; built: boolean };
};
export const EVOLUTION_ORDER: readonly InstrumentId[] = [
  "cello",
  "harp",
  "pulse",
  "strings",
  "woodwinds",
  "percussion",
  "brass",
  "texture",
];
export const activeInstruments = (score: Score) =>
  INSTRUMENTS.filter((i) => score.parts[i.id].notes.length > 0).map(
    (i) => i.id,
  );
export const playableScore = (score: Score) =>
  (!score.construction || score.construction.built) &&
  activeInstruments(score).length > 0;
export const sceneForScore = (score: Score): Scene => ({
  ...sceneFor(score.scene),
  progression: score.progression ?? sceneFor(score.scene).progression,
});
export function validProgression(value: unknown): value is number[] {
  return (
    Array.isArray(value) &&
    value.length === BARS &&
    value.every((d) => Number.isInteger(d) && d >= 0 && d < 7)
  );
}
export function chordLabel(scene: Scene, degree: number) {
  const root = degreeMidi(scene, degree),
    third = degreeMidi(scene, degree + 2) - root,
    fifth = degreeMidi(scene, degree + 4) - root;
  return noteName(root) + (fifth === 6 ? "dim" : third === 3 ? "m" : "");
}
export const chordNotes = (scene: Scene, degree: number, register = 60) =>
  [0, 2, 4].map((offset) => degreeMidi(scene, degree + offset, register));

export function assignChord(
  progression: readonly number[],
  bar: number,
  degree: number,
): number[] {
  if (
    !validProgression(progression) ||
    !Number.isInteger(bar) ||
    bar < 0 ||
    bar >= BARS ||
    !Number.isInteger(degree) ||
    degree < 0 ||
    degree > 6
  )
    throw new Error("Choose a valid bar and an in-key chord.");
  return progression.map((current, index) =>
    index === bar ? degree : current,
  );
}
export type CapturedNote = { midi: number; time: number };
export const sceneFor = (id: SceneId): Scene =>
  SCENES.find((s) => s.id === id)!;
export const stepsPerBar = (score: Pick<Score, "scene">) =>
  sceneFor(score.scene).stepsPerBar;
export const totalSteps = (score: Pick<Score, "scene">) =>
  stepsPerBar(score) * BARS;
// In compound meter BPM counts dotted quarters, not eighth notes.
export const secondsPerStep = (score: Pick<Score, "scene" | "bpm">) =>
  60 / score.bpm / sceneFor(score.scene).beatSteps;
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
function generateStylePart(
  id: InstrumentId,
  scene: Scene,
  seed: number,
  energy: number,
): MusicalNote[] {
  const r = random(seed),
    notes: MusicalNote[] = [];
  const barLength = scene.stepsPerBar;
  const beats = Array.from(
    { length: barLength / scene.beatSteps },
    (_, i) => i * scene.beatSteps,
  );
  const folk = scene.family === "Folk";
  const gentle = scene.id === "ballad" || scene.id === "storybook";
  const drone = scene.id === "reel" || scene.id === "nordic";
  const baroque = scene.id === "baroque";
  const motif = choose(r, [
    [0, 1, 2, 4, 2, 1, 3, 2],
    [0, 2, 4, 3, 2, 1, 2, 0],
    [0, 2, 1, 2, 4, 3, 2, 1],
  ]);
  const inversion = choose(r, [0, 2]);
  const add = (
    bar: number,
    local: number,
    duration: number,
    degree: number,
    velocity: number,
  ) => {
    const step = bar * barLength + local;
    notes.push({
      step,
      duration: Math.min(duration, barLength - local),
      midi: degreeMidi(scene, degree, instrumentFor(id).register),
      velocity: velocity * (0.7 + energy * 0.3),
    });
  };
  for (let bar = 0; bar < BARS; bar++) {
    const chord = scene.progression[bar];
    const cadence = bar % 4 === 3;
    switch (id) {
      case "strings": {
        const rhythm = scene.lead!;
        rhythm.forEach((st, i) => {
          if (cadence && i >= Math.ceil(rhythm.length / 2)) return;
          const degree =
            i === 0
              ? chord
              : chord + motif[(i + (bar % 2 ? 2 : 0)) % motif.length];
          const gap = (rhythm[i + 1] ?? barLength) - st;
          const duration =
            cadence && i === Math.ceil(rhythm.length / 2) - 1
              ? barLength - st
              : gap * (folk ? 0.82 : baroque ? 0.88 : 0.96);
          add(
            bar,
            st,
            duration,
            degree,
            0.66 + (i === 0 ? 0.14 : 0) + (bar >= 4 ? 0.05 : 0),
          );
        });
        break;
      }
      case "cello":
        if (drone) {
          for (const d of [0, 4])
            add(bar, 0, barLength - 0.5, d - 7, 0.56 + r() * 0.08);
        } else {
          const rhythm = baroque
            ? [0, 4, 8, 12]
            : scene.meter === "3/4"
              ? [0]
              : [0, barLength / 2];
          rhythm.forEach((st, i) =>
            add(
              bar,
              st,
              gentle ? barLength / 2 - 0.5 : scene.beatSteps * 0.8,
              chord - 7 + (i % 2 ? choose(r, [2, 4]) : 0),
              i === 0 ? 0.78 : 0.6,
            ),
          );
        }
        break;
      case "woodwinds": {
        const rhythm =
          scene.id === "storybook"
            ? [0, 4, 6, 10]
            : folk && !gentle
              ? scene.lead!.filter((_, i) => i % 2 === 0)
              : [scene.beatSteps, barLength - 2];
        if (bar % 2 || baroque || scene.id === "storybook" || energy > 0.75)
          rhythm.forEach((st, i) => {
            if (cadence && i > 0) return;
            add(
              bar,
              st,
              Math.min(gentle ? 4 : 2, barLength - st),
              chord + (cadence ? 0 : motif[(i + 2) % motif.length]),
              0.5 + r() * 0.1,
            );
          });
        break;
      }
      case "brass": {
        // Airy folk arrangements use open fifths, not a cinematic block chord.
        if (bar % (folk || gentle ? 4 : 2) === 0 || (cadence && energy > 0.7)) {
          for (const d of folk ? [0, 4] : [0, 2, 4])
            add(
              bar,
              0,
              gentle ? barLength - 1 : scene.beatSteps * 1.6,
              chord + d - 7 + inversion,
              0.4 + r() * 0.1,
            );
        }
        break;
      }
      case "harp": {
        if (scene.meter === "3/4" && scene.id !== "nordic") {
          // The bass owns beat one; the harp supplies the two lifted waltz chords.
          for (const st of [4, 8])
            for (const d of [0, 2, 4])
              add(bar, st, 2.8, chord + d + inversion, 0.4 + r() * 0.08);
        } else {
          const rhythm =
            baroque || scene.id === "storybook"
              ? Array.from({ length: barLength / 2 }, (_, i) => i * 2)
              : scene.meter === "6/8"
                ? [0, 4, 6, 10]
                : gentle
                  ? [0, 6, 10]
                  : beats;
          rhythm.forEach((st, i) =>
            add(
              bar,
              st,
              2.5,
              chord + [0, 2, 4, 7, 4, 2, 0, 2][i] + inversion,
              0.48 + r() * 0.08,
            ),
          );
        }
        break;
      }
      case "percussion":
        if (!gentle || bar % 2 === 0)
          add(bar, 0, 1.5, chord - 7, 0.5 + r() * 0.1);
        if (folk && !gentle && scene.meter !== "3/4")
          add(bar, barLength / 2, 1.5, chord - 7, 0.38);
        if (cadence && energy > 0.55)
          add(bar, barLength - 2, 1, chord - 7, 0.32 + r() * 0.08);
        break;
      case "pulse":
        for (const st of gentle ? [0] : beats)
          add(
            bar,
            st,
            1.2,
            chord - 7 + choose(r, [0, 0, 4]),
            st === 0 ? 0.5 : 0.34,
          );
        break;
      case "texture":
        for (const d of [0, 4, 7])
          add(
            bar,
            0,
            barLength - 0.5,
            chord + d - 7 + inversion,
            0.28 + r() * 0.08,
          );
        break;
    }
  }
  return notes;
}

export function generatePart(
  id: InstrumentId,
  scene: Scene,
  seed: number,
  energy: number,
): MusicalNote[] {
  if (scene.lead) return generateStylePart(id, scene, seed, energy);
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
  options: {
    startingInstruments?: readonly InstrumentId[];
    progression?: readonly number[];
    empty?: boolean;
  } = {},
): Score {
  if (options.progression && !validProgression(options.progression))
    throw new Error("Choose one diatonic chord for each of the eight bars.");
  const scene: Scene = {
    ...sceneFor(sceneId),
    progression: options.progression ?? sceneFor(sceneId).progression,
  };
  const starting = options.startingInstruments;
  return {
    seed,
    scene: sceneId,
    bpm: scene.bpm,
    energy,
    generation: 0,
    progression: [...scene.progression],
    ...(starting
      ? {
          construction: {
            startingInstruments: [...new Set(starting)],
            built: !options.empty,
          },
        }
      : {}),
    parts: Object.fromEntries(
      INSTRUMENTS.map((inst, i) => [
        inst.id,
        {
          notes:
            options.empty || (starting && !starting.includes(inst.id))
              ? []
              : generatePart(inst.id, scene, seed + i * 7919, energy),
          muted: false,
          volume:
            scene.mix?.[inst.id] ??
            (inst.id === "texture" ? 0.55 : inst.id === "pulse" ? 0.65 : 0.8),
          layers: 0,
        },
      ]),
    ) as Record<InstrumentId, Part>,
  };
}

export const emptyScore = (
  sceneId: SceneId = "horizon",
  seed = randomSeed(),
  energy = 0.58,
) => compose(sceneId, seed, energy, { startingInstruments: [], empty: true });

// Reinterpret the existing ensemble, not a new composition. User phrases keep
// their pitches and relative bar positions when the new scene changes meter.
export function changeScene(score: Score, scene: SceneId): Score {
  if (scene === score.scene) return score;
  const next = compose(scene, score.seed, score.energy, {
    startingInstruments: activeInstruments(score),
    progression: sceneForScore(score).progression,
    empty: !!score.construction && !score.construction.built,
  });
  const ratio = stepsPerBar(next) / stepsPerBar(score);
  return {
    ...score,
    scene,
    bpm: next.bpm,
    progression: next.progression,
    parts: Object.fromEntries(
      INSTRUMENTS.map(({ id }) => {
        const part = score.parts[id];
        return [
          id,
          {
            ...part,
            notes: part.layers
              ? part.notes.map((note) => {
                  const step = Math.min(
                    totalSteps(next) - 1,
                    Math.round(note.step * ratio),
                  );
                  return {
                    ...note,
                    step,
                    duration: Math.min(
                      totalSteps(next) - step,
                      Math.max(1, Math.round(note.duration * ratio)),
                    ),
                  };
                })
              : next.parts[id].notes,
          },
        ];
      }),
    ) as Score["parts"],
  };
}

export function resetNotes(score: Score): Score {
  const empty = emptyScore(score.scene, randomSeed(), score.energy);
  return {
    ...empty,
    bpm: score.bpm,
    progression: [...sceneForScore(score).progression],
  };
}

export function buildFoundation(
  score: Score,
  instruments: readonly InstrumentId[],
  progression: readonly number[],
): Score {
  if (
    !instruments.length ||
    instruments.some((id) => !INSTRUMENTS.some((i) => i.id === id))
  )
    throw new Error("Choose at least one starting instrument.");
  const built = compose(score.scene, score.seed, score.energy, {
    startingInstruments: instruments,
    progression,
  });
  return {
    ...built,
    bpm: score.bpm,
    parts: Object.fromEntries(
      INSTRUMENTS.map((i) => [
        i.id,
        {
          ...built.parts[i.id],
          volume: score.parts[i.id].volume,
          muted: score.parts[i.id].muted,
        },
      ]),
    ) as Score["parts"],
  };
}

// Called by the audio clock, not a UI timer. Turning Auto-evolve off really
// stops entrances; stopping/restarting playback never resets the arrangement.
export const evolveAtBoundary = (
  score: Score,
  absoluteStep: number,
  enabled: boolean,
): Score =>
  enabled && absoluteStep > 0 && absoluteStep % (stepsPerBar(score) * 2) === 0
    ? evolve(score)
    : score;

export function evolve(score: Score): Score {
  if (score.construction && !score.construction.built) return score;
  const generation = score.generation + 1;
  const entering =
    score.construction &&
    EVOLUTION_ORDER.find((id) => !score.parts[id].notes.length);
  if (entering) {
    return {
      ...score,
      generation,
      parts: {
        ...score.parts,
        [entering]: {
          ...score.parts[entering],
          notes: generatePart(
            entering,
            sceneForScore(score),
            score.seed + generation * 8191,
            score.energy,
          ),
        },
      },
    };
  }
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
          sceneForScore(score),
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
  if (score.construction && !score.construction.built) return score;
  if (!captured.length || score.parts[id].layers >= MAX_LAYERS) return score;
  const part = score.parts[id],
    layer = part.layers + 1;
  const stepMs = secondsPerStep(score) * 1000;
  const phraseLength = stepsPerBar(score) * 2;
  let previous = -1;
  const phrase: MusicalNote[] = [];
  for (const note of captured.slice(0, 16)) {
    const step = Math.max(
      previous + 1,
      Math.round((note.time - captured[0].time) / stepMs),
    );
    if (step >= phraseLength) break;
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
    n.duration = Math.min(4, (phrase[i + 1]?.step ?? phraseLength) - n.step);
  });
  const repeated = Array.from({ length: 4 }, (_, i) =>
    phrase.map((n) => ({ ...n, step: n.step + i * phraseLength })),
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
        sceneForScore(score),
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
          notes:
            score.parts[inst.id].layers ||
            (score.construction && !score.parts[inst.id].notes.length)
              ? score.parts[inst.id].notes
              : generatePart(
                  inst.id,
                  sceneForScore(score),
                  score.seed + i * 7919,
                  energy,
                ),
        },
      ]),
    ) as Score["parts"],
  };
}
