import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync, mkdirSync, unlinkSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const stories = JSON.parse(
  readFileSync(new URL('../src/data/stories-content.json', import.meta.url), 'utf8'),
);
const projectRoot = fileURLToPath(new URL('..', import.meta.url));
const tempRoot = '/tmp/dreamy-tales-audio';

mkdirSync(tempRoot, { recursive: true });

const voices = {
  ru: { name: 'Milena', rate: '76' },
  en: { name: 'Daniel', rate: '78' },
};

for (const story of stories) {
  for (const language of ['ru', 'en']) {
    const outputDirectory = join(projectRoot, 'assets', 'audio', language);
    mkdirSync(outputDirectory, { recursive: true });

    const textPath = join(tempRoot, `${story.slug}-${language}.txt`);
    const aiffPath = join(tempRoot, `${story.slug}-${language}.aiff`);
    const outputPath = join(outputDirectory, `${story.slug}.wav`);
    writeFileSync(textPath, story.text[language], 'utf8');

    const voice = voices[language];
    console.log(`Narrating ${language}: ${story.title[language]}`);
    execFileSync('say', [
      '-v',
      voice.name,
      '-r',
      voice.rate,
      '-f',
      textPath,
      '-o',
      aiffPath,
    ]);
    execFileSync('afconvert', [
      aiffPath,
      '-o',
      outputPath,
      '-f',
      'WAVE',
      '-d',
      'LEI16@11025',
    ]);
    unlinkSync(textPath);
    unlinkSync(aiffPath);
  }
}

console.log('All local narration files are ready.');
