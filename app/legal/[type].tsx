import { router, useLocalSearchParams } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { RoundButton } from '@/src/components/buttons';
import { Screen } from '@/src/components/screen';
import { palette, radii } from '@/src/constants/theme';
import { useApp } from '@/src/context/app-context';

const legalText = {
  privacy: {
    ru: [
      'Dreamy Tales не запрашивает имя, дату рождения, фотографию, адрес, контакты, геолокацию, доступ к камере или микрофону.',
      'Выбранный язык, избранные сказки, размер текста, скорость и позиции прослушивания сохраняются только в локальной памяти устройства.',
      'В текущей версии нет регистрации, рекламы, аналитики и передачи пользовательских данных на сервер.',
      'Для вопросов о конфиденциальности напишите на hello@dreamytales.app.',
    ],
    en: [
      'Dreamy Tales does not request a name, date of birth, photo, address, contacts, precise location, camera access, or microphone access.',
      'The selected language, favorites, text size, playback speed, and listening positions are stored only in local device storage.',
      'This version has no registration, advertising, analytics, or transfer of user data to a server.',
      'For privacy questions, contact hello@dreamytales.app.',
    ],
  },
  terms: {
    ru: [
      'Приложение предназначено для семейного чтения и прослушивания детских сказок. Управлять приложением рекомендуется взрослому.',
      'Материалы первой версии предоставляются в ознакомительных целях. Нельзя использовать приложение в ситуациях, где требуется экстренная или профессиональная помощь.',
      'Тексты являются самостоятельными адаптациями классических сюжетов. Иллюстрации и аудиофайлы подготовлены специально для этого проекта.',
      'Продолжая использовать приложение, пользователь соглашается с этими условиями.',
    ],
    en: [
      'The app is intended for families to read and listen to children’s stories together. Adult supervision is recommended.',
      'Materials in this first version are provided for general enjoyment. The app must not be relied upon where emergency or professional help is required.',
      'The texts are original adaptations of classic plots. Illustrations and audio files were prepared specifically for this project.',
      'By continuing to use the app, the user agrees to these terms.',
    ],
  },
} as const;

/**
 * Показывает локальную политику конфиденциальности или условия использования.
 * Тип документа определяется параметром адреса privacy/terms.
 */
export default function LegalScreen() {
  const { type } = useLocalSearchParams<{ type: string }>();
  const { language, t } = useApp();
  const safeType = type === 'terms' ? 'terms' : 'privacy';
  const title = safeType === 'terms' ? t('terms') : t('privacyPolicy');

  return (
    <Screen scroll contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <RoundButton icon="arrow-back" accessibilityLabel={t('back')} onPress={() => router.back()} />
        <Text style={styles.title}>{title}</Text>
      </View>
      <View style={styles.paper}>
        <Text style={styles.updated}>Dreamy Tales · 24.07.2026</Text>
        {legalText[safeType][language].map((paragraph, index) => (
          <Text key={index} style={styles.paragraph}>
            {paragraph}
          </Text>
        ))}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: 18,
    paddingTop: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 20,
  },
  title: {
    flex: 1,
    color: palette.text,
    fontSize: 24,
    lineHeight: 30,
    fontWeight: '900',
  },
  paper: {
    backgroundColor: palette.white,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: palette.line,
    padding: 22,
  },
  updated: {
    color: palette.purple,
    fontSize: 12,
    fontWeight: '800',
    marginBottom: 18,
  },
  paragraph: {
    color: palette.text,
    fontSize: 16,
    lineHeight: 25,
    marginBottom: 18,
  },
});
