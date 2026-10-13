import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { SFX_FILES } from '../src/config/audio';

const SFX_DIR = join(dirname(fileURLToPath(import.meta.url)), '..', 'public', 'sfx');

describe('config/audio', () => {
  it('declara exactamente los cinco efectos del documento de diseño', () => {
    expect(SFX_FILES).toHaveLength(5);
    expect(new Set(SFX_FILES.map((sfx) => sfx.key)).size).toBe(5);
  });

  it('los .wav existen y son contenedores RIFF/WAVE PCM', () => {
    for (const sfx of SFX_FILES) {
      const name = sfx.path.split('/').pop();
      expect(name).toBeTruthy();
      const buffer = readFileSync(join(SFX_DIR, name as string));
      expect(buffer.toString('ascii', 0, 4)).toBe('RIFF');
      expect(buffer.toString('ascii', 8, 12)).toBe('WAVE');
      expect(buffer.length).toBeGreaterThan(44);
    }
  });
});
