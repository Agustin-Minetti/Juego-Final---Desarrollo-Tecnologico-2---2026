import Phaser from 'phaser';
import { SFX_KEYS } from '../config/audio';
import { ACCELERATION, JUMP_VELOCITY, JUMP_CUT_FACTOR, MOVE_SPEED } from '../config/physics';
import { playSfx } from '../fx/sfx';
import { createJumpState, updateJump } from '../logic/movement';

export interface PlayerKeys {
  left: Phaser.Input.Keyboard.Key;
  right: Phaser.Input.Keyboard.Key;
  jump: Phaser.Input.Keyboard.Key;
}

const BODY_WIDTH = 24;
const BODY_HEIGHT = 40;
const BODY_OFFSET_X = 4;
const LAND_SQUASH_SPEED = 120;

export class Player extends Phaser.Physics.Arcade.Sprite {
  private jumpState = createJumpState();
  private wasGrounded = false;
  private lastVelocityY = 0;
  private squashTween?: Phaser.Tweens.Tween;

  constructor(scene: Phaser.Scene, x: number, y: number, texture: string) {
    super(scene, x, y, texture);
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setDepth(20);

    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setSize(BODY_WIDTH, BODY_HEIGHT, true);
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
    body.setOffset(BODY_OFFSET_X, BODY_HEIGHT / 2 / this.scaleY - BODY_HEIGHT / 2);
  }
}
