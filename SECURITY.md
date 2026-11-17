# Security

Security fixes target the latest code on `main`; older versions have no separate support commitment.

Do not post vulnerabilities, credentials or exploit details in public issues. Use [GitHub private vulnerability reporting](https://github.com/rvira/symphone/security/advisories/new) if available. If it is unavailable, open an issue asking the maintainer to enable private reporting or arrange a private contact—without describing the vulnerability publicly.

Include affected versions, reproduction steps, likely impact and a minimal proof of concept in the private report. Do not include personal scores, recordings or third-party credentials. Reports are handled on a best-effort basis; response times and a bounty are not guaranteed.

## Data and external services

- Scores and tour preferences are stored in browser local storage. People using the same browser profile may be able to access them; this is not encrypted private storage.
- Audio generation and recording happen in the browser. Recording captures the app mix, not the microphone. The current app has no score-upload endpoint or application analytics.
- Instrument samples load from the upstream soundfont host; fonts load from Google Fonts. Those services receive normal network-request information. Their availability and policies are outside this project’s control.
- Clear browser site data to remove locally saved scores and preferences. Keep dependencies updated and review their advisories when deploying a fork.
