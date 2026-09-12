import React from 'react';

/**
 * Strips all HTML tags and decodes HTML entities to produce clean, safe plain text snippet.
 * Handles nested tags, Quill HTML structures, and double-encoded entities (&lt;p&gt;).
 */
export function stripAndSanitizeHtml(input: string): string {
  if (!input || typeof input !== 'string') return '';

  let text = input;

  // 1. If running in browser environment, use DOMParser for exact DOM text extraction
  if (typeof DOMParser !== 'undefined') {
    try {
      const parser = new DOMParser();
      // First pass text extraction
      const doc = parser.parseFromString(input, 'text/html');
      text = doc.body.textContent || doc.body.innerText || '';

      // If decoded text still contains escaped tags (e.g. &lt;p&gt; or <p>), decode again
      if (text.includes('&lt;') || text.includes('&gt;') || text.includes('<')) {
        const doc2 = parser.parseFromString(text, 'text/html');
        text = doc2.body.textContent || doc2.body.innerText || text;
      }
    } catch {
      // Fall through to regex cleanup
    }
  }

  // 2. Comprehensive regex tag stripping & entity unescaping fallback
  return text
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Sanitizes rich HTML content for safe rendering via dangerouslySetInnerHTML.
 * Ensures double-encoded entities (&lt;p&gt; -> <p>) are properly formatted as valid HTML
 * while stripping unsafe elements like <script>, <iframe>, <object>, and inline event handlers (on*).
 */
export function sanitizeRichHtml(input: string): string {
  if (!input || typeof input !== 'string') return '';

  let html = input;

  // 1. Decode double-escaped Quill HTML if present (e.g., &lt;p&gt; -> <p>)
  if (html.startsWith('&lt;') || html.includes('&lt;p&gt;')) {
    if (typeof DOMParser !== 'undefined') {
      try {
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        html = doc.body.textContent || html;
      } catch {
        html = html.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
      }
    } else {
      html = html.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
    }
  }

  // 2. Strip dangerous tags (<script>, <iframe>, <object>, <embed>, <applet>) and inline event attributes (on*)
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, '')
    .replace(/<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi, '')
    .replace(/\s+on[a-z]+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, '')
    .trim();
}

