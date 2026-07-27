import Ionicons from '@expo/vector-icons/Ionicons';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown, FadeOutUp, ReduceMotion } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { radii, shadows, type ThemeColors } from '@/src/constants/theme';
import { useApp } from '@/src/context/app-context';
import { useAudio } from '@/src/context/audio-context';

/**
 * Показывает понятное сообщение, если Android не смог загрузить или включить аудиофайл.
 * Пользователь может повторить запуск либо закрыть сообщение без перезапуска приложения.
 */
export function AudioFeedback() {
  const insets = useSafeAreaInsets();
  const { t, colors: palette } = useApp();
  const {
    audioError,
    loadingStoryId,
    clearAudioError,
    retryPlayback,
  } = useAudio();
  const styles = createStyles(palette);

  if (!audioError) return null;

  return (
    <Animated.View
      entering={FadeInDown.duration(220).reduceMotion(ReduceMotion.System)}
      exiting={FadeOutUp.duration(180).reduceMotion(ReduceMotion.System)}
      accessibilityLiveRegion="assertive"
      style={[styles.banner, { top: insets.top + 10 }]}>
      <View style={styles.icon}>
        <Ionicons name="alert-circle" size={22} color={palette.coral} />
      </View>
      <View style={styles.copy}>
        <Text style={styles.title}>{t('audioPlaybackError')}</Text>
        <Text style={styles.subtitle}>{t('audioPlaybackErrorHint')}</Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('tryAgain')}
          accessibilityState={{ busy: Boolean(loadingStoryId) }}
          disabled={Boolean(loadingStoryId)}
          onPress={() => {
            retryPlayback();
          }}
          style={({ pressed }) => [styles.retry, pressed && styles.pressed]}>
          <Ionicons name="refresh" size={16} color={palette.purple} />
          <Text style={styles.retryText}>
            {loadingStoryId ? t('loading') : t('tryAgain')}
          </Text>
        </Pressable>
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t('dismiss')}
        hitSlop={10}
        onPress={clearAudioError}
        style={styles.close}>
        <Ionicons name="close" size={20} color={palette.muted} />
      </Pressable>
    </Animated.View>
  );
}

/**
 * Создаёт стили аварийного сообщения для активной светлой или тёмной темы.
 */
const createStyles = (palette: ThemeColors) => StyleSheet.create({
  banner: {
    position: 'absolute',
    left: 12,
    right: 12,
    zIndex: 100,
    minHeight: 98,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 11,
    padding: 14,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: palette.warningBubble,
    backgroundColor: palette.surfaceElevated,
    ...shadows.card,
  },
  icon: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 19,
    backgroundColor: palette.warningBubble,
  },
  copy: {
    flex: 1,
    gap: 3,
  },
  title: {
    color: palette.text,
    fontSize: 15,
    fontWeight: '900',
  },
  subtitle: {
    color: palette.muted,
    fontSize: 12,
    lineHeight: 17,
  },
  retry: {
    minHeight: 44,
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 5,
    paddingHorizontal: 10,
    borderRadius: radii.pill,
    backgroundColor: palette.iconBubble,
  },
  retryText: {
    color: palette.purple,
    fontSize: 12,
    fontWeight: '900',
  },
  close: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.65,
  },
});
