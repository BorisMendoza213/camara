import type { Album, Coords, GeoPhoto } from '@/types/geo';
import type { AlbumRow, NewAlbumRow, NewPhotoRow, PhotoRow } from './schema';

export function rowToCoords(row: PhotoRow): Coords | null {
  if (row.latitude === null || row.longitude === null) return null;
  return {
    latitude: row.latitude,
    longitude: row.longitude,
    accuracy: row.accuracy,
    timestamp: row.timestamp ?? row.createdAt,
  };
}

export function coordsToRow(coords: Coords | null) {
  if (!coords) {
    return { latitude: null, longitude: null, accuracy: null, timestamp: null };
  }
  return {
    latitude: coords.latitude,
    longitude: coords.longitude,
    accuracy: coords.accuracy,
    timestamp: coords.timestamp,
  };
}

export function rowToPhoto(row: PhotoRow): GeoPhoto {
  return {
    id: row.id,
    uri: row.uri,
    coords: rowToCoords(row),
    source: row.source,
    createdAt: row.createdAt,
    note: row.note,
    favorite: row.favorite,
    albumId: row.albumId,
  };
}

export function photoToRow(photo: GeoPhoto): NewPhotoRow {
  return {
    id: photo.id,
    uri: photo.uri,
    source: photo.source,
    ...coordsToRow(photo.coords),
    createdAt: photo.createdAt,
    note: photo.note,
    favorite: photo.favorite,
    albumId: photo.albumId,
  };
}

export function rowToAlbum(row: AlbumRow): Album {
  return {
    id: row.id,
    name: row.name,
    createdAt: row.createdAt,
  };
}

export function albumToRow(album: Album): NewAlbumRow {
  return {
    id: album.id,
    name: album.name,
    createdAt: album.createdAt,
  };
}