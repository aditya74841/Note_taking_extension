import { getDomainNoteCount, getNote, saveNote } from '@/lib/db';
import { isNoteSavedMessage, isNoteDeletedMessage } from '@/lib/messages';
import { extractDomain, normalizeUrl } from '@/lib/urlKey';

const BADGE_COLOR = '#6366F1';
const CONTEXT_MENU_ID = 'add-selection-to-url-note';

async function updateBadge(tabId: number, url?: string) {
  const domain = extractDomain(url);
  if (!domain) {
    await browser.action.setBadgeText({ tabId, text: '' });
    return;
  }

  try {
    const count = await getDomainNoteCount(domain);
    const text = count > 0 ? (count > 99 ? '99+' : String(count)) : '';
    await browser.action.setBadgeText({ tabId, text });
    await browser.action.setBadgeBackgroundColor({ tabId, color: BADGE_COLOR });
  } catch {
    await browser.action.setBadgeText({ tabId, text: '' });
  }
}

async function updateBadgeForTab(tabId: number) {
  try {
    const tab = await browser.tabs.get(tabId);
    await updateBadge(tabId, tab.url);
  } catch {
    await browser.action.setBadgeText({ tabId, text: '' });
  }
}

interface SidePanelAPI {
  setPanelBehavior(options: { openPanelOnActionClick: boolean }): Promise<void>;
  open(options: { windowId: number }): Promise<void>;
}

export default defineBackground(() => {
  const sidePanel = (browser as typeof browser & { sidePanel?: SidePanelAPI }).sidePanel;

  if (sidePanel) {
    sidePanel.setPanelBehavior({ openPanelOnActionClick: true }).catch(console.error);
  }

  // Create Context Menu Item
  try {
    browser.contextMenus.removeAll().then(() => {
      browser.contextMenus.create({
        id: CONTEXT_MENU_ID,
        title: 'Add Selection to URL Note',
        contexts: ['selection'],
      });
    });
  } catch (err) {
    console.error('Error creating context menu:', err);
  }

  // Helper to save selection to note
  async function saveSelectionToNote(tab: any, selectionText: string) {
    if (!selectionText || !tab?.url || tab.id === undefined) return;
    const urlKey = normalizeUrl(tab.url);
    const domain = extractDomain(tab.url);
    if (!urlKey || !domain) return;

    const existingNote = await getNote(urlKey);
    const quoteText = selectionText.trim();
    if (!quoteText) return;

    const formattedQuote = quoteText.includes('\n')
      ? quoteText.split('\n').map((line: string) => `> ${line}`).join('\n')
      : `> ${quoteText}`;

    const newContent = existingNote?.content
      ? `${existingNote.content}\n\n${formattedQuote}`
      : formattedQuote;

    await saveNote({
      urlKey,
      domain,
      fullUrl: tab.url,
      title: existingNote?.title || tab.title || domain,
      content: newContent,
    });

    await updateBadge(tab.id, tab.url);

    // Notify sidepanel
    browser.runtime.sendMessage({
      type: 'NOTE_SAVED',
      urlKey,
      tabId: tab.id,
    });

    // Notify content script to display saved toast
    try {
      browser.tabs.sendMessage(tab.id, {
        type: 'SHOW_SAVED_TOAST',
        textSnippet: quoteText,
      });
    } catch (err) {
      // Tab may not have content script injected
    }
  }

  // Handle Context Menu Click
  browser.contextMenus.onClicked.addListener(async (info, tab) => {
    if (info.menuItemId === CONTEXT_MENU_ID && info.selectionText && tab) {
      await saveSelectionToNote(tab, info.selectionText);
    }
  });

  // Handle Keyboard Command (Ctrl+Q)
  browser.commands.onCommand.addListener(async (command) => {
    if (command === 'save-selection') {
      const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
      if (!tab?.id || !tab.url) return;

      try {
        const results = await browser.scripting.executeScript({
          target: { tabId: tab.id },
          func: () => window.getSelection()?.toString() || '',
        });
        const selectedText = results[0]?.result;
        if (selectedText) {
          await saveSelectionToNote(tab, selectedText);
        }
      } catch (err) {
        console.error('Error capturing selection via command:', err);
      }
    }
  });

  browser.tabs.onActivated.addListener(({ tabId }) => {
    updateBadgeForTab(tabId);
  });

  browser.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete' || changeInfo.url) {
      updateBadge(tabId, tab.url);
    }
  });

  browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message?.type === 'GET_PAGE_NOTE_STATUS') {
      const domain = extractDomain(message.url);
      if (domain) {
        getDomainNoteCount(domain).then((count) => sendResponse({ count }));
        return true;
      }
      sendResponse({ count: 0 });
      return false;
    }

    if (message?.type === 'OPEN_SIDEPANEL') {
      if (sender.tab?.windowId && sidePanel?.open) {
        sidePanel.open({ windowId: sender.tab.windowId }).catch(console.error);
      }
      return false;
    }

    if (isNoteSavedMessage(message) || isNoteDeletedMessage(message)) {
      updateBadgeForTab(message.tabId).then(() => sendResponse({ ok: true }));
      return true;
    }
    return false;
  });

  browser.tabs.query({ active: true, currentWindow: true }).then((tabs) => {
    const tab = tabs[0];
    if (tab?.id !== undefined) {
      updateBadge(tab.id, tab.url);
    }
  });
});
