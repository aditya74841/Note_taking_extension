import { hasNote } from '@/lib/db';
import { isNoteSavedMessage } from '@/lib/messages';
import { normalizeUrl } from '@/lib/urlKey';

const BADGE_COLOR = '#4F46E5';

async function updateBadge(tabId: number, url?: string) {
  const urlKey = normalizeUrl(url);
  if (!urlKey) {
    await browser.action.setBadgeText({ tabId, text: '' });
    return;
  }

  const exists = await hasNote(urlKey);
  await browser.action.setBadgeText({ tabId, text: exists ? '•' : '' });
  await browser.action.setBadgeBackgroundColor({ tabId, color: BADGE_COLOR });
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
}

export default defineBackground(() => {
  const sidePanel = (browser as typeof browser & { sidePanel?: SidePanelAPI }).sidePanel;

  if (sidePanel) {
    sidePanel.setPanelBehavior({ openPanelOnActionClick: true }).catch(console.error);
  }

  browser.tabs.onActivated.addListener(({ tabId }) => {
    updateBadgeForTab(tabId);
  });

  browser.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete' || changeInfo.url) {
      updateBadge(tabId, tab.url);
    }
  });

  browser.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (isNoteSavedMessage(message)) {
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
