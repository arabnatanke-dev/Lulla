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
type SettingsUpdater = (current: StoredSettings) => StoredSettings;

/**
 * Хранит общие настройки приложения и передаёт их всем экранам.
 * Здесь находятся язык, избранное, прогресс прослушивания и размер текста.
 */
export function AppProvider({ children }: PropsWithChildren) {
  const systemColorScheme = useColorScheme();
  const [settings, setSettings] = useState(defaults);
  const [hydrated, setHydrated] = useState(false);
  const [storageReady, setStorageReady] = useState(false);
  const storageReadyRef = useRef(false);
  const pendingUpdaters = useRef<SettingsUpdater[]>([]);

  // При первом запуске читаем настройки, но не позволяем медленному хранилищу удерживать заставку.
  useEffect(() => {
    let mounted = true;
    const timeout = setTimeout(() => {
      if (mounted) setHydrated(true);
    }, SETTINGS_LOAD_TIMEOUT_MS);

    loadSettings(defaults)
      .then((stored) => {
        if (!mounted) return;
        const baseSettings = stored ?? defaults;

        // Все действия после аварийного таймаута накладываем поверх дисковых данных по порядку.
        const mergedSettings = pendingUpdaters.current.reduce(
          (current, updater) => updater(current),
          baseSettings,
        );
        pendingUpdaters.current = [];
        storageReadyRef.current = true;
        setStorageReady(true);
        setSettings(mergedSettings);
        setHydrated(true);
      })
      .finally(() => clearTimeout(timeout));

    return () => {
      mounted = false;
      clearTimeout(timeout);
    };
  }, []);

  // После любого изменения сохраняем настройки, но только когда исходное чтение уже завершилось.
  useEffect(() => {
    if (!hydrated || !storageReady) return;
    const timeout = setTimeout(() => saveSettings(settings), 250);
    return () => clearTimeout(timeout);
  }, [hydrated, settings, storageReady]);

  /**
   * Применяет пользовательское изменение сразу и временно запоминает его до окончания чтения.
   * Благодаря очереди поздняя hydration сохраняет избранное, очередь и прогресс пользователя.
   */
  const updateSettings = useCallback(
    (updater: SettingsUpdater) => {
      if (!storageReadyRef.current) {
        pendingUpdaters.current.push(updater);
      }
      setSettings(updater);
    },
    [],
  );

  /**
   * Частично обновляет настройки, сохраняя поля, которые не были переданы.
   */
  const patch = useCallback(
    (next: Partial<StoredSettings>) => {
      updateSettings((current) => ({ ...current, ...next }));
    },
    [updateSettings],
  );

  /**
   * Полностью заменяет очередь и удаляет из неё пустые или повторяющиеся идентификаторы.
   */
  const setQueueIds = useCallback((storyIds: string[]) => {
    const uniqueIds = [...new Set(storyIds.filter(Boolean))];
    updateSettings((current) => ({ ...current, queueIds: uniqueIds }));
  }, [updateSettings]);

  /**
   * Добавляет сказку в конец очереди, если её там ещё нет.
   */
  const addToQueue = useCallback((storyId: string) => {
    updateSettings((current) => ({
      ...current,
      queueIds: current.queueIds.includes(storyId)
        ? current.queueIds
        : [...current.queueIds, storyId],
    }));
  }, [updateSettings]);

  /**
   * Удаляет выбранную сказку из сохранённой очереди.
   */
  const removeFromQueue = useCallback((storyId: string) => {
    updateSettings((current) => ({
      ...current,
      queueIds: current.queueIds.filter((id) => id !== storyId),
    }));
  }, [updateSettings]);

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

  /**
   * Возвращает переведённую строку и безопасно подставляет русский текст при неизвестном ключе.
   */
  const t = useCallback(
    (key: string) => copy[settings.language]?.[key] ?? copy.ru[key] ?? key,
    [settings.language],
  );

  /**
   * Переключает состояние избранного для выбранной сказки.
   */
  const toggleFavorite = useCallback(
    (storyId: string) => {
      updateSettings((current) => ({
        ...current,
        favorites: current.favorites.includes(storyId)
          ? current.favorites.filter((id) => id !== storyId)
          : [...current.favorites, storyId],
      }));
    },
    [updateSettings],
  );

  /**
   * Проверяет, находится ли сказка в списке избранного.
   */
  const isFavorite = useCallback(
    (storyId: string) => settings.favorites.includes(storyId),
    [settings.favorites],
  );

  /**
   * Сохраняет безопасную неотрицательную позицию прослушивания.
   */
  const setProgress = useCallback(
    (storyId: string, seconds: number) => {
      updateSettings((current) => ({
        ...current,
        progress: { ...current.progress, [storyId]: Math.max(0, seconds) },
      }));
    },
    [updateSettings],
  );

  /**
   * Проверяет, находится ли сказка в очереди воспроизведения.
   */
  const isQueued = useCallback(
    (storyId: string) => settings.queueIds.includes(storyId),
    [settings.queueIds],
  );

  /**
   * Сохраняет выбранную скорость для текущей и следующих сказок.
   */
  const changePlaybackRate = useCallback(
    (playbackRate: number) => patch({ playbackRate }),
    [patch],
  );

  // Собираем публичный API контекста, которым пользуются экраны приложения.
  const value = useMemo<AppContextValue>(
    () => ({
      ...settings,
      hydrated,
      colors,
      isDark,
      t,
      setLanguage: (language) => patch({ language }),
      completeOnboarding: () => patch({ onboardingComplete: true }),
      toggleFavorite,
      isFavorite,
      setProgress,
      resetProgress: () => patch({ progress: {} }),
      setPlaybackRate: changePlaybackRate,
      setTextSize: (textSize) => patch({ textSize }),
      setThemeMode: (themeMode) => patch({ themeMode }),
      setQueueIds,
      addToQueue,
      removeFromQueue,
      clearQueue,
      isQueued,
      setRepeatMode,
    }),
    [
      addToQueue,
      changePlaybackRate,
      clearQueue,
      colors,
      hydrated,
      isFavorite,
      isDark,
      isQueued,
      patch,
      removeFromQueue,
      setQueueIds,
      setRepeatMode,
      settings,
      setProgress,
      t,
      toggleFavorite,
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
