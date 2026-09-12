import React, { useState } from 'react';
import {
  Layers,
  Search,
  FileText,
  Copy,
  ExternalLink,
  Trash2,
  CheckCircle2,
  Filter,
  Grid,
  List,
  Eye,
  X,
  Globe,
  Calendar,
} from 'lucide-react';
import type { Note } from '../../../lib/db';
import { stripAndSanitizeHtml, sanitizeRichHtml } from '../../../lib/markdown';

interface CloudNotesTabProps {
  notes: Note[];
  onDeleteNote: (urlKey: string) => void;
}

export const CloudNotesTab: React.FC<CloudNotesTabProps> = ({ notes, onDeleteNote }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDomain, setSelectedDomain] = useState<string>('ALL');
  const [selectedColor, setSelectedColor] = useState<string>('ALL');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [modalNote, setModalNote] = useState<Note | null>(null);

  // Extract unique domains
  const uniqueDomains = Array.from(new Set(notes.map((n) => n.domain || 'other')));

  // Extract all hashtags
  const allTags = Array.from(
    new Set(
      notes.flatMap((n) => {
        const matches = (n.content || '').match(/#[a-zA-Z0-9_-]+/g);
        return matches || [];
      })
    )
  );

  // Filtering logic
  const filteredNotes = notes.filter((n) => {
    const matchesSearch =
      n.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      n.content?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      n.domain?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      n.fullUrl?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesDomain = selectedDomain === 'ALL' || n.domain === selectedDomain;
    const matchesColor = selectedColor === 'ALL' || (n.color || 'default') === selectedColor;
    const matchesTag = !selectedTag || n.content?.includes(selectedTag);

    return matchesSearch && matchesDomain && matchesColor && matchesTag;
  });

  const handleCopy = (key: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <section className="dash-explorer-section">
      {/* FILTER & HEADER TOOLBAR */}
      <div className="dash-explorer-header">
        <div className="dash-explorer-title-box">
          <h3 className="dash-explorer-title">
            <Layers size={20} className="dash-icon-indigo" />
            Backed-Up Notes ({filteredNotes.length})
          </h3>
        </div>

        <div className="dash-toolbar-controls">
          {/* Search Box */}
          <div className="dash-search-box">
            <Search size={15} className="dash-search-icon" />
            <input
              type="text"
              placeholder="Search notes or URL..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="dash-search-input"
            />
          </div>

          {/* Domain Filter Dropdown */}
          <div className="dash-select-wrapper">
            <Filter size={13} className="dash-select-icon" />
            <select
              value={selectedDomain}
              onChange={(e) => setSelectedDomain(e.target.value)}
              className="dash-select-input"
            >
              <option value="ALL">All Domains ({uniqueDomains.length})</option>
              {uniqueDomains.map((dom) => (
                <option key={dom} value={dom}>
                  {dom}
                </option>
              ))}
            </select>
          </div>

          {/* View Mode Switcher */}
          <div className="dash-view-toggle">
            <button
              onClick={() => setViewMode('grid')}
              className={`dash-toggle-btn ${viewMode === 'grid' ? 'active' : ''}`}
              title="Grid View"
            >
              <Grid size={15} />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`dash-toggle-btn ${viewMode === 'table' ? 'active' : ''}`}
              title="Table View"
            >
              <List size={15} />
            </button>
          </div>
        </div>
      </div>

      {/* SECONDARY FILTER BAR: COLOR PALETTE & HASHTAG CHIPS */}
      <div className="dash-secondary-filter-bar">
        {/* Color Palette Chips */}
        <div className="color-chips-row">
          <span className="dash-filter-label">Color:</span>
          {['ALL', 'default', 'red', 'yellow', 'green', 'purple', 'blue'].map((col) => (
            <button
              key={col}
              onClick={() => setSelectedColor(col)}
              className={`color-chip color-chip-${col === 'ALL' ? 'default' : col} ${
                selectedColor === col ? 'active' : ''
              }`}
              title={`Filter by color: ${col}`}
            />
          ))}
        </div>

        {/* Tag Pills Filter Bar */}
        {allTags.length > 0 && (
          <div className="tag-filter-bar">
            <span className="dash-filter-label">Tags:</span>
            {selectedTag && (
              <button
                className="tag-pill tag-pill-active"
                onClick={() => setSelectedTag(null)}
              >
                Clear Tag
              </button>
            )}
            {allTags.map((tag) => (
              <button
                key={tag}
                className={`tag-pill ${selectedTag === tag ? 'tag-pill-active' : ''}`}
                onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
              >
                {tag}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* CONTENT DISPLAY: GRID OR TABLE */}
      {filteredNotes.length === 0 ? (
        <div className="dash-empty-box">
          <FileText size={40} className="dash-empty-icon" />
          <p className="dash-empty-text">No notes match your filters</p>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="dash-notes-grid">
          {filteredNotes.map((note) => {
            const noteColorClass = `note-color-${note.color || 'default'}`;
            return (
              <div key={note.urlKey} className={`dash-note-card ${noteColorClass}`}>
                <div className="dash-note-top" onClick={() => setModalNote(note)} style={{ cursor: 'pointer' }}>
                  <div className="dash-note-meta">
                    <span className="dash-domain-badge">{note.domain}</span>
                    <span className="dash-note-date">
                      {new Date(note.updatedAt).toLocaleDateString()}
                    </span>
                  </div>

                  <h4 className="dash-note-title">{note.title || 'Untitled Note'}</h4>

                  <div className="dash-note-body">
                    {stripAndSanitizeHtml(note.content).slice(0, 140) || (
                      <em style={{ color: '#64748b' }}>Empty note content</em>
                    )}
                  </div>
                </div>

                <div className="dash-note-footer">
                  <div className="dash-note-actions-left">
                    <button
                      onClick={() => setModalNote(note)}
                      className="dash-icon-btn"
                      title="View Full Note Details"
                    >
                      <Eye size={14} />
                    </button>
                    <button
                      onClick={() => handleCopy(note.urlKey, note.content)}
                      className="dash-icon-btn"
                      title="Copy Note Text"
                    >
                      {copiedKey === note.urlKey ? (
                        <CheckCircle2 size={14} className="dash-icon-emerald" />
                      ) : (
                        <Copy size={14} />
                      )}
                    </button>
                    <a
                      href={note.fullUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="dash-icon-btn"
                      title="Open Original Page"
                    >
                      <ExternalLink size={14} />
                    </a>
                  </div>

                  <button
                    onClick={() => onDeleteNote(note.urlKey)}
                    className="dash-icon-btn dash-icon-btn-danger"
                    title="Delete Note"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* COMPACT TABLE VIEW */
        <div className="dash-table-wrapper">
          <table className="dash-table">
            <thead>
              <tr>
                <th>Domain</th>
                <th>Title</th>
                <th>Content Preview</th>
                <th>Last Updated</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredNotes.map((note) => (
                <tr key={note.urlKey}>
                  <td>
                    <span className="dash-domain-badge">{note.domain}</span>
                  </td>
                  <td
                    className="font-semibold text-slate-200 cursor-pointer hover:text-indigo-400"
                    onClick={() => setModalNote(note)}
                  >
                    {note.title || 'Untitled'}
                  </td>
                  <td className="dash-table-content">
                    {stripAndSanitizeHtml(note.content).slice(0, 80) || 'Empty'}
                  </td>
                  <td>{new Date(note.updatedAt).toLocaleDateString()}</td>
                  <td>
                    <div className="dash-table-actions">
                      <button
                        onClick={() => setModalNote(note)}
                        className="dash-icon-btn"
                        title="View Note Details"
                      >
                        <Eye size={14} />
                      </button>
                      <button
                        onClick={() => handleCopy(note.urlKey, note.content)}
                        className="dash-icon-btn"
                        title="Copy"
                      >
                        {copiedKey === note.urlKey ? (
                          <CheckCircle2 size={14} className="dash-icon-emerald" />
                        ) : (
                          <Copy size={14} />
                        )}
                      </button>
                      <a
                        href={note.fullUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="dash-icon-btn"
                        title="Open Link"
                      >
                        <ExternalLink size={14} />
                      </a>
                      <button
                        onClick={() => onDeleteNote(note.urlKey)}
                        className="dash-icon-btn dash-icon-btn-danger"
                        title="Delete"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* NOTE DETAIL VIEWER MODAL */}
      {modalNote && (
        <div className="note-modal-overlay" onClick={() => setModalNote(null)}>
          <div className="note-modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="note-modal-header">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="dash-domain-badge">
                    <Globe size={11} className="inline mr-1" />
                    {modalNote.domain}
                  </span>
                  <span className={`color-chip color-chip-${modalNote.color || 'default'}`} title={`Color: ${modalNote.color || 'default'}`} />
                  <span className="dash-note-date text-slate-400 text-xs flex items-center gap-1">
                    <Calendar size={12} />
                    {new Date(modalNote.updatedAt).toLocaleString()}
                  </span>
                </div>
                <h3 className="note-modal-title">{modalNote.title || 'Untitled Note'}</h3>
              </div>

              <button
                onClick={() => setModalNote(null)}
                className="note-modal-close-btn"
                title="Close viewer"
              >
                <X size={16} />
              </button>
            </div>

            <div className="note-modal-body">
              <div
                className="note-modal-content-box ql-editor"
                dangerouslySetInnerHTML={{
                  __html: sanitizeRichHtml(modalNote.content || '<em>No content available</em>'),
                }}
              />

              <div className="note-modal-url-box">
                <span className="text-slate-400">Target Page:</span>
                <a
                  href={modalNote.fullUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="note-modal-url-text"
                >
                  {modalNote.fullUrl} <ExternalLink size={12} className="inline ml-1" />
                </a>
              </div>
            </div>

            <div className="note-modal-footer">
              <button
                onClick={() => handleCopy(modalNote.urlKey, modalNote.content)}
                className="dash-btn-secondary"
              >
                {copiedKey === modalNote.urlKey ? (
                  <>
                    <CheckCircle2 size={14} className="dash-icon-emerald" /> Text Copied!
                  </>
                ) : (
                  <>
                    <Copy size={14} /> Copy Note Text
                  </>
                )}
              </button>

              <div className="flex items-center gap-2">
                <a
                  href={modalNote.fullUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="dash-btn-primary"
                >
                  <ExternalLink size={14} /> Open Page
                </a>
                <button onClick={() => setModalNote(null)} className="dash-btn-ghost">
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
