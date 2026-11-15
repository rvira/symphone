import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import {
  ArrowRight,
  ArrowUpRight,
  Circle,
  Download,
  Headphones,
  HelpCircle,
  Music2,
  Play,
  RotateCcw,
  Sparkles,
  Square,
  Volume2,
  VolumeX,
  Waves,
  X,
} from "lucide-react";
import { orchestra, type SampleStatus } from "../lib/audio";
import {
  BARS,
  INSTRUMENTS,
  MAX_LAYERS,
  SCENES,
  stepsPerBar,
  totalSteps,
  compose,
  instrumentFor,
  noteName,
  padNotes,
  reorchestrate,
  sceneFor,
  undoLayer,
  weave,
  type CapturedNote,
  type InstrumentId,
  type SceneId,
  type Score,
} from "../lib/score";
import InstrumentGlyph from "./InstrumentGlyph";
import Ensemble from "./Ensemble";
import SceneLibrary from "./SceneLibrary";
import GuidedTour from "./GuidedTour";
import { browserTourStorage, shouldOfferTour } from "../lib/tour";

const KEYS = ["a", "s", "d", "f", "g", "h", "j", "k"];
const STORAGE_KEY = "symphone.score.v1";
const LEGACY_STORAGE_KEY = "tutti.score.v1";
function initialScore(): Score {
  try {
    const stored = JSON.parse(
      localStorage.getItem(STORAGE_KEY) ??
        localStorage.getItem(LEGACY_STORAGE_KEY) ??
        "null",
    );
    if (
      stored &&
      SCENES.some((s) => s.id === stored.scene) &&
      Number.isFinite(stored.seed) &&
      stored.bpm >= 50 &&
      stored.bpm <= 160 &&
      Number.isFinite(stored.energy) &&
      Number.isInteger(stored.generation) &&
      INSTRUMENTS.every((i) => {
        const p = stored.parts?.[i.id];
        return (
          p &&
          typeof p.muted === "boolean" &&
          p.volume >= 0 &&
          p.volume <= 1 &&
          p.layers >= 0 &&
          p.layers <= MAX_LAYERS &&
          Array.isArray(p.notes) &&
          p.notes.length < 2000 &&
          p.notes.every(
            (n: {
              step: number;
              midi: number;
              duration: number;
              velocity: number;
            }) =>
              Number.isInteger(n.step) &&
              n.step >= 0 &&
              n.step < totalSteps(stored) &&
              n.midi >= 0 &&
              n.midi <= 127 &&
              n.duration > 0 &&
              n.step + n.duration <= totalSteps(stored) &&
              n.velocity >= 0 &&
              n.velocity <= 1,
          )
        );
      })
    )
      return stored;
  } catch {
    /* Corrupt or unavailable local storage starts a fresh session. */
  }
  return compose();
}

