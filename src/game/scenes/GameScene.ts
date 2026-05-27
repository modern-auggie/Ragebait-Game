import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from '../config';
import { Player } from '../entities/Player';
import type { Platform } from '../entities/Platform';
import { LEVELS } from '../levels/levels';
import type { LevelDefinition } from '../levels/levelTypes';
import { addBurst, COLORS, drawBackground } from '../systems/Effects';
import { Hud } from '../systems/Hud';
import { InputController } from '../systems/InputController';
import { LevelBehaviors } from '../systems/LevelBehaviors';
import { destroyLoadedLevel, loadLevel, type LoadedLevel } from '../systems/LevelLoader';

export class GameScene extends Phaser.Scene {
  private inputController?: InputController;
  private hud?: Hud;
  private player?: Player;
  private loaded?: LoadedLevel;
  private behaviors?: LevelBehaviors;
  private levelIndex = 0;
  private deaths = 0;
  private currentLevel?: LevelDefinition;
  private dead = false;
  private completing = false;
  private background?: Phaser.GameObjects.Graphics;

  constructor() {
    super('GameScene');
  }

  create(data: { levelIndex?: number; deaths?: number }): void {
    this.levelIndex = data.levelIndex ?? 0;
    this.deaths = data.deaths ?? 0;
    this.physics.world.setBounds(0, 0, GAME_WIDTH, GAME_HEIGHT);
    this.background = drawBackground(this);
    this.inputController = new InputController(this);
    this.hud = new Hud(this, () => this.restartLevel(false));
    this.startLevel(this.levelIndex);
  }

  update(time: number): void {
    if (!this.player || !this.inputController || !this.currentLevel) return;
    const input = this.inputController.update();
    if (input.restartPressed) {
      this.restartLevel(false);
      return;
    }

    const jumped = this.player.update(time, input);
    if (jumped) {
      this.behaviors?.onPlayerJumped();
      addBurst(this, this.player.sprite.x, this.player.sprite.y + 18, COLORS.player, 4);
    }

    this.loaded?.doors.forEach((door) => door.update(time));
    this.behaviors?.update();

    if (this.player.sprite.y > GAME_HEIGHT + 18 && !this.dead) {
      this.killPlayer('Gravity remains undefeated.');
    }
  }

  playerX(): number {
    return this.player?.sprite.x ?? 0;
  }

  playerY(): number {
    return this.player?.sprite.y ?? 0;
  }

  killPlayer(message?: string): void {
    if (!this.player || this.dead || this.completing) return;
    this.dead = true;
    this.deaths += 1;
    this.hud?.setDeaths(this.deaths);
    const x = this.player.sprite.x;
    const y = this.player.sprite.y;
    this.player.kill();
    addBurst(this, x, y, COLORS.spike, 18);
    this.shake(0.01, 150);
    this.hud?.showMessage(message ?? this.randomDeathMessage(), 1000);
    this.time.delayedCall(460, () => this.restartLevel(true));
  }

  completeLevel(): void {
    if (this.completing || this.dead) return;
    this.completing = true;
    if (this.player) {
      addBurst(this, this.player.sprite.x, this.player.sprite.y, COLORS.doorOpen, 20);
    }
    this.cameras.main.flash(150, 45, 212, 191, false);
    this.time.delayedCall(260, () => {
      if (this.levelIndex >= LEVELS.length - 1) {
        this.scene.start('EndScene', { deaths: this.deaths });
      } else {
        this.levelIndex += 1;
        this.startLevel(this.levelIndex);
      }
    });
  }

  showMessage(message: string, duration?: number): void {
    this.hud?.showMessage(message, duration);
  }

  shake(intensity = 0.006, duration = 120): void {
    this.cameras.main.shake(duration, intensity);
  }

  private startLevel(index: number): void {
    this.clearLevel();
    this.levelIndex = Phaser.Math.Clamp(index, 0, LEVELS.length - 1);
    this.currentLevel = LEVELS[this.levelIndex];
    this.dead = false;
    this.completing = false;
    this.background?.destroy();
    this.background = drawBackground(this);
    this.loaded = loadLevel(this, this.currentLevel);
    this.player = new Player(this, this.currentLevel.spawn.x, this.currentLevel.spawn.y);
    this.behaviors = new LevelBehaviors(this, this, this.currentLevel, this.loaded);
    this.hud?.setLevel(this.levelIndex + 1, this.currentLevel.name);
    this.hud?.setDeaths(this.deaths);
    this.addPhysics();
    this.cameras.main.fadeIn(130, 7, 10, 20);
  }

  private restartLevel(fromDeath: boolean): void {
    if (!fromDeath) {
      this.hud?.showMessage('Fine. Fresh start.', 700);
    }
    this.startLevel(this.levelIndex);
  }

  private clearLevel(): void {
    this.player?.destroy();
    destroyLoadedLevel(this.loaded);
    this.player = undefined;
    this.loaded = undefined;
    this.behaviors = undefined;
  }

  private addPhysics(): void {
    if (!this.player || !this.loaded || !this.behaviors) return;
    const sprite = this.player.sprite;

    this.loaded.platforms.forEach((platform) => {
      this.physics.add.collider(sprite, platform.zone, () => this.handlePlatformCollision(platform));
    });

    this.loaded.spikes.forEach((spike) => {
      this.physics.add.overlap(sprite, spike.zone, () => this.killPlayer(), undefined, this);
    });

    this.loaded.doors.forEach((door) => {
      this.physics.add.overlap(sprite, door.zone, () => this.behaviors?.onDoorTouched(door), undefined, this);
    });

    this.loaded.buttons.forEach((button) => {
      this.physics.add.overlap(sprite, button.zone, () => this.behaviors?.onButtonPressed(button), undefined, this);
    });
  }

  private handlePlatformCollision(platform: Platform): void {
    if (!this.player) return;
    const body = this.player.sprite.body as Phaser.Physics.Arcade.Body;
    if (body.blocked.down || body.touching.down) {
      this.behaviors?.onPlatformTouched(platform);
    }
  }

  private randomDeathMessage(): string {
    const messages = this.currentLevel?.deathMessages ?? ['That was educational.'];
    return Phaser.Utils.Array.GetRandom(messages);
  }
}
