import { useCallback, useEffect, useRef, useState } from 'react';
import { getNote, saveNote } from '@/lib/db';
import { getTabUrlKey } from '@/lib/urlKey';
import './App.css';

type SaveStatus = 'idle' | 'saving' | 'saved';

interface TabContext {
  tabId: number;
  urlKey: string;
  fullUrl: string;
  title: string;
}

async function getActiveTabContext(): Promise<TabContext | null> {
  const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id || !tab.url) return null;

  const urlKey = getTabUrlKey(tab);
  if (!urlKey) return null;

  return {
    tabId: tab.id,
    urlKey,
    fullUrl: tab.url,
    title: tab.title ?? 'Untitled page',
  };
}

function App() {
  const [tabContext, setTabContext] = useState<TabContext | null>(null);
  const [content, setContent] = useState('');
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const [loading, setLoading] = useState(true);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const tabContextRef = useRef<TabContext | null>(null);

  const loadNoteForActiveTab = useCallback(async () => {
    setLoading(true);
    const context = await getActiveTabContext();
    tabContextRef.current = context;
    setTabContext(context);

    if (!context) {
      setContent('');
      setLoading(false);
      return;
    }

    const note = await getNote(context.urlKey);
    setContent(note?.content ?? '');
    setSaveStatus('idle');
    setLoading(false);
  }, []);

  useEffect(() => {
    loadNoteForActiveTab();

    const onActivated = () => loadNoteForActiveTab();
    const onUpdated = (
      _tabId: number,
      changeInfo: { status?: string; url?: string },
    ) => {
      if (changeInfo.status === 'complete' || changeInfo.url) {
        loadNoteForActiveTab();
      }
    };

    browser.tabs.onActivated.addListener(onActivated);
    browser.tabs.onUpdated.addListener(onUpdated);

    return () => {
      browser.tabs.onActivated.removeListener(onActivated);
      browser.tabs.onUpdated.removeListener(onUpdated);
    };
  }, [loadNoteForActiveTab]);

  const persistNote = useCallback(async (nextContent: string) => {
    const context = tabContextRef.current;
    if (!context) return;

    setSaveStatus('saving');

    await saveNote({
      urlKey: context.urlKey,
      fullUrl: context.fullUrl,
      title: context.title,
      content: nextContent,
      updatedAt: Date.now(),
    });

    setSaveStatus('saved');
    await browser.runtime.sendMessage({
      type: 'NOTE_SAVED',
      urlKey: context.urlKey,
      tabId: context.tabId,
    });
  }, []);

  const handleContentChange = (nextContent: string) => {
    setContent(nextContent);
    setSaveStatus('saving');

    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
    }

    saveTimerRef.current = setTimeout(() => {
      persistNote(nextContent);
    }, 500);
  };

  useEffect(() => {
    return () => {
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
      }
    };
  }, []);

  if (loading) {
    return (
      <div className="panel">
        <p className="status">Loading...</p>
      </div>
    );
  }

  if (!tabContext) {
    return (
      <div className="panel">
        <p className="empty-state">Notes aren't available on this page.</p>
      </div>
    );
  }

  return (
    <div className="panel">
      <header className="header">
        <h1 className="title">{tabContext.title}</h1>
        <p className="url">{tabContext.fullUrl}</p>
      </header>

      <textarea
        className="editor"
        value={content}
        onChange={(event) => handleContentChange(event.target.value)}
        placeholder="Write a note for this page..."
        spellCheck
      />

      <footer className="footer">
        <span className="status">
          {saveStatus === 'saving' ? 'Saving...' : saveStatus === 'saved' ? 'Saved' : ''}
        </span>
      </footer>
    </div>
  );
}

export default App;
