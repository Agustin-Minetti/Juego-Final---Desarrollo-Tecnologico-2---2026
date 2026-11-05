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
 * Botón de UI generado por código (rectángulo + texto) con la paleta de
 * `colors.ts`. Se ilumina al pasar el cursor (cursor de mano) y responde solo
 * dentro de su rectángulo.
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
  const root = scene.add.container(x, y, [background, text]);
  root.setSize(width, height);
  // Zona de clic: en un Container, Phaser mide el puntero desde la esquina
  // superior izquierda del tamaño (suma displayOriginX/Y), así que el
  // rectángulo va de (0, 0) a (width, height) y coincide con el botón dibujado.
  const interactiveConfig: Phaser.Types.Input.InputConfiguration = {
    hitArea: new Phaser.Geom.Rectangle(0, 0, width, height),
    hitAreaCallback: Phaser.Geom.Rectangle.Contains,
    useHandCursor: true,
  };

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
      root.setInteractive(interactiveConfig);
    } else {
      root.disableInteractive();
    }
  };

  root.on('pointerover', () => {
    if (enabled) {
      background.setFillStyle(colorToNumber(COLORS.gateEdge));
      text.setColor(COLORS.lumo);
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
