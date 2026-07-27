import rawContent from './stories-content.json';

import type { Story } from '@/src/types';

const covers: Record<string, number> = {
  'lion-and-mouse': require('@/assets/images/covers/lion-and-mouse.jpg'),
  'tortoise-and-hare': require('@/assets/images/covers/tortoise-and-hare.jpg'),
  'princess-and-pea': require('@/assets/images/covers/princess-and-pea.jpg'),
  'ugly-duckling': require('@/assets/images/covers/ugly-duckling.jpg'),
  'emperors-new-clothes': require('@/assets/images/covers/emperors-new-clothes.jpg'),
  'bremen-musicians': require('@/assets/images/covers/bremen-musicians.jpg'),
  'frog-prince': require('@/assets/images/covers/frog-prince.jpg'),
  'elves-and-shoemaker': require('@/assets/images/covers/elves-and-shoemaker.jpg'),
  'little-red-riding-hood': require('@/assets/images/covers/little-red-riding-hood.jpg'),
  'three-little-pigs': require('@/assets/images/covers/three-little-pigs.jpg'),
};

const audio: Record<string, { ru: number; en: number }> = {
  'lion-and-mouse': {
    ru: require('@/assets/audio/ru/lion-and-mouse.mp3'),
    en: require('@/assets/audio/en/lion-and-mouse.mp3'),
  },
  'tortoise-and-hare': {
    ru: require('@/assets/audio/ru/tortoise-and-hare.mp3'),
    en: require('@/assets/audio/en/tortoise-and-hare.mp3'),
  },
  'princess-and-pea': {
    ru: require('@/assets/audio/ru/princess-and-pea.mp3'),
    en: require('@/assets/audio/en/princess-and-pea.mp3'),
  },
  'ugly-duckling': {
    ru: require('@/assets/audio/ru/ugly-duckling.mp3'),
    en: require('@/assets/audio/en/ugly-duckling.mp3'),
  },
  'emperors-new-clothes': {
    ru: require('@/assets/audio/ru/emperors-new-clothes.mp3'),
    en: require('@/assets/audio/en/emperors-new-clothes.mp3'),
  },
  'bremen-musicians': {
    ru: require('@/assets/audio/ru/bremen-musicians.mp3'),
    en: require('@/assets/audio/en/bremen-musicians.mp3'),
  },
  'frog-prince': {
    ru: require('@/assets/audio/ru/frog-prince.mp3'),
    en: require('@/assets/audio/en/frog-prince.mp3'),
  },
  'elves-and-shoemaker': {
    ru: require('@/assets/audio/ru/elves-and-shoemaker.mp3'),
    en: require('@/assets/audio/en/elves-and-shoemaker.mp3'),
  },
  'little-red-riding-hood': {
    ru: require('@/assets/audio/ru/little-red-riding-hood.mp3'),
    en: require('@/assets/audio/en/little-red-riding-hood.mp3'),
  },
  'three-little-pigs': {
    ru: require('@/assets/audio/ru/three-little-pigs.mp3'),
    en: require('@/assets/audio/en/three-little-pigs.mp3'),
  },
};

type StoryContent = Omit<Story, 'coverImage' | 'audio' | 'isOfflineAvailable'>;

/**
 * Проверяет, что перевод содержит непустые русскую и английскую версии.
 */
function hasBothLanguages(value: unknown): value is { ru: string; en: string } {
  if (typeof value !== 'object' || value === null) return false;
  const localized = value as Record<string, unknown>;
  return (
    typeof localized.ru === 'string' &&
    localized.ru.length > 0 &&
    typeof localized.en === 'string' &&
    localized.en.length > 0
  );
}

/**
 * Проверяет, что для обоих языков указана положительная длительность аудио.
 */
function hasBothDurations(value: unknown): value is { ru: number; en: number } {
  if (typeof value !== 'object' || value === null) return false;
  const durations = value as Record<string, unknown>;
  return (
    typeof durations.ru === 'number' &&
    Number.isFinite(durations.ru) &&
    durations.ru > 0 &&
    typeof durations.en === 'number' &&
    Number.isFinite(durations.en) &&
    durations.en > 0
  );
}

/**
 * Проверяет обязательные поля новой сказки до того, как она попадёт в каталог.
 */
function isValidStoryContent(value: unknown): value is StoryContent {
  if (typeof value !== 'object' || value === null) return false;
  const story = value as Partial<StoryContent>;

  return (
    typeof story.id === 'string' &&
    story.id.length > 0 &&
    typeof story.slug === 'string' &&
    story.slug.length > 0 &&
    hasBothLanguages(story.title) &&
    hasBothLanguages(story.description) &&
    hasBothLanguages(story.text) &&
    hasBothDurations(story.durationSeconds) &&
    Array.isArray(story.categories) &&
    typeof story.ageFrom === 'number' &&
    typeof story.ageTo === 'number' &&
    typeof story.isFeatured === 'boolean' &&
    typeof story.order === 'number'
  );
}

/**
 * Проверяет наличие обложки и двух аудиофайлов для указанного сюжета.
 */
function hasStoryAssets(story: StoryContent) {
  const storyAudio = audio[story.slug];
  const valid = Boolean(covers[story.slug] && storyAudio?.ru && storyAudio?.en);
  if (!valid) {
    console.warn(`Story "${story.slug}" was skipped because its assets are incomplete`);
  }
  return valid;
}

export const stories: Story[] = (Array.isArray(rawContent) ? rawContent : [])
  .filter(isValidStoryContent)
  .filter(hasStoryAssets)
  .map((story) => ({
    ...story,
    coverImage: covers[story.slug],
    audio: audio[story.slug],
    isOfflineAvailable: true,
  }))
  .sort((a, b) => a.order - b.order);

/**
 * Находит сказку по внутреннему идентификатору или читаемому slug.
 * Функция нужна динамическим экранам карточки и чтения.
 */
export function getStory(idOrSlug?: string) {
  return stories.find((story) => story.id === idOrSlug || story.slug === idOrSlug);
}
