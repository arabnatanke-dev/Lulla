import Ionicons from '@expo/vector-icons/Ionicons';
import Slider from '@react-native-community/slider';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { PrimaryButton, RoundButton } from '@/src/components/buttons';
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
    loadingStoryId,
    isBuffering,
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
  const [repeatVisible, setRepeatVisible] = useState(false);
  const styles = createStyles(palette);

  if (!activeStory) {
    return (
      <LinearGradient colors={[palette.navy, '#493F78']} style={styles.empty}>
        <Ionicons name="musical-notes-outline" size={54} color={palette.yellow} />
        <Text style={styles.emptyText}>{t('audioUnavailable')}</Text>
        <PrimaryButton
          label={t('goCatalog')}
          icon="library-outline"
          variant="secondary"
          onPress={() => router.replace('/catalog')}
        />
      </LinearGradient>
    );
  }

  const isBusy = loadingStoryId === activeStory.id || isBuffering;
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
              accessibilityLabel={
                isFavorite(activeStory.id) ? t('removeFavorite') : t('addFavorite')
              }
              accessibilityState={{ selected: isFavorite(activeStory.id) }}
              onPress={() => toggleFavorite(activeStory.id)}
            />
          </View>

          <View style={styles.coverWrap}>
            <Image source={activeStory.coverImage} style={styles.cover} contentFit="cover" />
            {isBusy ? (
              <View style={styles.loadingCover}>
                <ActivityIndicator size="large" color={palette.yellow} />
                <Text style={styles.loadingText}>{t('loading')}</Text>
              </View>
            ) : null}
          </View>
          <Text style={styles.title}>{activeStory.title[language]}</Text>

          <View style={styles.timeline}>
            <Slider
              style={styles.slider}
              minimumValue={0}
              maximumValue={Math.max(duration, 1)}
              value={Math.min(currentTime, duration || currentTime)}
              disabled={isBusy}
              accessibilityLabel={t('player')}
              accessibilityRole="adjustable"
              accessibilityValue={{
                min: 0,
                max: Math.max(1, Math.round(duration)),
                now: Math.min(Math.max(0, Math.round(currentTime)), Math.max(1, Math.round(duration))),
                text: `${formatTime(currentTime)} / ${formatTime(duration)}`,
              }}
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
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`${t('back')} 10 ${t('seconds')}`}
              accessibilityState={{ disabled: isBusy }}
              disabled={isBusy}
              onPress={() => skipBy(-10)}
              style={[styles.skipButton, isBusy && styles.disabled]}>
              <Ionicons name="play-back" size={25} color={palette.white} />
              <Text style={styles.skipText}>10</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={playing ? t('pause') : t('play')}
              accessibilityState={{ busy: isBusy, disabled: isBusy }}
              disabled={isBusy}
              onPress={toggle}
              style={[styles.playButton, isBusy && styles.disabled]}>
              {isBusy ? (
                <ActivityIndicator size="large" color={palette.navy} />
              ) : (
                <Ionicons name={playing ? 'pause' : 'play'} size={40} color={palette.navy} />
              )}
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`${t('forward')} 10 ${t('seconds')}`}
              accessibilityState={{ disabled: isBusy }}
              disabled={isBusy}
              onPress={() => skipBy(10)}
              style={[styles.skipButton, isBusy && styles.disabled]}>
              <Ionicons name="play-forward" size={25} color={palette.white} />
              <Text style={styles.skipText}>10</Text>
            </Pressable>
          </View>

          <View style={styles.rates}>
            {rates.map((rate) => (
              <Pressable
                key={rate}
                accessibilityRole="button"
                accessibilityLabel={`${t('speed')} ${rate}`}
                accessibilityState={{ selected: playbackRate === rate, disabled: isBusy }}
                disabled={isBusy}
                onPress={() => setRate(rate)}
                style={[
                  styles.rate,
                  playbackRate === rate && styles.activeRate,
                  isBusy && styles.disabled,
                ]}>
                <Text style={[styles.rateText, playbackRate === rate && styles.activeRateText]}>
                  {rate}×
                </Text>
              </Pressable>
            ))}
          </View>

          <View style={styles.actions}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`${t('sleepTimer')}: ${timerLabel}`}
              onPress={() => setTimerVisible(true)}
              style={({ pressed }) => [styles.action, pressed && styles.pressed]}>
              <Ionicons name="timer-outline" size={22} color={palette.yellow} />
              <View>
                <Text style={styles.actionTitle}>{t('sleepTimer')}</Text>
                <Text style={styles.actionSubtitle}>{timerLabel}</Text>
              </View>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`${t('repeat')}: ${repeatLabel}`}
              accessibilityState={{ selected: repeatMode !== 'off' }}
              onPress={() => setRepeatVisible(true)}
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
              accessibilityRole="button"
              accessibilityLabel={`${t('queue')}: ${queue.length}`}
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
              accessibilityRole="button"
              accessibilityLabel={t('read')}
              onPress={() =>
                router.push({ pathname: '/reader/[id]', params: { id: activeStory.id } })
              }
              style={({ pressed }) => [styles.action, pressed && styles.pressed]}>
              <Ionicons name="book-outline" size={22} color={palette.yellow} />
              <Text style={styles.actionTitle}>{t('read')}</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('closePlayer')}
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
        <RepeatModal
          visible={repeatVisible}
          value={repeatMode}
          onClose={() => setRepeatVisible(false)}
          onSelect={(mode) => {
            setRepeatMode(mode);
            setRepeatVisible(false);
          }}
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
  const insets = useSafeAreaInsets();
  const { language, t, colors: palette } = useApp();
  const styles = createStyles(palette);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable
          accessibilityViewIsModal
          style={[
            styles.modal,
            styles.queueModal,
            { paddingBottom: Math.max(24, insets.bottom + 12) },
          ]}
          onPress={() => undefined}>
          <View style={styles.modalHeader}>
            <View>
              <Text style={styles.modalTitle}>{t('queue')}</Text>
              <Text style={styles.queueCounter}>
                {t('queueCount')}: {queue.length}
              </Text>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('dismiss')}
              onPress={onClose}
              hitSlop={8}
              style={styles.modalClose}>
              <Ionicons name="close" size={24} color={palette.text} />
            </Pressable>
          </View>

          {queue.length ? (
            <>
              <ScrollView
                style={styles.queueList}
                contentContainerStyle={styles.queueListContent}
                showsVerticalScrollIndicator={false}>
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
              <Pressable
                accessibilityRole="button"
                onPress={() => {
                  Alert.alert(t('clearQueueConfirm'), t('clearQueueConfirmText'), [
                    { text: t('cancel'), style: 'cancel' },
                    {
                      text: t('clearQueue'),
                      style: 'destructive',
                      onPress: onClear,
                    },
                  ]);
                }}
                style={styles.clearQueueButton}>
                <Ionicons name="trash-outline" size={18} color={palette.coral} />
                <Text style={styles.clearQueueText}>{t('clearQueue')}</Text>
              </Pressable>
            </>
          ) : (
            <View style={styles.queueEmpty}>
              <Ionicons name="book-outline" size={42} color={palette.purple} />
              <Text style={styles.queueEmptyTitle}>{t('queueEmpty')}</Text>
              <Text style={styles.queueEmptyText}>{t('queueEmptyText')}</Text>
              <PrimaryButton
                label={t('chooseStories')}
                icon="library-outline"
                variant="secondary"
                onPress={() => {
                  onClose();
                  router.navigate('/catalog');
                }}
              />
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
  const insets = useSafeAreaInsets();
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
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable
          accessibilityViewIsModal
          style={[
            styles.modal,
            styles.choiceModal,
            { paddingBottom: Math.max(24, insets.bottom + 12) },
          ]}
          onPress={() => undefined}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{t('sleepTimer')}</Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('dismiss')}
              onPress={onClose}
              hitSlop={8}
              style={styles.modalClose}>
              <Ionicons name="close" size={24} color={palette.text} />
            </Pressable>
          </View>
          <ScrollView
            accessibilityRole="radiogroup"
            accessibilityLabel={t('sleepTimer')}
            style={styles.choiceList}
            contentContainerStyle={styles.choiceListContent}
            showsVerticalScrollIndicator={false}>
            {choices.map((choice) => (
              <Pressable
                key={String(choice.value)}
                accessibilityRole="radio"
                accessibilityLabel={choice.label}
                accessibilityState={{
                  checked: value === choice.value,
                  selected: value === choice.value,
                }}
                onPress={() => onSelect(choice.value)}
                style={styles.timerChoice}>
                <Text style={styles.timerChoiceText}>{choice.label}</Text>
                {value === choice.value ? (
                  <Ionicons name="checkmark-circle" size={23} color={palette.purple} />
                ) : null}
              </Pressable>
            ))}
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

/**
 * Показывает три режима повтора отдельным понятным выбором вместо скрытого цикла.
 */
function RepeatModal({
  visible,
  value,
  onClose,
  onSelect,
}: {
  visible: boolean;
  value: RepeatMode;
  onClose: () => void;
  onSelect: (value: RepeatMode) => void;
}) {
  const insets = useSafeAreaInsets();
  const { t, colors: palette } = useApp();
  const styles = createStyles(palette);
  const choices: { value: RepeatMode; label: string }[] = [
    { value: 'off', label: t('repeatOff') },
    { value: 'one', label: t('repeatOne') },
    { value: 'all', label: t('repeatAll') },
  ];

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable
          accessibilityViewIsModal
          style={[styles.modal, { paddingBottom: Math.max(24, insets.bottom + 12) }]}
          onPress={() => undefined}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{t('repeat')}</Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('dismiss')}
              onPress={onClose}
              hitSlop={8}
              style={styles.modalClose}>
              <Ionicons name="close" size={24} color={palette.text} />
            </Pressable>
          </View>
          <View accessibilityRole="radiogroup" accessibilityLabel={t('repeat')}>
            {choices.map((choice) => (
              <Pressable
                key={choice.value}
                accessibilityRole="radio"
                accessibilityLabel={choice.label}
                accessibilityState={{
                  checked: value === choice.value,
                  selected: value === choice.value,
                }}
                onPress={() => onSelect(choice.value)}
                style={styles.timerChoice}>
                <Text style={styles.timerChoiceText}>{choice.label}</Text>
                {value === choice.value ? (
                  <Ionicons name="checkmark-circle" size={23} color={palette.purple} />
                ) : null}
              </Pressable>
            ))}
          </View>
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
  coverWrap: {
    alignSelf: 'center',
    width: '78%',
    maxWidth: 340,
    aspectRatio: 1,
    borderRadius: 28,
    marginBottom: 18,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.35,
    shadowOffset: { width: 0, height: 16 },
    shadowRadius: 28,
  },
  cover: {
    width: '100%',
    height: '100%',
  },
  loadingCover: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: 'rgba(16,27,63,0.62)',
  },
  loadingText: {
    color: palette.white,
    fontSize: 13,
    fontWeight: '800',
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
    minHeight: 44,
    minWidth: 54,
    paddingHorizontal: 13,
    alignItems: 'center',
    justifyContent: 'center',
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
    flexWrap: 'wrap',
    gap: 10,
  },
  action: {
    width: '47%',
    flexGrow: 1,
    minHeight: 72,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9,
    paddingHorizontal: 10,
    borderRadius: radii.md,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  actionTitle: {
    color: palette.white,
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
  },
  actionSubtitle: {
    color: 'rgba(255,255,255,0.56)',
    fontSize: 11,
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
  disabled: {
    opacity: 0.45,
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
  choiceModal: {
    maxHeight: '82%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  modalClose: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
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
    flexShrink: 1,
  },
  queueListContent: {
    paddingBottom: 2,
  },
  choiceList: {
    flexGrow: 0,
  },
  choiceListContent: {
    paddingBottom: 2,
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
