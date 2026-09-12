import sanitizeHtml from 'sanitize-html';

/**
 * Sanitizes rich HTML content from the Quill editor before persisting to MongoDB.
 *
 * Allows safe formatting tags that Quill produces while stripping dangerous
 * elements (<script>, <iframe>, <object>, etc.) and all on* event handlers.
 */
export function sanitizeNoteHtml(dirty) {
  if (!dirty || typeof dirty !== 'string') return '';

  return sanitizeHtml(dirty, {
    // Tags that Quill's Snow theme actually produces
    allowedTags: [
      // Block-level
      'p',
      'br',
      'blockquote',
      'pre',
      'h1',
      'h2',
      'h3',
      'h4',
      'h5',
      'h6',
      'ol',
      'ul',
      'li',
      // Inline formatting
      'strong',
      'em',
      'u',
      's',
      'sub',
      'sup',
      'code',
      'span',
      'a',
      // Checklist support
      'input',
    ],

    allowedAttributes: {
      // Quill uses inline styles for text color, background, alignment, indent
      '*': ['class', 'style'],
      a: ['href', 'target', 'rel'],
      input: ['type', 'checked', 'disabled'],
      ol: ['start'],
      li: ['data-list'],
    },

    // Only allow safe link protocols
    allowedSchemes: ['http', 'https', 'mailto'],

    // Strip all on* event handlers (onclick, onerror, onload, etc.)
    // sanitize-html strips these by default, but being explicit
    disallowedTagsMode: 'discard',

    // Limit inline styles to safe Quill properties
    allowedStyles: {
      '*': {
        color: [/.*/],
        'background-color': [/.*/],
        'text-align': [/^(left|right|center|justify)$/],
        'padding-left': [/.*/],
        'text-indent': [/.*/],
      },
    },
  });
}
