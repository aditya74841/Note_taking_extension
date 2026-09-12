# URL Notes Extension: What We Built

## In one sentence

URL Notes is a browser extension for capturing, organizing, and revisiting notes in the context of the websites and pages where they were created.

It starts as a fast local note-taking tool inside the browser and now includes rich editing, domain-level organization, pinned notes, recovery tools, optional cloud backup, and a full-screen dashboard.

## The problem it solves

When reading documentation, researching a topic, watching a course, or working through a long web application, useful thoughts and copied text often become disconnected from the page that gave them context. URL Notes keeps the note beside the browser and associates it with the page or website.

A user can open the sidepanel, write without leaving the current page, return later, search across saved notes, and keep one important note visible while moving through different pages on the same domain.

## What a user can do today

### 1. Take notes from any page

- Open the browser sidepanel on a web page.
- Write a note for the current page.
- Edit its title and content.
- The note saves automatically after a short 200 ms pause while typing.
- Reopen the same page later and the note is loaded again.

Notes are not created just because a page was visited. A note is stored when it has meaningful content; empty editor state is treated as no active note.

### 2. Use a real rich-text editor

The editor is powered by Quill and supports formatted content rather than plain text only. Users can create readable notes with headings, emphasis, lists, links, code-style content, blockquotes, and other toolbar formatting.

The sidepanel also provides:

- Editable note titles
- Preview mode
- Word and character counts
- Copy-to-clipboard
- Save status feedback
- Delete controls
- A focus mode that reduces header distractions while writing

### 3. Capture text quickly

Text can be added without manually retyping it:

- Use the page context menu to send selected text to the note.
- Use the configured keyboard capture command.
- Drag selected text from a web page into the editor.

Captured text is converted into editor-compatible HTML so it does not corrupt the rich-text document.

### 4. Organize notes by page and website

The extension uses a normalized URL key built from the hostname, pathname, and meaningful query parameters. Tracking parameters and the `www.` prefix are removed when appropriate.

The sidepanel has three useful views:

- **Active Page:** the note for the page currently open.
- **This Website:** notes grouped for the current domain.
- **All Saved Notes:** every active note grouped by domain.

Users can search notes and filter them with hashtags. Note previews are sanitized into readable text even when the stored note contains rich HTML.

### 5. Pin a note to a domain

A note can be pinned to a domain when a user wants one piece of context to stay visible while navigating between sub-pages.

For example, a note pinned on a documentation site remains selected while the user moves from one chapter or route to another. The selected note, title, and content stay associated with the pinned domain until the user unpins it or chooses another note.

Pin state is kept in browser storage and is also backed up to the cloud when cloud sync is enabled. Deleting a pinned note cleans up the related pin.

### 6. See note counts on the extension icon

The background worker updates the extension action badge with the number of saved notes for the current domain. Badge updates are broadcast across open tabs so the count stays consistent after saving or deleting notes.

The extension can also show an optional in-page badge or toast through its content script.

### 7. Recover deleted notes

Deleting a note is reversible by default. The note is soft-deleted and removed from active lists, but its record remains available in the trash flow.

From the dashboard, a user can:

- View deleted notes
- Restore a note
- Permanently purge a note when they are sure it is no longer needed

This behavior protects notes from accidental loss while keeping the active workspace clean.

### 8. Browse everything in the dashboard

The extension includes a standalone dashboard for larger-scale note management. Its sections are:

- **Overview:** local note counts, tracked domains, connection details, and account state.
- **Cloud Notes:** searchable note browsing with domain, tag, and color filters; grid and compact table views; detail modals; copy and open-page actions.
- **Domain Pins:** a visual list of pinned website notes with a launcher for the related site.
- **Trash:** deleted note recovery and permanent purge actions.
- **Export & Tools:** CSV and Markdown exports.

The dashboard also includes a refresh action and an error boundary so a component failure does not turn the entire screen into a blank page.

### 9. Export and import note data

The tools area supports portability through:

- CSV export for spreadsheet use
- Markdown archive export

## Local-first storage

The extension works without an account. Its primary database is an IndexedDB database named `UrlNotesDB` with a notes store and indexes for domain and update time.

