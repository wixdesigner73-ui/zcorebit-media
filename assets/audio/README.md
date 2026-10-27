# Soundtrack

Drop a **properly licensed** ambient track here named `soundtrack.mp3`
(or point `VITE_SOUNDTRACK` in `.env` at another file inside `/public`).

- Loops seamlessly — export with a clean loop point.
- Recommended: 128–192 kbps MP3, 1.5–3 minutes, mastered quietly (around −18 LUFS).

While no file is present, the site plays its built-in **generative ambient
score** (synthesised live with the Web Audio API in `src/audio/SoundEngine.ts`),
so the sound controls always work.
