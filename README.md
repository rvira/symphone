# Symphone

A playable hybrid orchestra: acoustic instrument sections meet electronic textures.
Symphone brings acoustic sections and electronic textures into one playable ensemble.

## Run it

Requires Node.js 22.12+ (or Node.js 24+).

```sh
npm ci
npm run dev
```

Open the local URL printed by Next.js. Choose **Build from Nothing** to begin with an empty score, or **Full Orchestra** for a ready-made arrangement. Audio starts only after an interaction, as required by browsers. No account, API key or paid service is required.

```sh
npm test       # Musical and timing invariants
npm run build # Type-check and generate the Next.js production build
npm start
```

## Play

- **Build from Nothing (default):** The working score starts with all eight rows genuinely empty. Choose one or more starting instruments and one diatonic chord per bar, then click **Build foundation**. Only those selected parts are generated. Press Play to listen, or Auto-evolve to start playback and grow the ensemble. Rebuilding replaces existing parts and woven phrases; it does not start audio automatically.
- **Full Orchestra (quick start):** All eight sections are generated immediately. This remains a separate entry path for instant listening and playing along. The two modes keep independent saved scores on this device; returning players can resume their work.
- **Eventual cycle phrase weaving:** Use keys A–K or tap on-screen pads to capture notes. Clicking **Queue Layer for Next Cycle** queues your phrase to enter smoothly on the next cycle downbeat, matching authentic orchestral performance practice. An instant **Weave Now** option is also available.
- **Choose a scene:** Browse 12 musical worlds, filtered by Ballet & classical, Folk or Cinematic. Scenes set the scale, meter, melodic style, tempo and instrument balance. In Build from Nothing they reset to an empty score with suggested chords; no parts are generated until Build.
- **Podium:** The original 3D stage follows the score and live playing. The score and live instrument picker offer the same section selections.
- **Auto-evolve:** In Build from Nothing, one new instrument part is composed every two bars using your chosen chords. Existing parts stay unchanged while the ensemble grows. Once all eight have joined, it varies eligible generated parts. Woven phrases and mix settings are preserved throughout. Turning Auto-evolve off freezes growth; Stop/Play never resets the assembled parts. Intensity does not fill empty rows.
- **Crescendo:** Builds tension through the bar, drops low end, accelerates percussion, and resolves on bar one with an orchestral impact.
- **Mix & acoustics:** Solo sections, adjust levels, change tempo, control intensity and adjust concert-hall reverb depth.
- **Record:** Captures the complete browser audio mix into WebM/Opus or M4A without using your microphone.

Switching scenes or choosing New movement creates a fresh score, clears custom phrases and returns to bar one. Clear removes uncommitted pad notes; Undo removes a woven layer. Space toggles playback. Escape closes the guide and releases held notes.

Build mode saves to `symphone.build.score.v1`; Full Orchestra continues to use `symphone.score.v1`. Old complete arrangements are not loaded into a new build-mode score. Your chord progression is stored with the score and reused for evolution, intensity changes and restoring generated parts after Undo. Each chord applies to one bar of the eight-bar movement.

## Scene library

| Family             | Scenes                                                                       | Character                                                                                                     |
| ------------------ | ---------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| Ballet & classical | British ballet · Chamber waltz · Baroque garden                              | Buoyant 3/4 strings and harp; a grounded waltz; interlocking 4/4 running figures                              |
| Folk               | English country · Celtic jig · Highland reel · Nordic folk · Fireside ballad | Village-dance refrain; lilting 6/8; even eighth-note runs; a shadowed triple step; spacious song-like phrases |
| Cinematic          | Open horizon · In motion · After midnight · Storybook                        | Broad and hopeful; driving and rhythmic; intimate and suspended; floating 6/8 harp and flute                  |

These are style-inspired original generators, not recordings or reproductions of traditional tunes or ballets. The same eight instrument sections are used throughout; folk scenes foreground the violin, flute and harp, with restrained electronics. Jigs and Storybook count **dotted-quarter beats** (two beats per 6/8 bar); 3/4 and 4/4 count quarter notes. The tempo label, score, two-bar phrase capture, evolution, crescendo and stage motion all follow the selected scene's meter.

## Sound

All synthesis, scheduling, effects and recording run in the browser with Web Audio. Acoustic sections load General MIDI samples via [smplr](https://github.com/danigb/smplr), using the MusyngKite soundfont. Downloads begin after the first audio interaction; the interface shows loading, sampled or fallback status. Only the useful instrument register is decoded to limit memory use.

Synthesized fallback voices play immediately and remain available if samples fail or take more than 20 seconds. Pulse and atmosphere always use synthesis. Sample downloads and Google Fonts require internet access; neither receives your score or recording. If fonts are unavailable, system fonts are used. These are browser instrument approximations rather than a professional orchestral sample library.

## Repository layout

```text
app/
  layout.tsx               Next.js layout and metadata
  page.tsx                 Landing page with build-first and quick-start paths
  studio/page.tsx          Studio entry; defaults to Build from Nothing
  globals.css              Responsive studio design
components/
  Orchestra.tsx            UI, keyboard input, state and persistence
  FoundationBuilder.tsx    Starting instruments, eight chord selectors and Build
  SceneLibrary.tsx         Filterable scene cards and movement descriptions
  Ensemble.tsx             Interactive orchestra seating map
  Stage3D.tsx              Lazy-loaded stage and WebGL fallback lifecycle
  StagePlan.tsx            Original SVG seating plan
  InstrumentGlyph.tsx      Original SVG instrument illustrations
lib/
  score.ts                 Pure composition, harmony, evolution and phrase functions
  audio.ts                 Web Audio transport, voices, mixing, crescendo and recording
  stage.ts                 Physical seating and score-driven visual activity
  stage-scene.ts           Original Three.js concert-stage model and motion
public/                    Static assets
tests/score.test.ts         Musical and transport invariants
tests/stage.test.ts         Seating and performance-activity invariants
docs/DESIGN.md              Concert-hall references, palette and motion choices
```

`Score` is plain data: eight instrument parts with MIDI notes, step positions, durations, velocities and mix settings. The UI sends edited scores into the engine. The engine indexes notes by step, schedules roughly 100 ms ahead on the audio clock, and sends timestamped playback events back to the UI. Bars have sixteen sixteenth-note steps in 4/4, or twelve in 3/4 and 6/8. A movement has 128 or 96 steps. Timing helpers in `lib/score.ts` keep consumers in sync; 6/8 groups six subdivisions per dotted-quarter beat.

The composer shares one harmonic progression across the ensemble, then gives each instrument its own role: motif, bass foundation, answering phrase, chord voicing, arpeggio, percussion pattern, synth pulse or sustained texture. Seeded choices make arrangements reproducible. Build-mode evolution first creates a missing section, then varies existing generated notes once the ensemble is complete. A crescendo changes playback temporarily.

## Git history and reference

The first commit contains **only the repository scaffold and folder layout**. The playable implementation is a separate later commit. The repository is published at [rvira/symphone](https://github.com/rvira/symphone).

KHAOS informed the broad interaction pattern: a safe musical scale, generative accompaniment, evolving parts and a build/release gesture. No KHAOS source files were copied. Symphone has its own score model, orchestration algorithms, timed phrase capture, audio engine and interface. The shared third-party audio dependency is `smplr`.

Symphone has its own score model, orchestration algorithms, timed phrase capture, audio engine and interface. The shared third-party audio dependency is `smplr`.
