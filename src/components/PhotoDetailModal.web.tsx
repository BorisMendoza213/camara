import { router } from 'expo-router';
import { Image, Modal, Pressable, ScrollView, Text, View } from 'react-native';

import type { GeoPhoto } from '@/types/geo';

interface Props {
  photo: GeoPhoto | null;
  onClose: () => void;
}

const DATE_FORMATTER = new Intl.DateTimeFormat('es-ES', {
  dateStyle: 'medium',
  timeStyle: 'short',
});

export function PhotoDetailModal({ photo, onClose }: Props) {
  const coords = photo?.coords ?? null;

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
              <View className="gap-1 p-4">
                <Text className="text-base font-semibold text-white">Lugar donde se tomó</Text>
                <View className="h-40 w-full items-center justify-center rounded-xl bg-neutral-900 p-4">
                  <Text className="text-center text-xs text-neutral-400">
                    El mapa solo se muestra en iOS y Android.
                  </Text>
                </View>
                <Text className="font-mono text-xs text-emerald-300">
                  {coords.latitude.toFixed(5)}, {coords.longitude.toFixed(5)} · ±
                  {Math.round(coords.accuracy ?? 0)} m
                </Text>
              </View>
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
