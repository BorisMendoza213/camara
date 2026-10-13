import { useState } from 'react';
import { Alert, Modal, Pressable, ScrollView, Text, TextInput, View } from 'react-native';

import type { Album } from '@/types/geo';

interface Props {
  visible: boolean;
  albums: Album[];
  onCreate: (name: string) => Promise<void>;
  onRename: (id: string, name: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onClose: () => void;
}

export function AlbumManagerModal({
  visible,
  albums,
  onCreate,
  onRename,
  onDelete,
  onClose,
}: Props) {
  const [newName, setNewName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [draftName, setDraftName] = useState('');

  const close = () => {
    setNewName('');
    setError(null);
    setRenamingId(null);
    onClose();
  };

  const handleCreate = async () => {
    setError(null);
    try {
      await onCreate(newName);
      setNewName('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo crear el álbum.');
    }
  };

  const handleRename = async (id: string) => {
    setError(null);
    try {
      await onRename(id, draftName);
      setRenamingId(null);
      setDraftName('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo renombrar el álbum.');
    }
  };

  const handleDelete = (album: Album) => {
    Alert.alert(
      `¿Eliminar «${album.name}»?`,
      'Las fotos del álbum se conservarán, pero quedarán sin álbum.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: () => void onDelete(album.id).catch(() => setError('No se pudo eliminar el álbum.')),
        },
      ],
    );
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={close}>
      <View className="flex-1 justify-end">
        <Pressable className="absolute inset-0 bg-black/60" onPress={close} />
        <View className="rounded-t-3xl bg-neutral-950 p-5 pb-8">
          <Text className="mb-4 text-center text-lg font-bold text-white">Álbumes</Text>

          <ScrollView className="max-h-[46vh]" contentContainerStyle={{ gap: 8 }}>
            {albums.map((album) =>
              renamingId === album.id ? (
                <View key={album.id} className="flex-row items-center gap-2">
                  <TextInput
                    value={draftName}
                    onChangeText={setDraftName}
                    autoFocus
                    placeholder="Nuevo nombre…"
                    placeholderTextColor="#525252"
                    className="flex-1 rounded-xl bg-neutral-900 p-3 text-white"
                  />
                  <Pressable
                    onPress={() => void handleRename(album.id)}
                    className="rounded-xl bg-emerald-500 px-3 py-3 active:opacity-80"
                    accessibilityRole="button">
                    <Text className="font-semibold text-neutral-950">OK</Text>
                  </Pressable>
                  <Pressable
                    onPress={() => setRenamingId(null)}
                    className="rounded-xl bg-neutral-800 px-3 py-3 active:opacity-80"
                    accessibilityRole="button">
                    <Text className="font-semibold text-white">✕</Text>
                  </Pressable>
                </View>
              ) : (
                <View
                  key={album.id}
                  className="flex-row items-center justify-between gap-2 rounded-xl bg-neutral-900 p-3">
                  <Text className="flex-1 font-semibold text-white">{album.name}</Text>
                  <Pressable
                    onPress={() => {
                      setRenamingId(album.id);
                      setDraftName(album.name);
                    }}
                    className="rounded-full bg-neutral-800 px-3 py-1.5 active:opacity-80"
                    accessibilityRole="button">
                    <Text className="text-xs font-semibold text-white">Renombrar</Text>
                  </Pressable>
                  <Pressable
                    onPress={() => handleDelete(album)}
                    className="rounded-full bg-red-500/80 px-3 py-1.5 active:opacity-80"
                    accessibilityRole="button">
                    <Text className="text-xs font-semibold text-white">Eliminar</Text>
                  </Pressable>
                </View>
              ),
            )}
          </ScrollView>

          {error && <Text className="mt-3 text-xs text-red-400">{error}</Text>}

          <View className="mt-4 flex-row items-center gap-2">
            <TextInput
              value={newName}
              onChangeText={setNewName}
              placeholder="Nuevo álbum…"
              placeholderTextColor="#525252"
              className="flex-1 rounded-xl bg-neutral-900 p-3 text-white"
            />
            <Pressable
              onPress={() => void handleCreate()}
              disabled={newName.trim().length === 0}
              className="rounded-xl bg-emerald-500 px-4 py-3 active:opacity-80"
              accessibilityRole="button">
              <Text className="font-semibold text-neutral-950">Crear</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}