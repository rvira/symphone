import type { CSSProperties } from "react";
import { INSTRUMENTS, type InstrumentId } from "../lib/score";
import { STAGE_SECTIONS } from "../lib/stage";
import StagePlan from "./StagePlan";

export default function Ensemble({
  playing,
  selected,
  onSelect,
  crescendo,
}: {
  playing: boolean;
  selected: InstrumentId;
  onSelect: (id: InstrumentId) => void;
  crescendo: number;
}) {
  return (
    <div
      className={`ensemble-art ${playing ? "is-playing" : ""}`}
      aria-label="Orchestra seating map"
      style={{ "--crescendo": crescendo } as CSSProperties}
    >
      <StagePlan selected={selected} />
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
