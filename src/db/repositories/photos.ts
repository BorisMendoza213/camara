import { and, desc, eq, isNotNull } from 'drizzle-orm';

import { getDb } from '@/db/client';
import { photos } from '@/db/schema';
import type { NewPhotoRow, PhotoRow } from '@/db/schema';

function selectAllBuilder() {
  return getDb().select().from(photos).orderBy(desc(photos.createdAt));
}

function selectWithLocationBuilder() {
  return getDb()
    .select()
    .from(photos)
    .where(and(isNotNull(photos.latitude), isNotNull(photos.longitude)))
    .orderBy(desc(photos.createdAt));
}

function selectByIdBuilder(id: string) {
  return getDb().select().from(photos).where(eq(photos.id, id));
}

/** Query builder para useLiveQuery: devuelve todas las fotos, de más reciente a más antigua. */
export function selectAllPhotos() {
  return selectAllBuilder();
}

/** Query builder para useLiveQuery: solo fotos con latitud y longitud no nulas. */
export function selectWithLocation() {
  return selectWithLocationBuilder();
}

export async function getPhotoById(id: string): Promise<PhotoRow | undefined> {
  const rows = await selectByIdBuilder(id);
  return rows[0];
}

export async function getPhotoCount(): Promise<number> {
  const rows = await getDb().select({ id: photos.id }).from(photos);
  return rows.length;
}

export async function insertPhoto(input: NewPhotoRow): Promise<PhotoRow> {
  await getDb().insert(photos).values(input);
  const row = await getPhotoById(input.id);
  if (!row) throw new Error(`No se pudo insertar la foto ${input.id}`);
  return row;
}

export async function updateNote(id: string, note: string | null): Promise<void> {
  await getDb().update(photos).set({ note }).where(eq(photos.id, id));
}

export async function updateFavorite(id: string, favorite: boolean): Promise<void> {
  await getDb().update(photos).set({ favorite }).where(eq(photos.id, id));
}

export async function updateAlbum(id: string, albumId: string | null): Promise<void> {
  await getDb().update(photos).set({ albumId }).where(eq(photos.id, id));
}

/** Aplica SET NULL: deja las fotos del álbum sin álbum (equivalente a onDelete: 'set null'). */
export async function clearAlbumFromPhotos(albumId: string): Promise<void> {
  await getDb().update(photos).set({ albumId: null }).where(eq(photos.albumId, albumId));
}

export async function deletePhoto(id: string): Promise<void> {
  await getDb().delete(photos).where(eq(photos.id, id));
}

export async function deleteAllPhotos(): Promise<void> {
  await getDb().delete(photos);
}