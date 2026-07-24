/**
 * Преобразует количество секунд в понятную строку формата «минуты:секунды».
 * Например, 75 секунд превращаются в «1:15».
 */
export function formatTime(seconds: number) {
  const safe = Number.isFinite(seconds) ? Math.max(0, Math.floor(seconds)) : 0;
  const minutes = Math.floor(safe / 60);
  const remainder = safe % 60;
  return `${minutes}:${remainder.toString().padStart(2, '0')}`;
}
