// SaveSystem.ts - localStorage persistence for player progress

export interface PlayerSave {
  coins: number;
  xp: number;
  level: number;
  totalDistance: number;
  totalCoinsEarned: number;
  topSpeed: number;
  selectedCar: string;
  selectedColor: number;
  upgrades: Record<string, UpgradeLevel>;
  achievements: string[];
  lastDailyReward: string;
  dailyStreak: number;
  settings: GameSettings;
  missionProgress: MissionProgress;
}

export interface UpgradeLevel {
  engine: number;
  brakes: number;
  tires: number;
  handling: number;
  nitro: number;
}

export interface GameSettings {
  musicVolume: number;
  sfxVolume: number;
  controlMode: 'wheel' | 'buttons' | 'tilt';
  graphicsQuality: 'low' | 'medium' | 'high';
  showFPS: boolean;
  steeringFlip: boolean;
  tiltSensitivity: number;
}

export interface MissionProgress {
  checkpointsCompleted: number;
  driftScore: number;
  deliveriesCompleted: number;
}

const SAVE_KEY = 'carboom_save_v1';

const DEFAULT_UPGRADES: UpgradeLevel = {
  engine: 1,
  brakes: 1,
  tires: 1,
  handling: 1,
  nitro: 0,
};

const DEFAULT_SETTINGS: GameSettings = {
  musicVolume: 0.6,
  sfxVolume: 0.8,
  controlMode: 'buttons',
  graphicsQuality: 'medium',
  showFPS: false,
  steeringFlip: false,
  tiltSensitivity: 0.5,
};

const DEFAULT_SAVE: PlayerSave = {
  coins: 500,
  xp: 0,
  level: 1,
  totalDistance: 0,
  totalCoinsEarned: 500,
  topSpeed: 0,
  selectedCar: 'sports',
  selectedColor: 0,
  upgrades: {
    sports: { ...DEFAULT_UPGRADES },
    muscle: { ...DEFAULT_UPGRADES },
    suv: { ...DEFAULT_UPGRADES },
    supercar: { ...DEFAULT_UPGRADES, engine: 0, brakes: 0, tires: 0, handling: 0 },
  },
  achievements: [],
  lastDailyReward: '',
  dailyStreak: 0,
  settings: { ...DEFAULT_SETTINGS },
  missionProgress: {
    checkpointsCompleted: 0,
    driftScore: 0,
    deliveriesCompleted: 0,
  },
};

class SaveSystem {
  private data: PlayerSave;

  constructor() {
    this.data = this.load();
  }

  private load(): PlayerSave {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (!raw) return { ...DEFAULT_SAVE };
      const parsed = JSON.parse(raw) as Partial<PlayerSave>;
      // Merge with defaults to handle schema updates
      return {
        ...DEFAULT_SAVE,
        ...parsed,
        settings: { ...DEFAULT_SETTINGS, ...parsed.settings },
        upgrades: { ...DEFAULT_SAVE.upgrades, ...parsed.upgrades },
        missionProgress: { ...DEFAULT_SAVE.missionProgress, ...parsed.missionProgress },
      };
    } catch {
      return { ...DEFAULT_SAVE };
    }
  }

  save() {
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(this.data));
    } catch {
      // Storage full or unavailable
    }
  }

  get(): PlayerSave {
    return this.data;
  }

  addCoins(amount: number) {
    this.data.coins += amount;
    this.data.totalCoinsEarned += Math.max(0, amount);
    this.save();
  }

  spendCoins(amount: number): boolean {
    if (this.data.coins < amount) return false;
    this.data.coins -= amount;
    this.save();
    return true;
  }

  addXP(amount: number): boolean {
    this.data.xp += amount;
    const xpForNextLevel = this.xpForLevel(this.data.level + 1);
    if (this.data.xp >= xpForNextLevel) {
      this.data.level++;
      this.data.xp -= xpForNextLevel;
      this.save();
      return true; // level up
    }
    this.save();
    return false;
  }

  xpForLevel(level: number): number {
    return Math.floor(100 * Math.pow(1.5, level - 1));
  }

  xpProgress(): number {
    const needed = this.xpForLevel(this.data.level + 1);
    return Math.min(1, this.data.xp / needed);
  }

  updateDistance(meters: number) {
    this.data.totalDistance += meters;
    if (meters > this.data.topSpeed) this.data.topSpeed = meters;
    this.save();
  }

  updateTopSpeed(kmh: number) {
    if (kmh > this.data.topSpeed) {
      this.data.topSpeed = kmh;
      this.save();
    }
  }

  setSelectedCar(carId: string) {
    this.data.selectedCar = carId;
    this.save();
  }

  setSelectedColor(index: number) {
    this.data.selectedColor = index;
    this.save();
  }

  upgradeVehicle(carId: string, stat: keyof UpgradeLevel): boolean {
    if (!this.data.upgrades[carId]) {
      this.data.upgrades[carId] = { ...DEFAULT_UPGRADES };
    }
    const current = this.data.upgrades[carId][stat];
    if (current >= 5) return false;
    const cost = this.upgradeCost(current);
    if (!this.spendCoins(cost)) return false;
    this.data.upgrades[carId][stat]++;
    this.save();
    return true;
  }

  upgradeCost(currentLevel: number): number {
    return [500, 1200, 2500, 5000, 10000][currentLevel] ?? 99999;
  }

  getUpgrades(carId: string): UpgradeLevel {
    return this.data.upgrades[carId] ?? { ...DEFAULT_UPGRADES };
  }

  updateSettings(patch: Partial<GameSettings>) {
    this.data.settings = { ...this.data.settings, ...patch };
    this.save();
  }

  claimDailyReward(): { coins: number; xp: number; streak: number } | null {
    const today = new Date().toDateString();
    if (this.data.lastDailyReward === today) return null;

    const yesterday = new Date(Date.now() - 86400000).toDateString();
    if (this.data.lastDailyReward === yesterday) {
      this.data.dailyStreak = (this.data.dailyStreak || 0) + 1;
    } else {
      this.data.dailyStreak = 1;
    }

    const streak = this.data.dailyStreak;
    const coins = 100 * streak;
    const xp = 50 * streak;

    this.data.lastDailyReward = today;
    this.addCoins(coins);
    this.addXP(xp);
    return { coins, xp, streak };
  }

  unlockAchievement(id: string): boolean {
    if (this.data.achievements.includes(id)) return false;
    this.data.achievements.push(id);
    this.save();
    return true;
  }

  reset() {
    this.data = { ...DEFAULT_SAVE };
    this.save();
  }
}

export const saveSystem = new SaveSystem();