Each note contains information such as:

- Normalized URL key
- Domain
- Full URL
- Title
- Rich HTML content
- Last updated time
- Optional display color
- Soft-delete state

Active note queries hide deleted records. The sidepanel remains useful even when the cloud server is unavailable because local reads and writes do not depend on the network.

## Optional cloud backup

Cloud sync adds backup and restore across browser sessions or machines. It is deliberately secondary to local editing so typing remains quick and usable offline.

The flow is:

1. Register or log in from the dashboard.
2. Store the JWT and profile in extension storage.
3. Back up note and domain-pin changes in the background.
4. Use restore to upload existing local data, fetch cloud data, and write it back into local storage.

The backend is an Express and MongoDB service with JWT authentication. It currently provides endpoints for:

- Registration, login, and current-user validation
- Note backup
- Domain-pin backup
- Note and pin restore
- Cloud backup exploration
- Deleted-note restore
- Permanent cloud purge

Passwords are hashed with bcrypt before storage. Note and pin records are scoped to the authenticated user.

## Technical architecture

- **Extension framework:** WXT and Manifest V3
- **Frontend:** React 19 and TypeScript
- **Editor:** `react-quill-new`
- **Icons:** `lucide-react`
- **Local database:** IndexedDB through `idb`
- **Browser coordination:** background service worker, content script, sidepanel, and dashboard entrypoints
- **Backend:** Node.js, Express, MongoDB, Mongoose, JWT, and bcrypt
- **UI styling:** custom CSS for the sidepanel and dashboard

The main extension surfaces are:

- `entrypoints/sidepanel`: note-taking experience
- `entrypoints/background.ts`: context menus, keyboard capture, badges, and sidepanel behavior
- `entrypoints/content.ts`: optional in-page feedback
- `entrypoints/dashboard`: full-screen management portal
- `lib/db.ts`: local note persistence and trash operations
- `lib/sync.ts`: authentication, backup, restore, and cloud explorer access
- `server/src`: authenticated REST API and MongoDB models

## Typical user journey

1. The user visits a page and opens the sidepanel.
2. They capture a thought, write a formatted note, or drag in selected text.
3. The note is saved locally almost immediately.
4. The extension badge reflects the saved note count for that domain.
5. The user searches or switches to the website view to find related notes.
6. They pin an important note if they are moving through several pages in one site.
7. Later, they open the dashboard to filter, export, restore, or manage their notes.
8. If they sign in, local notes and pins can be backed up and restored through the server.

## Current boundaries and known gaps

This is the current implementation, not a claim that every planned product behavior is finished:

- The README describes the original local-only version and is shorter than the current product; this document is the current feature overview.
- Cloud backup is optional and backup-oriented. There is no timestamp-based conflict resolution or collaborative merge strategy.
- The dashboard's Cloud Notes view currently receives the local active-note list while cloud explorer data is loaded separately for cloud-specific operations. The label is broader than the underlying data flow today.
- Domain pins can be viewed and launched in the dashboard, but the dashboard does not currently expose a complete unpin action.
- The default API server is `http://localhost:8000/api/v1`; production deployment requires configuring the server URL and the backend environment.
- Restricted browser pages such as `chrome://` and `about:` pages cannot provide normal page context. In those cases the extension falls back to the all-notes view.
- The backend needs production hardening before public deployment, including stricter CORS configuration and stronger request validation.

## Running the project

Install dependencies and start the extension development build:

```bash
npm install
npm run dev
```

Build the extension:

```bash
npm run build
```

Run the TypeScript check:

```bash
npm run compile
```

The backend lives in `server/` and requires its own dependencies and MongoDB configuration. The extension's default development API URL is `http://localhost:8000/api/v1`.

## The current product story

URL Notes began as a small local note editor tied to the current URL. It has grown into a local-first research companion: fast enough to use while browsing, structured enough to organize notes by website, resilient enough to recover deleted work, and extensible enough to back up data to a separately managed cloud service.

The core idea has stayed the same: the page gives the note its meaning, so the note should stay close to the page.
