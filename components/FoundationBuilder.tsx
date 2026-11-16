import { useState } from "react";
import { Check, Hammer } from "lucide-react";
import {
  BARS,
  INSTRUMENTS,
  chordLabel,
  sceneForScore,
  type InstrumentId,
  type Score,
} from "../lib/score";
import InstrumentGlyph from "./InstrumentGlyph";
import "./FoundationBuilder.css";

export default function FoundationBuilder({
  score,
  onBuild,
}: {
  score: Score;
  onBuild: (instruments: InstrumentId[], progression: number[]) => void;
}) {
  const [instruments, setInstruments] = useState<InstrumentId[]>(
    score.construction?.startingInstruments ?? [],
  );
  const [progression, setProgression] = useState([
    ...sceneForScore(score).progression,
  ]);
  const scene = sceneForScore(score);
  const built = !!score.construction?.built;
  return (
    <section
      className="foundation-builder"
      aria-labelledby="foundation-heading"
    >
      <div className="foundation-heading">
        <div>
          <span className="eyebrow">YOUR STARTING POINT</span>
          <h2 id="foundation-heading">
            {built ? "Your foundation" : "Begin with an empty score."}
          </h2>
        </div>
        <span className="foundation-count">
          {instruments.length} starting{" "}
          {instruments.length === 1 ? "instrument" : "instruments"}
        </span>
      </div>
      <p>
        Choose your first voices and one chord per bar. Build creates only these
        parts; Auto-evolve brings in the rest, one section every two bars.
      </p>
      <fieldset className="foundation-instruments">
        <legend>1. Choose starting instruments</legend>
        {INSTRUMENTS.map((inst) => (
          <button
            key={inst.id}
            type="button"
            aria-pressed={instruments.includes(inst.id)}
            onClick={() =>
              setInstruments((current) =>
                current.includes(inst.id)
                  ? current.filter((id) => id !== inst.id)
                  : [...current, inst.id],
              )
            }
          >
            <InstrumentGlyph id={inst.id} size={19} />
            <span>{inst.name}</span>
            {instruments.includes(inst.id) && <Check size={13} />}
          </button>
        ))}
      </fieldset>
      <fieldset className="foundation-chords">
        <legend>2. Choose your chord progression · {scene.mode}</legend>
        {Array.from({ length: BARS }, (_, bar) => (
          <label key={bar}>
            <span>BAR {String(bar + 1).padStart(2, "0")}</span>
            <select
              aria-label={`Chord for bar ${bar + 1}`}
              value={progression[bar]}
              onChange={(e) =>
                setProgression((current) =>
                  current.map((d, i) =>
                    i === bar ? Number(e.target.value) : d,
                  ),
                )
              }
            >
              {scene.scale.map((_, degree) => (
                <option key={degree} value={degree}>
                  {chordLabel(scene, degree)}
                </option>
              ))}
            </select>
          </label>
        ))}
      </fieldset>
      <div className="foundation-actions">
        <button
          className="build-foundation"
          disabled={!instruments.length}
          onClick={() => onBuild(instruments, progression)}
        >
          <Hammer size={16} />
          {built ? "Rebuild foundation" : "Build foundation"}
        </button>
        <small>
          {built
            ? "Rebuilding replaces the current parts and woven phrases. Select Play to listen afterward."
            : instruments.length
              ? "Build the score, then press Play or Auto-evolve to listen."
              : "Select at least one starting instrument. Nothing plays until you choose."}
        </small>
      </div>
    </section>
  );
}
