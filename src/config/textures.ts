export const TEXTURE_KEYS = {
  wall: 'wall',
  lightPit: 'lightPit',
  shadowPit: 'shadowPit',
  abyss: 'abyss',
  lumo: 'lumo',
  umbra: 'umbra',
  doorLumo: 'doorLumo',
  doorUmbra: 'doorUmbra',
  button: 'button',
  lever: 'lever',
  gate: 'gate',
  gemGold: 'gemGold',
  gemViolet: 'gemViolet',
  crystal: 'crystal',
  barrier: 'barrier',
} as const;

export type TextureKey = (typeof TEXTURE_KEYS)[keyof typeof TEXTURE_KEYS];
