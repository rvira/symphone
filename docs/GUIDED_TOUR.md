# First rehearsal

First-time players see a skippable 12-stop walkthrough. Each stop scrolls to and highlights a real control, explains it, and suggests what to select. The tour does not click controls, play audio, change scenes or edit a score. Players can try controls through the highlight, move backward and forward, or leave with **Skip tour** / **Escape** at every step. **Try this section** moves keyboard focus to the highlighted controls; the card remains available.

The tour covers the starting modes, scenes, foundation instruments and chords, playback, score, instrument selector, pads, phrase queuing, mixing, evolution/crescendo and recording/export. It no longer targets the temporarily disabled podium. **How to play → Take the guided tour** restarts it on demand, including for existing players.

Onboarding eligibility is captured before the initial score autosave. A saved score (including legacy keys) identifies a returning player; they are not interrupted. `symphone.tour.v1` remembers an offered, skipped or completed tour separately from score data. Offering immediately marks it seen, so refreshing an unfinished walkthrough does not restart it. If browser storage is blocked, the tour still works, but cannot remember dismissal across reloads.

The non-modal dialog allows trying the actual app without trapping focus. Each step focuses its heading for screen readers, Escape dismisses it, and dismissal restores the previous focus or the Help control. Highlight overlays do not intercept pointer input. Positioning responds to scrolling, viewport changes and content resizing. Reduced-motion preferences disable highlight movement; step scrolling is immediate. No new dependencies or external onboarding service are used.

Implementation: `components/GuidedTour.tsx`, its scoped stylesheet and `lib/tour.ts`. Tests cover first-visit eligibility, dismissal persistence, saved-score preservation, section coverage and viewport positioning.
