import { drizzle } from 'drizzle-orm/expo-sqlite';
import type { ExpoSQLiteDatabase } from 'drizzle-orm/expo-sqlite';
import { openDatabaseSync } from 'expo-sqlite';

import * as schema from './schema';

export const DATABASE_NAME = 'geocam.db';

let _db: ExpoSQLiteDatabase<typeof schema> | null = null;

/**
 * Devuelve la instancia compartida de la base de datos.
 *
 * La apertura es diferida (lazy) para que el paquete iOS/Android solo abra
 * el archivo SQLite cuando la app lo necesita. En la web estática este módulo
 * no se ejecuta: se usa el proveedor en memoria (GeoPhotosContext.web).
 */
export function getDb(): ExpoSQLiteDatabase<typeof schema> {
  if (!_db) {
    const expoDb = openDatabaseSync(DATABASE_NAME, { enableChangeListener: true });
    // Las claves foráneas se activan por conexión y nunca se desactivan dentro de la app.
    expoDb.execSync('PRAGMA foreign_keys = ON;');
    _db = drizzle(expoDb, { schema });
  }
  return _db;
}