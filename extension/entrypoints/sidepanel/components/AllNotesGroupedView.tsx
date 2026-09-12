import React, { useState } from 'react';
import {
  Layers,
  ChevronDown,
  ChevronRight,
  Globe,
  X,
  ExternalLink,
  Copy,
  Check,
  Calendar,
  Info,
} from 'lucide-react';
import { type Note } from '@/lib/db';
import { sanitizeRichHtml } from '@/lib/markdown';
import { NoteCard } from './NoteCard';

interface AllNotesGroupedViewProps {
  totalNotesCount: number;
  selectedTagFilter: string | null;
  groupedNotes: Record<string, Note[]>;
  collapsedDomains: Record<string, boolean>;
  onToggleDomainCollapse: (domain: string) => void;
  copiedKey: string | null;
  onOpenInEditor?: (urlKey: string, title: string, fullUrl: string) => void;
  onCopyContent: (key: string, content: string) => void;
  onOpenUrl: (fullUrl: string) => void;
  onDeleteNote: (key: string) => void;
  onSelectTag: (tag: string) => void;
}

export const AllNotesGroupedView: React.FC<AllNotesGroupedViewProps> = ({
  totalNotesCount,
  selectedTagFilter,
  groupedNotes,
  collapsedDomains,
  onToggleDomainCollapse,
  copiedKey,
  onCopyContent,
  onOpenUrl,
  onDeleteNote,
  onSelectTag,
}) => {
  const [previewNote, setPreviewNote] = useState<Note | null>(null);
  const domainList = Object.keys(groupedNotes).sort();

  return (
    <div className="notes-list-container">
      <div className="list-header-info">
        <span className="list-title">All Saved Notes by Website Domain</span>
        <span className="badge badge-neutral">
          {totalNotesCount} notes across {domainList.length} domains
        </span>
      </div>

      {totalNotesCount === 0 ? (
        <div className="empty-state-box">
          <Layers size={32} className="text-muted" />
          <p className="empty-title">
            {selectedTagFilter
              ? `No notes matching "${selectedTagFilter}"`
              : 'No notes saved anywhere yet'}
          </p>
          <p className="empty-sub">
            Your notes saved on any website will show up here categorized by domain.
          </p>
        </div>
      ) : (
        <div className="domain-groups-wrapper">
          {domainList.map((domainName) => {
            const domainNotes = groupedNotes[domainName] || [];
            const isCollapsed = !!collapsedDomains[domainName];

            return (
              <div key={domainName} className="domain-group-section">
                {/* DOMAIN GROUP HEADER */}
                <div
                  className="domain-group-header"
                  onClick={() => onToggleDomainCollapse(domainName)}
                >
                  <div className="domain-group-left">
                    <button className="collapse-toggle-btn">
                      {isCollapsed ? <ChevronRight size={14} /> : <ChevronDown size={14} />}
                    </button>
                    <div className="domain-avatar">
                      <Globe size={13} />
                    </div>
                    <span className="domain-group-title">{domainName}</span>
                    <span className="domain-group-count">{domainNotes.length}</span>
                  </div>
                </div>

                {/* DOMAIN GROUP NOTES LIST */}
                {!isCollapsed && (
                  <div className="domain-notes-list">
                    {domainNotes.map((note) => (
                      <NoteCard
                        key={note.urlKey}
                        note={note}
                        showDomainBadge={true}
                        copiedKey={copiedKey}
                        onView={(n) => setPreviewNote(n)}
                        onCopy={onCopyContent}
                        onOpenUrl={onOpenUrl}
                        onDelete={onDeleteNote}
                        onSelectTag={onSelectTag}
                      />
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* READ-ONLY NOTE PREVIEW MODAL */}
      {previewNote && (
        <div className="note-modal-overlay" onClick={() => setPreviewNote(null)}>
          <div className="note-modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="note-modal-header">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="badge badge-domain">
                    <Globe size={11} className="inline mr-1" />
                    {previewNote.domain}
                  </span>
                  <span className="text-slate-400 text-xs flex items-center gap-1">
                    <Calendar size={12} />
                    {new Date(previewNote.updatedAt).toLocaleString()}
                  </span>
                </div>
                <h3 className="note-modal-title">{previewNote.title || 'Untitled Note'}</h3>
              </div>

              <button
                onClick={() => setPreviewNote(null)}
                className="note-modal-close-btn"
                title="Close viewer"
              >
                <X size={16} />
              </button>
            </div>

            <div className="note-modal-body">
              {/* Notice that editing requires visiting the website */}
              <div className="read-only-notice-banner">
                <Info size={14} />
                <span>
                  <strong>Read-only preview.</strong> To edit this note, visit the website.
                </span>
              </div>

              <div
                className="note-modal-content-box quill-html-preview"
                dangerouslySetInnerHTML={{
                  __html: sanitizeRichHtml(
                    previewNote.content || '<em>No content preview available</em>',
                  ),
                }}
              />

              <div className="note-modal-url-box">
                <span className="text-slate-400">Target Page:</span>
                <a
                  href={previewNote.fullUrl}
                  onClick={(e) => {
                    e.preventDefault();
                    onOpenUrl(previewNote.fullUrl);
                  }}
                  className="note-modal-url-text"
                  title={previewNote.fullUrl}
                >
                  {previewNote.fullUrl} <ExternalLink size={12} className="inline ml-1" />
                </a>
              </div>
            </div>

            <div className="note-modal-footer">
              <button
                onClick={() => onCopyContent(previewNote.urlKey, previewNote.content)}
                className="dash-btn-secondary"
              >
                {copiedKey === previewNote.urlKey ? (
                  <>
                    <Check size={14} className="text-success" /> Copied!
                  </>
                ) : (
                  <>
                    <Copy size={14} /> Copy Note Text
                  </>
                )}
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    onOpenUrl(previewNote.fullUrl);
                    setPreviewNote(null);
                  }}
                  className="dash-btn-primary"
                  title="Open this webpage in a browser tab to edit the note"
                >
                  <ExternalLink size={14} /> Visit Website to Edit
                </button>
                <button onClick={() => setPreviewNote(null)} className="dash-btn-ghost">
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
