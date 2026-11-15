import type { InstrumentId, Score } from "./score";

// Physical coordinates are shared by the seating plan and dimensional stage.
export const STAGE_SECTIONS: {
  id: InstrumentId;
  x: number;
  z: number;
  rows: number;
  columns: number;
  label: string;
}[] = [
  { id: "strings", x: -2.45, z: 1.15, rows: 2, columns: 4, label: "Violins" },
  { id: "cello", x: 2.15, z: 1.25, rows: 2, columns: 3, label: "Cellos" },
  {
    id: "woodwinds",
    x: -0.9,
    z: -0.75,
    rows: 1,
    columns: 4,
    label: "Woodwinds",
  },
  { id: "brass", x: 1.75, z: -1.7, rows: 1, columns: 3, label: "Horns" },
  { id: "harp", x: -4.3, z: -0.55, rows: 1, columns: 1, label: "Harp" },
  { id: "percussion", x: -1.1, z: -2.6, rows: 1, columns: 3, label: "Timpani" },
  { id: "pulse", x: 4.1, z: -0.1, rows: 1, columns: 1, label: "Pulse" },
  { id: "texture", x: 4, z: -2.1, rows: 1, columns: 1, label: "Atmosphere" },
];

export function playerPositions(section: (typeof STAGE_SECTIONS)[number]) {
  return Array.from({ length: section.rows * section.columns }, (_, i) => ({
    x: section.x + ((i % section.columns) - (section.columns - 1) / 2) * 0.67,
    z:
      section.z +
      (Math.floor(i / section.columns) - (section.rows - 1) / 2) * 0.78,
  }));
}

// Motion follows actual score events, including mute/solo and live pad playing.
export function sectionActivity(
  score: Score,
  id: InstrumentId,
  step: number,
  solo: InstrumentId | null,
  selected: InstrumentId,
  livePlaying: boolean,
  playing: boolean,
) {
  const part = score.parts[id];
  if (part.muted || (solo && solo !== id)) return 0;
  if (livePlaying && selected === id) return 1;
  if (!playing || step < 0) return 0;
  return part.notes.some(
    (note) => step >= note.step && step < note.step + note.duration,
  )
    ? 1
    : 0;
}
