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
  private doubleDropTriggered = false;
  private leftChaseTriggered = false;
  private secretGapTriggered = false;
  private rightChaseTriggered = false;
  private finaleTriggered = false;

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
    if (this.level.behavior === 'round1GapChasesLeft') {
      this.updateGapChasesLeft();
    }
    if (this.level.behavior === 'round1SecretGapChasesRight') {
      this.updateSecretGapChasesRight();
    }
    if (this.level.behavior === 'round1Finale') {
      this.updateFinale();
    }
  }

  onPlatformTouched(platform: Platform): void {
    if (this.level.behavior === 'round1DropNearDoor' && platform.id === 'door-drop') {
      platform.drop(90);
      this.host.shake(0.004, 90);
      return;
    }

    if (this.level.behavior === 'round1DoubleDrop' && (platform.id === 'drop-one' || platform.id === 'drop-two')) {
      this.triggerDoubleDrop();
      return;
    }

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

  private triggerDoubleDrop(): void {
    if (this.doubleDropTriggered) return;
    this.doubleDropTriggered = true;
    this.findPlatform('drop-one')?.drop(70);
    this.findPlatform('drop-two')?.drop(260);
    this.host.shake(0.005, 110);
  }

  private updateGapChasesLeft(): void {
    if (this.leftChaseTriggered || this.host.playerX() < 286) return;
    this.leftChaseTriggered = true;
    this.host.showMessage('It moves.', 850);
    this.findPlatform('chase-left-3')?.drop(40);
    this.findPlatform('chase-left-2')?.drop(130);
    this.findPlatform('chase-left-1')?.drop(220);
    this.host.shake(0.006, 140);
  }

  private updateSecretGapChasesRight(): void {
    const x = this.host.playerX();
    if (!this.secretGapTriggered && x > 240) {
      this.secretGapTriggered = true;
      this.findPlatform('secret-gap')?.drop(60);
      this.host.showMessage('Surprise.', 800);
      this.host.shake(0.006, 130);
    }

    if (!this.rightChaseTriggered && x > 470) {
      this.rightChaseTriggered = true;
      this.findPlatform('right-chase-1')?.drop(30);
      this.findPlatform('right-chase-2')?.drop(110);
      this.findPlatform('right-chase-3')?.drop(190);
      this.host.shake(0.007, 180);
    }
  }

  private updateFinale(): void {
    if (this.finaleTriggered || this.host.playerX() < 390) return;
    this.finaleTriggered = true;
    this.findPlatform('final-1')?.drop(50);
    this.findPlatform('final-2')?.drop(150);
    this.findPlatform('final-3')?.drop(250);
    this.host.showMessage('Run.', 750);
    this.host.shake(0.007, 180);
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
