import Phaser from 'phaser';
import { SFX_KEYS } from '../config/audio';
import {
  ACCELERATION,
  JUMP_CUT_FACTOR,
  JUMP_VELOCITY,
  MOVE_SPEED,
  PLAYER_BODY_HEIGHT,
  PLAYER_BODY_WIDTH,
  PLAYER_TEXTURE_HEIGHT,
  PLAYER_TEXTURE_WIDTH,
} from '../config/physics';
import { playSfx } from '../fx/sfx';
import { createJumpState, updateJump } from '../logic/movement';

export interface PlayerKeys {
  left: Phaser.Input.Keyboard.Key;
  right: Phaser.Input.Keyboard.Key;
  jump: Phaser.Input.Keyboard.Key;
}

const BODY_OFFSET_X = (PLAYER_TEXTURE_WIDTH - PLAYER_BODY_WIDTH) / 2;
/** El cuerpo se apoya en el borde inferior de la textura (los pies). */
const BODY_OFFSET_Y = PLAYER_TEXTURE_HEIGHT - PLAYER_BODY_HEIGHT;
const LAND_SQUASH_SPEED = 120;
const FACING_THRESHOLD = 10;

export interface PlayerAuraConfig {
  texture: string;
  blendMode: Phaser.BlendModes;
  alpha: number;
  scale: number;
}

export class Player extends Phaser.Physics.Arcade.Sprite {
  private jumpState = createJumpState();
  private wasGrounded = false;
  private lastVelocityY = 0;
  private squashTween?: Phaser.Tweens.Tween;
  /** Halo (Lumo) o penumbra (Umbra) que acompaña al personaje. */
  readonly aura?: Phaser.GameObjects.Image;

  constructor(scene: Phaser.Scene, x: number, y: number, texture: string, aura?: PlayerAuraConfig) {
    super(scene, x, y, texture);
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setDepth(20);

    if (aura) {
      this.aura = scene.add
        .image(x, y, aura.texture)
        .setBlendMode(aura.blendMode)
        .setAlpha(aura.alpha)
        .setScale(aura.scale)
        .setDepth(6);
      scene.tweens.add({
        targets: this.aura,
        scale: aura.scale * 1.08,
        alpha: aura.alpha * 0.8,
        duration: 900,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
    }

    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setSize(PLAYER_BODY_WIDTH, PLAYER_BODY_HEIGHT, false);
    body.setOffset(BODY_OFFSET_X, BODY_OFFSET_Y);
    body.setCollideWorldBounds(true);
    body.setDragX(ACCELERATION);
    body.maxVelocity.x = MOVE_SPEED;
  }

  update(time: number, input: PlayerKeys | null): void {
    const body = this.body as Phaser.Physics.Arcade.Body;
    const grounded = body.blocked.down || body.touching.down;

    if (!input) {
      body.setAccelerationX(0);
      body.setVelocityX(0);
      this.updateVerticalFeel(grounded);
      this.syncDecor();
      return;
    }

    const direction = (input.right.isDown ? 1 : 0) - (input.left.isDown ? 1 : 0);
    body.setAccelerationX(direction * ACCELERATION);

    const result = updateJump(this.jumpState, {
      now: time,
      grounded,
      pressed: Phaser.Input.Keyboard.JustDown(input.jump),
      released: Phaser.Input.Keyboard.JustUp(input.jump),
    });
    this.jumpState = result.state;

    if (result.jump) {
      body.setVelocityY(JUMP_VELOCITY);
      playSfx(this.scene, SFX_KEYS.jump);
      this.playSquash(0.85, 1.15, 130);
    }
    if (result.cut && body.velocity.y < 0) {
      body.setVelocityY(body.velocity.y * JUMP_CUT_FACTOR);
    }

    this.updateVerticalFeel(grounded);
    this.syncDecor();
  }

  /** Mira hacia donde se mueve y arrastra el halo. */
  syncDecor(): void {
    const body = this.body as Phaser.Physics.Arcade.Body;
    if (body.velocity.x > FACING_THRESHOLD) {
      this.setFlipX(false);
    } else if (body.velocity.x < -FACING_THRESHOLD) {
      this.setFlipX(true);
    }
    this.aura?.setPosition(this.x, this.y);
  }

  /** Oculta al personaje (al morir, tras la explosión de partículas). */
  vanish(): void {
    this.setVisible(false);
    this.aura?.setVisible(false);
  }

  private updateVerticalFeel(grounded: boolean): void {
    const body = this.body as Phaser.Physics.Arcade.Body;
    if (grounded && !this.wasGrounded && this.lastVelocityY > LAND_SQUASH_SPEED) {
      this.playSquash(1.18, 0.82, 120);
    }
    this.wasGrounded = grounded;
    this.lastVelocityY = grounded ? 0 : body.velocity.y;
  }

  /** Squash & stretch manteniendo los pies en el suelo (offset del body por escala). */
  private playSquash(scaleX: number, scaleY: number, duration: number): void {
    this.squashTween?.stop();
    this.squashTween = this.scene.tweens.add({
      targets: this,
      scaleX: { from: 1, to: scaleX },
      scaleY: { from: 1, to: scaleY },
      duration,
      ease: 'Quad.easeOut',
      yoyo: true,
      onUpdate: () => this.syncBodyOffset(),
      onComplete: () => {
        this.setScale(1, 1);
        this.syncBodyOffset();
        this.squashTween = undefined;
      },
    });
  }

  private syncBodyOffset(): void {
    const body = this.body as Phaser.Physics.Arcade.Body;
    if (!body) {
      return;
    }
    // mantiene los pies del cuerpo en el mismo lugar aunque cambie la escala
    const halfTexture = PLAYER_TEXTURE_HEIGHT / 2;
    body.setOffset(BODY_OFFSET_X, halfTexture / this.scaleY - (PLAYER_BODY_HEIGHT - halfTexture));
  }
}
