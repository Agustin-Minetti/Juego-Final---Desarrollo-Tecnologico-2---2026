export const TEXTURE_KEYS = {
  background: 'background',
  wall: 'wall',
  wallTop: 'wallTop',
  lightPit: 'lightPit',
  lightPitTop: 'lightPitTop',
  shadowPit: 'shadowPit',
  shadowPitTop: 'shadowPitTop',
  abyss: 'abyss',
  abyssTop: 'abyssTop',
  lumo: 'lumo',
  umbra: 'umbra',
  lumoAura: 'lumoAura',
  umbraAura: 'umbraAura',
  doorLumo: 'doorLumo',
  doorUmbra: 'doorUmbra',
  archLumo: 'archLumo',
  archUmbra: 'archUmbra',
  button: 'button',
  lever: 'lever',
  gate: 'gate',
  gemGold: 'gemGold',
  gemViolet: 'gemViolet',
  crystal: 'crystal',
  barrier: 'barrier',
  spark: 'spark',
  smoke: 'smoke',
  sunBadge: 'sunBadge',
  moonBadge: 'moonBadge',
} as const;

export type TextureKey = (typeof TEXTURE_KEYS)[keyof typeof TEXTURE_KEYS];

/** Cantidad de variantes de piedra (`wall0`, `wall1`…, `wallTop0`…). */
export const WALL_VARIANTS = 3;

export function wallTextureKey(top: boolean, variant: number): string {
  return `${top ? TEXTURE_KEYS.wallTop : TEXTURE_KEYS.wall}${variant}`;
}
