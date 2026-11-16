import Link from "next/link";
import {
  ArrowRight,
  Compass,
  Layers,
  Music2,
  Play,
  Sparkles,
} from "lucide-react";

export default function LandingPage() {
  return (
    <div className="landing-screen">
      {/* Top Bar */}
      <header className="landing-header">
        <div className="wordmark">
          <span className="brand-icon">
            <i />
            <i />
            <i />
            <i />
          </span>
          <span className="brand-text">SYMPHONE</span>
        </div>

        <div className="landing-nav">
          <Link href="/studio" className="landing-enter-link">
            Open Studio <ArrowRight size={14} />
          </Link>
        </div>
      </header>

      {/* Main Focus */}
      <main className="landing-center">
        {/* Architectural Concert Hall Stage Backdrop */}
        <div className="landing-acoustic-backdrop" aria-hidden="true">
          <svg
            viewBox="0 0 1000 440"
            fill="none"
            className="acoustic-shell-svg"
          >
            <defs>
              <linearGradient id="hallGlow" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#c9a54d" stopOpacity="0.22" />
                <stop offset="65%" stopColor="#c9a54d" stopOpacity="0.04" />
                <stop offset="100%" stopColor="#c9a54d" stopOpacity="0" />
              </linearGradient>
            </defs>

            {/* Stage Floor Arc */}
            <path
              d="M 120 400 A 420 300 0 0 1 880 400 Z"
              fill="url(#hallGlow)"
            />

            {/* Concentric Orchestral Seating Tiers */}
            <path
              d="M 150 400 A 390 270 0 0 1 850 400"
              stroke="#c9a54d"
              strokeOpacity="0.14"
              strokeWidth="1"
              strokeDasharray="4 4"
            />
            <path
              d="M 230 400 A 300 200 0 0 1 770 400"
              stroke="#c9a54d"
              strokeOpacity="0.22"
              strokeWidth="1"
            />
            <path
              d="M 320 400 A 200 130 0 0 1 680 400"
              stroke="#c9a54d"
              strokeOpacity="0.25"
              strokeWidth="1"
              strokeDasharray="3 3"
            />
            <path
              d="M 400 400 A 110 70 0 0 1 600 400"
              stroke="#c9a54d"
              strokeOpacity="0.35"
              strokeWidth="1.2"
            />

            {/* Acoustic Radial Sound Diffusion Rays */}
            <line
              x1="500"
              y1="400"
              x2="170"
              y2="210"
              stroke="#c9a54d"
              strokeOpacity="0.09"
              strokeWidth="1"
            />
            <line
              x1="500"
              y1="400"
              x2="280"
              y2="140"
              stroke="#c9a54d"
              strokeOpacity="0.09"
              strokeWidth="1"
            />
            <line
              x1="500"
              y1="400"
              x2="410"
              y2="105"
              stroke="#c9a54d"
              strokeOpacity="0.09"
              strokeWidth="1"
            />
            <line
              x1="500"
              y1="400"
              x2="500"
              y2="90"
              stroke="#c9a54d"
              strokeOpacity="0.14"
              strokeWidth="1"
              strokeDasharray="3 3"
            />
            <line
              x1="500"
              y1="400"
              x2="590"
              y2="105"
              stroke="#c9a54d"
              strokeOpacity="0.09"
              strokeWidth="1"
            />
            <line
              x1="500"
              y1="400"
              x2="720"
              y2="140"
              stroke="#c9a54d"
              strokeOpacity="0.09"
              strokeWidth="1"
            />
            <line
              x1="500"
              y1="400"
              x2="830"
              y2="210"
              stroke="#c9a54d"
              strokeOpacity="0.09"
              strokeWidth="1"
            />

            {/* Instrument Section Nodes */}
            <circle
              cx="430"
              cy="340"
              r="3.5"
              fill="#f59e0b"
              fillOpacity="0.75"
            />
            <circle cx="465" cy="332" r="3" fill="#f59e0b" fillOpacity="0.75" />
            <circle cx="500" cy="330" r="3" fill="#f59e0b" fillOpacity="0.75" />
            <circle cx="535" cy="332" r="3" fill="#06b6d4" fillOpacity="0.75" />
            <circle
              cx="570"
              cy="340"
              r="3.5"
              fill="#06b6d4"
              fillOpacity="0.75"
            />

            <circle
              cx="360"
              cy="275"
              r="3.5"
              fill="#10b981"
              fillOpacity="0.7"
            />
            <circle
              cx="425"
              cy="250"
              r="3.5"
              fill="#10b981"
              fillOpacity="0.7"
            />
            <circle
              cx="500"
              cy="240"
              r="3.5"
              fill="#10b981"
              fillOpacity="0.7"
            />
            <circle
              cx="575"
              cy="250"
              r="3.5"
              fill="#ec4899"
              fillOpacity="0.7"
            />
            <circle
              cx="640"
              cy="275"
              r="3.5"
              fill="#ec4899"
              fillOpacity="0.7"
            />

            <circle cx="270" cy="210" r="4" fill="#eab308" fillOpacity="0.7" />
            <circle cx="370" cy="175" r="4" fill="#eab308" fillOpacity="0.7" />
            <circle
              cx="500"
              cy="160"
              r="4.5"
              fill="#ef4444"
              fillOpacity="0.8"
            />
            <circle cx="630" cy="175" r="4" fill="#eab308" fillOpacity="0.7" />
            <circle cx="730" cy="210" r="4" fill="#8b5cf6" fillOpacity="0.7" />

            {/* Maestro Podium */}
            <rect
              x="486"
              y="390"
              width="28"
              height="16"
              rx="3"
              fill="#c9a54d"
              fillOpacity="0.8"
            />
            <circle cx="500" cy="398" r="3" fill="#ffffff" />
          </svg>
        </div>

        {/* Architectural Concert Hall Stage Backdrop */}
        <div className="landing-acoustic-backdrop" aria-hidden="true">
          <svg
            viewBox="0 0 1000 440"
            fill="none"
            className="acoustic-shell-svg"
          >
            <defs>
              <linearGradient id="hallGlow" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#c9a54d" stopOpacity="0.22" />
                <stop offset="65%" stopColor="#c9a54d" stopOpacity="0.04" />
                <stop offset="100%" stopColor="#c9a54d" stopOpacity="0" />
              </linearGradient>
            </defs>

            {/* Stage Floor Arc */}
            <path
              d="M 120 400 A 420 300 0 0 1 880 400 Z"
              fill="url(#hallGlow)"
            />

            {/* Concentric Orchestral Seating Tiers */}
            <path
              d="M 150 400 A 390 270 0 0 1 850 400"
              stroke="#c9a54d"
              strokeOpacity="0.14"
              strokeWidth="1"
              strokeDasharray="4 4"
            />
            <path
              d="M 230 400 A 300 200 0 0 1 770 400"
              stroke="#c9a54d"
              strokeOpacity="0.22"
              strokeWidth="1"
            />
            <path
              d="M 320 400 A 200 130 0 0 1 680 400"
              stroke="#c9a54d"
              strokeOpacity="0.25"
              strokeWidth="1"
              strokeDasharray="3 3"
            />
            <path
              d="M 400 400 A 110 70 0 0 1 600 400"
              stroke="#c9a54d"
              strokeOpacity="0.35"
              strokeWidth="1.2"
            />

            {/* Acoustic Radial Sound Diffusion Rays */}
            <line
              x1="500"
              y1="400"
              x2="170"
              y2="210"
              stroke="#c9a54d"
              strokeOpacity="0.09"
              strokeWidth="1"
            />
            <line
              x1="500"
              y1="400"
              x2="280"
              y2="140"
              stroke="#c9a54d"
              strokeOpacity="0.09"
              strokeWidth="1"
            />
            <line
              x1="500"
              y1="400"
              x2="410"
              y2="105"
              stroke="#c9a54d"
              strokeOpacity="0.09"
              strokeWidth="1"
            />
            <line
              x1="500"
              y1="400"
              x2="500"
              y2="90"
              stroke="#c9a54d"
              strokeOpacity="0.14"
              strokeWidth="1"
              strokeDasharray="3 3"
            />
            <line
              x1="500"
              y1="400"
              x2="590"
              y2="105"
              stroke="#c9a54d"
              strokeOpacity="0.09"
              strokeWidth="1"
            />
            <line
              x1="500"
              y1="400"
              x2="720"
              y2="140"
              stroke="#c9a54d"
              strokeOpacity="0.09"
              strokeWidth="1"
            />
            <line
              x1="500"
              y1="400"
              x2="830"
              y2="210"
              stroke="#c9a54d"
              strokeOpacity="0.09"
              strokeWidth="1"
            />

            {/* Instrument Section Nodes */}
            <circle cx="430" cy="340" r="3.5" fill="#f59e0b" fillOpacity="0.75" />
            <circle cx="465" cy="332" r="3" fill="#f59e0b" fillOpacity="0.75" />
            <circle cx="500" cy="330" r="3" fill="#f59e0b" fillOpacity="0.75" />
            <circle cx="535" cy="332" r="3" fill="#06b6d4" fillOpacity="0.75" />
            <circle cx="570" cy="340" r="3.5" fill="#06b6d4" fillOpacity="0.75" />

            <circle cx="360" cy="275" r="3.5" fill="#10b981" fillOpacity="0.7" />
            <circle cx="425" cy="250" r="3.5" fill="#10b981" fillOpacity="0.7" />
            <circle cx="500" cy="240" r="3.5" fill="#10b981" fillOpacity="0.7" />
            <circle cx="575" cy="250" r="3.5" fill="#ec4899" fillOpacity="0.7" />
            <circle cx="640" cy="275" r="3.5" fill="#ec4899" fillOpacity="0.7" />

            <circle cx="270" cy="210" r="4" fill="#eab308" fillOpacity="0.7" />
            <circle cx="370" cy="175" r="4" fill="#eab308" fillOpacity="0.7" />
            <circle cx="500" cy="160" r="4.5" fill="#ef4444" fillOpacity="0.8" />
            <circle cx="630" cy="175" r="4" fill="#eab308" fillOpacity="0.7" />
            <circle cx="730" cy="210" r="4" fill="#8b5cf6" fillOpacity="0.7" />

            {/* Maestro Podium */}
            <rect
              x="486"
              y="390"
              width="28"
              height="16"
              rx="3"
              fill="#c9a54d"
              fillOpacity="0.8"
            />
            <circle cx="500" cy="398" r="3" fill="#ffffff" />
          </svg>
        </div>

        <div className="landing-tag">
          <span className="baton-indicator" />
          <span>CONCERT HALL · MAESTRO PODIUM</span>
        </div>

        <h1 className="landing-title">
          Conduct the <em>Living Orchestra.</em>
        </h1>

        <p className="landing-tagline">
          A playable hybrid ensemble of acoustic sections and electronic
          textures. Conduct full symphonic masterworks or build your sound cycle
          by cycle from silence.
        </p>

        {/* Dual Mode Entry Doors */}
        <div className="subtle-start-grid">
          <Link href="/studio?mode=full" className="subtle-card">
            <div className="card-topline">
              <span className="subtle-badge">
                <Music2 size={12} /> COMPLETE ENSEMBLE
              </span>
              <span className="card-arrow">
                <ArrowRight size={16} />
              </span>
            </div>
            <h3>Full Orchestra</h3>
            <p>
              Experience all eight sections in concert harmony immediately. Play
              along with in-key pads and sculpt the mix in real time.
            </p>
            <span className="subtle-card-action">Launch Full Orchestra →</span>
          </Link>

          <Link href="/studio?mode=build" className="subtle-card">
            <div className="card-topline">
              <span className="subtle-badge accent">
                <Sparkles size={12} /> PROGRESSIVE BUILDUP
              </span>
              <span className="card-arrow">
                <ArrowRight size={16} />
              </span>
            </div>
            <h3>Build the Symphony</h3>
            <p>
              Begin with an intimate acoustic foundation. Watch instrument
              families enter cycle by cycle into a grand orchestral climax.
            </p>
            <span className="subtle-card-action">Build Step-by-Step →</span>
          </Link>
        </div>
      </main>

      {/* Subtle Bottom Bar */}
      <footer className="landing-footer">
        <div className="feature-pills">
          <span className="feature-pill">
            <Music2 size={13} /> 8 Handcrafted Sections
          </span>
          <span className="feature-pill">
            <Compass size={13} /> 12 Harmonic Masterworks
          </span>
          <span className="feature-pill">
            <Layers size={13} /> In-Key Conductor Pads (A–K)
          </span>
        </div>

        <span className="hall-note">WEB AUDIO SYMPHONIC ENGINE</span>
      </footer>
    </div>
  );
}
