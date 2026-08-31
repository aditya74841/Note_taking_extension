# URL Notes Extension

Take notes on every URL you visit. Notes are stored locally in IndexedDB and appear in the side panel when you click the extension icon.

## Features

- Badge on the extension icon when the current tab has a saved note
- Side panel editor with auto-save (500ms debounce)
- Notes keyed by `hostname + pathname` (query params ignored)
- No content scripts or in-page overlays

## Development

```bash
npm install
npm run dev
```

Load the extension from `.output/chrome-mv3-dev` if it doesn't load automatically.

## Build

```bash
npm run build
```

Production output is in `.output/chrome-mv3`.

## Usage

1. Visit any website
2. Click the extension icon to open the side panel
3. Type a note — it auto-saves
4. Revisit the same URL — the badge appears and your note loads

Notes aren't available on restricted pages (`chrome://`, `about:`, etc.).
