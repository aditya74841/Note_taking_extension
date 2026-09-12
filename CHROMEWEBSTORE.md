# Chrome Web Store Listing — WebMemo

> Last Updated: 2026-09-12
> Extension Version: 1.0.0

---

## 1. Store Listing Details

**Extension Name** [REQUIRED]
```text
WebMemo - Smart URL & Web Notes
```

**Short Name** [RECOMMENDED]
```text
WebMemo
```

**Short Description** [REQUIRED] (Max 132 chars)
```text
Capture context-rich notes tied to every webpage and website you browse. Instant auto-save with optional cloud backup.
```

**Category** [REQUIRED]
```text
Productivity
```

**Single Purpose** [REQUIRED]
```text
Takes and manages rich-text notes tied specifically to individual web URLs and website domains.
```

**Primary Language** [REQUIRED]
```text
English
```

**Detailed Description** [REQUIRED] (Plain text formatted for Chrome Web Store)
```text
WebMemo is a local-first browser companion that lets you take notes anchored directly to any URL or domain you visit. Never lose track of your research, bookmarks, thoughts, or code snippets again.

KEY FEATURES:
• URL & Domain Notes: Write notes for a specific page URL or create a "Main" domain note that stays accessible across an entire website.
• Real-Time Side Panel: Take notes without leaving your page. WebMemo opens seamlessly in the Chrome Side Panel.
• Instant 0ms Auto-Save: All your typing is saved in real-time to your browser's local IndexedDB with a 200ms debounce.
• Rich-Text Formatting: Headers, checklists, bold, italics, code blocks, blockquotes, and link support powered by Quill.
• Sticky Domain Pinning: Pin a specific note so it stays open as you browse across different links on the same website.
• Quick Text Capture: Highlight text on any page and press Ctrl+Q (or right-click) to save the selection directly into your note as a formatted quote.
• Domain Grouping & Search: Browse all your saved notes organized by website domain, with hashtag filtering and full-text search.
• Read-Only Safety: Easily preview notes across other domains without accidental overwrites.
• Trash & Recovery: Soft-delete notes with full recovery support from the Cloud Dashboard.
• Optional Cloud Backup: Securely sync your notes to your cloud database for multi-device access with JWT authentication.
• Data Portability: Export your notes to CSV or Markdown (.md) at any time.

HOW TO USE WEBMEMO:
1. Click the WebMemo icon in your extensions toolbar or press Alt+Shift+S to open the Side Panel.
2. Start typing notes for the webpage you are currently on. It saves automatically as you type.
3. Switch between "Active Page Note" and "Main URL Note" to take notes for the specific page or the whole website.
4. Highlight any text on a page, right-click, and select "Add Selection to WebMemo Note" (or press Ctrl+Q) to capture quotes instantly.
5. Click "Dashboard" to view all your notes, manage trash, and export data.

PRIVACY & DATA SAFETY:
WebMemo operates on a local-first philosophy. Your notes are stored directly on your own device in your browser's private IndexedDB database. We do not use third-party analytics, tracking scripts, or ad networks. Cloud backup is 100% optional and only syncs if you choose to sign in.
```

---

## 2. Graphics & Asset Requirements

| Asset | Dimensions | Status | Location / Notes |
| :--- | :--- | :---: | :--- |
| **Store Icon** | 128×128 PNG | ✅ Ready | `extension/public/icon/128.png` |
| **Small Promo Tile** | 440×280 PNG | 🟡 To Create | Optional promo graphic |
| **Marquee Promo Tile**| 1400×560 PNG | 🟡 To Create | Optional banner graphic |
| **Screenshot 1 (Sidepanel)** | 1280×800 or 640×400 | 🟡 To Capture | Side panel open next to a webpage showing note editing |
| **Screenshot 2 (All Saved)** | 1280×800 or 640×400 | 🟡 To Capture | "All Saved Notes" accordion grouped by domain with Preview modal |
| **Screenshot 3 (Dashboard)** | 1280×800 or 640×400 | 🟡 To Capture | Cloud Dashboard showing overview metrics, search, and table view |
| **Screenshot 4 (Quick Capture)**| 1280×800 or 640×400 | 🟡 To Capture | Context menu / Ctrl+Q quote capture toast on a webpage |

---

## 3. Permissions Justification (Copy-Paste for CWS Form)

The Chrome Web Store review team requires an explicit, plain-English justification for every permission. Use the exact justifications below:

