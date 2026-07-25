import { Stack, router, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import 'react-native-reanimated';

import { MiniPlayer } from '@/src/components/mini-player';
import type { ThemeColors } from '@/src/constants/theme';
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
  const { onboardingComplete, colors: palette, isDark } = useApp();
  const segments = useSegments();
  const styles = createStyles(palette);

  // Перенаправляем нового пользователя в онбординг, а прошедшего — к основным вкладкам.
  useEffect(() => {
    const firstSegment = segments[0] as string | undefined;
    const inOnboarding = firstSegment === 'onboarding';

    if (!onboardingComplete && !inOnboarding) {
      router.replace('/onboarding');
    } else if (onboardingComplete && inOnboarding) {
      router.replace('/(tabs)');
    }
  }, [onboardingComplete, segments]);

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
      <StatusBar style={current === 'player' || isDark ? 'light' : 'dark'} />
    </View>
  );
}

/**
 * Показывает лёгкую заставку, пока локальные настройки ещё не прочитаны.
 */
function LoadingScreen() {
  const { colors: palette } = useApp();
  const styles = createStyles(palette);

  return (
    <View style={styles.loading}>
      <View style={styles.loadingMark} />
      <ActivityIndicator color={palette.yellow} size="large" />
    </View>
  );
}

/**
 * Создаёт аудиоплеер только после загрузки настроек.
 * Это уменьшает нагрузку на первый запуск Android и не блокирует онбординг.
 */
function RootContent() {
  const { hydrated } = useApp();

  if (!hydrated) return <LoadingScreen />;

  return (
    <AudioProvider>
      <AppNavigation />
    </AudioProvider>
  );
}

/**
 * Подключает глобальные контексты настроек и аудио ко всему приложению.
 * Это самая верхняя точка React-дерева Lulla.
 */
export default function RootLayout() {
  return (
    <AppProvider>
      <RootContent />
    </AppProvider>
  );
}

/**
 * Создаёт корневые стили навигации для активной цветовой темы.
 */
const createStyles = (palette: ThemeColors) => StyleSheet.create({
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
  loadingMark: {
    width: 84,
    height: 84,
    borderRadius: 24,
    transform: [{ rotate: '45deg' }],
    backgroundColor: palette.yellow,
    shadowColor: palette.yellow,
    shadowOpacity: 0.3,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 0 },
  },
});
