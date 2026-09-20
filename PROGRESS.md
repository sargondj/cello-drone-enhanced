# Cello Drone Enhanced — stopping point after Stage 3

Prepared 2026-09-18; compact navigation replacement applied and verified 2026-09-19.

AUTHORIZED TARGET: https://github.com/sargondj/cello-drone-enhanced  
PROTECTED ORIGINAL: do not modify or deploy `sargondj/cello-drone`.

This cumulative deployment contains Stages 1, 2, and 3 only. Stage 4 has not started.

## Compact navigation revision

- Three top tabs: Practice (drone + metronome), Tuner, and Scales (guide + metronome).
- The A4 reference remains available in the header in every mode.
- Changing modes stops the microphone, scale guide, drone, and metronome while preserving settings. Playback never restarts automatically.
- Tabs support Left/Right arrows, Home, and End. Space operates the current mode outside form controls.
- Help is collapsed, the decorative waveform is hidden, and the practice controls use a compact responsive layout.
- `navigation.js`, `compact.css`, `NAVIGATION-UPDATE.md`, and `tests/navigation.cjs` were added.

## Stages 1 and 2 retained

- Metronome: 30–240 BPM, beats per measure, optional downbeat accent, independent volume and transport.
- Major-scale visual guide: 12 keys; starting octave 2–4; one/two octaves; one/two/four beats per note; count-in, note highlighting, and full-duration completion.
- Optional root drone during the guide, with original gain 0.42 retained.
- Scale guide remains visual only; it does not listen or evaluate playing.

## Stage 3 retained: standalone open-string tuner

- Explicit C2, G2, D3, and A3 selection.
- Shared A4 reference (400–480 Hz, default 440).
- Target frequency, detected note/frequency, smoothed cents, flat/sharp indicator, and ±5-cent in-tune band.
- Meter spans ±50 cents; larger accepted deviations retain a numeric reading with an off-scale notice.
- Pitch beyond ±200 cents of the selected string produces a wrong-note/octave notice. There is no automatic octave folding.
- Noise, low-level, and clipping rejection plus reacquisition after large pitch jumps.
- Microphone permission is requested only on Start tuner; audio is analyzed locally and never recorded or uploaded.
- Starting the tuner cancels the scale guide and stops speaker playback. Transport starts are blocked while permission is pending or the microphone is active.
- The microphone analyser has no output connection to speakers.
- Stop, canceled or late permission, tab hiding, page exit, disconnect, and audio interruption release tuner resources. Playback does not resume automatically.

## Validation completed for the compact replacement

- Every file matched `SHA256SUMS.txt` before testing; the original package checksums matched again after the temporary enlarged-text QA override was removed.
- `node --check` passed for `app.js`, `scale.js`, `pitch.js`, `tuner.js`, and `navigation.js`.
- `tests/guide.cjs` passed 72 scale configurations plus key spelling, count-in, sequencing, completion, cancellation, and lost-timing checks.
- `tests/pitch.cjs` passed 1,008 synthetic tone cases with a maximum error of 0.38 cents, plus silence, DC, noise, clipping, weak-signal, octave-preservation, and smoothing checks.
- `tests/tuner.cjs` passed permission, feedback, calibration, transport exclusion, no-monitoring, cancellation, late permission, interruption, page-lifecycle, and cleanup checks.
- `tests/navigation.cjs` passed exclusive panels, shared-metronome relocation, reference access, volume synchronization, cleanup, selected-tab semantics, keyboard navigation, and visible-mode Space behavior.
- Local browser QA passed at 390 × 844, 375 × 667, and 1440 × 900 with no horizontal overflow and no console errors.
- Practice, Tuner, and Scales were each rendered and checked. The two-octave scale displayed all 29 up-and-down notes.
- A temporary 125% root-font override was used to inspect all three modes at 375 × 667; controls remained within the viewport. The override was removed and package checksums were revalidated before publication.
- Browser keyboard checks confirmed Right Arrow, End, and Home navigation between tabs.
- Drone and metronome were started together; changing modes stopped both.
- The real browser permission-pending tuner state exposed Cancel. Changing from Tuner to Scales canceled the pending request and returned the tuner to Microphone off.

## Deployment

The original Stages 1–3 deployment was published successfully from `main` on 2026-09-18 at https://sargondj.github.io/cello-drone-enhanced/.

The compact navigation replacement was published only to `sargondj/cello-drone-enhanced` on 2026-09-19. GitHub Pages run #4 completed successfully for commit `205e934874ba5bace4c43e5b5abc2a8c3cd69f71`.

Live deployment validation completed:

- The public URL loaded the compact Practice, Tuner, and Scales tabs.
- `style.css`, `compact.css`, `app.js`, `scale.js`, `pitch.js`, `tuner.js`, and `navigation.js` loaded from the enhanced repository Pages subpath.
- Live browser logs contained no errors or warnings.
- Drone and metronome started together; changing to Scales stopped both.
- Drone volume synchronized from Practice to Scales and back.
- Starting the tuner entered the real permission-pending state, disabled all playback transports, and exposed Cancel. Changing modes canceled the pending request, restored Microphone off, and re-enabled playback.

The protected original `sargondj/cello-drone` repository was not modified or deployed for either enhanced release.

## Remaining validation limitation

Real microphone Allow/Deny with a physical input device, live or recorded cello accuracy, physical iPhone/Android behavior, device latency, and the operating-system microphone indicator were not tested in this deployment session. Only the browser permission-pending and Cancel path was exercised. Synthetic and mocked tests do not establish real-world tuner accuracy. Complete the physical-device checks in `TUNER-NOTES.md` before Stage 4.

## Next stage — only on a new user request

Stage 4: live scale intonation using the established pitch detector, headphones initially, with separate reliable and uncertain readings. First validate the standalone tuner with Leuna's actual cello and device. Do not add automatic scoring or begin Stage 4 as part of this handoff.
