import { router } from 'expo-router';
import { Pressable, ScrollView, Text, View } from 'react-native';

const SECTIONS = [
  {
    key: 'geocam',
    icon: '📷',
    title: 'Cámara',
    description: 'Toma y importa fotos con su ubicación GPS.',
    route: '/geocam' as const,
    accent: 'bg-emerald-500',
  },
  {
    key: 'galeria',
    icon: '🖼️',
    title: 'Galería',
    description: 'Busca, filtra y organiza tus fotos en álbumes.',
    route: '/galeria' as const,
    accent: 'bg-blue-500',
  },
  {
    key: 'mapa',
    icon: '🗺️',
    title: 'Mapa',
    description: 'Consulta las fotos sobre su posición real.',
    route: '/mapa' as const,
    accent: 'bg-amber-500',
  },
];

export default function InicioScreen() {
  return (
    <ScrollView
      className="flex-1 bg-neutral-950"
      contentContainerStyle={{ padding: 20, gap: 12 }}>
      <View className="mb-4 items-center pt-6">
        <Text className="text-5xl">📍</Text>
        <Text className="mt-2 text-3xl font-bold text-white">GeoCam</Text>
        <Text className="mt-1 text-center text-sm text-neutral-400">
          Tus fotos, tus coordenadas. Todo guardado en tu dispositivo, sin conexión.
        </Text>
      </View>

      {SECTIONS.map((section) => (
        <Pressable
          key={section.key}
          onPress={() => router.push(section.route)}
          className="flex-row items-center gap-4 rounded-2xl bg-neutral-900 p-5 active:opacity-80"
          accessibilityRole="button">
          <View className={`h-14 w-14 items-center justify-center rounded-xl ${section.accent}`}>
            <Text className="text-3xl">{section.icon}</Text>
          </View>
          <View className="flex-1">
            <Text className="text-lg font-bold text-white">{section.title}</Text>
            <Text className="mt-0.5 text-sm text-neutral-400">{section.description}</Text>
          </View>
          <Text className="text-xl text-neutral-600">›</Text>
        </Pressable>
      ))}

      <Text className="mt-4 text-center text-xs text-neutral-600">
        GeoCam · Semana 7 · Fotos persistentes en SQLite
      </Text>
    </ScrollView>
  );
}