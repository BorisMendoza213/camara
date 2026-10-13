# Registro de Auditoría de IA (AI-LOG)

**Estudiante(s):** _(completar)_
**Semana:** 7
**Proyecto:** GeoCam – Taller Integrador 2
**SDK:** Expo 57 · React Native 0.86 · React 19 · TypeScript (strict)

---

## 1. Prompts utilizados

- "Integra `expo-sqlite` con Drizzle ORM (`drizzle-orm/expo-sqlite`) en un proyecto Expo SDK 57:
  schema, generación de migraciones con `drizzle-kit` y aplicación al arrancar con `useMigrations`."
- "¿Cómo uso `useLiveQuery` de Drizzle sobre `expo-sqlite` para que el contexto y los hooks se
  re-rendericen cuando cambian las filas? ¿Qué forma debe tener la query?"
- "Guarda la imagen capturada como archivo permanente con `expo-file-system` (copiar de cache a
  `documentDirectory`) y borra el archivo al eliminar la foto."
- "Cómo mantener una **demo web estática** (`npx expo export --platform web`) sin que `expo-sqlite`
  rompa el bundle: `expo-sqlite` importa el WASM `wa-sqlite` solo para web."
- "Con `experiments.typedRoutes`, ¿a qué error TS2345 lleva `router.push(\`/foto/${id}\`)` con una
  ruta dinámica y cuál es la forma tipada correcta?"
- "Construye la query de la galería con filtros reactivos: búsqueda por texto de `note` con
  `like()`, álbum (`eq`/`isNull`) y favoritas, combinándolos con `and()` en Drizzle; usa los mismos
  filtros en la capa web (IndexedDB)."
- "¿Cómo implemento la capa web con `useSyncExternalStore` sobre un store de IndexedDB para que las
  mutaciones re-rendericen los mismos hooks que en nativo, además del bundle que SQLite? (dos `.web.ts`)."
- "Nombre de álbum único: define una validación con query `LOWER(name)` en el hook y un índice único en
  la migración Drizzle; comprueba qué genera `drizzle-kit generate` para no romper datos existentes."
- "API de `expo-file-system` SDK 57 para listar el directorio de fotos y borrar archivos huérfanos
  comparándolos con los `id` vivos de SQLite (`Directory.list()`)."

## 2. Código generado frente al código modificado

- **Generado por la IA:** `useLiveQuery` con una query devuelta desde función (`select().from(p)`
  cada render). **Modificado:** los builders de los repositorios se crean **una sola vez** y en
  perezoso (singleton a nivel de módulo), porque `useLiveQuery` requiere que la query sea
  estable entre renders (`Pick<AnySQLiteSelect, "_" | "then">`).
- **Generado por la IA:** guardar la imagen como **BLOB** en la columna `uri`. **Modificado:** la
  columna `uri` guarda la ruta de un **archivo permanente** en `documentDirectory/fotos/` gestionado
  por `src/services/photoFiles.ts` (copia desde cache/gallery, borrado al eliminar), evitando inchar
  la base de datos.
- **Generado por la IA:** migración `ALTER TABLE` con FK simple (sin `ON DELETE`). **Modificado:**
  se declaró `onDelete: 'set null'` en `schema.ts` y, como drizzle-kit no re-emite la cláusula en el
  `ALTER`, el repositorio de álbumes pone `album_id = NULL` **antes** de borrar el álbum
  (`clearAlbumFromPhotos`), con `PRAGMA foreign_keys = ON` como red de seguridad.
- **Generado por la IA:** provider que en modo "loading" de la DB no mostraba la splash. **Modificado:**
  `DatabaseGate` en `_layout.tsx` mantiene `SplashScreen.preventAutoHideAsync()` y solo monta la app
  hasta que `migrate()` + seed terminan; en web se salta por completo (`bootstrap.web.ts`).
- **Generado por la IA (fase final):** contexto que filtrara las fotos "en memoria" para la galería.
  **Modificado:** se eliminó el `GeoPhotosContext` y la vista usa los *hooks* `usePhotos(filter)`
  con una query Drizzle construida con `and/like/eq/isNull` en `useMemo`, de modo que el filtrado lo
  hace SQLite (`SQL` con `like(photos.note, '%…%')` vía parámetro enlazado, sin concatenar texto).
