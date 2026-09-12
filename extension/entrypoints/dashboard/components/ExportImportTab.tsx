import React from 'react';
import { Download, FileText, Archive } from 'lucide-react';
import type { Note } from '../../../lib/db';

interface ExportImportTabProps {
  notes: Note[];
}

export const ExportImportTab: React.FC<ExportImportTabProps> = ({ notes }) => {
  const handleExportCsv = () => {
    const headers = ['urlKey', 'domain', 'fullUrl', 'title', 'content', 'updatedAt'];
    const rows = notes.map((n) => [
      `"${n.urlKey.replace(/"/g, '""')}"`,
      `"${(n.domain || '').replace(/"/g, '""')}"`,
      `"${(n.fullUrl || '').replace(/"/g, '""')}"`,
      `"${(n.title || '').replace(/"/g, '""')}"`,
      `"${(n.content || '').replace(/<[^>]*>?/gm, '').replace(/"/g, '""')}"`,
      `"${new Date(n.updatedAt).toISOString()}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const anchor = document.createElement('a');
    anchor.setAttribute('href', encodedUri);
    anchor.setAttribute('download', `url-notes-export-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
  };

  const handleExportMarkdown = () => {
    let mdContent = `# WebMemo Backup Export\n*Exported on ${new Date().toLocaleString()}*\n\n---\n\n`;
    for (const n of notes) {
      mdContent += `## ${n.title || 'Untitled Note'}\n`;
      mdContent += `- **Domain:** ${n.domain || 'N/A'}\n`;
      mdContent += `- **URL:** ${n.fullUrl || n.urlKey}\n`;
      mdContent += `- **Last Updated:** ${new Date(n.updatedAt).toLocaleString()}\n\n`;
      mdContent += `### Content\n${n.content.replace(/<[^>]*>?/gm, '')}\n\n---\n\n`;
    }

    const dataStr = 'data:text/markdown;charset=utf-8,' + encodeURIComponent(mdContent);
    const anchor = document.createElement('a');
    anchor.setAttribute('href', dataStr);
    anchor.setAttribute('download', `url-notes-archive-${new Date().toISOString().slice(0, 10)}.md`);
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
  };

  return (
    <section className="dash-explorer-section">
      <div className="dash-explorer-header">
        <h3 className="dash-explorer-title">
          <Archive size={20} className="dash-icon-indigo" />
          Data Portability & Export Tools
        </h3>
      </div>

      <div className="dash-export-grid">
        {/* CSV EXPORT CARD */}
        <div className="dash-export-card">
          <div className="dash-export-icon-box dash-icon-sky">
            <FileText size={24} />
          </div>
          <div>
            <h4 className="dash-export-title">Export as CSV</h4>
            <p className="dash-export-desc">
              Spreadsheet-compatible CSV file formatted for Excel, Google Sheets, or data analysis.
            </p>
          </div>
          <button onClick={handleExportCsv} className="dash-btn-secondary">
            <Download size={14} /> Download CSV Spreadsheet
          </button>
        </div>

        {/* MARKDOWN EXPORT CARD */}
        <div className="dash-export-card">
          <div className="dash-export-icon-box dash-icon-purple">
            <Archive size={24} />
          </div>
          <div>
            <h4 className="dash-export-title">Export as Markdown Archive</h4>
            <p className="dash-export-desc">
              Formatted Markdown document containing all note headings, bullet lists, and links.
            </p>
          </div>
          <button onClick={handleExportMarkdown} className="dash-btn-secondary">
            <Download size={14} /> Download Markdown (.md)
          </button>
        </div>
      </div>
    </section>
  );
};
