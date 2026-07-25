import type { ImageSourcePropType } from 'react-native';

export type Language = 'ru' | 'en';
export type LocalizedText = Record<Language, string>;
export type RepeatMode = 'off' | 'one' | 'all';
export type ThemeMode = 'system' | 'light' | 'dark';

export type CategoryId =
  | 'all'
  | 'bedtime'
  | 'adventures'
  | 'magic'
  | 'animals'
  | 'lessons';

export interface Story {
  id: string;
  slug: string;
  title: LocalizedText;
  description: LocalizedText;
  text: LocalizedText;
  coverImage: ImageSourcePropType;
  audio: Record<Language, number>;
  categories: Exclude<CategoryId, 'all'>[];
  ageFrom: number;
  ageTo: number;
  durationSeconds: Record<Language, number>;
  isFeatured: boolean;
  isOfflineAvailable: boolean;
  order: number;
}

export interface StoredSettings {
  language: Language;
  onboardingComplete: boolean;
  favorites: string[];
  progress: Record<string, number>;
  playbackRate: number;
  textSize: 'small' | 'medium' | 'large';
  themeMode: ThemeMode;
  queueIds: string[];
  repeatMode: RepeatMode;
}

export interface AppCopy {
  [key: string]: string;
}
