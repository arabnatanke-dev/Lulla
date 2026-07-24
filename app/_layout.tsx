import { Stack, router, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import 'react-native-reanimated';

import { MiniPlayer } from '@/src/components/mini-player';
import { palette } from '@/src/constants/theme';
import { AppProvider, useApp } from '@/src/context/app-context';
import { AudioProvider } from '@/src/context/audio-context';

export const unstable_settings = {
  anchor: '(tabs)',
};

/**
 * Управляет корневой навигацией и решает, нужно ли показать онбординг.
 * Пока настройки загружаются, отображает простой экран загрузки.
 */
function AppNavigation() {
  const { hydrated, onboardingComplete } = useApp();
  const segments = useSegments();

  // Перенаправляем нового пользователя в онбординг, а прошедшего — к основным вкладкам.
  useEffect(() => {
    if (!hydrated) return;
    const firstSegment = segments[0] as string | undefined;
    const inOnboarding = firstSegment === 'onboarding';

    if (!onboardingComplete && !inOnboarding) {
      router.replace('/onboarding');
    } else if (onboardingComplete && inOnboarding) {
      router.replace('/(tabs)');
    }
  }, [hydrated, onboardingComplete, segments]);

  if (!hydrated) {
    return (
      <View style={styles.loading}>
        <View style={styles.moon} />
        <ActivityIndicator color={palette.yellow} size="large" />
      </View>
    );
  }

  const current = segments[0] as string | undefined;
  const showMiniPlayer = !['onboarding', 'player'].includes(current ?? '');

  return (
    <View style={styles.root}>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: palette.cream },
          animation: 'slide_from_right',
        }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="onboarding" options={{ animation: 'fade' }} />
        <Stack.Screen name="story/[id]" />
        <Stack.Screen name="reader/[id]" />
        <Stack.Screen name="legal/[type]" />
        <Stack.Screen name="player" options={{ animation: 'slide_from_bottom' }} />
      </Stack>
      {showMiniPlayer ? <MiniPlayer /> : null}
      <StatusBar style={current === 'player' ? 'light' : 'dark'} />
    </View>
  );
}

/**
 * Подключает глобальные контексты настроек и аудио ко всему приложению.
 * Это самая верхняя точка React-дерева Dreamy Tales.
 */
export default function RootLayout() {
  return (
    <AppProvider>
      <AudioProvider>
        <AppNavigation />
      </AudioProvider>
    </AppProvider>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 28,
    backgroundColor: palette.navy,
  },
  moon: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: palette.yellow,
    shadowColor: palette.yellow,
    shadowOpacity: 0.3,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 0 },
  },
});
