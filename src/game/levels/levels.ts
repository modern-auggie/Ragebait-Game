import type { LevelDefinition } from './levelTypes';

const FLOOR_Y = 390;
const FLOOR_H = 150;
const SPAWN = { x: 62, y: 356 };
const DOOR = { kind: 'real' as const, x: 884, y: 320, w: 38, h: 70, open: true };

const round1: LevelDefinition[] = [
  {
    id: 'level-1-1',
    name: '1.1',
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
    name: '1.2',
    behavior: 'round1DoubleDrop',
    spawn: SPAWN,
    platforms: [
      { id: 'floor-left', x: 0, y: FLOOR_Y, w: 610, h: FLOOR_H },
      { id: 'drop-one', x: 610, y: FLOOR_Y, w: 76, h: FLOOR_H, kind: 'drop' },
      { id: 'safe-island', x: 686, y: FLOOR_Y, w: 126, h: FLOOR_H },
      { id: 'drop-two', x: 812, y: FLOOR_Y, w: 72, h: FLOOR_H, kind: 'drop' },
      { id: 'door-ledge', x: 884, y: FLOOR_Y, w: 76, h: FLOOR_H },
    ],
    spikes: [],
    doors: [{ id: 'exit', ...DOOR }],
    deathMessages: ['The second tile took that personally.', 'It waited its turn.'],
  },
  {
    id: 'level-1-3',
    name: '1.3',
    behavior: 'round1GapChasesLeft',
    spawn: SPAWN,
    platforms: [
      { id: 'floor-left', x: 0, y: FLOOR_Y, w: 760, h: FLOOR_H },
      { id: 'move-gap', x: 760, y: FLOOR_Y, w: 80, h: FLOOR_H, kind: 'drop' },
      { id: 'floor-right', x: 840, y: FLOOR_Y, w: 120, h: FLOOR_H },
    ],
    spikes: [],
    doors: [{ id: 'exit', ...DOOR }],
    deathMessages: ['The gap backed up into you.', 'Even the hole has movement tech.'],
  },
  {
    id: 'level-1-4',
    name: '1.4',
    behavior: 'round1SecretGapChasesRight',
    spawn: SPAWN,
    platforms: [
      { id: 'spawn-lip', x: 0, y: FLOOR_Y, w: 94, h: FLOOR_H },
      { id: 'secret-gap', x: 94, y: FLOOR_Y, w: 80, h: FLOOR_H, kind: 'drop' },
      { id: 'gap-expand-1', x: 174, y: FLOOR_Y, w: 104, h: FLOOR_H, kind: 'drop' },
      { id: 'gap-expand-2', x: 278, y: FLOOR_Y, w: 104, h: FLOOR_H, kind: 'drop' },
      { id: 'gap-expand-3', x: 382, y: FLOOR_Y, w: 104, h: FLOOR_H, kind: 'drop' },
      { id: 'gap-expand-4', x: 486, y: FLOOR_Y, w: 104, h: FLOOR_H, kind: 'drop' },
      { id: 'gap-expand-5', x: 590, y: FLOOR_Y, w: 104, h: FLOOR_H, kind: 'drop' },
      { id: 'door-ledge', x: 694, y: FLOOR_Y, w: 266, h: FLOOR_H },
    ],
    spikes: [],
    doors: [{ id: 'exit', ...DOOR }],
    deathMessages: ['The floor opened with no appointment.', 'You outran most of the hole.'],
  },
  {
    id: 'level-1-5',
    name: '1.5',
    behavior: 'round1Finale',
    spawn: SPAWN,
    platforms: [
      { id: 'final-gap-1', x: 0, y: FLOOR_Y, w: 92, h: FLOOR_H, kind: 'drop' },
      { id: 'final-gap-2', x: 92, y: FLOOR_Y, w: 92, h: FLOOR_H, kind: 'drop' },
      { id: 'final-gap-3', x: 184, y: FLOOR_Y, w: 92, h: FLOOR_H, kind: 'drop' },
      { id: 'final-gap-4', x: 276, y: FLOOR_Y, w: 92, h: FLOOR_H, kind: 'drop' },
      { id: 'final-gap-5', x: 368, y: FLOOR_Y, w: 92, h: FLOOR_H, kind: 'drop' },
      { id: 'final-gap-6', x: 460, y: FLOOR_Y, w: 92, h: FLOOR_H, kind: 'drop' },
      { id: 'split-player', x: 552, y: FLOOR_Y, w: 166, h: FLOOR_H },
      { id: 'door-ledge', x: 718, y: FLOOR_Y, w: 242, h: FLOOR_H },
    ],
    spikes: [],
    doors: [{ id: 'exit', ...DOOR }],
    deathMessages: ['The platform wanted space.', 'The door kept its half.'],
  },
];

