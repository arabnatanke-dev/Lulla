import Ionicons from '@expo/vector-icons/Ionicons';
import { Href, router } from 'expo-router';
import React from 'react';
import { Alert, Linking, Pressable, StyleSheet, Text, View } from 'react-native';

import { Screen } from '@/src/components/screen';
import { palette, radii } from '@/src/constants/theme';
import { useApp } from '@/src/context/app-context';
import type { Language, StoredSettings } from '@/src/types';

/**
 * Содержит выбор языка, размер текста, сброс прогресса и информацию о приложении.
 */
export default function SettingsScreen() {
  const {
    language,
    setLanguage,
    textSize,
    setTextSize,
    resetProgress,
    t,
  } = useApp();

  /**
   * Просит подтверждение перед удалением всех сохранённых позиций прослушивания.
   */
  const confirmReset = () => {
    Alert.alert(t('clearProgress'), t('clearProgressConfirm'), [
      { text: t('cancel'), style: 'cancel' },
      {
        text: t('reset'),
        style: 'destructive',
        onPress: () => {
          resetProgress();
          Alert.alert(t('progressResetDone'));
        },
      },
    ]);
  };

  /**
   * Открывает почтовое приложение с адресом создателя и готовой темой письма.
   */
  const openFeedback = () => {
    Linking.openURL(
      `mailto:arabnatanke@gmail.com?subject=${encodeURIComponent(
        language === 'ru' ? 'Отзыв о приложении Dreamy Tales' : 'Dreamy Tales feedback',
      )}`,
    );
  };

  return (
    <Screen scroll contentContainerStyle={styles.content}>
      <Text style={styles.title}>{t('settings')}</Text>

      <SettingsSection icon="language" title={t('language')}>
        <Segmented
          options={[
            { value: 'ru', label: 'Русский' },
            { value: 'en', label: 'English' },
          ]}
          value={language}
          onChange={(value) => setLanguage(value as Language)}
        />
      </SettingsSection>

      <SettingsSection icon="text" title={t('textSize')}>
        <Segmented
          options={[
            { value: 'small', label: t('small') },
            { value: 'medium', label: t('medium') },
            { value: 'large', label: t('large') },
          ]}
          value={textSize}
          onChange={(value) => setTextSize(value as StoredSettings['textSize'])}
        />
      </SettingsSection>

      <Pressable onPress={confirmReset} style={({ pressed }) => [styles.row, pressed && styles.pressed]}>
        <View style={[styles.rowIcon, styles.warningIcon]}>
          <Ionicons name="refresh" size={21} color={palette.coral} />
        </View>
        <Text style={styles.rowText}>{t('clearProgress')}</Text>
        <Ionicons name="chevron-forward" size={20} color={palette.muted} />
      </Pressable>

      <SettingsSection icon="information-circle" title={t('aboutApp')}>
        <Text style={styles.about}>{t('aboutText')}</Text>
        <Text style={styles.creator}>{t('createdBy')}</Text>
        <Text style={styles.contact}>{t('contactEmail')}</Text>
        <Text style={styles.version}>{t('version')}</Text>
      </SettingsSection>

      <Pressable
        onPress={openFeedback}
        style={({ pressed }) => [styles.row, pressed && styles.pressed]}>
        <View style={styles.rowIcon}>
          <Ionicons name="mail-outline" size={21} color={palette.purple} />
        </View>
        <Text style={styles.rowText}>{t('feedback')}</Text>
        <Ionicons name="open-outline" size={19} color={palette.muted} />
      </Pressable>

      <SettingsSection icon="shield-checkmark" title={t('privacy')}>
        <Text style={styles.about}>{t('privacyText')}</Text>
        <Pressable
          onPress={() =>
            router.push(
              { pathname: '/legal/[type]', params: { type: 'privacy' } } as unknown as Href,
            )
          }
          style={({ pressed }) => [styles.legalLink, pressed && styles.pressed]}>
          <Text style={styles.legalLinkText}>{t('privacyPolicy')}</Text>
          <Ionicons name="chevron-forward" size={18} color={palette.muted} />
        </Pressable>
        <Pressable
          onPress={() =>
            router.push(
              { pathname: '/legal/[type]', params: { type: 'terms' } } as unknown as Href,
            )
          }
          style={({ pressed }) => [styles.legalLink, pressed && styles.pressed]}>
          <Text style={styles.legalLinkText}>{t('terms')}</Text>
          <Ionicons name="chevron-forward" size={18} color={palette.muted} />
        </Pressable>
      </SettingsSection>
    </Screen>
  );
}

/**
 * Создаёт однотипный светлый блок настроек с иконкой и заголовком.
 */
function SettingsSection({
  icon,
  title,
  children,
}: React.PropsWithChildren<{ icon: keyof typeof Ionicons.glyphMap; title: string }>) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionTitleRow}>
        <View style={styles.rowIcon}>
          <Ionicons name={icon} size={21} color={palette.purple} />
        </View>
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>
      {children}
    </View>
  );
}

/**
 * Рисует компактный переключатель из нескольких вариантов.
 * Активное значение выделяется тёмным фоном.
 */
function Segmented({
  options,
  value,
  onChange,
}: {
  options: { value: string; label: string }[];
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <View style={styles.segmented}>
      {options.map((option) => {
        const active = option.value === value;
        return (
          <Pressable
            key={option.value}
            onPress={() => onChange(option.value)}
            style={[styles.segment, active && styles.activeSegment]}>
            <Text style={[styles.segmentText, active && styles.activeSegmentText]}>
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: 18,
    paddingTop: 12,
    gap: 14,
  },
  title: {
    color: palette.text,
    fontSize: 30,
    fontWeight: '900',
    marginBottom: 4,
  },
  section: {
    backgroundColor: palette.white,
    borderRadius: radii.md,
    padding: 16,
    borderWidth: 1,
    borderColor: palette.line,
    gap: 14,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  sectionTitle: {
    color: palette.text,
    fontSize: 17,
    fontWeight: '800',
  },
  rowIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EEE8F8',
  },
  warningIcon: {
    backgroundColor: '#FCEDE8',
  },
  row: {
    minHeight: 68,
    backgroundColor: palette.white,
    borderRadius: radii.md,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    borderWidth: 1,
    borderColor: palette.line,
  },
  rowText: {
    flex: 1,
    color: palette.text,
    fontSize: 16,
    fontWeight: '700',
  },
  pressed: {
    opacity: 0.75,
  },
  segmented: {
    flexDirection: 'row',
    backgroundColor: palette.paper,
    padding: 4,
    borderRadius: 14,
    gap: 3,
  },
  segment: {
    flex: 1,
    minHeight: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 11,
    paddingHorizontal: 5,
  },
  activeSegment: {
    backgroundColor: palette.navy,
  },
  segmentText: {
    color: palette.muted,
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
  },
  activeSegmentText: {
    color: palette.white,
  },
  about: {
    color: palette.muted,
    fontSize: 14,
    lineHeight: 21,
  },
  version: {
    color: palette.purple,
    fontSize: 13,
    fontWeight: '800',
  },
  creator: {
    color: palette.text,
    fontSize: 14,
    fontWeight: '800',
  },
  contact: {
    color: palette.purple,
    fontSize: 13,
    fontWeight: '700',
  },
  legalLink: {
    minHeight: 46,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: palette.line,
  },
  legalLinkText: {
    color: palette.text,
    fontSize: 14,
    fontWeight: '700',
  },
});
