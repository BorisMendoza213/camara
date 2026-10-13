import { useLocalSearchParams, router } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  Alert,
  Image,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';

import { AlbumSelector } from '@/components/AlbumSelector';
import { AlbumNameError } from '@/db/errors';
import { useAlbums } from '@/hooks/useAlbums';
import { usePhotos } from '@/hooks/usePhotos';

const DATE_FORMATTER = new Intl.DateTimeFormat('es-ES', {
  dateStyle: 'medium',
  timeStyle: 'short',
});

function NoteEditor({
  initialNote,
  onSave,
}: {
  initialNote: string;
  onSave: (note: string) => Promise<void>;
}) {
  const [note, setNote] = useState(initialNote);
  const [savedNote, setSavedNote] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = useCallback(async () => {
    setError(null);
    try {
      await onSave(note);
      setSavedNote(true);
      setTimeout(() => setSavedNote(false), 1200);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo guardar la nota.');
    }
  }, [note, onSave]);

  return (
    <View className="gap-2">
      <Text className="text-sm font-semibold text-white">Nota</Text>
      <TextInput
        value={note}
        onChangeText={setNote}
        placeholder="Escribe algo sobre este lugar…"
        placeholderTextColor="#525252"
        multiline
        className="min-h-[88px] rounded-xl bg-neutral-900 p-3 text-left text-white"
      />
      {error && <Text className="text-xs text-red-400">{error}</Text>}
      <Pressable
        onPress={() => void handleSave()}
        className="self-start rounded-full bg-emerald-500 px-5 py-2 active:opacity-80"
        accessibilityRole="button">
        <Text className="font-semibold text-neutral-950">
          {savedNote ? 'Nota guardada ✓' : 'Guardar nota'}
        </Text>
      </Pressable>
    </View>
  );
}

