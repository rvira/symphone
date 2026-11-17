# Contributing

Bug reports, musical feedback, accessibility improvements and focused pull requests are welcome. Discuss large features in an issue before starting.

## Development

Use Node.js 24 (`nvm use`) or Node.js 22.12+.

```sh
npm ci
npm run dev
npm test
npm run build
```

The app runs at http://127.0.0.1:3000. No account, API key or backend is required. Format changed files with `npx prettier --write <files>`.

## Pull requests

- Branch from `main` and keep the change focused.
- Explain what changed, why, and how you tested it. Include screenshots for UI changes and a short audio example for sound changes when practical.
- Add regression tests for composition or scheduling changes. Test all three meters: 4/4, 3/4 and 6/8.
- Preserve empty-score behavior, user-note palettes, mute/solo settings and queued melody timing.
- Check keyboard access and reduced motion for UI changes. Automated tests do not replace listening checks for sound quality.
- Never commit credentials, personal scores, recordings or third-party media without permission and attribution. See [third-party notices](THIRD_PARTY_NOTICES.md).
- Before changing Next.js code, follow `AGENTS.md` and read the relevant installed Next.js guide.

## Community

Follow the [community standards](CODE_OF_CONDUCT.md). Keep feedback respectful, specific and constructive.

For security issues, follow [SECURITY.md](SECURITY.md), not a public bug report.

By submitting a contribution, you agree to license your original work under the repository's license. Third-party contributions must retain their original notices. No contributor license agreement is required.
