# Cello Drone Enhanced — stopping point after Stage 3
Prepared 2026-09-18.

AUTHORIZED TARGET: https://github.com/sargondj/cello-drone-enhanced
PROTECTED ORIGINAL: do not modify or deploy sargondj/cello-drone.
This cumulative package includes Stages 1, 2, and 3. No upload or deployment was attempted for Stage 3.

## Stages 1 and 2 retained
- Metronome: 30–240 BPM, beats per measure, optional downbeat accent, independent volume and transport.
- Major-scale visual guide: 12 keys; starting octave 2–4; one/two octaves; one/two/four beats per note; count-in, note highlighting and full-duration completion.
- Optional root drone during the guide, original gain 0.42 retained.
- Scale guide remains visual only; it does not listen or evaluate playing.

## Stage 3 implemented: standalone open-string tuner
- Explicit C2, G2, D3, A3 selection.
- Shared A4 reference (400–480 Hz, default 440) from the existing tuning control.
- Target frequency, detected note/frequency, smoothed cents, flat/sharp indicator and ±5-cent in-tune band.
- Meter spans ±50 cents; larger accepted deviations retain numeric reading with an off-scale notice.
- Pitch beyond ±200 cents of selected string produces a wrong-note/octave notice instead of an adjustment meter. No automatic octave folding.
- Noise/low-level/clipping rejection and reacquisition after large pitch jumps.
- Microphone permission requested only on Start tuner; analyzed locally, never recorded/uploaded.
- Starting tuner cancels scale guide and stops both audio transports; transport starts are blocked while microphone permission is pending or microphone is on.
- Microphone analyser has no output connection to speakers.
- Stop, canceled/late permission, tab hiding, page exit, disconnect, and audio interruption release tracks and resources. Playback does not resume automatically.
- Existing optional screen wake lock is shared with the tuner.

## Implementation and limits
pitch.js is a standalone, testable signal module. It uses average decimation and a YIN-style normalized difference pitch estimator over an 8192-sample input buffer, based on the actual AudioContext sample rate. Tuner polls at 100 ms, uses a 3-frame acquisition, median window and exponential smoothing. Startup ignores the first 300 ms to let output sound fade and input settle.
Synthetic accuracy is not a real-world accuracy guarantee. Real bowed cello, microphone bass response, reverberation, bow attacks, double stops and harmonics can cause missing or incorrect readings. Stage 3 needs physical-device validation before Stage 4.

## Validation completed
- JavaScript syntax: app.js, scale.js, pitch.js, tuner.js.
- tests/guide.cjs: previous 72 key/register/length configurations plus sequence, stop/cancel, duration and lost-timing checks pass with Stage 3 source.
- tests/pitch.cjs: 1,008 synthetic cases (44.1/48/96 kHz; A4 400/440/442/480; all four strings; seven offsets; three harmonic profiles). Worst observed synthetic error 0.38 cents. Silence, DC, white noise, weak input, clipping, octave preservation and smoothing checks pass.
- tests/tuner.cjs: mocked audio/DOM integration tests pass for permission flow, feedback/calibration, transport exclusion, no monitoring, denied/canceled/late requests, pending AudioContext, mute/disconnect, hiding/page exit and cleanup.
- Not performed: visual browser QA, real microphone permission on mobile, recorded/live cello analysis, or device performance/latency testing. See TUNER-NOTES.md.

## Deployment
Stages 1–3 were deployed on 2026-09-18 to the authorized `sargondj/cello-drone-enhanced` repository only. GitHub Pages published successfully from `main` at https://sargondj.github.io/cello-drone-enhanced/.

Deployment validation completed:
- Package SHA-256 checksums matched before application.
- JavaScript syntax passed for `app.js`, `scale.js`, `pitch.js`, and `tuner.js`.
- `tests/guide.cjs`, `tests/pitch.cjs`, and `tests/tuner.cjs` passed with the results documented above.
- Local browser QA confirmed drone, metronome, scale-guide start/stop, tuner permission-pending Cancel, and restored playback controls with no console errors.
- A 390 × 844 responsive check showed no horizontal overflow; all four app regions fit the viewport width.
- Live Pages QA confirmed HTML, CSS, `app.js`, `scale.js`, `pitch.js`, and `tuner.js` load from the enhanced repository subpath with no console errors.
- On the live site, drone, metronome, and scale guide ran together; starting the tuner stopped all three and disabled their start controls while permission was pending; Cancel restored them.

Remaining validation limitation: microphone Allow/Deny with a real input device, live or recorded cello accuracy, physical mobile-device behavior, latency, and actual microphone-track indicator release were not tested in this deployment session. Only the real browser request-pending and Cancel UI path was exercised. The synthetic and mocked tests remain the available accuracy and cleanup evidence; complete the physical-device checks in `TUNER-NOTES.md` before Stage 4.

The protected original `sargondj/cello-drone` repository was read only for `favicon.png`, `SETUP.md`, and `.nojekyll`; it was not modified or deployed. Stage 4 was not started.

This ZIP supersedes the Stages 1–2 and Stage 1 ZIPs. Apply to the enhanced repository only.
BASELINE.json holds the earlier original-source blobs, not a current enhanced-repository HEAD.

## Next stage — only on a new user request
Stage 4: live scale intonation using the established pitch detector, headphones initially, separate reliable/uncertain readings. First validate the standalone tuner with Leuna's actual cello/device. Do not add automatic scoring or begin Stage 4 as part of this handoff.
