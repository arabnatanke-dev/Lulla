import React, { PropsWithChildren } from 'react';
import {
  ScrollView,
  ScrollViewProps,
  StyleProp,
  StyleSheet,
  View,
  ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import type { ThemeColors } from '@/src/constants/theme';
import { useApp } from '@/src/context/app-context';

interface ScreenProps extends PropsWithChildren {
  scroll?: boolean;
  contentContainerStyle?: StyleProp<ViewStyle>;
  style?: StyleProp<ViewStyle>;
  scrollProps?: ScrollViewProps;
}

/**
 * Создаёт безопасную область экрана с общим фоном.
 * Если scroll=true, содержимое автоматически помещается в вертикальную прокрутку.
 */
export function Screen({
  children,
  scroll = false,
  contentContainerStyle,
  style,
  scrollProps,
}: ScreenProps) {
  const { colors: palette } = useApp();
  const styles = createStyles(palette);

  if (scroll) {
    return (
      <SafeAreaView style={[styles.safe, style]} edges={['top', 'left', 'right']}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[styles.scrollContent, contentContainerStyle]}
          keyboardShouldPersistTaps="handled"
          {...scrollProps}>
          {children}
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safe, style]} edges={['top', 'left', 'right']}>
      <View style={[styles.content, contentContainerStyle]}>{children}</View>
    </SafeAreaView>
  );
}

/**
 * Создаёт общий фон экранов для активной цветовой темы.
 */
const createStyles = (palette: ThemeColors) => StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: palette.cream,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 132,
  },
});
