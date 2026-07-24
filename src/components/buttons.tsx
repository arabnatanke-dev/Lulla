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

import { palette, radii } from '@/src/constants/theme';

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
          color={variant === 'primary' ? palette.white : palette.navy}
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
  color = palette.navy,
  backgroundColor = palette.white,
  size = 46,
  style,
  ...props
}: RoundButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      hitSlop={6}
      style={({ pressed }) => [
        styles.round,
        { width: size, height: size, borderRadius: size / 2, backgroundColor },
        pressed && styles.pressed,
        style,
      ]}
      {...props}>
      <Ionicons name={icon} size={Math.round(size * 0.48)} color={color} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
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
    backgroundColor: palette.white,
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
    color: palette.navy,
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
