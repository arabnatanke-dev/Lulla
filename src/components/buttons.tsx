import Ionicons from '@expo/vector-icons/Ionicons';
import React from 'react';
import {
  Pressable,
  PressableProps,
  StyleProp,
  StyleSheet,
  Text,
  ViewStyle,
} from 'react-native';

import { radii, type ThemeColors } from '@/src/constants/theme';
import { useApp } from '@/src/context/app-context';

interface PrimaryButtonProps extends PressableProps {
  label: string;
  icon?: keyof typeof Ionicons.glyphMap;
  variant?: 'primary' | 'secondary' | 'ghost';
  style?: StyleProp<ViewStyle>;
}

/**
 * Рисует основную текстовую кнопку приложения.
 * Через variant можно переключить тёмный, светлый или прозрачный вариант.
 */
export function PrimaryButton({
  label,
  icon,
  variant = 'primary',
  style,
  disabled,
  ...props
}: PrimaryButtonProps) {
  const { colors: palette } = useApp();
  const styles = createStyles(palette);

  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      style={({ pressed }) => [
        styles.button,
        styles[variant],
        pressed && styles.pressed,
        disabled && styles.disabled,
        style,
      ]}
      {...props}>
      {icon ? (
        <Ionicons
          name={icon}
          size={19}
          color={variant === 'primary' ? palette.white : palette.text}
        />
      ) : null}
      <Text style={[styles.label, variant !== 'primary' && styles.darkLabel]}>{label}</Text>
    </Pressable>
  );
}

interface RoundButtonProps extends PressableProps {
  icon: keyof typeof Ionicons.glyphMap;
  color?: string;
  backgroundColor?: string;
  size?: number;
  style?: StyleProp<ViewStyle>;
}

/**
 * Рисует круглую кнопку с иконкой.
 * Используется для кнопок «Назад», «Избранное» и компактных действий плеера.
 */
export function RoundButton({
  icon,
  color,
  backgroundColor,
  size = 46,
  style,
  ...props
}: RoundButtonProps) {
  const { colors: palette } = useApp();
  const styles = createStyles(palette);
  const resolvedColor = color ?? palette.text;
  const resolvedBackground = backgroundColor ?? palette.surface;

  return (
    <Pressable
      accessibilityRole="button"
      hitSlop={6}
      style={({ pressed }) => [
        styles.round,
        { width: size, height: size, borderRadius: size / 2, backgroundColor: resolvedBackground },
        pressed && styles.pressed,
        style,
      ]}
      {...props}>
      <Ionicons name={icon} size={Math.round(size * 0.48)} color={resolvedColor} />
    </Pressable>
  );
}

/**
 * Создаёт стили кнопок для активной светлой или тёмной темы.
 */
const createStyles = (palette: ThemeColors) => StyleSheet.create({
  button: {
    minHeight: 52,
    paddingHorizontal: 22,
    borderRadius: radii.pill,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9,
  },
  primary: {
    backgroundColor: palette.navy,
  },
  secondary: {
    backgroundColor: palette.surface,
    borderWidth: 1,
    borderColor: palette.line,
  },
  ghost: {
    backgroundColor: 'transparent',
  },
  label: {
    color: palette.white,
    fontWeight: '800',
    fontSize: 16,
  },
  darkLabel: {
    color: palette.text,
  },
  pressed: {
    opacity: 0.78,
    transform: [{ scale: 0.985 }],
  },
  disabled: {
    opacity: 0.45,
  },
  round: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
