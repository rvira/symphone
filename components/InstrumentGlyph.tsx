import type { InstrumentId } from "../lib/score";

export default function InstrumentGlyph({
  id,
  size = 28,
}: {
  id: InstrumentId;
  size?: number;
}) {
  const paths: Record<InstrumentId, React.ReactNode> = {
    strings: (
      <>
        <path d="m20 5 3-3m-5 5 4-4M16 9l7-7M12 12c-4-2-8 2-6 5-3 1-3 5-1 7s6 2 7-1c3 2 7-2 5-6Z" />
        <path d="m9 19 9-10m-9 6 6 6M25 7 7 25" />
      </>
    ),
    cello: (
      <>
        <path d="M16 2v10m-3-8h6m-7 9c-3-1-6 2-4 5-3 3-2 8 3 9h10c5-1 6-6 3-9 2-3-1-6-4-5Z" />
        <path d="M16 11v18m-5-9h10m4-16L7 28" />
      </>
    ),
    woodwinds: (
      <>
        <path d="m4 25 22-22m-20 24-3-3m22-22 3 3M10 19l3 3m1-7 3 3m1-7 3 3" />
        <circle cx="9" cy="23" r=".7" />
        <circle cx="13" cy="19" r=".7" />
      </>
    ),
    brass: (
      <>
        <path d="M19 11c-8-4-16 0-15 8s13 10 17 3c2-3 0-7-4-7-4-1-7 3-4 6m3-1 4 4m0-8 3-8 6-3-1 10-5 2M9 12V8h7v5" />
      </>
    ),
    harp: (
      <>
        <path d="M5 6c9-4 13 3 22-2L17 28H5Zm1 0 10 22M11 7v10m5-8v15m5-15v9" />
      </>
    ),
    percussion: (
      <>
        <path d="M4 13c0-5 24-5 24 0S4 18 4 13Zm1 1 3 11c4 3 12 3 16 0l3-11M8 26l-2 4m18-4 2 4M4 2l12 9M28 2l-9 9" />
      </>
    ),
    pulse: (
      <>
        <path d="M3 18h5V9h6v15h6V9h6v9h3M5 28h22" />
      </>
    ),
    texture: (
      <>
        <path d="M2 16c5-15 9 15 14 0s9 15 14 0M2 9c5-10 9 10 14 0s9 10 14 0M2 23c5-10 9 10 14 0s9 10 14 0" />
      </>
    ),
  };
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.35"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {paths[id]}
    </svg>
  );
}
