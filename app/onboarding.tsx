import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useRef, useState } from 'react';
import {
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PrimaryButton } from '@/src/components/buttons';
import { palette } from '@/src/constants/theme';
import { useApp } from '@/src/context/app-context';

/**
 * Показывает три приветственных слайда при самом первом запуске приложения.
 */
export default function OnboardingScreen() {
  const { width } = useWindowDimensions();
  const { completeOnboarding, t } = useApp();
  const scrollRef = useRef<ScrollView>(null);
  const [page, setPage] = useState(0);

  const slides = [
    {
      icon: 'moon' as const,
      title: t('onboardingOneTitle'),
      text: t('onboardingOneText'),
      colors: ['#162453', '#695AA0'] as const,
    },
    {
      icon: 'book' as const,
      title: t('onboardingTwoTitle'),
      text: t('onboardingTwoText'),
      colors: ['#263861', '#51879A'] as const,
    },
    {
      icon: 'language' as const,
      title: t('onboardingThreeTitle'),
      text: t('onboardingThreeText'),
      colors: ['#4F4A86', '#9C6F8E'] as const,
    },
  ];

  /**
   * Запоминает прохождение онбординга и открывает главную страницу.
   */
  const finish = () => {
    completeOnboarding();
    router.replace('/(tabs)');
  };

  /**
   * Перелистывает на следующий слайд, а на последнем завершает онбординг.
   */
  const next = () => {
    if (page === slides.length - 1) {
      finish();
      return;
    }
    scrollRef.current?.scrollTo({ x: width * (page + 1), animated: true });
    setPage((value) => value + 1);
  };

  /**
   * Определяет номер текущего слайда после ручного горизонтального свайпа.
   */
  const onScrollEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    setPage(Math.round(event.nativeEvent.contentOffset.x / width));
  };

  return (
    <SafeAreaView style={styles.safe}>
      <Pressable onPress={finish} style={styles.skip}>
        <Text style={styles.skipText}>{t('skip')}</Text>
      </Pressable>

      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        bounces={false}
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={onScrollEnd}>
        {slides.map((slide) => (
          <View key={slide.title} style={[styles.slide, { width }]}>
            <LinearGradient colors={[...slide.colors]} style={styles.art}>
              <View style={styles.stars}>
                <Ionicons name="sparkles" size={24} color={palette.yellow} />
                <Ionicons name="star" size={12} color={palette.cream} />
                <Ionicons name="sparkles" size={17} color={palette.lavender} />
              </View>
              <View style={styles.iconCircle}>
                <Ionicons name={slide.icon} size={86} color={palette.yellow} />
              </View>
            </LinearGradient>
            <View style={styles.copy}>
              <Text style={styles.title}>{slide.title}</Text>
              <Text style={styles.text}>{slide.text}</Text>
            </View>
          </View>
        ))}
      </ScrollView>

      <View style={styles.footer}>
        <View style={styles.dots}>
          {slides.map((_, index) => (
            <View key={index} style={[styles.dot, index === page && styles.activeDot]} />
          ))}
        </View>
        <PrimaryButton
          label={page === slides.length - 1 ? t('start') : t('next')}
          icon={page === slides.length - 1 ? 'sparkles' : 'arrow-forward'}
          onPress={next}
          style={styles.button}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: palette.cream,
  },
  skip: {
    position: 'absolute',
    right: 18,
    top: 18,
    zIndex: 5,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  skipText: {
    color: palette.white,
    fontWeight: '800',
    fontSize: 14,
  },
  slide: {
    flex: 1,
  },
  art: {
    height: '58%',
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomLeftRadius: 42,
    borderBottomRightRadius: 42,
  },
  stars: {
    position: 'absolute',
    width: '74%',
    top: '20%',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  iconCircle: {
    width: 190,
    height: 190,
    borderRadius: 95,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
  },
  copy: {
    paddingHorizontal: 34,
    paddingTop: 36,
    alignItems: 'center',
    gap: 14,
  },
  title: {
    color: palette.text,
    fontSize: 29,
    lineHeight: 35,
    fontWeight: '900',
    textAlign: 'center',
  },
  text: {
    color: palette.muted,
    fontSize: 17,
    lineHeight: 25,
    textAlign: 'center',
  },
  footer: {
    paddingHorizontal: 24,
    paddingBottom: 15,
    gap: 18,
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: palette.line,
  },
  activeDot: {
    width: 25,
    backgroundColor: palette.purple,
  },
  button: {
    width: '100%',
  },
});
