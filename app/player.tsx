import Ionicons from '@expo/vector-icons/Ionicons';
import Slider from '@react-native-community/slider';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { RoundButton } from '@/src/components/buttons';
import { radii, type ThemeColors } from '@/src/constants/theme';
import { useApp } from '@/src/context/app-context';
import { useAudio } from '@/src/context/audio-context';
import type { RepeatMode, Story } from '@/src/types';
import { formatTime } from '@/src/utils/format';

const rates = [0.75, 1, 1.25, 1.5];

/**
 * Показывает полноэкранный аудиоплеер с прогрессом, перемоткой, скоростью и таймером сна.
 */
export default function PlayerScreen() {
  const {
    language,
    t,
    playbackRate,
    toggleFavorite,
    isFavorite,
    colors: palette,
  } = useApp();
  const {
    activeStory,
    playing,
    currentTime,
    duration,
    toggle,
    seekTo,
    skipBy,
    close,
    setRate,
    timerChoice,
    timerRemaining,
    setSleepTimer,
    queue,
    repeatMode,
    setRepeatMode,
    playQueuedStory,
    removeFromQueue,
    clearQueue,
  } = useAudio();
  const [timerVisible, setTimerVisible] = useState(false);
  const [queueVisible, setQueueVisible] = useState(false);
  const styles = createStyles(palette);

  if (!activeStory) {
    return (
      <LinearGradient colors={[palette.navy, '#493F78']} style={styles.empty}>
        <Text style={styles.emptyText}>{t('audioUnavailable')}</Text>
        <Pressable onPress={() => router.replace('/(tabs)')}>
          <Text style={styles.emptyLink}>{t('goCatalog')}</Text>
        </Pressable>
      </LinearGradient>
    );
  }

  const timerLabel =
    timerRemaining !== null
      ? formatTime(timerRemaining)
      : timerChoice === 'end'
        ? t('endOfStory')
        : t('timerOff');
  const repeatLabel = {
    off: t('repeatOff'),
    one: t('repeatOne'),
    all: t('repeatAll'),
  }[repeatMode];

  /**
   * По кругу переключает три режима повтора: выключен, одна сказка и вся очередь.
   */
  const cycleRepeatMode = () => {
    const nextMode: Record<RepeatMode, RepeatMode> = {
      off: 'one',
      one: 'all',
      all: 'off',
    };
    setRepeatMode(nextMode[repeatMode]);
  };

  /**
   * Запускает выбранную сказку из очереди и закрывает окно очереди.
   */
  const handlePlayQueuedStory = (storyId: string) => {
    setQueueVisible(false);
    playQueuedStory(storyId).catch((error) =>
      console.warn('Unable to play queued story', error),
    );
  };

  return (
    <LinearGradient colors={['#101B3F', '#342D62', '#6C568E']} style={styles.gradient}>
      <SafeAreaView style={styles.safe}>
        <ScrollView
          contentContainerStyle={styles.playerContent}
          showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <RoundButton
              icon="chevron-down"
              color={palette.white}
              backgroundColor="rgba(255,255,255,0.12)"
              accessibilityLabel={t('back')}
              onPress={() => router.back()}
            />
            <View style={styles.headerCopy}>
              <Text style={styles.nowPlaying}>{t('player')}</Text>
              <Text style={styles.language}>{language === 'ru' ? 'Русский' : 'English'}</Text>
            </View>
            <RoundButton
              icon={isFavorite(activeStory.id) ? 'heart' : 'heart-outline'}
              color={isFavorite(activeStory.id) ? palette.peach : palette.white}
              backgroundColor="rgba(255,255,255,0.12)"
              accessibilityLabel={t('favorites')}
              onPress={() => toggleFavorite(activeStory.id)}
            />
          </View>

          <Image source={activeStory.coverImage} style={styles.cover} contentFit="cover" />
          <Text style={styles.title}>{activeStory.title[language]}</Text>

          <View style={styles.timeline}>
            <Slider
              style={styles.slider}
              minimumValue={0}
              maximumValue={Math.max(duration, 1)}
              value={Math.min(currentTime, duration || currentTime)}
              onSlidingComplete={seekTo}
              minimumTrackTintColor={palette.yellow}
              maximumTrackTintColor="rgba(255,255,255,0.22)"
              thumbTintColor={palette.yellow}
            />
            <View style={styles.times}>
              <Text style={styles.time}>{formatTime(currentTime)}</Text>
              <Text style={styles.time}>{formatTime(duration)}</Text>
            </View>
          </View>

          <View style={styles.controls}>
            <Pressable onPress={() => skipBy(-10)} style={styles.skipButton}>
              <Ionicons name="play-back" size={25} color={palette.white} />
              <Text style={styles.skipText}>10</Text>
            </Pressable>
            <Pressable onPress={toggle} style={styles.playButton}>
              <Ionicons name={playing ? 'pause' : 'play'} size={40} color={palette.navy} />
            </Pressable>
            <Pressable onPress={() => skipBy(10)} style={styles.skipButton}>
              <Ionicons name="play-forward" size={25} color={palette.white} />
              <Text style={styles.skipText}>10</Text>
            </Pressable>
          </View>

          <View style={styles.rates}>
            {rates.map((rate) => (
              <Pressable
                key={rate}
                onPress={() => setRate(rate)}
                style={[styles.rate, playbackRate === rate && styles.activeRate]}>
                <Text style={[styles.rateText, playbackRate === rate && styles.activeRateText]}>
                  {rate}×
                </Text>
              </Pressable>
            ))}
          </View>

          <View style={styles.actions}>
            <Pressable
              onPress={() => setTimerVisible(true)}
              style={({ pressed }) => [styles.action, pressed && styles.pressed]}>
              <Ionicons name="timer-outline" size={22} color={palette.yellow} />
              <View>
                <Text style={styles.actionTitle}>{t('sleepTimer')}</Text>
                <Text style={styles.actionSubtitle}>{timerLabel}</Text>
              </View>
            </Pressable>
            <Pressable
              onPress={cycleRepeatMode}
              style={({ pressed }) => [styles.action, pressed && styles.pressed]}>
              <View>
                <Ionicons
                  name="repeat"
                  size={22}
                  color={repeatMode === 'off' ? 'rgba(255,255,255,0.5)' : palette.yellow}
                />
                {repeatMode === 'one' ? <Text style={styles.repeatBadge}>1</Text> : null}
              </View>
              <View>
                <Text style={styles.actionTitle}>{t('repeat')}</Text>
                <Text style={styles.actionSubtitle}>{repeatLabel}</Text>
              </View>
            </Pressable>
            <Pressable
              onPress={() => setQueueVisible(true)}
              style={({ pressed }) => [styles.action, pressed && styles.pressed]}>
              <View>
                <Ionicons name="list-outline" size={22} color={palette.yellow} />
                {queue.length ? (
                  <View style={styles.queueBadge}>
                    <Text style={styles.queueBadgeText}>{queue.length}</Text>
                  </View>
                ) : null}
              </View>
              <View>
                <Text style={styles.actionTitle}>{t('queue')}</Text>
                <Text style={styles.actionSubtitle}>
                  {t('queueCount')}: {queue.length}
                </Text>
              </View>
            </Pressable>
            <Pressable
              onPress={() =>
                router.push({ pathname: '/reader/[id]', params: { id: activeStory.id } })
              }
              style={({ pressed }) => [styles.action, pressed && styles.pressed]}>
              <Ionicons name="book-outline" size={22} color={palette.yellow} />
              <Text style={styles.actionTitle}>{t('read')}</Text>
            </Pressable>
            <Pressable
              onPress={() => {
                close();
                router.replace('/(tabs)');
              }}
              style={({ pressed }) => [styles.action, pressed && styles.pressed]}>
              <Ionicons name="close-circle-outline" size={22} color={palette.peach} />
              <Text style={styles.actionTitle}>{t('closePlayer')}</Text>
            </Pressable>
          </View>
        </ScrollView>

        <TimerModal
          visible={timerVisible}
          onClose={() => setTimerVisible(false)}
          value={timerChoice}
          onSelect={(choice) => {
            setSleepTimer(choice);
            setTimerVisible(false);
          }}
        />
        <QueueModal
          visible={queueVisible}
          queue={queue}
          onClose={() => setQueueVisible(false)}
          onPlay={handlePlayQueuedStory}
          onRemove={removeFromQueue}
          onClear={clearQueue}
        />
      </SafeAreaView>
    </LinearGradient>
  );
}

