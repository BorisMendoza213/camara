import { router } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { Alert, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { CameraView } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';

import { PermissionPrimer } from '@/components/PermissionPrimer';
import { PhotoDetailModal } from '@/components/PhotoDetailModal';
import { useCamera } from '@/hooks/useCamera';
import { useGeoLocation } from '@/hooks/useGeoLocation';
import { usePhotos } from '@/hooks/usePhotos';
import { useShake } from '@/hooks/useShake';
import type { GeoPhoto } from '@/types/geo';

export default function GeoCamScreen() {
  const cameraRef = useRef<CameraView>(null);
  const cam = useCamera(cameraRef);
  const geo = useGeoLocation({ watch: true });
  const { photos, addPhoto, clearAll } = usePhotos();
  const [detail, setDetail] = useState<GeoPhoto | null>(null);
  const [saving, setSaving] = useState(false);

  const handleShake = useCallback(() => {
    Alert.alert('¿Borrar todas las fotos?', 'Se eliminarán todas las fotos guardadas.', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Borrar', style: 'destructive', onPress: () => void clearAll() },
    ]);
  }, [clearAll]);

  useShake(handleShake);

  if (cam.permissionState === 'checking') {
    return <View className="flex-1 bg-neutral-950" />;
  }

  if (cam.permissionState !== 'granted') {
    return (
      <PermissionPrimer
        title="GeoCam necesita tu cámara"
        description="La usamos solo para tomar fotos que tú decidas guardar."
        state={cam.permissionState}
        onRequest={cam.requestPermission}
        onOpenSettings={cam.openSettings}
      />
    );
  }

  const resolveCoords = async () =>
    geo.permission === 'granted' ? (geo.coords ?? (await geo.getCurrent())) : null;

  const handleCapture = async () => {
    const photo = await cam.takePhoto();
    if (!photo) return;

    // Degradación elegante: sin permiso de ubicación, coords queda en null
    const coords = await resolveCoords();
    setSaving(true);
    try {
      const saved = await addPhoto({
        uri: photo.uri,
        coords,
        source: 'camera',
      });
      if (saved) {
        setDetail(saved);
      } else {
        Alert.alert('No se pudo guardar', 'La foto no se pudo guardar en el almacenamiento local.');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleImport = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.7,
    });
    if (result.canceled) return;

    const coords = await resolveCoords();
    const asset = result.assets[0];
    setSaving(true);
    try {
      const saved = await addPhoto({
        uri: asset.uri,
        coords,
        source: 'gallery',
      });
      if (saved) {
        setDetail(saved);
      }
    } finally {
      setSaving(false);
    }
  };

  const lastPhoto = photos[0];

  return (
    <View className="flex-1 bg-black">
      {/* CameraView sin hijos: los controles van como hermanos absolutos */}
      <CameraView
        ref={cameraRef}
        style={StyleSheet.absoluteFill}
        facing={cam.facing}
        onCameraReady={cam.onCameraReady}
      />

      {/* Banner de ubicación: pedir en contexto sin bloquear la cámara */}
      {geo.permission !== 'granted' && geo.permission !== 'checking' && (
        <Pressable
          onPress={geo.permission === 'blocked' ? geo.openSettings : geo.requestPermission}
          className="absolute left-4 right-4 top-14 rounded-xl bg-amber-400/90 p-3">
          <Text className="text-center font-medium text-neutral-900">
            Activa la ubicación para etiquetar tus fotos
          </Text>
        </Pressable>
      )}

      {/* Coordenadas en vivo */}
      {geo.coords && (
        <View className="absolute right-4 top-14 rounded-lg bg-black/60 px-3 py-2">
          <Text className="font-mono text-xs text-emerald-300">
            {geo.coords.latitude.toFixed(5)}, {geo.coords.longitude.toFixed(5)}
          </Text>
          <Text className="font-mono text-xs text-neutral-400">
            ±{Math.round(geo.coords.accuracy ?? 0)} m
          </Text>
        </View>
      )}

      {/* Miniatura de la última foto: tocar para ver su ficha completa */}
      {lastPhoto && (
        <Pressable
          onPress={() => router.push({ pathname: '/foto/[id]', params: { id: lastPhoto.id } })}
          className="absolute left-4 top-28 active:opacity-70"
          accessibilityRole="button"
          accessibilityLabel="Ver ficha de la última foto">
          <Image
            source={{ uri: lastPhoto.uri }}
            className="h-16 w-16 rounded-lg border-2 border-white"
          />
          <Text className="absolute bottom-0 left-0 right-0 rounded-b-lg bg-black/60 text-center text-[10px] text-white">
            {lastPhoto.source === 'gallery' ? 'Galería' : 'Cámara'}
          </Text>
          <Text className="absolute -right-1 -top-1 h-4 w-4 rounded-full bg-emerald-500 text-center text-[9px] text-neutral-950">
            📍
          </Text>
        </Pressable>
      )}

      {/* Controles inferiores */}
      <View className="absolute bottom-24 left-0 right-0 flex-row items-center justify-around">
        <Pressable
          onPress={handleImport}
          className="h-14 w-14 items-center justify-center rounded-full bg-neutral-800/80 active:opacity-70"
          accessibilityLabel="Importar de la galería">
          <Text className="text-2xl">🖼️</Text>
        </Pressable>

        <Pressable
          onPress={handleCapture}
          disabled={cam.isCapturing || saving}
          className="h-20 w-20 items-center justify-center rounded-full border-4 border-white active:opacity-70"
          accessibilityLabel="Tomar foto">
          <View
            className={`h-16 w-16 rounded-full ${
              cam.isCapturing || saving ? 'bg-neutral-400' : 'bg-white'
            }`}
          />
        </Pressable>

        <Pressable
          onPress={cam.toggleFacing}
          className="h-14 w-14 items-center justify-center"
          accessibilityLabel="Cambiar cámara">
          <Text className="text-3xl">↻</Text>
        </Pressable>
      </View>

      <PhotoDetailModal photo={detail} onClose={() => setDetail(null)} />
    </View>
  );
}
