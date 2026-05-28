import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from '../config';
import { addBurst, drawBackground } from '../systems/Effects';
import { AudioSystem } from '../systems/AudioSystem';

export class EndScene extends Phaser.Scene {
  constructor() {
    super('EndScene');
  }

  create(data: { deaths?: number }): void {
    drawBackground(this);
    const deaths = data.deaths ?? 0;

    const title = this.add
      .text(GAME_WIDTH / 2, 92, 'Demo complete', {
        fontFamily: '"Arial Black", Impact, Inter, Arial, sans-serif',
        fontSize: '42px',
        color: '#fee2e2',
        fontStyle: '900',
        align: 'center',
        stroke: '#450a0a',
        strokeThickness: 8,
      })
      .setOrigin(0.5);
    title.setResolution(2);

    const deathsText = this.add
      .text(GAME_WIDTH / 2, 154, `Total deaths: ${deaths}`, {
        fontFamily: '"Arial Black", Impact, Inter, Arial, sans-serif',
        fontSize: '22px',
        color: '#fecaca',
        fontStyle: '900',
      })
      .setOrigin(0.5);
    deathsText.setResolution(2);

    const replay = this.add.graphics();
    replay.fillStyle(0xdc2626, 1);
    replay.fillRoundedRect(GAME_WIDTH / 2 - 86, 210, 172, 54, 6);
    replay.lineStyle(3, 0x050104, 0.95);
    replay.strokeRoundedRect(GAME_WIDTH / 2 - 86, 210, 172, 54, 6);
    replay.lineStyle(1, 0xffd7d7, 0.55);
    replay.strokeRoundedRect(GAME_WIDTH / 2 - 80, 216, 160, 42, 3);
    replay.setInteractive(new Phaser.Geom.Rectangle(GAME_WIDTH / 2 - 86, 210, 172, 54), Phaser.Geom.Rectangle.Contains);

    const replayText = this.add
      .text(GAME_WIDTH / 2, 237, 'REPLAY', {
        fontFamily: '"Arial Black", Impact, Inter, Arial, sans-serif',
        fontSize: '21px',
        color: '#fee2e2',
        fontStyle: '900',
        stroke: '#450a0a',
        strokeThickness: 4,
      })
      .setOrigin(0.5);
    replayText.setResolution(2);

    replay.on('pointerdown', () => {
      AudioSystem.sfx('ui');
      this.scene.start('GameScene', { levelIndex: 0, deaths: 0 });
    });

    for (let i = 0; i < 4; i += 1) {
      this.time.delayedCall(i * 160, () => addBurst(this, GAME_WIDTH / 2, GAME_HEIGHT / 2 - 32, 0xff243f, 16));
    }
  }
}
