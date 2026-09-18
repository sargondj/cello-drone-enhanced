# Cello Drone

Choose a root note and register, then press Play. Press Stop to finish. Root notes can change during playback. The same root works for major and minor scales.

All 12 notes are available in octaves 2–4. Choose mellow harmonics or a pure sine wave, adjust volume, and optionally change A4 tuning (default 440 Hz). Maximum output gain is 0.42, increased 40% from the original 0.30.

Keep the page open while practicing. A screen wake lock is requested where supported. Calls, screen locking, and app switching may interrupt audio; tap Play again if needed. Background playback is not guaranteed.

## Hosting
This is a static app: index.html, style.css, and app.js live together in the repository root. No build or dependencies required. For GitHub Pages choose Settings → Pages → Deploy from a branch → main → /(root), or use the actual default branch.

Official guidance: https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site

Audio is generated locally with Web Audio. No microphone, analytics, account, or backend is used by the app.
