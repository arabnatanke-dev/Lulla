import Ionicons from '@expo/vector-icons/Ionicons';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { palette, radii, shadows } from '@/src/constants/theme';
import { useApp } from '@/src/context/app-context';
import { useAudio } from '@/src/context/audio-context';

/**
 * Показывает компактный плеер поверх основных вкладок.
 * Он позволяет поставить сказку на паузу, закрыть её или открыть полный плеер.
 */
export function MiniPlayer() {
  const insets = useSafeAreaInsets();
  const { language } = useApp();
  const { activeStory, playing, currentTime, duration, toggle, close } = useAudio();

  if (!activeStory) return null;

  const progress = duration ? Math.min(1, currentTime / duration) : 0;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={activeStory.title[language]}
      onPress={() => router.push('/player')}
      style={[styles.container, { bottom: 72 + Math.max(insets.bottom, 8) }]}>
      <Image source={activeStory.coverImage} style={styles.cover} contentFit="cover" />
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
        accessibilityLabel={playing ? 'Pause' : 'Play'}
        hitSlop={7}
        onPress={(event) => {
          event.stopPropagation();
          toggle();
        }}
        style={styles.action}>
        <Ionicons name={playing ? 'pause' : 'play'} size={22} color={palette.white} />
      </Pressable>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Close player"
        hitSlop={7}
        onPress={(event) => {
          event.stopPropagation();
          close();
        }}
        style={styles.close}>
        <Ionicons name="close" size={20} color={palette.white} />
      </Pressable>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 12,
    right: 12,
    height: 66,
    borderRadius: radii.md,
    backgroundColor: palette.navyLight,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    gap: 10,
    zIndex: 30,
    ...shadows.card,
  },
  cover: {
    width: 50,
    height: 50,
    borderRadius: 12,
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
});
