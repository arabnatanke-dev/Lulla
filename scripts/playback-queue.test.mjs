import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import ts from 'typescript';

/**
 * Компилирует тестируемый TypeScript-модуль прямо в памяти.
 * Так тест работает на поддерживаемых Expo версиях Node.js и не создаёт временных файлов.
 */
async function loadPlaybackQueueModule() {
  const moduleUrl = new URL('../src/utils/playback-queue.ts', import.meta.url);
  const source = await readFile(fileURLToPath(moduleUrl), 'utf8');
  const compiled = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.ESNext,
      target: ts.ScriptTarget.ES2022,
    },
  }).outputText;
  const dataUrl = `data:text/javascript;base64,${Buffer.from(compiled).toString('base64')}`;
  return import(dataUrl);
}

const { resolveFinishedPlayback } = await loadPlaybackQueueModule();

/**
 * Проверяет обычную остановку, когда очередь закончилась и повтор выключен.
 */
test('stops after the last story when repeat is off', () => {
  assert.deepEqual(
    resolveFinishedPlayback({
      activeStoryId: 'a',
      queueIds: [],
      repeatMode: 'off',
      stopAtEnd: false,
    }),
    { kind: 'stop', nextQueueIds: [] },
  );
});

/**
 * Проверяет переход к первой сказке и удаление её из очереди.
 */
test('plays the next queued story', () => {
  assert.deepEqual(
    resolveFinishedPlayback({
      activeStoryId: 'a',
      queueIds: ['b', 'c'],
      repeatMode: 'off',
      stopAtEnd: false,
    }),
    { kind: 'next', nextStoryId: 'b', nextQueueIds: ['c'] },
  );
});

/**
 * Проверяет, что повтор одной сказки не расходует сохранённую очередь.
 */
test('replays one story without changing the queue', () => {
  assert.deepEqual(
    resolveFinishedPlayback({
      activeStoryId: 'a',
      queueIds: ['b'],
      repeatMode: 'one',
      stopAtEnd: false,
    }),
    { kind: 'replay', nextQueueIds: ['b'] },
  );
});

/**
 * Проверяет циклическую очередь: закончившаяся сказка перемещается в её конец.
 */
test('cycles the whole queue', () => {
  assert.deepEqual(
    resolveFinishedPlayback({
      activeStoryId: 'a',
      queueIds: ['b', 'c'],
      repeatMode: 'all',
      stopAtEnd: false,
    }),
    { kind: 'next', nextStoryId: 'b', nextQueueIds: ['c', 'a'] },
  );
});

/**
 * Проверяет повтор текущей сказки, если циклическая очередь больше ничего не содержит.
 */
test('replays the current story when repeat-all queue is empty', () => {
  assert.deepEqual(
    resolveFinishedPlayback({
      activeStoryId: 'a',
      queueIds: [],
      repeatMode: 'all',
      stopAtEnd: false,
    }),
    { kind: 'replay', nextQueueIds: [] },
  );
});

/**
 * Проверяет приоритет таймера «до конца» над очередью и любым режимом повтора.
 */
test('stops at the end when the sleep timer requests it', () => {
  assert.deepEqual(
    resolveFinishedPlayback({
      activeStoryId: 'a',
      queueIds: ['b'],
      repeatMode: 'all',
      stopAtEnd: true,
    }),
    { kind: 'stop', nextQueueIds: ['b'] },
  );
});
