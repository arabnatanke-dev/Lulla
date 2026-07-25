import Ionicons from '@expo/vector-icons/Ionicons';
import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { PrimaryButton, RoundButton } from '@/src/components/buttons';
import { Screen } from '@/src/components/screen';
import { palette, radii, shadows } from '@/src/constants/theme';
import { useApp } from '@/src/context/app-context';
import { useAudio } from '@/src/context/audio-context';
import { categoryLabels } from '@/src/data/copy';
import { getStory } from '@/src/data/stories';

/**
 * Показывает большую обложку, описание и действия выбранной сказки.
 * Идентификатор истории берётся из адреса динамического маршрута.
 */
export default function StoryDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { language, t, isFavorite, toggleFavorite, progress } = useApp();
  const { startStory, addToQueue, removeFromQueue, isQueued } = useAudio();
  const story = getStory(id);

  if (!story) {
    return (
      <Screen contentContainerStyle={styles.notFound}>
        <Text style={styles.notFoundText}>{t('nothingFound')}</Text>
        <PrimaryButton label={t('goCatalog')} onPress={() => router.replace('/catalog')} />
      </Screen>
    );
  }

  /**
   * Передаёт сказку общему аудиоплееру и открывает экран воспроизведения.
   */
  const play = async () => {
    await startStory(story);
    router.push('/player');
  };

  /**
   * Добавляет сказку в очередь или убирает её оттуда при повторном нажатии.
   */
  const toggleQueue = () => {
    if (isQueued(story.id)) removeFromQueue(story.id);
    else addToQueue(story);
  };

  return (
    <Screen scroll contentContainerStyle={styles.content}>
      <View style={styles.coverWrap}>
        <Image source={story.coverImage} style={styles.cover} contentFit="cover" />
        <RoundButton
          icon="arrow-back"
          accessibilityLabel={t('back')}
          onPress={() => router.back()}
          style={styles.back}
        />
        <RoundButton
          icon={isFavorite(story.id) ? 'heart' : 'heart-outline'}
          color={isFavorite(story.id) ? palette.coral : palette.navy}
          accessibilityLabel={t('favorites')}
          onPress={() => toggleFavorite(story.id)}
          style={styles.favorite}
        />
        {story.isFeatured ? (
          <View style={styles.recommended}>
            <Ionicons name="sparkles" size={13} color={palette.yellow} />
            <Text style={styles.recommendedText}>{t('recommended')}</Text>
          </View>
        ) : null}
      </View>

      <View style={styles.body}>
        <Text style={styles.title}>{story.title[language]}</Text>
        <View style={styles.meta}>
          <Meta icon="time-outline" text={`${Math.round(story.durationSeconds[language] / 60)} ${t('min')}`} />
          <Meta icon="happy-outline" text={`${story.ageFrom}–${story.ageTo} ${t('years')}`} />
          <Meta icon="cloud-done-outline" text={t('offline')} />
        </View>

        <View style={styles.categories}>
          {story.categories.map((category) => (
            <View key={category} style={styles.category}>
              <Text style={styles.categoryText}>{categoryLabels[category][language]}</Text>
            </View>
          ))}
        </View>

        <View style={styles.aboutBox}>
          <Text style={styles.aboutTitle}>{t('aboutStory')}</Text>
          <Text style={styles.description}>{story.description[language]}</Text>
        </View>

        <PrimaryButton
          label={progress[story.id] ? t('continueListening') : t('startListening')}
          icon="play"
          onPress={play}
        />
        <PrimaryButton
          label={isQueued(story.id) ? t('removeFromQueue') : t('addToQueue')}
          icon={isQueued(story.id) ? 'close-circle-outline' : 'list-outline'}
          variant="secondary"
          onPress={toggleQueue}
        />
        <PrimaryButton
          label={t('read')}
          icon="book-outline"
          variant="secondary"
          onPress={() =>
            router.push({ pathname: '/reader/[id]', params: { id: story.id } })
          }
        />
      </View>
    </Screen>
  );
}

/**
 * Рисует один небольшой параметр сказки: длительность, возраст или офлайн-доступ.
 */
function Meta({ icon, text }: { icon: keyof typeof Ionicons.glyphMap; text: string }) {
  return (
    <View style={styles.metaItem}>
      <Ionicons name={icon} size={17} color={palette.purple} />
      <Text style={styles.metaText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingBottom: 130,
  },
  coverWrap: {
    height: 390,
    marginHorizontal: 14,
    marginTop: 5,
    borderRadius: radii.lg,
    overflow: 'hidden',
    backgroundColor: palette.paper,
    ...shadows.card,
  },
  cover: {
    width: '100%',
    height: '100%',
  },
  back: {
    position: 'absolute',
    left: 14,
    top: 14,
  },
  favorite: {
    position: 'absolute',
    right: 14,
    top: 14,
  },
  recommended: {
    position: 'absolute',
    left: 14,
    bottom: 14,
    backgroundColor: 'rgba(16,27,63,0.86)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radii.pill,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  recommendedText: {
    color: palette.white,
    fontSize: 12,
    fontWeight: '800',
  },
  body: {
    paddingHorizontal: 20,
    paddingTop: 24,
    gap: 14,
  },
  title: {
    color: palette.text,
    fontSize: 29,
    lineHeight: 35,
    fontWeight: '900',
  },
  meta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 9,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: palette.white,
    paddingHorizontal: 11,
    paddingVertical: 8,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: palette.line,
  },
  metaText: {
    color: palette.muted,
    fontSize: 12,
    fontWeight: '700',
  },
  categories: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 7,
  },
  category: {
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderRadius: radii.pill,
    backgroundColor: '#EEE8F8',
  },
  categoryText: {
    color: palette.purple,
    fontSize: 12,
    fontWeight: '800',
  },
  aboutBox: {
    paddingVertical: 6,
    gap: 7,
  },
  aboutTitle: {
    color: palette.text,
    fontSize: 18,
    fontWeight: '900',
  },
  description: {
    color: palette.muted,
    fontSize: 16,
    lineHeight: 24,
  },
  notFound: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 30,
    gap: 20,
  },
  notFoundText: {
    color: palette.text,
    fontSize: 20,
    fontWeight: '800',
  },
});
