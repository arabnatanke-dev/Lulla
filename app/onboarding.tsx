import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useRef, useState } from 'react';
import {
  type AccessibilityActionEvent,
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
import type { ThemeColors } from '@/src/constants/theme';
import { useApp } from '@/src/context/app-context';

/**
 * Показывает три приветственных слайда при самом первом запуске приложения.
 */
export default function OnboardingScreen() {
  const { width, height } = useWindowDimensions();
  const { language, setLanguage, completeOnboarding, t, colors: palette } = useApp();
  const styles = createStyles(palette);
  const scrollRef = useRef<ScrollView>(null);
  const [page, setPage] = useState(0);
  const artHeight = Math.min(420, Math.max(240, height * 0.47));
  const iconCircleSize = Math.min(180, Math.max(138, width * 0.42));

  const slides = [
    {
      icon: 'bed-outline' as const,
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

  /**
   * Перелистывает слайды командами экранного диктора «вперёд» и «назад».
   */
  const changePageAccessible = (event: AccessibilityActionEvent) => {
    const offset = event.nativeEvent.actionName === 'increment' ? 1 : -1;
    const targetPage = Math.min(slides.length - 1, Math.max(0, page + offset));
    scrollRef.current?.scrollTo({ x: width * targetPage, animated: true });
    setPage(targetPage);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t('skip')}
        onPress={finish}
        style={styles.skip}>
        <Text style={styles.skipText}>{t('skip')}</Text>
      </Pressable>

      <ScrollView
        ref={scrollRef}
        accessibilityRole="adjustable"
        accessibilityLabel={t('appName')}
        accessibilityActions={[
          { name: 'increment', label: t('next') },
          { name: 'decrement', label: t('back') },
        ]}
        accessibilityValue={{
          min: 1,
          max: slides.length,
          now: page + 1,
          text: `${page + 1} / ${slides.length}`,
        }}
        onAccessibilityAction={changePageAccessible}
        horizontal
        pagingEnabled
        bounces={false}
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={onScrollEnd}>
        {slides.map((slide, index) => (
          <View key={slide.title} style={[styles.slide, { width }]}>
            <ScrollView
              bounces={false}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.slideContent}>
              <LinearGradient
                colors={[...slide.colors]}
                style={[styles.art, { height: artHeight }]}>
                <View style={styles.stars}>
                  <Ionicons name="sparkles" size={24} color={palette.yellow} />
                  <Ionicons name="star" size={12} color={palette.white} />
                  <Ionicons name="sparkles" size={17} color={palette.lavender} />
                </View>
                <View
                  style={[
                    styles.iconCircle,
                    {
                      width: iconCircleSize,
                      height: iconCircleSize,
                      borderRadius: iconCircleSize / 2,
                    },
                  ]}>
                  <Ionicons
                    name={slide.icon}
                    size={Math.round(iconCircleSize * 0.46)}
                    color={palette.yellow}
                  />
                </View>
              </LinearGradient>
              <View style={styles.copy}>
                <Text style={styles.title}>{slide.title}</Text>
                <Text style={styles.text}>{slide.text}</Text>
                {index === 2 ? (
                  <View
                    accessibilityRole="radiogroup"
                    accessibilityLabel={t('language')}
                    style={styles.languages}>
                    {(['ru', 'en'] as const).map((option) => {
                      const selected = language === option;
                      return (
                        <Pressable
                          key={option}
                          accessibilityRole="radio"
                          accessibilityLabel={option === 'ru' ? 'Русский' : 'English'}
                          accessibilityState={{ checked: selected, selected }}
                          onPress={() => setLanguage(option)}
                          style={[styles.language, selected && styles.selectedLanguage]}>
                          <Text
                            style={[
                              styles.languageText,
                              selected && styles.selectedLanguageText,
                            ]}>
                            {option === 'ru' ? 'Русский' : 'English'}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                ) : null}
              </View>
            </ScrollView>
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

/**
 * Создаёт стили онбординга для активной цветовой темы.
 */
const createStyles = (palette: ThemeColors) => StyleSheet.create({
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
    minHeight: 44,
    justifyContent: 'center',
  },
  skipText: {
    color: palette.white,
    fontWeight: '800',
    fontSize: 14,
  },
  slide: {
    flex: 1,
  },
  slideContent: {
    flexGrow: 1,
    paddingBottom: 12,
  },
  art: {
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
  languages: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
    padding: 4,
    borderRadius: 16,
    backgroundColor: palette.paper,
  },
  language: {
    minWidth: 110,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
    borderRadius: 13,
  },
  selectedLanguage: {
    backgroundColor: palette.navy,
  },
  languageText: {
    color: palette.muted,
    fontSize: 14,
    fontWeight: '800',
  },
  selectedLanguageText: {
    color: palette.white,
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
