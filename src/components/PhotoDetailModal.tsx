import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Image, Modal, Pressable, ScrollView, Text, View } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import * as Location from 'expo-location';

import type { GeoPhoto } from '@/types/geo';

interface Props {
  photo: GeoPhoto | null;
  onClose: () => void;
}

interface PlaceState {
  id: string;
  label: string | null;
}

const DATE_FORMATTER = new Intl.DateTimeFormat('es-ES', {
  dateStyle: 'medium',
  timeStyle: 'short',
});

export function PhotoDetailModal({ photo, onClose }: Props) {
  const [place, setPlace] = useState<PlaceState | null>(null);
  const coords = photo?.coords ?? null;

  // Geocodificación inversa: convierte lat/lon en una dirección legible.
  useEffect(() => {
    if (!photo?.coords) return;

    let cancelled = false;
    const { latitude, longitude } = photo.coords;

    Location.reverseGeocodeAsync({ latitude, longitude })
      .then((results) => {
        if (cancelled) return;
        const a = results[0];
        const label = a
          ? [a.street, a.streetNumber, a.city, a.region, a.country].filter(Boolean).join(', ')
          : '';
        setPlace({ id: photo.id, label: label || null });
      })
      .catch(() => {
        if (!cancelled) setPlace({ id: photo.id, label: null });
      });

    return () => {
      cancelled = true;
    };
  }, [photo]);

  const resolved = photo && place?.id === photo.id ? place : null;
  const searching = Boolean(coords) && !resolved;

  return (
    <Modal visible={photo !== null} animationType="slide" onRequestClose={onClose}>
      {photo && (
        <View className="flex-1 bg-black">
          <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
            <Image
              source={{ uri: photo.uri }}
              resizeMode="contain"
              className="w-full bg-neutral-900"
              style={{ aspectRatio: 3 / 4 }}
            />

            {coords ? (
              <>
                <View className="h-48 w-full">
                  <MapView
                    style={{ flex: 1 }}
                    pointerEvents="none"
                    initialRegion={{
                      latitude: coords.latitude,
                      longitude: coords.longitude,
                      latitudeDelta: 0.005,
                      longitudeDelta: 0.005,
                    }}>
                    <Marker
                      coordinate={{ latitude: coords.latitude, longitude: coords.longitude }}
                    />
                  </MapView>
                </View>

                <View className="gap-1 p-4">
                  <Text className="text-base font-semibold text-white">Lugar donde se tomó</Text>
                  <Text className="text-sm text-emerald-300">
                    {searching
                      ? 'Buscando dirección…'
                      : (resolved?.label ?? 'Dirección no disponible')}
                  </Text>
                  <Text className="font-mono text-xs text-neutral-400">
                    {coords.latitude.toFixed(5)}, {coords.longitude.toFixed(5)} · ±
                    {Math.round(coords.accuracy ?? 0)} m
                  </Text>
                </View>
              </>
            ) : (
              <View className="gap-1 p-4">
                <Text className="text-base font-semibold text-white">Sin ubicación</Text>
                <Text className="text-sm text-neutral-400">
                  Esta foto ({photo.source === 'gallery' ? 'galería' : 'cámara'}) no tiene
                  coordenadas porque el permiso de ubicación estaba desactivado.
                </Text>
              </View>
            )}

            <Text className="px-4 text-xs text-neutral-500">
              {photo.source === 'gallery' ? 'Importada de la galería' : 'Tomada con la cámara'} ·{' '}
              {DATE_FORMATTER.format(new Date(photo.createdAt))}
            </Text>

            <Pressable
              onPress={() => {
                onClose();
                router.push({ pathname: '/foto/[id]', params: { id: photo.id } });
              }}
              className="mx-4 mt-3 self-start rounded-full bg-emerald-500 px-5 py-2 active:opacity-80"
              accessibilityRole="button"
              accessibilityLabel="Abrir ficha completa">
              <Text className="font-semibold text-neutral-950">Abrir ficha completa →</Text>
            </Pressable>
          </ScrollView>

          <Pressable
            onPress={onClose}
            className="absolute right-4 top-12 h-10 w-10 items-center justify-center rounded-full bg-black/70 active:opacity-70"
            accessibilityRole="button"
            accessibilityLabel="Cerrar">
            <Text className="text-lg font-bold text-white">✕</Text>
          </Pressable>
        </View>
      )}
    </Modal>
  );
}
