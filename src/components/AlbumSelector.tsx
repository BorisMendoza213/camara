import { Pressable, Text, View } from 'react-native';

import type { Album } from '@/types/geo';

interface Props {
  albums: Album[];
  selectedId: string | null;
  onSelect: (albumId: string | null) => void;
}

/**
 * Selector de álbum: "Sin álbum" + los álbumes existentes. Se usa en la ficha
 * de foto (asignar, cambiar, quitar) y hereda el estilo de chips de GeoCam.
 */
export function AlbumSelector({ albums, selectedId, onSelect }: Props) {
  return (
    <View className="flex-row flex-wrap gap-2">
      <Pressable
        onPress={() => onSelect(null)}
        className={`rounded-full px-4 py-2 active:opacity-80 ${
          selectedId === null ? 'bg-emerald-500' : 'bg-neutral-900'
        }`}
        accessibilityRole="button">
        <Text
          className={`text-sm ${
            selectedId === null ? 'font-semibold text-neutral-950' : 'text-neutral-300'
          }`}>
          Sin álbum
        </Text>
      </Pressable>
      {albums.map((album) => {
        const isActive = album.id === selectedId;
        return (
          <Pressable
            key={album.id}
            onPress={() => onSelect(album.id)}
            className={`rounded-full px-4 py-2 active:opacity-80 ${
              isActive ? 'bg-emerald-500' : 'bg-neutral-900'
            }`}
            accessibilityRole="button">
            <Text
              className={`text-sm ${
                isActive ? 'font-semibold text-neutral-950' : 'text-neutral-300'
              }`}>
              {isActive ? '✓ ' : ''}
              {album.name}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}