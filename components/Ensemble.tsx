import { INSTRUMENTS, type InstrumentId } from "../lib/score";

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
    >
      <svg
        className="seating-lines"
        viewBox="0 0 480 240"
        fill="none"
        aria-hidden="true"
      >
        <defs>
          <radialGradient id="stage-glow">
            <stop stopColor="#b8c593" stopOpacity=".13" />
            <stop offset="1" stopColor="#b8c593" stopOpacity="0" />
          </radialGradient>
        </defs>
        <ellipse cx="240" cy="188" rx="220" ry="170" fill="url(#stage-glow)" />
        {[72, 110, 148, 186].map((r) => (
          <path
            key={r}
            d={`M ${240 - r} 184 A ${r} ${r * 0.72} 0 0 1 ${240 + r} 184`}
            stroke="#545947"
            strokeOpacity=".5"
            strokeDasharray={r === 186 ? "2 7" : undefined}
          />
        ))}
        <path
          d="M240 199v-21m-6 13 6-7 6 7"
          stroke="#d7ddbd"
          strokeWidth="1.5"
        />
        <circle
          cx="240"
          cy="186"
          r={22 + crescendo * 10}
          stroke="#b8c593"
          strokeOpacity=".14"
        />
      </svg>
      {INSTRUMENTS.map((inst, i) => {
        const coords = [
          [26, 60],
          [73, 60],
          [39, 35],
          [62, 35],
          [16, 44],
          [50, 18],
          [85, 42],
          [50, 61],
        ][i];
        return (
          <button
            key={inst.id}
            className={`seat ${selected === inst.id ? "selected" : ""}`}
            style={
              {
                left: `${coords[0]}%`,
                top: `${coords[1]}%`,
                "--section-color": inst.color,
                "--delay": `${i * 0.14}s`,
              } as React.CSSProperties
            }
            onClick={() => onSelect(inst.id)}
            aria-label={`Select ${inst.name}`}
            aria-pressed={selected === inst.id}
          >
            <span className="seat-dots">
              {Array.from(
                {
                  length: inst.id === "strings" || inst.id === "cello" ? 6 : 3,
                },
                (_, j) => (
                  <i key={j} />
                ),
              )}
            </span>
            <span>
              {inst.family === "Electronic" ? inst.name : inst.family}
            </span>
          </button>
        );
      })}
      <div className="conductor-label">
        {playing ? "YOU’RE CONDUCTING" : "THE STAGE IS YOURS"}
      </div>
    </div>
  );
}
