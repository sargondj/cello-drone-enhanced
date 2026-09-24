> Historical Stage 3 notes. For the current scope and deployment instructions, see STAGE-4-NOTES.md and HANDOFF.md.

# Stage 3: minor scales, notation, device volume

This cumulative package replaces earlier Stage 3 exports. Apply only to
`sargondj/cello-drone-enhanced`, preserving newer repository fixes. The original
public `sargondj/cello-drone` must remain untouched. No deployment was performed.

## Changes
- Choose Major, Natural minor, or Melodic minor, then the root. Melodic minor
  follows the classical convention: raised sixth and seventh ascending,
  natural minor descending. One/two octaves and existing count-in remain.
- Staff notation replaces the named-note boxes. Seven notes per page keep the
  staff readable on small screens. Pages turn with the highlighted note;
  arrow buttons let you inspect the whole scale before playing. During playback,
  the next beat returns to the active page. A restart returns to page one.
- Bass clef is used for lower passages; pages entirely at C4 or higher use
  treble clef. The page label states the clef. This is unbarred practice notation
  with an explicit accidental on every note, including naturals, and no key
  signature. One/two/four beats use quarter/half/whole notes. Named current/next
  pitches remain as supplementary feedback; SVG accessible labels name notes.
- All drone and metronome volume sliders are removed. Output stays at the
  existing 100% gain levels, with the same attack/release ramps. Use the phone
  or computer volume to adjust loudness. This does not change system volume.

## Files and checks
Add `notation.js` along with `navigation.js` and `compact.css`; update the other
app files from this cumulative package. The script order in index.html matters:
app.js, notation.js, scale.js, pitch.js, tuner.js, navigation.js.

Run all four scripts in tests/ using Node. Guide tests cover 216 combinations
and check ascending/descending intervals, spelling, score pages/highlights,
fixed gain levels, count-in and transport lifecycle. Tuner/pitch/navigation
regression tests also pass. No external runtime packages or build are needed.

Before publishing, verify score symbols/clefs, automatic page turns and tab
layout on the target phone, including a two-octave melodic minor scale. Test
real audio and microphone permissions as described in TUNER-NOTES.md. This
remains a visual scale guide, not a scale accuracy evaluator. Stop at Stage 3.
