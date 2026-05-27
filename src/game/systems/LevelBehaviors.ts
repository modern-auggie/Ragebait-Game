import Phaser from 'phaser';
import type { Door } from '../entities/Door';
import type { Platform } from '../entities/Platform';
import type { Button } from '../entities/Button';
import type { LoadedLevel } from './LevelLoader';
import type { LevelDefinition, RectDef } from '../levels/levelTypes';
import { addFloatingText, pulse } from './Effects';
import { GAME_WIDTH } from '../config';

interface BehaviorHost {
  playerX(): number;
  playerY(): number;
  killPlayer(message?: string): void;
  completeLevel(): void;
  showMessage(message: string, duration?: number): void;
  shake(intensity?: number, duration?: number): void;
}

export class LevelBehaviors {
  private fakeVictoryTriggered = false;
  private movingDoorTriggered = false;

  constructor(
    private scene: Phaser.Scene,
    private host: BehaviorHost,
    private level: LevelDefinition,
    private loaded: LoadedLevel,
  ) {}

  update(): void {
    if (this.level.behavior === 'movingDoor') {
      this.updateMovingDoor();
    }
  }

  onPlatformTouched(platform: Platform): void {
    if (platform.kind === 'fake') {
      platform.drop(80);
      this.host.shake(0.004, 90);
      return;
    }

    if (platform.kind === 'drop' && this.level.behavior === 'disappearingFloor') {
      platform.drop(180);
      this.host.shake(0.004, 90);
    }
  }

  onPlayerJumped(): void {
    if (this.level.behavior !== 'jumpRevealsSpikes') return;
    const zone = this.level.jumpTrapZone;
    if (!zone || !pointInRect(this.host.playerX(), this.host.playerY(), zone)) return;
    this.loaded.spikes.forEach((spike) => spike.reveal());
    this.host.shake(0.006, 120);
  }

  onButtonPressed(button: Button): void {
    if (!button.press()) return;
    pulse(this.scene, button.visual, 1.08);
    this.host.shake(0.003, 80);

    if (button.def.opensDoorId) {
      this.findDoor(button.def.opensDoorId)?.setOpen(true);
    }

    if (this.level.behavior === 'buttonDropsFloor' && button.def.dropsPlatformId) {
      this.findPlatform(button.def.dropsPlatformId)?.drop(330);
    }
  }

  onDoorTouched(door: Door): void {
    if (!door.open && door.kind !== 'fakeDeadly') return;

    if (door.kind === 'fakeDeadly') {
      this.host.killPlayer('Maybe that wasn\'t the real door.');
      return;
    }

    if (door.kind === 'fakeVictory') {
      this.triggerFakeVictory(door);
      return;
    }

    if (door.kind === 'real' || door.kind === 'hiddenReal' || door.kind === 'moving') {
      this.host.completeLevel();
    }
  }

  private updateMovingDoor(): void {
    if (this.movingDoorTriggered) return;
    const door = this.loaded.doors.find((item) => item.kind === 'moving');
    if (!door) return;
    const dx = door.zone.x - this.host.playerX();
    const closeFromLeft = dx > 0 && dx < 76 && Math.abs(this.host.playerY() - door.zone.y) < 80;
    if (!closeFromLeft) return;
    this.movingDoorTriggered = true;
    const doorY = door.zone.y - door.zone.height / 2;
    const currentX = door.zone.x - door.zone.width / 2;
    const targetX = Phaser.Math.Clamp(this.level.movingDoorStopX ?? 326, 18, GAME_WIDTH - door.zone.width - 18);
    const tweenState = { x: currentX };
    this.scene.tweens.add({
      targets: tweenState,
      x: targetX,
      duration: 430,
      ease: 'Back.Out',
      onUpdate: () => door.setPosition(tweenState.x, doorY),
      onComplete: () => door.setPosition(targetX, doorY),
    });
    this.host.showMessage('Nope.', 900);
    this.host.shake(0.004, 120);
  }

  private triggerFakeVictory(door: Door): void {
    if (this.fakeVictoryTriggered) return;
    this.fakeVictoryTriggered = true;
    door.open = false;
    door.setVisible(false);
    addFloatingText(this.scene, 'YOU WIN!', 254, 720);
    this.host.showMessage('Wait. One more tiny thing.', 1400);
    this.host.shake(0.004, 120);
    this.scene.time.delayedCall(760, () => {
      this.loaded.spikes.find((spike) => spike.id === 'final-spike')?.reveal();
      this.findDoor('real-exit')?.reveal();
    });
  }

  private findDoor(id: string): Door | undefined {
    return this.loaded.doors.find((door) => door.id === id);
  }

  private findPlatform(id: string): Platform | undefined {
    return this.loaded.platforms.find((platform) => platform.id === id);
  }
}

function pointInRect(x: number, y: number, rect: RectDef): boolean {
  return x >= rect.x && x <= rect.x + rect.w && y >= rect.y && y <= rect.y + rect.h;
}