const round2: LevelDefinition[] = [
  {
    id: 'level-2-1',
    name: '2.1',
    behavior: 'round2SpikeBait',
    spawn: { x: 62, y: 196 },
    platforms: [
      { id: 'top-floor', x: 0, y: 230, w: 780, h: 38 },
      { id: 'bottom-floor', x: 0, y: FLOOR_Y, w: 960, h: FLOOR_H },
    ],
    spikes: [
      { id: 'shy-spike', x: 310, y: 358, w: 38, h: 32 },
      { id: 'normal-spike', x: 650, y: 358, w: 38, h: 32 },
    ],
    doors: [{ id: 'exit', kind: 'real', x: 58, y: 320, w: 38, h: 70, open: true }],
    deathMessages: ['The left spike dodged you.', 'It moved just enough to be rude.'],
  },
  {
    id: 'level-2-2',
    name: '2.2',
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
    name: '2.3',
    behavior: 'round2ShaftSpikeSwap',
    spawn: { x: 520, y: 146 },
    platforms: [
      { id: 'ground', x: 0, y: FLOOR_Y, w: 960, h: FLOOR_H },
      { id: 'left-pillar', x: 326, y: 180, w: 58, h: 166 },
      { id: 'middle-pillar', x: 492, y: 180, w: 58, h: 166 },
      { id: 'right-pillar', x: 642, y: 180, w: 58, h: 166 },
      { id: 'right-roof', x: 700, y: 286, w: 260, h: 26 },
    ],
    spikes: [
      { id: 'shaft-spike', x: 580, y: 358, w: 44, h: 32 },
      { id: 'runner-spike', x: 816, y: 358, w: 44, h: 32, hidden: true },
    ],
    doors: [{ id: 'exit', ...DOOR }],
    deathMessages: ['The spike changed its mind.', 'Retreat first. Then jump.'],
  },
  {
    id: 'level-2-4',
    name: '2.4',
    behavior: 'round2StairChase',
    spawn: { x: 62, y: 356 },
    platforms: [
      { id: 'start-floor', x: 0, y: FLOOR_Y, w: 340, h: FLOOR_H },
      { id: 'step-1', x: 380, y: 350, w: 86, h: 28 },
      { id: 'step-2', x: 500, y: 314, w: 86, h: 28 },
      { id: 'step-3', x: 620, y: 278, w: 86, h: 28 },
      { id: 'step-4', x: 740, y: 242, w: 86, h: 28 },
      { id: 'step-5', x: 850, y: 206, w: 110, h: 28 },
    ],
    spikes: [
      { id: 'stair-chase-1', x: 0, y: 358, w: 68, h: 32, hidden: true },
      { id: 'stair-chase-2', x: 68, y: 358, w: 68, h: 32, hidden: true },
      { id: 'stair-chase-3', x: 136, y: 358, w: 68, h: 32, hidden: true },
      { id: 'stair-chase-4', x: 204, y: 358, w: 68, h: 32, hidden: true },
      { id: 'stair-chase-5', x: 272, y: 358, w: 68, h: 32, hidden: true },
      { id: 'stair-chase-6', x: 380, y: 318, w: 86, h: 32, hidden: true },
      { id: 'stair-chase-7', x: 500, y: 282, w: 86, h: 32, hidden: true },
      { id: 'stair-chase-8', x: 620, y: 246, w: 86, h: 32, hidden: true },
      { id: 'stair-chase-9', x: 740, y: 210, w: 86, h: 32, hidden: true },
      { id: 'stair-chase-10', x: 850, y: 174, w: 110, h: 32, hidden: true },
    ],
    doors: [{ id: 'exit', kind: 'real', x: 884, y: 136, w: 38, h: 70, open: true }],
    deathMessages: ['Too slow for the stairs.', 'The spikes climbed better than expected.'],
  },
  {
    id: 'level-2-5',
    name: '2.5',
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
  [1, 2, 3, 4, 5].map((round) => {
    const isImpossibleFinale = level === 5 && round === 5;
    return {
      id: `level-${level}-${round}`,
      name: `${level}.${round}`,
      behavior: isImpossibleFinale ? ('wrongDoorLoop' as const) : ('blank' as const),
      spawn: SPAWN,
      platforms: [{ id: 'floor', x: 0, y: FLOOR_Y, w: 960, h: FLOOR_H }],
      spikes: [],
      doors: [{ id: 'exit', ...DOOR }],
      deathMessages: isImpossibleFinale ? ['There is always another door.'] : ['A suspiciously honest hallway.'],
    };
  }),
);

export const LEVELS: LevelDefinition[] = [...round1, ...round2, ...blankLevels];
