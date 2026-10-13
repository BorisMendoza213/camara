import type { Album, GeoPhoto, NewPhotoInput } from '@/types/geo';

/**
 * Almacén persistente para la demo web estática.
 *
 * En la web no hay SQLite ni sistema de archivos persistente, así que las fotos
 * y los álbumes se guardan en IndexedDB: las imágenes como binarios (Blob) y los
 * metadatos como registros. En memoria solo se mantienen las URLs de objeto
 * necesarias para renderizar las imágenes; se revocan al eliminar para no fugarlas.
 */

const DB_NAME = 'geocam-web';
const DB_VERSION = 1;
const DEFAULT_ALBUMS = ['Paseos', 'Playa', 'Ciudad'];

export interface WebStoreSnapshot {
  photos: GeoPhoto[];
  albums: Album[];
  loadError: Error | null;
}

interface PersistedPhoto extends GeoPhoto {
  hasBlob?: boolean;
}

export const EMPTY_SNAPSHOT: WebStoreSnapshot = { photos: [], albums: [], loadError: null };

/** Misma referencia que EMPTY_SNAPSHOT hasta la primera carga: coincide con el SSR. */
let state: WebStoreSnapshot = EMPTY_SNAPSHOT;
let loaded = false;
const listeners = new Set<() => void>();
const objectUrls = new Map<string, string>();

function notify() {
  for (const listener of listeners) listener();
}

function revokeUrl(photoId: string) {
  const url = objectUrls.get(photoId);
  if (url) {
    URL.revokeObjectURL(url);
    objectUrls.delete(photoId);
  }
}

