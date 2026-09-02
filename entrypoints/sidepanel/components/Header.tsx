import React, { useEffect, useState } from 'react';
import { Globe, Search, X, Filter, Layout, Home, Maximize2, Minimize2, Pin, PinOff, Cloud } from 'lucide-react';

const BADGE_PREF_KEY = 'urlnotes_badge_enabled';

interface HeaderProps {
  domain: string;
  title: string;
  fullUrl: string;
  notesCount: number;
  totalNotesCount: number;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  availableTags: string[];
  selectedTagFilter: string | null;
  setSelectedTagFilter: (tag: string | null) => void;
  editableTitle?: string;
  onTitleChange?: (newTitle: string) => void;
  onOpenMainUrlNote?: () => void;
  hasMainUrlNote?: boolean;
  isEditingMainUrl?: boolean;
  isHeaderCollapsed?: boolean;
  onToggleCollapseHeader?: () => void;
  isPinned?: boolean;
  onTogglePin?: () => void;
  onOpenAuthModal?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  domain,
  title,
  fullUrl,
  notesCount,
  totalNotesCount,
  searchQuery,
  setSearchQuery,
  availableTags,
  selectedTagFilter,
  setSelectedTagFilter,
  editableTitle,
  onTitleChange,
  onOpenMainUrlNote,
  hasMainUrlNote,
  isEditingMainUrl,
  isHeaderCollapsed,
  onToggleCollapseHeader,
  isPinned,
  onTogglePin,
  onOpenAuthModal,
}) => {
  const [badgeEnabled, setBadgeEnabled] = useState(false);

  // Load badge pref on mount
  useEffect(() => {
    if (!browser.storage?.local) return;
    browser.storage.local
      .get(BADGE_PREF_KEY)
      .then((data) => {
        if (!data) return;
        setBadgeEnabled(data[BADGE_PREF_KEY] === true);
      })
      .catch(() => {});
  }, []);

  const toggleBadge = async () => {
    const next = !badgeEnabled;
    setBadgeEnabled(next);
    if (browser.storage?.local) {
      await browser.storage.local.set({ [BADGE_PREF_KEY]: next }).catch(() => {});
    }
    // Notify all content scripts of the preference change
    if (browser.tabs?.query) {
      const tabs = await browser.tabs.query({}).catch(() => []);
      for (const tab of tabs || []) {
        if (tab.id && browser.tabs?.sendMessage) {
          browser.tabs.sendMessage(tab.id, { type: 'BADGE_PREF_CHANGED', enabled: next }).catch(() => {});
        }
      }
    }
  };

  if (isHeaderCollapsed) {
    return (
      <header className="header header-collapsed">
        <div className="collapsed-bar">
          <div className="domain-pill">
            <Globe size={13} className="icon-indigo" />
            <span className="domain-name">{domain}</span>
            {isPinned && (
              <span className="pinned-badge-mini" title="Note is locked. Click Pin icon to unpin.">
                <Pin size={9} />
              </span>
            )}
          </div>
          <button
            className="btn-expand-toggle collapsed-expand-btn"
            onClick={onToggleCollapseHeader}
            title="Show Header"
          >
            <Maximize2 size={13} />
            <span>Show Header</span>
          </button>
        </div>
      </header>
    );
  }

  return (
    <header className="header">
      <div className="brand-bar">
        <div className="domain-pill">
          <Globe size={14} className="icon-indigo" />
          <span className="domain-name">{domain}</span>
          {isPinned && (
            <span className="pinned-badge" title="Note is locked on this page while browsing. Click Pin button to unpin.">
              <Pin size={10} /> Pinned Note
            </span>
          )}
        </div>
        <div className="header-actions">
          {/* Main Website Note Button */}
          {onOpenMainUrlNote && (
            <button
              className={`main-site-header-btn ${isEditingMainUrl ? 'active-main-site' : ''}`}
              title={
                hasMainUrlNote
                  ? `Open Main Domain Note for ${domain}`
                  : `Add Main Domain Note for ${domain}`
              }
              onClick={onOpenMainUrlNote}
            >
              <Home size={12} />
              <span>Main</span>
              {hasMainUrlNote && <span className="main-site-dot" />}
            </button>
          )}

          {/* Pin / Lock Note Toggle */}
          {onTogglePin && (
            <button
              className={`icon-btn-ghost pin-btn ${isPinned ? 'pin-btn-active' : ''}`}
              title={
                isPinned
                  ? 'Unpin note (Resume auto-switching URLs)'
                  : 'Pin active note (Keep this note open while browsing)'
              }
              onClick={onTogglePin}
            >
              {isPinned ? <PinOff size={13} /> : <Pin size={13} />}
            </button>
          )}

          {/* Badge toggle */}
          <button
            className={`icon-btn-ghost badge-toggle ${badgeEnabled ? 'badge-toggle-on' : ''}`}
            title={badgeEnabled ? 'Floating badge: ON (click to disable)' : 'Floating badge: OFF (click to enable)'}
            onClick={toggleBadge}
          >
            <Layout size={13} />
          </button>

          {/* Cloud Sync Auth Button */}
          {onOpenAuthModal && (
            <button
              className="icon-btn-ghost cloud-sync-btn"
              title="Cloud Backup & One-Time Sync"
              onClick={onOpenAuthModal}
            >
              <Cloud size={13} />
            </button>
          )}

          {/* Expand / Hide Header Toggle Button */}
          {onToggleCollapseHeader && (
            <button
              className="icon-btn-ghost btn-expand-toggle"
              title="Expand Editor (Hide Header)"
              onClick={onToggleCollapseHeader}
            >
              <Minimize2 size={13} />
            </button>
          )}

          <span className="notes-badge" title="Total notes saved on this website">
            {notesCount} {notesCount === 1 ? 'note' : 'notes'}
          </span>
        </div>
      </div>

      <div className="page-meta">
        {onTitleChange ? (
          <div className="header-title-edit-box">
            <input
              type="text"
              className="header-title-input"
              value={editableTitle ?? title}
              onChange={(e) => onTitleChange(e.target.value)}
              placeholder="No title"
              title="Click to edit note title"
            />
          </div>
        ) : (
          <h1 className="page-title" title={title || 'No title'}>
            {title || 'No title'}
          </h1>
        )}
        <p className="page-url" title={fullUrl}>
          {fullUrl}
        </p>
      </div>

      {/* SEARCH BAR */}
      <div className="search-box">
        <Search size={14} className="search-icon" />
        <input
          type="text"
          className="search-input"
          placeholder={`Search notes or #tags in ${domain}...`}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        {searchQuery && (
          <button className="icon-btn-ghost" onClick={() => setSearchQuery('')}>
            <X size={14} />
          </button>
        )}
      </div>

      {/* TAG PILLS FILTER BAR */}
      {availableTags.length > 0 && (
        <div className="tag-filter-bar">
          <span className="tag-label">
            <Filter size={11} /> Tags:
          </span>
          {selectedTagFilter && (
            <button
              className="tag-pill tag-pill-active"
              onClick={() => setSelectedTagFilter(null)}
            >
              Clear filter <X size={10} />
            </button>
          )}
          {availableTags.map((tag) => (
            <button
              key={tag}
              className={`tag-pill ${selectedTagFilter === tag ? 'tag-pill-active' : ''}`}
              onClick={() => setSelectedTagFilter(selectedTagFilter === tag ? null : tag)}
            >
              {tag}
            </button>
          ))}
        </div>
      )}
    </header>
  );
};
