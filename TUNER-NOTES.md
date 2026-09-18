# Open-string tuner — use and device check

## Use
1. Open the enhanced app directly in a browser over HTTPS. GitHub Pages supplies HTTPS. For local development use localhost; do not rely on a ZIP preview or a file viewer.
2. Select C2, G2, D3, or A3 and tap Start tuner. Allow microphone access.
3. Bow only that open string steadily. Avoid vibrato and let the bow attack settle.
4. Wait briefly for a stable reading. Flat means the measured pitch is below the target; sharp means above. Adjust gradually.
5. Stop tuner when finished. The app releases microphone tracks. Start drone/metronome manually to resume practice.

A4 is set by the existing Tuning field (default 440 Hz). In tune is within ±5 cents. The needle spans ±50 cents; numeric deviations up to ±200 cents are still shown. More distant notes/octaves get a selection warning with no adjustment meter. No stable reading is not an instruction to keep turning a peg.

Audio is analyzed in memory on this device, not recorded or uploaded. Starting the tuner stops the drone, metronome and guide so the microphone does not follow their sound. Other devices and voices in the room can still interfere.

## Short physical-device acceptance check
- Check one current iPhone/Safari or Android/Chrome and, if available, desktop Chrome.
- Verify Allow, Deny, Stop, and Cancel. Stop should release the active microphone indicator (the browser may retain its permission icon).
- Compare all four actual cello strings against a trusted tuner. Give special attention to low C and overtone-heavy bowing.
- Try slightly flat/sharp notes, a wrong string, a harmonic, silence and room noise. The app should not display a stale in-tune reading after sound stops. Octave ambiguity remains possible with real instrument signals.
- Confirm the target reference changes when A4 changes, and string changes reset the needle.
- Hide the tab, switch apps and return: microphone stays off until Start tuner is tapped again.
- Start drone/metronome/guide, then Start tuner: speaker audio must stop. Playback controls remain disabled while listening and restore after Stop.
- Confirm Start guide and standalone drone/metronome still work normally after tuner use.
- Check meter and controls on a phone-width screen at enlarged text.

For weak/unstable low C, move the device closer to the cello and reduce surrounding sound. For clipping, move it farther away. Do not judge the instrument or player from uncertain readings.
Pitch tests used synthetic signals, not recorded cello. Real-world accuracy, responsiveness and microphone behavior still need this check.

## Developer references
- Microphone permissions, HTTPS and indefinitely pending requests: https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia
- Releasing microphone tracks: https://developer.mozilla.org/en-US/docs/Web/API/MediaStreamTrack/stop
