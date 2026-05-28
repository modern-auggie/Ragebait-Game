import type { LevelDefinition } from './levelTypes';

const FLOOR_Y = 390;
const FLOOR_H = 150;
const SPAWN = { x: 62, y: 356 };
const DOOR = { kind: 'real' as const, x: 884, y: 320, w: 38, h: 70, open: true };

const round1: LevelDefinition[] = [
  {
    id: 'level-1-1',
    name: '1.1: Doorstep',
    behavior: 'round1DropNearDoor',
    spawn: SPAWN,
    platforms: [
      { id: 'floor-left', x: 0, y: FLOOR_Y, w: 640, h: FLOOR_H },
      { id: 'door-drop', x: 640, y: FLOOR_Y, w: 110, h: FLOOR_H, kind: 'drop' },
      { id: 'door-ledge', x: 750, y: FLOOR_Y, w: 210, h: FLOOR_H },
    ],
    spikes: [],
    doors: [{ id: 'exit', ...DOOR }],
    deathMessages: ['That last step was decorative.', 'The floor waited until it mattered.'],
  },
  {
    id: 'level-1-2',
    name: '1.2: Double Drop',
    behavior: 'round1DoubleDrop',
    spawn: SPAWN,
    platforms: [
      { id: 'floor-left', x: 0, y: FLOOR_Y, w: 340, h: FLOOR_H },
      { id: 'drop-one', x: 340, y: FLOOR_Y, w: 80, h: FLOOR_H, kind: 'drop' },
      { id: 'safe-island', x: 420, y: FLOOR_Y, w: 150, h: FLOOR_H },
      { id: 'drop-two', x: 570, y: FLOOR_Y, w: 80, h: FLOOR_H, kind: 'drop' },
      { id: 'floor-right', x: 650, y: FLOOR_Y, w: 310, h: FLOOR_H },
    ],
    spikes: [],
    doors: [{ id: 'exit', ...DOOR }],
    deathMessages: ['The second tile took that personally.', 'It waited its turn.'],
  },
  {
    id: 'level-1-3',
    name: '1.3: Moving Gap',
    behavior: 'round1GapChasesLeft',
    spawn: SPAWN,
    platforms: [
      { id: 'floor-left', x: 0, y: FLOOR_Y, w: 760, h: FLOOR_H },
      { id: 'floor-right', x: 840, y: FLOOR_Y, w: 120, h: FLOOR_H },
    ],
    spikes: [],
    doors: [{ id: 'exit', ...DOOR }],
    deathMessages: ['The gap backed up into you.', 'Even the hole has movement tech.'],
  },
  {
    id: 'level-1-4',
    name: '1.4: Secret Gap',
    behavior: 'round1SecretGapChasesRight',
    spawn: SPAWN,
    platforms: [
      { id: 'spawn-lip', x: 0, y: FLOOR_Y, w: 94, h: FLOOR_H },
      { id: 'secret-gap', x: 94, y: FLOOR_Y, w: 80, h: FLOOR_H, kind: 'drop' },
      { id: 'floor-mid', x: 174, y: FLOOR_Y, w: 320, h: FLOOR_H },
      { id: 'right-chase-1', x: 494, y: FLOOR_Y, w: 74, h: FLOOR_H, kind: 'drop' },
      { id: 'right-chase-2', x: 568, y: FLOOR_Y, w: 74, h: FLOOR_H, kind: 'drop' },
      { id: 'right-chase-3', x: 642, y: FLOOR_Y, w: 74, h: FLOOR_H, kind: 'drop' },
      { id: 'door-ledge', x: 716, y: FLOOR_Y, w: 244, h: FLOOR_H },
    ],
    spikes: [],
    doors: [{ id: 'exit', ...DOOR }],
    deathMessages: ['The floor opened with no appointment.', 'You outran most of the hole.'],
  },
  {
    id: 'level-1-5',
    name: '1.5: Split Step',
    behavior: 'round1Finale',
    spawn: SPAWN,
    platforms: [
      { id: 'floor-left', x: 0, y: FLOOR_Y, w: 350, h: FLOOR_H },
      { id: 'final-1', x: 350, y: FLOOR_Y, w: 80, h: FLOOR_H, kind: 'drop' },
      { id: 'final-2', x: 430, y: FLOOR_Y, w: 80, h: FLOOR_H, kind: 'drop' },
      { id: 'final-3', x: 510, y: FLOOR_Y, w: 80, h: FLOOR_H, kind: 'drop' },
      { id: 'split-player', x: 590, y: FLOOR_Y, w: 200, h: FLOOR_H },
      { id: 'door-ledge', x: 790, y: FLOOR_Y, w: 170, h: FLOOR_H },
    ],
    spikes: [],
    doors: [{ id: 'exit', ...DOOR }],
    deathMessages: ['The platform wanted space.', 'The door kept its half.'],
  },
];

