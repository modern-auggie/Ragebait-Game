import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from '../config';

type TouchKey = 'left' | 'right' | 'jump';

export class TouchControls {
  left = false;
  right = false;
  jump = false;
  private jumpPressed = false;
  private readonly items: Phaser.GameObjects.GameObject[] = [];

  constructor(private scene: Phaser.Scene) {
    this.createButton('left', 64, GAME_HEIGHT - 50, '<');
    this.createButton('right', 136, GAME_HEIGHT - 50, '>');
    this.createButton('jump', GAME_WIDTH - 76, GAME_HEIGHT - 54, '^', 64);
  }

  consumeJumpPressed(): boolean {
    const pressed = this.jumpPressed;
    this.jumpPressed = false;
    return pressed;
  }

  destroy(): void {
    this.items.forEach((item) => item.destroy());
  }

  private createButton(key: TouchKey, x: number, y: number, label: string, size = 58): void {
    const button = this.scene.add.graphics();
    button.setDepth(100);
    button.setScrollFactor(0);

    const draw = (down: boolean): void => {
      button.clear();
      button.fillStyle(0x050712, 0.72);
      button.fillRoundedRect(x - size / 2 + 4, y - size / 2 + 5, size, size, 5);
      button.fillStyle(down ? 0x7f1d1d : 0x1f0b10, 0.9);
      button.fillRoundedRect(x - size / 2, y - size / 2, size, size, 5);
      button.lineStyle(3, down ? 0xff3b3b : 0x7f1d1d, 0.92);
      button.strokeRoundedRect(x - size / 2, y - size / 2, size, size, 5);
      button.lineStyle(1, 0xffffff, 0.22);
      button.strokeRoundedRect(x - size / 2 + 5, y - size / 2 + 5, size - 10, size - 10, 3);
    };
    draw(false);
    button.setInteractive(new Phaser.Geom.Rectangle(x - size / 2, y - size / 2, size, size), Phaser.Geom.Rectangle.Contains);

    const text = this.scene.add
      .text(x, y - 1, label, {
        fontFamily: '"Arial Black", Impact, Inter, Arial, sans-serif',
        fontSize: key === 'jump' ? '30px' : '28px',
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
}
