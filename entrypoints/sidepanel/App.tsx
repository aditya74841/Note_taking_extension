import { useCallback, useEffect, useRef, useState } from 'react';
import { Globe, Layers } from 'lucide-react';
import {
  getNote,
  getNotesByDomain,
  getAllNotes,
  saveNote,
  deleteNote,
  type Note,
} from '@/lib/db';
import {
  getTabUrlKey,
  extractDomain,
  getMainUrl,
  getMainUrlKey,
  isMainUrl,
} from '@/lib/urlKey';
import { extractHashtags } from '@/lib/markdown';

import { Header } from './components/Header';
import { NavTabs, type ActiveTab } from './components/NavTabs';
import { NoteEditor, type SaveStatus } from './components/NoteEditor';
import { WebsiteNotesView } from './components/WebsiteNotesView';
import { AllNotesGroupedView } from './components/AllNotesGroupedView';
import { AuthModal } from './components/AuthModal';
import { backupNoteToCloud, backupPinToCloud } from '@/lib/sync';

import './App.css';

const PINNED_DOMAINS_KEY = 'urlnotes_pinned_domains';

interface PinnedNoteEntry {
  urlKey: string;
  title: string;
  fullUrl: string;
}

interface CurrentTabContext {
  tabId: number;
  urlKey: string;
  domain: string;
  fullUrl: string;
  mainUrl: string;
  mainUrlKey: string;
  title: string;
  isMainUrl: boolean;
}

async function getActiveTabContext(): Promise<CurrentTabContext | null> {
  try {
    let tabs = await browser.tabs.query({ active: true, lastFocusedWindow: true, windowType: 'normal' });
    if (!tabs || tabs.length === 0 || !tabs[0]?.url) {
      tabs = await browser.tabs.query({ active: true, windowType: 'normal' });
    }
    if (!tabs || tabs.length === 0 || !tabs[0]?.url) {
      tabs = await browser.tabs.query({ active: true, lastFocusedWindow: true });
    }
    if (!tabs || tabs.length === 0 || !tabs[0]?.url) {
      tabs = await browser.tabs.query({ active: true, currentWindow: true });
    }
    if (!tabs || tabs.length === 0 || !tabs[0]?.url) {
      tabs = await browser.tabs.query({ active: true });
    }

    const tab = tabs[0];
    if (!tab?.id || !tab.url) return null;

    const urlKey = getTabUrlKey(tab);
    const domain = extractDomain(tab.url);
    const mainUrl = getMainUrl(tab.url);
    const mainUrlKey = getMainUrlKey(tab.url);

    if (!urlKey || !domain || !mainUrl || !mainUrlKey) return null;

    return {
      tabId: tab.id,
      urlKey,
      domain,
      fullUrl: tab.url,
      mainUrl,
      mainUrlKey,
      title: tab.title ?? domain,
      isMainUrl: isMainUrl(tab.url),
    };
  } catch (err) {
    console.error('Error getting tab context:', err);
    return null;
  }
}