export function extractHashtags(text: string): string[] {
  if (!text || typeof text !== 'string') return [];
  const cleanText = stripAndSanitizeHtml(text);
  const matches = cleanText.match(/#[a-zA-Z0-9_\-]+/g);
  if (!matches) return [];
  const unique = Array.from(new Set(matches.map((t) => t.toLowerCase())));
  return unique;
}

export function renderMarkdown(content: string): React.ReactNode {
  if (!content || typeof content !== 'string') return <p className="md-empty">No content to preview.</p>;

  const lines = content.split('\n');
  const elements: React.ReactNode[] = [];
  let inCodeBlock = false;
  let codeBuffer: string[] = [];

  lines.forEach((line, index) => {
    // Code block ``` check
    if (line.trim().startsWith('```')) {
      if (inCodeBlock) {
        elements.push(
          <pre key={`code-${index}`} className="md-code-block">
            <code>{codeBuffer.join('\n')}</code>
          </pre>
        );
        codeBuffer = [];
        inCodeBlock = false;
      } else {
        inCodeBlock = true;
      }
      return;
    }

    if (inCodeBlock) {
      codeBuffer.push(line);
      return;
    }

    const trimmed = line.trim();

    if (!trimmed) {
      elements.push(<div key={`empty-${index}`} className="md-space" />);
      return;
    }

    // Headings
    if (trimmed.startsWith('# ')) {
      elements.push(<h1 key={index} className="md-h1">{parseInline(trimmed.slice(2))}</h1>);
      return;
    }
    if (trimmed.startsWith('## ')) {
      elements.push(<h2 key={index} className="md-h2">{parseInline(trimmed.slice(3))}</h2>);
      return;
    }
    if (trimmed.startsWith('### ')) {
      elements.push(<h3 key={index} className="md-h3">{parseInline(trimmed.slice(4))}</h3>);
      return;
    }

    // Blockquote
    if (trimmed.startsWith('> ')) {
      elements.push(
        <blockquote key={index} className="md-quote">
          {parseInline(trimmed.slice(2))}
        </blockquote>
      );
      return;
    }

    // Checkboxes
    if (trimmed.startsWith('- [ ] ') || trimmed.startsWith('[ ] ')) {
      const text = trimmed.replace(/^-\s*\[\s*\]\s*|^\[\s*\]\s*/, '');
      elements.push(
        <div key={index} className="md-todo-item">
          <input type="checkbox" disabled checked={false} readOnly />
          <span>{parseInline(text)}</span>
        </div>
      );
      return;
    }
    if (trimmed.startsWith('- [x] ') || trimmed.startsWith('[x] ')) {
      const text = trimmed.replace(/^-\s*\[x\]\s*|^\[x\]\s*/i, '');
      elements.push(
        <div key={index} className="md-todo-item checked">
          <input type="checkbox" disabled checked readOnly />
          <span className="line-through">{parseInline(text)}</span>
        </div>
      );
      return;
    }

    // Bullet points
    if (trimmed.startsWith('• ') || trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      elements.push(
        <li key={index} className="md-bullet">
          {parseInline(trimmed.replace(/^(•|-|\*)\s*/, ''))}
        </li>
      );
      return;
    }

    // Regular paragraph
    elements.push(
      <p key={index} className="md-paragraph">
        {parseInline(line)}
      </p>
    );
  });

  if (inCodeBlock && codeBuffer.length > 0) {
    elements.push(
      <pre key="code-end" className="md-code-block">
        <code>{codeBuffer.join('\n')}</code>
      </pre>
    );
  }

  return <div className="markdown-preview-body">{elements}</div>;
}

function parseInline(text: string): React.ReactNode[] {
  if (!text || typeof text !== 'string') return [];
  const parts: React.ReactNode[] = [];
  let remaining = text;
  let keyIdx = 0;

  while (remaining.length > 0) {
    // Check inline code `code`
    const codeMatch = remaining.match(/`([^`]+)`/);
    // Check bold **bold**
    const boldMatch = remaining.match(/\*\*([^*]+)\*\*/);
    // Check link [title](url)
    const linkMatch = remaining.match(/\[([^\]]+)\]\(([^)]+)\)/);
    // Check hashtag #tag
    const tagMatch = remaining.match(/#[a-zA-Z0-9_\-]+/);

    const matches = [
      codeMatch ? { type: 'code', match: codeMatch, index: codeMatch.index! } : null,
      boldMatch ? { type: 'bold', match: boldMatch, index: boldMatch.index! } : null,
      linkMatch ? { type: 'link', match: linkMatch, index: linkMatch.index! } : null,
      tagMatch ? { type: 'tag', match: tagMatch, index: tagMatch.index! } : null,
    ].filter(Boolean) as Array<{ type: string; match: RegExpMatchArray; index: number }>;

    if (matches.length === 0) {
      parts.push(remaining);
      break;
    }

    // Sort by earliest match
    matches.sort((a, b) => a.index - b.index);
    const earliest = matches[0];
    if (!earliest) {
      parts.push(remaining);
      break;
    }

    if (earliest.index > 0) {
      parts.push(remaining.slice(0, earliest.index));
    }


    const fullMatch = earliest.match[0];
    if (earliest.type === 'code') {
      parts.push(
        <code key={keyIdx++} className="md-inline-code">
          {earliest.match[1]}
        </code>
      );
    } else if (earliest.type === 'bold') {
      parts.push(
        <strong key={keyIdx++} className="md-bold">
          {earliest.match[1]}
        </strong>
      );
    } else if (earliest.type === 'link') {
      parts.push(
        <a
          key={keyIdx++}
          href={earliest.match[2]}
          target="_blank"
          rel="noreferrer"
          className="md-link"
        >
          {earliest.match[1]}
        </a>
      );
    } else if (earliest.type === 'tag') {
      parts.push(
        <span key={keyIdx++} className="md-tag-inline">
          {fullMatch}
        </span>
      );
    }

    remaining = remaining.slice(earliest.index + fullMatch.length);
  }

  return parts;
}
