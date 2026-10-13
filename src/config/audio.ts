export const SFX_KEYS = {
  jump: 'sfx-jump',
  gem: 'sfx-gem',
  button: 'sfx-button',
  death: 'sfx-death',
  victory: 'sfx-victory',
} as const;

export type SfxKey = (typeof SFX_KEYS)[keyof typeof SFX_KEYS];

/** Solo estos cinco eventos tienen sonido (DESIGN → Estética, juice y sonido). */
export const SFX_FILES: ReadonlyArray<{ key: SfxKey; path: string }> = [
  { key: SFX_KEYS.jump, path: 'sfx/jump.wav' },
  { key: SFX_KEYS.gem, path: 'sfx/gem.wav' },
  { key: SFX_KEYS.button, path: 'sfx/button.wav' },
  { key: SFX_KEYS.death, path: 'sfx/death.wav' },
  { key: SFX_KEYS.victory, path: 'sfx/victory.wav' },
];

export const SFX_VOLUME = 0.5;
