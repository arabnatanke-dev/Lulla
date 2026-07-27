import Ionicons from '@expo/vector-icons/Ionicons';
import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import React from 'react';
import { Pressable, StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';
import Animated, {
  ReduceMotion,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
} from 'react-native-reanimated';

import { radii, shadows, type ThemeColors } from '@/src/constants/theme';
import { useApp } from '@/src/context/app-context';
import type { Story } from '@/src/types';

interface StoryCardProps {
  story: Story;
  compact?: boolean;
  horizontal?: boolean;
  style?: StyleProp<ViewStyle>;
}

/**
 * Показывает карточку сказки с обложкой, названием, возрастом и длительностью.
 * Карточка открывает страницу сказки, а сердечко меняет состояние избранного.
 */
export function StoryCard({ story, compact = false, horizontal = false, style }: StoryCardProps) {
  const { language, toggleFavorite, isFavorite, t, colors: palette } = useApp();
  const styles = createStyles(palette);
  const favorite = isFavorite(story.id);
  const favoriteScale = useSharedValue(1);
  const animatedHeartStyle = useAnimatedStyle(() => ({
    transform: [{ scale: favoriteScale.value }],
  }));

  /**
   * Переключает избранное и запускает короткую спокойную анимацию сердечка.
   */
  const toggleStoryFavorite = () => {
    favoriteScale.value = withSequence(
      withSpring(0.78, {
        damping: 16,
        stiffness: 280,
        reduceMotion: ReduceMotion.System,
      }),
      withSpring(1, {
        damping: 12,
        stiffness: 220,
        reduceMotion: ReduceMotion.System,
      }),
    );
    toggleFavorite(story.id);
    Haptics.selectionAsync().catch(() => undefined);
  };

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={story.title[language]}
      onPress={() => router.push(`/story/${story.id}`)}
      style={({ pressed }) => [
        styles.card,
        horizontal && styles.horizontalCard,
        compact && styles.compactCard,
        pressed && styles.pressed,
        style,
      ]}>
      <View
        style={[
          styles.imageWrap,
          horizontal && styles.horizontalImageWrap,
          compact && styles.compactImageWrap,
        ]}>
        <Image source={story.coverImage} style={styles.image} contentFit="cover" transition={200} />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={favorite ? t('removeFavorite') : t('addFavorite')}
          accessibilityState={{ selected: favorite }}
          hitSlop={8}
          onPress={(event) => {
            event.stopPropagation();
            toggleStoryFavorite();
          }}
          style={({ pressed }) => [styles.favorite, pressed && styles.favoritePressed]}>
          <Animated.View style={animatedHeartStyle}>
            <Ionicons
              name={favorite ? 'heart' : 'heart-outline'}
              size={20}
              color={favorite ? palette.coral : palette.text}
            />
          </Animated.View>
        </Pressable>
      </View>

      <View style={[styles.body, horizontal && styles.horizontalBody]}>
        <Text style={styles.title} numberOfLines={2}>
          {story.title[language]}
        </Text>
        {!compact ? (
          <Text style={styles.description} numberOfLines={horizontal ? 2 : 3}>
            {story.description[language]}
          </Text>
        ) : null}
        <View style={styles.meta}>
          <View style={styles.metaItem}>
            <Ionicons name="time-outline" size={14} color={palette.muted} />
            <Text style={styles.metaText}>
              {Math.round(story.durationSeconds[language] / 60)} {t('min')}
            </Text>
          </View>
          <Text style={styles.dot}>•</Text>
          <Text style={styles.metaText}>
            {story.ageFrom}–{story.ageTo} {t('years')}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

/**
 * Создаёт стили карточек сказок для активной цветовой темы.
 */
const createStyles = (palette: ThemeColors) => StyleSheet.create({
  card: {
    backgroundColor: palette.surface,
    borderRadius: radii.md,
    overflow: 'hidden',
    ...shadows.card,
  },
  compactCard: {
    width: 166,
  },
  horizontalCard: {
    flexDirection: 'row',
    minHeight: 142,
  },
  imageWrap: {
    width: '100%',
    aspectRatio: 1.14,
    backgroundColor: palette.paper,
  },
  compactImageWrap: {
    aspectRatio: 1.08,
  },
  horizontalImageWrap: {
    width: 126,
    aspectRatio: undefined,
    minHeight: 142,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  favorite: {
    position: 'absolute',
    right: 9,
    top: 9,
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.surfaceElevated,
  },
  favoritePressed: {
    transform: [{ scale: 0.9 }],
  },
  body: {
    padding: 13,
    gap: 7,
  },
  horizontalBody: {
    flex: 1,
    justifyContent: 'center',
    padding: 16,
  },
  title: {
    color: palette.text,
    fontSize: 16,
    lineHeight: 20,
    fontWeight: '800',
  },
  description: {
    color: palette.muted,
    fontSize: 13,
    lineHeight: 18,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 5,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    color: palette.muted,
    fontSize: 12,
    fontWeight: '600',
  },
  dot: {
    color: palette.line,
  },
  pressed: {
    opacity: 0.88,
    transform: [{ scale: 0.99 }],
  },
});
