"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  Circle,
  Clock,
  Compass,
  Download,
  FastForward,
  Headphones,
  HelpCircle,
  Layers,
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
import {
  orchestra,
  BUILDUP_STAGES,
  BUILDUP_STAGE_NAMES,
  type SampleStatus,
} from "../lib/audio";
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
const LEGACY_STORAGE_KEY = "symphone.legacy.score.v1";

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

export default function Orchestra({
  initialMode = "full",
}: {
  initialMode?: "full" | "build";
}) {
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
  const [tourFirstVisit] = useState(() =>
    shouldOfferTour(browserTourStorage()),
  );
  const [tourRun, setTourRun] = useState(0);
  const [drop, setDrop] = useState(0);

  // Buildup mode & eventual cycle layer states
  const [buildMode, setBuildMode] = useState(initialMode === "build");
  const [buildupStage, setBuildupStage] = useState(0);
  const [queuedLayers, setQueuedLayers] = useState<
    Array<{ id: InstrumentId; captured: CapturedNote[] }>
  >([]);

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
    orchestra.setBuildMode(initialMode === "build");
    orchestra.setScore(scoreRef.current);
    return orchestra.subscribeStatus(() => setStatuses(orchestra.sampleStatus));
  }, [initialMode]);

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

        if (event.buildupStage !== undefined) {
          setBuildupStage(event.buildupStage);
        }

        if (event.newBuildupStage && event.buildupStage !== undefined) {
          const st = BUILDUP_STAGE_NAMES[event.buildupStage];
          if (st) {
            setNotice(`Crescendo: ${st.entering} have joined the orchestra!`);
          }
        }

        if (event.layerApplied && event.layerApplied.length > 0) {
          for (const applied of event.layerApplied) {
            setQueuedLayers((prev) => prev.filter((q) => q.id !== applied.id));
            setNotice(
              `${instrumentFor(applied.id).name}: Your woven layer has joined the performance!`,
            );
          }
        }

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

  const toggleBuildMode = useCallback(
    (enable?: boolean) => {
      const next = enable !== undefined ? enable : !buildMode;
      setBuildMode(next);
      orchestra.setBuildMode(next);
      setBuildupStage(0);
      setNotice(
        next
          ? "Build mode active: instruments will enter cycle by cycle."
          : "Full orchestra active: all sections sounding in concert.",
      );
    },
    [buildMode],
  );

  const advanceStage = useCallback(() => {
    if (orchestra.advanceBuildup()) {
      setBuildupStage(orchestra.buildupStage);
      const st = BUILDUP_STAGE_NAMES[orchestra.buildupStage];
      setNotice(`Stage ${orchestra.buildupStage + 1}: ${st.entering} joined.`);
    }
  }, []);

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
      orchestra.cancelQueuedWeave();
      setQueuedLayers([]);
      const next = compose(
        sceneId ?? scoreRef.current.scene,
        undefined,
        energy,
      );
      apply(next);
      setNotice("A new movement begins. Take your seat.");
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
      setNotice("Press Play, then shape an orchestral crescendo.");
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
        if (e.target instanceof HTMLElement && e.target.closest("button, a"))
          return;
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

  // Eventual cycle weaving: queue for next cycle downbeat or immediate weave
  const weavePhrase = (immediate = false) => {
    if (!captured.length) return;
    if (score.parts[selected].layers >= MAX_LAYERS) {
      setNotice("Three layers are woven in. Undo one to add another.");
      return;
    }

    if (immediate || !orchestra.playing) {
      apply(weave(scoreRef.current, selected, captured));
      setCaptured([]);
      setQueuedLayers((prev) => prev.filter((q) => q.id !== selected));
      setNotice(
        `Phrase woven into ${instrumentFor(selected).name.toLowerCase()}.`,
      );
      if (!orchestra.playing) void togglePlay();
    } else {
      // Eventual cycle entry
      orchestra.queueWeave(selected, captured);
      setQueuedLayers((prev) => [
        ...prev.filter((q) => q.id !== selected),
        { id: selected, captured },
      ]);
      setCaptured([]);
      setNotice(
        `Your phrase is queued for ${instrumentFor(selected).name.toLowerCase()} · Enters on next cycle downbeat.`,
      );
    }
  };

  const cancelQueued = (id: InstrumentId) => {
    orchestra.cancelQueuedWeave(id);
    setQueuedLayers((prev) => prev.filter((q) => q.id !== id));
    setNotice("Queued phrase cancelled.");
  };

  const applyQueuedNow = (id: InstrumentId) => {
    const q = queuedLayers.find((item) => item.id === id);
    if (!q) return;
    orchestra.cancelQueuedWeave(id);
    setQueuedLayers((prev) => prev.filter((item) => item.id !== id));
    apply(weave(scoreRef.current, id, q.captured));
    setNotice(
      `Layer applied immediately into ${instrumentFor(id).name.toLowerCase()}.`,
    );
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

  const selectedIsQueued = queuedLayers.some((q) => q.id === selected);

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
      {/* Concert Hall Header */}
      <header className="site-header">
        <Link
          className="wordmark"
          href="/"
          aria-label="Return to Symphone Home"
        >
          <span className="brand-icon">
            <i />
            <i />
            <i />
            <i />
          </span>
          <span className="brand-text">SYMPHONE</span>
        </Link>

        <div className="header-caption">
          THE CONCERT HALL STUDIO
          <span>Acoustic / Electronic Hybrid Orchestra</span>
        </div>

        <div className="header-actions">
          <Link href="/" className="back-home-btn" title="Return to home page">
            ← Home
          </Link>

          <div className="mode-pill-header">
            {buildMode ? (
              <span className="mode-tag build">
                <Sparkles size={13} />
                Build Mode · Stage {buildupStage + 1}/4
              </span>
            ) : (
              <span className="mode-tag full">
                <Music2 size={13} />
                Full Orchestra
              </span>
            )}
          </div>

          <button
            className="icon-button help-button"
            onClick={(e) => {
              helpTrigger.current = e.currentTarget;
              setHelp(true);
            }}
            aria-label="How to play"
            title="Conductor's Guide"
          >
            <HelpCircle size={20} />
          </button>
          <button className="text-button export-button" onClick={exportScore}>
            <Download size={16} />
            Export Score
          </button>
        </div>
      </header>

      <main>
        {/* The Conductor's Podium & 3D Stage */}
        <section
          id="conductor-podium"
          className="podium-section"
          aria-label="Conductor's Podium"
        >
          <div className="podium-topline">
            <div className="current-movement-pill">
              <span className="pill-dot" />
              <strong>{scene.name}</strong>
              <span>
                {scene.mode} · {score.bpm} BPM · {scene.meter}
              </span>
            </div>
            <div className="stage-legend-hint">
              <span>Click any section on stage to take your seat</span>
            </div>
          </div>

          <div className="podium-stage-frame">
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

        {/* Conductor's Transport Bar */}
        <section className="transport" aria-label="Playback controls">
          <button
            className={`play-button ${playing ? "active" : ""}`}
            onClick={() => void togglePlay()}
            aria-label={playing ? "Stop orchestra" : "Play orchestra"}
          >
            {playing ? (
              <Square size={18} fill="currentColor" />
            ) : (
              <Play size={18} fill="currentColor" />
            )}
            <span>{playing ? "Stop" : "Play Orchestra"}</span>
            <kbd>SPACE</kbd>
          </button>

          {/* Sound Mode Switcher: Full Orchestra vs Build Sound Eventually */}
          <div
            className="sound-mode-switcher"
            role="group"
            aria-label="Orchestral sound mode"
          >
            <button
              className={`mode-btn ${!buildMode ? "active" : ""}`}
              onClick={() => toggleBuildMode(false)}
              aria-pressed={!buildMode}
              title="Already created sound: all 8 sections play from bar 1"
            >
              <Music2 size={15} />
              <span>Full Orchestra</span>
            </button>
            <button
              className={`mode-btn ${buildMode ? "active" : ""}`}
              onClick={() => toggleBuildMode(true)}
              aria-pressed={buildMode}
              title="Build sound eventually: sections enter progressively across cycles"
            >
              <Sparkles size={15} />
              <span>Build Eventually</span>
            </button>

            {buildMode && (
              <div className="buildup-tracker">
                <span className="stage-name">
                  Stage {buildupStage + 1}/4:{" "}
                  {BUILDUP_STAGE_NAMES[buildupStage].name}
                </span>
                <span className="stage-entering">
                  ({BUILDUP_STAGE_NAMES[buildupStage].entering})
                </span>
                {buildupStage < BUILDUP_STAGES.length - 1 && (
                  <button
                    className="advance-stage-btn"
                    onClick={advanceStage}
                    title="Advance to next section entrance immediately"
                  >
                    <FastForward size={13} />
                    Next Stage
                  </button>
                )}
              </div>
            )}
          </div>

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
            <Music2 size={16} />
            <strong>{scene.mode}</strong>
            <span className="meter-badge">{scene.meter}</span>
          </div>

          <div className="transport-spacer" />

          <button
            className={`control-button evolution ${evolving ? "enabled" : ""}`}
            onClick={toggleEvolution}
            aria-pressed={evolving}
            title="Auto-evolve one section every 2 bars"
          >
            <Sparkles size={16} />
            <span>Auto-evolve</span>
            <i className="toggle-indicator" />
          </button>

          <button
            className={`control-button crescendo ${building ? "enabled" : ""}`}
            onClick={build}
            disabled={building}
            title="Trigger an orchestral crescendo build"
          >
            <Waves size={17} />
            <span>{building ? "Building…" : "Crescendo"}</span>
            {building ? (
              <span className="crescendo-percent">
                {Math.round(progress * 100)}%
              </span>
            ) : (
              <ArrowUpRight size={15} />
            )}
          </button>

          <button
            className={`record-button ${recording ? "recording" : ""}`}
            onClick={() => void toggleRecording()}
            aria-label={recording ? "Save audio recording" : "Record audio"}
          >
            <Circle size={14} fill="currentColor" />
            <span>{recording ? "Save Audio" : "Record"}</span>
          </button>
        </section>

        {/* Scene Library: 12 Musical Worlds */}
        <SceneLibrary
          selected={score.scene}
          onChoose={newMovement}
          onNew={() => newMovement()}
        />

        {/* Working Studio Workspace */}
        <div className="workspace">
          {/* Arrangement Score */}
          <section
            className="arrangement panel"
            aria-labelledby="arrangement-heading"
          >
            <div className="panel-heading">
              <div>
                <div className="eyebrow">THE WORKING SCORE</div>
                <h2 id="arrangement-heading">
                  Full Orchestra<span className="section-count">08</span>
                </h2>
              </div>
              <span className="bar-readout">
                <span className={`status-light ${playing ? "live" : ""}`} />
                {playing
                  ? `BAR ${Math.floor(step < 0 ? 0 : step / stepsPerBar(score)) + 1} OF ${BARS}`
                  : "READY AT THE PODIUM"}
              </span>
            </div>

            <div
              className="score"
              role="group"
              aria-label="Eight-bar orchestral score"
            >
              <div className="score-ruler">
                <span>SECTION</span>
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
                <span>MUTE</span>
              </div>

              {INSTRUMENTS.map((inst, index) => {
                const track = score.parts[inst.id],
                  muted = track.muted || (solo && solo !== inst.id);
                const pitches = track.notes.map((note) => note.midi),
                  min = Math.min(...pitches),
                  max = Math.max(...pitches);
                const isTrackQueued = queuedLayers.some(
                  (q) => q.id === inst.id,
                );

                return (
                  <div
                    key={inst.id}
                    className={`track ${selected === inst.id ? "selected" : ""} ${muted ? "muted" : ""} ${isTrackQueued ? "has-queued" : ""}`}
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
                      <InstrumentGlyph id={inst.id} size={22} />
                      <span className="track-title-block">
                        <span className="track-name">{inst.name}</span>
                        {track.layers > 0 && (
                          <span className="layer-tag">
                            {track.layers}{" "}
                            {track.layers === 1 ? "LAYER" : "LAYERS"}
                          </span>
                        )}
                        {isTrackQueued && (
                          <span className="queued-tag">
                            <Clock size={10} /> QUEUED
                          </span>
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
                            width: `${Math.max(0.4, (note.duration / totalSteps(score)) * 100)}%`,
                            top: `${8 + (1 - (note.midi - min) / Math.max(1, max - min)) * 65}%`,
                            opacity: note.layer
                              ? 0.95
                              : 0.35 + note.velocity * 0.55,
                          }}
                        />
                      ))}

                      {/* Ghost preview of queued layer if pending */}
                      {isTrackQueued && (
                        <span
                          className="queued-ghost-band"
                          title="Layer queued: enters on cycle downbeat"
                        />
                      )}
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
                        <VolumeX size={16} />
                      ) : (
                        <Volume2 size={16} />
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
                Acoustic Sections
              </span>
              <span>
                <span className="legend-dot electronic" />
                Electronic Textures
              </span>
              <span className="evolve-note">
                {evolving
                  ? "Auto-evolution active (every 2 bars)"
                  : "Repeating 8-bar symphonic movement"}
              </span>
            </div>

            <div className="mix-controls">
              <label>
                <span>
                  Intensity (Energy) <small>{Math.round(energy * 100)}%</small>
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
                <div className="slider-limits">
                  <small>Intimate</small>
                  <small>Grand</small>
                </div>
              </label>

              <span className="mix-divider" />

              <label>
                <span>
                  Concert Hall Depth (Room){" "}
                  <small>{Math.round(space * 100)}%</small>
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
                <div className="slider-limits">
                  <small>Dry</small>
                  <small>Symphony Hall</small>
                </div>
              </label>
            </div>
          </section>

          {/* Instrument & Performance Desk */}
          <section
            className="instrument-panel panel"
            style={{ "--section-color": instrument.color } as CSSProperties}
            aria-labelledby="instrument-heading"
          >
            <div className="instrument-heading">
              <span className="eyebrow">TAKE YOUR SEAT</span>
              <span className="live-badge">
                <span className="live-pulsing-dot" />
                PLAY LIVE (KEYS A–K)
              </span>
            </div>

            <div className="instrument-title">
              <span className="instrument-large-icon">
                <InstrumentGlyph id={selected} size={44} />
              </span>
              <div>
                <h2 id="instrument-heading">{instrument.name}</h2>
                <div className="instrument-meta-line">
                  <span className="instrument-family">{instrument.family}</span>
                  <i className="dot-sep" />
                  <span className="instrument-status">
                    {statusText(selected, statuses[selected])}
                  </span>
                </div>
              </div>
            </div>

            <p className="instrument-description">{instrument.role}.</p>

            {/* Quick 8-Section Selector */}
            <div
              className="instrument-picker"
              aria-label="Select an instrument section"
            >
              {INSTRUMENTS.map((inst) => (
                <button
                  key={inst.id}
                  onClick={() => select(inst.id)}
                  className={selected === inst.id ? "selected" : ""}
                  title={`${inst.name} (${inst.family})`}
                  aria-label={`Play ${inst.name}`}
                  aria-pressed={selected === inst.id}
                >
                  <InstrumentGlyph id={inst.id} size={24} />
                  <span className="inst-picker-label">{inst.name}</span>
                </button>
              ))}
            </div>

            {/* Live Performance Pads (A–K) */}
            <div className="pad-hint">
              <span>MAESTRO KEYBOARD</span>
              <span>A — K KEYS OR TAP PADS</span>
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
                  <span className="pad-note-name">
                    {noteName(midi)}
                    <small>{Math.floor(midi / 12) - 1}</small>
                  </span>
                  <i />
                </button>
              ))}
            </div>

            {/* Phrase Weaving & Eventual Cycle Queuing */}
            <div className="phrase-area">
              <div className="phrase-header">
                <span>
                  YOUR PHRASE{" "}
                  <span className="layer-count">
                    {part.layers}/{MAX_LAYERS} LAYERS
                  </span>
                </span>
                {captured.length > 0 && (
                  <button
                    className="clear-notes-btn"
                    onClick={() => setCaptured([])}
                    aria-label="Clear captured notes"
                  >
                    <X size={14} /> Clear
                  </button>
                )}
              </div>

              <div className="captured-notes" aria-live="polite">
                {captured.length ? (
                  captured.map((note, i) => (
                    <span key={i} className="captured-chip">
                      {noteName(note.midi)}
                      <small>{Math.floor(note.midi / 12) - 1}</small>
                    </span>
                  ))
                ) : (
                  <p className="no-notes-hint">
                    Tap a few pads with A–K to record notes for your phrase.
                  </p>
                )}
              </div>

              {/* Status if layer is currently queued for eventual cycle downbeat */}
              {selectedIsQueued && (
                <div className="queued-banner" role="status">
                  <Clock size={16} />
                  <div>
                    <strong>Layer Queued for Next Cycle</strong>
                    <span>
                      Enters on the next cycle downbeat. Ensemble will introduce
                      it seamlessly.
                    </span>
                  </div>
                  <button
                    className="apply-now-btn"
                    onClick={() => applyQueuedNow(selected)}
                    title="Force immediate entrance without waiting for cycle downbeat"
                  >
                    Enter Now
                  </button>
                  <button
                    className="cancel-queue-btn"
                    onClick={() => cancelQueued(selected)}
                    aria-label="Cancel queued layer"
                  >
                    <X size={14} />
                  </button>
                </div>
              )}

              {/* Weave Action Buttons: Eventual Cycle Queue vs Immediate */}
              <div className="weave-actions">
                <button
                  className="weave-button"
                  onClick={() => weavePhrase(false)}
                  disabled={!captured.length || part.layers >= MAX_LAYERS}
                  title="Queue phrase to enter musically at the start of the next cycle"
                >
                  <Sparkles size={16} />
                  {part.layers
                    ? "Queue Layer for Next Cycle"
                    : "Queue Phrase for Next Cycle"}
                  <ArrowUpRight size={17} />
                </button>

                {captured.length > 0 && part.layers < MAX_LAYERS && (
                  <button
                    className="weave-now-button"
                    onClick={() => weavePhrase(true)}
                    title="Weave phrase immediately into the score"
                  >
                    Weave Now
                  </button>
                )}

                <button
                  className="undo-button"
                  onClick={() => apply(undoLayer(scoreRef.current, selected))}
                  disabled={part.layers === 0}
                  aria-label="Undo last phrase layer"
                  title="Undo last woven layer"
                >
                  <RotateCcw size={18} />
                </button>
              </div>
            </div>

            {/* Section Mix Controls */}
            <div className="section-mix">
              <button
                onClick={() => {
                  const next = solo === selected ? null : selected;
                  orchestra.setSolo(next);
                  setSolo(next);
                }}
                className={`solo-btn ${solo === selected ? "enabled" : ""}`}
                aria-pressed={solo === selected}
              >
                <Headphones size={16} />
                {solo === selected ? "Soloing Section" : "Solo Section"}
              </button>

              <label className="section-volume-label">
                <Volume2 size={16} />
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

        {/* Concert Hall Footer */}
        <footer className="site-footer">
          <span className="footer-note">
            <Music2 size={16} />
            Space to Play & Stop · Keys A–K for Instrument Pads
          </span>
          <span className={`audio-status ${loading ? "loading" : ""}`}>
            <i />
            {loading
              ? `Preparing instruments · ${readyCount}/6 loaded`
              : readyCount === 6
                ? "All concert instruments ready"
                : failed
                  ? `${readyCount}/6 sampled · synth fallback active`
                  : "Audio engine initialized · Sound begins on play"}
          </span>
          <span className="footer-tag">SYMPHONE ORCHESTRA</span>
        </footer>
      </main>

      {/* Notifications Toast */}
      {notice && (
        <div className="toast" role="status">
          <Sparkles size={16} />
          <span>{notice}</span>
          <button
            onClick={() => setNotice("")}
            aria-label="Dismiss notification"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {drop > 0 && <div key={drop} className="drop-flash" aria-hidden="true" />}

      <GuidedTour firstVisit={tourFirstVisit} run={tourRun} />

      {/* Conductor's Guide Modal */}
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
              <X size={22} />
            </button>
            <span className="eyebrow">CONDUCTOR’S HANDBOOK</span>
            <h2 id="help-title">You’re at the podium.</h2>
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
                <strong>Start Full or Build Eventually.</strong> Choose{" "}
                <em>Full Orchestra</em> for immediate symphonic splendor, or{" "}
                <em>Build Eventually</em> to hear sections enter cycle by cycle
                into a grand ensemble.
              </li>
              <li>
                <strong>Conduct a movement.</strong> Press Space or Play. Browse
                the 12 scenes to explore Ballet, Classical, Folk, or Cinematic
                worlds.
              </li>
              <li>
                <strong>Take an instrument.</strong> Click any section on stage
                or in the score, then play keys A–K. Every pad is tuned to the
                movement’s scale.
              </li>
              <li>
                <strong>Weave phrases in eventual cycles.</strong> Play notes on
                the pads, then click <em>Queue Layer for Next Cycle</em>. Your
                melody enters smoothly on the next cycle downbeat.
              </li>
              <li>
                <strong>Build an orchestral crescendo.</strong> Hit Crescendo to
                strip low end, accelerate percussion, and trigger an ensemble
                impact.
              </li>
              <li>
                <strong>Capture the moment.</strong> Record downloads your full
                browser mix, including live playing, in pristine audio.
              </li>
            </ol>
            <button className="weave-button" onClick={() => setHelp(false)}>
              Enter the Hall <ArrowRight size={18} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
