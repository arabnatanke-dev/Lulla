import Ionicons from '@expo/vector-icons/Ionicons';
import Slider from '@react-native-community/slider';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { RoundButton } from '@/src/components/buttons';
import { palette, radii } from '@/src/constants/theme';
import { useApp } from '@/src/context/app-context';
import { useAudio } from '@/src/context/audio-context';
import { formatTime } from '@/src/utils/format';

const rates = [0.75, 1, 1.25, 1.5];

/**
 * Показывает полноэкранный аудиоплеер с прогрессом, перемоткой, скоростью и таймером сна.
 */
export default function PlayerScreen() {
  const { language, t, playbackRate, toggleFavorite, isFavorite } = useApp();
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
  } = useAudio();
  const [timerVisible, setTimerVisible] = useState(false);

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

  return (
    <LinearGradient colors={['#101B3F', '#342D62', '#6C568E']} style={styles.gradient}>
      <SafeAreaView style={styles.safe}>
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

        <TimerModal
          visible={timerVisible}
          onClose={() => setTimerVisible(false)}
          value={timerChoice}
          onSelect={(choice) => {
            setSleepTimer(choice);
            setTimerVisible(false);
          }}
        />
      </SafeAreaView>
    </LinearGradient>
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
  const { t } = useApp();
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

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  safe: {
    flex: 1,
    paddingHorizontal: 22,
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
    justifyContent: 'space-around',
  },
  action: {
    width: 104,
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
  pressed: {
    opacity: 0.65,
  },
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(5,8,22,0.55)',
  },
  modal: {
    backgroundColor: palette.cream,
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