const round2: LevelDefinition[] = [
  {
    id: 'level-2-1',
    name: '2.1: Shy Spike',
    behavior: 'round2SpikeBait',
    spawn: { x: 62, y: 196 },
    platforms: [
      { id: 'top-floor', x: 0, y: 230, w: 780, h: 38 },
      { id: 'bottom-floor', x: 0, y: FLOOR_Y, w: 960, h: FLOOR_H },
    ],
    spikes: [
      { id: 'shy-spike', x: 410, y: 358, w: 38, h: 32 },
      { id: 'normal-spike', x: 500, y: 358, w: 38, h: 32 },
    ],
    doors: [{ id: 'exit', kind: 'real', x: 58, y: 320, w: 38, h: 70, open: true }],
    deathMessages: ['The left spike dodged you.', 'It moved just enough to be rude.'],
  },
  {
    id: 'level-2-2',
    name: '2.2: Three Opinions',
    behavior: 'round2TripleSpikes',
    spawn: SPAWN,
    platforms: [{ id: 'floor', x: 0, y: FLOOR_Y, w: 960, h: FLOOR_H }],
    spikes: [
      { id: 'spike-one', x: 286, y: 358, w: 38, h: 32 },
      { id: 'spike-two', x: 480, y: 358, w: 38, h: 32 },
      { id: 'spike-three', x: 650, y: 358, w: 38, h: 32 },
    ],
    doors: [{ id: 'exit', ...DOOR }],
    deathMessages: ['Spike two believed in initiative.', 'Spike three backed away at the worst time.'],
  },
  {
    id: 'level-2-3',
    name: '2.3: Wrong Shaft',
    behavior: 'round2ShaftSpikeSwap',
    spawn: { x: 480, y: 196 },
    platforms: [
      { id: 'ground', x: 0, y: FLOOR_Y, w: 960, h: FLOOR_H },
      { id: 'pillar-top', x: 420, y: 230, w: 120, h: 30 },
      { id: 'pillar-column', x: 452, y: 260, w: 56, h: 130 },
      { id: 'low-roof', x: 260, y: 288, w: 700, h: 24 },
    ],
    spikes: [
      { id: 'shaft-spike', x: 568, y: 358, w: 38, h: 32 },
      { id: 'runner-spike', x: 918, y: 358, w: 38, h: 32, hidden: true },
    ],
    doors: [{ id: 'exit', ...DOOR }],
    deathMessages: ['The spike changed its mind.', 'Retreat first. Then jump.'],
  },
  {
    id: 'level-2-4',
    name: '2.4: Stair Panic',
    behavior: 'round2StairChase',
    spawn: { x: 62, y: 356 },
    platforms: [
      { id: 'start-floor', x: 0, y: FLOOR_Y, w: 190, h: FLOOR_H },
      { id: 'step-1', x: 236, y: 350, w: 104, h: 28 },
      { id: 'step-2', x: 376, y: 314, w: 104, h: 28 },
      { id: 'step-3', x: 516, y: 278, w: 104, h: 28 },
      { id: 'step-4', x: 656, y: 242, w: 104, h: 28 },
      { id: 'step-5', x: 796, y: 206, w: 164, h: 28 },
    ],
    spikes: [
      { id: 'stair-chase-1', x: 42, y: 358, w: 38, h: 32, hidden: true },
      { id: 'stair-chase-2', x: 128, y: 358, w: 38, h: 32, hidden: true },
      { id: 'stair-chase-3', x: 246, y: 318, w: 38, h: 32, hidden: true },
      { id: 'stair-chase-4', x: 386, y: 282, w: 38, h: 32, hidden: true },
      { id: 'stair-chase-5', x: 526, y: 246, w: 38, h: 32, hidden: true },
    ],
    doors: [{ id: 'exit', kind: 'real', x: 884, y: 136, w: 38, h: 70, open: true }],
    deathMessages: ['Too slow for the stairs.', 'The spikes climbed better than expected.'],
  },
  {
    id: 'level-2-5',
    name: '2.5: Crawl Rush',
    behavior: 'round2CrawlRush',
    spawn: { x: 900, y: 356 },
    platforms: [
      { id: 'floor-left', x: 0, y: FLOOR_Y, w: 790, h: FLOOR_H },
      { id: 'hide-hole', x: 790, y: 500, w: 96, h: 40 },
      { id: 'floor-right', x: 886, y: FLOOR_Y, w: 74, h: FLOOR_H },
      { id: 'low-roof', x: 0, y: 286, w: 960, h: 24 },
    ],
    spikes: [
      { id: 'rush-one', x: 8, y: 358, w: 44, h: 32, hidden: true },
      { id: 'rush-two', x: 8, y: 358, w: 44, h: 32, hidden: true },
      { id: 'rush-three', x: 918, y: 358, w: 44, h: 32, hidden: true },
    ],
    doors: [{ id: 'exit', kind: 'real', x: 42, y: 320, w: 38, h: 70, open: true }],
    deathMessages: ['The crawlspace was the plan.', 'Timing, then panic, then timing.'],
  },
];

const blankLevels: LevelDefinition[] = [3, 4, 5].flatMap((level) =>
  [1, 2, 3, 4, 5].map((round) => ({
    id: `level-${level}-${round}`,
    name: `${level}.${round}: Placeholder`,
    behavior: 'blank' as const,
    spawn: SPAWN,
    platforms: [{ id: 'floor', x: 0, y: FLOOR_Y, w: 960, h: FLOOR_H }],
    spikes: [],
    doors: [{ id: 'exit', ...DOOR }],
    deathMessages: ['A suspiciously honest hallway.'],
  })),
);

export const LEVELS: LevelDefinition[] = [...round1, ...round2, ...blankLevels];
