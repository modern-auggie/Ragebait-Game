import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from '../config';
import { drawBackground } from '../systems/Effects';
import { AudioSystem } from '../systems/AudioSystem';
import { GameProgress } from '../systems/GameProgress';

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
    title.setResolution(2);

    const subtitle = this.add
      .text(GAME_WIDTH / 2, 150, 'Pick a level. Beat five rounds. Lower your deaths.', {
        fontFamily: '"Arial Black", Impact, Inter, Arial, sans-serif',
        fontSize: '16px',
        color: '#fecaca',
        fontStyle: '800',
      })
      .setOrigin(0.5);
    subtitle.setResolution(2);

    this.createLevelButtons();

    this.tweens.add({
      targets: [title, subtitle],
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

  private createLevelButtons(): void {
    const progress = GameProgress.get();
    const startX = 126;
    const y = 226;
    const gap = 166;
    for (let level = 1; level <= 5; level += 1) {
      const x = startX + (level - 1) * gap;
      const unlocked = GameProgress.isUnlocked(level);
      const best = progress.bestDeaths[String(level)];
      const button = this.add.graphics();
      button.fillStyle(0x050104, 0.65);
      button.fillRoundedRect(x - 61, y + 6, 122, 112, 6);
      button.fillStyle(unlocked ? 0xdc2626 : 0x2a1217, 1);
      button.fillRoundedRect(x - 64, y, 122, 112, 6);
      button.lineStyle(4, 0x050104, 0.96);
      button.strokeRoundedRect(x - 64, y, 122, 112, 6);
      button.lineStyle(1, unlocked ? 0xffd7d7 : 0x7f1d1d, 0.45);
      button.strokeRoundedRect(x - 56, y + 8, 106, 96, 3);

      const label = this.add
        .text(x - 3, y + 32, `LEVEL ${level}`, {
          fontFamily: '"Arial Black", Impact, Inter, Arial, sans-serif',
          fontSize: '18px',
          color: unlocked ? '#fee2e2' : '#9f7c7c',
          stroke: '#450a0a',
          strokeThickness: 4,
        })
        .setOrigin(0.5);
      label.setResolution(2);

      const sub = this.add
        .text(x - 3, y + 72, unlocked ? (best === undefined ? 'NO SCORE' : `BEST ${best}`) : 'LOCKED', {
          fontFamily: '"Arial Black", Impact, Inter, Arial, sans-serif',
          fontSize: '13px',
          color: unlocked ? '#fecaca' : '#7f5d5d',
          align: 'center',
        })
        .setOrigin(0.5);
      sub.setResolution(2);

      if (!unlocked) {
        const lock = this.add.graphics();
        lock.fillStyle(0x9f7c7c, 0.72);
        lock.fillRoundedRect(x - 14, y + 78, 22, 18, 3);
        lock.lineStyle(3, 0x9f7c7c, 0.72);
        lock.strokeRoundedRect(x - 10, y + 65, 14, 18, 7);
      } else {
        button.setInteractive(new Phaser.Geom.Rectangle(x - 64, y, 122, 112), Phaser.Geom.Rectangle.Contains);
        button.on('pointerdown', () => {
          AudioSystem.sfx('ui');
          AudioSystem.startMusic();
          this.scene.start('GameScene', { levelIndex: (level - 1) * 5, deaths: 0 });
        });
      }
    }
  }
}
