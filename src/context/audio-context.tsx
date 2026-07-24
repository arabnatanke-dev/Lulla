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
import type { Story } from '@/src/types';

type TimerChoice = 5 | 10 | 15 | 30 | 'end' | null;

interface AudioContextValue {
  activeStory: Story | null;
  playing: boolean;
  currentTime: number;
  duration: number;
  timerChoice: TimerChoice;
  timerRemaining: number | null;
  startStory: (story: Story) => Promise<void>;
  toggle: () => void;
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
  const { language, playbackRate, progress, setPlaybackRate, setProgress } = useApp();
  const [activeStory, setActiveStory] = useState<Story | null>(null);
  const [timerChoice, setTimerChoiceState] = useState<TimerChoice>(null);
  const [timerEndAt, setTimerEndAt] = useState<number | null>(null);
  const [timerRemaining, setTimerRemaining] = useState<number | null>(null);
  const lastSavedSecond = useRef(0);
  const player = useAudioPlayer(null, { updateInterval: 500 });
  const status = useAudioPlayerStatus(player);

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

  // После окончания сказки сбрасываем её прогресс и таймер «до конца».
  useEffect(() => {
    if (!activeStory || !status.didJustFinish) return;
    setProgress(activeStory.id, 0);
    if (timerChoice === 'end') setTimerChoiceState(null);
  }, [activeStory, setProgress, status.didJustFinish, timerChoice]);

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
          setProgress(activeStory.id, status.currentTime || 0);
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

  // Формируем набор данных и команд, доступный плееру, читалке и мини-плееру.
  const value = useMemo<AudioContextValue>(
    () => ({
      activeStory,
      playing: Boolean(status.playing),
      currentTime: status.currentTime || 0,
      duration: status.duration || activeStory?.durationSeconds[language] || 0,
      timerChoice,
      timerRemaining,
      startStory,
      toggle: () => {
        if (!activeStory) return;
        if (status.playing) player.pause();
        else {
          if (status.didJustFinish) player.seekTo(0);
          player.play();
        }
      },
      seekTo: (seconds) => player.seekTo(Math.max(0, seconds)),
      skipBy: (seconds) =>
        player.seekTo(Math.max(0, Math.min(status.duration || Infinity, status.currentTime + seconds))),
      close,
      setRate: (rate) => {
        player.playbackRate = rate;
        setPlaybackRate(rate);
      },
      setSleepTimer,
    }),
    [
      activeStory,
      close,
      language,
      player,
      setPlaybackRate,
      setSleepTimer,
      startStory,
      status.currentTime,
      status.didJustFinish,
      status.duration,
      status.playing,
      timerChoice,
      timerRemaining,
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
