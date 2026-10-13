import { useEffect, useMemo, useSyncExternalStore } from 'react';

import * as webStore from '@/db/webStore';
import type { GeoPhoto, NewPhotoInput, PhotosFilter } from '@/types/geo';

function matchesFilter(photo: GeoPhoto, filter: PhotosFilter): boolean {
  if (filter.favoritesOnly && !photo.favorite) return false;
  if (filter.albumId === 'none' && photo.albumId !== null) return false;
  if (filter.albumId && filter.albumId !== 'all' && photo.albumId !== filter.albumId) return false;
  const term = filter.search?.trim().toLowerCase();
  if (term) {
    const note = photo.note?.toLowerCase() ?? '';
    if (!note.includes(term)) return false;
  }
  return true;
}

export function usePhotos(filter: PhotosFilter = {}) {
  const { search, albumId, favoritesOnly } = filter;
  const state = useSyncExternalStore(
    webStore.subscribe,
    webStore.getSnapshot,
    webStore.getSnapshot,
  );

  useEffect(() => {
    void webStore.ensureLoaded();
  }, []);

  const photos = useMemo(
    () => state.photos.filter((p) => matchesFilter(p, { search, albumId, favoritesOnly })),
    [state.photos, search, albumId, favoritesOnly],
  );

  const photosWithLocation = useMemo(
    () =>
      photos.filter(
        (p): p is GeoPhoto & { coords: NonNullable<GeoPhoto['coords']> } => p.coords !== null,
      ),
    [photos],
  );

  const actions = useMemo(
    () => ({
      addPhoto: (input: NewPhotoInput) => webStore.addPhoto(input),
      removePhoto: (id: string) => webStore.removePhoto(id),
      clearAll: () => webStore.clearAll(),
      updateNote: (id: string, note: string | null) => webStore.updateNote(id, note),
      toggleFavorite: (id: string) => webStore.toggleFavorite(id),
      setAlbum: (id: string, albumId: string | null) => webStore.setAlbum(id, albumId),
    }),
    [],
  );

  return { photos, photosWithLocation, error: state.loadError, ...actions };
}