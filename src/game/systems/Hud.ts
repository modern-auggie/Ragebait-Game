import Phaser from 'phaser';
import { GAME_WIDTH } from '../config';

export class Hud {
  private readonly levelText: Phaser.GameObjects.Text;
  private readonly deathText: Phaser.GameObjects.Text;
  private readonly messageText: Phaser.GameObjects.Text;
  private readonly restartPanel: Phaser.GameObjects.Graphics;
  private readonly restartText: Phaser.GameObjects.Text;

  constructor(private scene: Phaser.Scene, onRestart: () => void) {
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

    this.deathText = scene.add
      .text(20, 44, 'Deaths 0', {
        fontFamily: '"Arial Black", Impact, Inter, Arial, sans-serif',
        fontSize: '15px',
        color: '#fecaca',
        fontStyle: '800',
      })
      .setDepth(100)
      .setScrollFactor(0);

    this.restartPanel = scene.add.graphics();
    this.restartPanel.setDepth(100);
    this.restartPanel.setScrollFactor(0);
    this.restartPanel.fillStyle(0x1f070b, 0.86);
    this.restartPanel.fillRoundedRect(GAME_WIDTH - 90, 18, 70, 34, 5);
    this.restartPanel.lineStyle(3, 0x050104, 0.9);
    this.restartPanel.strokeRoundedRect(GAME_WIDTH - 90, 18, 70, 34, 5);
    this.restartPanel.lineStyle(1, 0xffd7d7, 0.28);
    this.restartPanel.strokeRoundedRect(GAME_WIDTH - 84, 23, 58, 24, 3);
    this.restartPanel.setInteractive(
      new Phaser.Geom.Rectangle(GAME_WIDTH - 90, 18, 70, 34),
      Phaser.Geom.Rectangle.Contains,
    );
    this.restartPanel.on('pointerdown', onRestart);

    this.restartText = scene.add
      .text(GAME_WIDTH - 55, 35, 'R', {
        fontFamily: '"Arial Black", Impact, Inter, Arial, sans-serif',
        fontSize: '17px',
        color: '#fee2e2',
        fontStyle: '900',
      })
      .setOrigin(0.5)
      .setDepth(101)
      .setScrollFactor(0);

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
  }

  setLevel(levelNumber: number, levelName: string): void {
    this.levelText.setText(`Level ${levelNumber}: ${levelName}`);
  }

  setDeaths(deaths: number): void {
    this.deathText.setText(`Deaths ${deaths}`);
  }

  showMessage(message: string, duration = 1300): void {
    this.messageText.setText(message);
    this.scene.tweens.killTweensOf(this.messageText);
    this.messageText.setAlpha(0).setY(74);
    this.scene.tweens.add({
      targets: this.messageText,
      alpha: 1,
      y: 68,
      duration: 130,
      ease: 'Sine.Out',
      yoyo: true,
      hold: duration,
    });
  }

  destroy(): void {
    this.levelText.destroy();
    this.deathText.destroy();
    this.messageText.destroy();
    this.restartPanel.destroy();
    this.restartText.destroy();
  }
}
