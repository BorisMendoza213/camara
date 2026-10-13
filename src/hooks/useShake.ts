import { useEffect, useRef, useState } from 'react';
import { Accelerometer } from 'expo-sensors';

type AccelerometerSubscription = ReturnType<typeof Accelerometer.addListener>;

interface Options {
  threshold?: number;
  cooldownMs?: number;
}

export function useShake(
  onShake: () => void,
  options: Options = {},
): { isAvailable: boolean | null } {
  const { threshold = 1.8, cooldownMs = 1000 } = options;
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);
  const callbackRef = useRef(onShake);
  const lastShakeRef = useRef(0);

  // El callback vive en una ref para no reiniciar la suscripción en cada render.
  useEffect(() => {
    callbackRef.current = onShake;
  }, [onShake]);

  useEffect(() => {
    let cancelled = false;
    let subscription: AccelerometerSubscription | null = null;

    Accelerometer.isAvailableAsync()
      .then((available) => {
        if (cancelled) return;
        setIsAvailable(available);
        if (!available) return;

        Accelerometer.setUpdateInterval(100);
        subscription = Accelerometer.addListener(({ x, y, z }) => {
          const magnitude = Math.sqrt(x * x + y * y + z * z);
          const now = Date.now();
          if (magnitude > threshold && now - lastShakeRef.current > cooldownMs) {
            lastShakeRef.current = now;
            callbackRef.current();
          }
        });
      })
      .catch(() => {
        if (!cancelled) setIsAvailable(false);
      });

    return () => {
      cancelled = true;
      subscription?.remove();
    };
  }, [threshold, cooldownMs]);

  return { isAvailable };
}