- **Generado por la IA (fase final):** `useLiveQuery` con `filter` completo en el array de deps, lo
  que daba un warning `exhaustive-deps`; además `usePhotos` dependía del objeto `filter` (nueva
  referencia cada render). **Modificado:** se desestructuran primitivas
  `{ search, albumId, favoritesOnly }` y el `useMemo` depende de ellas, igual en `.web.ts`.
- **Generado por la IA (fase final):** web nativa con SQLite WASM o "en memoria". **Modificado:**
  `src/db/webStore.ts` persiste en **IndexedDB** (almacén KV de metadatos + almacén de blobs con
  `URL.createObjectURL`/`revokeObjectURL`, seed `Paseos/Playa/Ciudad`) y `usePhotos.web` /
  `useAlbums.web` usan `useSyncExternalStore` con el mismo snapshot inicial (identidad) para no romper
  el render estático.

## 3. Al menos una corrección realizada

- **Error TS2345 al navegar a la ficha.** `router.push(\`/foto/${id}\`)` no tipa con
  `experiments.typedRoutes`: la ruta dinámica `foto/[id]` solo se admite en forma de objeto
  `{ pathname: '/foto/[id]', params: { id } }`. **Corrección:** reemplazado en
  `geocam.tsx`, `mapa.tsx`, `mapa.web.tsx`, `PhotoDetailModal(.web).tsx` (7 sitios) por el objeto
  tipado y, además, hubo que **regenerar** `.expo/types/router.d.ts` con `npx expo export` para que
  la nueva ruta `foto/[id]` y el grupo `(app)` entraran en el tipo `Href`.
- **`setState` síncrono en `useEffect` (React Compiler).** La ficha leía `photo.note` dentro de un
  `useEffect` para inicializar el campo de nota, lo que el linter `react-hooks/set-state-in-effect`
  rechaza. **Corrección:** extraer un componente `NoteEditor` con `useState(initialNote)` y montarlo
  con `key={photo.id}`, eliminando el efecto por completo. Ver `src/app/foto/[id].tsx:20-48`.
- **Bundle web roto por SQLite.** `npx expo export --platform web` fallaba importando
  `expo-sqlite/web/worker.ts` → `wa-sqlite.wasm` (cadena arrastrada por el `import()` dinámico de
  `db/bootstrap`). **Corrección:** `src/db/bootstrap.web.ts` como stub vacío; Metro resuelve la
  variante `.web.ts` antes de llegar a `expo-sqlite`, y la web usa `webStore.ts` (IndexedDB) +
  `photoFiles.web.ts` (no-op). La persistencia web no usa SQLite.
- **`useLiveQuery` sin re-render al cambiar filtros.** El query se reconstruía con `filter` completo y
  `useMemo` dependía de campos del objeto, generando warning de `exhaustive-deps`. **Corrección:**
  desestructurar primitivas y depender de ellas (`usePhotos.ts` y `usePhotos.web.ts`). `npm run lint`
  pasó a 0 avisos.
- **`usePhotos.web` con snapshot "distinto" en la hidratación.** La constante `EMPTY` local del hook
  difería por referencia del estado inicial del store. **Corrección:** exportar `EMPTY_SNAPSHOT` desde
  `webStore.ts` y usar el mismo `getSnapshot` como `getServerSnapshot` (referencia idéntica, seguro
  para SSR/exportación estática).
- **`router.push('/')` no tipa con typedRoutes cuando la raíz vive en `(app)/index.tsx`.** El union
  `Href` expone `` `${'/(app)'}/index` | `/index` ``, no `/`. **Corrección:** `href="/index"` en el
  `TabTrigger` web (`app-tabs.web.tsx`).
- **`Promise<Album>` ≠ `Promise<void>` en el modal de álbumes.** El `AlbumManagerModal` tipaba
  `onCreate: (name) => Promise<void>` y `createAlbum` devuelve `Promise<Album>`. **Corrección:**
  envolver en `(name) => createAlbum(name).then(() => undefined)` en `galeria.tsx`.

## 4. APIs obsoletas o alucinaciones detectadas

- `drizzle-orm@1.0` / `drizzle-kit@1.0` marcados **`@rc`** (candidatos a release) → inestables para
  una entrega. Se instalaron las **estables** `drizzle-orm@0.45.4` y `drizzle-kit@0.31.11`.
- `drizzle-kit` con dialecto SQLite + driver **`expo`** (no `better-sqlite3`): el esquema se genera
  con `dialect: 'sqlite', driver: 'expo'` y `out: './drizzle'`; los ficheros SQL se importan en el
  bundle gracias a `babel-plugin-inline-import` (extensión `.sql`) y `sourceExts: ['sql']` en Metro.
