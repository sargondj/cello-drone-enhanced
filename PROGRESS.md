# Cello Drone Enhanced — stopping point after Stage 4

Stage 4 package validated and prepared for the enhanced deployment on 2026-09-23.

AUTHORIZED TARGET: https://github.com/sargondj/cello-drone-enhanced  
PROTECTED ORIGINAL: do not modify or deploy `sargondj/cello-drone`.

This cumulative release contains Stages 1–4. It includes the compact tabbed interface, staff notation, major/natural-minor/classical-melodic-minor scales, fixed output levels, the standalone open-string tuner, and optional live scale intonation feedback. It does not record audio or calculate an automatic/session score.

## Retained functionality

- Practice tab: root-note drone and metronome.
- Tuner tab: standalone C2, G2, D3, and A3 tuner using the shared A4 reference.
- Scales tab: major, natural minor, and classical melodic minor; one/two octaves; one/two/four beats per note; count-in; optional root drone; paginated bass/treble staff notation.
- Output remains fixed at the established gain levels. The user adjusts listening level with device controls.
- Changing tabs stops audio, scale playback, tuner listening, and Stage 4 listening. Playback never resumes automatically.

## Stage 4: optional live scale intonation

- `Listen to my playing` leaves guide-only mode available without requesting microphone permission.
- Listening requires the user to confirm that headphones are connected. The app cannot detect headphones itself.
- The current scale note becomes the pitch target after the count-in. Target changes clear old smoothing before the next reading.
- Reliable readings show cents flat/sharp; within ±10 cents is displayed as in tune.
- Quiet, clipped, unstable, absent, wrong-octave, substantially wrong-note, or out-of-range input produces an uncertain/no-reading state rather than a score.
- Audio is analyzed locally and is never recorded, uploaded, saved, or connected to speaker output.
- Stop, completion, tab change, tuner start, page hiding/exit, microphone mute/disconnect, interruption, cancellation, denial, and late permission all clean up listening resources.
- `intonation.js`, `STAGE-4-NOTES.md`, and `tests/intonation.cjs` were added.

## Automated validation completed

- Every supplied file matched `SHA256SUMS.txt` before testing and again after the temporary enlarged-text QA override was removed.
- `node --check` passed for `app.js`, `navigation.js`, `notation.js`, `pitch.js`, `scale.js`, `tuner.js`, and `intonation.js`.
- `tests/guide.cjs` passed 216 scale configurations, interval patterns, notation paging/highlighting, spelling, count-in, synchronized advancement, completion, cancellation, and lost-timing checks.
- `tests/pitch.cjs` passed 1,008 synthetic tone cases with a maximum error of 0.38 cents, plus silence, DC, noise, clipping, weak-signal, octave-preservation, and smoothing checks.
- `tests/tuner.cjs` passed permission, feedback, calibration, transport exclusion, no-monitoring, denial/cancellation/late permission, interruption, lifecycle, and cleanup checks.
- `tests/navigation.cjs` passed exclusive-panel, shared-metronome, reference, cleanup, tab-semantics, keyboard-navigation, and visible-mode Space checks.
- `tests/intonation.cjs` passed headphone gating, opt-out, flat/sharp/in-tune and uncertainty states, target transitions, octave/range rejection, no monitoring, count-in/target/completion behavior, denial/cancellation/late permission, mute/disconnect, audio interruption, tab hiding, tuner exclusion, and page-exit cleanup.

## Browser validation completed

- Local responsive checks passed at 390 × 844, 375 × 667, and 1440 × 900 with no horizontal overflow.
- Practice, Tuner, and Scales each kept visible controls within the viewport.
- A temporary 125% root-font override was used across all three modes at 375 × 667; controls remained within the viewport. The override was removed before publication.
- Two-octave melodic minor rendered five notation pages with bass/treble clef changes and classical ascending/descending spelling. Natural minor notation was also rendered at laptop size.
- The script order was verified as `app.js`, `notation.js`, `scale.js`, `pitch.js`, `tuner.js`, `intonation.js`, `navigation.js`.
- Guide-only mode started without a microphone prompt.
- Listening without headphone confirmation was blocked with the expected instruction.
- Confirmed listening entered the browser permission-pending state; changing tabs canceled it and restored Microphone off.
- No browser console errors or warnings were observed.

## Deployment

The prior compact Stage 3 deployment was live from commit `bc415c1d46a65b8d944c04e89b25e5a8ff5936e8` at https://sargondj.github.io/cello-drone-enhanced/ before this Stage 4 update.

Stage 4 was published only to `sargondj/cello-drone-enhanced` on 2026-09-23. GitHub Pages completed successfully for application/test commit `d92db3a12e6fd4a308cdab63f538415f298f819c`.

Live deployment validation completed:

- The public URL loaded the Practice, Tuner, and Scales tabs with no browser console errors or warnings.
- `style.css`, `compact.css`, `app.js`, `notation.js`, `scale.js`, `pitch.js`, `tuner.js`, `intonation.js`, and `navigation.js` loaded from the enhanced Pages subpath in the required order.
- Two-octave melodic minor rendered five notation pages and exposed the Stage 4 listening controls.
- Guide-only mode started without entering a microphone permission state.
- Listening without headphone confirmation was blocked with the expected instruction.
- Confirmed listening entered the real browser permission-pending state and exposed Cancel.
- Changing to Practice canceled the pending request, restored Microphone off, and returned the scale button to Start scale.

The protected original `sargondj/cello-drone` repository has not been modified or deployed.

## Remaining validation limitations

Real microphone Allow/Deny with a physical input device, live or recorded cello accuracy, actual headphone routing, physical iPhone/Android behavior, device latency, and the operating-system microphone indicator were not tested in this deployment session. Automated synthetic/mocked results and the browser permission-pending path do not establish real-world accuracy. Complete the device acceptance checks in `STAGE-4-NOTES.md` before building any scoring or later-stage features.

## Stopping point

Stop at Stage 4. Do not add recordings, automatic scores, or a later stage without a new user request.
