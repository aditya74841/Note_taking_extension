import React from 'react';
import { Plus, Sparkles } from 'lucide-react';
import { type Note } from '@/lib/db';
import { NoteCard } from './NoteCard';

interface WebsiteNotesViewProps {
  domain: string;
  notes: Note[];
  selectedTagFilter: string | null;
  mainUrlKey: string;
  mainUrl: string;
  currentUrlKey: string;
  copiedKey: string | null;
  onOpenInEditor: (urlKey: string, title: string, fullUrl: string) => void;
  onCopyContent: (key: string, content: string) => void;
  onOpenUrl: (fullUrl: string) => void;
  onDeleteNote: (key: string) => void;
  onSelectTag: (tag: string) => void;
  onCreatePageNote: () => void;
}

export const WebsiteNotesView: React.FC<WebsiteNotesViewProps> = ({
  domain,
  notes,
  selectedTagFilter,
  mainUrlKey,
  mainUrl,
  currentUrlKey,
  copiedKey,
  onOpenInEditor,
  onCopyContent,
  onOpenUrl,
  onDeleteNote,
  onSelectTag,
  onCreatePageNote,
}) => {
  return (
    <div className="notes-list-container">
      <div className="list-header-info">
        <span className="list-title">
          Notes for <strong>{domain}</strong>
        </span>
        <button
          className="btn-accent-sm"
          onClick={() => onOpenInEditor(mainUrlKey, domain, mainUrl)}
        >
          <Plus size={13} /> Main URL Note
        </button>
      </div>

      {notes.length === 0 ? (
        <div className="empty-state-box">
          <Sparkles size={32} className="text-muted" />
          <p className="empty-title">
            {selectedTagFilter
              ? `No notes matching "${selectedTagFilter}"`
              : `No notes found on ${domain}`}
          </p>
          <p className="empty-sub">
            Write a note for this page or add one for the main domain URL.
          </p>
          <button className="btn-primary-sm" onClick={onCreatePageNote}>
            Create Note for Active Page
          </button>
        </div>
      ) : (
        <div className="cards-grid">
          {notes.map((note) => (
            <NoteCard
              key={note.urlKey}
              note={note}
              mainUrlKey={mainUrlKey}
              currentUrlKey={currentUrlKey}
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
};
