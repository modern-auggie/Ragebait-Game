import Phaser from 'phaser';
import { gameConfig } from './game/config';
import { installMobileViewport } from './game/systems/MobileViewport';
import './game/styles/mobile.css';

const viewport = installMobileViewport();
const game = new Phaser.Game(gameConfig);

viewport.onChange(() => {
  game.scale.refresh();
});

const isLocalDevHost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

if ('serviceWorker' in navigator && !isLocalDevHost) {
  window.addEventListener('load', () => {
    void navigator.serviceWorker.register('/sw.js');
  });
}
