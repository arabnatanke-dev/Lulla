import rawContent from './stories-content.json';

import type { Story } from '@/src/types';

const covers: Record<string, number> = {
  'lion-and-mouse': require('@/assets/images/covers/lion-and-mouse.png'),
  'tortoise-and-hare': require('@/assets/images/covers/tortoise-and-hare.png'),
  'princess-and-pea': require('@/assets/images/covers/princess-and-pea.png'),
  'ugly-duckling': require('@/assets/images/covers/ugly-duckling.png'),
  'emperors-new-clothes': require('@/assets/images/covers/emperors-new-clothes.png'),
  'bremen-musicians': require('@/assets/images/covers/bremen-musicians.png'),
  'frog-prince': require('@/assets/images/covers/frog-prince.png'),
  'elves-and-shoemaker': require('@/assets/images/covers/elves-and-shoemaker.png'),
  'little-red-riding-hood': require('@/assets/images/covers/little-red-riding-hood.png'),
  'three-little-pigs': require('@/assets/images/covers/three-little-pigs.png'),
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

export const stories: Story[] = (rawContent as StoryContent[])
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
