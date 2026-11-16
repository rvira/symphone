import type { Soundfont } from "smplr";
import {
  evolveAtBoundary,
  playableScore,
  weave,
  INSTRUMENTS,
  stepsPerBar,
  totalSteps,
  secondsPerStep,
  type CapturedNote,
  type InstrumentId,
  type Score,
} from "./score";

type Sample = ReturnType<typeof Soundfont>;
type Release = () => void;
export type QueuedLayerApplied = {
  id: InstrumentId;
  layer: number;
};
export type PlaybackEvent = {
  time: number;
  step: number;
  score?: Score;
  crescendo: number;
  drop?: boolean;
  cycleBoundary?: boolean;
  layerApplied?: QueuedLayerApplied[];
  instrumentEntered?: InstrumentId;
};
export type SampleStatus = "not-loaded" | "loading" | "ready" | "fallback";
export const crescendoLength = (step: number, barLength = 16) =>
  barLength - (step % barLength) + barLength;

export class OrchestraEngine {
  private context: AudioContext | null = null;
  private master!: GainNode;
  private highpass!: BiquadFilterNode;
  private reverb!: ConvolverNode;
  private reverbGain!: GainNode;
  private recorderDestination!: MediaStreamAudioDestinationNode;
  private channels = new Map<InstrumentId, GainNode>();
  private samples = new Map<InstrumentId, Sample>();
  private releases = new Set<Release>();
  private timer: ReturnType<typeof setInterval> | null = null;
  private nextTime = 0;
  private absoluteStep = 0;
  private build: { remaining: number; total: number } | null = null;
  private events: PlaybackEvent[] = [];
  private recorder: MediaRecorder | null = null;
  private index = new Map<
    InstrumentId,
    Score["parts"][InstrumentId]["notes"][]
  >();
  private samplePromise: Promise<void> | null = null;
  private statusListeners = new Set<() => void>();
  private statuses = Object.fromEntries(
    INSTRUMENTS.map((i) => [i.id, "not-loaded"]),
  ) as Record<InstrumentId, SampleStatus>;
  score: Score | null = null;
  playing = false;
  autoEvolve = false;
  solo: InstrumentId | null = null;
  private pendingWeaves: Array<{ id: InstrumentId; captured: CapturedNote[] }> =
    [];

  get ctx() {
    return this.context;
  }
  get sampleStatus() {
    return { ...this.statuses };
  }
  subscribeStatus(listener: () => void) {
    this.statusListeners.add(listener);
    return () => {
      this.statusListeners.delete(listener);
    };
  }
  private setStatus(id: InstrumentId, status: SampleStatus) {
    this.statuses[id] = status;
    this.statusListeners.forEach((listener) => listener());
  }

