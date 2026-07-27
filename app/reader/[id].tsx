import Ionicons from '@expo/vector-icons/Ionicons';
import { router, useLocalSearchParams } from 'expo-router';
import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { PrimaryButton, RoundButton } from '@/src/components/buttons';
import { Screen } from '@/src/components/screen';
import { radii, type ThemeColors } from '@/src/constants/theme';
import { useApp } from '@/src/context/app-context';
import { useAudio } from '@/src/context/audio-context';
import { getStory } from '@/src/data/stories';

const sizes = {
  small: { fontSize: 16, lineHeight: 26 },
  medium: { fontSize: 19, lineHeight: 31 },
  large: { fontSize: 23, lineHeight: 37 },
};

/**
 * Показывает полный текст сказки с регулируемым размером шрифта.
 * Встроенная кнопка запускает ту же аудиозапись, что и основной плеер.
 */
export default function ReaderScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { language, t, textSize, setTextSize, colors: palette } = useApp();
  const {
    activeStory,
    playing,
    loadingStoryId,
    startStory,
    toggle,
    currentTime,
    duration,
  } = useAudio();
  const styles = createStyles(palette);
  const story = getStory(id);

  if (!story) {
    return (
      <Screen contentContainerStyle={styles.notFound}>
        <Ionicons name="book-outline" size={52} color={palette.purple} />
        <Text style={styles.notFoundTitle}>{t('storyNotFound')}</Text>
        <PrimaryButton
          label={t('goCatalog')}
          icon="library-outline"
          onPress={() => router.replace('/catalog')}
        />
      </Screen>
    );
  }

  const isCurrent = activeStory?.id === story.id;
  const isLoading = loadingStoryId === story.id;
  /**
   * Ставит текущую сказку на паузу или загружает её, если играет другая история.
   */
  const onPlay = async () => {
    if (isLoading) return;
    if (isCurrent) toggle();
    else await startStory(story);
  };
  const progress = isCurrent && duration ? Math.min(1, currentTime / duration) : 0;

  return (
    <Screen scroll contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <RoundButton
          icon="arrow-back"
          accessibilityLabel={t('back')}
          onPress={() => router.back()}
        />
        <View style={styles.headerText}>
          <Text style={styles.readerLabel}>{t('reader')}</Text>
          <Text style={styles.title} numberOfLines={2}>
            {story.title[language]}
          </Text>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={isCurrent && playing ? t('pause') : t('play')}
          accessibilityState={{ busy: isLoading }}
          disabled={isLoading}
          onPress={onPlay}
          style={styles.play}>
          {isLoading ? (
            <ActivityIndicator color={palette.white} />
          ) : (
            <Ionicons
              name={isCurrent && playing ? 'pause' : 'play'}
              size={25}
              color={palette.white}
            />
          )}
        </Pressable>
      </View>

      <View
        accessible
        accessibilityRole="progressbar"
        accessibilityLabel={t('player')}
        accessibilityValue={{
          min: 0,
          max: 100,
          now: Math.round(progress * 100),
          text: `${Math.round(progress * 100)}%`,
        }}
        style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
      </View>

      <View
        accessibilityRole="radiogroup"
        accessibilityLabel={t('textSize')}
        style={styles.sizeControl}>
        {(['small', 'medium', 'large'] as const).map((size, index) => (
          <Pressable
            key={size}
            accessibilityRole="radio"
            accessibilityLabel={t(size)}
            accessibilityState={{ checked: textSize === size, selected: textSize === size }}
            onPress={() => setTextSize(size)}
            style={[styles.sizeButton, textSize === size && styles.activeSize]}>
            <Text
              style={[
                styles.sizeLabel,
                { fontSize: 13 + index * 3 },
                textSize === size && styles.activeSizeLabel,
              ]}>
              A
            </Text>
          </Pressable>
        ))}
      </View>

      <View style={styles.paper}>
        {story.text[language].split('\n\n').map((paragraph, index) => (
          <Text key={index} style={[styles.paragraph, sizes[textSize]]}>
            {paragraph}
          </Text>
        ))}
        <View style={styles.endMark}>
          <Ionicons name="book-outline" size={22} color={palette.purple} />
          <View style={styles.endLine} />
          <Ionicons name="sparkles" size={18} color={palette.yellow} />
        </View>
      </View>
    </Screen>
  );
}

/**
 * Создаёт стили режима чтения для активной цветовой темы.
 */
const createStyles = (palette: ThemeColors) => StyleSheet.create({
  content: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 160,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerText: {
    flex: 1,
    gap: 2,
  },
  readerLabel: {
    color: palette.purple,
    fontSize: 11,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  title: {
    color: palette.text,
    fontSize: 18,
    lineHeight: 22,
    fontWeight: '900',
  },
  play: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.navy,
    paddingLeft: 2,
  },
  progressTrack: {
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
    backgroundColor: palette.line,
    marginTop: 15,
  },
  progressFill: {
    height: '100%',
    backgroundColor: palette.yellow,
  },
  sizeControl: {
    flexDirection: 'row',
    alignSelf: 'center',
    marginVertical: 16,
    padding: 4,
    borderRadius: radii.pill,
    backgroundColor: palette.surface,
    borderWidth: 1,
    borderColor: palette.line,
  },
  sizeButton: {
    width: 52,
    minHeight: 44,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeSize: {
    backgroundColor: palette.navy,
  },
  sizeLabel: {
    color: palette.muted,
    fontWeight: '800',
  },
  activeSizeLabel: {
    color: palette.white,
  },
  paper: {
    backgroundColor: palette.surface,
    borderRadius: radii.lg,
    paddingHorizontal: 22,
    paddingVertical: 26,
    borderWidth: 1,
    borderColor: palette.line,
  },
  paragraph: {
    color: palette.text,
    marginBottom: 18,
  },
  endMark: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginTop: 6,
  },
  endLine: {
    width: 54,
    height: 1,
    backgroundColor: palette.line,
  },
  notFound: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 18,
    paddingHorizontal: 28,
  },
  notFoundTitle: {
    color: palette.text,
    fontSize: 22,
    fontWeight: '900',
    textAlign: 'center',
  },
});
