import { useEffect, useState, type CSSProperties } from "react";
import { INSTRUMENTS, type InstrumentId, type Score } from "../lib/score";
import { STAGE_SECTIONS } from "../lib/stage";
import StagePlan from "./StagePlan";
import Stage3D from "./Stage3D";

export default function Ensemble({
  playing,
  selected,
  onSelect,
  crescendo,
  step,
  score,
  solo,
  livePlaying,
}: {
  playing: boolean;
  selected: InstrumentId;
  onSelect: (id: InstrumentId) => void;
  crescendo: number;
  step: number;
  score: Score;
  solo: InstrumentId | null;
  livePlaying: boolean;
}) {
  const [ready, setReady] = useState(false);
  const [plan, setPlan] = useState(false);
  const [reduced, setReduced] = useState(
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
  const [motion, setMotion] = useState(() => {
    try {
      return localStorage.getItem("symphone.motion") !== "off";
    } catch {
      return true;
    }
  });
  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const changed = () => setReduced(query.matches);
    query.addEventListener("change", changed);
    return () => query.removeEventListener("change", changed);
  }, []);
  const animated = motion && !reduced;
  return (
    <div
      className={`ensemble-art ${playing ? "is-playing" : ""} ${ready && !plan ? "stage-ready" : ""} ${animated ? "motion-enabled" : "motion-still"}`}
      aria-label="Orchestra seating map"
      style={{ "--crescendo": crescendo } as CSSProperties}
    >
      <StagePlan selected={selected} />
      {!plan && (
        <Stage3D
          state={{
            playing,
            selected,
            step,
            score,
            solo,
            livePlaying,
            crescendo,
            motion: animated,
          }}
          onSelect={onSelect}
          onReady={setReady}
        />
      )}
      <div className="stage-view-controls">
        <button
          onClick={() => {
            setPlan((v) => !v);
            setReady(false);
          }}
          aria-pressed={plan}
        >
          {plan ? "3D stage" : "Seating plan"}
        </button>
        <span />
        <button
          onClick={() => {
            const next = !motion;
            setMotion(next);
            try {
              localStorage.setItem("symphone.motion", next ? "on" : "off");
            } catch {
              /* Motion preference is optional. */
            }
          }}
          aria-pressed={animated}
          disabled={reduced}
          title={
            reduced
              ? "Your device’s reduced-motion preference is active"
              : "Toggle subtle stage animation"
          }
        >
          {animated ? "Motion on" : "Still view"}
        </button>
      </div>
      <div className="stage-section-list" aria-label="Orchestra sections">
        {STAGE_SECTIONS.map((section) => {
          const inst = INSTRUMENTS.find((i) => i.id === section.id)!;
          return (
            <button
              key={section.id}
              className={`stage-section ${selected === section.id ? "selected" : ""}`}
              style={{ "--section-color": inst.color } as CSSProperties}
              onClick={() => onSelect(section.id)}
              aria-label={`Select ${inst.name}`}
              aria-pressed={selected === section.id}
            >
              <i />
              {section.label}
            </button>
          );
        })}
      </div>
      <div className="conductor-label">
        <span />
        {playing ? "IN PERFORMANCE" : "FROM THE CONDUCTOR’S PODIUM"}
        <span />
      </div>
    </div>
  );
}
