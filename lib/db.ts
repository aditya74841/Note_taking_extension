import { openDB, type DBSchema, type IDBPDatabase } from 'idb';
import { extractDomain } from './urlKey';

export type NoteColor = 'default' | 'red' | 'yellow' | 'green' | 'purple' | 'blue';

export interface Note {
  urlKey: string;
  domain: string;
  fullUrl: string;
  title: string;
  content: string;
  updatedAt: number;
  color?: NoteColor;
}

interface UrlNotesDB extends DBSchema {
  notes: {
    key: string;
    value: Note;
    indexes: {
      'by-domain': string;
      'by-updated': number;
    };
  };
}

const DB_NAME = 'UrlNotesDB';
const DB_VERSION = 2;

let dbPromise: Promise<IDBPDatabase<UrlNotesDB>> | null = null;

function getDb() {
  if (!dbPromise) {
    dbPromise = openDB<UrlNotesDB>(DB_NAME, DB_VERSION, {
      upgrade(db, oldVersion, _newVersion, transaction) {
        let store: any;
        if (!db.objectStoreNames.contains('notes')) {
          store = db.createObjectStore('notes', { keyPath: 'urlKey' });
        } else {
          store = transaction.objectStore('notes');
        }

        if (!store.indexNames.contains('by-domain')) {
          store.createIndex('by-domain', 'domain');
        }
        if (!store.indexNames.contains('by-updated')) {
          store.createIndex('by-updated', 'updatedAt');
        }
      },
    }).catch((err) => {
      console.error('Failed to open IndexedDB:', err);
      dbPromise = null;
      throw err;
    });
  }
  return dbPromise;
}

export async function getNote(urlKey: string): Promise<Note | undefined> {
  const db = await getDb();
  return db.get('notes', urlKey);
}

export async function getNotesByDomain(domain: string): Promise<Note[]> {
  const db = await getDb();
  const notes = await db.getAllFromIndex('notes', 'by-domain', domain);
  return (notes || [])
    .filter(
      (note) =>
        note &&
        ((typeof note.content === 'string' && note.content.trim().length > 0) ||
          (typeof note.title === 'string' && note.title.trim().length > 0))
    )
    .sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
}

export async function getAllNotes(): Promise<Note[]> {
  const db = await getDb();
  const notes = await db.getAllFromIndex('notes', 'by-updated');
  return (notes || [])
    .filter(
      (note) =>
        note &&
        ((typeof note.content === 'string' && note.content.trim().length > 0) ||
          (typeof note.title === 'string' && note.title.trim().length > 0))
    )
    .reverse();
}

export async function getDomainNoteCount(domain: string): Promise<number> {
  const notes = await getNotesByDomain(domain);
  return notes.length;
}

export async function saveNote(note: {
  urlKey: string;
  fullUrl: string;
  title: string;
  content: string;
  domain?: string;
  updatedAt?: number;
  color?: NoteColor;
}): Promise<void> {
  const db = await getDb();
  const trimmedContent = (note.content || '').trim();
  const trimmedTitle = (note.title || '').trim();

  // Delete note if BOTH content and title are empty
  if (!trimmedContent && !trimmedTitle) {
    await db.delete('notes', note.urlKey);
    return;
  }

  const domain = note.domain || extractDomain(note.fullUrl) || note.urlKey.split('/')[0] || 'unknown';
  const existing = await db.get('notes', note.urlKey);

  await db.put('notes', {
    urlKey: note.urlKey,
    domain,
    fullUrl: note.fullUrl,
    title: note.title || note.fullUrl,
    content: note.content || '',
    color: note.color ?? existing?.color ?? 'default',
    updatedAt: Date.now(),
  });
}

export async function deleteNote(urlKey: string): Promise<void> {
  const db = await getDb();
  await db.delete('notes', urlKey);
}

export async function hasNote(urlKey: string): Promise<boolean> {
  const note = await getNote(urlKey);
  if (!note) return false;
  return Boolean((note.content && note.content.trim()) || (note.title && note.title.trim()));
}

