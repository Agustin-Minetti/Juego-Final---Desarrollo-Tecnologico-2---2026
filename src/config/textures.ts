export const TEXTURE_KEYS = {
  wall: 'wall',
  lumo: 'lumo',
  umbra: 'umbra',
} as const;

export type TextureKey = (typeof TEXTURE_KEYS)[keyof typeof TEXTURE_KEYS];
