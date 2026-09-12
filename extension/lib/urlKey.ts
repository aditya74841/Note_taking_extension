const UNSUPPORTED_PROTOCOLS = [
  'chrome:', 'chrome-extension:', 'about:', 'edge:',
  'devtools:', 'chrome-search:', 'data:', 'javascript:',
];

/**
 * Tracking & session query params to strip before creating a URL key.
 * This prevents the same page from getting different note keys just
 * because of analytics, session tokens, or referral params.
 */
const STRIP_PARAMS = new Set([
  // UTM / analytics
  'utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content',
  'utm_id', 'utm_source_platform', 'utm_creative_format', 'utm_marketing_tactic',
  // Social/referral
  'fbclid', 'gclid', 'gclsrc', 'dclid', 'gbraid', 'wbraid',
  'mc_cid', 'mc_eid', 'yclid', 'twclid', 'msclkid',
  '_hsenc', '_hsmi', 'hsCtaTracking',
  // Redirects & tokens
  'ref', 'referrer', 'source', 'origin',
  'sessionid', 'session_id', 'sid', 'token',
  // E-commerce
  'affiliate', 'aff', 'partner',
  // Misc trackers
  's_cid', 'trk', 'trkInfo', 'mkt_tok',
]);

/**
 * Normalizes a URL into a stable key suitable for IndexedDB storage.
 * - Strips www. prefix
 * - Removes trailing slash (except root)
 * - Removes all known tracking/session query params
 * - Sorts remaining params alphabetically for consistency
 */
export function normalizeUrl(url: string | undefined): string | null {
  if (!url) return null;

  try {
    const parsed = new URL(url);
    if (UNSUPPORTED_PROTOCOLS.includes(parsed.protocol)) return null;

    const hostname = parsed.hostname.replace(/^www\./, '').toLowerCase();

    // Strip trailing slash except on root
    let pathname = parsed.pathname;
    if (pathname.length > 1 && pathname.endsWith('/')) {
      pathname = pathname.slice(0, -1);
    }

    // Strip tracking params; sort remaining for stable keys
    const cleanParams = new URLSearchParams();
    for (const [key, value] of parsed.searchParams.entries()) {
      if (!STRIP_PARAMS.has(key.toLowerCase())) {
        cleanParams.append(key, value);
      }
    }

    // Sort remaining params alphabetically for a stable key
    cleanParams.sort();

    const search = cleanParams.toString() ? `?${cleanParams.toString()}` : '';
    return `${hostname}${pathname}${search}`;
  } catch {
    return null;
  }
}

export function extractDomain(url: string | undefined): string | null {
  if (!url) return null;

  try {
    const parsed = new URL(url);
    if (UNSUPPORTED_PROTOCOLS.includes(parsed.protocol)) return null;

    return parsed.hostname.replace(/^www\./, '').toLowerCase();
  } catch {
    return null;
  }
}

export function getMainUrl(url: string | undefined): string | null {
  if (!url) return null;

  try {
    const parsed = new URL(url);
    if (UNSUPPORTED_PROTOCOLS.includes(parsed.protocol)) return null;

    return `${parsed.protocol}//${parsed.host}`;
  } catch {
    return null;
  }
}

export function getMainUrlKey(url: string | undefined): string | null {
  const domain = extractDomain(url);
  return domain ? `${domain}/` : null;
}

export function isMainUrl(url: string | undefined): boolean {
  if (!url) return false;

  try {
    const parsed = new URL(url);
    return parsed.pathname === '/' || parsed.pathname === '';
  } catch {
    return false;
  }
}

export function getTabUrlKey(tab: { url?: string }): string | null {
  return normalizeUrl(tab.url);
}

export function getTabDomain(tab: { url?: string }): string | null {
  return extractDomain(tab.url);
}
