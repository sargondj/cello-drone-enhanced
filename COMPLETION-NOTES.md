# Completed cello practice app — Stages 1–6

This cumulative package targets **sargondj/cello-drone-enhanced only**.
Nothing was deployed. Earlier public app and stage exports remain untouched.

## What is finished
Stage 5 adds the agreed per-note review. After a listening run, open Scale review
below the notation. It distinguishes completed and partial runs, and shows each
occurrence of a note separately, including the ascent and descent. Skipped and
unreached notes remain unscored.

Stage 6 was originally a menu of refinements rather than fixed requirements.
This package implements the following bounded versions, under Practice options:

| Option | Behavior |
| --- | --- |
| Equal temperament | Existing pitch reference; default. |
| Pure intervals | One explicit ratio set relative to the root drone. |
| Steady tempo | Existing count-in and fixed beats per note; default. |
| Wait for me | Requires listening. Holds each target until a nearby pitch is steady; advances on a beat after the minimum note duration. |
| Audible accompaniment | Existing drone/metronome playback. Listening requires manual headphone confirmation. |
| Silent accompaniment | Stops the drone and mutes metronome output during the scale, while beat lights continue. Listening does not require headphones. |

The report also describes when a steady pitch was acquired after the target
changed. This includes microphone/analyser delay and is **not a rhythm grade**.
There is no beat-onset detector, latency calibration, or early/late rating.

## Report interpretation
- Pitch measurements start only after the new-note guard (one analyser window
  plus 80 ms) and stable-pitch acquisition. Count-in, quiet, clipping, unreliable
  input, and pitches more than 100 cents from the target are not scored.
- A reviewed note needs at least three accepted samples spanning 150 ms.
  Reports show signed median cents, the fraction within ±10 cents, and sample
  count. A centered median with wider deviations is labeled Mixed.
- The overall percentage averages the percentages of reviewed notes with equal
  weight. It is explicitly a summary of **steady readings**, not accuracy across
  the whole performance. Always consider how many notes were reviewed.
- Up to 1,000 accepted measurements per note are kept in memory. Very long
  pauses therefore use the most recent measurements for pitch statistics;
  the initial acquisition time is retained. No microphone audio is stored.
- The report is replaced on the next listening run and lost on reload. No
  accounts, storage permission, saved history or cloud service is required.

## Following and tuning details
Wait for me accepts a stable pitch within ±50 cents for at least 240 ms after
acquisition. It does not require green ±10-cent intonation; the report still
shows the deviation. Silence, uncertainty and a different octave do not advance.
Use Skip note for a target you cannot play or the microphone cannot detect;
skips are unscored. A4 and exercise settings are locked during a run so the
reference cannot change halfway through its report.

Pure intervals use these octave-repeating ratios against the equal-tempered
root: unison 1/1; second 9/8; minor third 6/5; major third 5/4; fourth 4/3;
fifth 3/2; minor sixth 8/5; major sixth 5/3; minor seventh 9/5; major seventh
15/8. This is a chosen drone-based exercise reference, not a claim that there
is one correct tuning for all musical contexts. Classical melodic minor still
uses raised sixth/seventh ascending and natural minor descending.

Silent accompaniment is the speaker-contamination improvement in this release.
The app does **not** separate cello from simultaneous loudspeaker playback.
Headphone connection is not automatically detected. Wireless headphone delay
can affect fixed-tempo following; no latency compensation is claimed.

The detector's existing range is about 45–1100 Hz. Higher notes remain visible
but unscored; use Skip in Wait for me. Fast, short notes may not allow sufficient
acquisition. Use 60–80 BPM with 2–4 beats per note for initial checks.

## Tests and device acceptance
Six automated Node suites pass: guide, pitch, tuner, navigation, intonation, and
refinements. They cover 288 scale combinations, 1,008 synthetic pitch cases,
microphone lifecycle, no monitoring, interruptions and late permissions, ratio
references, no-sound/no-score behavior, reports, silent output and wait/skip.

Rendered browser layout and real cello accuracy have not been verified here.
Before publishing:
1. Check all tabs at phone/laptop widths and enlarged text. Open Practice options
   and the scrollable report. Confirm notation symbols and no horizontal overflow.
2. Run C major slowly with headphones. Play sharp/flat, stop bowing, and try a
   wrong octave. Confirm feedback clears and uncertain notes stay unscored.
3. Try natural/melodic minor and Pure intervals. Confirm descending targets.
4. In Wait for me, pause, resume, and skip a note. Confirm the report labels skips.
5. Try Silent without headphones: no drone/click output. Return to audible mode
   and verify the normal output level remains the previous 100% setting.
6. Finish and cancel runs, switch tabs, deny permission, hide the page, and
   disconnect the microphone. Check release and recovery as in earlier notes.

Follow HANDOFF.md to merge/upload only when requested. Implementation is complete
through the selected Stage 6 refinements; device validation remains the release
acceptance step, not an additional feature stage.

## Harmonic minor and key-signature revision
All four scale types (major, natural minor, harmonic minor, melodic minor) now
use a key signature repeated on each staff. Minor uses the natural-minor key
signature. Harmonic minor raises the seventh ascending and descending; melodic
minor raises the sixth and seventh ascending and returns to natural minor
on descent. Alterations show sharps, naturals, flats or double sharps as needed.
No redundant note accidentals are added to major or natural minor.

Each seven-note page ends with a barline and resets local accidentals. Within a
page, accidentals apply to subsequent instances of the same letter and octave,
including any necessary cancellation. These are unmetered practice measures;
beats per note and playback timing are unchanged.

Minor roots use C♯ instead of D♭ and G♯ instead of A♭ for more readable signatures;
the sounding root pitch is unchanged. Reports and note labels use the matching
spelling. Existing drone-relative pure tuning supports the new harmonic minor.
Automated notation checks reconstruct every displayed pitch from its signature
and local accidental for all 288 configurations. Browser/device visual checks
remain outstanding.
