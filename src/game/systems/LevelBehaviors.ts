import Phaser from 'phaser';
import type { Button } from '../entities/Button';
import type { Door } from '../entities/Door';
import type { Platform } from '../entities/Platform';
import type { Spike } from '../entities/Spike';
import type { LevelDefinition, RectDef } from '../levels/levelTypes';
import { GAME_WIDTH } from '../config';
import { addFloatingText, pulse } from './Effects';
import type { LoadedLevel } from './LevelLoader';
import { AudioSystem } from './AudioSystem';

interface BehaviorHost {
  playerX(): number;
  playerY(): number;
  killPlayer(message?: string): void;
  completeLevel(): void;
  showMessage(message: string, duration?: number): void;
  shake(intensity?: number, duration?: number): void;
}

export class LevelBehaviors {
  private movingDoorTriggered = false;
  private fakeVictoryTriggered = false;
  private r11Triggered = false;
  private r12First = false;
  private r12Second = false;
  private r13Triggered = false;
  private r14Secret = false;
  private r14Chase = false;
  private r15Left = false;
  private r15Split = false;
  private r21Triggered = false;
  private r22Second = false;
  private r22Third = false;
  private r23Swap = false;
  private r23Runner = false;
  private r24Started = false;
  private r25Stage = 0;

  constructor(
    private scene: Phaser.Scene,
    private host: BehaviorHost,
    private level: LevelDefinition,
    private loaded: LoadedLevel,
  ) {}

  update(): void {
    switch (this.level.behavior) {
      case 'round1DropNearDoor':
        this.updateR11();
        break;
      case 'round1DoubleDrop':
        this.updateR12();
        break;
      case 'round1GapChasesLeft':
        this.updateR13();
        break;
      case 'round1SecretGapChasesRight':
        this.updateR14();
        break;
      case 'round1Finale':
        this.updateR15();
        break;
      case 'round2SpikeBait':
        this.updateR21();
        break;
      case 'round2TripleSpikes':
        this.updateR22();
        break;
      case 'round2ShaftSpikeSwap':
        this.updateR23();
        break;
      case 'round2StairChase':
        this.updateR24();
        break;
      case 'round2CrawlRush':
        this.updateR25();
        break;
      case 'movingDoor':
        this.updateMovingDoor();
        break;
      default:
        break;
    }
  }

  onPlatformTouched(platform: Platform): void {
    if (platform.kind === 'fake') {
      platform.drop(80);
      this.trapFeedback();
      return;
    }

    if (platform.kind === 'drop' && this.level.behavior === 'disappearingFloor') {
      platform.drop(180);
      this.trapFeedback();
    }
  }

  onPlayerJumped(): void {
    if (this.level.behavior !== 'jumpRevealsSpikes') return;
    const zone = this.level.jumpTrapZone;
    if (!zone || !pointInRect(this.host.playerX(), this.host.playerY(), zone)) return;
    this.loaded.spikes.forEach((spike) => spike.reveal());
    this.trapFeedback();
  }

