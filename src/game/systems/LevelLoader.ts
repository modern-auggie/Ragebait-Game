import Phaser from 'phaser';
import { Button } from '../entities/Button';
import { Door } from '../entities/Door';
import { Platform } from '../entities/Platform';
import { SignText } from '../entities/SignText';
import { Spike } from '../entities/Spike';
import type { LevelDefinition } from '../levels/levelTypes';

export interface LoadedLevel {
  platforms: Platform[];
  spikes: Spike[];
  doors: Door[];
  buttons: Button[];
  signs: SignText[];
}

export function loadLevel(scene: Phaser.Scene, level: LevelDefinition): LoadedLevel {
  return {
    platforms: level.platforms.map((platform) => new Platform(scene, platform)),
    spikes: level.spikes.map((spike) => new Spike(scene, spike)),
    doors: level.doors.map((door) => new Door(scene, door)),
    buttons: (level.buttons ?? []).map((button) => new Button(scene, button)),
    signs: (level.signs ?? []).map((sign) => new SignText(scene, sign.x, sign.y, sign.text, sign.width)),
  };
}

export function destroyLoadedLevel(loaded?: LoadedLevel): void {
  if (!loaded) return;
  loaded.platforms.forEach((platform) => platform.destroy());
  loaded.spikes.forEach((spike) => spike.destroy());
  loaded.doors.forEach((door) => door.destroy());
  loaded.buttons.forEach((button) => button.destroy());
  loaded.signs.forEach((sign) => sign.destroy());
}
