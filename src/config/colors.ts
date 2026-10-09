import Phaser from 'phaser';

export const COLORS = {
  background: '#1a1626',
  wall: '#2e2a3d',
  wallEdge: '#4a4463',
  text: '#f5efe0',
  lumo: '#ffd166',
  lumoHalo: '#ffe9a8',
  umbra: '#7b4bbd',
  umbraOutline: '#c9a6ff',
  lightPit: '#ffe08a',
  shadowPit: '#4b2d73',
  abyss: '#0f0b1a',
  button: '#e0a458',
  lever: '#c9a6ff',
  gate: '#8a7fb0',
  gateEdge: '#b0a5cc',
  gemGold: '#ffcf40',
  gemViolet: '#9b6bd6',
  crystal: '#3b2a55',
  crystalEdge: '#6d5a8f',
  barrier: '#ffe9a8',
  barrierEdge: '#fff6cf',
} as const;

/** Color por ID de switch (botón/palanca/compuerta); el ID es la vinculación. */
export const SWITCH_COLORS: Readonly<Record<string, string>> = {
  rojo: '#e0705c',
  azul: '#5c8fe0',
  verde: '#6fbf73',
  amarillo: '#e0c25c',
};

export function colorForSwitch(id: string): string {
  return SWITCH_COLORS[id] ?? COLORS.gateEdge;
}

export function colorToNumber(color: string): number {
  return Phaser.Display.Color.HexStringToColor(color).color;
}
