import AsyncStorage from '@react-native-async-storage/async-storage';

import type { StoredSettings } from '@/src/types';

const STORAGE_KEY = '@lulla/settings-v1';
const LANGUAGES = new Set(['ru', 'en']);
const TEXT_SIZES = new Set(['small', 'medium', 'large']);
const THEME_MODES = new Set(['system', 'light', 'dark']);
const REPEAT_MODES = new Set(['off', 'one', 'all']);
const PLAYBACK_RATES = new Set([0.75, 1, 1.25, 1.5]);

/**
 * Проверяет, что значение является обычным объектом, с которым безопасно работать.
 */
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Оставляет в массиве только непустые строки и удаляет повторы.
 */
function normalizeStringArray(value: unknown, fallback: string[]) {
  if (!Array.isArray(value)) return fallback;
  return [...new Set(value.filter((item): item is string => typeof item === 'string' && item.length > 0))];
}

/**
 * Проверяет сохранённые позиции прослушивания и отбрасывает повреждённые значения.
 */
function normalizeProgress(value: unknown, fallback: Record<string, number>) {
  if (!isRecord(value)) return fallback;

  return Object.fromEntries(
    Object.entries(value).filter(
      (entry): entry is [string, number] =>
        Boolean(entry[0]) &&
        typeof entry[1] === 'number' &&
        Number.isFinite(entry[1]) &&
        entry[1] >= 0,
    ),
  );
}

/**
 * Приводит данные старых версий приложения к актуальной безопасной структуре.
 * Повреждённое отдельное поле заменяется значением по умолчанию, а остальные данные сохраняются.
 */
export function normalizeStoredSettings(
  value: unknown,
  defaults: StoredSettings,
): StoredSettings | null {
  if (!isRecord(value)) return null;

  return {
    language: LANGUAGES.has(String(value.language))
      ? (value.language as StoredSettings['language'])
      : defaults.language,
    onboardingComplete:
      typeof value.onboardingComplete === 'boolean'
        ? value.onboardingComplete
        : defaults.onboardingComplete,
    favorites: normalizeStringArray(value.favorites, defaults.favorites),
    progress: normalizeProgress(value.progress, defaults.progress),
    playbackRate:
      typeof value.playbackRate === 'number' && PLAYBACK_RATES.has(value.playbackRate)
        ? value.playbackRate
        : defaults.playbackRate,
    textSize: TEXT_SIZES.has(String(value.textSize))
      ? (value.textSize as StoredSettings['textSize'])
      : defaults.textSize,
    themeMode: THEME_MODES.has(String(value.themeMode))
      ? (value.themeMode as StoredSettings['themeMode'])
      : defaults.themeMode,
    queueIds: normalizeStringArray(value.queueIds, defaults.queueIds),
    repeatMode: REPEAT_MODES.has(String(value.repeatMode))
      ? (value.repeatMode as StoredSettings['repeatMode'])
      : defaults.repeatMode,
  };
}

/**
 * Читает сохранённые настройки из памяти устройства.
 * При ошибке возвращает null, чтобы приложение могло использовать безопасные значения по умолчанию.
 */
export async function loadSettings(defaults: StoredSettings): Promise<StoredSettings | null> {
  try {
    const value = await AsyncStorage.getItem(STORAGE_KEY);
    return value ? normalizeStoredSettings(JSON.parse(value) as unknown, defaults) : null;
  } catch (error) {
    console.warn('Unable to load settings', error);
    return null;
  }
}

/**
 * Сохраняет язык, избранное, прогресс и другие настройки локально.
 * Эти данные остаются только на устройстве пользователя.
 */
export async function saveSettings(settings: StoredSettings) {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch (error) {
    console.warn('Unable to save settings', error);
  }
}

/**
 * Удаляет только локальные настройки Lulla.
 * Используется аварийным экраном, если сохранённые данные мешают запустить приложение.
 */
export async function clearStoredSettings(): Promise<boolean> {
  try {
    await AsyncStorage.removeItem(STORAGE_KEY);
    return true;
  } catch (error) {
    console.warn('Unable to clear settings', error);
    return false;
  }
}
