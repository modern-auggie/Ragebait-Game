import Phaser from 'phaser';
import { TouchControls } from './TouchControls';

export interface InputState {
  left: boolean;
  right: boolean;
  jumpDown: boolean;
  jumpPressed: boolean;
  restartPressed: boolean;
}

export class InputController {
  readonly touch: TouchControls;
  private readonly keys: Record<'left' | 'right' | 'a' | 'd' | 'space' | 'w' | 'up' | 'r', Phaser.Input.Keyboard.Key>;
  private lastJumpDown = false;
  private lastRestartDown = false;

  constructor(private scene: Phaser.Scene) {
    this.touch = new TouchControls(scene);
    const keyboard = scene.input.keyboard;
    if (!keyboard) {
      throw new Error('Keyboard input is unavailable.');
    }
    this.keys = {
      left: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.LEFT),
      right: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.RIGHT),
      a: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A),
      d: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D),
      space: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE),
      w: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W),
      up: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.UP),
      r: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.R),
    };
  }

  update(): InputState {
    const left = this.keys.left.isDown || this.keys.a.isDown || this.touch.left;
    const right = this.keys.right.isDown || this.keys.d.isDown || this.touch.right;
    const jumpDown = this.keys.space.isDown || this.keys.w.isDown || this.keys.up.isDown || this.touch.jump;
    const restartDown = this.keys.r.isDown;
    const jumpPressed = (jumpDown && !this.lastJumpDown) || this.touch.consumeJumpPressed();
    const restartPressed = restartDown && !this.lastRestartDown;

    this.lastJumpDown = jumpDown;
    this.lastRestartDown = restartDown;

    return { left, right, jumpDown, jumpPressed, restartPressed };
  }

  destroy(): void {
    this.touch.destroy();
  }
}
