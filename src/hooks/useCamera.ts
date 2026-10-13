import { useCallback, useState, type RefObject } from 'react';
import { Linking } from 'react-native';
import { CameraView, useCameraPermissions, type CameraType } from 'expo-camera';

import type { PermissionState } from '@/types/geo';

export function useCamera(cameraRef: RefObject<CameraView | null>) {
  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = useState<CameraType>('back');
  const [isReady, setIsReady] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);

  const permissionState: PermissionState = !permission
    ? 'checking'
    : permission.granted
      ? 'granted'
      : !permission.canAskAgain
        ? 'blocked'
        : permission.status === 'undetermined'
          ? 'undetermined'
          : 'denied';

  const toggleFacing = useCallback(() => {
    setFacing((f) => (f === 'back' ? 'front' : 'back'));
  }, []);

  const onCameraReady = useCallback(() => {
    setIsReady(true);
  }, []);

  const takePhoto = useCallback(async () => {
    if (!cameraRef.current || !isReady || isCapturing) return null;
    setIsCapturing(true);
    try {
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.7 });
      return photo ?? null;
    } finally {
      setIsCapturing(false);
    }
  }, [cameraRef, isReady, isCapturing]);

  const openSettings = useCallback(() => {
    void Linking.openSettings();
  }, []);

  return {
    permissionState,
    requestPermission,
    openSettings,
    facing,
    toggleFacing,
    onCameraReady,
    takePhoto,
    isCapturing,
  };
}
