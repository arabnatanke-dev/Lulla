import type { RepeatMode } from '@/src/types';

export type FinishedPlaybackAction =
  | { kind: 'stop'; nextQueueIds: string[] }
  | { kind: 'replay'; nextQueueIds: string[] }
  | { kind: 'next'; nextStoryId: string; nextQueueIds: string[] };

interface FinishedPlaybackInput {
  activeStoryId: string;
  queueIds: string[];
  repeatMode: RepeatMode;
  stopAtEnd: boolean;
}

/**
 * Решает, что делать после окончания аудиофайла.
 * Функция не управляет плеером сама, поэтому её сценарии легко проверить отдельными тестами.
 */
export function resolveFinishedPlayback({
  activeStoryId,
  queueIds,
  repeatMode,
  stopAtEnd,
}: FinishedPlaybackInput): FinishedPlaybackAction {
  if (stopAtEnd) {
    return { kind: 'stop', nextQueueIds: queueIds };
  }

  if (repeatMode === 'one') {
    return { kind: 'replay', nextQueueIds: queueIds };
  }

  const [nextStoryId, ...remainingIds] = queueIds;
  if (nextStoryId) {
    return {
      kind: 'next',
      nextStoryId,
      nextQueueIds:
        repeatMode === 'all'
          ? [...remainingIds.filter((storyId) => storyId !== activeStoryId), activeStoryId]
          : remainingIds,
    };
  }

  if (repeatMode === 'all') {
    return { kind: 'replay', nextQueueIds: [] };
  }

  return { kind: 'stop', nextQueueIds: [] };
}
