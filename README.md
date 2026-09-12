# WebMemo — Smart URL & Web Notes

> Capture context-rich notes tied to every webpage and website you browse. Instant auto-save with optional cloud backup.

WebMemo is a local-first browser extension for taking rich notes in the context of the pages and websites where they were created. It features domain organization, pinned notes, context-menu quote capture, recovery tools, a full-screen dashboard, and an optional cloud sync backend.

- [Privacy Policy](PRIVACY.md)
- [Chrome Web Store Listing Guide](CHROMEWEBSTORE.md)
- [Product Architecture & Overview](docs/PRODUCT_OVERVIEW.md)

---

## Features

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

---

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

The production unpacked build is output to `extension/.output/chrome-mv3`.

### Server Commands (from project root)
```bash
# Start backend in development mode
npm run server:dev

# Run automated tests (Vitest)
npm run server:test
```

---

## Privacy

WebMemo does not collect browsing history, use tracking cookies, or sell personal data. Read our full [Privacy Policy](PRIVACY.md).

