import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * Genera por código los 5 efectos de sonido del juego (DESIGN → Estética,
 * juice y sonido: salto, gema, botón, muerte y victoria) con un sintetizador
 * de estilo jsfxr: onda cuadrada/sierra/ruido, barridos de frecuencia y
 * envolvente. Se exportan a `public/sfx/*.wav` (PCM 16-bit mono).
 *
 * Uso: `npm run generate-sfx`
 */

const SAMPLE_RATE = 44100;
const OUT_DIR = join(dirname(fileURLToPath(import.meta.url)), '..', 'public', 'sfx');

type Wave = 'square' | 'saw' | 'sine' | 'noise';

interface ToneOptions {
  freqStart: number;
  freqEnd?: number;
  duration: number;
  wave?: Wave;
  volume?: number;
  attack?: number;
  release?: number;
}

interface Track {
  offset: number;
  samples: Float32Array;
}

function envelope(t: number, duration: number, attack: number, release: number): number {
  if (t < attack) {
    return t / attack;
  }
  if (t > duration - release) {
    return Math.max(0, (duration - t) / release);
  }
  return 1;
}

function renderTone(options: ToneOptions): Float32Array {
  const freqStart = options.freqStart;
  const freqEnd = options.freqEnd ?? freqStart;
  const duration = options.duration;
  const wave: Wave = options.wave ?? 'square';
  const volume = options.volume ?? 0.6;
  const attack = options.attack ?? 0.004;
  const release = options.release ?? 0.06;

  const length = Math.floor(SAMPLE_RATE * duration);
  const samples = new Float32Array(length);
  let phase = 0;

  for (let i = 0; i < length; i++) {
    const t = i / SAMPLE_RATE;
    const ratio = duration > 0 ? t / duration : 0;
    const freq = freqStart + (freqEnd - freqStart) * ratio;
    phase += freq / SAMPLE_RATE;
    phase -= Math.floor(phase);

    let value: number;
    switch (wave) {
      case 'square':
        value = phase < 0.5 ? 1 : -1;
        break;
      case 'saw':
        value = 2 * phase - 1;
        break;
      case 'sine':
        value = Math.sin(phase * Math.PI * 2);
        break;
      case 'noise':
        value = Math.random() * 2 - 1;
        break;
    }
    samples[i] = value * envelope(t, duration, attack, release) * volume;
  }
  return samples;
}

function mix(tracks: Track[], duration: number): Float32Array {
  const length = Math.floor(SAMPLE_RATE * duration);
  const out = new Float32Array(length);
  for (const track of tracks) {
    const start = Math.floor(track.offset * SAMPLE_RATE);
    for (let i = 0; i < track.samples.length && start + i < length; i++) {
      out[start + i] += track.samples[i];
    }
  }
  for (let i = 0; i < length; i++) {
    out[i] = Math.max(-1, Math.min(1, out[i]));
  }
  return out;
}

function toWav(samples: Float32Array): Buffer {
  const dataSize = samples.length * 2;
  const buffer = Buffer.alloc(44 + dataSize);

  buffer.write('RIFF', 0, 'ascii');
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write('WAVE', 8, 'ascii');
  buffer.write('fmt ', 12, 'ascii');
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20); // PCM
  buffer.writeUInt16LE(1, 22); // mono
  buffer.writeUInt32LE(SAMPLE_RATE, 24);
  buffer.writeUInt32LE(SAMPLE_RATE * 2, 28);
  buffer.writeUInt16LE(2, 32);
  buffer.writeUInt16LE(16, 34);
  buffer.write('data', 36, 'ascii');
  buffer.writeUInt32LE(dataSize, 40);

  for (let i = 0; i < samples.length; i++) {
    const clamped = Math.max(-1, Math.min(1, samples[i]));
    buffer.writeInt16LE(Math.round(clamped * 32767), 44 + i * 2);
  }
  return buffer;
}

function jump(): Float32Array {
  return renderTone({ freqStart: 300, freqEnd: 760, duration: 0.18, wave: 'square', volume: 0.5, release: 0.09 });
}

function gem(): Float32Array {
  return mix(
    [
      { offset: 0, samples: renderTone({ freqStart: 880, duration: 0.09, wave: 'square', volume: 0.45 }) },
      { offset: 0.07, samples: renderTone({ freqStart: 1320, duration: 0.13, wave: 'square', volume: 0.45 }) },
    ],
    0.22,
  );
}

function button(): Float32Array {
  return renderTone({ freqStart: 210, freqEnd: 140, duration: 0.1, wave: 'square', volume: 0.5, release: 0.06 });
}

function death(): Float32Array {
  return mix(
    [
      { offset: 0, samples: renderTone({ freqStart: 420, freqEnd: 70, duration: 0.55, wave: 'saw', volume: 0.5, release: 0.2 }) },
      { offset: 0, samples: renderTone({ freqStart: 1, duration: 0.4, wave: 'noise', volume: 0.22, release: 0.3 }) },
    ],
    0.6,
  );
}

function victory(): Float32Array {
  const notes = [523.25, 659.25, 783.99, 1046.5];
  const step = 0.13;
  const tracks: Track[] = notes.map((freq, index) => ({
    offset: index * step,
    samples: renderTone({ freqStart: freq, duration: 0.22, wave: 'square', volume: 0.42, release: 0.12 }),
  }));
  return mix(tracks, notes.length * step + 0.16);
}

const sounds: Record<string, Float32Array> = {
  jump: jump(),
  gem: gem(),
  button: button(),
  death: death(),
  victory: victory(),
};

mkdirSync(OUT_DIR, { recursive: true });
for (const [name, samples] of Object.entries(sounds)) {
  const file = join(OUT_DIR, `${name}.wav`);
  writeFileSync(file, toWav(samples));
  console.log(`generate-sfx: ${name}.wav (${(samples.length / SAMPLE_RATE).toFixed(2)}s)`);
}
console.log(`generate-sfx: ${Object.keys(sounds).length} efectos generados en public/sfx/`);
