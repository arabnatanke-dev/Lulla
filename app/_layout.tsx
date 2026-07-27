import { type ErrorBoundaryProps, Stack, router, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useReducedMotion } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AudioFeedback } from '@/src/components/audio-feedback';
import { MiniPlayer } from '@/src/components/mini-player';
import type { ThemeColors } from '@/src/constants/theme';
import { AppProvider, useApp } from '@/src/context/app-context';
import { AudioProvider } from '@/src/context/audio-context';
import { clearStoredSettings } from '@/src/services/storage';

SplashScreen.setOptions({
  duration: 450,
  fade: true,
});

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
      <AudioFeedback />
      <StatusBar
        style={current === 'onboarding' || current === 'player' || isDark ? 'light' : 'dark'}
      />
    </View>
  );
}

/**
 * Показывает лёгкую заставку, пока локальные настройки ещё не прочитаны.
 */
function LoadingScreen() {
  const { colors: palette } = useApp();
  const styles = createStyles(palette);
  const pulse = useRef(new Animated.Value(0)).current;
  const reduceMotion = useReducedMotion();

  // Мягко пульсируем знаком Lulla, но уважаем системное отключение анимаций.
  useEffect(() => {
    if (reduceMotion) {
      pulse.setValue(1);
      return;
    }

    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 900,
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: 900,
          useNativeDriver: true,
        }),
      ]),
    );
    animation.start();
    return () => animation.stop();
  }, [pulse, reduceMotion]);

  return (
    <View style={styles.loading}>
      <Animated.View
        style={[
          styles.loadingMark,
          {
            opacity: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.72, 1] }),
            transform: [
              { rotate: '45deg' },
              { scale: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.94, 1.05] }) },
            ],
          },
        ]}
      />
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
 * Перехватывает неожиданную ошибку экрана и не оставляет пользователя с пустым приложением.
 * Повторный запуск сохраняет данные, а отдельная кнопка очищает только настройки Lulla.
 */
export function ErrorBoundary({ retry }: ErrorBoundaryProps) {
  const [resetting, setResetting] = useState(false);
  const [resetError, setResetError] = useState<string | null>(null);

  /**
   * Удаляет повреждённые локальные настройки и повторно создаёт корневой экран.
   */
  const resetAndRetry = async () => {
    setResetting(true);
    setResetError(null);

    try {
      const cleared = await clearStoredSettings();
      if (!cleared) {
        setResetError('Не удалось очистить настройки. Попробуйте ещё раз.');
        return;
      }
      await retry();
    } catch {
      setResetError('Не удалось перезапустить Lulla. Закройте приложение и откройте его снова.');
    } finally {
      setResetting(false);
    }
  };

  /**
   * Просит подтверждение перед удалением избранного, очереди и прогресса.
   */
  const confirmReset = () => {
    Alert.alert(
      'Очистить настройки Lulla?',
      'Будут удалены избранное, очередь, прогресс и выбранное оформление на этом устройстве.',
      [
        { text: 'Отмена', style: 'cancel' },
        { text: 'Очистить', style: 'destructive', onPress: resetAndRetry },
      ],
    );
  };

  return (
    <SafeAreaView style={errorStyles.root}>
      <StatusBar style="light" />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={errorStyles.scrollContent}>
        <View style={errorStyles.icon}>
          <Text style={errorStyles.iconText}>!</Text>
        </View>
        <Text accessibilityRole="header" style={errorStyles.title}>
          Lulla столкнулась с ошибкой
        </Text>
        <Text style={errorStyles.text}>
          Попробуйте запустить экран ещё раз. Если ошибка повторится, очистите только локальные
          настройки приложения.
        </Text>
        {resetError ? (
          <Text accessibilityLiveRegion="assertive" style={errorStyles.resetError}>
            {resetError}
          </Text>
        ) : null}
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ disabled: resetting }}
          disabled={resetting}
          onPress={() => retry()}
          style={({ pressed }) => [errorStyles.primaryButton, pressed && errorStyles.pressed]}>
          <Text style={errorStyles.primaryText}>Повторить запуск</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ busy: resetting, disabled: resetting }}
          disabled={resetting}
          onPress={confirmReset}
          style={({ pressed }) => [errorStyles.secondaryButton, pressed && errorStyles.pressed]}>
          {resetting ? (
            <ActivityIndicator color="#F0C66E" />
          ) : (
            <Text style={errorStyles.secondaryText}>Очистить настройки</Text>
          )}
        </Pressable>
      </ScrollView>
    </SafeAreaView>
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
    backgroundColor: palette.yellow,
    shadowColor: palette.yellow,
    shadowOpacity: 0.3,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 0 },
  },
});

const errorStyles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#101B3F',
  },
  scrollContent: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    paddingHorizontal: 28,
    paddingVertical: 24,
  },
  icon: {
    width: 72,
    height: 72,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 24,
    backgroundColor: '#3A2942',
  },
  iconText: {
    color: '#F0C66E',
    fontSize: 38,
    fontWeight: '900',
  },
  title: {
    color: '#FFFFFF',
    fontSize: 24,
    lineHeight: 30,
    fontWeight: '900',
    textAlign: 'center',
  },
  text: {
    maxWidth: 390,
    color: '#C5CAD7',
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
    marginBottom: 6,
  },
  resetError: {
    maxWidth: 390,
    color: '#F1B49A',
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '700',
    textAlign: 'center',
  },
  primaryButton: {
    width: '100%',
    maxWidth: 360,
    minHeight: 52,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 26,
    backgroundColor: '#F0C66E',
  },
  primaryText: {
    color: '#101B3F',
    fontSize: 16,
    fontWeight: '900',
  },
  secondaryButton: {
    width: '100%',
    maxWidth: 360,
    minHeight: 52,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 26,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  secondaryText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  pressed: {
    opacity: 0.7,
    transform: [{ scale: 0.985 }],
  },
});
