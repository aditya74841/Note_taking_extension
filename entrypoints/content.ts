export default defineContentScript({
  matches: ['<all_urls>'],
  async main() {
    if (window.location.protocol !== 'http:' && window.location.protocol !== 'https:') {
      return;
    }

    // ── Badge is OFF by default. Only show it if the user has opted in. ──
    // Users can enable it from the extension sidepanel settings area.
    const BADGE_PREF_KEY = 'urlnotes_badge_enabled';

    let badgeEnabled = false;
    try {
      const stored = await browser.storage.local.get(BADGE_PREF_KEY);
      badgeEnabled = stored[BADGE_PREF_KEY] === true;
    } catch {
      // Storage not available; default off
    }

    let badgeElement: HTMLDivElement | null = null;

    // Listen for messages from background
    browser.runtime.onMessage.addListener((message) => {
      if (message?.type === 'SHOW_SAVED_TOAST') {
        showSelectionToast(message.textSnippet || 'Text added to URL Note');
        if (badgeEnabled) refreshPageNoteCount();
      } else if (message?.type === 'NOTE_SAVED' || message?.type === 'NOTE_DELETED') {
        if (badgeEnabled) refreshPageNoteCount();
      } else if (message?.type === 'BADGE_PREF_CHANGED') {
        badgeEnabled = message.enabled;
        if (!badgeEnabled) removeFloatingBadge();
        else refreshPageNoteCount();
      }
    });

    if (badgeEnabled) {
      refreshPageNoteCount();
    }

    async function refreshPageNoteCount() {
      try {
        const response = await browser.runtime.sendMessage({
          type: 'GET_PAGE_NOTE_STATUS',
          url: window.location.href,
        });

        if (response?.count > 0) {
          showFloatingBadge(response.count);
        } else {
          removeFloatingBadge();
        }
      } catch {
        // Background not ready
      }
    }

    function showFloatingBadge(count: number) {
      if (!badgeElement) {
        badgeElement = document.createElement('div');
        badgeElement.id = 'url-notes-floating-badge';

        Object.assign(badgeElement.style, {
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          zIndex: '2147483647',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          padding: '6px 10px 6px 12px',
          background: 'rgba(13, 15, 20, 0.92)',
          color: '#c9cdd8',
          fontSize: '12px',
          fontWeight: '600',
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          borderRadius: '20px',
          border: '1px solid rgba(99, 102, 241, 0.35)',
          boxShadow: '0 4px 16px rgba(0, 0, 0, 0.4)',
          cursor: 'pointer',
          userSelect: 'none',
          backdropFilter: 'blur(8px)',
          transition: 'transform 0.18s ease, box-shadow 0.18s ease',
        });

        // Note label — clicking opens sidepanel
        const label = document.createElement('span');
        label.style.cursor = 'pointer';
        label.addEventListener('click', () => {
          browser.runtime.sendMessage({ type: 'OPEN_SIDEPANEL' });
        });
        badgeElement.appendChild(label);

        // ✕ dismiss button — hides badge for this page session
        const closeBtn = document.createElement('button');
        Object.assign(closeBtn.style, {
          background: 'transparent',
          border: 'none',
          color: '#525669',
          fontSize: '11px',
          cursor: 'pointer',
          padding: '0 2px',
          lineHeight: '1',
          marginLeft: '2px',
        });
        closeBtn.textContent = '✕';
        closeBtn.title = 'Dismiss badge for this session';
        closeBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          removeFloatingBadge();
        });
        badgeElement.appendChild(closeBtn);

        badgeElement.addEventListener('mouseenter', () => {
          if (badgeElement) {
            badgeElement.style.transform = 'translateY(-2px)';
            badgeElement.style.boxShadow = '0 6px 20px rgba(0, 0, 0, 0.5)';
          }
        });
        badgeElement.addEventListener('mouseleave', () => {
          if (badgeElement) {
            badgeElement.style.transform = 'translateY(0)';
            badgeElement.style.boxShadow = '0 4px 16px rgba(0, 0, 0, 0.4)';
          }
        });

        document.body.appendChild(badgeElement);
      }

      // Update the label text only
      const label = badgeElement.querySelector('span');
      if (label) {
        label.textContent = `📝 ${count} ${count === 1 ? 'Note' : 'Notes'}`;
      }
    }

    function removeFloatingBadge() {
      if (badgeElement) {
        badgeElement.remove();
        badgeElement = null;
      }
    }

    function showSelectionToast(snippet: string) {
      const toast = document.createElement('div');
      Object.assign(toast.style, {
        position: 'fixed',
        bottom: '68px',
        right: '20px',
        zIndex: '2147483647',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '8px 14px',
        background: 'rgba(13, 15, 20, 0.95)',
        color: '#9da3b8',
        fontSize: '12px',
        fontWeight: '500',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        borderRadius: '8px',
        border: '1px solid rgba(99, 102, 241, 0.3)',
        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.5)',
        opacity: '0',
        transform: 'translateY(8px)',
        transition: 'all 0.22s cubic-bezier(0.16, 1, 0.3, 1)',
        backdropFilter: 'blur(8px)',
        maxWidth: '280px',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
      });

      const trimmed = snippet.length > 28 ? snippet.slice(0, 28) + '…' : snippet;
      toast.innerHTML = `<span style="color:#4a9a78;font-weight:700;">✓</span> Saved: "<span style="color:#c9cdd8">${trimmed}</span>"`;

      document.body.appendChild(toast);

      requestAnimationFrame(() => {
        toast.style.opacity = '1';
        toast.style.transform = 'translateY(0)';
      });

      setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(8px)';
        setTimeout(() => toast.remove(), 220);
      }, 2500);
    }
  },
});
