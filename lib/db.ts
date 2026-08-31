import { openDB, type DBSchema, type IDBPDatabase } from 'idb';

export interface Note {
  urlKey: string;
  fullUrl: string;
  title: string;
  content: string;
  updatedAt: number;
}

interface UrlNotesDB extends DBSchema {
  notes: {
    key: string;
    value: Note;
  };
}

const DB_NAME = 'UrlNotesDB';
const DB_VERSION = 1;

let dbPromise: Promise<IDBPDatabase<UrlNotesDB>> | null = null;

function getDb() {
  if (!dbPromise) {
    dbPromise = openDB<UrlNotesDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('notes')) {
          db.createObjectStore('notes', { keyPath: 'urlKey' });
        }
      },
    });
  }
  return dbPromise;
}

export async function getNote(urlKey: string): Promise<Note | undefined> {
  const db = await getDb();
  return db.get('notes', urlKey);
}

export async function saveNote(note: Note): Promise<void> {
  const db = await getDb();
  const trimmed = note.content.trim();

  if (!trimmed) {
    await db.delete('notes', note.urlKey);
    return;
  }

  await db.put('notes', {
    ...note,
    content: note.content,
    updatedAt: Date.now(),
  });
}

export async function deleteNote(urlKey: string): Promise<void> {
  const db = await getDb();
  await db.delete('notes', urlKey);
}

export async function hasNote(urlKey: string): Promise<boolean> {
  const note = await getNote(urlKey);
  return Boolean(note?.content.trim());
}
