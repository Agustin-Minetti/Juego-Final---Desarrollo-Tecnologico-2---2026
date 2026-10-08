import Phaser from 'phaser';
import { ACCELERATION, JUMP_CUT_FACTOR, JUMP_VELOCITY, MOVE_SPEED } from '../config/physics.ts';
import { createJumpState, updateJump, type JumpState } from '../logic/movement.ts';

export interface PlayerKeys {
  left: Phaser.Input.Keyboard.Key;
  right: Phaser.Input.Keyboard.Key;
  jump: Phaser.Input.Keyboard.Key;
}

export class Player extends Phaser.Physics.Arcade.Sprite {
  private jumpState: JumpState = createJumpState();

  constructor(scene: Phaser.Scene, x: number, y: number, texture: string) {
    super(scene, x, y, texture);
    scene.add.existing(this);
    scene.physics.add.existing(this);

    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setSize(24, 40, true);
    body.setCollideWorldBounds(true);
    body.setDragX(ACCELERATION);
    body.maxVelocity.x = MOVE_SPEED;
  }

  update(time: number, input: PlayerKeys | null): void {
    const body = this.body as Phaser.Physics.Arcade.Body;

    if (!input) {
      body.setAccelerationX(0);
      body.setVelocityX(0);
      return;
    }

    const direction = (input.right.isDown ? 1 : 0) - (input.left.isDown ? 1 : 0);
    body.setAccelerationX(direction * ACCELERATION);

    const grounded = body.blocked.down || body.touching.down;
    const result = updateJump(this.jumpState, {
      now: time,
      grounded,
      pressed: Phaser.Input.Keyboard.JustDown(input.jump),
      released: Phaser.Input.Keyboard.JustUp(input.jump),
    });
    this.jumpState = result.state;

    if (result.jump) {
      body.setVelocityY(JUMP_VELOCITY);
    }
    if (result.cut && body.velocity.y < 0) {
      body.setVelocityY(body.velocity.y * JUMP_CUT_FACTOR);
    }
  }
}
