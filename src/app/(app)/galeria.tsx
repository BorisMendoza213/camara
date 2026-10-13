import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';

import { AlbumManagerModal } from '@/components/AlbumManagerModal';
import { PhotoCard } from '@/components/PhotoCard';
import { useAlbums } from '@/hooks/useAlbums';
import { useGeoLocation } from '@/hooks/useGeoLocation';
import { usePhotos } from '@/hooks/usePhotos';
import type { GeoPhoto } from '@/types/geo';

type AlbumFilter = 'all' | 'none' | string;

export default function GaleriaScreen() {
  const { width } = useWindowDimensions();
  const columns = width >= 1064 ? 5 : width >= 760 ? 4 : width >= 500 ? 3 : 2;

  const [search, setSearch] = useState('');
  const [albumFilter, setAlbumFilter] = useState<AlbumFilter>('all');
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [albumsOpen, setAlbumsOpen] = useState(false);
  const [importing, setImporting] = useState(false);

  const geo = useGeoLocation({ watch: false });
  const { photos, error, addPhoto } = usePhotos({
    search,
    albumId: albumFilter,
    favoritesOnly,
  });
  const { albums, error: albumsError, createAlbum, renameAlbum, deleteAlbum } = useAlbums();

  const albumNameById = useMemo(() => {
    const map = new Map<string, string>();
    for (const album of albums) map.set(album.id, album.name);
    return map;
  }, [albums]);

  const clearFilters = useCallback(() => {
    setSearch('');
    setAlbumFilter('all');
    setFavoritesOnly(false);
  }, []);

  const openPhoto = useCallback((photo: GeoPhoto) => {
    router.push({ pathname: '/foto/[id]', params: { id: photo.id } });
  }, []);

  const handleImport = useCallback(async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.7,
    });
    if (result.canceled) return;

    let coords = null;
    if (geo.permission === 'granted') {
      coords = geo.coords ?? (await geo.getCurrent());
    }
    setImporting(true);
    try {
      const saved = await addPhoto({
        uri: result.assets[0].uri,
        coords,
        source: 'gallery',
      });
      if (!saved) {
        Alert.alert('No se pudo guardar', 'No se pudo importar la foto al almacenamiento local.');
      }
    } finally {
      setImporting(false);
    }
  }, [addPhoto, geo]);

  const hasDatabaseError = error !== null || albumsError !== null;
  const noPhotographs = photos.length === 0 && !search && albumFilter === 'all' && !favoritesOnly;
  const noMatches = photos.length === 0 && !noPhotographs;

  const emptyTitle = search
    ? `Sin resultados para «${search}»`
    : albumFilter !== 'all'
      ? 'No hay fotos en este álbum'
      : favoritesOnly
        ? 'Aún no marcas favoritas'
        : 'Aún no hay fotos';
  const emptyBody = search
    ? 'Prueba con otra palabra o revisa tus notas. Puedes quitar los filtros para ver todo.'
    : albumFilter !== 'all'
      ? 'Asigna fotos a este álbum desde su ficha, o cambia de filtro.'
      : favoritesOnly
        ? 'Toca el corazón ★ en la ficha de una foto para marcarla como favorita.'
        : 'Toma una foto con la cámara o importa una imagen: aparecerá aquí, guardada en tu dispositivo.';

  return (
    <View className="flex-1 bg-neutral-950">
      <FlatList
        data={photos}
        key={columns}
        numColumns={columns}
        columnWrapperStyle={{ gap: 10 }}
        contentContainerStyle={{ padding: 16, gap: 10, paddingBottom: 48 }}
        renderItem={({ item }) => (
          <View style={{ flex: 1 / columns, maxWidth: `${100 / columns}%` }}>
            <PhotoCard
              photo={item}
              albumName={albumNameById.get(item.albumId ?? '')}
              onPress={() => openPhoto(item)}
            />
          </View>
        )}
        ListHeaderComponent={
          <View className="gap-3">
            <View className="flex-row items-center justify-between">
              <View>
                <Text className="text-2xl font-bold text-white">Galería</Text>
                <Text className="text-xs text-neutral-500">
                  {photos.length} {photos.length === 1 ? 'foto' : 'fotos'}
                </Text>
              </View>
              <Pressable
                onPress={() => setAlbumsOpen(true)}
                className="rounded-full bg-neutral-800 px-4 py-2 active:opacity-80"
                accessibilityRole="button">
                <Text className="font-semibold text-white">Álbumes</Text>
              </Pressable>
            </View>

            {hasDatabaseError && (
              <Text className="text-xs text-red-400">
                Error de base de datos: {(error ?? albumsError)?.message}
              </Text>
            )}

            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder="🔍 Buscar por nota…"
              placeholderTextColor="#525252"
              className="rounded-xl bg-neutral-900 p-3 text-white"
            />

            <View className="flex-row flex-wrap items-center gap-2">
              <FilterChip
                label="Todas"
                active={albumFilter === 'all'}
                onPress={() => setAlbumFilter('all')}
              />
              <FilterChip
                label="Sin álbum"
                active={albumFilter === 'none'}
                onPress={() => setAlbumFilter('none')}
              />
              {albums.map((album) => (
                <FilterChip
                  key={album.id}
                  label={album.name}
                  active={albumFilter === album.id}
                  onPress={() => setAlbumFilter(album.id)}
                />
              ))}
              <FilterChip
                label="★ Favoritas"
                active={favoritesOnly}
                onPress={() => setFavoritesOnly((v) => !v)}
              />
              {(search || albumFilter !== 'all' || favoritesOnly) && (
                <Pressable onPress={clearFilters} accessibilityRole="button">
                  <Text className="px-1 text-xs font-semibold text-emerald-400">
                    Quitar filtros
                  </Text>
                </Pressable>
              )}
            </View>
          </View>
        }
        ListEmptyComponent={
          noPhotographs || noMatches ? (
            <View className="items-center gap-3 rounded-2xl bg-neutral-900 p-8">
              <Text className="text-center text-lg font-bold text-white">{emptyTitle}</Text>
              <Text className="text-center text-sm text-neutral-400">{emptyBody}</Text>
              {noPhotographs && (
                <View className="mt-2 flex-row flex-wrap items-center justify-center gap-2">
                  <Pressable
                    onPress={() => router.push('/geocam')}
                    className="rounded-full bg-emerald-500 px-5 py-2 active:opacity-80"
                    accessibilityRole="button">
                    <Text className="font-semibold text-neutral-950">Abrir Cámara</Text>
                  </Pressable>
                  <Pressable
                    onPress={() => void handleImport()}
                    disabled={importing}
                    className="rounded-full bg-neutral-800 px-5 py-2 active:opacity-80"
                    accessibilityRole="button">
                    <Text className="font-semibold text-white">
                      {importing ? 'Importando…' : 'Importar foto'}
                    </Text>
                  </Pressable>
                </View>
              )}
              {(noMatches && (search || albumFilter !== 'all' || favoritesOnly)) && (
                <Pressable
                  onPress={clearFilters}
                  className="rounded-full bg-neutral-800 px-5 py-2 active:opacity-80"
                  accessibilityRole="button">
                  <Text className="font-semibold text-white">Quitar filtros</Text>
                </Pressable>
              )}
            </View>
          ) : (
            <View className="items-center justify-center py-16">
              <ActivityIndicator size="large" color="#34d399" />
            </View>
          )
        }
      />

      <AlbumManagerModal
        visible={albumsOpen}
        albums={albums}
        onCreate={(name) => createAlbum(name).then(() => undefined)}
        onRename={renameAlbum}
        onDelete={deleteAlbum}
        onClose={() => setAlbumsOpen(false)}
      />
    </View>
  );
}

function FilterChip({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      className={`rounded-full px-3 py-1.5 active:opacity-80 ${
        active ? 'bg-emerald-500' : 'bg-neutral-900'
      }`}
      accessibilityRole="button">
      <Text className={`text-xs ${active ? 'font-semibold text-neutral-950' : 'text-neutral-300'}`}>
        {label}
      </Text>
    </Pressable>
  );
}