import Phaser from 'phaser';
import { COLORS, colorToNumber } from '../config/colors';

export interface UiButtonOptions {
  width?: number;
  height?: number;
  enabled?: boolean;
  fontSize?: number;
}

export interface UiButton {
  readonly root: Phaser.GameObjects.Container;
  readonly label: Phaser.GameObjects.Text;
  setEnabled(enabled: boolean): void;
}

export function textStyle(color: string, fontSize: number): Phaser.Types.GameObjects.Text.TextStyle {
  return { fontFamily: 'monospace', fontSize: `${fontSize}px`, color };
}

/**
 * Botón de UI provisional generado por código (rectángulo + texto) con la
 * paleta de `colors.ts`. Se ajusta en el Hito 6 (pulido).
 */
export function createButton(
  scene: Phaser.Scene,
  x: number,
  y: number,
  label: string,
  onClick: () => void,
  options: UiButtonOptions = {},
): UiButton {
  const width = options.width ?? 240;
  const height = options.height ?? 46;
  const fontSize = options.fontSize ?? 20;

  const background = scene.add.rectangle(0, 0, width, height, colorToNumber(COLORS.gate));
  const text = scene.add.text(0, 0, label, textStyle(COLORS.text, fontSize)).setOrigin(0.5);
  const hitArea = new Phaser.Geom.Rectangle(-width / 2, -height / 2, width, height);
  const root = scene.add.container(x, y, [background, text]);
  root.setSize(width, height);
  root.setInteractive(hitArea, Phaser.Geom.Rectangle.Contains);

  let enabled = options.enabled ?? true;

  const paint = (): void => {
    background.setFillStyle(
      colorToNumber(enabled ? COLORS.gate : COLORS.wall),
      enabled ? 1 : 0.7,
    );
    background.setStrokeStyle(2, colorToNumber(enabled ? COLORS.gateEdge : COLORS.wallEdge));
    text.setColor(enabled ? COLORS.text : COLORS.wallEdge);
  };

  const setEnabled = (value: boolean): void => {
    enabled = value;
    paint();
    if (enabled) {
      root.setInteractive(hitArea, Phaser.Geom.Rectangle.Contains);
    } else {
      root.disableInteractive();
    }
  };

  root.on('pointerover', () => {
    if (enabled) {
      background.setFillStyle(colorToNumber(COLORS.gateEdge));
    }
  });
  root.on('pointerout', paint);
  root.on('pointerdown', () => {
    if (enabled) {
      onClick();
    }
  });

  setEnabled(enabled);

  return { root, label: text, setEnabled };
}
