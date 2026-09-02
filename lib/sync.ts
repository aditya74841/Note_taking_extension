import { saveNote, deleteNote, getAllNotes } from './db';

declare const chrome: any;

const AUTH_TOKEN_KEY = 'urlnotes_auth_token';
const USER_PROFILE_KEY = 'urlnotes_user_profile';
const SERVER_URL_KEY = 'urlnotes_server_url';
const DEFAULT_SERVER_URL = 'http://localhost:8000/api/v1';
const PINNED_DOMAINS_KEY = 'urlnotes_pinned_domains';

export interface UserProfile {
  _id: string;
  email: string;
}

// Safe Universal Extension / Browser Storage Helper
export const safeStorage = {
  get: async (key: string): Promise<Record<string, any>> => {
    try {
      if (typeof browser !== 'undefined' && browser.storage?.local) {
        return await browser.storage.local.get(key);
      }
      if (typeof chrome !== 'undefined' && chrome.storage?.local) {
        return new Promise((resolve) => {
          chrome.storage.local.get([key], (res: any) => resolve(res || {}));
        });
      }
      const item = localStorage.getItem(key);
      return item ? { [key]: JSON.parse(item) } : {};
    } catch {
      try {
        const item = localStorage.getItem(key);
        return item ? { [key]: JSON.parse(item) } : {};
      } catch {
        return {};
      }
    }
  },
  set: async (items: Record<string, any>): Promise<void> => {
    try {
      if (typeof browser !== 'undefined' && browser.storage?.local) {
        await browser.storage.local.set(items);
        return;
      }
      if (typeof chrome !== 'undefined' && chrome.storage?.local) {
        return new Promise((resolve) => {
          chrome.storage.local.set(items, () => resolve());
        });
      }
      for (const [k, v] of Object.entries(items)) {
        localStorage.setItem(k, JSON.stringify(v));
      }
    } catch {
      for (const [k, v] of Object.entries(items)) {
        try {
          localStorage.setItem(k, JSON.stringify(v));
        } catch {}
      }
    }
  },
  remove: async (keys: string | string[]): Promise<void> => {
    const keyList = Array.isArray(keys) ? keys : [keys];
    try {
      if (typeof browser !== 'undefined' && browser.storage?.local) {
        await browser.storage.local.remove(keyList);
        return;
      }
      if (typeof chrome !== 'undefined' && chrome.storage?.local) {
        return new Promise((resolve) => {
          chrome.storage.local.remove(keyList, () => resolve());
        });
      }
      for (const k of keyList) {
        localStorage.removeItem(k);
      }
    } catch {
      for (const k of keyList) {
        try {
          localStorage.removeItem(k);
        } catch {}
      }
    }
  },
};

export async function getServerUrl(): Promise<string> {
  try {
    const stored = await safeStorage.get(SERVER_URL_KEY);
    return (stored[SERVER_URL_KEY] as string) || DEFAULT_SERVER_URL;
  } catch {
    return DEFAULT_SERVER_URL;
  }
}

export async function setServerUrl(url: string): Promise<void> {
  await safeStorage.set({ [SERVER_URL_KEY]: url.trim() });
}

export async function getAuthToken(): Promise<string | null> {
  try {
    const stored = await safeStorage.get(AUTH_TOKEN_KEY);
    return (stored[AUTH_TOKEN_KEY] as string) || null;
  } catch {
    return null;
  }
}

export async function getUserProfile(): Promise<UserProfile | null> {
  try {
    const stored = await safeStorage.get(USER_PROFILE_KEY);
    return (stored[USER_PROFILE_KEY] as UserProfile) || null;
  } catch {
    return null;
  }
}

export async function setAuthData(token: string, user: UserProfile): Promise<void> {
  await safeStorage.set({
    [AUTH_TOKEN_KEY]: token,
    [USER_PROFILE_KEY]: user,
  });
}

export async function clearAuthData(): Promise<void> {
  await safeStorage.remove([AUTH_TOKEN_KEY, USER_PROFILE_KEY]);
}

