import Phaser from 'phaser';
import { EndScene } from './scenes/EndScene';
import { GameScene } from './scenes/GameScene';
import { TitleScene } from './scenes/TitleScene';

export const GAME_WIDTH = 960;
export const GAME_HEIGHT = 540;

export const gameConfig: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: 'game-container',
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  backgroundColor: '#120408',
  render: {
    antialias: false,
    pixelArt: true,
    roundPixels: true,
  },
  scene: [TitleScene, GameScene, EndScene],
  input: {
    activePointers: 4,
  },
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { x: 0, y: 1250 },
      debug: false,
    },
  },
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: GAME_WIDTH,
    height: GAME_HEIGHT,
  },
};