function openDb(): Promise<IDBDatabase | null> {
  if (typeof indexedDB === 'undefined') return Promise.resolve(null);
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains('kv')) db.createObjectStore('kv');
      if (!db.objectStoreNames.contains('blobs')) {
        db.createObjectStore('blobs', { keyPath: 'id' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function kvGet(db: IDBDatabase, key: string): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction('kv', 'readonly');
    const request = tx.objectStore('kv').get(key);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function kvSet(db: IDBDatabase, key: string, value: unknown): Promise<void> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction('kv', 'readwrite');
    tx.objectStore('kv').put(value, key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

async function blobGet(db: IDBDatabase, id: string): Promise<Blob | null> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction('blobs', 'readonly');
    const request = tx.objectStore('blobs').get(id);
    request.onsuccess = () => resolve((request.result as { blob?: Blob })?.blob ?? null);
    request.onerror = () => reject(request.error);
  });
}

async function blobPut(db: IDBDatabase, id: string, blob: Blob): Promise<void> {
  const tx = db.transaction('blobs', 'readwrite');
  tx.objectStore('blobs').put({ id, blob });
  await new Promise<void>((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

async function blobDelete(db: IDBDatabase, id: string): Promise<void> {
  const tx = db.transaction('blobs', 'readwrite');
  tx.objectStore('blobs').delete(id);
  await new Promise<void>((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

async function blobClearAll(db: IDBDatabase): Promise<void> {
  const tx = db.transaction('blobs', 'readwrite');
  tx.objectStore('blobs').clear();
  await new Promise<void>((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

async function fetchToBlob(uri: string): Promise<Blob | null> {
  try {
    const response = await fetch(uri);
    return await response.blob();
  } catch {
    return null;
  }
}

/** Carga los datos guardados en IndexedDB (una sola vez). */
export async function ensureLoaded(): Promise<void> {
  if (loaded) return;
  loaded = true;

  const db = await openDb();
  if (!db) return;

  try {
    const rawPhotos = (await kvGet(db, 'photos')) as PersistedPhoto[] | undefined;
    const rawAlbums = (await kvGet(db, 'albums')) as Album[] | undefined;

    const photos: GeoPhoto[] = [];
    for (const row of rawPhotos ?? []) {
      const blob = row.hasBlob ? await blobGet(db, row.id) : null;
      if (blob) {
        const url = URL.createObjectURL(blob);
        objectUrls.set(row.id, url);
        photos.push({ ...row, uri: url });
      } else {
        photos.push({ id: row.id, uri: row.uri, coords: row.coords, source: row.source, createdAt: row.createdAt, note: row.note, favorite: row.favorite, albumId: row.albumId });
      }
    }

    let albums = rawAlbums ?? [];
    if (albums.length === 0) {
      const now = Date.now();
      albums = DEFAULT_ALBUMS.map((name, i) => ({ id: `album-${i}`, name, createdAt: now + i }));
      await kvSet(db, 'albums', albums);
    }

    state = { photos, albums, loadError: null };
    notify();
  } catch (error) {
    state = {
      ...state,
      loadError: error instanceof Error ? error : new Error('No se pudo cargar el almacenamiento local'),
    };
    notify();
  }
}

export function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getSnapshot(): WebStoreSnapshot {
  return state;
}

async function persistBlob(photo: GeoPhoto, sourceUri: string): Promise<boolean> {
  const db = await openDb();
  if (!db) return false;
  const blob = await fetchToBlob(sourceUri);
  if (!blob) return false;
  await blobPut(db, photo.id, blob);
  const url = URL.createObjectURL(blob);
  if (objectUrls.has(photo.id)) revokeUrl(photo.id);
  objectUrls.set(photo.id, url);
  photo.uri = url;
  return true;
}

function commitPhotos(db: Promise<IDBDatabase | null>, photos: GeoPhoto[]): void {
  void db.then((resolved) => {
    if (resolved) void kvSet(resolved, 'photos', photos);
  });
}

function hashId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export async function addPhoto(input: NewPhotoInput): Promise<GeoPhoto | null> {
  await ensureLoaded();
  const photo = {
    id: hashId(),
    uri: input.uri,
    coords: input.coords,
    source: input.source,
    createdAt: Date.now(),
    note: null,
    favorite: false,
    albumId: null,
  } as GeoPhoto;
  const stored = await persistBlob(photo, input.uri);
  if (stored) (photo as PersistedPhoto).hasBlob = true;
  state = { ...state, photos: [photo, ...state.photos] };
  commitPhotos(openDb(), state.photos);
  notify();
  return photo;
}

export async function removePhoto(id: string): Promise<void> {
  await ensureLoaded();
  state = { ...state, photos: state.photos.filter((p) => p.id !== id) };
  revokeUrl(id);
  commitPhotos(openDb(), state.photos);
  void openDb().then((db) => {
    if (db) void blobDelete(db, id);
  });
  notify();
}

export async function clearAll(): Promise<void> {
  await ensureLoaded();
  for (const photo of state.photos) revokeUrl(photo.id);
  state = { ...state, photos: [] };
  commitPhotos(openDb(), state.photos);
  void openDb().then((db) => {
    if (db) void blobClearAll(db);
  });
  notify();
}

export async function updateNote(id: string, note: string | null): Promise<void> {
  await ensureLoaded();
  state = {
    ...state,
    photos: state.photos.map((p) => (p.id === id ? { ...p, note } : p)),
  };
  commitPhotos(openDb(), state.photos);
  notify();
}

export async function toggleFavorite(id: string): Promise<void> {
  await ensureLoaded();
  state = {
    ...state,
    photos: state.photos.map((p) => (p.id === id ? { ...p, favorite: !p.favorite } : p)),
  };
  commitPhotos(openDb(), state.photos);
  notify();
}

export async function setAlbum(id: string, albumId: string | null): Promise<void> {
  await ensureLoaded();
  state = {
    ...state,
    photos: state.photos.map((p) => (p.id === id ? { ...p, albumId } : p)),
  };
  commitPhotos(openDb(), state.photos);
  notify();
}

export function albumNameExists(name: string, excludeId?: string): boolean {
  const trimmed = name.trim().toLowerCase();
  return state.albums.some((a) => a.id !== excludeId && a.name.toLowerCase() === trimmed);
}

export async function createAlbum(name: string): Promise<Album> {
  await ensureLoaded();
  const trimmed = name.trim();
  const album: Album = { id: hashId(), name: trimmed, createdAt: Date.now() };
  state = { ...state, albums: [...state.albums, album] };
  void openDb().then((db) => {
    if (db) void kvSet(db, 'albums', state.albums);
  });
  notify();
  return album;
}

export async function renameAlbum(id: string, name: string): Promise<void> {
  await ensureLoaded();
  const trimmed = name.trim();
  state = {
    ...state,
    albums: state.albums.map((a) => (a.id === id ? { ...a, name: trimmed } : a)),
  };
  void openDb().then((db) => {
    if (db) void kvSet(db, 'albums', state.albums);
  });
  notify();
}

export async function deleteAlbum(id: string): Promise<void> {
  await ensureLoaded();
  state = {
    ...state,
    photos: state.photos.map((p) => ({ ...p, albumId: p.albumId === id ? null : p.albumId })),
    albums: state.albums.filter((a) => a.id !== id),
  };
  void openDb().then((db) => {
    if (db) {
      void kvSet(db, 'albums', state.albums);
      void kvSet(db, 'photos', state.photos);
    }
  });
  notify();
}