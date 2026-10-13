import { migrate } from 'drizzle-orm/expo-sqlite/migrator';

import migrations from '../../drizzle/migrations';
import { getDb } from './client';
import { seedIfEmpty } from './seed';

/**
 * Aplica las migraciones de Drizzle Kit y siembra los álbumes de ejemplo en el
 * primer arranque. Se invoca una sola vez antes de montar la interfaz (iOS/Android).
 */
export async function initDatabase(): Promise<void> {
  await migrate(getDb(), migrations);
  await seedIfEmpty();
}