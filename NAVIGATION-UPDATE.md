# Stage 3 compact navigation revision

This cumulative export includes Stages 1–3 and the requested navigation/layout revision, not Stage 4.

- Practice tab: compact drone and metronome together.
- Tuner tab: tuner only, with microphone controls and reference A4 available.
- Scales tab: scale guide, shared metronome controls, and a drone-volume slider.
- A4 reference is always in the header.
- Changing tabs stops/cancels the microphone, scale guide, drone and metronome. Settings persist in the existing DOM; playback does not restart automatically.
- Tabs support keyboard arrows/Home/End; Space operates the current mode outside form controls.
- Help is collapsed, the decorative waveform removed from view, and spacing/pitch display tightened. Mobile layouts retain normal scrolling rather than clipping content on short screens or with enlarged text.

## Apply
Use this package instead of earlier ZIPs. Target ONLY sargondj/cello-drone-enhanced. Never modify sargondj/cello-drone.
Apply all six existing app source files plus NEW navigation.js and compact.css. index.html loads both new files. Keep existing favicons and unrelated repository changes. Merge device-tested fixes if the repository has evolved since this package's Stage 3 baseline.

## Checks
Existing guide, pitch and tuner tests pass unchanged. New tests/navigation.cjs checks panel visibility, shared-control movement, cleanup calls, volume synchronization and keyboard behavior. Run all four tests and node --check navigation.js before publication.
Browser layout inspection was attempted but the preview browser could not connect to the local server (connection refused). No rendered viewport or real-device fit is claimed. Before publishing, use local browser preview to check 390×844, 375×667 and laptop sizes, all three tabs, a two-octave scale, and enlarged text. Confirm no horizontal overflow, useful controls remain visible, and microphone stops when leaving Tuner. Help can add scrolling when expanded.

No upload or deployment performed. Update PROGRESS.md after actual device/browser verification and publish only on a user-authorized upload request. Stop at Stage 3.
