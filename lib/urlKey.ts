const UNSUPPORTED_PROTOCOLS = ['chrome:', 'chrome-extension:', 'about:', 'edge:', 'devtools:'];

export function normalizeUrl(url: string | undefined): string | null {
  if (!url) return null;

  try {
    const parsed = new URL(url);
    if (UNSUPPORTED_PROTOCOLS.includes(parsed.protocol)) return null;

    const hostname = parsed.hostname.replace(/^www\./, '').toLowerCase();
    let pathname = parsed.pathname;
    if (pathname.length > 1 && pathname.endsWith('/')) {
      pathname = pathname.slice(0, -1);
    }

    return `${hostname}${pathname}`;
  } catch {
    return null;
  }
}

export function getTabUrlKey(tab: { url?: string }): string | null {
  return normalizeUrl(tab.url);
}
