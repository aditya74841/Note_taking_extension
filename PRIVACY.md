# Privacy Policy for WebMemo

**Last Updated:** September 12, 2026  
**Effective Date:** September 12, 2026  

---

## 1. Introduction

**WebMemo - Smart URL & Web Notes** ("WebMemo", "we", "our", or "the extension") is a browser extension designed to help users capture, organize, and retrieve rich notes in the context of the specific webpages and website domains they browse.

We believe that your personal thoughts, research, and browsing habits belong to you. WebMemo is built with a **local-first** architecture: your notes and data reside directly on your own device by default. This Privacy Policy explains what information WebMemo interacts with, how it is handled, and your rights regarding your data.

---

## 2. Information We Collect and How We Use It

### A. Local Note Data (Stored On Your Device)
- **Note Content**: Note titles, formatted rich-text content, tags (`#hashtags`), color labels, and timestamps.
- **URL Keys and Domains**: The specific URL or website domain to which your note is attached.
- **Storage Location**: All notes are stored locally in your browser’s private **IndexedDB** database.
- **Purpose**: To retrieve and display your notes whenever you revisit the corresponding webpage or website domain.

### B. Active Tab Information (Processed Locally in Real-Time)
- **Tab URL and Title**: When you navigate to a webpage, WebMemo reads the active tab’s URL and page title locally.
- **Purpose**: To match your current page against your locally stored notes and show your note badge count.
- **No Browsing History**: WebMemo does **not** log, record, or track your browsing history. The active URL is checked purely in memory on your local machine to display relevant notes.

### C. Text Selections (When Explicitly Triggered by You)
- **Highlighted Text**: When you right-click and choose *"Add Selection to WebMemo Note"* or press `Ctrl+Q`, the extension captures the text you highlighted.
- **Purpose**: To paste the selected text directly into your note as a formatted quote.

### D. Optional Cloud Sync Account Information (Only If You Register)
Cloud sync is **100% optional**. You can use WebMemo fully offline without ever creating an account. If you choose to enable cloud backup, we collect:
- **Email Address**: Used exclusively to identify your account and send password reset links.
- **Password**: Securely hashed using industry-standard `bcrypt` before being stored. We never have access to your plain-text password.
- **Cloud Notes Backup**: Your encrypted notes are transmitted over secure HTTPS/TLS to your private MongoDB database so you can access them across devices.

---

## 3. What We Do NOT Collect

To maintain full transparency, WebMemo **does NOT**:
- Track or log your browsing history.
- Read cookies, passwords, or personal data from pages you visit.
- Use analytics, telemetry scripts, or session recorders (e.g., Google Analytics, Mixpanel, Hotjar).
- Inject advertisements or sponsored links into any webpage.
- Sell, rent, monetize, or trade your personal data or notes with data brokers, advertisers, or any third parties.

---

## 4. Permissions Used by WebMemo

WebMemo requests only the minimum permissions necessary to function as a contextual web notepad:

| Permission | Reason |
| :--- | :--- |
| `tabs` | Required to detect the active page URL and title so notes can be linked to that specific webpage. |
| `activeTab` | Grants temporary access to capture your highlighted text when you trigger the `Ctrl+Q` keyboard shortcut. |
| `contextMenus` | Adds the *"Add Selection to WebMemo Note"* shortcut to Chrome’s right-click menu. |
| `scripting` | Extracts the highlighted text selection on the active tab upon your explicit user action. |
| `storage` | Saves user interface preferences (such as pinned domains, badge toggle, and sync credentials). |
| `sidePanel` | Displays the WebMemo note editor in Chrome's side panel alongside your active webpage. |

---

## 5. Third-Party Services

- **Local Use**: When using WebMemo locally, **zero third-party services** are used. No external connections are made.
- **Cloud Sync (Optional)**: If you enable cloud backup, requests are sent directly to your configured API server over HTTPS. If password reset emails are enabled, automated reset tokens are sent via Resend's transactional email API.

---

## 6. Data Retention and Deletion

You have complete control over your data at all times:
- **Edit & Delete Notes**: You can modify or delete individual notes at any time from the side panel or dashboard.
- **Permanent Purge**: Soft-deleted notes in the Trash can be permanently removed with one click.
- **Data Export**: You can export all your notes at any time to standard JSON, Markdown (`.md`), or CSV formats via the Dashboard.
- **Complete Local Deletion**: Uninstalling WebMemo from Chrome (`chrome://extensions` → Remove) immediately and permanently deletes all local IndexedDB notes from your computer.
- **Cloud Account Deletion**: If you created a cloud sync account, you can request full account and data deletion by contacting us.

---

## 7. Security

We take data security seriously:
- Local notes are isolated within your browser’s sandboxed extension storage.
- All cloud communications occur exclusively over encrypted HTTPS connections with JSON Web Token (JWT) authorization and short-lived session rotation.
- Content is sanitized server-side to prevent malicious code injection.

---

## 8. Children's Privacy

WebMemo is not directed to children under the age of 13, and we do not knowingly collect personal information from children.

---

## 9. Changes to This Privacy Policy

We may update this Privacy Policy from time to time to reflect changes in our features or legal requirements. Any updates will be posted to this repository with an updated "Last Updated" date.

---

## 10. Contact Us

If you have questions, concerns, or requests regarding this Privacy Policy or your data, please reach out:

- **GitHub Issues**: Submit an issue or discussion on this repository.
- **Developer Email**: [support@example.com] *(Replace with your contact email)*
