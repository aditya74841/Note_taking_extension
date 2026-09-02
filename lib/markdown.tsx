import React from 'react';

export function extractHashtags(text: string): string[] {
  if (!text || typeof text !== 'string') return [];
  const matches = text.match(/#[a-zA-Z0-9_\-]+/g);
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
