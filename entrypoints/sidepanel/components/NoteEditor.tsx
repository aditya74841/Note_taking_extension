import React, { useRef, useEffect } from 'react';
import { Home, FileText, Edit, Eye, Check, Copy, Trash2 } from 'lucide-react';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import { type Note } from '@/lib/db';
import { renderMarkdown } from '@/lib/markdown';

export type SaveStatus = 'idle' | 'saving' | 'saved';

const quillModules = {
  toolbar: [
    [{ header: [1, 2, 3, false] }],
    ['bold', 'italic', 'underline', 'strike'],
    [{ list: 'ordered' }, { list: 'bullet' }, { list: 'check' }],
    ['blockquote', 'code-block'],
    ['link', 'clean'],
  ],
};

interface NoteEditorProps {
  isEditingMainUrl: boolean;
  domain: string;
  saveStatus: SaveStatus;
  isPreviewMode: boolean;
  setIsPreviewMode: (val: boolean) => void;
  editorTargetTitle: string;
  onTitleChange: (title: string) => void;
  isMainUrl: boolean;
  mainUrlNote: Note | null;
  editorTargetUrlKey: string;
  domainMainUrlKey: string;
  domainMainUrl: string;
  editorContent: string;
  onEditorChange: (content: string) => void;
  onOpenInEditor: (noteKey: string, defaultTitle: string, fullUrl: string) => void;
  onInsertTemplate: (prefix: string) => void;
  lastSavedTime: number | null;
  copiedKey: string | null;
  onCopyContent: (key: string, content: string) => void;
  onDeleteNote: (key: string) => void;
  activeTitle: string;
}

function formatTimeAgo(timestamp: number): string {
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

export const NoteEditor: React.FC<NoteEditorProps> = ({
  isEditingMainUrl,
  domain,
  saveStatus,
  isPreviewMode,
  setIsPreviewMode,
  editorTargetTitle,
  onTitleChange,
  isMainUrl,
  mainUrlNote,
  editorTargetUrlKey,
  domainMainUrlKey,
  domainMainUrl,
  editorContent,
  onEditorChange,
  onOpenInEditor,
  onInsertTemplate,
  lastSavedTime,
  copiedKey,
  onCopyContent,
  onDeleteNote,
  activeTitle,
}) => {
  const markdownPreviewRef = useRef<HTMLDivElement | null>(null);

  // Auto-scroll preview downward when content changes
  useEffect(() => {
    if (markdownPreviewRef.current) {
      markdownPreviewRef.current.scrollTop = markdownPreviewRef.current.scrollHeight;
    }
  }, [editorContent, isPreviewMode]);

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();

    const droppedText = e.dataTransfer.getData('text/plain') || e.dataTransfer.getData('text/html');
    if (droppedText && droppedText.trim()) {
      const cleanDropped = droppedText.trim();
      const current = editorContent || '';

      let updatedContent = '';
      if (current.includes('<p>') || current.includes('</div>') || current.includes('</span>')) {
        updatedContent = current ? `${current}<p>${cleanDropped}</p>` : `<p>${cleanDropped}</p>`;
      } else {
        updatedContent = current ? `${current}\n\n${cleanDropped}` : cleanDropped;
      }

      onEditorChange(updatedContent);
    }
  };

  const safeContent = typeof editorContent === 'string' ? editorContent : '';
  const plainText = safeContent.replace(/<[^>]*>/g, ' ').replace(/&nbsp;/g, ' ').trim();
  const hasContent = plainText.length > 0;
  const wordCount = hasContent ? plainText.split(/\s+/).length : 0;
  const charCount = plainText.replace(/\s+/g, '').length;

  return (
    <div
      className="editor-container"
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >

      {/* Target Note Badge */}
      <div className="editor-header-bar">
        <div className="editor-target-info">
          {isEditingMainUrl ? (
            <span className="badge badge-main">
              <Home size={12} /> Main URL Note ({domain})
            </span>
          ) : (
            <span className="badge badge-page">
              <FileText size={12} /> Page Note
            </span>
          )}
        </div>

        {/* Status & Preview Mode Toggle (Only visible if note has content) */}
        <div className="editor-top-actions">
          {hasContent && (
            <button
              className={`btn-mode-toggle ${isPreviewMode ? 'active' : ''}`}
              onClick={() => setIsPreviewMode(!isPreviewMode)}
              title={isPreviewMode ? 'Switch to Edit' : 'Preview HTML'}
            >
              {isPreviewMode ? <Edit size={12} /> : <Eye size={12} />}
              <span>{isPreviewMode ? 'Edit' : 'Preview'}</span>
            </button>
          )}

          <div className="save-status">
            {saveStatus === 'saving' && <span className="status-dot saving">Saving...</span>}
            {saveStatus === 'saved' && (
              <span className="status-dot saved">
                <Check size={12} /> Saved
              </span>
            )}
          </div>
        </div>
      </div>

      {/* EDITOR vs PREVIEW */}
      {isPreviewMode ? (
        <div className="markdown-preview-container quill-html-preview" ref={markdownPreviewRef} dangerouslySetInnerHTML={{ __html: editorContent }} />
      ) : (
        <div className="quill-wrapper">
          <ReactQuill
            theme="snow"
            value={editorContent}
            onChange={onEditorChange}
            placeholder={
              isEditingMainUrl
                ? `Write notes for the main domain (${domain}). Use #tags for categories...`
                : `Write notes for this page (${activeTitle}). Use #tags for categories...`
            }
            modules={quillModules}
            className="quill-editor-custom"
          />
        </div>
      )}

      {/* FOOTER BAR */}
      <footer className="editor-footer">
        <div className="metrics">
          <span>{wordCount} words</span>
          <span className="dot">•</span>
          <span>{charCount} chars</span>
          {lastSavedTime && (
            <>
              <span className="dot">•</span>
              <span>Saved {formatTimeAgo(lastSavedTime)}</span>
            </>
          )}
        </div>

        <div className="editor-actions">
          {editorContent.trim() && (
            <>
              <button
                className="icon-btn"
                title="Copy content"
                onClick={() => onCopyContent(editorTargetUrlKey, editorContent)}
              >
                {copiedKey === editorTargetUrlKey ? (
                  <Check size={14} className="text-success" />
                ) : (
                  <Copy size={14} />
                )}
              </button>
              <button
                className="icon-btn icon-btn-danger"
                title="Delete note"
                onClick={() => onDeleteNote(editorTargetUrlKey)}
              >
                <Trash2 size={14} />
              </button>
            </>
          )}
        </div>
      </footer>
    </div>
  );
};
