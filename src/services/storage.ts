import AsyncStorage from '@react-native-async-storage/async-storage';

import type { StoredSettings } from '@/src/types';

const STORAGE_KEY = '@lulla/settings-v1';

/**
 * Читает сохранённые настройки из памяти устройства.
 * При ошибке возвращает null, чтобы приложение могло использовать безопасные значения по умолчанию.
 */
export async function loadSettings(): Promise<StoredSettings | null> {
  try {
    const value = await AsyncStorage.getItem(STORAGE_KEY);
    return value ? (JSON.parse(value) as StoredSettings) : null;
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
