import { router } from 'expo-router';
import { useState } from 'react';
import { FlatList, Image, Linking, Pressable, ScrollView, Text, View } from 'react-native';

import { usePhotos } from '@/hooks/usePhotos';
import type { Coords, GeoPhoto } from '@/types/geo';

type LocatedPhoto = GeoPhoto & { coords: Coords };

function embedUrl(coords: Coords) {
  const d = 0.005;
  const bbox = [
    coords.longitude - d,
    coords.latitude - d,
    coords.longitude + d,
    coords.latitude + d,
  ].join(',');
  return `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${coords.latitude},${coords.longitude}`;
}

function fullMapUrl(coords: Coords) {
  return `https://www.openstreetmap.org/?mlat=${coords.latitude}&mlon=${coords.longitude}#map=16/${coords.latitude}/${coords.longitude}`;
}

export default function MapaWebScreen() {
  const { photos } = usePhotos();
  const [activeId, setActiveId] = useState<string | null>(null);

  const located = photos.filter((p): p is LocatedPhoto => p.coords !== null);
  const unlocated = photos.filter((p) => p.coords === null);
  const active = located.find((p) => p.id === activeId) ?? located[0];

  return (
    <ScrollView className="flex-1 bg-black" contentContainerStyle={{ padding: 16, gap: 12 }}>
      <Text className="text-lg font-bold text-white">Mapa</Text>

      {photos.length === 0 && (
        <View className="items-center gap-2 rounded-xl bg-neutral-900 p-6">
          <Text className="text-center text-base font-semibold text-white">Aún no hay fotos</Text>
          <Text className="text-center text-xs text-neutral-400">
            Toma o importa fotos en la pestaña GeoCam y aparecerán aquí con sus coordenadas.
          </Text>
        </View>
      )}

      {active && (
        <View className="overflow-hidden rounded-xl border border-neutral-800">
          <iframe
            title="Mapa de la foto"
            src={embedUrl(active.coords)}
            style={{ width: '100%', height: 280, border: 0 }}
          />
          <Pressable
            onPress={() => void Linking.openURL(fullMapUrl(active.coords))}
            className="bg-neutral-900 p-3 active:opacity-80">
            <Text className="text-center text-xs font-semibold text-emerald-400">
              Abrir en OpenStreetMap ↗
            </Text>
          </Pressable>
        </View>
      )}

      {located.length > 0 && (
        <FlatList
          scrollEnabled={false}
          data={located}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <Pressable
              onPress={() => setActiveId(item.id)}
              className={`mb-3 flex-row items-center gap-3 rounded-xl p-3 active:opacity-80 ${
                item.id === active?.id ? 'bg-emerald-900/40' : 'bg-neutral-900'
              }`}>
              <Image source={{ uri: item.uri }} className="h-16 w-16 rounded-lg" />
              <Text className="flex-1 font-mono text-xs text-emerald-300">
                {item.coords.latitude.toFixed(5)}, {item.coords.longitude.toFixed(5)}
              </Text>
              <Pressable
                onPress={() => router.push({ pathname: '/foto/[id]', params: { id: item.id } })}
                className="rounded-full bg-black/40 px-3 py-1 active:opacity-70">
                <Text className="text-xs font-semibold text-white">Ver →</Text>
              </Pressable>
            </Pressable>
          )}
        />
      )}

      {unlocated.length > 0 && (
        <View>
          <Text className="mb-2 text-sm font-semibold text-white">
            Sin ubicación ({unlocated.length})
          </Text>
          {unlocated.map((photo) => (
            <Pressable
              key={photo.id}
              onPress={() => router.push({ pathname: '/foto/[id]', params: { id: photo.id } })}
              className="mb-3 flex-row items-center gap-3 rounded-xl bg-neutral-900 p-3 active:opacity-80">
              <Image source={{ uri: photo.uri }} className="h-16 w-16 rounded-lg" />
              <Text className="flex-1 text-xs text-neutral-400">
                {photo.source === 'gallery' ? 'Galería' : 'Cámara'}
              </Text>
            </Pressable>
          ))}
        </View>
      )}
    </ScrollView>
  );
}
