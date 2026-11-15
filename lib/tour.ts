export const TOUR_STORAGE_KEY = "symphone.tour.v1";
const SCORE_KEYS = ["symphone.score.v1", "symphone.legacy.score.v1"];
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
    target: ".orchestra-start-cards, .sound-mode-switcher",
    title: "Choose your entrance.",
    body: "Full Orchestra brings in all eight sections straight away. Build Eventually begins with cellos and atmosphere; more sections join each cycle. Next Stage lets you bring them in sooner.",
    tip: "Start with Full Orchestra for your first listen. Or choose Build Eventually to hear the ensemble grow.",
  },
  {
    id: "scenes",
    target: ".scene-library",
    title: "Set the musical scene.",
    body: "Scenes shape the harmony, tempo, rhythm and instrument balance. Use the family filters to explore ballet, classical, folk and cinematic styles.",
    tip: "Try Ballet & classical → British ballet for a light 3/4 sway. Changing scenes or choosing New movement clears your phrases and starts a fresh score.",
  },
  {
    id: "stage",
    target: "#conductor-podium, [aria-label='Orchestra seating map']",
    title: "Take a seat on stage.",
    body: "Select a section on the miniature stage or use its labeled section buttons. The stage follows playback and your live notes. Seating plan switches to a flat view; Motion on can be turned off.",
    tip: "Select Violins to start. Choosing a section changes the instrument you play, not the rest of the ensemble.",
  },
  {
    id: "playback",
    target: ".play-button",
    title: "Let the orchestra play.",
    body: "Play Orchestra starts the repeating eight-bar movement. Stop pauses the performance; Play starts again from bar one. The nearby BPM control changes speed and the key display shows the scene’s scale and meter.",
    tip: "Press Play Orchestra when you’re ready to listen. Sound only starts after your interaction; samples may take a moment to load.",
  },
  {
    id: "score",
    target: ".score",
    title: "Follow the working score.",
    body: "Each row is an instrument; the small marks show its notes across eight bars. The moving line follows the performance. Select a row to play that section, or use its speaker button to mute it.",
    tip: "Try muting Analog pulse to hear a more acoustic ensemble. Click its speaker again to bring it back.",
  },
  {
    id: "instrument",
    target: ".instrument-picker",
    title: "Choose your voice.",
    body: "These eight instrument buttons select your live voice: violins, cellos, flute, horns, harp, timpani and two electronic sections. They select the same sections as the stage and score.",
    tip: "Try Harp for a plucked sound, then return to Violins. Switching instruments clears notes you haven’t woven yet.",
  },
  {
    id: "pads",
    target: ".pads",
    title: "Play a little phrase.",
    body: "Tap or hold the pads, or use A S D F G H J K when focus is outside the tour card. Every note is in the scene’s scale. Your pitches and timing appear in Your Phrase below.",
    tip: "Try A–D–G–D, leaving a little space between notes. For keyboard playing, choose Try this section first. You can also Tab to a pad and use Enter.",
  },
  {
    id: "phrase",
    target: ".phrase-area",
    title: "Give your phrase to the ensemble.",
    body: "Queue Phrase for Next Cycle lets your notes join at the next eight-bar downbeat while playing. Weave Now adds them immediately; when stopped, the queue button weaves and starts playback. Up to 16 notes fit in a two-bar phrase, repeated across the movement.",
    tip: "Play a few pads first, then queue the phrase. The first layer replaces that section’s generated notes; stack up to three. Undo removes the latest woven layer.",
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
    body: "Auto-evolve rewrites one eligible section every two bars, leaving your woven phrases alone. Crescendo briefly builds tension with percussion and a rising swell, then returns the ensemble on bar one.",
    tip: "While the orchestra plays, try Auto-evolve, then Crescendo. These are separate from Build Eventually, which brings sections in progressively.",
  },
  {
    id: "save",
    target: ".record-button",
    title: "Keep your performance.",
    body: "Record captures the browser mix, including your live playing—not your microphone. Save Audio downloads it. Export Score in the header saves the arrangement as JSON; the score also autosaves on this device.",
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