| Permission | Justification |
| :--- | :--- |
| `tabs` | Required to read the active tab's URL and title so the extension can automatically associate, retrieve, and display notes specific to the visited webpage and domain. |
| `activeTab` | Required to capture the user's selected text on the active webpage when triggered via the keyboard shortcut (Ctrl+Q). |
| `contextMenus` | Required to create the "Add Selection to WebMemo Note" right-click context menu item for capturing text selections into notes. |
| `scripting` | Required to extract highlighted text selections from the current webpage when the user triggers the context menu item or keyboard shortcut. |
| `storage` | Required to store user local preferences (badge count toggle, sticky pinned domains map, authentication tokens, and server endpoint). |
| `sidePanel` | Required to provide the primary note-taking user interface in Chrome's side panel alongside the active webpage. |

### Host Permissions (`<all_urls>` in content scripts)
**Justification**:
> "WebMemo is designed to work on all standard web pages visited by the user. The content script runs on active pages solely to extract user-selected text when requested and display an optional in-page badge indicating saved notes on the active domain. It does not collect browsing history or track user activity."

---

## 4. Privacy & Data Use Disclosure

These correspond to the **Privacy** tab in the Developer Dashboard:

### Single Purpose Certification
- [x] **I confirm that my extension has a single purpose**: "Takes and manages rich-text notes tied to individual web URLs and website domains."

### Data Collection Declarations

| Data Category | Declared | Transmitted Off-Device? | Usage |
| :--- | :---: | :---: | :--- |
| **Personally Identifiable Information** | Yes (Optional) | Yes (Only if registered) | User email address used exclusively for authentication & password resets if the user chooses to create an optional cloud sync account. |
| **Authentication Info** | Yes | Yes (Only if registered) | JWT access and refresh tokens for securing communication with the cloud sync backend. |
| **Website Content** | Yes | Optional | Note titles and rich-text note content authored by the user. Saved locally on device; only uploaded to the cloud if the user signs in to cloud sync. |
| **Web History** | No | No | Not collected. WebMemo only reads the URL of the active tab at the moment a note is created/viewed to index the note in IndexedDB. |
| **User Activity / Telemetry** | No | No | No tracking, telemetry, analytics, or behavioral cookies are used. |

### Data Use Certifications
- [x] Data is **NOT** sold to third parties.
- [x] Data is **NOT** used for purposes unrelated to the extension's core functionality.
- [x] Data is **NOT** used for creditworthiness, lending, or advertising.

---

## 5. Privacy Policy

A live, public Privacy Policy URL is required by Google. You can publish the markdown below to GitHub Pages (e.g. `https://yourusername.github.io/webmemo/privacy`), a GitHub Gist, or your personal website:

```markdown
# Privacy Policy for WebMemo

Last updated: September 12, 2026

WebMemo ("we", "our", or "the extension") is a browser extension developed to provide contextual, URL-specific note taking. We are committed to protecting your privacy.

### 1. Data We Collect and Why
- **Notes and Content**: Notes you write (titles, text, formatting, and associated URL keys) are saved locally in your browser using IndexedDB. If you choose to create an account for Cloud Sync, your notes are encrypted in transit via HTTPS and stored in your private cloud database.
- **Account Information**: If you choose to register for optional cloud backup, we collect your email address and an encrypted password hash solely to manage your account and authenticate your sync sessions.
- **Active URL Key**: To display the note corresponding to your current page, WebMemo inspects the active tab's URL. This information is processed locally on your device and is never tracked or logged as browsing history.

### 2. What We Do NOT Collect
- We do NOT collect or store your browsing history.
- We do NOT use analytics, tracking pixels, or third-party telemetry.
- We do NOT display advertisements.
- We do NOT sell, rent, or monetize your personal data or notes.

### 3. Data Storage and Security
- Local data is stored in your browser's private IndexedDB storage.
- Cloud data (if enabled) is transmitted over secure TLS/HTTPS and stored in MongoDB with industry-standard bcrypt password hashing and token-based authentication.

### 4. User Controls and Data Deletion
You have complete control over your data:
- You can edit, delete, or permanently purge any note directly within the extension.
- You can export all your notes at any time to Markdown (.md) or CSV via the Dashboard.
- Uninstalling the extension completely deletes all locally stored IndexedDB notes.

### 5. Contact Us
For any privacy questions or inquiries regarding WebMemo, please contact:
Email: [Your Contact Email Here]
```

---

## 6. Pre-Submission Checklist

- [x] Extension version is `1.0.0` in `extension/package.json` and manifest.
- [x] Manifest V3 compliant.
- [x] Remote scripts and Google Fonts `<link>` removed (no CSP violations).
- [x] Icons generated at all required sizes (16, 32, 48, 96, 128px) in `extension/public/icon/`.
- [x] Packaged store ZIP built: `extension/.output/webmemo-extension-1.0.0-chrome.zip`.
- [ ] 1 to 5 screenshots taken at 1280×800 or 640×400 resolution.
- [ ] Privacy Policy published to a public URL.
- [ ] Google Developer account registered ($5 one-time fee).

