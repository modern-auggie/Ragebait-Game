import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from '../config';
import { drawBackground } from '../systems/Effects';

export class TitleScene extends Phaser.Scene {
  constructor() {
    super('TitleScene');
  }

  create(): void {
    drawBackground(this);

    const title = this.add
      .text(GAME_WIDTH / 2, 92, 'RAGEBAIT', {
        fontFamily: '"Arial Black", Impact, Inter, Arial, sans-serif',
        fontSize: '58px',
        color: '#fee2e2',
        fontStyle: '900',
        align: 'center',
        stroke: '#450a0a',
        strokeThickness: 10,
      })
      .setOrigin(0.5);

    const subtitle = this.add
      .text(GAME_WIDTH / 2, 148, 'Round 1: five floor crimes.', {
        fontFamily: '"Arial Black", Impact, Inter, Arial, sans-serif',
        fontSize: '16px',
        color: '#fecaca',
        fontStyle: '800',
      })
      .setOrigin(0.5);

    const start = this.add.graphics();
    start.fillStyle(0x050104, 0.65);
    start.fillRoundedRect(GAME_WIDTH / 2 - 86, 207, 172, 58, 6);
    start.fillStyle(0xdc2626, 1);
    start.fillRoundedRect(GAME_WIDTH / 2 - 90, 200, 172, 58, 6);
    start.lineStyle(3, 0x050104, 0.95);
    start.strokeRoundedRect(GAME_WIDTH / 2 - 90, 200, 172, 58, 6);
    start.lineStyle(1, 0xffd7d7, 0.55);
    start.strokeRoundedRect(GAME_WIDTH / 2 - 84, 206, 160, 46, 3);
    start.setInteractive(new Phaser.Geom.Rectangle(GAME_WIDTH / 2 - 90, 200, 172, 58), Phaser.Geom.Rectangle.Contains);

    const startText = this.add
      .text(GAME_WIDTH / 2 - 4, 229, 'START', {
        fontFamily: '"Arial Black", Impact, Inter, Arial, sans-serif',
        fontSize: '21px',
        color: '#fee2e2',
        fontStyle: '900',
        stroke: '#450a0a',
        strokeThickness: 4,
      })
      .setOrigin(0.5);

    start.on('pointerdown', () => {
      this.scene.start('GameScene', { levelIndex: 0, deaths: 0 });
    });

    this.tweens.add({
      targets: [title, subtitle, start, startText],
      y: '+=8',
      duration: 1600,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.InOut',
    });

    for (let i = 0; i < 9; i += 1) {
      const block = this.add.rectangle(
        Phaser.Math.Between(30, GAME_WIDTH - 30),
        GAME_HEIGHT + Phaser.Math.Between(0, 260),
        Phaser.Math.Between(18, 48),
        Phaser.Math.Between(8, 18),
        0xff243f,
        0.22,
      );
      block.setAngle(Phaser.Math.Between(-8, 8));
      this.tweens.add({
        targets: block,
        y: -40,
        duration: Phaser.Math.Between(6000, 10000),
        repeat: -1,
        delay: Phaser.Math.Between(0, 2800),
        ease: 'Linear',
      });
    }
  }
}
