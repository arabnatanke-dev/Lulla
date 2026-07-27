import Ionicons from '@expo/vector-icons/Ionicons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { PrimaryButton } from '@/src/components/buttons';
import { Screen } from '@/src/components/screen';
import { StoryCard } from '@/src/components/story-card';
import { radii, shadows, type ThemeColors } from '@/src/constants/theme';
import { useApp } from '@/src/context/app-context';
import { useAudioActions } from '@/src/context/audio-context';
import { stories } from '@/src/data/stories';

/**
 * Собирает главную страницу: приветствие, сказку вечера, популярные и короткие истории.
 */
export default function HomeScreen() {
  const { language, t, colors: palette } = useApp();
  const { startStory } = useAudioActions();
  const styles = createStyles(palette);
  const [startingFeatured, setStartingFeatured] = useState(false);
  const featured = stories.find((story) => story.isFeatured) ?? stories[0];

  if (!featured) {
    return <HomeEmptyState />;
  }

  const shortStories = stories.filter((story) => story.durationSeconds[language] <= 235);

  /**
   * Запускает рекомендуемую сказку и открывает полный экран плеера.
   */
  const playFeatured = async () => {
    if (startingFeatured) return;
    setStartingFeatured(true);
    const started = await startStory(featured);
    setStartingFeatured(false);
    if (started) router.navigate('/player');
  };

  return (
    <Screen scroll contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <View>
          <Text style={styles.eyebrow}>{t('greeting')} ✨</Text>
          <Text style={styles.heading}>{t('chooseStory')}</Text>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('settings')}
          onPress={() => router.push('/settings')}
          style={styles.settingsButton}>
          <Ionicons name="options-outline" size={22} color={palette.text} />
        </Pressable>
      </View>

      <LinearGradient
        colors={['#1A2858', '#67559A']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.hero}>
        <View style={styles.heroCopy}>
          <View style={styles.badge}>
            <Ionicons name="sparkles" size={13} color={palette.yellow} />
            <Text style={styles.badgeText}>{t('featured')}</Text>
          </View>
          <Text style={styles.heroTitle}>{featured.title[language]}</Text>
          <Text style={styles.heroDescription} numberOfLines={3}>
            {featured.description[language]}
          </Text>
          <PrimaryButton
            label={t('listen')}
            icon="play"
            variant="secondary"
            onPress={playFeatured}
            loading={startingFeatured}
            style={styles.heroButton}
          />
        </View>
        <Image source={featured.coverImage} style={styles.heroImage} contentFit="cover" />
      </LinearGradient>

      <SectionHeader title={t('popular')} />
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.horizontalList}>
        {stories.slice(0, 6).map((story) => (
          <StoryCard key={story.id} story={story} compact />
        ))}
      </ScrollView>

      <SectionHeader title={t('shortStories')} />
      <View style={styles.stack}>
        {shortStories.slice(0, 3).map((story) => (
          <StoryCard key={story.id} story={story} horizontal />
        ))}
      </View>

      <PrimaryButton
        label={t('seeAll')}
        variant="secondary"
        icon="grid-outline"
        onPress={() => router.push('/catalog')}
      />
    </Screen>
  );
}

/**
 * Показывает понятное состояние ошибки, если сборка не содержит ни одной сказки.
 */
function HomeEmptyState() {
  const { t, colors: palette } = useApp();
  const styles = createStyles(palette);

  return (
    <Screen contentContainerStyle={styles.emptyContent}>
      <View style={styles.emptyIcon}>
        <Ionicons name="book-outline" size={34} color={palette.purple} />
      </View>
      <Text accessibilityRole="header" style={styles.emptyTitle}>
        {t('libraryEmpty')}
      </Text>
      <Text style={styles.emptyText}>{t('libraryEmptyText')}</Text>
    </Screen>
  );
}

/**
 * Рисует единый заголовок секции на главной странице.
 */
function SectionHeader({ title }: { title: string }) {
  const { colors: palette } = useApp();
  const styles = createStyles(palette);

  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <Ionicons name="sparkles-outline" size={18} color={palette.purple} />
    </View>
  );
}

/**
 * Создаёт стили главного экрана для активной цветовой темы.
 */
const createStyles = (palette: ThemeColors) => StyleSheet.create({
  content: {
    paddingHorizontal: 18,
    paddingTop: 12,
    gap: 18,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  eyebrow: {
    color: palette.purple,
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 5,
  },
  heading: {
    color: palette.text,
    fontSize: 25,
    lineHeight: 31,
    fontWeight: '900',
    maxWidth: 290,
  },
  settingsButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: palette.surface,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.card,
  },
  hero: {
    minHeight: 292,
    borderRadius: radii.lg,
    overflow: 'hidden',
    flexDirection: 'row',
    ...shadows.card,
  },
  heroCopy: {
    width: '59%',
    padding: 20,
    zIndex: 2,
    alignItems: 'flex-start',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radii.pill,
    backgroundColor: 'rgba(255,255,255,0.13)',
    marginBottom: 15,
  },
  badgeText: {
    color: palette.white,
    fontSize: 11,
    fontWeight: '800',
  },
  heroTitle: {
    color: palette.white,
    fontSize: 25,
    lineHeight: 29,
    fontWeight: '900',
    marginBottom: 9,
  },
  heroDescription: {
    color: 'rgba(255,255,255,0.78)',
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 17,
  },
  heroButton: {
    minHeight: 46,
  },
  heroImage: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: '49%',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  sectionTitle: {
    color: palette.text,
    fontSize: 20,
    fontWeight: '900',
  },
  horizontalList: {
    gap: 13,
    paddingVertical: 3,
    paddingRight: 18,
  },
  stack: {
    gap: 13,
  },
  emptyContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
  },
  emptyIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.iconBubble,
    marginBottom: 18,
  },
  emptyTitle: {
    color: palette.text,
    fontSize: 22,
    lineHeight: 28,
    fontWeight: '900',
    textAlign: 'center',
  },
  emptyText: {
    color: palette.muted,
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
    marginTop: 8,
    maxWidth: 330,
  },
});