  async init() {
    if (!this.context) {
      const Context = window.AudioContext;
      if (!Context)
        throw new Error(
          "This browser does not support Web Audio. Try a current Chrome, Safari or Firefox.",
        );
      const ctx = (this.context = new Context({ latencyHint: "interactive" }));
      this.master = ctx.createGain();
      this.master.gain.value = 1;
      this.highpass = ctx.createBiquadFilter();
      this.highpass.type = "highpass";
      this.highpass.frequency.value = 25;
      const compressor = ctx.createDynamicsCompressor();
      compressor.threshold.value = -20;
      compressor.ratio.value = 5;
      compressor.attack.value = 0.005;
      compressor.release.value = 0.2;
      const limiter = ctx.createDynamicsCompressor();
      limiter.threshold.value = -3;
      limiter.ratio.value = 20;
      this.master.connect(this.highpass);
      this.highpass.connect(compressor);
      compressor.connect(limiter);
      limiter.connect(ctx.destination);
      this.recorderDestination = ctx.createMediaStreamDestination();
      limiter.connect(this.recorderDestination);
      this.reverb = ctx.createConvolver();
      this.reverbGain = ctx.createGain();
      this.reverbGain.gain.value = 0.3;
      const impulse = ctx.createBuffer(2, ctx.sampleRate * 2.8, ctx.sampleRate);
      for (let ch = 0; ch < 2; ch++) {
        const data = impulse.getChannelData(ch);
        for (let i = 0; i < data.length; i++)
          data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / data.length, 3);
      }
      this.reverb.buffer = impulse;
      this.reverb.connect(this.reverbGain);
      this.reverbGain.connect(this.master);
      for (const inst of INSTRUMENTS) {
        const channel = ctx.createGain(),
          pan = ctx.createStereoPanner();
        channel.gain.value = inst.gain;
        pan.pan.value = inst.pan;
        channel.connect(pan);
        pan.connect(this.master);
        const send = ctx.createGain();
        send.gain.value = inst.id === "percussion" ? 0.25 : 0.55;
        pan.connect(send);
        send.connect(this.reverb);
        this.channels.set(inst.id, channel);
      }
      this.updateMix();
    }
    await this.context.resume();
    // Sample downloads never block playing; each acoustic voice has a local fallback.
    if (!this.samplePromise) this.samplePromise = this.loadSamples();
  }

  private async loadSamples() {
    const acoustic = INSTRUMENTS.filter((i) => i.soundfont);
    acoustic.forEach((i) => this.setStatus(i.id, "loading"));
    try {
      const { Soundfont } = await import("smplr");
      await Promise.allSettled(
        acoustic.map(async (inst) => {
          let timeout: ReturnType<typeof setTimeout> | undefined;
          try {
            // Decode only the useful register; other notes can use a nearby sample.
            const low = inst.register - 12;
            const sample = Soundfont(this.context!, {
              instrument: inst.soundfont!,
              kit: "MusyngKite",
              destination: this.channels.get(inst.id)!,
              notesToLoad: {
                notes: Array.from({ length: 37 }, (_, i) => low + i),
                fallback: "nearest",
              },
            });
            await Promise.race([
              sample.load,
              new Promise<never>((_, reject) => {
                timeout = setTimeout(
                  () => reject(new Error("Sample download timed out")),
                  20000,
                );
              }),
            ]);
            this.samples.set(inst.id, sample);
            this.setStatus(inst.id, "ready");
          } catch {
            this.setStatus(inst.id, "fallback");
          } finally {
            clearTimeout(timeout);
          }
        }),
      );
    } catch {
      acoustic.forEach((i) => this.setStatus(i.id, "fallback"));
    }
  }

  setScore(score: Score) {
    if (
      this.score &&
      (this.score.scene !== score.scene || this.score.seed !== score.seed)
    ) {
      // A new movement starts on its own downbeat, including when meter changes.
      this.absoluteStep = 0;
      this.build = null;
      this.events = [];
      for (const release of [...this.releases]) release();
      this.samples.forEach((sample) => sample.stop());
      if (this.context) {
        this.nextTime = this.context.currentTime + 0.06;
        this.highpass.frequency.cancelScheduledValues(this.context.currentTime);
        this.highpass.frequency.setValueAtTime(25, this.context.currentTime);
      }
    }
    this.score = score;
    for (const inst of INSTRUMENTS) {
      const steps = Array.from(
        { length: totalSteps(score) },
        () => [] as Score["parts"][InstrumentId]["notes"],
      );
      score.parts[inst.id].notes.forEach((note) =>
        steps[note.step]?.push(note),
      );
      this.index.set(inst.id, steps);
    }
    this.updateMix();
  }

  queueWeave(id: InstrumentId, captured: CapturedNote[]) {
    this.pendingWeaves = this.pendingWeaves.filter((w) => w.id !== id);
    this.pendingWeaves.push({ id, captured });
  }

  cancelQueuedWeave(id?: InstrumentId) {
    if (id) {
      this.pendingWeaves = this.pendingWeaves.filter((w) => w.id !== id);
    } else {
      this.pendingWeaves = [];
    }
  }

  getQueuedWeaves() {
    return [...this.pendingWeaves];
  }

  hasQueuedWeave(id?: InstrumentId) {
    if (id) return this.pendingWeaves.some((w) => w.id === id);
    return this.pendingWeaves.length > 0;
  }

  private updateMix() {
    if (!this.context || !this.score) return;
    for (const inst of INSTRUMENTS) {
      const part = this.score.parts[inst.id];
      const silent =
        part.muted || (this.solo !== null && this.solo !== inst.id);

      this.channels
        .get(inst.id)
        ?.gain.setTargetAtTime(
          silent ? 0 : inst.gain * part.volume,
          this.context.currentTime,
          0.03,
        );
    }
  }

  setSolo(id: InstrumentId | null) {
    this.solo = id;
    this.updateMix();
  }

  async start() {
    if (!this.score || !playableScore(this.score)) return;
    await this.init();
    if (this.playing || !this.score || !playableScore(this.score)) return;
    this.absoluteStep = 0;
    this.updateMix();
    this.nextTime = this.context!.currentTime + 0.06;
    this.playing = true;
    this.timer = setInterval(() => this.tick(), 25);
    this.tick();
  }

  stop() {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
    this.playing = false;
    this.build = null;
    this.events = [];
    for (const release of [...this.releases]) release();
    this.samples.forEach((sample) => sample.stop());
    if (this.context) {
      this.highpass.frequency.cancelScheduledValues(this.context.currentTime);
      this.highpass.frequency.setValueAtTime(25, this.context.currentTime);
    }
  }

  private tick() {
    if (!this.context || !this.score || !this.playing) return;
    const ctx = this.context;
    // Recover from a suspended/background tab without scheduling a burst of old notes.
    if (this.nextTime < ctx.currentTime - 0.2)
      this.nextTime = ctx.currentTime + 0.03;

    while (this.nextTime < ctx.currentTime + 0.1) {
      let drop = false,
        updated: Score | undefined;
      let instrumentEntered: InstrumentId | undefined;
      let appliedLayers: QueuedLayerApplied[] | undefined;

      if (this.build && this.build.remaining === 0) {
        this.build = null;
        this.absoluteStep = 0;
        drop = true;
        this.highpass.frequency.cancelScheduledValues(this.nextTime);
        this.highpass.frequency.setValueAtTime(25, this.nextTime);
        this.impact(this.nextTime);
      }

      const score = this.score!,
        step = this.absoluteStep % totalSteps(score);
      const isCycleBoundary =
        this.absoluteStep > 0 &&
        (step === 0 ||
          this.absoluteStep % (stepsPerBar(this.score!) * 2) === 0);

      // Queued user phrases enter on the full eight-bar movement boundary.
      if (
        this.absoluteStep > 0 &&
        step === 0 &&
        this.pendingWeaves.length > 0
      ) {
        appliedLayers = [];
        let curScore = updated ?? this.score!;
        for (const p of this.pendingWeaves) {
          curScore = weave(curScore, p.id, p.captured);
          appliedLayers.push({ id: p.id, layer: curScore.parts[p.id].layers });
        }
        this.pendingWeaves = [];
        updated = curScore;
        this.setScore(updated);
      }

      const beforeEvolution = updated ?? this.score!;
      const evolved = evolveAtBoundary(
        beforeEvolution,
        this.absoluteStep,
        this.autoEvolve && !this.build,
      );
      if (evolved !== beforeEvolution) {
        instrumentEntered = INSTRUMENTS.find(
          (i) =>
            !beforeEvolution.parts[i.id].notes.length &&
            evolved.parts[i.id].notes.length,
        )?.id;
        updated = evolved;
        this.setScore(updated);
      }

      const activeScore = updated ?? this.score!;

      const seconds = secondsPerStep(activeScore);
      const progress = this.build
        ? 1 - this.build.remaining / this.build.total
        : 0;

      for (const inst of INSTRUMENTS) {
        const part = activeScore.parts[inst.id];
        if (part.muted || (this.solo && this.solo !== inst.id)) continue;
        if (this.build && ["cello", "percussion", "pulse"].includes(inst.id))
          continue;

        for (const note of this.index.get(inst.id)![step]) {
          this.voice(
            inst.id,
            note.midi,
            this.nextTime,
            note.duration * seconds * 0.94,
            note.velocity,
          );
        }
      }

      if (this.build) {
        if (this.build.remaining <= 8 || step % 2 === 0)
          this.voice(
            "percussion",
            43,
            this.nextTime,
            seconds * 0.7,
            0.25 + progress * 0.65,
          );
        if (this.build.remaining <= 4)
          this.voice(
            "percussion",
            43,
            this.nextTime + seconds / 2,
            seconds * 0.4,
            0.6,
          );
        this.build.remaining--;
      }

      this.events.push({
        time: this.nextTime,
        step,
        score: updated,
        crescendo: progress,
        drop,
        cycleBoundary: isCycleBoundary,
        instrumentEntered,
        layerApplied: appliedLayers,
      });

      this.absoluteStep++;
      this.nextTime += seconds;
    }
  }
  drain(): PlaybackEvent[] {
    const now = this.context?.currentTime ?? 0;
    const due = this.events.filter((e) => e.time <= now);
    this.events = this.events.filter((e) => e.time > now);
    return due;
  }

  crescendo() {
    if (!this.playing || this.build || !this.context || !this.score)
      return false;
    const total = crescendoLength(this.absoluteStep, stepsPerBar(this.score)),
      duration = total * secondsPerStep(this.score);
    this.build = { remaining: total, total };
    const now = this.context.currentTime;
    this.highpass.frequency.cancelScheduledValues(now);
    this.highpass.frequency.setValueAtTime(25, now);
    this.highpass.frequency.exponentialRampToValueAtTime(
      1100,
      this.nextTime + duration,
    );
    this.riser(now, duration);
    return true;
  }
  setSpace(value: number) {
    if (this.context)
      this.reverbGain.gain.setTargetAtTime(
        value * 0.8,
        this.context.currentTime,
        0.05,
      );
  }
  async live(id: InstrumentId, midi: number): Promise<Release> {
    await this.init();
    return this.voice(id, midi, this.context!.currentTime + 0.005, 8, 0.85);
  }
  private track(release: Release, duration: number): Release {
    const wrapped = () => {
      release();
      this.releases.delete(wrapped);
    };
    this.releases.add(wrapped);
    setTimeout(
      () => this.releases.delete(wrapped),
      Math.min(duration + 2, 15) * 1000,
    );
    return wrapped;
  }
  private voice(
    id: InstrumentId,
    midi: number,
    time: number,
    duration: number,
    velocity: number,
  ): Release {
    const sample = this.samples.get(id);
    if (sample) {
      const release = sample.start({
        note: midi,
        velocity: Math.round(Math.min(1, velocity) * 110),
        time,
        duration,
      });
      return this.track(() => release(), duration);
    }
    const ctx = this.context!,
      channel = this.channels.get(id)!;
    const frequency = 440 * 2 ** ((midi - 69) / 12);
    const percussive = id === "harp" || id === "percussion" || id === "pulse";
    const attack =
      id === "texture"
        ? 0.45
        : id === "strings"
          ? 0.07
          : id === "brass"
            ? 0.09
            : 0.012;
    const tail = id === "texture" ? 1.1 : percussive ? 0.22 : 0.18;
    const amp = ctx.createGain(),
      filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value =
      id === "brass"
        ? 1200
        : id === "strings"
          ? 2800
          : id === "pulse"
            ? 850
            : id === "texture"
              ? 1400
              : 7000;
    filter.Q.value = id === "pulse" ? 3 : 0.6;
    filter.connect(amp);
    amp.connect(channel);
    const oscillators: OscillatorNode[] = [];
    const count =
      id === "texture" || id === "strings" ? 3 : id === "woodwinds" ? 1 : 2;
    for (let i = 0; i < count; i++) {
      const osc = ctx.createOscillator();
      osc.type =
        id === "woodwinds" || id === "percussion"
          ? "sine"
          : id === "harp" || id === "texture"
            ? "triangle"
            : "sawtooth";
      osc.frequency.setValueAtTime(
        frequency * (id === "percussion" && i === 1 ? 1.5 : 1),
        time,
      );
      osc.detune.value = (i - (count - 1) / 2) * (id === "strings" ? 9 : 5);
      if (id === "percussion")
        osc.frequency.exponentialRampToValueAtTime(
          frequency * 0.82 * (i === 1 ? 1.5 : 1),
          time + 0.16,
        );
      osc.connect(filter);
      osc.start(time);
      osc.stop(time + duration + tail + 0.1);
      oscillators.push(osc);
    }
    const peak =
      (velocity * (id === "texture" ? 0.25 : id === "strings" ? 0.35 : 0.6)) /
      Math.sqrt(count);
    amp.gain.setValueAtTime(0, time);
    amp.gain.linearRampToValueAtTime(
      peak,
      time + Math.min(attack, duration / 2),
    );
    if (percussive)
      amp.gain.exponentialRampToValueAtTime(
        0.001,
        time + Math.max(0.08, Math.min(duration, id === "harp" ? 1 : 0.5)),
      );
    else amp.gain.setValueAtTime(peak * 0.8, time + duration);
    amp.gain.exponentialRampToValueAtTime(0.0001, time + duration + tail);
    let released = false;
    const cleanup = () => {
      amp.disconnect();
      filter.disconnect();
    };
    oscillators[0].onended = cleanup;
    return this.track(() => {
      if (released) return;
      released = true;
      const now = ctx.currentTime;
      amp.gain.cancelScheduledValues(now);
      amp.gain.setTargetAtTime(0, now, 0.04);
      oscillators.forEach((osc) => {
        try {
          osc.stop(now + 0.2);
        } catch {
          /* Already ended. */
        }
      });
    }, duration);
  }
  private riser(time: number, duration: number) {
    const ctx = this.context!,
      source = ctx.createBufferSource();
    const buffer = ctx.createBuffer(
      1,
      Math.ceil(ctx.sampleRate * duration),
      ctx.sampleRate,
    );
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    source.buffer = buffer;
    const filter = ctx.createBiquadFilter(),
      gain = ctx.createGain();
    filter.type = "bandpass";
    filter.Q.value = 0.8;
    filter.frequency.setValueAtTime(180, time);
    filter.frequency.exponentialRampToValueAtTime(7000, time + duration);
    gain.gain.setValueAtTime(0.001, time);
    gain.gain.exponentialRampToValueAtTime(0.2, time + duration);
    source.connect(filter);
    filter.connect(gain);
    gain.connect(this.master);
    source.start(time);
    source.stop(time + duration);
    source.onended = () => {
      filter.disconnect();
      gain.disconnect();
    };
    this.track(() => {
      gain.gain.cancelScheduledValues(ctx.currentTime);
      gain.gain.setTargetAtTime(0, ctx.currentTime, 0.03);
    }, duration);
  }
  private impact(time: number) {
    this.voice("percussion", 38, time, 1.6, 1);
    this.voice("texture", 38, time, 1.2, 0.8);
  }

  async startRecording() {
    await this.init();
    if (typeof MediaRecorder === "undefined")
      throw new Error("Audio recording is unavailable in this browser.");
    if (this.recorder) return;
    const mimeType = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4"].find(
      (type) => MediaRecorder.isTypeSupported(type),
    );
    if (!mimeType)
      throw new Error(
        "This browser does not support a downloadable audio recording format.",
      );
    const recorder = (this.recorder = new MediaRecorder(
      this.recorderDestination.stream,
      { mimeType },
    ));
    const chunks: Blob[] = [];
    recorder.ondataavailable = (event) => {
      if (event.data.size) chunks.push(event.data);
    };
    recorder.onstop = () => {
      const blob = new Blob(chunks, { type: mimeType });
      const url = URL.createObjectURL(blob),
        anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `symphone-${Date.now()}.${mimeType.includes("mp4") ? "m4a" : "webm"}`;
      anchor.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    };
    recorder.start(1000);
  }
  stopRecording() {
    this.recorder?.stop();
    this.recorder = null;
  }
}

export const orchestra = new OrchestraEngine();