/**
 * Показывает сохранённую очередь, позволяет выбрать следующую сказку,
 * удалить отдельную позицию или полностью очистить список.
 */
function QueueModal({
  visible,
  queue,
  onClose,
  onPlay,
  onRemove,
  onClear,
}: {
  visible: boolean;
  queue: Story[];
  onClose: () => void;
  onPlay: (storyId: string) => void;
  onRemove: (storyId: string) => void;
  onClear: () => void;
}) {
  const { language, t, colors: palette } = useApp();
  const styles = createStyles(palette);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={[styles.modal, styles.queueModal]} onPress={() => undefined}>
          <View style={styles.modalHeader}>
            <View>
              <Text style={styles.modalTitle}>{t('queue')}</Text>
              <Text style={styles.queueCounter}>
                {t('queueCount')}: {queue.length}
              </Text>
            </View>
            <Pressable onPress={onClose} hitSlop={8}>
              <Ionicons name="close" size={24} color={palette.text} />
            </Pressable>
          </View>

          {queue.length ? (
            <>
              <ScrollView style={styles.queueList} showsVerticalScrollIndicator={false}>
                {queue.map((story, index) => (
                  <Pressable
                    key={story.id}
                    accessibilityRole="button"
                    accessibilityLabel={`${t('playNext')}: ${story.title[language]}`}
                    onPress={() => onPlay(story.id)}
                    style={({ pressed }) => [
                      styles.queueRow,
                      pressed && styles.queueRowPressed,
                    ]}>
                    <View style={styles.queueOrder}>
                      <Text style={styles.queueOrderText}>{index + 1}</Text>
                    </View>
                    <Image source={story.coverImage} style={styles.queueCover} contentFit="cover" />
                    <View style={styles.queueStoryCopy}>
                      <Text style={styles.queueStoryTitle} numberOfLines={2}>
                        {story.title[language]}
                      </Text>
                      <Text style={styles.queueStoryMeta}>
                        {Math.round(story.durationSeconds[language] / 60)} {t('min')}
                      </Text>
                    </View>
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={`${t('removeFromQueue')}: ${story.title[language]}`}
                      hitSlop={8}
                      onPress={(event) => {
                        event.stopPropagation();
                        onRemove(story.id);
                      }}
                      style={styles.removeQueueButton}>
                      <Ionicons name="close-circle-outline" size={25} color={palette.coral} />
                    </Pressable>
                  </Pressable>
                ))}
              </ScrollView>
              <Pressable onPress={onClear} style={styles.clearQueueButton}>
                <Ionicons name="trash-outline" size={18} color={palette.coral} />
                <Text style={styles.clearQueueText}>{t('clearQueue')}</Text>
              </Pressable>
            </>
          ) : (
            <View style={styles.queueEmpty}>
              <Ionicons name="book-outline" size={42} color={palette.purple} />
              <Text style={styles.queueEmptyTitle}>{t('queueEmpty')}</Text>
              <Text style={styles.queueEmptyText}>{t('queueEmptyText')}</Text>
            </View>
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

/**
 * Открывает нижнее окно выбора таймера сна.
 * Выбранное значение передаётся обратно общему аудиоконтексту.
 */
function TimerModal({
  visible,
  onClose,
  value,
  onSelect,
}: {
  visible: boolean;
  onClose: () => void;
  value: 5 | 10 | 15 | 30 | 'end' | null;
  onSelect: (value: 5 | 10 | 15 | 30 | 'end' | null) => void;
}) {
  const { t, colors: palette } = useApp();
  const styles = createStyles(palette);
  const choices = [
    { value: 5 as const, label: `5 ${t('min')}` },
    { value: 10 as const, label: `10 ${t('min')}` },
    { value: 15 as const, label: `15 ${t('min')}` },
    { value: 30 as const, label: `30 ${t('min')}` },
    { value: 'end' as const, label: t('endOfStory') },
    { value: null, label: t('timerOff') },
  ];

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.modal} onPress={() => undefined}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{t('sleepTimer')}</Text>
            <Pressable onPress={onClose} hitSlop={8}>
              <Ionicons name="close" size={24} color={palette.text} />
            </Pressable>
          </View>
          {choices.map((choice) => (
            <Pressable
              key={String(choice.value)}
              onPress={() => onSelect(choice.value)}
              style={styles.timerChoice}>
              <Text style={styles.timerChoiceText}>{choice.label}</Text>
              {value === choice.value ? (
                <Ionicons name="checkmark-circle" size={23} color={palette.purple} />
              ) : null}
            </Pressable>
          ))}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

/**
 * Создаёт стили плеера и его окон для активной цветовой темы.
 */
const createStyles = (palette: ThemeColors) => StyleSheet.create({
  gradient: {
    flex: 1,
  },
  safe: {
    flex: 1,
    paddingHorizontal: 22,
  },
  playerContent: {
    paddingBottom: 18,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  headerCopy: {
    alignItems: 'center',
    gap: 3,
  },
  nowPlaying: {
    color: palette.white,
    fontSize: 14,
    fontWeight: '800',
  },
  language: {
    color: 'rgba(255,255,255,0.58)',
    fontSize: 12,
  },
  cover: {
    alignSelf: 'center',
    width: '78%',
    maxWidth: 340,
    aspectRatio: 1,
    borderRadius: 28,
    marginBottom: 18,
    shadowColor: '#000',
    shadowOpacity: 0.35,
    shadowOffset: { width: 0, height: 16 },
    shadowRadius: 28,
  },
  title: {
    color: palette.white,
    fontSize: 24,
    lineHeight: 29,
    fontWeight: '900',
    textAlign: 'center',
    marginBottom: 12,
  },
  timeline: {
    marginHorizontal: 4,
  },
  slider: {
    width: '100%',
    height: 34,
  },
  times: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  time: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 12,
    fontVariant: ['tabular-nums'],
  },
  controls: {
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 33,
  },
  skipButton: {
    width: 50,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  skipText: {
    position: 'absolute',
    bottom: 0,
    color: palette.white,
    fontSize: 10,
    fontWeight: '800',
  },
  playButton: {
    width: 76,
    height: 76,
    borderRadius: 38,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.yellow,
    paddingLeft: 3,
  },
  rates: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 7,
    marginTop: 17,
  },
  rate: {
    paddingHorizontal: 13,
    paddingVertical: 8,
    borderRadius: radii.pill,
    backgroundColor: 'rgba(255,255,255,0.09)',
  },
  activeRate: {
    backgroundColor: palette.white,
  },
  rateText: {
    color: 'rgba(255,255,255,0.68)',
    fontSize: 12,
    fontWeight: '800',
  },
  activeRateText: {
    color: palette.navy,
  },
  actions: {
    marginTop: 18,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 2,
  },
  action: {
    flex: 1,
    minWidth: 0,
    maxWidth: 74,
    minHeight: 60,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  actionTitle: {
    color: palette.white,
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'center',
  },
  actionSubtitle: {
    color: 'rgba(255,255,255,0.56)',
    fontSize: 10,
    textAlign: 'center',
    fontVariant: ['tabular-nums'],
  },
  repeatBadge: {
    position: 'absolute',
    right: -5,
    bottom: -3,
    minWidth: 14,
    height: 14,
    borderRadius: 7,
    overflow: 'hidden',
    backgroundColor: palette.yellow,
    color: palette.navy,
    fontSize: 9,
    fontWeight: '900',
    textAlign: 'center',
    lineHeight: 14,
  },
  queueBadge: {
    position: 'absolute',
    right: -9,
    top: -7,
    minWidth: 18,
    height: 18,
    paddingHorizontal: 4,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.coral,
  },
  queueBadgeText: {
    color: palette.white,
    fontSize: 10,
    fontWeight: '900',
  },
  pressed: {
    opacity: 0.65,
  },
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(5,8,22,0.55)',
  },
  modal: {
    backgroundColor: palette.surface,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 22,
    paddingBottom: 34,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  modalTitle: {
    color: palette.text,
    fontSize: 22,
    fontWeight: '900',
  },
  queueModal: {
    maxHeight: '74%',
  },
  queueCounter: {
    marginTop: 3,
    color: palette.muted,
    fontSize: 12,
    fontWeight: '700',
  },
  queueList: {
    flexGrow: 0,
  },
  queueRow: {
    minHeight: 72,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderBottomWidth: 1,
    borderBottomColor: palette.line,
  },
  queueRowPressed: {
    opacity: 0.68,
  },
  queueOrder: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.iconBubble,
  },
  queueOrderText: {
    color: palette.purple,
    fontSize: 11,
    fontWeight: '900',
  },
  queueCover: {
    width: 50,
    height: 50,
    borderRadius: 12,
  },
  queueStoryCopy: {
    flex: 1,
    gap: 3,
  },
  queueStoryTitle: {
    color: palette.text,
    fontSize: 15,
    fontWeight: '800',
  },
  queueStoryMeta: {
    color: palette.muted,
    fontSize: 11,
    fontWeight: '600',
  },
  removeQueueButton: {
    width: 36,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clearQueueButton: {
    minHeight: 48,
    marginTop: 12,
    borderRadius: radii.pill,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: palette.warningBubble,
  },
  clearQueueText: {
    color: palette.coral,
    fontSize: 14,
    fontWeight: '800',
  },
  queueEmpty: {
    minHeight: 220,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18,
    gap: 10,
  },
  queueEmptyTitle: {
    color: palette.text,
    fontSize: 18,
    fontWeight: '900',
    textAlign: 'center',
  },
  queueEmptyText: {
    maxWidth: 280,
    color: palette.muted,
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
  timerChoice: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: palette.line,
  },
  timerChoiceText: {
    color: palette.text,
    fontSize: 16,
    fontWeight: '700',
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
    gap: 18,
  },
  emptyText: {
    color: palette.white,
    fontSize: 20,
    fontWeight: '800',
    textAlign: 'center',
  },
  emptyLink: {
    color: palette.yellow,
    fontSize: 16,
    fontWeight: '800',
  },
});