export async function registerApi(email: string, password: string): Promise<UserProfile> {
  const baseUrl = await getServerUrl();
  const res = await fetch(`${baseUrl}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.message || 'Registration failed');
  }

  await setAuthData(data.data.token, data.data.user);
  return data.data.user;
}

export async function loginApi(email: string, password: string): Promise<UserProfile> {
  const baseUrl = await getServerUrl();
  const res = await fetch(`${baseUrl}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.message || 'Login failed');
  }

  await setAuthData(data.data.token, data.data.user);
  return data.data.user;
}

export async function logoutApi(): Promise<void> {
  await clearAuthData();
}

// 📥 Two-Way Sync: Upload local IndexedDB notes & restore cloud notes
export async function restoreFromCloud(): Promise<{ notesCount: number; pinsCount: number }> {
  const token = await getAuthToken();
  if (!token) throw new Error('Not authenticated');

  const baseUrl = await getServerUrl();

  // STEP 1: Upload all existing local IndexedDB notes to Cloud MongoDB
  try {
    const localNotes = await getAllNotes();
    for (const n of localNotes) {
      if (n.urlKey && n.content) {
        await backupNoteToCloud({
          urlKey: n.urlKey,
          domain: n.domain || 'other',
          fullUrl: n.fullUrl || '',
          title: n.title || '',
          content: n.content,
          color: n.color,
          updatedAt: n.updatedAt,
        });
      }
    }
  } catch (err) {
    console.error('Error uploading local notes before restore:', err);
  }

  // STEP 2: Upload all existing local domain pins to Cloud MongoDB
  try {
    const storedPinsRes = await safeStorage.get(PINNED_DOMAINS_KEY).catch(() => ({}));
    const storedPins = ((storedPinsRes || {}) as Record<string, any>)[PINNED_DOMAINS_KEY] || {};
    for (const [domain, p] of Object.entries(storedPins as Record<string, any>)) {
      if (p.urlKey) {
        await backupPinToCloud({
          domain,
          urlKey: p.urlKey,
          title: p.title,
          fullUrl: p.fullUrl,
          isUnpin: false,
        });
      }
    }
  } catch (err) {
    console.error('Error uploading local pins before restore:', err);
  }

  // STEP 3: Fetch all cloud notes and pins from MongoDB
  const res = await fetch(`${baseUrl}/notes/restore`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.message || 'Failed to restore cloud notes');
  }

  const { notes = [], pins = [] } = data.data;

  // Restore notes into local IndexedDB
  for (const n of notes) {
    if (n.isDeleted) {
      await deleteNote(n.urlKey);
    } else {
      await saveNote({
        urlKey: n.urlKey,
        domain: n.domain,
        fullUrl: n.fullUrl,
        title: n.title,
        content: n.content,
        color: n.color,
        updatedAt: n.updatedAt,
      });
    }
  }

  // Restore domain pins into local storage
  if (pins.length > 0) {
    const pinMap: Record<string, { urlKey: string; title: string; fullUrl: string }> = {};
    for (const p of pins) {
      pinMap[p.domain] = {
        urlKey: p.urlKey,
        title: p.title,
        fullUrl: p.fullUrl,
      };
    }
    await safeStorage.set({ [PINNED_DOMAINS_KEY]: pinMap });
  }

  const finalLocalNotes = await getAllNotes();
  return { notesCount: finalLocalNotes.length, pinsCount: pins.length };
}

// 📤 Silent Background Note Backup
export async function backupNoteToCloud(noteData: {
  urlKey: string;
  domain: string;
  fullUrl: string;
  title: string;
  content: string;
  color?: string;
  updatedAt?: number;
  isDeleted?: boolean;
}): Promise<void> {
  try {
    const token = await getAuthToken();
    if (!token) return; // Silent return if not logged in

    const baseUrl = await getServerUrl();
    await fetch(`${baseUrl}/notes/backup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(noteData),
    });
  } catch {
    // Silent fail in background queue; UI is unaffected
  }
}

// 📤 Silent Background Domain Pin Backup
export async function backupPinToCloud(pinData: {
  domain: string;
  urlKey?: string;
  title?: string;
  fullUrl?: string;
  isUnpin?: boolean;
}): Promise<void> {
  try {
    const token = await getAuthToken();
    if (!token) return;

    const baseUrl = await getServerUrl();
    await fetch(`${baseUrl}/notes/pin`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(pinData),
    });
  } catch {
    // Silent fail in background
  }
}
