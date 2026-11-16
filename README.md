# Symphone

A browser orchestra combining acoustic instruments and electronic textures.

## Run locally

Requires Node.js 22.12+ or 24+.

```sh
npm ci
npm run dev
```

Open [localhost:3000](http://localhost:3000). No account or API key needed.

## Play

1. Choose a scene, instruments and chords in the right-hand desk.
2. Click **Build foundation & play**.
3. Enable **Auto-evolve** to add an instrument every two bars.
4. Play the pads or keys **A S D F G H J K**, then weave your phrase into the score.

- **Scenes** change the style without stopping playback or clearing your ensemble.
- **Crescendo** adds a temporary build and release; **Record** saves browser audio.
- **Reset all notes** clears the score after confirmation.
- **Studio** contains Full Orchestra quick start, help and score export.

Scores save automatically on this device. Samples load online; synth voices provide a fallback.

## Code map

- `app/` — Next.js pages and styles
- `components/` — studio, instrument desk, scenes and guided tour
- `lib/score.ts` — composition, harmony and evolution
- `lib/audio.ts` — playback, instruments, effects and recording
- `tests/` — musical and timing checks

```sh
npm test
npm run build
npm start
```

Built with Next.js, React, Web Audio and [smplr](https://github.com/danigb/smplr). Inspired by KHAOS; implemented independently.
