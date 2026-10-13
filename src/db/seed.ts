import { getAlbumCount, insertAlbum } from '@/db/repositories/albums';
import { createId } from '@/utils/id';

const DEFAULT_ALBUMS = ['Paseos', 'Playa', 'Ciudad'];

/**
 * Semilla opcional: crea álbumes de ejemplo solo cuando la base de datos está
 * vacía (el primer arranque). No duplica datos si ya existen álbumes.
 */
export async function seedIfEmpty(): Promise<number> {
  const count = await getAlbumCount();
  if (count > 0) return count;

  const now = Date.now();
  for (let i = 0; i < DEFAULT_ALBUMS.length; i++) {
    await insertAlbum({
      id: createId(),
      name: DEFAULT_ALBUMS[i],
      createdAt: now + i,
    });
  }
  return DEFAULT_ALBUMS.length;
}