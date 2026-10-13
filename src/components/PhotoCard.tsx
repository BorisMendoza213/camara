import { Image, Pressable, Text, View } from 'react-native';

import type { GeoPhoto } from '@/types/geo';

const SHORT_DATE = new Intl.DateTimeFormat('es-ES', { day: '2-digit', month: 'short' });

interface Props {
  photo: GeoPhoto;
  albumName?: string | null;
  onPress: () => void;
}

export function PhotoCard({ photo, albumName, onPress }: Props) {
  const hasLocation = photo.coords !== null;

  return (
    <Pressable
      onPress={onPress}
      className="overflow-hidden rounded-xl bg-neutral-900 active:opacity-80"
      accessibilityRole="button"
      accessibilityLabel={photo.note ?? 'Foto geolocalizada'}>
      <View className="aspect-square w-full">
        <Image source={{ uri: photo.uri }} className="h-full w-full" resizeMode="cover" />
        <View className="absolute left-1 top-1 flex-row gap-1">
          <View className="rounded-md bg-black/60 px-1.5 py-0.5">
            <Text className="text-[10px] font-semibold text-white">
              {photo.source === 'gallery' ? 'Galería' : 'Cámara'}
            </Text>
          </View>
          {!hasLocation && (
            <View className="rounded-md bg-amber-500/80 px-1.5 py-0.5">
              <Text className="text-[10px] font-semibold text-neutral-950">sin GPS</Text>
            </View>
          )}
        </View>

        {photo.favorite && (
          <View className="absolute right-1 top-1 h-6 w-6 items-center justify-center rounded-full bg-amber-400">
            <Text className="text-sm text-neutral-950">★</Text>
          </View>
        )}
      </View>

      <View className="flex-row items-center justify-between gap-2 px-2 py-1.5">
        <Text className="flex-1 text-[11px] text-neutral-400">
          {SHORT_DATE.format(new Date(photo.createdAt))}
        </Text>
        <Text numberOfLines={1} className="flex-1 text-right text-[11px] font-semibold text-neutral-300">
          {albumName ?? (photo.albumId ? '…' : '')}
        </Text>
      </View>
    </Pressable>
  );
}