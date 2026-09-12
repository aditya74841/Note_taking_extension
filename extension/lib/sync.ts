import { saveNote, deleteNote, getAllNotes, type NoteColor } from './db';

declare const chrome: any;

const ACCESS_TOKEN_KEY = 'urlnotes_access_token';
const REFRESH_TOKEN_KEY = 'urlnotes_refresh_token';
const USER_PROFILE_KEY = 'urlnotes_user_profile';
const SERVER_URL_KEY = 'urlnotes_server_url';
const DEFAULT_SERVER_URL = 'http://localhost:8000/api/v1';
const PINNED_DOMAINS_KEY = 'urlnotes_pinned_domains';

export interface UserProfile {
  id: string;
  email: string;
}

interface AuthResponseData {
  user: UserProfile;
  accessToken: string;
  refreshToken: string;
}

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
}

let refreshRequest: Promise<string | null> | null = null;

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
    const stored = await safeStorage.get(ACCESS_TOKEN_KEY);
    return (stored[ACCESS_TOKEN_KEY] as string) || null;
  } catch {
    return null;
  }
}

export async function getRefreshToken(): Promise<string | null> {
  try {
    const stored = await safeStorage.get(REFRESH_TOKEN_KEY);
    return (stored[REFRESH_TOKEN_KEY] as string) || null;
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

export async function setAuthData(
  accessToken: string,
  refreshToken: string,
  user: UserProfile,
): Promise<void> {
  await safeStorage.set({
    [ACCESS_TOKEN_KEY]: accessToken,
    [REFRESH_TOKEN_KEY]: refreshToken,
    [USER_PROFILE_KEY]: user,
  });
}

export async function clearAuthData(): Promise<void> {
  await safeStorage.remove([ACCESS_TOKEN_KEY, REFRESH_TOKEN_KEY, USER_PROFILE_KEY]);
}

function authError(data: ApiResponse<unknown>, fallback: string): Error {
  return new Error(data.message || fallback);
}

async function readApiResponse<T>(response: Response): Promise<ApiResponse<T>> {
  try {
    return (await response.json()) as ApiResponse<T>;
  } catch {
    return { success: false, message: 'The server returned an invalid response' };
  }
}

async function refreshAccessToken(): Promise<string | null> {
  if (refreshRequest) return refreshRequest;

  refreshRequest = (async () => {
    const refreshToken = await getRefreshToken();
    if (!refreshToken) return null;

    try {
      const baseUrl = await getServerUrl();
      const response = await fetch(`${baseUrl}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });
      const data = await readApiResponse<AuthResponseData>(response);
      if (!response.ok || !data.success || !data.data) {
        await clearAuthData();
        return null;
      }

      const { accessToken, refreshToken: nextRefreshToken, user } = data.data;
      if (!accessToken || !nextRefreshToken || !user) {
        await clearAuthData();
        return null;
      }

      await setAuthData(accessToken, nextRefreshToken, user);
      return accessToken;
    } catch {
      // A temporary network outage must never sign a user out or affect local notes.
      return null;
    } finally {
      refreshRequest = null;
    }
  })();

  return refreshRequest;
}

/**
 * Sends an authenticated cloud request. Local note persistence never uses this
 * helper, so an unavailable server cannot block typing, saving, or browsing notes.
 */
async function apiFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const makeRequest = async (accessToken: string) => {
    const headers = new Headers(init.headers);
    headers.set('Authorization', `Bearer ${accessToken}`);
    return fetch(`${await getServerUrl()}${path}`, { ...init, headers });
  };

  const accessToken = await getAuthToken();
  if (!accessToken) throw new Error('Authentication required');

  const response = await makeRequest(accessToken);
  if (response.status !== 401) return response;

  const refreshedAccessToken = await refreshAccessToken();
  if (!refreshedAccessToken) throw new Error('Your session has expired. Please sign in again.');

  const retriedResponse = await makeRequest(refreshedAccessToken);
  if (retriedResponse.status === 401) {
    await clearAuthData();
    throw new Error('Your session has expired. Please sign in again.');
  }

  return retriedResponse;
}

async function authenticate(path: '/auth/register' | '/auth/login', email: string, password: string) {
  const baseUrl = await getServerUrl();
  const response = await fetch(`${baseUrl}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const data = await readApiResponse<AuthResponseData>(response);
  if (!response.ok || !data.success || !data.data) {
    throw authError(data, path === '/auth/login' ? 'Login failed' : 'Registration failed');
  }

  const { accessToken, refreshToken, user } = data.data;
  if (!accessToken || !refreshToken || !user) {
    throw new Error('The server returned an incomplete authentication response');
  }

  await setAuthData(accessToken, refreshToken, user);
  return user;
}

export async function registerApi(email: string, password: string): Promise<UserProfile> {
  return authenticate('/auth/register', email, password);
}

export async function loginApi(email: string, password: string): Promise<UserProfile> {
  return authenticate('/auth/login', email, password);
}

export async function logoutApi(): Promise<void> {
  const refreshToken = await getRefreshToken();
  try {
    if (refreshToken) {
      const baseUrl = await getServerUrl();
      await fetch(`${baseUrl}/auth/logout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });
    }
  } finally {
    // Logging out locally must succeed even when the cloud service is offline.
    await clearAuthData();
  }
}

export async function getAuthenticatedUser(): Promise<UserProfile | null> {
  try {
    const response = await apiFetch('/auth/me');
    const data = await readApiResponse<{ user: UserProfile }>(response);
    if (!response.ok || !data.success || !data.data?.user) {
      throw authError(data, 'Unable to validate your session');
    }
    await safeStorage.set({ [USER_PROFILE_KEY]: data.data.user });
    return data.data.user;
  } catch (error) {
    // Do not discard a session solely because the user is offline.
    const message = error instanceof Error ? error.message : '';
    if (message.includes('session has expired') || message === 'Authentication required') {
      await clearAuthData();
      return null;
    }
    return getUserProfile();
  }
}

// 📥 Two-Way Sync: Upload local IndexedDB notes & restore cloud notes
export async function restoreFromCloud(): Promise<{ notesCount: number; pinsCount: number }> {
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
  const res = await apiFetch('/notes/restore');
  const data = await readApiResponse<{ notes?: CloudNoteItem[]; pins?: CloudPinItem[] }>(res);
  if (!res.ok || !data.success || !data.data) {
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
  color?: NoteColor;
  updatedAt?: number;
  isDeleted?: boolean;
}): Promise<void> {
  try {
    await apiFetch('/notes/backup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
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
    await apiFetch('/notes/pin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(pinData),
    });
  } catch {
    // Silent fail in background
  }
}

export interface CloudNoteItem {
  _id: string;
  urlKey: string;
  domain: string;
  fullUrl: string;
  title: string;
  content: string;
  color?: NoteColor;
  updatedAt: number;
  isDeleted: boolean;
}

export interface CloudPinItem {
  _id: string;
  domain: string;
  urlKey: string;
  title: string;
  fullUrl: string;
  updatedAt: number;
}

export interface CloudBackupExplorerData {
  activeNotes: CloudNoteItem[];
  deletedNotes: CloudNoteItem[];
  pins: CloudPinItem[];
  stats: {
    totalActiveNotes: number;
    totalDeletedNotes: number;
    totalPins: number;
    totalDomains: number;
  };
}

export async function fetchCloudBackupExplorer(): Promise<CloudBackupExplorerData> {
  const res = await apiFetch('/notes/backup-explorer');
  const data = await readApiResponse<CloudBackupExplorerData>(res);
  if (!res.ok || !data.success || !data.data) {
    throw new Error(data.message || 'Failed to fetch cloud backup data');
  }

  return data.data;
}

export async function restoreDeletedCloudNote(urlKey: string): Promise<void> {
  const res = await apiFetch('/notes/restore-deleted', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ urlKey }),
  });

  const data = await readApiResponse<unknown>(res);
  if (!res.ok || !data.success) {
    throw new Error(data.message || 'Failed to restore deleted note');
  }
}

export async function purgeCloudNote(urlKey: string): Promise<void> {
  const res = await apiFetch('/notes/purge', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ urlKey }),
  });

  const data = await readApiResponse<unknown>(res);
  if (!res.ok || !data.success) {
    throw new Error(data.message || 'Failed to purge note from cloud');
  }
}
