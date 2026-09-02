import React from 'react';
import { Layers, ChevronDown, ChevronRight, Globe } from 'lucide-react';
import { type Note } from '@/lib/db';
import { NoteCard } from './NoteCard';

interface AllNotesGroupedViewProps {
  totalNotesCount: number;
  selectedTagFilter: string | null;
  groupedNotes: Record<string, Note[]>;
  collapsedDomains: Record<string, boolean>;
  onToggleDomainCollapse: (domain: string) => void;
  copiedKey: string | null;
  onOpenInEditor: (urlKey: string, title: string, fullUrl: string) => void;
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
  onOpenInEditor,
  onCopyContent,
  onOpenUrl,
  onDeleteNote,
  onSelectTag,
}) => {
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
                        onEdit={onOpenInEditor}
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
    </div>
  );
};