  onButtonPressed(button: Button): void {
    if (!button.press()) return;
    pulse(this.scene, button.visual, 1.08);
    AudioSystem.sfx('button');
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

  private updateR11(): void {
    if (this.r11Triggered || this.host.playerX() < 560) return;
    this.r11Triggered = true;
    this.findPlatform('door-drop')?.drop(45);
    this.trapFeedback();
  }

  private updateR12(): void {
    const x = this.host.playerX();
    if (!this.r12First && x > 312) {
      this.r12First = true;
      this.findPlatform('drop-one')?.drop(55);
      this.trapFeedback();
    }
    if (!this.r12Second && x > 530) {
      this.r12Second = true;
      this.findPlatform('drop-two')?.drop(55);
      this.trapFeedback();
    }
  }

  private updateR13(): void {
    if (this.r13Triggered || this.host.playerX() < 610) return;
    this.r13Triggered = true;
    this.findPlatform('floor-left')?.resizeTo(0, 390, 440, 150, 360);
    this.findPlatform('floor-right')?.resizeTo(520, 390, 440, 150, 360);
    this.host.showMessage('The gap moved.', 850);
    this.trapFeedback();
  }

  private updateR14(): void {
    const x = this.host.playerX();
    if (!this.r14Secret && x > 70) {
      this.r14Secret = true;
      this.findPlatform('secret-gap')?.drop(35);
      this.host.showMessage('Surprise.', 750);
      this.trapFeedback();
    }

    if (!this.r14Chase && x > 430) {
      this.r14Chase = true;
      this.findPlatform('right-chase-1')?.drop(80);
      this.findPlatform('right-chase-2')?.drop(240);
      this.findPlatform('right-chase-3')?.drop(400);
      this.trapFeedback();
    }
  }

  private updateR15(): void {
    const x = this.host.playerX();
    if (!this.r15Left && x > 360) {
      this.r15Left = true;
      this.findPlatform('final-1')?.drop(45);
      this.findPlatform('final-2')?.drop(175);
      this.findPlatform('final-3')?.drop(305);
      this.host.showMessage('Run.', 700);
      this.trapFeedback();
    }

    if (!this.r15Split && x > 710) {
      this.r15Split = true;
      this.findPlatform('split-player')?.moveTo(542, 390, 230);
      this.host.showMessage('Split.', 720);
      this.trapFeedback();
    }
  }

  private updateR21(): void {
    if (this.r21Triggered || this.host.playerY() < 320 || this.host.playerX() > 560) return;
    this.r21Triggered = true;
    this.findSpike('shy-spike')?.moveTo(356, 358, 230);
    this.trapFeedback();
  }

  private updateR22(): void {
    const x = this.host.playerX();
    if (!this.r22Second && x > 390) {
      this.r22Second = true;
      this.findSpike('spike-two')?.moveTo(420, 358, 220);
      this.trapFeedback();
    }
    if (!this.r22Third && x > 575) {
      this.r22Third = true;
      this.findSpike('spike-three')?.moveTo(724, 358, 240);
      this.trapFeedback();
    }
  }

  private updateR23(): void {
    if (!this.r23Swap && this.host.playerY() > 300) {
      this.r23Swap = true;
      this.findSpike('shaft-spike')?.moveTo(346, 358, 150);
      this.trapFeedback();
    }

    if (!this.r23Runner && this.host.playerX() > 720) {
      this.r23Runner = true;
      this.findSpike('runner-spike')?.moveTo(238, 358, 900);
      this.host.showMessage('Back up.', 800);
      this.trapFeedback();
    }
  }

  private updateR24(): void {
    if (this.r24Started || this.host.playerX() < 205) return;
    this.r24Started = true;
    ['stair-chase-1', 'stair-chase-2', 'stair-chase-3', 'stair-chase-4', 'stair-chase-5'].forEach((id, index) => {
      this.scene.time.delayedCall(index * 260, () => this.findSpike(id)?.reveal());
    });
    this.host.showMessage('Move.', 700);
    this.trapFeedback();
  }

  private updateR25(): void {
    const x = this.host.playerX();
    if (this.r25Stage === 0 && x < 610) {
      this.r25Stage = 1;
      this.findSpike('rush-one')?.moveTo(900, 358, 1180);
      this.host.showMessage('Hide.', 650);
      this.trapFeedback();
    }
    if (this.r25Stage === 1 && x > 780) {
      this.r25Stage = 2;
    }
    if (this.r25Stage === 2 && x < 610) {
      this.r25Stage = 3;
      this.findSpike('rush-two')?.moveTo(900, 358, 1050);
      this.host.showMessage('Again.', 650);
      this.trapFeedback();
    }
    if (this.r25Stage === 3 && x > 780) {
      this.r25Stage = 4;
    }
    if (this.r25Stage === 4 && x < 610) {
      this.r25Stage = 5;
      this.findSpike('rush-three')?.moveTo(82, 358, 1200);
      this.host.showMessage('Door. Now.', 650);
      this.trapFeedback();
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
    this.trapFeedback();
  }

  private triggerFakeVictory(door: Door): void {
    if (this.fakeVictoryTriggered) return;
    this.fakeVictoryTriggered = true;
    door.open = false;
    door.setVisible(false);
    addFloatingText(this.scene, 'YOU WIN!', 254, 720);
    this.host.showMessage('Wait. One more tiny thing.', 1400);
    this.scene.time.delayedCall(760, () => {
      this.loaded.spikes.find((spike) => spike.id === 'final-spike')?.reveal();
      this.findDoor('real-exit')?.reveal();
    });
    this.trapFeedback();
  }

  private trapFeedback(): void {
    AudioSystem.sfx('trap');
    this.host.shake(0.006, 130);
  }

  private findDoor(id: string): Door | undefined {
    return this.loaded.doors.find((door) => door.id === id);
  }

  private findPlatform(id: string): Platform | undefined {
    return this.loaded.platforms.find((platform) => platform.id === id);
  }

  private findSpike(id: string): Spike | undefined {
    return this.loaded.spikes.find((spike) => spike.id === id);
  }
}

function pointInRect(x: number, y: number, rect: RectDef): boolean {
  return x >= rect.x && x <= rect.x + rect.w && y >= rect.y && y <= rect.y + rect.h;
}