export default function FotoDetailScreen() {
  const params = useLocalSearchParams<{ id: string }>();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;

  const { photos, error: photosError, updateNote, toggleFavorite, setAlbum, removePhoto } =
    usePhotos();
  const { albums, error: albumsError, createAlbum } = useAlbums();
  const dbError = photosError ?? albumsError;

  const photo = photos.find((p) => p.id === id);

  const [newAlbumName, setNewAlbumName] = useState('');
  const [albumError, setAlbumError] = useState<string | null>(null);

  const handleSaveNote = useCallback(
    async (value: string) => {
      const trimmed = value.trim();
      await updateNote(id, trimmed === '' ? null : trimmed);
    },
    [id, updateNote],
  );

  const handleCreateAndAssign = useCallback(async () => {
    setAlbumError(null);
    const name = newAlbumName.trim();
    if (!name) {
      setAlbumError('Escribe un nombre para el álbum.');
      return;
    }
    try {
      const album = await createAlbum(name);
      await setAlbum(id, album.id);
      setNewAlbumName('');
    } catch (e) {
      if (e instanceof AlbumNameError) {
        setAlbumError(e.message);
      } else {
        setAlbumError('No se pudo crear el álbum. Intenta de nuevo.');
      }
    }
  }, [createAlbum, id, newAlbumName, setAlbum]);

  const handleDelete = useCallback(() => {
    if (!photo) return;
    Alert.alert(
      '¿Eliminar foto?',
      'Se borrará la foto, su nota y sus datos; también se eliminará el archivo de la imagen.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: () => {
            void removePhoto(photo.id)
              .then(() => router.back())
              .catch(() => Alert.alert('No se pudo eliminar', 'Revisa los errores e inténtalo de nuevo.'));
          },
        },
      ],
    );
  }, [photo, removePhoto]);

  if (!photo) {
    return (
      <View className="flex-1 items-center justify-center gap-4 bg-neutral-950 p-8">
        <Text className="text-center text-lg font-bold text-white">Foto no encontrada</Text>
        <Pressable
          onPress={() => router.back()}
          className="rounded-full bg-emerald-500 px-5 py-2 active:opacity-80">
          <Text className="font-semibold text-neutral-950">Volver</Text>
        </Pressable>
      </View>
    );
  }

  const activeAlbum = albums.find((a) => a.id === photo.albumId);

  return (
    <View className="flex-1 bg-neutral-950">
      <ScrollView contentContainerStyle={{ paddingBottom: 48 }}>
        <Image
          source={{ uri: photo.uri }}
          resizeMode="contain"
          className="w-full bg-black"
          style={{ aspectRatio: 3 / 4 }}
        />

        <View className="gap-4 p-4">
          <Text className="text-xs text-neutral-500">
            {photo.source === 'gallery' ? 'Importada de la galería' : 'Tomada con la cámara'} ·{' '}
            {DATE_FORMATTER.format(new Date(photo.createdAt))}
          </Text>

          {/* Favorito */}
          <Pressable
            onPress={() => void toggleFavorite(photo.id)}
            className={`flex-row items-center justify-between rounded-xl p-3 active:opacity-80 ${
              photo.favorite ? 'bg-amber-500/20' : 'bg-neutral-900'
            }`}
            accessibilityRole="button"
            accessibilityLabel={photo.favorite ? 'Quitar de favoritos' : 'Marcar como favorita'}>
            <Text className={`font-semibold ${photo.favorite ? 'text-amber-300' : 'text-white'}`}>
              {photo.favorite ? '★ Favorita' : '☆ Marcar como favorita'}
            </Text>
            <Text className={`text-xl ${photo.favorite ? '' : 'opacity-40'}`}>
              {photo.favorite ? '★' : '☆'}
            </Text>
          </Pressable>

          {/* Nota */}
          <NoteEditor key={photo.id} initialNote={photo.note ?? ''} onSave={handleSaveNote} />

          {/* Álbum */}
          <View className="gap-2">
            <Text className="text-sm font-semibold text-white">Álbum</Text>
            <AlbumSelector
              albums={albums}
              selectedId={photo.albumId}
              onSelect={(albumId) => void setAlbum(photo.id, albumId)}
            />
            {activeAlbum && (
              <Text className="text-xs text-neutral-500">
                En «{activeAlbum.name}» · toca el nombre para quitar la foto del álbum.
              </Text>
            )}
            {albumError && <Text className="text-xs text-red-400">{albumError}</Text>}

            <View className="mt-2 flex-row items-center gap-2">
              <TextInput
                value={newAlbumName}
                onChangeText={setNewAlbumName}
                placeholder="Nuevo álbum…"
                placeholderTextColor="#525252"
                className="flex-1 rounded-xl bg-neutral-900 p-3 text-white"
              />
              <Pressable
                onPress={() => void handleCreateAndAssign()}
                disabled={newAlbumName.trim().length === 0}
                className="rounded-xl bg-neutral-800 px-4 py-3 active:opacity-80"
                accessibilityRole="button">
                <Text className="font-semibold text-white">Crear</Text>
              </Pressable>
            </View>
          </View>

          {/* Coordenadas */}
          <View className="gap-1 rounded-xl bg-neutral-900 p-3">
            <Text className="text-sm font-semibold text-white">Ubicación</Text>
            {photo.coords ? (
              <>
                <Text className="font-mono text-xs text-emerald-300">
                  {photo.coords.latitude.toFixed(5)}, {photo.coords.longitude.toFixed(5)}
                </Text>
                {photo.coords.accuracy !== null && (
                  <Text className="text-xs text-neutral-400">
                    Precisión GPS: ±{Math.round(photo.coords.accuracy)} m
                  </Text>
                )}
              </>
            ) : (
              <Text className="text-xs text-neutral-400">
                Sin coordenadas (permiso de ubicación desactivado al capturar).
              </Text>
            )}
          </View>

          {dbError && (
            <Text className="text-xs text-red-400">Error de base de datos: {dbError.message}</Text>
          )}
        </View>
      </ScrollView>

      {/* Barra superior */}
      <View className="absolute left-0 right-0 top-12 flex-row items-center justify-between px-4">
        <Pressable
          onPress={() => router.back()}
          className="h-10 w-10 items-center justify-center rounded-full bg-black/70 active:opacity-70"
          accessibilityRole="button"
          accessibilityLabel="Volver">
          <Text className="text-lg font-bold text-white">✕</Text>
        </Pressable>

        <Pressable
          onPress={handleDelete}
          className="h-10 items-center justify-center rounded-full bg-red-500/80 px-4 active:opacity-70"
          accessibilityRole="button"
          accessibilityLabel="Eliminar foto">
          <Text className="font-semibold text-white">🗑 Borrar</Text>
        </Pressable>
      </View>
    </View>
  );
}