import React, {
  createContext,
  PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useColorScheme } from 'react-native';

import { darkPalette, lightPalette, type ThemeColors } from '@/src/constants/theme';
import { copy } from '@/src/data/copy';
import { loadSettings, saveSettings } from '@/src/services/storage';
import type { Language, RepeatMode, StoredSettings, ThemeMode } from '@/src/types';

const SETTINGS_LOAD_TIMEOUT_MS = 2500;

/**
 * Безопасно определяет язык устройства.
 * Если Android не отдаёт локаль, приложение всё равно запускается на русском языке.
 */
function detectDefaultLanguage(): Language {
  try {
    return Intl.DateTimeFormat().resolvedOptions().locale.toLowerCase().startsWith('ru')
      ? 'ru'
      : 'en';
  } catch {
    return 'ru';
  }
}

const defaultLanguage = detectDefaultLanguage();

const defaults: StoredSettings = {
  language: defaultLanguage,
  onboardingComplete: false,
  favorites: [],
  progress: {},
  playbackRate: 1,
  textSize: 'medium',
  themeMode: 'system',
  queueIds: [],
  repeatMode: 'off',
};

interface AppContextValue extends StoredSettings {
  hydrated: boolean;
  colors: ThemeColors;
  isDark: boolean;
  t: (key: string) => string;
  setLanguage: (language: Language) => void;
  completeOnboarding: () => void;
  toggleFavorite: (storyId: string) => void;
  isFavorite: (storyId: string) => boolean;
  setProgress: (storyId: string, seconds: number) => void;
  resetProgress: () => void;
  setPlaybackRate: (rate: number) => void;
  setTextSize: (size: StoredSettings['textSize']) => void;
  setThemeMode: (mode: ThemeMode) => void;
  setQueueIds: (storyIds: string[]) => void;
  addToQueue: (storyId: string) => void;
  removeFromQueue: (storyId: string) => void;
  clearQueue: () => void;
  isQueued: (storyId: string) => boolean;
  setRepeatMode: (mode: RepeatMode) => void;
}

const AppContext = createContext<AppContextValue | null>(null);

/**
 * Хранит общие настройки приложения и передаёт их всем экранам.
 * Здесь находятся язык, избранное, прогресс прослушивания и размер текста.
 */
export function AppProvider({ children }: PropsWithChildren) {
  const systemColorScheme = useColorScheme();
  const [settings, setSettings] = useState(defaults);
  const [hydrated, setHydrated] = useState(false);
  const initialLoad = useRef(true);

  // При первом запуске читаем настройки, но не позволяем медленному хранилищу удерживать заставку.
  useEffect(() => {
    let finished = false;

    /**
     * Завершает загрузку один раз и переводит приложение к основному интерфейсу.
     */
    const finishHydration = (stored: StoredSettings | null) => {
      if (finished) return;
      finished = true;
      if (stored) {
        setSettings({ ...defaults, ...stored });
      }
      setHydrated(true);
      initialLoad.current = false;
    };

    const timeout = setTimeout(() => finishHydration(null), SETTINGS_LOAD_TIMEOUT_MS);
    loadSettings()
      .then(finishHydration)
      .finally(() => clearTimeout(timeout));

    return () => {
      finished = true;
      clearTimeout(timeout);
    };
  }, []);

  // После любого изменения настроек сохраняем их с небольшой задержкой.
  useEffect(() => {
    if (!hydrated || initialLoad.current) return;
    const timeout = setTimeout(() => saveSettings(settings), 250);
    return () => clearTimeout(timeout);
  }, [hydrated, settings]);

  /**
   * Частично обновляет настройки, сохраняя поля, которые не были переданы.
   */
  const patch = useCallback((next: Partial<StoredSettings>) => {
    setSettings((current) => ({ ...current, ...next }));
  }, []);

  /**
   * Полностью заменяет очередь и удаляет из неё пустые или повторяющиеся идентификаторы.
   */
  const setQueueIds = useCallback((storyIds: string[]) => {
    const uniqueIds = [...new Set(storyIds.filter(Boolean))];
    setSettings((current) => ({ ...current, queueIds: uniqueIds }));
  }, []);

  /**
   * Добавляет сказку в конец очереди, если её там ещё нет.
   */
  const addToQueue = useCallback((storyId: string) => {
    setSettings((current) => ({
      ...current,
      queueIds: current.queueIds.includes(storyId)
        ? current.queueIds
        : [...current.queueIds, storyId],
    }));
  }, []);

  /**
   * Удаляет выбранную сказку из сохранённой очереди.
   */
  const removeFromQueue = useCallback((storyId: string) => {
    setSettings((current) => ({
      ...current,
      queueIds: current.queueIds.filter((id) => id !== storyId),
    }));
  }, []);

  /**
   * Очищает всю очередь, не останавливая текущую сказку.
   */
  const clearQueue = useCallback(() => {
    patch({ queueIds: [] });
  }, [patch]);

  /**
   * Сохраняет выбранный режим повтора: выключен, одна сказка или вся очередь.
   */
  const setRepeatMode = useCallback(
    (repeatMode: RepeatMode) => {
      patch({ repeatMode });
    },
    [patch],
  );

  const isDark =
    settings.themeMode === 'dark' ||
    (settings.themeMode === 'system' && systemColorScheme === 'dark');
  const colors = isDark ? darkPalette : lightPalette;

  // Собираем публичный API контекста, которым пользуются экраны приложения.
  const value = useMemo<AppContextValue>(
    () => ({
      ...settings,
      hydrated,
      colors,
      isDark,
      t: (key) => copy[settings.language][key] ?? key,
      setLanguage: (language) => patch({ language }),
      completeOnboarding: () => patch({ onboardingComplete: true }),
      toggleFavorite: (storyId) =>
        setSettings((current) => ({
          ...current,
          favorites: current.favorites.includes(storyId)
            ? current.favorites.filter((id) => id !== storyId)
            : [...current.favorites, storyId],
        })),
      isFavorite: (storyId) => settings.favorites.includes(storyId),
      setProgress: (storyId, seconds) =>
        setSettings((current) => ({
          ...current,
          progress: { ...current.progress, [storyId]: Math.max(0, seconds) },
        })),
      resetProgress: () => patch({ progress: {} }),
      setPlaybackRate: (playbackRate) => patch({ playbackRate }),
      setTextSize: (textSize) => patch({ textSize }),
      setThemeMode: (themeMode) => patch({ themeMode }),
      setQueueIds,
      addToQueue,
      removeFromQueue,
      clearQueue,
      isQueued: (storyId) => settings.queueIds.includes(storyId),
      setRepeatMode,
    }),
    [
      addToQueue,
      clearQueue,
      colors,
      hydrated,
      isDark,
      patch,
      removeFromQueue,
      setQueueIds,
      setRepeatMode,
      settings,
    ],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

/**
 * Возвращает настройки и действия AppContext.
 * Если хук вызван вне AppProvider, сразу сообщает разработчику об ошибке.
 */
export function useApp() {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used inside AppProvider');
  return context;
}
