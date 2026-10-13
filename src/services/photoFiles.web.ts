/**
 * En la web no hay un sistema de archivos persistente disponible para la app
 * estática: las fotos se muestran desde su URI original (caché de la sesión).
 */

export async function persistPhoto(sourceUri: string, _id: string): Promise<string> {
  return sourceUri;
}

export async function deletePhotoFile(_uri: string): Promise<void> {
  // No hay archivo persistente que borrar (la web guarda binarios en IndexedDB).
}

export function cleanupOrphanedPhotos(_validIds: string[]): string[] {
  return [];
}