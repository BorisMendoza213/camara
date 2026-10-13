export type PermissionState =
  | 'checking'
  | 'undetermined'
  | 'granted'
  | 'denied'
  | 'blocked';

export interface Coords {
  latitude: number;
  longitude: number;
  accuracy: number | null;
  timestamp: number;
}

export interface GeoPhoto {
  id: string;
  uri: string;
  coords: Coords | null;
  source: 'camera' | 'gallery';
  createdAt: number;
  note: string | null;
  favorite: boolean;
  albumId: string | null;
}

export interface Album {
  id: string;
  name: string;
  createdAt: number;
}

export interface NewPhotoInput {
  uri: string;
  coords: Coords | null;
  source: 'camera' | 'gallery';
}

/**
 * Filtros reactivos de la galería. albumId admite:
 * - un id concreto de álbum
 * - 'all': todos los álbumes
 * - 'none': solo fotos sin álbum
 * - null: sin filtro de álbum
 */
export interface PhotosFilter {
  /** Texto para buscar en el campo note (LIKE con parámetro). */
  search?: string;
  albumId?: string | 'all' | 'none';
  /** Solo fotos marcadas como favoritas. */
  favoritesOnly?: boolean;
}