- `useLiveQuery` NO es `useLiveQuery(fn, deps)` de `drizzle-orm/expo-sqlite` v1: en 0.45.x recibe la
  **query** (`select()...`) ya construida; si se le pasa una ref no estable se queda sin actualizaciones.
- `expo-sqlite` en web necesita un **worker WASM** (`wa-sqlite`); en una exportación estática conviene
  **no importarlo** (ver sección 3) porque Metro no empaqueta el `.wasm` como asset por defecto.
- `Camera` → `CameraView` / `mediaTypes: ImagePicker.MediaTypeOptions.Images` → `['images']`
  (detectados en la Semana 6, ya corregidos).
- `Directory.list()` de `expo-file-system` (SDK 57) **NO devuelve una promesa**: es **síncrono**
  (`list(): (Directory | File)[]`). La limpieza de huérfanos no requiere `await`.
- `useSyncExternalStore` en la **exportación estática** exige que `getServerSnapshot()` devuelva
  exactamente la misma referencia que el primer `getSnapshot()`; un literal nuevo provoca aviso de
  hidratación. Solución: snapshot vacío compartido (`EMPTY_SNAPSHOT`).
- Con la raíz en `(app)/index.tsx`, typedRoutes expone `/index` (no `/`); `router.push('/')` no pasa
  el typecheck. Usar `href="/index"`.
- `drizzle-kit generate` para el índice único produjo SOLO `CREATE UNIQUE INDEX albums_name_unique`
  — no re-creó la tabla `photos` pese a tener FK; la migración `0002` es segura y no destructiva.
- El requerimiento de "id autoincremental entero" se dejó como **UUID en `TEXT`** (los registros ya
  existían con esa forma); se documenta como desviación técnica en el informe de la Semana 7 en vez de
  hacer una migración destructiva.

## 5. Explicación del error y su corrección

**Error elegido: TS2345 con rutas dinámicas y `experiments.typedRoutes`.**

- **Qué proponía la IA (y qué escribí):** `router.push(\`/foto/${photo.id}\`)`. La plantilla infiere
  `` `/foto/${string}` ``, pero el tipo `Href` de Expo Router para una ruta dinamia exige la forma
  de **objeto** `{ pathname, params }` porque `/foto/[id]` es un patrón con parámetro, no un literal.
- **Por qué falla:** el union generado en `.expo/types/router.d.ts` contiene `/foto/[id]` (patrón);
  `` `/foto/${string}` `` no es asignable a un literal, así que el compilador lo rechaza. Además, si
  la ruta se crea después de la última generación de tipado, la entrada ni siquiera existe.
- **Cómo lo corregí:** sustituir las 7 llamadas por
  `router.push({ pathname: '/foto/[id]', params: { id: photo.id } })` y regenerar los tipos con
  `npx expo export --platform web` (que escribe `.expo/types/router.d.ts`) para incorporar el grupo
  `(app)` y el nuevo `foto/[id]`. `npx tsc --noEmit` quedó en 0 errores.

## 6. Pruebas realizadas y resultados

Ejecutadas en esta máquina (comandos reales, no inventados):

| Prueba | Comando | Resultado |
| --- | --- | --- |
| Typecheck sin errores | `npx tsc --noEmit` | ✅ sin salida (0 errores) |
| Lint sin errores ni avisos | `npx expo lint` | ✅ sin salida |
| Bundle web + rutas estáticas + typedRoutes | `npx expo export --platform web` | ✅ 11 rutas exportadas (`/`, `/geocam`, `/galeria`, `/mapa`, `/foto/[id]`, `/(app)/…`, `/_sitemap`, `+not-found`), sin errores de WASM |
| Bundle android (módulos nativos con SQLite) | `npx expo export --platform android` | ✅ bundle `.hbc` 4.4 MB generado sin errores |
| Versiones compatibles con el SDK | `npx expo install --check` | ✅ "Dependencies are up to date" |
| Diagnóstico de dependencias | `npx expo-doctor` | ✅ 21/21 checks |

**Pendientes (requieren teléfono físico o navegador y no se han ejecutado todavía):** pruebas de
comportamiento 1–11 y 13–23 de la sección 9 del README (cámara real, GPS, galería, mapa, sacudida,
**persistencia** tras reiniciar Expo Go, **búsqueda/filtros/álbumes** en la Galería y prueba web 23 de
IndexedDB en el navegador). Las capturas/GIF de `docs/*` también están pendientes.