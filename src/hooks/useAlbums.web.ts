import { useCallback, useEffect, useMemo, useSyncExternalStore } from 'react';

import { AlbumNameError } from '@/db/errors';
import * as webStore from '@/db/webStore';
import type { Album } from '@/types/geo';

export function useAlbums() {
  const state = useSyncExternalStore(
    webStore.subscribe,
    webStore.getSnapshot,
    webStore.getSnapshot,
  );

  useEffect(() => {
    void webStore.ensureLoaded();
  }, []);

  const albums = useMemo(() => state.albums, [state.albums]);

  const createAlbum = useCallback(async (name: string): Promise<Album> => {
    const trimmed = name.trim();
    if (!trimmed) throw new AlbumNameError('El nombre del álbum no puede estar vacío.');
    if (webStore.albumNameExists(trimmed)) {
      throw new AlbumNameError(`Ya existe un álbum llamado «${trimmed}».`);
    }
    return webStore.createAlbum(trimmed);
  }, []);

  const renameAlbum = useCallback(
    async (id: string, name: string): Promise<void> => {
      const trimmed = name.trim();
      if (!trimmed) throw new AlbumNameError('El nombre del álbum no puede estar vacío.');
      if (webStore.albumNameExists(trimmed, id)) {
        throw new AlbumNameError(`Ya existe un álbum llamado «${trimmed}».`);
      }
      await webStore.renameAlbum(id, trimmed);
    },
    [],
  );

  const deleteAlbum = useCallback(async (id: string): Promise<void> => {
    await webStore.deleteAlbum(id);
  }, []);

  return { albums, error: state.loadError, createAlbum, renameAlbum, deleteAlbum };
}