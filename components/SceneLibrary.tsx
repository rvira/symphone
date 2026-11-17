import { useState, type CSSProperties } from "react";
import { Check } from "lucide-react";
import {
  SCENES,
  SCENE_FAMILIES,
  type SceneFamily,
  type SceneId,
} from "../lib/score";

export default function SceneLibrary({
  selected,
  onChoose,
}: {
  selected: SceneId;
  onChoose: (scene: SceneId) => void;
}) {
  const [family, setFamily] = useState<SceneFamily>("All scenes");
  const visible = SCENES.filter(
    (s) => family === "All scenes" || s.family === family,
  );
  return (
    <section className="scene-library" aria-labelledby="scene-heading">
      <div className="scene-library-heading">
        <h2 id="scene-heading">
          Set the scene <span>{SCENES.length} musical worlds</span>
        </h2>
      </div>
      <div className="scene-filters" role="group" aria-label="Scene families">
        {SCENE_FAMILIES.map((f) => (
          <button
            key={f}
            aria-pressed={family === f}
            onClick={() => setFamily(f)}
          >
            {f}
          </button>
        ))}
      </div>
      <div className="scene-grid" role="group" aria-label="Musical scenes">
        {visible.map((s) => (
          <button
            key={s.id}
            className={`scene-card ${s.id === selected ? "selected" : ""}`}
            style={{ "--scene-color": s.color } as CSSProperties}
            aria-pressed={s.id === selected}
            onClick={() => {
              if (s.id !== selected) onChoose(s.id);
            }}
            title={`${s.description} ${s.meter} · ${s.mode} · ${s.bpm} BPM`}
          >
            <span className="scene-card-title">
              <i />
              {s.name}
              {s.id === selected && <Check size={12} />}
            </span>
            <small>{s.subtitle}</small>
            <span className="scene-card-meter">
              {s.meter} <span>·</span> {s.bpm} BPM
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}
