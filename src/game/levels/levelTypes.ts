export type LevelBehaviorId =
  | 'fakeFloorNearDoor'
  | 'jumpRevealsSpikes'
  | 'disappearingFloor'
  | 'buttonOpensDoor'
  | 'buttonDropsFloor'
  | 'fakeDoor'
  | 'movingDoor'
  | 'fakeVictory';

export type PlatformKind = 'solid' | 'fake' | 'drop' | 'fakeWall';
export type DoorKind = 'real' | 'fakeDeadly' | 'hiddenReal' | 'moving' | 'fakeVictory';
export type SpikeOrientation = 'up' | 'down';

export interface RectDef {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface PlatformDef extends RectDef {
  id: string;
  kind?: PlatformKind;
  tint?: number;
}

export interface SpikeDef extends RectDef {
  id: string;
  hidden?: boolean;
  orientation?: SpikeOrientation;
}

export interface DoorDef extends RectDef {
  id: string;
  kind: DoorKind;
  open?: boolean;
  hidden?: boolean;
}

export interface ButtonDef extends RectDef {
  id: string;
  label?: string;
  opensDoorId?: string;
  dropsPlatformId?: string;
}

export interface SignDef {
  id: string;
  x: number;
  y: number;
  text: string;
  width?: number;
}

export interface LevelDefinition {
  id: string;
  name: string;
  behavior: LevelBehaviorId;
  spawn: { x: number; y: number };
  platforms: PlatformDef[];
  spikes: SpikeDef[];
  doors: DoorDef[];
  buttons?: ButtonDef[];
  signs?: SignDef[];
  jumpTrapZone?: RectDef;
  movingDoorStopX?: number;
  deathMessages: string[];
}
