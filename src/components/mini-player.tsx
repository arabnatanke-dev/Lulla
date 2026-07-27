import Ionicons from '@expo/vector-icons/Ionicons';
import { Image } from 'expo-image';
import { router, useSegments } from 'expo-router';
import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInUp, FadeOutDown, ReduceMotion } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { radii, shadows, type ThemeColors } from '@/src/constants/theme';
import { useApp } from '@/src/context/app-context';
import { useAudio } from '@/src/context/audio-context';

/**
 * Показывает компактный плеер поверх основных вкладок.
 * Он позволяет поставить сказку на паузу, закрыть её или открыть полный плеер.
 */
export function MiniPlayer() {
  const insets = useSafeAreaInsets();
  const segments = useSegments();
  const { language, t, colors: palette } = useApp();
  const {
    activeStory,
    playing,
    loadingStoryId,
    isBuffering,
    currentTime,
    duration,
    queue,
    toggle,
    close,
  } = useAudio();
  const styles = createStyles(palette);

  if (!activeStory) return null;

  const progress = duration ? Math.min(1, currentTime / duration) : 0;
  const isBusy = loadingStoryId === activeStory.id || isBuffering;
  const insideTabs = segments[0] === '(tabs)';
  const bottom = insideTabs ? 72 + insets.bottom : Math.max(insets.bottom, 12);

  return (
    <Animated.View
      entering={FadeInUp.duration(240).reduceMotion(ReduceMotion.System)}
      exiting={FadeOutDown.duration(180).reduceMotion(ReduceMotion.System)}
      style={[styles.container, { bottom }]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={activeStory.title[language]}
        onPress={() => router.navigate('/player')}
        style={({ pressed }) => [styles.touchable, pressed && styles.pressed]}>
        <View style={styles.coverWrap}>
          <Image source={activeStory.coverImage} style={styles.cover} contentFit="cover" />
          {queue.length ? (
            <View style={styles.queueBadge}>
              <Text style={styles.queueBadgeText}>{queue.length}</Text>
            </View>
          ) : null}
        </View>
        <View style={styles.info}>
          <Text style={styles.title} numberOfLines={1}>
            {activeStory.title[language]}
          </Text>
          <View style={styles.track}>
            <View style={[styles.progress, { width: `${progress * 100}%` }]} />
          </View>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={playing ? t('pause') : t('play')}
          accessibilityState={{ busy: isBusy }}
          disabled={isBusy}
          hitSlop={7}
          onPress={(event) => {
            event.stopPropagation();
            toggle();
          }}
          style={styles.action}>
          {isBusy ? (
            <ActivityIndicator size="small" color={palette.white} />
          ) : (
            <Ionicons name={playing ? 'pause' : 'play'} size={22} color={palette.white} />
          )}
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('closePlayer')}
          hitSlop={7}
          onPress={(event) => {
            event.stopPropagation();
            close();
          }}
          style={styles.close}>
          <Ionicons name="close" size={20} color={palette.white} />
        </Pressable>
      </Pressable>
    </Animated.View>
  );
}

/**
 * Создаёт стили мини-плеера для активной цветовой темы.
 */
const createStyles = (palette: ThemeColors) => StyleSheet.create({
  container: {
    position: 'absolute',
    left: 12,
    right: 12,
    height: 66,
    borderRadius: radii.md,
    backgroundColor: palette.navyLight,
    zIndex: 30,
    ...shadows.card,
  },
  touchable: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    gap: 10,
    borderRadius: radii.md,
  },
  cover: {
    width: 50,
    height: 50,
    borderRadius: 12,
  },
  coverWrap: {
    width: 50,
    height: 50,
  },
  queueBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 18,
    height: 18,
    paddingHorizontal: 4,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.coral,
    borderWidth: 2,
    borderColor: palette.navyLight,
  },
  queueBadgeText: {
    color: palette.white,
    fontSize: 9,
    fontWeight: '900',
  },
  info: {
    flex: 1,
    gap: 8,
  },
  title: {
    color: palette.white,
    fontWeight: '800',
    fontSize: 14,
  },
  track: {
    height: 3,
    borderRadius: 2,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  progress: {
    height: '100%',
    backgroundColor: palette.yellow,
  },
  action: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.purple,
  },
  close: {
    width: 32,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.88,
    transform: [{ scale: 0.99 }],
  },
});
