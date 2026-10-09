import Phaser from 'phaser';
import { colorForSwitch, colorToNumber } from '../config/colors';
import { TILE_SIZE } from '../config/game';
import { GATE_TWEEN_MS } from '../config/physics';
import { TEXTURE_KEYS } from '../config/textures';

type GatePhase = 'closed' | 'opening' | 'open' | 'closing';

/**
 * Compuerta: bloque sólido que se desliza hacia arriba al abrirse (tween de
 * 200 ms) y nunca mata (DESIGN → Elementos del nivel). Al cerrarse, si un
 * personaje ocupa el tile destino, detiene el cierre hasta que quede libre.
 */
export class Gate extends Phaser.Physics.Arcade.Image {
  readonly id: string;
  readonly tx: number;
  readonly ty: number;
  private readonly closedY: number;
  private readonly retractedY: number;
  private phase: GatePhase = 'closed';

  constructor(scene: Phaser.Scene, tx: number, ty: number, id: string) {
    const x = tx * TILE_SIZE + TILE_SIZE / 2;
    const y = ty * TILE_SIZE + TILE_SIZE / 2;
    super(scene, x, y, TEXTURE_KEYS.gate);
    this.id = id;
    this.tx = tx;
    this.ty = ty;
    this.closedY = y;
    this.retractedY = y - TILE_SIZE;
    scene.add.existing(this);
    scene.physics.add.existing(this);

    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setAllowGravity(false);
    body.setImmovable(true);
    this.setTint(colorToNumber(colorForSwitch(id)));
  }

  get isOpen(): boolean {
    return this.phase === 'open' || this.phase === 'opening';
  }

  /** `destinationOccupied`: hay un personaje en el tile que ocuparía al cerrar. */
  updateState(commandOpen: boolean, destinationOccupied: boolean): void {
    switch (this.phase) {
      case 'closed':
        if (commandOpen) {
          this.startOpening();
        }
        break;
      case 'opening':
        if (!commandOpen && !destinationOccupied) {
          this.startClosing();
        }
        break;
      case 'open':
        if (!commandOpen && !destinationOccupied) {
          this.startClosing();
        }
        break;
      case 'closing':
        if (commandOpen || destinationOccupied) {
          this.startOpening();
        }
        break;
    }
  }

  private startOpening(): void {
    this.phase = 'opening';
    this.setBodyEnabled(true);
    this.scene.tweens.killTweensOf(this);
    this.scene.tweens.add({
      targets: this,
      y: this.retractedY,
      duration: GATE_TWEEN_MS,
      onComplete: () => {
        this.phase = 'open';
        this.setBodyEnabled(false);
      },
    });
  }

  private startClosing(): void {
    this.phase = 'closing';
    this.setBodyEnabled(true);
    this.scene.tweens.killTweensOf(this);
    this.scene.tweens.add({
      targets: this,
      y: this.closedY,
      duration: GATE_TWEEN_MS,
      onComplete: () => {
        this.phase = 'closed';
      },
    });
  }

  /**
   * Al quedar totalmente abierta (retraída 1 tile), la compuerta comparte el
   * tile superior con la cabeza del personaje (hitbox de 40 px en un corredor
   * de 2 tiles), así que se desactiva su colisión para que no empuje al
   * jugador ni lo hunda en el piso. Al empezar a cerrarse vuelve a ser sólida.
   */
  private setBodyEnabled(enabled: boolean): void {
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.enable = enabled;
  }
}
