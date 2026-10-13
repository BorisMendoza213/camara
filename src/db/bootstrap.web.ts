/**
 * La exportación web estática no usa SQLite: las fotos viven en memoria
 * (GeoPhotosContext.web). Este stub impide que expo-sqlite entre en el bundle.
 */
export async function initDatabase(): Promise<void> {
  // Sin base de datos local en la web.
}