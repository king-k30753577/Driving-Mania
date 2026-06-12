import { saveSystem } from '../game/SaveSystem';

interface Props {
  onBack: () => void;
}

interface Achievement {
  id: string;
  label: string;
  desc: string;
  icon: string;
  condition: (save: ReturnType<typeof saveSystem.get>) => boolean;
  reward: string;
}

const ACHIEVEMENTS: Achievement[] = [
  {
    id: 'first_drive',
    label: 'First Drive',
    desc: 'Start your first game',
    icon: '🚗',
    condition: s => s.totalDistance > 0,
    reward: '50 XP',
  },
  {
    id: 'speed_100',
    label: 'Century',
    desc: 'Reach 100 km/h',
    icon: '💨',
    condition: s => s.topSpeed >= 100,
    reward: '100 Coins',
  },
  {
    id: 'speed_150',
    label: 'Speed Demon',
    desc: 'Reach 150 km/h',
    icon: '⚡',
    condition: s => s.topSpeed >= 150,
    reward: '300 Coins',
  },
  {
    id: 'speed_200',
    label: 'Sonic',
    desc: 'Reach 200 km/h',
    icon: '🔥',
    condition: s => s.topSpeed >= 200,
    reward: '1000 Coins',
  },
  {
    id: 'collector_1000',
    label: 'Coin Collector',
    desc: 'Earn 1,000 coins total',
    icon: '💰',
    condition: s => s.totalCoinsEarned >= 1000,
    reward: '100 XP',
  },
  {
    id: 'collector_10000',
    label: 'Millionaire',
    desc: 'Earn 10,000 coins total',
    icon: '💎',
    condition: s => s.totalCoinsEarned >= 10000,
    reward: '500 XP',
  },
  {
    id: 'level_5',
    label: 'Rising Star',
    desc: 'Reach Level 5',
    icon: '⭐',
    condition: s => s.level >= 5,
    reward: '500 Coins',
  },
  {
    id: 'level_10',
    label: 'Veteran',
    desc: 'Reach Level 10',
    icon: '🏆',
    condition: s => s.level >= 10,
    reward: '2000 Coins',
  },
  {
    id: 'distance_1km',
    label: 'First Kilometer',
    desc: 'Drive 1 km total',
    icon: '📍',
    condition: s => s.totalDistance >= 1000,
    reward: '50 Coins',
  },
  {
    id: 'distance_10km',
    label: 'Road Warrior',
    desc: 'Drive 10 km total',
    icon: '🛣️',
    condition: s => s.totalDistance >= 10000,
    reward: '250 Coins',
  },
  {
    id: 'streak_3',
    label: 'Dedicated',
    desc: 'Play 3 days in a row',
    icon: '🔥',
    condition: s => s.dailyStreak >= 3,
    reward: '300 Coins',
  },
  {
    id: 'streak_7',
    label: 'Weekly Driver',
    desc: 'Play 7 days in a row',
    icon: '📅',
    condition: s => s.dailyStreak >= 7,
    reward: '1000 Coins',
  },
  {
    id: 'max_upgrade',
    label: 'Engineer',
    desc: 'Fully upgrade one stat',
    icon: '🔧',
    condition: s => Object.values(s.upgrades).some(u =>
      Object.values(u).some((v: any) => v >= 5)
    ),
    reward: '500 Coins',
  },
  {
    id: 'all_cars',
    label: 'Fleet Owner',
    desc: 'Own all 4 vehicles',
    icon: '🚘',
    condition: s => Object.keys(s.upgrades).length >= 4,
    reward: '2000 Coins',
  },
  {
    id: 'drifter',
    label: 'Drifter',
    desc: 'Complete your first drift',
    icon: '💨',
    condition: s => s.missionProgress.driftScore > 0,
    reward: '100 Coins',
  },
];

export function Achievements({ onBack }: Props) {
  const save = saveSystem.get();
  const unlocked = new Set(save.achievements);

  // Auto-unlock achievements based on current state
  ACHIEVEMENTS.forEach(a => {
    if (!unlocked.has(a.id) && a.condition(save)) {
      const newlyUnlocked = saveSystem.unlockAchievement(a.id);
      if (newlyUnlocked) {
        unlocked.add(a.id);
      }
    }
  });

  const unlockedCount = ACHIEVEMENTS.filter(a => unlocked.has(a.id) || a.condition(save)).length;
  const total = ACHIEVEMENTS.length;

  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: '#0a0a0f',
      display: 'flex', flexDirection: 'column',
      overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{
        padding: '16px 20px',
        display: 'flex', alignItems: 'center', gap: 12,
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        flexShrink: 0,
      }}>
        <button className="btn btn-ghost" onClick={onBack} style={{ padding: '8px 12px', fontSize: 16 }}>←</button>
        <div style={{ flex: 1, fontSize: 20, fontWeight: 800 }}>🏆 ACHIEVEMENTS</div>
        <div style={{ fontSize: 14, color: 'rgba(240,240,255,0.5)' }}>
          {unlockedCount}/{total}
        </div>
      </div>

      {/* Progress bar */}
      <div style={{ padding: '10px 20px', flexShrink: 0 }}>
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${(unlockedCount / total) * 100}%` }} />
        </div>
      </div>

      {/* List */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '8px 16px 100px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {ACHIEVEMENTS.map(a => {
            const isUnlocked = unlocked.has(a.id) || a.condition(save);
            return (
              <div key={a.id} className="glass-card" style={{
                padding: '14px 16px',
                display: 'flex', alignItems: 'center', gap: 14,
                opacity: isUnlocked ? 1 : 0.5,
              }}>
                <div style={{
                  width: 48, height: 48, borderRadius: 12,
                  background: isUnlocked ? 'rgba(255,204,0,0.15)' : 'rgba(255,255,255,0.04)',
                  border: `1px solid ${isUnlocked ? 'rgba(255,204,0,0.3)' : 'rgba(255,255,255,0.06)'}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 22, flexShrink: 0,
                }}>
                  {isUnlocked ? a.icon : '🔒'}
                </div>

                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 15 }}>{a.label}</div>
                  <div style={{ fontSize: 12, color: 'rgba(240,240,255,0.45)', marginTop: 2 }}>{a.desc}</div>
                </div>

                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  {isUnlocked ? (
                    <span style={{ fontSize: 18 }}>✅</span>
                  ) : (
                    <span className="tag tag-gold" style={{ fontSize: 11 }}>{a.reward}</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
