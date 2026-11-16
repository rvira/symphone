export const TOUR_STORAGE_KEY = "symphone.tour.v1";
const SCORE_KEYS = [
  "symphone.score.v1",
  "symphone.legacy.score.v1",
  "symphone.build.score.v1",
];
type TourStorage = Pick<Storage, "getItem" | "setItem">;

export function browserTourStorage(): TourStorage | undefined {
  try {
    return window.localStorage;
  } catch {
    return undefined;
  }
}

// Capture this before the orchestra's initial autosave, not after mount.
// Existing saved scores identify returning players who predate onboarding.
export function shouldOfferTour(storage?: Pick<Storage, "getItem">): boolean {
  try {
    return (
      !storage?.getItem(TOUR_STORAGE_KEY) &&
      !SCORE_KEYS.some((key) => storage?.getItem(key))
    );
  } catch {
    return true;
  }
}

export function rememberTour(
  status: "offered" | "skipped" | "completed",
  storage = browserTourStorage(),
) {
  try {
    storage?.setItem(TOUR_STORAGE_KEY, status);
  } catch {
    /* Storage is optional. */
  }
}

export const TOUR_STEPS = [
  {
    id: "welcome",
    target: null,
    title: "Your first seat at Symphone.",
    body: "A short walk through the conductor’s desk. We’ll show you where to begin, how to play an instrument, and how to make the orchestra your own.",
    tip: "Nothing plays or changes automatically. Try the controls as you go, or skip at any time.",
  },
  {
    id: "entrance",
    target: ".orchestra-start-cards, .studio-menu > summary",
    title: "Choose your entrance.",
    body: "Build from Nothing is the default: your score begins empty until you choose instruments and chords and build a foundation. Full Orchestra is a quick-start alternative with all eight parts ready.",
    tip: "Open Studio in the header to switch modes. The two modes save their scores separately, so switching modes preserves your saved work.",
  },
  {
    id: "scenes",
    target: ".scene-library",
    title: "Set the musical scene.",
    body: "Scenes set the scale, tempo and rhythm. Changing scenes reinterprets your existing instruments and chords without stopping playback or requiring another Build. Empty scores stay empty until you build.",
    tip: "Try Ballet & classical → British ballet for a light 3/4 sway. Woven phrases keep their pitches and adapt to the new meter. Reset all notes beside the score lets you start empty again.",
  },
  {
    id: "foundation",
    target: ".foundation-builder, .sound-mode-switcher",
    title: "Choose the first voices and chords.",
    body: "Use the black instrument desk on the right: choose starting voices, tap a bar and play a chord pad to assign its chord. The pads preview harmony and advance to the next bar. There are no dropdown menus.",
    tip: "Try Cellos and Harp, then Build foundation & play. Only those parts are added. Setup folds away for live playing; Edit foundation brings it back. Full Orchestra skips setup.",
  },
  {
    id: "playback",
    target: ".play-button",
    title: "Let the orchestra play.",
    body: "Play Orchestra starts the repeating eight-bar movement. Stop pauses the performance; Play starts again from bar one. The nearby BPM control changes speed and the key display shows the scene’s scale and meter.",
    tip: "Build foundation & play starts your chosen parts automatically. This Play/Stop button controls playback afterward. Other instruments wait until you enable Auto-evolve.",
  },
  {
    id: "score",
    target: ".score",
    title: "Follow the working score.",
    body: "Each row is an instrument; the small marks show its notes across eight bars. The moving line follows the performance. Select a row to play that section, or use its speaker button to mute it.",
    tip: "Empty rows are really empty—not hidden arrangements. After building, watch a waiting row gain notes each time Auto-evolve introduces a new section.",
  },
  {
    id: "instrument",
    target: ".instrument-picker",
    title: "Choose your voice.",
    body: "The same instrument picker has two jobs: before Build it selects your starting ensemble; after Build it selects your live voice without changing the score. No separate Build/Play tabs or duplicate pickers are needed.",
    tip: "After building, try Harp for a plucked sound, then Violins. Switching instruments clears uncommitted pad notes. Use Edit foundation only when you want to rebuild the starting arrangement.",
  },
  {
    id: "pads",
    target: ".pads",
    title: "Choose notes for a melody.",
    body: "Tap or hold the pads, or use A S D F G H J K when focus is outside the tour card. Every note is in the scene’s scale. The notes you choose appear below; timing and order are not copied into the score.",
    tip: "Try A, D and G in any order. Symphone uses these pitches as a palette and composes the rhythm for you. For keyboard playing, choose Try this section first. You can also Tab to a pad and use Enter.",
  },
  {
    id: "phrase",
    target: ".phrase-area",
    title: "Let Symphone melodize.",
    body: "Melodize & queue composes an eight-bar melody from your chosen pitches, with a returning motif, scene-aware rhythm, rests and chord-aware strong beats. It enters at the next cycle; Melodize now adds it immediately. When stopped, either action starts playback.",
    tip: "Build first, choose a few notes and melodize. You don’t need to perform a rhythm. The first melody replaces that section’s generated notes; stack up to three layers. Undo removes the latest layer. Live pad auditions still sound immediately.",
  },
  {
    id: "mix",
    target: ".mix-controls",
    title: "Shape the concert hall.",
    body: "Intensity changes the generated arrangement from intimate to grand while preserving woven phrases. Room adds concert-hall reverb. The selected instrument also has its own level slider and Solo Section button.",
    tip: "Try a little more Room for space. Use Solo Section beneath the pads to hear your selected instrument on its own; click again to restore the ensemble.",
  },
  {
    id: "movement",
    target: ".transport",
    title: "Keep the music moving.",
    body: "In Build from Nothing, Auto-evolve adds one new instrument every two bars, following your chosen chords. Once all sections have joined, it varies eligible generated parts while leaving woven phrases alone.",
    tip: "Click Auto-evolve after building to start playback and grow the orchestra. Turn it off to keep the current ensemble. Crescendo is a separate, temporary tension-and-release effect.",
  },
  {
    id: "save",
    target: ".record-button",
    title: "Keep your performance.",
    body: "Record captures the browser mix, including your live playing—not your microphone. Save Audio downloads it. Studio → Export Score saves the arrangement as JSON; the score also autosaves on this device.",
    tip: "You’re ready to conduct. Reopen this walkthrough anytime from How to play → Take the guided tour. Skipping or finishing keeps it from appearing automatically again.",
  },
] as const;

export type TourRect = {
  top: number;
  left: number;
  width: number;
  height: number;
};
export function placeTourCard(
  target: TourRect | null,
  viewport: { width: number; height: number },
  cardHeight: number,
) {
  const gap = 16,
    width = Math.min(380, viewport.width - gap * 2);
  const maxTop = Math.max(gap, viewport.height - cardHeight - gap);
  const left = Math.max(
    gap,
    Math.min(
      target?.left ?? (viewport.width - width) / 2,
      viewport.width - width - gap,
    ),
  );
  let top = (viewport.height - cardHeight) / 2;
  if (target) {
    const below = target.top + target.height + gap;
    top =
      below <= maxTop
        ? below
        : target.top - cardHeight - gap >= gap
          ? target.top - cardHeight - gap
          : maxTop;
  }
  return { width, left, top: Math.max(gap, Math.min(top, maxTop)) };
}
