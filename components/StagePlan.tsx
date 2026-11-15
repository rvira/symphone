import { INSTRUMENTS, type InstrumentId } from "../lib/score";
import { STAGE_SECTIONS, playerPositions } from "../lib/stage";

export default function StagePlan({ selected }: { selected: InstrumentId }) {
  return (
    <svg
      className="stage-plan"
      viewBox="0 0 560 300"
      fill="none"
      aria-hidden="true"
    >
      <defs>
        <radialGradient id="floor-light">
          <stop stopColor="#e3c698" />
          <stop offset="1" stopColor="#b5966b" />
        </radialGradient>
        <pattern
          id="wood-boards"
          width="38"
          height="14"
          patternUnits="userSpaceOnUse"
        >
          <path
            d="M0 14h38M0 0v14m38-14v14"
            stroke="#765a37"
            strokeOpacity=".12"
          />
          <path d="M2 5h30M7 9h22" stroke="#fff3d3" strokeOpacity=".14" />
        </pattern>
      </defs>
      <ellipse
        cx="280"
        cy="168"
        rx="242"
        ry="112"
        fill="#4c3d2a"
        opacity=".09"
      />
      <ellipse cx="280" cy="157" rx="242" ry="112" fill="url(#floor-light)" />
      <ellipse cx="280" cy="157" rx="242" ry="112" fill="url(#wood-boards)" />
      <path
        d="M71 112c82-69 336-69 418 0M85 99c85-64 305-64 390 0"
        stroke="#886c47"
        strokeOpacity=".25"
      />
      {STAGE_SECTIONS.map((section) => (
        <g key={section.id} opacity={selected === section.id ? 1 : 0.65}>
          {playerPositions(section).map((p, i) => (
            <g
              key={i}
              transform={`translate(${280 + p.x * 36},${150 + p.z * 21}) rotate(${-p.x * 5})`}
            >
              <ellipse cy="5" rx="10" ry="5" fill="#54402c" opacity=".13" />
              <rect
                x="-7"
                y="-5"
                width="14"
                height="12"
                rx="3"
                fill={INSTRUMENTS.find((inst) => inst.id === section.id)!.color}
              />
              <path d="M-7-5c0-7 14-7 14 0" stroke="#353d38" strokeWidth="3" />
              <path d="M0 10v8m-5 0h10" stroke="#514c42" />
              <path
                d="m-7 10 14-1v7l-14 1Z"
                fill="#eee8d5"
                stroke="#776e5d"
                strokeWidth=".7"
              />
            </g>
          ))}
        </g>
      ))}
      <path d="m266 222 27-1 6 11-31 2Z" fill="#685844" />
      <path d="m266 219 27-1 6 11-31 2Z" fill="#ddc69f" />
      <circle cx="281" cy="218" r="4" fill="#363b37" />
      <path
        d="m277 221-4 8m11-8 6 5 8-9"
        stroke="#363b37"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <path d="m298 217 8-8" stroke="#f6eee0" strokeWidth="1.5" />
    </svg>
  );
}
