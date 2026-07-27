import {
  setAudioModeAsync,
  useAudioPlayer,
  useAudioPlayerStatus,
} from "expo-audio";
import React, {
  createContext,
  PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { useApp } from "@/src/context/app-context";
import { getStory } from "@/src/data/stories";
import type { RepeatMode, Story } from "@/src/types";
import { resolveFinishedPlayback } from "@/src/utils/playback-queue";

type TimerChoice = 5 | 10 | 15 | 30 | "end" | null;
const AUDIO_WATCHDOG_TIMEOUT_MS = 15_000;

interface AudioContextValue {
  activeStory: Story | null;
  playing: boolean;
  loadingStoryId: string | null;
  isBuffering: boolean;
  audioError: string | null;
  currentTime: number;
  duration: number;
  timerChoice: TimerChoice;
  timerRemaining: number | null;
  queue: Story[];
  repeatMode: RepeatMode;
  startStory: (story: Story) => Promise<boolean>;
  playNext: () => Promise<boolean>;
  playQueuedStory: (storyId: string) => Promise<boolean>;
  addToQueue: (story: Story) => void;
  removeFromQueue: (storyId: string) => void;
  clearQueue: () => void;
  isQueued: (storyId: string) => boolean;
  setRepeatMode: (mode: RepeatMode) => void;
  toggle: () => Promise<void>;
  seekTo: (seconds: number) => Promise<void>;
  skipBy: (seconds: number) => Promise<void>;
  close: () => void;
  setRate: (rate: number) => void;
  setSleepTimer: (choice: TimerChoice) => void;
  clearAudioError: () => void;
  retryPlayback: () => Promise<boolean>;
}

const AudioContext = createContext<AudioContextValue | null>(null);
type AudioActionsValue = Pick<
  AudioContextValue,
  | "startStory"
  | "playNext"
  | "playQueuedStory"
  | "addToQueue"
  | "removeFromQueue"
  | "clearQueue"
  | "isQueued"
  | "setRepeatMode"
  | "toggle"
  | "seekTo"
  | "skipBy"
  | "close"
  | "setRate"
  | "setSleepTimer"
  | "clearAudioError"
  | "retryPlayback"
>;
const AudioActionsContext = createContext<AudioActionsValue | null>(null);

/**
 * Управляет единственным аудиоплеером во всём приложении.
 * Благодаря этому две сказки не могут играть одновременно, а мини-плеер видит общее состояние.
 */
export function AudioProvider({ children }: PropsWithChildren) {
  const {
    language,
    playbackRate,
    progress,
    queueIds,
    repeatMode,
    setPlaybackRate,
    setProgress,
    setQueueIds,
    addToQueue: addStoryIdToQueue,
    removeFromQueue,
    clearQueue,
    isQueued,
    setRepeatMode,
  } = useApp();
  const [activeStory, setActiveStory] = useState<Story | null>(null);
  const [loadingStoryId, setLoadingStoryId] = useState<string | null>(null);
  const [audioError, setAudioError] = useState<string | null>(null);
  const [timerChoice, setTimerChoiceState] = useState<TimerChoice>(null);
  const [timerEndAt, setTimerEndAt] = useState<number | null>(null);
  const [timerRemaining, setTimerRemaining] = useState<number | null>(null);
  const lastSavedSecond = useRef(0);
  const handledFinish = useRef(false);
  const lastRequestedStory = useRef<Story | null>(null);
  const playbackOperation = useRef(0);
  const audioModeNeedsRetry = useRef(false);
  const playbackRequestedRef = useRef(false);
  const [playbackRequested, setPlaybackRequestedState] = useState(false);
  const player = useAudioPlayer(null, { updateInterval: 500 });
  const status = useAudioPlayerStatus(player);
  const activeStoryRef = useRef(activeStory);
  const loadingStoryIdRef = useRef(loadingStoryId);
  const playbackStatusRef = useRef(status);
  activeStoryRef.current = activeStory;
  loadingStoryIdRef.current = loadingStoryId;
  playbackStatusRef.current = status;
  const queue = useMemo(
    () =>
      queueIds
        .map((storyId) => getStory(storyId))
        .filter((story): story is Story => Boolean(story)),
    [queueIds],
  );

  /**
   * Сохраняет техническую ошибку аудио и переводит интерфейс из состояния загрузки.
   */
  const handleAudioError = useCallback((error: unknown) => {
    const message = error instanceof Error ? error.message : String(error);
    console.warn("Audio playback error", error);
    setAudioError(message);
    setLoadingStoryId(null);
  }, []);

  /**
   * Запоминает намерение пользователя слушать сказку.
   * Отдельный ref позволяет watchdog сразу отличить буферизацию от обычной ручной паузы.
   */
  const setPlaybackRequested = useCallback((requested: boolean) => {
    playbackRequestedRef.current = requested;
    setPlaybackRequestedState(requested);
  }, []);

  /**
   * Включает системный аудиорежим для фонового воспроизведения.
   * Ошибка попадает в общий баннер, а флаг позволяет кнопке «Ещё раз» повторить настройку.
   */
  const configureAudioMode = useCallback(async () => {
    try {
      await setAudioModeAsync({
        playsInSilentMode: true,
        shouldPlayInBackground: true,
        interruptionMode: "doNotMix",
      });
      audioModeNeedsRetry.current = false;
      return true;
    } catch (error) {
      audioModeNeedsRetry.current = true;
      handleAudioError(error);
      return false;
    }
  }, [handleAudioError]);

  // Настраиваем воспроизведение в беззвучном режиме iOS и в фоне при запуске провайдера.
  useEffect(() => {
    void configureAudioMode();
  }, [configureAudioMode]);

  /**
   * Удаляет сообщение об ошибке после того, как пользователь его прочитал.
   */
  const clearAudioError = useCallback(() => {
    setAudioError(null);
  }, []);

  // Каждые пять секунд записываем позицию сказки, не перегружая локальное хранилище.
  useEffect(() => {
    if (!activeStory || !status.currentTime) return;
    const second = Math.floor(status.currentTime);
    if (second - lastSavedSecond.current >= 5) {
      lastSavedSecond.current = second;
      setProgress(activeStory.id, second);
    }
  }, [activeStory, setProgress, status.currentTime]);

  // Останавливаем действительно зависшую загрузку, но не считаем ручную паузу ошибкой.
  useEffect(() => {
    const waitsForSource = playbackRequested && Boolean(loadingStoryId);
    const waitsForPlayback =
      playbackRequested &&
      Boolean(activeStory) &&
      !status.didJustFinish &&
      (status.isBuffering ||
        !status.isLoaded ||
        status.timeControlStatus === "waiting");

    if (!waitsForSource && !waitsForPlayback) return;

    const operationId = playbackOperation.current;
    const storyId = loadingStoryId ?? activeStory?.id ?? null;

    /**
     * Повторно проверяет состояние через 15 секунд и игнорирует уже отменённую операцию.
     */
    const watchdog = setTimeout(() => {
      if (operationId !== playbackOperation.current) return;

      const currentStatus = playbackStatusRef.current;
      const sourceStillLoading =
        playbackRequestedRef.current &&
        Boolean(storyId) &&
        loadingStoryIdRef.current === storyId;
      const playbackStillWaiting =
        playbackRequestedRef.current &&
        activeStoryRef.current?.id === storyId &&
        !currentStatus.didJustFinish &&
        (currentStatus.isBuffering ||
          !currentStatus.isLoaded ||
          currentStatus.timeControlStatus === "waiting");

      if (!sourceStillLoading && !playbackStillWaiting) return;

      setPlaybackRequested(false);
      lastRequestedStory.current = activeStoryRef.current;
      try {
        player.pause();
      } catch (error) {
        console.warn("Unable to pause stalled audio", error);
      }
      handleAudioError(
        new Error(
          language === "ru"
            ? "Аудио не загрузилось за 15 секунд. Попробуйте ещё раз."
            : "Audio did not load within 15 seconds. Please try again.",
        ),
      );
    }, AUDIO_WATCHDOG_TIMEOUT_MS);

    return () => clearTimeout(watchdog);
  }, [
    activeStory,
    handleAudioError,
    language,
    loadingStoryId,
    playbackRequested,
    player,
    setPlaybackRequested,
    status.didJustFinish,
    status.isBuffering,
    status.isLoaded,
    status.timeControlStatus,
  ]);

  // Считаем оставшееся время таймера и останавливаем звук в нужный момент.
  useEffect(() => {
    if (!timerEndAt) {
      setTimerRemaining(null);
      return;
    }

    /**
     * Пересчитывает остаток таймера раз в секунду.
     */
    const tick = () => {
      const remaining = Math.max(
        0,
        Math.ceil((timerEndAt - Date.now()) / 1000),
      );
      setTimerRemaining(remaining);
      if (remaining === 0) {
        setPlaybackRequested(false);
        player.pause();
        setTimerChoiceState(null);
        setTimerEndAt(null);
      }
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [player, setPlaybackRequested, timerEndAt]);

  /**
   * Загружает выбранную сказку, восстанавливает её позицию и запускает воспроизведение.
   */
  const startStory = useCallback(
    async (story: Story, forceReload = false) => {
      const operationId = ++playbackOperation.current;
      lastRequestedStory.current = story;
      setPlaybackRequested(true);
      setLoadingStoryId(story.id);
      setAudioError(null);

      try {
        const previousStory = activeStoryRef.current;
        const currentStatus = playbackStatusRef.current;
        const isNew = forceReload || previousStory?.id !== story.id;
        if (isNew) {
          if (previousStory) {
            setProgress(
              previousStory.id,
              currentStatus.didJustFinish ? 0 : currentStatus.currentTime || 0,
            );
          }
          player.replace(story.audio[language]);
          activeStoryRef.current = story;
          setActiveStory(story);
          const savedPosition = progress[story.id] ?? 0;
          lastSavedSecond.current = Math.floor(savedPosition);
          if (savedPosition > 0) await player.seekTo(savedPosition);
        }

        if (operationId !== playbackOperation.current) return false;
        // После replace старый didJustFinish может ещё относиться к предыдущему файлу.
        if (!isNew && playbackStatusRef.current.didJustFinish) {
          await player.seekTo(0);
        }
        if (operationId !== playbackOperation.current) return false;
        player.setPlaybackRate(playbackRate);

        // Ошибка системных кнопок не должна мешать обычному воспроизведению в приложении.
        try {
          player.setActiveForLockScreen(
            true,
            {
              title: story.title[language],
              artist: "Lulla",
              albumTitle:
                language === "ru" ? "Сказки перед сном" : "Bedtime stories",
            },
            {
              showSeekBackward: true,
              showSeekForward: true,
            },
          );
        } catch (error) {
          console.warn("Unable to enable lock screen controls", error);
        }

        player.play();
        setLoadingStoryId(null);
        return true;
      } catch (error) {
        if (operationId === playbackOperation.current) {
          setPlaybackRequested(false);
          handleAudioError(error);
        }
        return false;
      }
    },
    [
      language,
      playbackRate,
      player,
      progress,
      handleAudioError,
      setPlaybackRequested,
      setProgress,
    ],
  );

  /**
   * Запускает первую сказку из очереди и сразу удаляет её из списка ожидания.
   */
  const playNext = useCallback(async () => {
    const nextStory = queue[0];
    if (!nextStory) return false;
    const started = await startStory(nextStory);
    if (started) {
      setQueueIds(queueIds.filter((storyId) => storyId !== nextStory.id));
    }
    return started;
  }, [queue, queueIds, setQueueIds, startStory]);

  /**
   * Запускает выбранную позицию очереди, не меняя порядок остальных сказок.
   */
  const playQueuedStory = useCallback(
    async (storyId: string) => {
      const story = getStory(storyId);
      if (!story) return false;
      const started = await startStory(story);
      if (started) removeFromQueue(storyId);
      return started;
    },
    [removeFromQueue, startStory],
  );

  /**
   * Повторяет последнюю попытку запуска сказки после пользовательского нажатия «Ещё раз».
   */
  const retryPlayback = useCallback(async () => {
    setAudioError(null);
    if (audioModeNeedsRetry.current) {
      const configured = await configureAudioMode();
      if (!configured) return false;
    }
    if (!lastRequestedStory.current) return true;
    return startStory(lastRequestedStory.current, true);
  }, [configureAudioMode, startStory]);

  /**
   * Добавляет объект сказки в сохранённую очередь по его идентификатору.
   */
  const addToQueue = useCallback(
    (story: Story) => {
      addStoryIdToQueue(story.id);
    },
    [addStoryIdToQueue],
  );

  // После окончания выбираем повтор текущей сказки, следующую в очереди или обычную остановку.
  useEffect(() => {
    if (!status.didJustFinish) {
      handledFinish.current = false;
      return;
    }
    if (!activeStory || handledFinish.current) return;
    handledFinish.current = true;
    const operationId = playbackOperation.current;

    /**
     * Завершает текущую сказку и применяет выбранный пользователем сценарий продолжения.
     */
    const handleFinishedStory = async () => {
      setProgress(activeStory.id, 0);
      lastSavedSecond.current = 0;
      const action = resolveFinishedPlayback({
        activeStoryId: activeStory.id,
        queueIds,
        repeatMode,
        stopAtEnd: timerChoice === "end",
      });

      if (timerChoice === "end") {
        setTimerChoiceState(null);
        setTimerEndAt(null);
      }

      if (action.kind === "replay") {
        setPlaybackRequested(true);
        await player.seekTo(0);
        if (
          operationId !== playbackOperation.current ||
          activeStoryRef.current?.id !== activeStory.id
        ) {
          return;
        }
        player.play();
        return;
      }

      if (action.kind === "next") {
        const nextStory = getStory(action.nextStoryId);
        if (!nextStory) {
          setQueueIds(action.nextQueueIds);
          setPlaybackRequested(false);
          throw new Error(`Queue story "${action.nextStoryId}" was not found`);
        }
        const started = await startStory(nextStory);
        if (started) setQueueIds(action.nextQueueIds);
        return;
      }

      setPlaybackRequested(false);
    };

    handleFinishedStory().catch((error) => {
      if (operationId !== playbackOperation.current) return;
      setPlaybackRequested(false);
      handleAudioError(error);
    });
  }, [
    activeStory,
    handleAudioError,
    player,
    queueIds,
    repeatMode,
    setPlaybackRequested,
    setProgress,
    setQueueIds,
    startStory,
    status.didJustFinish,
    timerChoice,
  ]);

  // При смене языка подменяем аудиофайл, сохраняя текущую позицию и состояние паузы.
  useEffect(() => {
    if (!activeStory) return;
    setLoadingStoryId(activeStory.id);

    /**
     * Меняет аудиофайл языка, сохраняя позицию и состояние воспроизведения.
     */
    const replaceLanguageSource = async () => {
      const operationId = ++playbackOperation.current;
      try {
        const wasPlaying = playbackRequestedRef.current || status.playing;
        const currentTime = status.currentTime || 0;
        player.replace(activeStory.audio[language]);
        player.updateLockScreenMetadata({
          title: activeStory.title[language],
          artist: "Lulla",
          albumTitle: language === "ru" ? "Сказки перед сном" : "Bedtime stories",
        });
        await player.seekTo(currentTime);
        if (operationId !== playbackOperation.current) return;
        if (wasPlaying) player.play();
        setLoadingStoryId(null);
      } catch (error) {
        if (operationId === playbackOperation.current) {
          setPlaybackRequested(false);
          handleAudioError(error);
        }
      }
    };

    replaceLanguageSource();
    // Only swap the source when the app language changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [language]);

  /**
   * Полностью закрывает плеер и сохраняет последнюю позицию текущей сказки.
   */
  const close = useCallback(() => {
    playbackOperation.current += 1;
    setPlaybackRequested(false);
    try {
      const currentStory = activeStoryRef.current;
      const currentStatus = playbackStatusRef.current;
      if (currentStory) setProgress(currentStory.id, currentStatus.currentTime || 0);
      player.pause();
      player.setActiveForLockScreen(false);
      activeStoryRef.current = null;
      setActiveStory(null);
      setLoadingStoryId(null);
      setAudioError(null);
      setTimerChoiceState(null);
      setTimerEndAt(null);
    } catch (error) {
      handleAudioError(error);
    }
  }, [handleAudioError, player, setPlaybackRequested, setProgress]);

  /**
   * Включает таймер на выбранное число минут, режим «до конца» или отключает его.
   */
  const setSleepTimer = useCallback((choice: TimerChoice) => {
    setTimerChoiceState(choice);
    if (typeof choice === "number") {
      setTimerEndAt(Date.now() + choice * 60 * 1000);
    } else {
      setTimerEndAt(null);
    }
  }, []);

  /**
   * Переключает воспроизведение и после завершения начинает сказку с самого начала.
   */
  const toggle = useCallback(async () => {
    if (!activeStoryRef.current) return;
    try {
      const currentStatus = playbackStatusRef.current;
      if (currentStatus.playing) {
        setPlaybackRequested(false);
        player.pause();
        return;
      }
      if (currentStatus.didJustFinish) await player.seekTo(0);
      setPlaybackRequested(true);
      player.play();
    } catch (error) {
      setPlaybackRequested(false);
      handleAudioError(error);
    }
  }, [handleAudioError, player, setPlaybackRequested]);

  /**
   * Перемещает воспроизведение на точную позицию, не позволяя уйти в отрицательное время.
   */
  const seekTo = useCallback(
    async (seconds: number) => {
      try {
        const safeSeconds = Math.max(0, seconds);
        await player.seekTo(safeSeconds);
        lastSavedSecond.current = Math.floor(safeSeconds);
      } catch (error) {
        handleAudioError(error);
      }
    },
    [handleAudioError, player],
  );

  /**
   * Перематывает сказку относительно текущей позиции и учитывает её длительность.
   */
  const skipBy = useCallback(
    async (seconds: number) => {
      try {
        const currentStatus = playbackStatusRef.current;
        const nextPosition = Math.max(
          0,
          Math.min(
            currentStatus.duration || Infinity,
            currentStatus.currentTime + seconds,
          ),
        );
        await player.seekTo(nextPosition);
        lastSavedSecond.current = Math.floor(nextPosition);
      } catch (error) {
        handleAudioError(error);
      }
    },
    [handleAudioError, player],
  );

  /**
   * Меняет скорость текущего плеера и сохраняет её для следующих запусков.
   */
  const setRate = useCallback(
    (rate: number) => {
      try {
        player.setPlaybackRate(rate);
        setPlaybackRate(rate);
      } catch (error) {
        handleAudioError(error);
      }
    },
    [handleAudioError, player, setPlaybackRate],
  );

  // Формируем набор данных и команд, доступный плееру, читалке и мини-плееру.
  const value = useMemo<AudioContextValue>(
    () => ({
      activeStory,
      playing: Boolean(status.playing),
      loadingStoryId,
      isBuffering: Boolean(status.isBuffering),
      audioError,
      currentTime: status.currentTime || 0,
      duration: status.duration || activeStory?.durationSeconds[language] || 0,
      timerChoice,
      timerRemaining,
      queue,
      repeatMode,
      startStory,
      playNext,
      playQueuedStory,
      addToQueue,
      removeFromQueue,
      clearQueue,
      isQueued,
      setRepeatMode,
      toggle,
      seekTo,
      skipBy,
      close,
      setRate,
      setSleepTimer,
      clearAudioError,
      retryPlayback,
    }),
    [
      activeStory,
      addToQueue,
      audioError,
      clearQueue,
      clearAudioError,
      close,
      isQueued,
      loadingStoryId,
      language,
      playNext,
      playQueuedStory,
      queue,
      removeFromQueue,
      repeatMode,
      retryPlayback,
      seekTo,
      setRate,
      setRepeatMode,
      setSleepTimer,
      skipBy,
      startStory,
      status.currentTime,
      status.duration,
      status.isBuffering,
      status.playing,
      timerChoice,
      timerRemaining,
      toggle,
    ],
  );

  // Отделяем стабильные команды от позиции аудио, которая обновляется каждые 500 миллисекунд.
  const actionsValue = useMemo<AudioActionsValue>(
    () => ({
      startStory,
      playNext,
      playQueuedStory,
      addToQueue,
      removeFromQueue,
      clearQueue,
      isQueued,
      setRepeatMode,
      toggle,
      seekTo,
      skipBy,
      close,
      setRate,
      setSleepTimer,
      clearAudioError,
      retryPlayback,
    }),
    [
      addToQueue,
      clearAudioError,
      clearQueue,
      close,
      isQueued,
      playNext,
      playQueuedStory,
      removeFromQueue,
      retryPlayback,
      seekTo,
      setRate,
      setRepeatMode,
      setSleepTimer,
      skipBy,
      startStory,
      toggle,
    ],
  );

  return (
    <AudioActionsContext.Provider value={actionsValue}>
      <AudioContext.Provider value={value}>{children}</AudioContext.Provider>
    </AudioActionsContext.Provider>
  );
}

/**
 * Возвращает состояние и команды общего аудиоплеера.
 * Хук разрешено использовать только внутри AudioProvider.
 */
export function useAudio() {
  const context = useContext(AudioContext);
  if (!context) throw new Error("useAudio must be used inside AudioProvider");
  return context;
}

/**
 * Возвращает только команды плеера без часто меняющейся позиции воспроизведения.
 * Экраны каталога благодаря этому не перерисовываются каждые полсекунды.
 */
export function useAudioActions() {
  const context = useContext(AudioActionsContext);
  if (!context) throw new Error("useAudioActions must be used inside AudioProvider");
  return context;
}
