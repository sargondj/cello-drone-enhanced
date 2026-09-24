> Historical stage notes. COMPLETION-NOTES.md, PROGRESS.md and HANDOFF.md describe the current completed package and supersede earlier scope/stopping instructions.

# Stage 4 — live scale intonation

Use Scales → Listen to my playing, connect headphones, confirm Headphones
connected, then Start scale and allow microphone access. Bow along with the
highlighted notation after the count-in. The drone remains optional; metronome
and drone output stay at the previous 100% level. Adjust device volume.

The app does not detect whether headphones are connected. Confirming the box is
a manual check; speaker playback can otherwise be mistaken for the instrument.
Wired headphones are preferable for the initial check because wireless audio
latency can make the heard beat lag the highlighted note. No latency correction
or speaker-bleed separation is included in this stage.

## Feedback
- A steady nearby pitch shows cents sharp or flat; within ±10 cents is green.
  This is an equal-tempered reference using the shared A4 setting, not an
  assessment of expressive intonation, bowing, rhythm or musical quality.
- Quiet, clipped, unstable, missing or substantially different pitches show
  no reliable reading. Wrong octaves are never folded into an in-tune result.
- Each target change discards old smoothing and waits for the analyser window
  to contain the new note. Acquisition needs several samples. Use 60–80 BPM and
  2–4 beats per note initially; short notes at high tempos may finish without a
  reading. That is uncertainty, not a failed note.
- The established detector covers roughly 45–1100 Hz. Higher notes still appear
  in the guide, but explicitly show that they are outside the listening range.
- Melodic minor follows the previously implemented classical ascent/descent.
  Feedback follows the actual displayed pitch on both legs of the scale.

## Privacy and stopping
Audio is analysed locally. No recording, uploads, saved microphone data, or
aggregate score. The microphone is never connected to speaker output. Stopping,
finishing, changing tabs, opening the tuner, leaving the page, losing the mic,
or interrupting audio stops listening. Late permission grants after cancel are
released. If permission fails, start again after fixing access or disable
Listen to my playing to use the existing guide alone.

## Verification completed
Five Node test suites pass: scale generation/transport, synthetic pitch,
standalone tuner lifecycle, navigation, and live intonation lifecycle. The new
suite checks opt-out/no prompt, headphone gate, sharp/flat/in-tune feedback,
uncertain and wrong-octave states, target transitions, count-in, completion,
no monitoring, denied/late permission, canceled/pending audio startup,
microphone disconnect/mute, page hide and tuner exclusion. Existing tests cover
216 scale combinations and 1008 synthetic pitch cases.

No real cello/microphone or rendered phone layout was verified here. These
automated results are not a real-world accuracy guarantee.

## Short device acceptance check
1. In Scales, first play a guide with listening off: no permission prompt.
2. Connect headphones and enable listening. Try one-octave C major at 60 BPM,
   four beats per note. Hold each note, then deliberately play sharp/flat.
3. Stop bowing: any previous numeric reading should clear. Play the wrong
   octave: no green in-tune result. Check that the drone alone is not detected.
4. Try natural and melodic minor. Check each ascending/descending target and
   automatic notation pages. Confirm all controls fit or scroll normally at
   375×667, 390×844, laptop widths and enlarged text, without horizontal overflow.
5. Stop, switch to Tuner, hide the browser and deny permission on a fresh try.
   Confirm microphone indicators stop and controls recover. Let a scale finish.
6. If readings seem delayed or inconsistent, use longer notes and verify the
   standalone tuner on the same device. Record the device/browser and symptoms
   before building scoring or more advanced evaluation.

Stop at Stage 4. Deploy only to the enhanced repository when requested.
