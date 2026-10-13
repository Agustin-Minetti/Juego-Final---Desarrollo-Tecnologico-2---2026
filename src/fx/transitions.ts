import Phaser from 'phaser';
import { COLORS, colorToNumber } from '../config/colors';

const FADE_MS = 250;

function bg(): { r: number; g: number; b: number } {
  const color = Phaser.Display.Color.IntegerToColor(colorToNumber(COLORS.background));
  return { r: color.red, g: color.green, b: color.blue };
}

/** Fundido de entrada al abrir una escena. */
export function fadeIn(scene: Phaser.Scene, duration = 220): void {
  const { r, g, b } = bg();
  scene.cameras.main.fadeIn(duration, r, g, b);
}

/** Fundido de salida y, al terminar, ejecuta `onComplete` (cambio de escena). */
export function fadeOutThen(scene: Phaser.Scene, onComplete: () => void, duration = FADE_MS): void {
  const { r, g, b } = bg();
  scene.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, onComplete);
  scene.cameras.main.fadeOut(duration, r, g, b);
}
