import React, { useState } from 'react';
import {
  Trash2,
  RotateCcw,
  XCircle,
  AlertTriangle,
  Eye,
  X,
  Globe,
  Calendar,
  ExternalLink,
} from 'lucide-react';
import type { CloudNoteItem } from '../../../lib/sync';
import { stripAndSanitizeHtml, sanitizeRichHtml } from '../../../lib/markdown';

interface CloudTrashTabProps {
  deletedNotes: CloudNoteItem[];
  onRestoreDeleted: (urlKey: string) => void;
  onPurgeNote: (urlKey: string) => void;
}

export const CloudTrashTab: React.FC<CloudTrashTabProps> = ({
  deletedNotes,
  onRestoreDeleted,
  onPurgeNote,
}) => {
  const [selectedNote, setSelectedNote] = useState<CloudNoteItem | null>(null);

  return (
    <section className="dash-explorer-section">
      <div className="dash-explorer-header">
        <h3 className="dash-explorer-title">
          <Trash2 size={20} className="dash-icon-rose" />
          Cloud Trash Bin ({deletedNotes.length})
        </h3>
      </div>

      {deletedNotes.length === 0 ? (
        <div className="dash-empty-box">
          <Trash2 size={40} className="dash-empty-icon" />
          <p className="dash-empty-text">Cloud trash bin is empty</p>
          <p className="dash-empty-sub">Soft-deleted notes backed up in cloud will appear here.</p>
        </div>
      ) : (
        <div className="dash-trash-grid">
          {deletedNotes.map((note) => (
            <div key={note.urlKey} className="dash-note-card dash-trash-card">
              <div
                className="dash-note-top"
                onClick={() => setSelectedNote(note)}
                style={{ cursor: 'pointer' }}
              >
                <div className="dash-note-meta">
                  <span className="dash-domain-badge">{note.domain}</span>
                  <span className="dash-deleted-badge">
                    <AlertTriangle size={11} /> Soft-Deleted
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
                <button
                  onClick={() => setSelectedNote(note)}
                  className="dash-icon-btn"
                  title="View Details"
                >
                  <Eye size={14} />
                </button>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onRestoreDeleted(note.urlKey)}
                    className="dash-btn-secondary"
                    title="Restore note to active cloud backup"
                  >
                    <RotateCcw size={13} /> Restore Note
                  </button>

                  <button
                    onClick={() => onPurgeNote(note.urlKey)}
                    className="dash-btn-danger"
                    title="Permanently purge from cloud MongoDB"
                  >
                    <XCircle size={13} /> Purge Permanently
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* SOFT-DELETED NOTE DETAIL MODAL */}
      {selectedNote && (
        <div className="note-modal-overlay" onClick={() => setSelectedNote(null)}>
          <div className="note-modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="note-modal-header">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="dash-domain-badge">
                    <Globe size={11} className="inline mr-1" />
                    {selectedNote.domain}
                  </span>
                  <span className="dash-deleted-badge">
                    <AlertTriangle size={11} /> Soft-Deleted
                  </span>
                  <span className="dash-note-date text-slate-400 text-xs flex items-center gap-1">
                    <Calendar size={12} />
                    {new Date(selectedNote.updatedAt).toLocaleString()}
                  </span>
                </div>
                <h3 className="note-modal-title">{selectedNote.title || 'Untitled Note'}</h3>
              </div>

              <button
                onClick={() => setSelectedNote(null)}
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
                  __html: sanitizeRichHtml(selectedNote.content || '<em>No content available</em>'),
                }}
              />

              <div className="note-modal-url-box">
                <span className="text-slate-400">Target Page URL:</span>
                <a
                  href={selectedNote.fullUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="note-modal-url-text"
                >
                  {selectedNote.fullUrl} <ExternalLink size={12} className="inline ml-1" />
                </a>
              </div>
            </div>

            <div className="note-modal-footer">
              <button
                onClick={() => {
                  onRestoreDeleted(selectedNote.urlKey);
                  setSelectedNote(null);
                }}
                className="dash-btn-primary"
              >
                <RotateCcw size={14} /> Restore to Active Notes
              </button>

              <button
                onClick={() => {
                  onPurgeNote(selectedNote.urlKey);
                  setSelectedNote(null);
                }}
                className="dash-btn-danger"
              >
                <XCircle size={14} /> Purge Permanently
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
