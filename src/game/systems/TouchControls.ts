import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from '../config';
import type { ControlMode } from './GameSettings';

type TouchKey = 'left' | 'right' | 'jump';

export class TouchControls {
  left = false;
  right = false;
  jump = false;
  private jumpPressed = false;
  private readonly items: Phaser.GameObjects.GameObject[] = [];
  private joystickPointerId?: number;
  private readonly joystickCenter = { x: 112, y: GAME_HEIGHT - 72 };

  constructor(
    private scene: Phaser.Scene,
    private mode: ControlMode,
  ) {
    this.rebuild(mode);
  }

  rebuild(mode: ControlMode): void {
    this.destroy();
    this.left = false;
    this.right = false;
    this.jump = false;
    this.joystickPointerId = undefined;
    this.mode = mode;
    if (mode === 'joystick') {
      this.createJoystick();
    } else {
      this.createButton('left', 72, GAME_HEIGHT - 72, '◀');
      this.createButton('right', 156, GAME_HEIGHT - 72, '▶');
    }
    this.createButton('jump', GAME_WIDTH - 86, GAME_HEIGHT - 78, '▲', 76);
  }

  consumeJumpPressed(): boolean {
    const pressed = this.jumpPressed;
    this.jumpPressed = false;
    return pressed;
  }

  destroy(): void {
    while (this.items.length > 0) {
      this.items.pop()?.destroy();
    }
  }

  private createButton(key: TouchKey, x: number, y: number, label: string, size = 58): void {
    const button = this.scene.add.graphics();
    button.setDepth(100);
    button.setScrollFactor(0);

    const draw = (down: boolean): void => {
      button.clear();
      button.fillStyle(0x050104, 0.82);
      button.fillRoundedRect(x - size / 2 + 5, y - size / 2 + 6, size, size, 4);
      button.fillStyle(down ? 0x991b1b : 0x21060b, 0.94);
      button.fillRoundedRect(x - size / 2, y - size / 2, size, size, 4);
      button.lineStyle(4, down ? 0xff3b3b : 0x7f1d1d, 0.96);
      button.strokeRoundedRect(x - size / 2, y - size / 2, size, size, 4);
      button.lineStyle(1, 0xffffff, 0.22);
      button.strokeRoundedRect(x - size / 2 + 7, y - size / 2 + 7, size - 14, size - 14, 2);
    };
    draw(false);
    button.setInteractive(new Phaser.Geom.Rectangle(x - size / 2, y - size / 2, size, size), Phaser.Geom.Rectangle.Contains);

    const text = this.scene.add
      .text(x, y - 1, label, {
        fontFamily: '"Arial Black", Impact, Inter, Arial, sans-serif',
        fontSize: key === 'jump' ? '34px' : '30px',
        color: '#fee2e2',
        fontStyle: '900',
        stroke: '#050712',
        strokeThickness: 4,
      })
      .setOrigin(0.5)
      .setDepth(102)
      .setScrollFactor(0);

    const setState = (down: boolean): void => {
      this[key] = down;
      draw(down);
      this.scene.tweens.killTweensOf(text);
      this.scene.tweens.add({
        targets: text,
        scaleX: down ? 0.94 : 1,
        scaleY: down ? 0.94 : 1,
        duration: 55,
      });
      if (key === 'jump' && down) {
        this.jumpPressed = true;
      }
    };

    button.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      pointer.event?.preventDefault();
      setState(true);
    });
    button.on('pointerup', () => setState(false));
    button.on('pointerout', () => setState(false));
    button.on('pointerupoutside', () => setState(false));

    this.items.push(button, text);
  }

  private createJoystick(): void {
    const radius = 54;
    const knobRadius = 22;
    const base = this.scene.add.graphics();
    base.setDepth(100);
    base.setScrollFactor(0);
    const knob = this.scene.add.graphics();
    knob.setDepth(101);
    knob.setScrollFactor(0);

    const draw = (knobX = this.joystickCenter.x): void => {
      base.clear();
      base.fillStyle(0x050104, 0.82);
      base.fillRoundedRect(this.joystickCenter.x - radius + 5, this.joystickCenter.y - radius + 6, radius * 2, radius * 2, 8);
      base.fillStyle(0x21060b, 0.9);
      base.fillRoundedRect(this.joystickCenter.x - radius, this.joystickCenter.y - radius, radius * 2, radius * 2, 8);
      base.lineStyle(4, 0x7f1d1d, 0.92);
      base.strokeRoundedRect(this.joystickCenter.x - radius, this.joystickCenter.y - radius, radius * 2, radius * 2, 8);
      base.lineStyle(1, 0xffd7d7, 0.24);
      base.lineBetween(this.joystickCenter.x - 34, this.joystickCenter.y, this.joystickCenter.x + 34, this.joystickCenter.y);
      knob.clear();
      knob.fillStyle(0xff3b3b, 0.95);
      knob.fillRoundedRect(knobX - knobRadius, this.joystickCenter.y - knobRadius, knobRadius * 2, knobRadius * 2, 5);
      knob.lineStyle(3, 0x050104, 0.95);
      knob.strokeRoundedRect(knobX - knobRadius, this.joystickCenter.y - knobRadius, knobRadius * 2, knobRadius * 2, 5);
    };
    draw();

    base.setInteractive(
      new Phaser.Geom.Rectangle(this.joystickCenter.x - radius, this.joystickCenter.y - radius, radius * 2, radius * 2),
      Phaser.Geom.Rectangle.Contains,
    );

    const update = (pointer: Phaser.Input.Pointer): void => {
      const dx = Phaser.Math.Clamp(pointer.x - this.joystickCenter.x, -38, 38);
      this.left = dx < -10;
      this.right = dx > 10;
      draw(this.joystickCenter.x + dx);
    };

    const release = (): void => {
      this.left = false;
      this.right = false;
      this.joystickPointerId = undefined;
      draw();
    };

    base.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      pointer.event?.preventDefault();
      this.joystickPointerId = pointer.id;
      update(pointer);
    });
    base.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (this.joystickPointerId === pointer.id) update(pointer);
    });
    base.on('pointerup', release);
    base.on('pointerout', release);
    base.on('pointerupoutside', release);

    this.items.push(base, knob);
  }
}
