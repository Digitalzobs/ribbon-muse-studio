# Ribbon Muse Studio

Reference-based AI styling and scene generator prototype built as a modular static web app.

## What works now

- Local sign up, log in, log out, forgot password, and session persistence
- Unified Create workflow for identity, styling, brand logic, palette, environment, pose, and output type
- Multiple image uploads per reference section
- Saved library, prompts, and reusable looks
- Structured detailed prompt generation for single images, carousels, and scene sets
- Local preview-render generation so the full product flow is usable offline

## Current prototype note

This build does not call a live image generation API yet. Instead, it creates polished local SVG preview renders and stores the detailed prompts that would be sent to a future AI image backend.

The app architecture is already separated into:

- `js/prompt-engine.js` for prompt assembly
- `js/mock-generator.js` for the current preview renderer
- `js/storage.js` for persisted local data
- `js/app.js` for UI and workflow orchestration

That means a future API integration can replace the preview renderer without changing the surrounding product experience.

## Run locally

From this folder, start a static server, for example:

```bash
python3 -m http.server 4173
```

Then open:

- `http://127.0.0.1:4173`

## Files

- `/Users/chizobajenniferoffor/Documents/Codex/2026-04-19-can-you-create-apps/index.html`
- `/Users/chizobajenniferoffor/Documents/Codex/2026-04-19-can-you-create-apps/styles.css`
- `/Users/chizobajenniferoffor/Documents/Codex/2026-04-19-can-you-create-apps/js/app.js`
- `/Users/chizobajenniferoffor/Documents/Codex/2026-04-19-can-you-create-apps/js/constants.js`
- `/Users/chizobajenniferoffor/Documents/Codex/2026-04-19-can-you-create-apps/js/prompt-engine.js`
- `/Users/chizobajenniferoffor/Documents/Codex/2026-04-19-can-you-create-apps/js/mock-generator.js`
- `/Users/chizobajenniferoffor/Documents/Codex/2026-04-19-can-you-create-apps/js/storage.js`
