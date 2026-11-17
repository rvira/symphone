# Symphone

A browser orchestra combining acoustic instruments and electronic textures.

Choose notes, shape an ensemble and let Symphone compose the rhythm. Includes 12 scenes, instrument re-evolution, live pads, orchestral swells and browser recording.

## Run locally

Use Node.js 24 (`nvm use`); Node.js 22.12+ is also supported.

```sh
git clone https://github.com/rvira/symphone.git
cd symphone
npm ci
npm run dev
```

Open [localhost:3000](http://localhost:3000). No account or API key needed.

## Play

1. Choose a scene, instruments and chords in the right-hand desk.
2. Click **Build foundation & play**.
3. Enable **Auto-evolve** to add an instrument every two bars.
4. Choose notes with the pads or **A S D F G H J K**, then **Melodize & queue**. Symphone composes the rhythm and phrasing—not your tap timing or order.

- **Scenes** change the style without stopping playback or clearing your ensemble.
- **Re-evolve** beside a score row varies only that instrument, keeping its note palette and mix.
- **Crescendo** shapes a four-bar orchestral swell and release; **Record** saves browser audio.
- **Reset all notes** clears the score after confirmation.
- **Studio** contains Full Orchestra quick start, help and score export.

Scores save automatically on this device, including when you reopen Build from Nothing. Use **Reset all notes** for a fresh score. Audio starts after interaction; samples and fonts load online, with synth/system-font fallbacks. Recording uses the app mix, not your microphone. These are browser instrument approximations, not a professional sample library.

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

## Contribute

See [contributing](CONTRIBUTING.md), [community standards](CODE_OF_CONDUCT.md) and [security reporting](SECURITY.md). CI checks tests and production builds on Node.js 22 and 24.

## License

Original Symphone code and documentation are licensed under [MIT](LICENSE), copyright © 2026 rvira.

Third-party libraries, samples and fonts retain their own licenses. Read [third-party notices](THIRD_PARTY_NOTICES.md), especially before redistributing soundfonts, fonts or recordings. Maintainers can use the [release checklist](docs/RELEASE_CHECKLIST.md).
