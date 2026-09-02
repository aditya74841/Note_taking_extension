import React from 'react';
import { Home, FileText, Folder, Link2, Tag, Edit3, Copy, Check, ExternalLink, Trash2 } from 'lucide-react';
import { type Note } from '@/lib/db';
import { extractHashtags } from '@/lib/markdown';

function formatTimeAgo(timestamp: number): string {
  if (!timestamp || isNaN(timestamp)) return 'Recently';
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 60) return 'Just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(timestamp).toLocaleDateString();
}

interface NoteCardProps {
  note: Note;
  mainUrlKey?: string;
  currentUrlKey?: string;
  showDomainBadge?: boolean;
  copiedKey: string | null;
  onEdit: (urlKey: string, title: string, fullUrl: string) => void;
  onCopy: (urlKey: string, content: string) => void;
  onOpenUrl: (fullUrl: string) => void;
  onDelete: (urlKey: string) => void;
  onSelectTag: (tag: string) => void;
}

export const NoteCard: React.FC<NoteCardProps> = ({
  note,
  mainUrlKey,
  currentUrlKey,
  showDomainBadge = false,
  copiedKey,
  onEdit,
  onCopy,
  onOpenUrl,
  onDelete,
  onSelectTag,
}) => {
  const isMain = mainUrlKey ? note.urlKey === mainUrlKey : false;
  const isCurrentPage = currentUrlKey ? note.urlKey === currentUrlKey : false;
  const tags = extractHashtags(note.content);

  return (
    <div className={`note-card ${isCurrentPage ? 'card-current' : ''}`}>
      <div className="card-top">
        <div className="card-badges">
          {showDomainBadge ? (
            <span className="badge badge-domain">
              <Folder size={11} /> Page Note
            </span>
          ) : isMain ? (
            <span className="badge badge-main">
              <Home size={11} /> Main URL Note
            </span>
          ) : (
            <span className="badge badge-page">
              <FileText size={11} /> Page Note
            </span>
          )}
          {isCurrentPage && <span className="badge badge-active">Active Tab</span>}
        </div>
        <span className="card-time">{formatTimeAgo(note.updatedAt)}</span>
      </div>

      <h3 className="card-title" title={note.title || 'No title'}>
        {note.title || 'No title'}
      </h3>

      <p className="card-url" title={note.fullUrl}>
        <Link2 size={11} /> {note.fullUrl}
      </p>

      <div className="card-snippet">
        {(note.content || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()}
      </div>

      {/* Card Tags */}
      {tags.length > 0 && (
        <div className="card-tags-list">
          {tags.map((t) => (
            <span
              key={t}
              className="card-tag-pill"
              onClick={(e) => {
                e.stopPropagation();
                onSelectTag(t);
              }}
            >
              <Tag size={10} /> {t}
            </span>
          ))}
        </div>
      )}

      <div className="card-actions">
        <button
          className="btn-card-action"
          onClick={() => onEdit(note.urlKey, note.title, note.fullUrl)}
        >
          <Edit3 size={13} /> {showDomainBadge ? 'View' : 'Edit'}
        </button>

        <button
          className="btn-card-action"
          onClick={() => onCopy(note.urlKey, note.content)}
        >
          {copiedKey === note.urlKey ? (
            <Check size={13} className="text-success" />
          ) : (
            <Copy size={13} />
          )}
        </button>

        <button
          className="btn-card-action"
          onClick={() => onOpenUrl(note.fullUrl)}
          title="Open page in new tab"
        >
          <ExternalLink size={13} />
        </button>

        <button
          className="btn-card-action btn-action-danger"
          onClick={() => onDelete(note.urlKey)}
          title="Delete note"
        >
          <Trash2 size={13} />
        </button>
      </div>
    </div>
  );
};
