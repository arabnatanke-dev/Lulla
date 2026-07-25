import {
  setAudioModeAsync,
  useAudioPlayer,
  useAudioPlayerStatus,
} from 'expo-audio';
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

import { useApp } from '@/src/context/app-context';
import { getStory } from '@/src/data/stories';
import type { RepeatMode, Story } from '@/src/types';
import { resolveFinishedPlayback } from '@/src/utils/playback-queue';

type TimerChoice = 5 | 10 | 15 | 30 | 'end' | null;

interface AudioContextValue {
  activeStory: Story | null;
  playing: boolean;
  currentTime: number;
  duration: number;
  timerChoice: TimerChoice;
  timerRemaining: number | null;
  queue: Story[];
  repeatMode: RepeatMode;
  startStory: (story: Story) => Promise<void>;
  playNext: () => Promise<void>;
  playQueuedStory: (storyId: string) => Promise<void>;
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
}

const AudioContext = createContext<AudioContextValue | null>(null);

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
  const [timerChoice, setTimerChoiceState] = useState<TimerChoice>(null);
  const [timerEndAt, setTimerEndAt] = useState<number | null>(null);
  const [timerRemaining, setTimerRemaining] = useState<number | null>(null);
  const lastSavedSecond = useRef(0);
  const handledFinish = useRef(false);
  const player = useAudioPlayer(null, { updateInterval: 500 });
  const status = useAudioPlayerStatus(player);
  const queue = useMemo(
    () =>
      queueIds
        .map((storyId) => getStory(storyId))
        .filter((story): story is Story => Boolean(story)),
    [queueIds],
  );

  // Настраиваем воспроизведение в беззвучном режиме iOS и в фоне.
  useEffect(() => {
    setAudioModeAsync({
      playsInSilentMode: true,
      shouldPlayInBackground: true,
      interruptionMode: 'doNotMix',
    }).catch((error) => console.warn('Unable to configure audio', error));
  }, []);

  // Применяем сохранённую пользователем скорость к текущему аудиоплееру.
  useEffect(() => {
    player.playbackRate = playbackRate;
  }, [playbackRate, player]);

  // Каждые пять секунд записываем позицию сказки, не перегружая локальное хранилище.
  useEffect(() => {
    if (!activeStory || !status.currentTime) return;
    const second = Math.floor(status.currentTime);
    if (second - lastSavedSecond.current >= 5) {
      lastSavedSecond.current = second;
      setProgress(activeStory.id, second);
    }
  }, [activeStory, setProgress, status.currentTime]);

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
      const remaining = Math.max(0, Math.ceil((timerEndAt - Date.now()) / 1000));
      setTimerRemaining(remaining);
      if (remaining === 0) {
        player.pause();
        setTimerChoiceState(null);
        setTimerEndAt(null);
      }
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [player, timerEndAt]);

  /**
   * Загружает выбранную сказку, восстанавливает её позицию и запускает воспроизведение.
   */
  const startStory = useCallback(
    async (story: Story) => {
      const isNew = activeStory?.id !== story.id;
      if (isNew) {
        if (activeStory) {
          setProgress(activeStory.id, status.didJustFinish ? 0 : status.currentTime || 0);
        }
        player.replace(story.audio[language]);
        setActiveStory(story);
        const savedPosition = progress[story.id] ?? 0;
        lastSavedSecond.current = Math.floor(savedPosition);
        if (savedPosition > 0) await player.seekTo(savedPosition);
      }

      if (status.didJustFinish) await player.seekTo(0);
      player.playbackRate = playbackRate;
      player.setActiveForLockScreen(true, {
        title: story.title[language],
        artist: 'Dreamy Tales',
        albumTitle: language === 'ru' ? 'Сказки перед сном' : 'Bedtime stories',
      }, {
        showSeekBackward: true,
        showSeekForward: true,
      });
      player.play();
    },
    [
      activeStory,
      language,
      playbackRate,
      player,
      progress,
      setProgress,
      status.currentTime,
      status.didJustFinish,
    ],
  );

  /**
   * Запускает первую сказку из очереди и сразу удаляет её из списка ожидания.
   */
  const playNext = useCallback(async () => {
    const nextStory = queue[0];
    if (!nextStory) return;
    setQueueIds(queueIds.filter((storyId) => storyId !== nextStory.id));
    await startStory(nextStory);
  }, [queue, queueIds, setQueueIds, startStory]);

  /**
   * Запускает выбранную позицию очереди, не меняя порядок остальных сказок.
   */
  const playQueuedStory = useCallback(
    async (storyId: string) => {
      const story = getStory(storyId);
      if (!story) return;
      removeFromQueue(storyId);
      await startStory(story);
    },
    [removeFromQueue, startStory],
  );

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
        stopAtEnd: timerChoice === 'end',
      });

      if (timerChoice === 'end') {
        setTimerChoiceState(null);
        setTimerEndAt(null);
      }

      if (action.kind === 'replay') {
        await player.seekTo(0);
        player.play();
        return;
      }

      if (action.kind === 'next') {
        const nextStory = getStory(action.nextStoryId);
        if (!nextStory) return;
        setQueueIds(action.nextQueueIds);
        await startStory(nextStory);
      }
    };

    handleFinishedStory().catch((error) =>
      console.warn('Unable to continue playback queue', error),
    );
  }, [
    activeStory,
    player,
    queueIds,
    repeatMode,
    setProgress,
    setQueueIds,
    startStory,
    status.didJustFinish,
    timerChoice,
  ]);

  // При смене языка подменяем аудиофайл, сохраняя текущую позицию и состояние паузы.
  useEffect(() => {
    if (!activeStory) return;
    const wasPlaying = status.playing;
    const currentTime = status.currentTime || 0;
    player.replace(activeStory.audio[language]);
    player.updateLockScreenMetadata({
      title: activeStory.title[language],
      artist: 'Dreamy Tales',
      albumTitle: language === 'ru' ? 'Сказки перед сном' : 'Bedtime stories',
    });
    player.seekTo(currentTime).then(() => {
      if (wasPlaying) player.play();
    });
    // Only swap the source when the app language changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [language]);

  /**
   * Полностью закрывает плеер и сохраняет последнюю позицию текущей сказки.
   */
  const close = useCallback(() => {
    if (activeStory) setProgress(activeStory.id, status.currentTime || 0);
    player.pause();
    player.setActiveForLockScreen(false);
    player.replace(null);
    setActiveStory(null);
    setTimerChoiceState(null);
    setTimerEndAt(null);
  }, [activeStory, player, setProgress, status.currentTime]);

  /**
   * Включает таймер на выбранное число минут, режим «до конца» или отключает его.
   */
  const setSleepTimer = useCallback((choice: TimerChoice) => {
    setTimerChoiceState(choice);
    if (typeof choice === 'number') {
      setTimerEndAt(Date.now() + choice * 60 * 1000);
    } else {
      setTimerEndAt(null);
    }
  }, []);

  /**
   * Переключает воспроизведение и после завершения начинает сказку с самого начала.
   */
  const toggle = useCallback(async () => {
    if (!activeStory) return;
    if (status.playing) {
      player.pause();
      return;
    }
    if (status.didJustFinish) await player.seekTo(0);
    player.play();
  }, [activeStory, player, status.didJustFinish, status.playing]);

  /**
   * Перемещает воспроизведение на точную позицию, не позволяя уйти в отрицательное время.
   */
  const seekTo = useCallback(
    (seconds: number) => player.seekTo(Math.max(0, seconds)),
    [player],
  );

  /**
   * Перематывает сказку относительно текущей позиции и учитывает её длительность.
   */
  const skipBy = useCallback(
    (seconds: number) =>
      player.seekTo(
        Math.max(0, Math.min(status.duration || Infinity, status.currentTime + seconds)),
      ),
    [player, status.currentTime, status.duration],
  );

  /**
   * Меняет скорость текущего плеера и сохраняет её для следующих запусков.
   */
  const setRate = useCallback(
    (rate: number) => {
      player.playbackRate = rate;
      setPlaybackRate(rate);
    },
    [player, setPlaybackRate],
  );

  // Формируем набор данных и команд, доступный плееру, читалке и мини-плееру.
  const value = useMemo<AudioContextValue>(
    () => ({
      activeStory,
      playing: Boolean(status.playing),
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
    }),
    [
      activeStory,
      addToQueue,
      clearQueue,
      close,
      isQueued,
      language,
      playNext,
      playQueuedStory,
      queue,
      removeFromQueue,
      repeatMode,
      seekTo,
      setRate,
      setRepeatMode,
      setSleepTimer,
      skipBy,
      startStory,
      status.currentTime,
      status.duration,
      status.playing,
      timerChoice,
      timerRemaining,
      toggle,
    ],
  );

  return <AudioContext.Provider value={value}>{children}</AudioContext.Provider>;
}

/**
 * Возвращает состояние и команды общего аудиоплеера.
 * Хук разрешено использовать только внутри AudioProvider.
 */
export function useAudio() {
  const context = useContext(AudioContext);
  if (!context) throw new Error('useAudio must be used inside AudioProvider');
  return context;
}
