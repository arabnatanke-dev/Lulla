import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { PrimaryButton } from '@/src/components/buttons';
import { Screen } from '@/src/components/screen';
import type { ThemeColors } from '@/src/constants/theme';
import { useApp } from '@/src/context/app-context';

/**
 * Показывает безопасный экран, если приложение получило неизвестную ссылку или маршрут.
 */
export default function NotFoundScreen() {
  const { t, colors: palette } = useApp();
  const styles = createStyles(palette);

  return (
    <Screen contentContainerStyle={styles.content}>
      <View style={styles.icon}>
        <Ionicons name="book-outline" size={48} color={palette.purple} />
      </View>
      <Text style={styles.title}>{t('storyNotFound')}</Text>
      <PrimaryButton
        label={t('goCatalog')}
        icon="library-outline"
        onPress={() => router.replace('/catalog')}
      />
    </Screen>
  );
}

/**
 * Создаёт стили экрана неизвестного маршрута для активной темы.
 */
const createStyles = (palette: ThemeColors) => StyleSheet.create({
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 18,
    paddingHorizontal: 28,
  },
  icon: {
    width: 92,
    height: 92,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 46,
    backgroundColor: palette.iconBubble,
  },
  title: {
    color: palette.text,
    fontSize: 22,
    fontWeight: '900',
    textAlign: 'center',
  },
});
