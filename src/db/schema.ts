import { integer, real, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const albums = sqliteTable('albums', {
  id: text('id').primaryKey(),
  name: text('name').notNull().unique(),
  createdAt: integer('created_at').notNull(),
});

export const photos = sqliteTable('photos', {
  id: text('id').primaryKey(),
  uri: text('uri').notNull(),
  source: text('source', { enum: ['camera', 'gallery'] }).notNull(),
  latitude: real('latitude'),
  longitude: real('longitude'),
  accuracy: real('accuracy'),
  timestamp: integer('timestamp'),
  note: text('note'),
  favorite: integer('favorite', { mode: 'boolean' }).notNull().default(false),
  albumId: text('album_id').references(() => albums.id, { onDelete: 'set null' }),
  createdAt: integer('created_at').notNull(),
});

export type AlbumRow = typeof albums.$inferSelect;
export type NewAlbumRow = typeof albums.$inferInsert;
export type PhotoRow = typeof photos.$inferSelect;
export type NewPhotoRow = typeof photos.$inferInsert;
