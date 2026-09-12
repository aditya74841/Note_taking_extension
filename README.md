# URL Notes Extension
# WebMemo — Smart URL & Web Notes

URL Notes is a local-first browser extension for taking rich notes in the context of the pages and websites where they were created. It has grown from a small URL note editor into a complete browsing companion with domain organization, pinned notes, recovery tools, optional cloud backup, and a full-screen dashboard.
> Capture context-rich notes tied to every webpage and website you browse. Instant auto-save with optional cloud backup.

For the full product explanation, current feature list, architecture, user journey, and known gaps, read the [Product Overview](docs/PRODUCT_OVERVIEW.md).
WebMemo is a local-first browser extension for taking rich notes in the context of the pages and websites where they were created. It features domain organization, pinned notes, context-menu quote capture, recovery tools, a full-screen dashboard, and an optional cloud sync backend.

## Current Features
- [Privacy Policy](PRIVACY.md)
- [Chrome Web Store Listing Guide](CHROMEWEBSTORE.md)
- [Product Architecture & Overview](docs/PRODUCT_OVERVIEW.md)

- Rich Quill editor with titles, formatting, preview, copy, counts, and focus mode
- Fast 200ms auto-save to local IndexedDB
- Notes organized by active page, current website, or all saved domains
- Search and hashtag filtering with sanitized rich-text previews
- Context-menu, keyboard, and drag-and-drop text capture
- Domain pinning that keeps a selected note open across sub-pages
- Extension badge counts and optional in-page capture feedback
- Soft-delete trash, restore, and permanent purge
- Dashboard with overview metrics, note browsing, filters, pins, trash, and tools
- CSV and Markdown export
- Optional JWT-authenticated Express/MongoDB backup and restore
---

## Development
## Features

```bash
npm install
npm run dev
- **Contextual Notes**: Notes anchored directly to individual URLs or whole domains.
- **Local-First & Fast**: Instant 0ms auto-save to IndexedDB (200ms debounce).
- **Chrome Side Panel**: Seamless note editing alongside your browsing.
- **Rich-Text Editor**: Headings, bold, italic, code blocks, blockquotes, checklists, and links.
- **Read-Only All-Notes View**: Safe preview of notes across all domains without accidental edits.
- **Quick Text Capture**: Highlight text on any page and press `Ctrl+Q` (or right-click) to save quotes instantly.
- **Sticky Domain Pinning**: Keep a specific note open across sub-pages on the same domain.
- **Cloud Dashboard**: Full-screen metrics, note browser, trash recovery, and CSV / Markdown export.
- **Optional Cloud Sync**: REST API with JWT authentication and MongoDB persistence.

---

## Project Structure

```text
NotesExtensions/
├── extension/          # Chrome Extension (WXT, React 19, TypeScript)
├── server/             # Cloud REST API (Express, MongoDB, JWT)
├── docs/               # Technical documentation
├── PRIVACY.md          # Public Privacy Policy
├── CHROMEWEBSTORE.md   # Web Store submission checklist & metadata
└── package.json        # Root convenience scripts
```

Load the extension from `.output/chrome-mv3-dev` if it doesn't load automatically.
---

## Build
## Development & Build

### Extension Commands (from project root)
```bash
# Start development mode with HMR
npm run dev

# Build production extension
npm run build

# Create Chrome Web Store ZIP package
npm run zip

# Type-check TypeScript
npm run compile
```

Production output is in `.output/chrome-mv3`.
The production unpacked build is output to `extension/.output/chrome-mv3`.

## Usage
### Server Commands (from project root)
```bash
# Start backend in development mode
npm run server:dev

1. Visit any website
2. Click the extension icon to open the side panel
3. Type a note — it auto-saves
4. Revisit the same URL — the badge appears and your note loads
# Run automated tests (Vitest)
npm run server:test
```

Notes aren't available on restricted pages (`chrome://`, `about:`, etc.); the extension shows the all-notes view there instead.
---

## Privacy

WebMemo does not collect browsing history, use tracking cookies, or sell personal data. Read our full [Privacy Policy](PRIVACY.md).

