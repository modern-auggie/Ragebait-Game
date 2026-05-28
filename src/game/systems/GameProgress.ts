export interface GameProgressState {
  unlockedLevel: number;
  bestDeaths: Record<string, number>;
  resumes: Record<string, LevelResume>;
}

export interface LevelResume {
  levelIndex: number;
  deaths: number;
}

const STORAGE_KEY = 'ragebait-v1a-progress';
const ROUNDS_PER_LEVEL = 5;
const MAX_LEVEL = 5;

const DEFAULT_PROGRESS: GameProgressState = {
  unlockedLevel: 1,
  bestDeaths: {},
  resumes: {},
};

export class GameProgress {
  private static state: GameProgressState = loadProgress();

  static get(): GameProgressState {
    return {
      unlockedLevel: this.state.unlockedLevel,
      bestDeaths: { ...this.state.bestDeaths },
      resumes: { ...this.state.resumes },
    };
  }

  static isUnlocked(level: number): boolean {
    return level <= this.state.unlockedLevel;
  }

  static getResumeForLevel(level: number): LevelResume {
    const firstIndex = (level - 1) * ROUNDS_PER_LEVEL;
    const lastIndex = firstIndex + ROUNDS_PER_LEVEL - 1;
    const resume = this.state.resumes[String(level)];
    if (!resume) return { levelIndex: firstIndex, deaths: 0 };
    return {
      levelIndex: clampInt(resume.levelIndex, firstIndex, lastIndex),
      deaths: Math.max(0, Math.floor(resume.deaths || 0)),
    };
  }

  static hasResumeForLevel(level: number): boolean {
    return this.state.resumes[String(level)] !== undefined;
  }

  static setResume(level: number, levelIndex: number, deaths: number): void {
    if (!this.isUnlocked(level)) return;
    const firstIndex = (level - 1) * ROUNDS_PER_LEVEL;
    const lastIndex = firstIndex + ROUNDS_PER_LEVEL - 1;
    this.state.resumes[String(level)] = {
      levelIndex: clampInt(levelIndex, firstIndex, lastIndex),
      deaths: Math.max(0, Math.floor(deaths)),
    };
    saveProgress(this.state);
  }

  static recordLevelComplete(level: number, deaths: number): void {
    const key = String(level);
    const previous = this.state.bestDeaths[key];
    if (previous === undefined || deaths < previous) {
      this.state.bestDeaths[key] = deaths;
    }
    delete this.state.resumes[key];
    if (level < MAX_LEVEL) {
      this.state.unlockedLevel = Math.max(this.state.unlockedLevel, level + 1);
    }
    saveProgress(this.state);
  }
}

function loadProgress(): GameProgressState {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_PROGRESS };
    const parsed = JSON.parse(raw) as Partial<GameProgressState>;
    return {
      unlockedLevel: clampInt(parsed.unlockedLevel ?? 1, 1, MAX_LEVEL),
      bestDeaths: parsed.bestDeaths ?? {},
      resumes: sanitizeResumes(parsed.resumes ?? {}),
    };
  } catch {
    return { ...DEFAULT_PROGRESS };
  }
}

function saveProgress(state: GameProgressState): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Progress is optional; the demo should still run if storage is blocked.
  }
}

function sanitizeResumes(resumes: Record<string, LevelResume>): Record<string, LevelResume> {
  const clean: Record<string, LevelResume> = {};
  for (let level = 1; level <= MAX_LEVEL; level += 1) {
    const resume = resumes[String(level)];
    if (!resume) continue;
    const firstIndex = (level - 1) * ROUNDS_PER_LEVEL;
    const lastIndex = firstIndex + ROUNDS_PER_LEVEL - 1;
    clean[String(level)] = {
      levelIndex: clampInt(resume.levelIndex, firstIndex, lastIndex),
      deaths: Math.max(0, Math.floor(resume.deaths || 0)),
    };
  }
  return clean;
}

function clampInt(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, Math.floor(value)));
}
