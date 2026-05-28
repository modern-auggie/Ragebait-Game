import Phaser from 'phaser';
import { GAME_WIDTH } from '../config';

export class Hud {
  private readonly levelText: Phaser.GameObjects.Text;
  private readonly deathText: Phaser.GameObjects.Text;
  private readonly messageText: Phaser.GameObjects.Text;
  private readonly items: Phaser.GameObjects.GameObject[] = [];
  private messageClearEvent?: Phaser.Time.TimerEvent;

  constructor(
    private scene: Phaser.Scene,
    actions: { onRestart: () => void; onHome: () => void; onSettings: () => void },
  ) {
    this.levelText = scene.add
      .text(20, 18, 'Level 1', {
        fontFamily: '"Arial Black", Impact, Inter, Arial, sans-serif',
        fontSize: '18px',
        color: '#fee2e2',
        fontStyle: '900',
        stroke: '#450a0a',
        strokeThickness: 4,
      })
      .setDepth(100)
      .setScrollFactor(0);
    this.levelText.setResolution(2);

    this.deathText = scene.add
      .text(20, 44, 'Deaths 0', {
        fontFamily: '"Arial Black", Impact, Inter, Arial, sans-serif',
        fontSize: '15px',
        color: '#fecaca',
        fontStyle: '800',
      })
      .setDepth(100)
      .setScrollFactor(0);
    this.deathText.setResolution(2);

    this.createHudButton(GAME_WIDTH - 258, 18, 74, 'HOME', actions.onHome);
    this.createHudButton(GAME_WIDTH - 176, 18, 74, 'SET', actions.onSettings);
    this.createHudButton(GAME_WIDTH - 94, 18, 74, 'R', actions.onRestart);

    this.messageText = scene.add
      .text(GAME_WIDTH / 2, 74, '', {
        fontFamily: '"Arial Black", Impact, Inter, Arial, sans-serif',
        fontSize: '15px',
        color: '#ffb4b4',
        fontStyle: '900',
        align: 'center',
        wordWrap: { width: GAME_WIDTH - 48 },
      })
      .setOrigin(0.5)
      .setDepth(100)
      .setScrollFactor(0)
      .setAlpha(0);
    this.messageText.setResolution(2);
    this.items.push(this.levelText, this.deathText, this.messageText);
  }

  setLevel(levelName: string): void {
    this.levelText.setText(`Level ${levelName}`);
  }

  setDeaths(deaths: number): void {
    this.deathText.setText(`Deaths ${deaths}`);
  }

  showMessage(message: string, duration = 1300): void {
    this.messageClearEvent?.remove(false);
    this.messageText.setText(message);
    this.scene.tweens.killTweensOf(this.messageText);
    this.messageText.setAlpha(0).setY(74).setScale(1);
    this.scene.tweens.add({
      targets: this.messageText,
      alpha: 1,
      y: 68,
      duration: 130,
      ease: 'Sine.Out',
      onComplete: () => {
        this.messageClearEvent = this.scene.time.delayedCall(duration, () => this.clearMessage(true));
      },
    });
  }

  clearMessage(animated = false): void {
    this.messageClearEvent?.remove(false);
    this.messageClearEvent = undefined;
    this.scene.tweens.killTweensOf(this.messageText);
    if (!animated) {
      this.messageText.setText('').setAlpha(0).setY(74).setScale(1);
      return;
    }
    this.scene.tweens.add({
      targets: this.messageText,
      alpha: 0,
      y: 62,
      duration: 180,
      ease: 'Sine.In',
      onComplete: () => this.messageText.setText('').setY(74).setScale(1),
    });
  }

  destroy(): void {
    this.messageClearEvent?.remove(false);
    this.items.forEach((item) => item.destroy());
  }

  private createHudButton(x: number, y: number, width: number, label: string, onClick: () => void): void {
    const panel = this.scene.add.graphics();
    panel.setDepth(100);
    panel.setScrollFactor(0);
    panel.fillStyle(0x1f070b, 0.88);
    panel.fillRoundedRect(x, y, width, 34, 4);
    panel.lineStyle(3, 0x050104, 0.9);
    panel.strokeRoundedRect(x, y, width, 34, 4);
    panel.lineStyle(1, 0xffd7d7, 0.28);
    panel.strokeRoundedRect(x + 5, y + 5, width - 10, 24, 2);
    panel.setInteractive(new Phaser.Geom.Rectangle(x, y, width, 34), Phaser.Geom.Rectangle.Contains);
    panel.on('pointerdown', onClick);

    const text = this.scene.add
      .text(x + width / 2, y + 17, label, {
        fontFamily: '"Arial Black", Impact, Inter, Arial, sans-serif',
        fontSize: label.length > 1 ? '13px' : '17px',
        color: '#fee2e2',
        fontStyle: '900',
      })
      .setOrigin(0.5)
      .setDepth(101)
      .setScrollFactor(0);
    text.setResolution(2);
    this.items.push(panel, text);
  }
}
