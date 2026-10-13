import '@/global.css';

import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { ActivityIndicator, Platform, Pressable, Text, useColorScheme, View } from 'react-native';

import { AnimatedSplashOverlay } from '@/components/animated-icon';

SplashScreen.preventAutoHideAsync();

export const unstable_settings = {
  initialRouteName: '(app)',
};

function DatabaseGate({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>(
    Platform.OS === 'web' ? 'ready' : 'loading',
  );
  const [message, setMessage] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (Platform.OS === 'web') return;
    let cancelled = false;

    (async () => {
      try {
        // Import dinámico: en la web nunca se abre la base de datos SQLite.
        const { initDatabase } = await import('@/db/bootstrap');
        await initDatabase();
        if (!cancelled) setStatus('ready');
      } catch (e) {
        if (!cancelled) {
          setMessage(e instanceof Error ? e.message : 'Error desconocido');
          setStatus('error');
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [attempt]);

  const retry = useCallback(() => {
    setStatus('loading');
    setAttempt((n) => n + 1);
  }, []);

  if (status === 'error') {
    return (
      <View className="flex-1 items-center justify-center gap-3 bg-neutral-950 p-8">
        <Text className="text-center text-lg font-bold text-white">
          No se pudo preparar la base de datos
        </Text>
        <Text className="text-center text-sm text-red-400">{message}</Text>
        <Pressable
          onPress={retry}
          className="rounded-full bg-emerald-500 px-5 py-2 active:opacity-80"
          accessibilityRole="button">
          <Text className="font-semibold text-neutral-950">Reintentar</Text>
        </Pressable>
      </View>
    );
  }

  if (status === 'loading') {
    return (
      <View className="flex-1 items-center justify-center bg-neutral-950">
        <ActivityIndicator size="large" color="#34d399" />
        <Text className="mt-3 text-sm text-neutral-400">Preparando almacenamiento local…</Text>
      </View>
    );
  }

  return children;
}

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <DatabaseGate>
        <AnimatedSplashOverlay />
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(app)" />
          <Stack.Screen name="foto/[id]" />
        </Stack>
      </DatabaseGate>
    </ThemeProvider>
  );
}