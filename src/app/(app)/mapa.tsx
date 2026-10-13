import { router } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import MapView, { Marker } from 'react-native-maps';

import { useGeoLocation } from '@/hooks/useGeoLocation';
import { usePhotos } from '@/hooks/usePhotos';
import type { Coords, GeoPhoto } from '@/types/geo';

type LocatedPhoto = GeoPhoto & { coords: Coords };

const DEFAULT_REGION = {
  latitude: 40.4168,
  longitude: -3.7038,
  latitudeDelta: 0.05,
  longitudeDelta: 0.05,
};

function toRegion(coords: Coords) {
  return {
    latitude: coords.latitude,
    longitude: coords.longitude,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  };
}

export default function MapaScreen() {
  const { photos } = usePhotos();
  const geo = useGeoLocation({ watch: true });
  const mapRef = useRef<MapView>(null);
  const hasCenteredRef = useRef(false);
  const [selected, setSelected] = useState<LocatedPhoto | null>(null);

  const located = useMemo(
    () => photos.filter((p): p is LocatedPhoto => p.coords !== null),
    [photos],
  );
  const unlocated = useMemo(() => photos.filter((p) => p.coords === null), [photos]);

  const initialRegion = useMemo(() => {
    const anchor = geo.coords ?? located[0]?.coords;
    return anchor ? toRegion(anchor) : DEFAULT_REGION;
    // Solo se calcula una vez: el mapa no debe recentrarse en cada render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Centrar una sola vez cuando llegue la ubicación (o si no, la última foto).
  useEffect(() => {
    const anchor = geo.coords ?? located[0]?.coords;
    if (!anchor || hasCenteredRef.current) return;
    hasCenteredRef.current = true;
    mapRef.current?.animateToRegion(toRegion(anchor), 500);
  }, [geo.coords, located]);

  return (
    <View className="flex-1 bg-black">
      <MapView ref={mapRef} style={styles.map} initialRegion={initialRegion}>
        {located.map((photo) => (
          <Marker
            key={photo.id}
            coordinate={{ latitude: photo.coords.latitude, longitude: photo.coords.longitude }}
            onPress={() => setSelected(photo)}
          />
        ))}
      </MapView>

      {/* Miniatura de la foto seleccionada */}
      {selected && (
        <Pressable
          onPress={() => router.push({ pathname: '/foto/[id]', params: { id: selected.id } })}
          className="absolute left-4 right-4 top-14 flex-row items-center gap-3 rounded-xl bg-black/80 p-3 active:opacity-80"
          accessibilityRole="button"
          accessibilityLabel="Abrir la ficha de la foto">
          <Image source={{ uri: selected.uri }} className="h-16 w-16 rounded-lg" />
          <View className="flex-1">
            <Text className="font-mono text-xs text-emerald-300">
              {selected.coords.latitude.toFixed(5)}, {selected.coords.longitude.toFixed(5)}
            </Text>
            <Text className="text-xs text-neutral-400">
              {selected.source === 'gallery' ? 'Galería' : 'Cámara'} · ±
              {Math.round(selected.coords.accuracy ?? 0)} m
            </Text>
            <Text className="mt-1 text-xs font-semibold text-white">Ver ficha →</Text>
          </View>
        </Pressable>
      )}

      {/* Fotos sin coordenadas */}
      {unlocated.length > 0 && (
        <View className="absolute bottom-24 left-0 right-0">
          <Text className="mb-2 px-4 text-sm font-semibold text-white">
            Sin ubicación ({unlocated.length})
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}>
            {unlocated.map((photo) => (
              <Pressable
                key={photo.id}
                onPress={() => router.push({ pathname: '/foto/[id]', params: { id: photo.id } })}
                className="h-16 w-16 overflow-hidden rounded-lg border-2 border-white/70 active:opacity-70"
                accessibilityRole="button"
                accessibilityLabel="Abrir la ficha de la foto">
                <Image source={{ uri: photo.uri }} className="h-full w-full" />
                <Text className="absolute bottom-0 left-0 right-0 bg-black/60 text-center text-[10px] text-white">
                  {photo.source === 'gallery' ? 'Galería' : 'Cámara'}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Estado vacío */}
      {photos.length === 0 && (
        <View
          className="absolute inset-0 items-center justify-center p-8"
          pointerEvents="none">
          <Text className="mb-2 text-center text-2xl font-bold text-white">Aún no hay fotos</Text>
          <Text className="text-center text-sm text-neutral-400">
            Ve a la pestaña GeoCam y toma o importa una foto. Las que tengan coordenadas aparecerán
            aquí como marcadores.
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  map: {
    flex: 1,
  },
});