export default function Orchestra() {
  const [score, setScore] = useState<Score>(initialScore);
  const scoreRef = useRef(score);
  const [playing, setPlaying] = useState(false);
  const [selected, setSelected] = useState<InstrumentId>("strings");
  const selectedRef = useRef(selected);
  selectedRef.current = selected;
  const [step, setStep] = useState(-1);
  const [evolving, setEvolving] = useState(false);
  const [building, setBuilding] = useState(false);
  const [progress, setProgress] = useState(0);
  const [space, setSpace] = useState(0.4);
  const [energy, setEnergy] = useState(score.energy);
  const [captured, setCaptured] = useState<CapturedNote[]>([]);
  const [activeNotes, setActiveNotes] = useState<number[]>([]);
  const [solo, setSolo] = useState<InstrumentId | null>(null);
  const [recording, setRecording] = useState(false);
  const [statuses, setStatuses] = useState(orchestra.sampleStatus);
  const [notice, setNotice] = useState("");
  const [help, setHelp] = useState(false);
  const [tourFirstVisit] = useState(() => shouldOfferTour(browserTourStorage()));
  const [tourRun, setTourRun] = useState(0);
  const [drop, setDrop] = useState(0);
  const held = useRef(
    new Map<string, { release?: () => void; released: boolean }>(),
  );
  const frame = useRef(0);
  const busy = useRef(false);
  const helpTrigger = useRef<HTMLElement | null>(null);
  const apply = useCallback((next: Score) => {
    scoreRef.current = next;
    setScore(next);
    orchestra.setScore(next);
  }, []);

  useEffect(() => {
    orchestra.setScore(scoreRef.current);
    return orchestra.subscribeStatus(() => setStatuses(orchestra.sampleStatus));
  }, []);
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(score));
    } catch {
      /* Playback works without storage. */
    }
  }, [score]);
  useEffect(() => {
    if (notice) {
      const t = setTimeout(() => setNotice(""), 4800);
      return () => clearTimeout(t);
    }
  }, [notice]);
  useEffect(() => {
    if (help)
      return () => {
        helpTrigger.current?.focus();
      };
  }, [help]);
  useEffect(() => {
    const tick = () => {
      for (const event of orchestra.drain()) {
        setStep(event.step);
        setProgress(event.crescendo);
        // A look-ahead evolution event must not overwrite a later user edit.
        if (event.score && event.score === orchestra.score) {
          scoreRef.current = event.score;
          setScore(event.score);
        }
        if (event.drop) {
          setBuilding(false);
          setProgress(0);
          setDrop((v) => v + 1);
        }
      }
      frame.current = requestAnimationFrame(tick);
    };
    frame.current = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(frame.current);
      orchestra.stop();
      orchestra.stopRecording();
    };
  }, []);

  const release = useCallback((key: string) => {
    const note = held.current.get(key);
    if (note) {
      note.released = true;
      note.release?.();
      held.current.delete(key);
    }
    setActiveNotes((notes) => notes.filter((n) => `pad-${n}` !== key));
  }, []);
  const releaseAll = useCallback(() => {
    for (const key of held.current.keys()) release(key);
  }, [release]);
  const playPad = useCallback(
    async (index: number) => {
      const key = `pad-${index}`;
      if (held.current.has(key)) return;
      const entry = {
        released: false,
        release: undefined as (() => void) | undefined,
      };
      held.current.set(key, entry);
      setActiveNotes((notes) => [...notes, index]);
      const id = selectedRef.current,
        midi = padNotes(scoreRef.current, id)[index];
      setCaptured((notes) =>
        [...notes, { midi, time: performance.now() }].slice(-16),
      );
      try {
        entry.release = await orchestra.live(id, midi);
        orchestra.setSpace(space);
        if (entry.released) entry.release();
      } catch (error) {
        setNotice((error as Error).message);
        release(key);
      }
    },
    [release, space],
  );

  const togglePlay = useCallback(async () => {
    if (busy.current) return;
    if (orchestra.playing) {
      orchestra.stop();
      setPlaying(false);
      setStep(-1);
      setBuilding(false);
      setProgress(0);
      releaseAll();
      return;
    }
    busy.current = true;
    try {
      await orchestra.start();
      orchestra.setSpace(space);
      setPlaying(orchestra.playing);
    } catch (error) {
      setNotice((error as Error).message);
    } finally {
      busy.current = false;
    }
  }, [releaseAll, space]);

  const select = (id: InstrumentId) => {
    if (selectedRef.current === id) return;
    releaseAll();
    setSelected(id);
    setCaptured([]);
  };
  const newMovement = useCallback(
    (sceneId?: SceneId) => {
      releaseAll();
      setCaptured([]);
      setBuilding(false);
      setProgress(0);
      setStep(0);
      setSolo(null);
      orchestra.setSolo(null);
      const next = compose(
        sceneId ?? scoreRef.current.scene,
        undefined,
        energy,
      );
      apply(next);
      setNotice("A new movement. Make it yours.");
    },
    [apply, energy, releaseAll],
  );
  const toggleEvolution = useCallback(() => {
    setEvolving((v) => {
      orchestra.autoEvolve = !v;
      return !v;
    });
  }, []);
  const build = useCallback(() => {
    if (!orchestra.playing) {
      setNotice("Press Play, then shape a crescendo.");
      return;
    }
    if (orchestra.crescendo()) setBuilding(true);
  }, []);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setHelp(false);
        releaseAll();
        return;
      }
      if (help) return;
      if (
        e.ctrlKey ||
        e.metaKey ||
        e.altKey ||
        (e.target instanceof HTMLElement &&
          (e.target.closest("input, textarea, select, [role=dialog]") ||
            e.target.isContentEditable))
      )
        return;
      if (e.code === "Space") {
        // Let focused buttons/links keep their native keyboard activation.
        if (e.target instanceof HTMLElement && e.target.closest("button, a")) return;
        e.preventDefault();
        if (!e.repeat) void togglePlay();
        return;
      }
      if (e.repeat) return;
      const index = KEYS.indexOf(e.key.toLowerCase());
      if (index >= 0) {
        e.preventDefault();
        void playPad(index);
      }
    };
    const up = (e: KeyboardEvent) => {
      const i = KEYS.indexOf(e.key.toLowerCase());
      if (i >= 0) release(`pad-${i}`);
    };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    window.addEventListener("blur", releaseAll);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
      window.removeEventListener("blur", releaseAll);
    };
  }, [help, playPad, release, releaseAll, togglePlay]);

  const updatePart = (
    id: InstrumentId,
    update: Partial<Score["parts"][InstrumentId]>,
  ) =>
    apply({
      ...scoreRef.current,
      parts: {
        ...scoreRef.current.parts,
        [id]: { ...scoreRef.current.parts[id], ...update },
      },
    });
  const weavePhrase = () => {
    if (!captured.length) return;
    if (score.parts[selected].layers >= MAX_LAYERS) {
      setNotice("Three layers are woven in. Undo one to add another.");
      return;
    }
    apply(weave(scoreRef.current, selected, captured));
    setCaptured([]);
    setNotice(
      `Your phrase is woven into ${instrumentFor(selected).name.toLowerCase()}. Auto-evolve will preserve it.`,
    );
    if (!orchestra.playing) void togglePlay();
  };
  const toggleRecording = async () => {
    if (recording) {
      orchestra.stopRecording();
      setRecording(false);
      setNotice("Your recording is downloading.");
      return;
    }
    try {
      await orchestra.startRecording();
      setRecording(true);
      if (!orchestra.playing) await togglePlay();
    } catch (error) {
      setNotice((error as Error).message);
    }
  };
  const exportScore = () => {
    const blob = new Blob([JSON.stringify(scoreRef.current, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob),
      anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "symphone-score.json";
    anchor.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    setNotice("Score exported. Your session is also saved in this browser.");
  };
  const instrument = instrumentFor(selected),
    part = score.parts[selected],
    scene = sceneFor(score.scene);
  const readyCount = Object.values(statuses).filter(
    (status) => status === "ready",
  ).length;
  const loading = Object.values(statuses).some(
    (status) => status === "loading",
  );
  const failed = Object.values(statuses).some(
    (status) => status === "fallback",
  );
  const notes = padNotes(score, selected);
  const statusText = (id: InstrumentId, status: SampleStatus) =>
    id === "pulse" || id === "texture"
      ? "Analog synthesis"
      : status === "ready"
        ? "Sampled instrument"
        : status === "loading"
          ? "Loading samples · synth active"
          : status === "fallback"
            ? "Offline synth voice"
            : "Samples load when you play";

  return (
    <div className={`studio ${playing ? "playing" : ""}`}>
      <header className="site-header">
        <a className="wordmark" href="#" aria-label="Symphone home">
          <span className="brand-icon">
            <i />
            <i />
            <i />
            <i />
          </span>
          symphone<span className="brand-period">.</span>
        </a>
        <div className="header-caption">
          THE ORCHESTRA STUDIO<span>Acoustic / Electronic</span>
        </div>
        <div className="header-actions">
          <span className="local-label">
            <span />
            Saved on this device
          </span>
          <button
            className="icon-button help-button"
            onClick={(e) => {
              helpTrigger.current = e.currentTarget;
              setHelp(true);
            }}
            aria-label="How to play"
          >
            <HelpCircle size={19} />
          </button>
          <button className="text-button export-button" onClick={exportScore}>
            <Download size={15} />
            Export score
          </button>
        </div>
      </header>

      <main>
        <section className="hero">
          <div className="hero-copy">
            <div className="eyebrow">
              <span className="tiny-line" />
              STUDIO 01 / THE CONDUCTOR’S DESK
            </div>
            <h1>
              At the <em>podium.</em>
            </h1>
            <p>
              An orchestra, ready for your ideas. Choose a section,
              <br className="desktop-break" /> play a phrase, and hear it find
              its place.
            </p>
            <div className="movement-program">
              <span className="program-number">I.</span>
              <div>
                <span>NOW ON THE MUSIC STAND</span>
                <strong>{scene.name}</strong>
                <small>
                  {scene.mode} · {score.bpm} beats per minute · 8 bars
                </small>
              </div>
            </div>
          </div>
          <div className="hero-stage">
            <div className="stage-topline">
              <span>THE STAGE</span>
              <span>Click a section to take your seat</span>
            </div>
            <Ensemble
              playing={playing}
              selected={selected}
              onSelect={select}
              crescendo={progress}
              step={step}
              score={score}
              solo={solo}
              livePlaying={activeNotes.length > 0}
            />
          </div>
        </section>

        <section className="transport" aria-label="Playback controls">
          <button
            className={`play-button ${playing ? "active" : ""}`}
            onClick={() => void togglePlay()}
            aria-label={playing ? "Stop orchestra" : "Play orchestra"}
          >
            {playing ? (
              <Square size={16} fill="currentColor" />
            ) : (
              <Play size={17} fill="currentColor" />
            )}
            <span>{playing ? "Stop" : "Play orchestra"}</span>
            <kbd>SPACE</kbd>
          </button>
          <div className="tempo">
            <input
              aria-label="Tempo in BPM"
              type="number"
              min="50"
              max="160"
              value={score.bpm}
              onChange={(e) => {
                const bpm = Number(e.target.value);
                if (Number.isFinite(bpm))
                  apply({
                    ...scoreRef.current,
                    bpm: Math.max(50, Math.min(160, bpm)),
                  });
              }}
            />
            <span
              title={
                scene.meter === "6/8"
                  ? "BPM counts dotted-quarter beats: two beats per bar"
                  : "BPM counts quarter-note beats"
              }
            >
              BPM{scene.meter === "6/8" ? " · ♩." : ""}
            </span>
          </div>
          <span className="transport-divider" />
          <div className="key-signature">
            <Music2 size={15} />
            {scene.mode}
            <span>{scene.meter}</span>
          </div>
          <div className="transport-spacer" />
          <button
            className={`control-button evolution ${evolving ? "enabled" : ""}`}
            onClick={toggleEvolution}
            aria-pressed={evolving}
          >
            <Sparkles size={15} />
            <span>Auto-evolve</span>
            <i className="toggle-indicator" />
          </button>
          <button
            className={`control-button crescendo ${building ? "enabled" : ""}`}
            onClick={build}
            disabled={building}
          >
            <Waves size={16} />
            <span>{building ? "Building…" : "Crescendo"}</span>
            {building ? (
              <span className="crescendo-percent">
                {Math.round(progress * 100)}%
              </span>
            ) : (
              <ArrowUpRight size={14} />
            )}
          </button>
          <button
            className={`record-button ${recording ? "recording" : ""}`}
            onClick={() => void toggleRecording()}
            aria-label={recording ? "Save audio recording" : "Record audio"}
          >
            <Circle size={12} fill="currentColor" />
            <span>{recording ? "Save audio" : "Record"}</span>
          </button>
        </section>

        <SceneLibrary
          selected={score.scene}
          onChoose={newMovement}
          onNew={() => newMovement()}
        />

        <div className="workspace">
          <section
            className="arrangement panel"
            aria-labelledby="arrangement-heading"
          >
            <div className="panel-heading">
              <div>
                <div className="eyebrow">THE WORKING SCORE</div>
                <h2 id="arrangement-heading">
                  Full orchestra<span className="section-count">08</span>
                </h2>
              </div>
              <span className="bar-readout">
                <span className={`status-light ${playing ? "live" : ""}`} />
                {playing
                  ? `BAR ${Math.floor(step < 0 ? 0 : step / stepsPerBar(score)) + 1} / ${BARS}`
                  : "READY WHEN YOU ARE"}
              </span>
            </div>
            <div
              className="score"
              role="group"
              aria-label="Eight-bar orchestral score"
            >
              <div className="score-ruler">
                <span>INSTRUMENT</span>
                <div>
                  {Array.from({ length: BARS }, (_, i) => (
                    <span
                      key={i}
                      className={
                        playing && Math.floor(step / stepsPerBar(score)) === i
                          ? "current"
                          : ""
                      }
                    >
                      {String(i + 1).padStart(2, "0")}
                    </span>
                  ))}
                </div>
                <span>LEVEL</span>
              </div>
              {INSTRUMENTS.map((inst, index) => {
                const track = score.parts[inst.id],
                  muted = track.muted || (solo && solo !== inst.id);
                const pitches = track.notes.map((note) => note.midi),
                  min = Math.min(...pitches),
                  max = Math.max(...pitches);
                return (
                  <div
                    key={inst.id}
                    className={`track ${selected === inst.id ? "selected" : ""} ${muted ? "muted" : ""}`}
                    style={{ "--section-color": inst.color } as CSSProperties}
                  >
                    <button
                      className="track-label"
                      onClick={() => select(inst.id)}
                      aria-pressed={selected === inst.id}
                    >
                      <span className="track-index">
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      <InstrumentGlyph id={inst.id} size={20} />
                      <span>
                        {inst.name}
                        {track.layers > 0 && (
                          <small>YOUR PHRASE · {track.layers}</small>
                        )}
                      </span>
                    </button>
                    <button
                      className="piano-roll"
                      onClick={() => select(inst.id)}
                      aria-label={`Select ${inst.name} score`}
                    >
                      <span className="bar-grid" />
                      {track.notes.map((note, i) => (
                        <i
                          key={i}
                          className={
                            playing &&
                            step >= note.step &&
                            step < note.step + note.duration
                              ? "sounding"
                              : ""
                          }
                          style={{
                            left: `${(note.step / totalSteps(score)) * 100}%`,
                            width: `${Math.max(0.3, (note.duration / totalSteps(score)) * 100)}%`,
                            top: `${8 + (1 - (note.midi - min) / Math.max(1, max - min)) * 65}%`,
                            opacity: note.layer
                              ? 0.95
                              : 0.3 + note.velocity * 0.55,
                          }}
                        />
                      ))}
                    </button>
                    <button
                      className="track-mute"
                      onClick={() =>
                        updatePart(inst.id, { muted: !track.muted })
                      }
                      aria-label={`${track.muted ? "Unmute" : "Mute"} ${inst.name}`}
                      aria-pressed={track.muted}
                    >
                      {track.muted ? (
                        <VolumeX size={13} />
                      ) : (
                        <Volume2 size={13} />
                      )}
                    </button>
                  </div>
                );
              })}
              {playing && step >= 0 && (
                <span className="playhead-track" aria-hidden="true">
                  <span
                    className="playhead"
                    style={{ left: `${(step / totalSteps(score)) * 100}%` }}
                  />
                </span>
              )}
            </div>
            <div className="arrangement-footer">
              <span>
                <span className="legend-dot acoustic" />
                ACOUSTIC SECTIONS
              </span>
              <span>
                <span className="legend-dot electronic" />
                ELECTRONIC TEXTURES
              </span>
              <span className="evolve-note">
                {evolving
                  ? "One section evolves every 2 bars"
                  : "Eight bars · Repeating movement"}
              </span>
            </div>
            <div className="mix-controls">
              <label>
                <span>
                  Intensity <small>{Math.round(energy * 100)}%</small>
                </span>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={energy}
                  onChange={(e) => setEnergy(Number(e.target.value))}
                  onPointerUp={() =>
                    apply(reorchestrate(scoreRef.current, energy))
                  }
                  onKeyUp={() => apply(reorchestrate(scoreRef.current, energy))}
                />
                <div>
                  <small>Intimate</small>
                  <small>Epic</small>
                </div>
              </label>
              <span />
              <label>
                <span>
                  Room <small>{Math.round(space * 100)}%</small>
                </span>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={space}
                  onChange={(e) => {
                    setSpace(Number(e.target.value));
                    orchestra.setSpace(Number(e.target.value));
                  }}
                />
                <div>
                  <small>Close</small>
                  <small>Concert hall</small>
                </div>
              </label>
            </div>
          </section>

          <section
            className="instrument-panel panel"
            style={{ "--section-color": instrument.color } as CSSProperties}
            aria-labelledby="instrument-heading"
          >
            <div className="instrument-heading">
              <span className="eyebrow">TAKE A SEAT</span>
              <span className="live-badge">
                <span />
                PLAY LIVE
              </span>
            </div>
            <div className="instrument-title">
              <span className="instrument-large-icon">
                <InstrumentGlyph id={selected} size={40} />
              </span>
              <div>
                <h2 id="instrument-heading">{instrument.name}</h2>
                <span>
                  {instrument.family}
                  <i /> {statusText(selected, statuses[selected])}
                </span>
              </div>
            </div>
            <p className="instrument-description">
              {instrument.role}. Every pad is in key.
            </p>
            <div
              className="instrument-picker"
              aria-label="Select an instrument"
            >
              {INSTRUMENTS.map((inst) => (
                <button
                  key={inst.id}
                  onClick={() => select(inst.id)}
                  className={selected === inst.id ? "selected" : ""}
                  title={inst.name}
                  aria-label={`Play ${inst.name}`}
                  aria-pressed={selected === inst.id}
                >
                  <InstrumentGlyph id={inst.id} size={23} />
                </button>
              ))}
            </div>
            <div className="pad-hint">
              <span>PLAY A LITTLE SOMETHING</span>
              <span>A — K ON YOUR KEYBOARD</span>
            </div>
            <div className="pads">
              {notes.map((midi, i) => (
                <button
                  key={`${selected}-${i}`}
                  className={`note-pad ${activeNotes.includes(i) ? "held" : ""} ${i === 0 || i === 7 ? "root-note" : ""}`}
                  aria-label={`Play ${noteName(midi)}${Math.floor(midi / 12) - 1} on ${instrument.name}`}
                  onPointerDown={(e) => {
                    e.preventDefault();
                    e.currentTarget.setPointerCapture(e.pointerId);
                    void playPad(i);
                  }}
                  onPointerUp={() => release(`pad-${i}`)}
                  onPointerCancel={() => release(`pad-${i}`)}
                  onLostPointerCapture={() => release(`pad-${i}`)}
                  onKeyDown={(e) => {
                    if ((e.key === "Enter" || e.key === " ") && !e.repeat) {
                      e.preventDefault();
                      e.stopPropagation();
                      void playPad(i);
                    }
                  }}
                  onKeyUp={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      e.stopPropagation();
                      release(`pad-${i}`);
                    }
                  }}
                >
                  <kbd>{KEYS[i].toUpperCase()}</kbd>
                  <span>
                    {noteName(midi)}
                    <small>{Math.floor(midi / 12) - 1}</small>
                  </span>
                  <i />
                </button>
              ))}
            </div>
            <div className="phrase-area">
              <div className="phrase-header">
                <span>
                  YOUR PHRASE{" "}
                  <small>
                    {part.layers}/{MAX_LAYERS} LAYERS
                  </small>
                </span>
                {captured.length > 0 && (
                  <button
                    onClick={() => setCaptured([])}
                    aria-label="Clear captured notes"
                  >
                    <X size={13} />
                    Clear
                  </button>
                )}
              </div>
              <div className="captured-notes" aria-live="polite">
                {captured.length ? (
                  captured.map((note, i) => (
                    <span key={i}>{noteName(note.midi)}</span>
                  ))
                ) : (
                  <p>Tap a few pads. Find a phrase you love.</p>
                )}
              </div>
              <div className="weave-actions">
                <button
                  className="weave-button"
                  onClick={weavePhrase}
                  disabled={!captured.length || part.layers >= MAX_LAYERS}
                >
                  <Sparkles size={15} />
                  {part.layers ? "Layer your phrase" : "Weave into orchestra"}
                  <ArrowUpRight size={16} />
                </button>
                <button
                  className="undo-button"
                  onClick={() => apply(undoLayer(scoreRef.current, selected))}
                  disabled={part.layers === 0}
                  aria-label="Undo last phrase layer"
                >
                  <RotateCcw size={16} />
                </button>
              </div>
              <p className="phrase-footnote">
                Your notes. Your timing. The ensemble keeps up.
              </p>
            </div>
            <div className="section-mix">
              <button
                onClick={() => {
                  const next = solo === selected ? null : selected;
                  orchestra.setSolo(next);
                  setSolo(next);
                }}
                className={solo === selected ? "enabled" : ""}
                aria-pressed={solo === selected}
              >
                <Headphones size={14} />
                Solo section
              </button>
              <label>
                <Volume2 size={13} />
                <input
                  aria-label={`${instrument.name} volume`}
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={part.volume}
                  onChange={(e) =>
                    updatePart(selected, { volume: Number(e.target.value) })
                  }
                />
              </label>
            </div>
          </section>
        </div>

        <footer className="site-footer">
          <span className="footer-note">
            <Music2 size={14} />
            Space to play / A–K for your instrument
          </span>
          <span className={`audio-status ${loading ? "loading" : ""}`}>
            <i />
            {loading
              ? `Preparing instruments · ${readyCount}/6`
              : readyCount === 6
                ? "All instruments ready"
                : failed
                  ? `${readyCount}/6 sampled · synth fallback active`
                  : "Sound begins with your first note"}
          </span>
          <span>SYMPHONE / STUDIO 01</span>
        </footer>
      </main>

      {notice && (
        <div className="toast" role="status">
          {notice}
          <button
            onClick={() => setNotice("")}
            aria-label="Dismiss notification"
          >
            <X size={15} />
          </button>
        </div>
      )}
      {drop > 0 && <div key={drop} className="drop-flash" aria-hidden="true" />}

      <GuidedTour firstVisit={tourFirstVisit} run={tourRun} />
      {help && (
        <div className="modal-backdrop" onClick={() => setHelp(false)}>
          <div
            className="help-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="help-title"
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => {
              if (e.key === "Tab") {
                const buttons =
                  e.currentTarget.querySelectorAll<HTMLButtonElement>("button");
                const first = buttons[0],
                  last = buttons[buttons.length - 1];
                if (e.shiftKey && document.activeElement === first) {
                  e.preventDefault();
                  last.focus();
                } else if (!e.shiftKey && document.activeElement === last) {
                  e.preventDefault();
                  first.focus();
                }
              }
            }}
          >
            <button
              className="modal-close icon-button"
              autoFocus
              onClick={() => setHelp(false)}
              aria-label="Close instructions"
            >
              <X size={20} />
            </button>
            <span className="eyebrow">A SMALL GUIDE TO A BIG SOUND</span>
            <h2 id="help-title">You’re the conductor.</h2>
            <button
              className="tour-restart"
              onClick={() => {
                setHelp(false);
                setTourRun((run) => run + 1);
              }}
            >
              <HelpCircle size={16} /> Take the guided tour
            </button>
            <ol>
              <li>
                <strong>Start a movement.</strong> Press Play or Space. Choose a
                scene to change the musical mood.
              </li>
              <li>
                <strong>Take an instrument.</strong> Click a section in the
                score, then play A–K or tap its pads. Hold a pad to sustain it.
              </li>
              <li>
                <strong>Make it yours.</strong> Play up to 16 notes and weave a
                two-bar phrase into the ensemble. Add up to three layers per
                instrument. Undo restores the last layer; removing all layers
                restores the original part.
              </li>
              <li>
                <strong>Let it grow.</strong> Auto-evolve varies a section every
                two bars while preserving your phrases. Crescendo strips out the
                low end, builds tension, and brings everyone back together.
              </li>
              <li>
                <strong>Keep the moment.</strong> Record captures the browser’s
                mix, including live notes. Save audio downloads it. Your score
                is saved locally as you work.
              </li>
            </ol>
            <p>
              Acoustic samples load over the internet after your first
              interaction. Synthesized voices keep the orchestra playable when
              samples are unavailable. A new movement or scene starts a fresh
              score and clears your custom phrases.
            </p>
            <button className="weave-button" onClick={() => setHelp(false)}>
              Let’s play <ArrowRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
