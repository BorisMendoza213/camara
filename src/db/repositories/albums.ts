import { asc, eq, sql } from 'drizzle-orm';

import { getDb } from '@/db/client';
import { albums } from '@/db/schema';
import type { AlbumRow, NewAlbumRow } from '@/db/schema';
import { clearAlbumFromPhotos } from './photos';

function selectAllBuilder() {
  return getDb().select().from(albums).orderBy(asc(albums.createdAt));
}

function selectByIdBuilder(id: string) {
  return getDb().select().from(albums).where(eq(albums.id, id));
}

/** Query builder para useLiveQuery: devuelve los álbumes por orden de creación. */
export function selectAllAlbums() {
  return selectAllBuilder();
}

export async function getAlbumById(id: string): Promise<AlbumRow | undefined> {
  const rows = await selectByIdBuilder(id);
  return rows[0];
}

/**
 * Comprueba si ya existe un álbum con ese nombre, sin diferenciar mayúsculas.
 * Usa SQL con parámetro (nunca se concatena la entrada del usuario).
 */
export async function albumWithNameExists(name: string): Promise<boolean> {
  const rows = await getDb()
    .select({ id: albums.id })
    .from(albums)
    .where(sql`lower(${albums.name}) = lower(${name})`);
  return rows.length > 0;
}

export async function getAlbumCount(): Promise<number> {
  const rows = await getDb().select({ id: albums.id }).from(albums);
  return rows.length;
}

export async function insertAlbum(input: NewAlbumRow): Promise<AlbumRow> {
  await getDb().insert(albums).values(input);
  const row = await getAlbumById(input.id);
  if (!row) throw new Error(`No se pudo crear el álbum ${input.id}`);
  return row;
}

export async function renameAlbum(id: string, name: string): Promise<void> {
  await getDb().update(albums).set({ name }).where(eq(albums.id, id));
}

/**
 * Borra un álbum dejando sus fotos intactas: primero se anula albumId en las
 * fotos que lo referenciaban (SET NULL) y después se elimina el álbum.
 */
export async function deleteAlbum(id: string): Promise<void> {
  await clearAlbumFromPhotos(id);
  await getDb().delete(albums).where(eq(albums.id, id));
}

export async function deleteAllAlbums(): Promise<void> {
  for (const row of await getDb().select({ id: albums.id }).from(albums)) {
    await clearAlbumFromPhotos(row.id);
  }
  await getDb().delete(albums);
}