import { useState } from "react";
import { Check, Hammer, Pencil } from "lucide-react";
import {
  BARS,
  INSTRUMENTS,
  chordLabel,
  sceneForScore,
  assignChord,
  type InstrumentId,
  type Score,
} from "../lib/score";
import InstrumentGlyph from "./InstrumentGlyph";
import "./FoundationBuilder.css";

export default function FoundationBuilder({
  score,
  onBuild,
  selected,
  onSelect,
  onPreviewChord,
}: {
  score: Score;
  onBuild: (instruments: InstrumentId[], progression: number[]) => void;
  selected: InstrumentId;
  onSelect: (instrument: InstrumentId) => void;
  onPreviewChord: (degree: number) => void;
}) {
  const [instruments, setInstruments] = useState<InstrumentId[]>(
    score.construction?.startingInstruments ?? [],
  );
  const [progression, setProgression] = useState([
    ...sceneForScore(score).progression,
  ]);
  const scene = sceneForScore(score);
  const buildMode = !!score.construction;
  const built = !!score.construction?.built;
  const [editing, setEditing] = useState(buildMode && !built);
  const [activeBar, setBar] = useState(0);
  const [announcement, setAnnouncement] = useState("");
  return (
    <div className="foundation-builder" aria-labelledby="foundation-heading">
      <div className="foundation-heading">
        <h3 id="foundation-heading">
          {editing
            ? "Choose your first voices"
            : "Choose an instrument to play"}
        </h3>
        {buildMode && built && (
          <button
            className="edit-foundation"
            onClick={() => setEditing((open) => !open)}
            aria-expanded={editing}
          >
            <Pencil size={12} />
            {editing ? "Back to playing" : "Edit foundation"}
          </button>
        )}
      </div>
      <p>
        {editing
          ? "Select starting instruments, then tap the chord pads to shape your progression."
          : "Choose your live voice, then play the pads below. This does not change the score."}
      </p>
      <div
        className="foundation-instruments instrument-picker"
        role="group"
        aria-label={
          editing
            ? "Choose starting instruments"
            : "Select an instrument section"
        }
      >
        {INSTRUMENTS.map((inst) => (
          <button
            key={inst.id}
            type="button"
            aria-pressed={
              editing ? instruments.includes(inst.id) : selected === inst.id
            }
            aria-label={
              editing
                ? `Include ${inst.name} in foundation`
                : `Play ${inst.name}`
            }
            className={selected === inst.id ? "live-selected" : ""}
            onClick={() => {
              onSelect(inst.id);
              if (editing)
                setInstruments((current) =>
                  current.includes(inst.id)
                    ? current.filter((id) => id !== inst.id)
                    : [...current, inst.id],
                );
            }}
          >
            <InstrumentGlyph id={inst.id} size={19} />
            <span>{inst.name}</span>
            {editing && instruments.includes(inst.id) && <Check size={13} />}
          </button>
        ))}
      </div>
      {editing && (
        <>
          <div className="chord-pad-heading">
            <h3>Chord progression</h3>
            <span>{scene.mode}</span>
          </div>
          <div
            className="foundation-bars"
            role="group"
            aria-label="Choose a bar to set its chord"
          >
            {Array.from({ length: BARS }, (_, bar) => (
              <button
                key={bar}
                aria-label={`Set chord for bar ${bar + 1}: ${chordLabel(scene, progression[bar])}`}
                aria-pressed={bar === activeBar}
                onClick={() => setBar(bar)}
              >
                <small>{String(bar + 1).padStart(2, "0")}</small>
                <span>{chordLabel(scene, progression[bar])}</span>
              </button>
            ))}
          </div>
          <div
            className="foundation-chord-pads"
            role="group"
            aria-label={`Chord pads for bar ${activeBar + 1}`}
          >
            {scene.scale.map((_, degree) => (
              <button
                key={degree}
                aria-label={`Play ${chordLabel(scene, degree)} chord and assign to bar ${activeBar + 1}`}
                onClick={() => {
                  setProgression((current) =>
                    assignChord(current, activeBar, degree),
                  );
                  onPreviewChord(degree);
                  setAnnouncement(
                    `Bar ${activeBar + 1} set to ${chordLabel(scene, degree)}.${activeBar < BARS - 1 ? ` Next: bar ${activeBar + 2}.` : " Progression ready."}`,
                  );
                  setBar((current) => Math.min(BARS - 1, current + 1));
                }}
              >
                {chordLabel(scene, degree)}
              </button>
            ))}
          </div>
          <p className="chord-pad-hint">
            Tap a bar, then a chord pad. Each pad previews the sound and moves
            to the next bar.
          </p>
          <span className="desk-sr-only" role="status">
            {announcement}
          </span>
          <div className="foundation-actions">
            <button
              className="build-foundation"
              disabled={!instruments.length}
              onClick={() => {
                onBuild(instruments, progression);
                setEditing(false);
              }}
            >
              <Hammer size={16} />
              {built ? "Rebuild foundation & play" : "Build foundation & play"}
            </button>
            <small>
              {built
                ? "Rebuilding replaces existing parts and woven phrases, then starts playback."
                : instruments.length
                  ? "Start with these voices. Auto-evolve adds the rest. Play live below."
                  : "Select at least one starting instrument. Nothing plays until you choose."}
            </small>
          </div>
        </>
      )}
    </div>
  );
}