export default function App() {
  const [currentTab, setCurrentTab] = useState<CurrentTabContext | null>(null);
  const [activeNav, setActiveNav] = useState<ActiveTab>('page');

  // Active page note content & status
  const [editorContent, setEditorContent] = useState('');
  const [editorTargetUrlKey, setEditorTargetUrlKey] = useState<string>('');
  const [editorTargetTitle, setEditorTargetTitle] = useState<string>('');
  const [editorTargetFullUrl, setEditorTargetFullUrl] = useState<string>('');
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const [lastSavedTime, setLastSavedTime] = useState<number | null>(null);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [isHeaderCollapsed, setIsHeaderCollapsed] = useState(false);
  const [isPinned, setIsPinned] = useState(false);
  const isPinnedRef = useRef(false);

  const [pinnedMap, setPinnedMap] = useState<Record<string, PinnedNoteEntry>>({});
  const pinnedMapRef = useRef<Record<string, PinnedNoteEntry>>({});

  // Domain accordion collapsed state
  const [collapsedDomains, setCollapsedDomains] = useState<Record<string, boolean>>({});

  // Notes lists
  const [websiteNotes, setWebsiteNotes] = useState<Note[]>([]);
  const [allNotesList, setAllNotesList] = useState<Note[]>([]);
  const [mainUrlNote, setMainUrlNote] = useState<Note | null>(null);

  // Search, Tag & Copy UI state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTagFilter, setSelectedTagFilter] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isSavePendingRef = useRef(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const contextRef = useRef<CurrentTabContext | null>(null);

  const editorContentRef = useRef(editorContent);
  const editorTargetTitleRef = useRef(editorTargetTitle);
  const editorTargetUrlKeyRef = useRef(editorTargetUrlKey);
  const editorTargetFullUrlRef = useRef(editorTargetFullUrl);

  useEffect(() => { editorContentRef.current = editorContent; }, [editorContent]);
  useEffect(() => { editorTargetTitleRef.current = editorTargetTitle; }, [editorTargetTitle]);
  useEffect(() => { editorTargetUrlKeyRef.current = editorTargetUrlKey; }, [editorTargetUrlKey]);
  useEffect(() => { editorTargetFullUrlRef.current = editorTargetFullUrl; }, [editorTargetFullUrl]);

  // Load website & global notes
  const refreshNotesLists = useCallback(async (domain?: string) => {
    try {
      if (domain) {
        const siteNotes = await getNotesByDomain(domain);
        setWebsiteNotes(siteNotes);
      } else {
        setWebsiteNotes([]);
      }
      const globalNotes = await getAllNotes();
      setAllNotesList(globalNotes);
    } catch (err) {
      console.error('Failed to load notes from DB:', err);
    }
  }, []);

  // Load active tab data
  const loadTabContextAndNotes = useCallback(
    async (isInitial = false) => {
      if (isInitial) setLoading(true);

      try {
        const context = await getActiveTabContext();
        contextRef.current = context;
        setCurrentTab(context);

        // Fetch global notes so All Notes view always works
        const globalNotes = await getAllNotes();
        setAllNotesList(globalNotes);

        if (!context) {
          // Unsupported tab (e.g. chrome://, edge://, extensions page)
          if (!isSavePendingRef.current) setEditorContent('');
          setWebsiteNotes([]);
          // Default to 'all' nav tab when on non-web page so saved notes are visible
          if (isInitial) setActiveNav('all');
          return;
        }

        // Synchronous check against pinnedMapRef.current
        const domainPin = context ? pinnedMapRef.current[context.domain] : undefined;

        if (domainPin) {
          // Domain HAS a pinned note!
          setIsPinned(true);
          isPinnedRef.current = true;

          if (!isSavePendingRef.current) {
            const pinnedNote = await getNote(domainPin.urlKey);
            setEditorContent(pinnedNote?.content ?? '');
            setEditorTargetUrlKey(domainPin.urlKey);
            setEditorTargetTitle(pinnedNote?.title || domainPin.title || context.title);
            setEditorTargetFullUrl(pinnedNote?.fullUrl || domainPin.fullUrl || context.fullUrl);
            setLastSavedTime(pinnedNote?.updatedAt ?? null);
            setSaveStatus('idle');
          }
        } else {
          // Domain is NOT pinned
          setIsPinned(false);
          isPinnedRef.current = false;

          if (!isSavePendingRef.current) {
            const pageNote = await getNote(context.urlKey);
            setEditorContent(pageNote?.content ?? '');
            setEditorTargetUrlKey(context.urlKey);
            setEditorTargetTitle(pageNote?.title || '');
            setEditorTargetFullUrl(context.fullUrl);
            setLastSavedTime(pageNote?.updatedAt ?? null);
            setSaveStatus('idle');
          }
        }

        const mainNote = await getNote(context.mainUrlKey);
        setMainUrlNote(mainNote ?? null);

        const siteNotes = await getNotesByDomain(context.domain);
        setWebsiteNotes(siteNotes);
      } catch (err) {
        console.error('Error loading tab context and notes:', err);
      } finally {
        if (isInitial) setLoading(false);
      }
    },
    []
  );

  const togglePin = useCallback(async () => {
    const context = contextRef.current;
    if (!context) return;

    const domain = context.domain;
    const currentTargetKey = editorTargetUrlKeyRef.current;
    const currentTitle = editorTargetTitleRef.current;
    const currentFullUrl = editorTargetFullUrlRef.current;

    if (!domain || !currentTargetKey) return;

    const isCurrentlyPinned = !!pinnedMapRef.current[domain];
    const nextMap = { ...pinnedMapRef.current };

    if (isCurrentlyPinned) {
      delete nextMap[domain];
      setIsPinned(false);
      isPinnedRef.current = false;
    } else {
      nextMap[domain] = {
        urlKey: currentTargetKey,
        title: currentTitle || context.title,
        fullUrl: currentFullUrl || context.fullUrl,
      };
      setIsPinned(true);
      isPinnedRef.current = true;
    }

    pinnedMapRef.current = nextMap;
    setPinnedMap(nextMap);

    if (typeof browser !== 'undefined' && browser.storage?.local) {
      await browser.storage.local.set({ [PINNED_DOMAINS_KEY]: nextMap }).catch(() => {});
    }

    backupPinToCloud({
      domain,
      urlKey: currentTargetKey,
      title: currentTitle || context.title,
      fullUrl: currentFullUrl || context.fullUrl,
      isUnpin: isCurrentlyPinned,
    });

    if (isCurrentlyPinned) {
      loadTabContextAndNotes(false);
    }
  }, [loadTabContextAndNotes]);

  // Refresh list cards without overwriting active editor content
  const refreshListsOnly = useCallback(async () => {
    try {
      const globalNotes = await getAllNotes();
      setAllNotesList(globalNotes);
      const context = contextRef.current;
      if (context) {
        const mainNote = await getNote(context.mainUrlKey);
        setMainUrlNote(mainNote ?? null);
        const siteNotes = await getNotesByDomain(context.domain);
        setWebsiteNotes(siteNotes);
      }
    } catch (err) {
      console.error('Failed to refresh list cards:', err);
    }
  }, []);

  // Tab & Runtime listeners
  useEffect(() => {
    async function init() {
      if (typeof browser !== 'undefined' && browser.storage?.local) {
        try {
          const res = await browser.storage.local.get(PINNED_DOMAINS_KEY).catch(() => ({}));
          const resObj = (res || {}) as Record<string, any>;
          const stored = resObj[PINNED_DOMAINS_KEY] as Record<string, PinnedNoteEntry> | undefined;
          if (stored && typeof stored === 'object') {
            pinnedMapRef.current = stored;
            setPinnedMap(stored);
          }
        } catch (err) {
          console.error('Failed to load pinned map:', err);
        }
      }
      loadTabContextAndNotes(true);
    }
    init();

    const onActivated = () => loadTabContextAndNotes(false);
    const onUpdated = (_tabId: number, changeInfo: { status?: string; url?: string }) => {
      if (changeInfo.status === 'complete' || changeInfo.url) {
        loadTabContextAndNotes(false);
      }
    };

    const onMessage = (message: any) => {
      if (message?.type === 'NOTE_SAVED') {
        refreshListsOnly();
      } else if (message?.type === 'NOTE_DELETED') {
        loadTabContextAndNotes(false);
      }
    };

    browser.tabs.onActivated.addListener(onActivated);
    browser.tabs.onUpdated.addListener(onUpdated);
    browser.runtime.onMessage.addListener(onMessage);

    return () => {
      browser.tabs.onActivated.removeListener(onActivated);
      browser.tabs.onUpdated.removeListener(onUpdated);
      browser.runtime.onMessage.removeListener(onMessage);
    };
  }, [loadTabContextAndNotes, refreshListsOnly]);

  // Persist current note changes (Only save if actual text exists; delete if empty)
  const persistEditorNote = useCallback(
    async (nextContent: string, targetKey: string, targetTitle: string, targetFullUrl: string) => {
      const context = contextRef.current;
      if (!targetKey) return;

      const plainText = (nextContent || '').replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim();
      const isEmpty = plainText.length === 0;

      const domain = context ? context.domain : extractDomain(targetFullUrl) || 'other';

      if (isEmpty) {
        // If content is empty, remove any empty note from IndexedDB
        await deleteNote(targetKey);
        setSaveStatus('idle');
        setLastSavedTime(null);

        // Backup soft delete to cloud in background
        backupNoteToCloud({
          urlKey: targetKey,
          domain,
          fullUrl: targetFullUrl,
          title: '',
          content: '',
          isDeleted: true,
        });

        // Safeguard #2: Auto-unpin if the empty note was pinned
        if (pinnedMapRef.current[domain]?.urlKey === targetKey) {
          const nextMap = { ...pinnedMapRef.current };
          delete nextMap[domain];
          pinnedMapRef.current = nextMap;
          setPinnedMap(nextMap);
          setIsPinned(false);
          isPinnedRef.current = false;
          if (typeof browser !== 'undefined' && browser.storage?.local) {
            await browser.storage.local.set({ [PINNED_DOMAINS_KEY]: nextMap }).catch(() => {});
          }
          backupPinToCloud({ domain, isUnpin: true });
        }
      } else {
        setSaveStatus('saving');
        await saveNote({
          urlKey: targetKey,
          fullUrl: targetFullUrl,
          title: targetTitle || targetFullUrl,
          content: nextContent,
          domain: domain,
        });
        setSaveStatus('saved');
        setLastSavedTime(Date.now());

        // Backup note to cloud in background
        backupNoteToCloud({
          urlKey: targetKey,
          domain,
          fullUrl: targetFullUrl,
          title: targetTitle || targetFullUrl,
          content: nextContent,
        });

        // Safeguard #3: Sync title changes to pinnedMap if this note is pinned
        const currentPin = pinnedMapRef.current[domain];
        if (currentPin && currentPin.urlKey === targetKey) {
          const newTitle = targetTitle || targetFullUrl;
          if (currentPin.title !== newTitle) {
            const nextMap = {
              ...pinnedMapRef.current,
              [domain]: { ...currentPin, title: newTitle },
            };
            pinnedMapRef.current = nextMap;
            setPinnedMap(nextMap);
            if (typeof browser !== 'undefined' && browser.storage?.local) {
              await browser.storage.local.set({ [PINNED_DOMAINS_KEY]: nextMap }).catch(() => {});
            }
          }
        }
      }

      if (context) {
        await browser.runtime.sendMessage({
          type: isEmpty ? 'NOTE_DELETED' : 'NOTE_SAVED',
          urlKey: targetKey,
          tabId: context.tabId,
        });
      }

      await refreshNotesLists(domain);

      if (context && targetKey === context.mainUrlKey) {
        const updatedMain = await getNote(context.mainUrlKey);
        setMainUrlNote(updatedMain ?? null);
      }

      isSavePendingRef.current = false;
    },
    [refreshNotesLists]
  );

  const handleTitleChange = (nextTitle: string) => {
    setEditorTargetTitle(nextTitle);
    editorTargetTitleRef.current = nextTitle;
    setSaveStatus('saving');
    isSavePendingRef.current = true;

    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
    }

    saveTimerRef.current = setTimeout(() => {
      persistEditorNote(
        editorContentRef.current,
        editorTargetUrlKeyRef.current,
        nextTitle,
        editorTargetFullUrlRef.current
      );
    }, 500);
  };

  const handleEditorChange = (nextContent: string) => {
    setEditorContent(nextContent);
    editorContentRef.current = nextContent;
    setSaveStatus('saving');
    isSavePendingRef.current = true;

    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
    }

    saveTimerRef.current = setTimeout(() => {
      persistEditorNote(
        nextContent,
        editorTargetUrlKeyRef.current,
        editorTargetTitleRef.current,
        editorTargetFullUrlRef.current
      );
    }, 500);
  };

  // Switch editor to target note
  const openInEditor = async (noteKey: string, defaultTitle: string, fullUrl: string) => {
    setEditorTargetUrlKey(noteKey);
    setEditorTargetFullUrl(fullUrl);

    const existingNote = await getNote(noteKey);
    const resolvedTitle = existingNote?.title || defaultTitle || '';
    setEditorTargetTitle(resolvedTitle);
    setEditorContent(existingNote?.content ?? '');
    setLastSavedTime(existingNote?.updatedAt ?? null);
    setSaveStatus('idle');
    setIsPreviewMode(false);

    // Safeguard #4: If currently pinned on this domain, update the pin target to this newly selected note!
    const targetDomain = extractDomain(fullUrl) || currentTab?.domain;
    if (targetDomain && pinnedMapRef.current[targetDomain]) {
      const nextMap = {
        ...pinnedMapRef.current,
        [targetDomain]: {
          urlKey: noteKey,
          title: resolvedTitle || fullUrl,
          fullUrl: fullUrl,
        },
      };
      pinnedMapRef.current = nextMap;
      setPinnedMap(nextMap);
      setIsPinned(true);
      isPinnedRef.current = true;
      if (typeof browser !== 'undefined' && browser.storage?.local) {
        await browser.storage.local.set({ [PINNED_DOMAINS_KEY]: nextMap }).catch(() => {});
      }
    }

    setActiveNav('page');
  };

  // Handle note deletion
  const handleDeleteNote = async (urlKey: string) => {
    if (window.confirm('Are you sure you want to delete this note?')) {
      await deleteNote(urlKey);
      const domain = currentTab?.domain || extractDomain(urlKey) || 'other';

      // Backup soft delete to cloud in background
      backupNoteToCloud({
        urlKey,
        domain,
        fullUrl: '',
        title: '',
        content: '',
        isDeleted: true,
      });

      // Safeguard #1: Auto-unpin domain if the deleted note was the pinned note
      if (pinnedMapRef.current[domain]?.urlKey === urlKey) {
        const nextMap = { ...pinnedMapRef.current };
        delete nextMap[domain];
        pinnedMapRef.current = nextMap;
        setPinnedMap(nextMap);
        setIsPinned(false);
        isPinnedRef.current = false;
        if (typeof browser !== 'undefined' && browser.storage?.local) {
          await browser.storage.local.set({ [PINNED_DOMAINS_KEY]: nextMap }).catch(() => {});
        }
        backupPinToCloud({ domain, isUnpin: true });
      }

      await refreshNotesLists(domain);
      if (urlKey === editorTargetUrlKey) {
        setEditorContent('');
      }
      if (currentTab && urlKey === currentTab.mainUrlKey) {
        setMainUrlNote(null);
      }
      if (currentTab) {
        await browser.runtime.sendMessage({
          type: 'NOTE_DELETED',
          urlKey,
          tabId: currentTab.tabId,
        });
      }
    }
  };

  // Copy content helper
  const handleCopyContent = (key: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // Open note URL in browser tab
  const handleOpenUrl = (fullUrl: string) => {
    if (fullUrl) {
      browser.tabs.create({ url: fullUrl.startsWith('http') ? fullUrl : `https://${fullUrl}` });
    }
  };

  // Quick text inserts
  const insertTemplate = (prefix: string) => {
    const next = editorContent ? `${editorContent}\n${prefix} ` : `${prefix} `;
    handleEditorChange(next);
  };

  // Export Notes to JSON
  const handleExportBackup = async () => {
    const allNotes = await getAllNotes();
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(allNotes, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `url-notes-backup-${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Import Notes from JSON
  const handleImportBackup = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const imported = JSON.parse(text);
      if (Array.isArray(imported)) {
        let count = 0;
        for (const note of imported) {
          if (note.urlKey && note.content) {
            await saveNote(note);
            count++;
          }
        }
        alert(`Successfully imported ${count} notes!`);
        await refreshNotesLists(currentTab?.domain);
        if (currentTab) {
          const activeNote = await getNote(currentTab.urlKey);
          if (activeNote) {
            setEditorContent(activeNote.content);
          }
        }
      } else {
        alert('Invalid JSON file format.');
      }
    } catch (err) {
      console.error('Import error:', err);
      alert('Failed to import notes file.');
    }
  };

  const toggleDomainCollapse = (domain: string) => {
    setCollapsedDomains((prev) => ({
      ...prev,
      [domain]: !prev[domain],
    }));
  };

  // Extract all available tags across active domain or global notes
  const currentNavNotes = activeNav === 'website' ? websiteNotes : allNotesList;
  const availableTags = Array.from(
    new Set((currentNavNotes || []).flatMap((n) => extractHashtags(n.content)))
  );

  // Filtering by search & tags
  const matchesFilter = (n: Note) => {
    if (!n) return false;
    const title = n.title || '';
    const content = n.content || '';
    const domain = n.domain || '';
    const fullUrl = n.fullUrl || '';
    const queryLower = (searchQuery || '').toLowerCase();

    const matchesSearch =
      !searchQuery ||
      title.toLowerCase().includes(queryLower) ||
      content.toLowerCase().includes(queryLower) ||
      domain.toLowerCase().includes(queryLower) ||
      fullUrl.toLowerCase().includes(queryLower);

    const matchesTag =
      !selectedTagFilter ||
      extractHashtags(content).includes(selectedTagFilter.toLowerCase());

    return matchesSearch && matchesTag;
  };

  const filteredWebsiteNotes = (websiteNotes || []).filter(matchesFilter);
  const filteredAllNotes = (allNotesList || []).filter(matchesFilter);

  // Group All Notes by Domain
  const groupedAllNotes = filteredAllNotes.reduce((acc, note) => {
    if (!note) return acc;
    const d = note.domain || 'other';
    if (!acc[d]) acc[d] = [];
    acc[d].push(note);
    return acc;
  }, {} as Record<string, Note[]>);

  if (loading) {
    return (
      <div className="panel flex-center">
        <div className="spinner-loader"></div>
        <p className="loading-text">Loading notes...</p>
      </div>
    );
  }

  // Header display context (fallback for non-web pages)
  const headerDomain = currentTab?.domain || 'All Saved Notes';
  const headerTitle =
    isPinned && editorTargetTitle
      ? editorTargetTitle
      : currentTab?.title || (currentTab ? currentTab.fullUrl : 'Global Notes Workspace');
  const headerFullUrl =
    isPinned && editorTargetFullUrl
      ? editorTargetFullUrl
      : currentTab?.fullUrl || 'chrome://extensions';
  const isEditingMainUrl = currentTab ? editorTargetUrlKey === currentTab.mainUrlKey : false;

  return (
    <div className="panel">
      {/* Hidden File Input for Import */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleImportBackup}
        accept=".json"
        style={{ display: 'none' }}
      />

      {/* HEADER SECTION */}
      <Header
        domain={headerDomain}
        title={headerTitle}
        fullUrl={headerFullUrl}
        notesCount={websiteNotes.length}
        totalNotesCount={allNotesList.length}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        availableTags={availableTags}
        selectedTagFilter={selectedTagFilter}
        setSelectedTagFilter={setSelectedTagFilter}
        editableTitle={activeNav === 'page' ? editorTargetTitle : undefined}
        onTitleChange={activeNav === 'page' ? handleTitleChange : undefined}
        onOpenMainUrlNote={
          currentTab
            ? () => openInEditor(currentTab.mainUrlKey, currentTab.domain, currentTab.mainUrl)
            : undefined
        }
        hasMainUrlNote={!!mainUrlNote}
        isEditingMainUrl={isEditingMainUrl}
        isHeaderCollapsed={isHeaderCollapsed}
        onToggleCollapseHeader={() => setIsHeaderCollapsed(!isHeaderCollapsed)}
        isPinned={isPinned}
        onTogglePin={togglePin}
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
      />

      {/* NAVIGATION TABS */}
      <NavTabs
        activeNav={activeNav}
        setActiveNav={setActiveNav}
        websiteNotesCount={websiteNotes.length}
        allNotesCount={allNotesList.length}
        onSelectActivePage={() => {
          if (currentTab) {
            const domainPin = pinnedMapRef.current[currentTab.domain];
            if (domainPin) {
              setEditorTargetUrlKey(domainPin.urlKey);
              setEditorTargetTitle(domainPin.title);
              setEditorTargetFullUrl(domainPin.fullUrl);
              getNote(domainPin.urlKey).then((n) => setEditorContent(n?.content ?? ''));
            } else {
              setEditorTargetUrlKey(currentTab.urlKey);
              setEditorTargetTitle(currentTab.title);
              setEditorTargetFullUrl(currentTab.fullUrl);
              getNote(currentTab.urlKey).then((n) => setEditorContent(n?.content ?? ''));
            }
          }
          setActiveNav('page');
        }}
      />

      {/* TAB CONTENT VIEWS */}
      <main className="tab-content">
        {activeNav === 'page' && (
          <>
            {!currentTab ? (
              <div className="empty-state-box" style={{ margin: '20px' }}>
                <Globe size={32} className="text-muted" />
                <p className="empty-title">Browser System Page</p>
                <p className="empty-sub">
                  Page-specific notes require an active web page (http/https). Switch to "All Notes" to view all your saved notes.
                </p>
                <button className="btn-primary-sm" onClick={() => setActiveNav('all')}>
                  <Layers size={13} /> View All Saved Notes ({allNotesList.length})
                </button>
              </div>
            ) : (
              <NoteEditor
                isEditingMainUrl={isEditingMainUrl}
                domain={currentTab.domain}
                saveStatus={saveStatus}
                isPreviewMode={isPreviewMode}
                setIsPreviewMode={setIsPreviewMode}
                editorTargetTitle={editorTargetTitle}
                onTitleChange={handleTitleChange}
                isMainUrl={currentTab.isMainUrl}
                mainUrlNote={mainUrlNote}
                editorTargetUrlKey={editorTargetUrlKey}
                domainMainUrlKey={currentTab.mainUrlKey}
                domainMainUrl={currentTab.mainUrl}
                editorContent={editorContent}
                onEditorChange={handleEditorChange}
                onOpenInEditor={openInEditor}
                onInsertTemplate={insertTemplate}
                lastSavedTime={lastSavedTime}
                copiedKey={copiedKey}
                onCopyContent={handleCopyContent}
                onDeleteNote={handleDeleteNote}
                activeTitle={currentTab.title}
              />
            )}
          </>
        )}

        {activeNav === 'website' && (
          <WebsiteNotesView
            domain={currentTab?.domain || 'this website'}
            notes={filteredWebsiteNotes}
            selectedTagFilter={selectedTagFilter}
            mainUrlKey={currentTab?.mainUrlKey || ''}
            mainUrl={currentTab?.mainUrl || ''}
            currentUrlKey={editorTargetUrlKey}
            copiedKey={copiedKey}
            onOpenInEditor={openInEditor}
            onCopyContent={handleCopyContent}
            onOpenUrl={handleOpenUrl}
            onDeleteNote={handleDeleteNote}
            onSelectTag={(tag) => setSelectedTagFilter(tag)}
            onCreatePageNote={() => {
              if (currentTab) {
                openInEditor(currentTab.urlKey, currentTab.title, currentTab.fullUrl);
              }
            }}
          />
        )}

        {activeNav === 'all' && (
          <AllNotesGroupedView
            totalNotesCount={filteredAllNotes.length}
            selectedTagFilter={selectedTagFilter}
            groupedNotes={groupedAllNotes}
            collapsedDomains={collapsedDomains}
            onToggleDomainCollapse={toggleDomainCollapse}
            copiedKey={copiedKey}
            onOpenInEditor={openInEditor}
            onCopyContent={handleCopyContent}
            onOpenUrl={handleOpenUrl}
            onDeleteNote={handleDeleteNote}
            onSelectTag={(tag) => setSelectedTagFilter(tag)}
          />
        )}
      </main>

      {/* CLOUD AUTH & SYNC MODAL */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onRestoreSuccess={() => {
          setIsAuthModalOpen(false);
          refreshNotesLists(currentTab?.domain);
        }}
      />
    </div>
  );
}
