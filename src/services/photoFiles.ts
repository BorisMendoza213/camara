import { Directory, File, Paths } from 'expo-file-system';

/**
 * Las fotos se guardan en el directorio de documentos (documentos = persistente,
 * no se borra con la caché). En la base de datos solo guardamos la URI.
 */
const PHOTOS_DIR = new Directory(Paths.document, 'fotos');

function extensionFor(uri: string): string {
  const clean = uri.split('?')[0].split('#')[0];
  const dot = clean.lastIndexOf('.');
  if (dot >= 0 && clean.length - dot <= 6) return clean.slice(dot);
  return '.jpg';
}

function ensureDir(): void {
  if (!PHOTOS_DIR.exists) {
    PHOTOS_DIR.create();
  }
}

/** Copia la foto temporal a almacenamiento persistente y devuelve la URI final. */
export async function persistPhoto(sourceUri: string, id: string): Promise<string> {
  ensureDir();
  const destination = new File(PHOTOS_DIR, `${id}${extensionFor(sourceUri)}`);
  const source = new File(sourceUri);
  if (source.uri === destination.uri) return destination.uri;
  await source.copy(destination);
  return destination.uri;
}

/** Borra el archivo de una foto (la fila de SQLite se borra aparte). */
export async function deletePhotoFile(uri: string): Promise<void> {
  try {
    const file = new File(uri);
    if (file.exists) file.delete();
  } catch {
    // Puede no existir o estar en un directorio no accesible: se ignora.
  }
}

/**
 * Elimina archivos de `documentDirectory/fotos/` cuyo id no aparece en
 * `validIds` (fotos ya borradas de la base). Devuelve los nombres eliminados.
 */
export function cleanupOrphanedPhotos(validIds: string[]): string[] {
  if (!PHOTOS_DIR.exists) return [];
  const valid = new Set(validIds);
  const removed: string[] = [];
  for (const entry of PHOTOS_DIR.list()) {
    if (entry instanceof File) {
      const base = entry.name.replace(/\.[^.]+$/, '');
      if (valid.has(base)) continue;
      try {
        if (entry.exists) entry.delete();
        removed.push(entry.name);
      } catch {
        // Archivo en uso o sin permisos: se deja para una próxima limpieza.
      }
    }
  }
  return removed;
}