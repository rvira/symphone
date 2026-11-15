# Tutti

A playable hybrid orchestra: acoustic instrument sections meet electronic textures.
Tutti is the musical direction for everyone in an ensemble to play together.

## Run it

Requires Node.js 22.12+ (or Node.js 24+).

```sh
npm ci
npm run dev
```

Open the local URL printed by Vite. Press **Play orchestra**, then use **A S D F G H J K** to play the selected instrument. Audio starts only after an interaction, as required by browsers. No account, API key, server or paid service is required.

```sh
npm test       # Musical and timing invariants
npm run build # Type-check and generate dist/
npm run preview
```

## Play

- **Choose a scene:** Open horizon (D major), In motion (D minor), or After midnight (A dorian). Each starts an eight-bar orchestration.
- **Choose a section:** violins, cellos, flute, French horns, harp, timpani, analog pulse, or atmosphere. Click the score, seating map or instrument selector.
- **Play pads:** use A–K or hold the on-screen pads. All eight notes belong to the selected scale.
- **Weave a phrase:** up to 16 played pitches and their relative onset times become a quantized two-bar phrase repeated through the movement. The first layer replaces that section’s generated part; up to three layers can be stacked. Notes beyond the two-bar capture window are omitted. Undo removes the newest layer and restores the generated part when the final layer is removed.
- **Auto-evolve:** one eligible section is regenerated every two bars. Sections containing your phrases are preserved.
- **Crescendo:** while playing, builds through the remainder of a bar and the next full bar. Bass sections step out, percussion accelerates, a noise riser swells, and the low end is filtered away. The ensemble returns on bar one with an impact.
- **Mix:** mute sections, solo the selected section, adjust its level, change tempo, increase intensity or add concert-hall reverb. Intensity rewrites generated parts and preserves user phrases.
- **Record:** captures the complete audio mix, including live playing. Save audio downloads a WebM/Opus file (M4A in browsers that only support MP4 audio). It does not use your microphone.
- **Keep a score:** the arrangement is saved in local storage. Export score downloads the score data as JSON; this version does not import JSON or export MIDI.

Switching scenes or choosing New movement creates a fresh score and clears custom phrases. Clear removes uncommitted pad notes; Undo removes a woven layer. Space toggles playback. Escape closes the guide and releases held notes.

## Sound

All synthesis, scheduling, effects and recording run in the browser with Web Audio. Acoustic sections load General MIDI samples via [smplr](https://github.com/danigb/smplr), using the MusyngKite soundfont. Downloads begin after the first audio interaction; the interface shows loading, sampled or fallback status. Only the useful instrument register is decoded to limit memory use.

Synthesized fallback voices play immediately and remain available if samples fail or take more than 20 seconds. Pulse and atmosphere always use synthesis. Sample downloads and Google Fonts require internet access; neither receives your score or recording. If fonts are unavailable, system fonts are used. These are browser instrument approximations rather than a professional orchestral sample library.

## Repository layout

```text
app/
  main.tsx                 React entry point
  globals.css              Responsive studio design
components/
  Orchestra.tsx            UI, keyboard input, state and persistence
  Ensemble.tsx             Interactive orchestra seating map
  InstrumentGlyph.tsx      Original SVG instrument illustrations
lib/
  score.ts                 Pure composition, harmony, evolution and phrase functions
  audio.ts                 Web Audio transport, voices, mixing, crescendo and recording
public/                    Static assets
tests/score.test.ts         Musical and transport invariants
```

`Score` is plain data: eight instrument parts with MIDI notes, step positions, durations, velocities and mix settings. The UI sends edited scores into the engine. The engine indexes notes by step, schedules roughly 100 ms ahead on the audio clock, and sends timestamped playback events back to the UI. Each bar has sixteen sixteenth-note steps; a movement has 128 steps.

The composer shares one harmonic progression across the ensemble, then gives each instrument its own role: motif, bass foundation, answering phrase, chord voicing, arpeggio, percussion pattern, synth pulse or sustained texture. Seeded choices make arrangements reproducible. Every section has variation across seeds. Evolution replaces a section’s notes; a crescendo changes playback temporarily.

## Git history and reference

The first commit, `87ad296`, contains **only the repository scaffold and folder layout**. The playable implementation is a separate later commit. This is a new local Git repository on `main`; no remote has been created or configured.

KHAOS informed the broad interaction pattern: a safe musical scale, generative accompaniment, evolving parts and a build/release gesture. No KHAOS source files were copied. Tutti has its own score model, orchestration algorithms, timed phrase capture, audio engine and interface. The shared third-party audio dependency is `smplr`.
