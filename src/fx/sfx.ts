import type Phaser from 'phaser';
import { SFX_VOLUME, type SfxKey } from '../config/audio';

/**
 * Reproduce un efecto si su recurso está cargado. Nunca lanza: si falta el
 * archivo o el audio no está disponible, el juego sigue sin sonido.
 */
export function playSfx(scene: Phaser.Scene, key: SfxKey): void {
  try {
    if (!scene.sound.get(key)) {
      return;
    }
    scene.sound.play(key, { volume: SFX_VOLUME });
  } catch {
    // Audio no disponible: se ignora.
  }
}
