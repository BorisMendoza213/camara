import { useCallback, useMemo } from 'react';
import { and, desc, eq, isNull, like, type SQL } from 'drizzle-orm';
import { useLiveQuery } from 'drizzle-orm/expo-sqlite';

import * as photosRepo from '@/db/repositories/photos';
import { photoToRow, rowToPhoto } from '@/db/mappers';
import { getDb } from '@/db/client';
import { photos } from '@/db/schema';
import * as photoFiles from '@/services/photoFiles';
import type { GeoPhoto, NewPhotoInput, PhotosFilter } from '@/types/geo';
import { createId } from '@/utils/id';

/** Borra archivos de la carpeta de fotos que ya no tienen registro en SQLite. */
async function cleanOrphans(): Promise<void> {
  try {
    const rows = await photosRepo.selectAllPhotos();
    photoFiles.cleanupOrphanedPhotos(rows.map((row) => row.id));
  } catch {
    // La limpieza es complementaria: un fallo no debe romper la acción principal.
  }
}

function buildFilteredQuery(filter: PhotosFilter) {
  const conditions: SQL[] = [];

  const term = filter.search?.trim();
  if (term) {
    // LIKE con parámetro: el texto del usuario nunca se concatena en SQL.
    conditions.push(like(photos.note, `%${term}%`));
  }

  if (filter.albumId === 'none') {
    conditions.push(isNull(photos.albumId));
  } else if (filter.albumId && filter.albumId !== 'all') {
    conditions.push(eq(photos.albumId, filter.albumId));
  }

  if (filter.favoritesOnly) {
    conditions.push(eq(photos.favorite, true));
  }

  const base = getDb().select().from(photos).orderBy(desc(photos.createdAt));
  return conditions.length > 0 ? base.where(and(...conditions)) : base;
}

export function usePhotos(filter: PhotosFilter = {}) {
  const { search, albumId, favoritesOnly } = filter;
  const query = useMemo(() => buildFilteredQuery({ search, albumId, favoritesOnly }), [
    search,
    albumId,
    favoritesOnly,
  ]);
  const { data, error } = useLiveQuery(query);

  const photos = useMemo(() => (data ?? []).map(rowToPhoto), [data]);

  const photosWithLocation = useMemo(
    () => photos.filter((p): p is GeoPhoto & { coords: NonNullable<GeoPhoto['coords']> } => p.coords !== null),
    [photos],
  );

  const addPhoto = useCallback(async (input: NewPhotoInput): Promise<GeoPhoto | null> => {
    const id = createId();
    let uri = input.uri;
    try {
      uri = await photoFiles.persistPhoto(input.uri, id);
    } catch {
      // No se pudo copiar el archivo; se conserva la URI original si es posible.
    }

    const createdAt = Date.now();
    const photo: GeoPhoto = {
      id,
      uri,
      coords: input.coords,
      source: input.source,
      createdAt,
      note: null,
      favorite: false,
      albumId: null,
    };

    try {
      await photosRepo.insertPhoto(photoToRow(photo));
    } catch {
      if (uri !== input.uri) await photoFiles.deletePhotoFile(uri).catch(() => {});
      return null;
    }
    return photo;
  }, []);

  const removePhoto = useCallback(async (id: string): Promise<void> => {
    const row = await photosRepo.getPhotoById(id);
    await photosRepo.deletePhoto(id);
    // El archivo se limpia al final para no perder datos si el registro no existía.
    if (row) await photoFiles.deletePhotoFile(row.uri).catch(() => {});
    await cleanOrphans();
  }, []);

  const clearAll = useCallback(async (): Promise<void> => {
    const rows = await photosRepo.selectAllPhotos();
    await photosRepo.deleteAllPhotos();
    for (const row of rows) {
      await photoFiles.deletePhotoFile(row.uri).catch(() => {});
    }
    photoFiles.cleanupOrphanedPhotos([]);
  }, []);

  const updateNote = useCallback(async (id: string, note: string | null): Promise<void> => {
    await photosRepo.updateNote(id, note);
  }, []);

  const toggleFavorite = useCallback(async (id: string): Promise<void> => {
    const row = await photosRepo.getPhotoById(id);
    if (!row) return;
    await photosRepo.updateFavorite(id, !row.favorite);
  }, []);

  const setAlbum = useCallback(async (id: string, albumId: string | null): Promise<void> => {
    await photosRepo.updateAlbum(id, albumId);
  }, []);

  return {
    photos,
    photosWithLocation,
    error,
    addPhoto,
    removePhoto,
    clearAll,
    updateNote,
    toggleFavorite,
    setAlbum,
  };
}