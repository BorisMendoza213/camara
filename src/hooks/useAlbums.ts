import { useCallback, useMemo } from 'react';
import { useLiveQuery } from 'drizzle-orm/expo-sqlite';

import { AlbumNameError } from '@/db/errors';
import { rowToAlbum } from '@/db/mappers';
import * as albumsRepo from '@/db/repositories/albums';
import type { Album } from '@/types/geo';
import { createId } from '@/utils/id';

function assertValidAlbumName(name: string, existing: Album[], excludeId?: string): string {
  const trimmed = name.trim();
  if (!trimmed) {
    throw new AlbumNameError('El nombre del álbum no puede estar vacío.');
  }
  const duplicate = existing.some(
    (a) => a.id !== excludeId && a.name.toLowerCase() === trimmed.toLowerCase(),
  );
  if (duplicate) {
    throw new AlbumNameError(`Ya existe un álbum llamado «${trimmed}».`);
  }
  return trimmed;
}

export function useAlbums() {
  const { data, error } = useLiveQuery(albumsRepo.selectAllAlbums());

  const albums = useMemo(() => (data ?? []).map(rowToAlbum), [data]);

  const createAlbum = useCallback(
    async (name: string): Promise<Album> => {
      const trimmed = assertValidAlbumName(name, albums);
      const album: Album = {
        id: createId(),
        name: trimmed,
        createdAt: Date.now(),
      };
      await albumsRepo.insertAlbum({
        id: album.id,
        name: album.name,
        createdAt: album.createdAt,
      });
      return album;
    },
    [albums],
  );

  const renameAlbum = useCallback(
    async (id: string, name: string): Promise<void> => {
      const trimmed = assertValidAlbumName(name, albums, id);
      await albumsRepo.renameAlbum(id, trimmed);
    },
    [albums],
  );

  const deleteAlbum = useCallback(async (id: string): Promise<void> => {
    await albumsRepo.deleteAlbum(id);
  }, []);

  return { albums, error, createAlbum, renameAlbum, deleteAlbum };
}