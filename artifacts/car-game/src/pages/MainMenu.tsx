import { useEffect, useState } from 'react';
import { saveSystem } from '../game/SaveSystem';
import { tgApp } from '../telegram/TelegramApp';

interface Props {
  onPlay: () => void;
  onGarage: () => void;
  onSettings: () => void;
  onAchievements: () => void;
}

export function MainMenu({ onPlay, onGarage, onSettings, onAchievements }: Props) {
  const [save, setSave] = useState(saveSystem.get());
  const [dailyReward, setDailyReward] = useState<{ coins: number; xp: number; streak: number } | null>(null);
  const [showReward, setShowReward] = useState(false);

  useEffect(() => {
    setSave(saveSystem.get());
    const reward = saveSystem.claimDailyReward();
    if (reward) {
      setDailyReward(reward);
      setShowReward(true);
      setTimeout(() => setShowReward(false), 4000);
    }
  }, []);

  const xpProgress = saveSystem.xpProgress();

  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: 'linear-gradient(160deg, #070710 0%, #10101f 60%, #080810 100%)',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', overflowY: 'auto',
    }}>
      {/* Background accent */}
      <div style={{
        position: 'absolute', top: -100, left: '50%', transform: 'translateX(-50%)',
        width: 600, height: 600, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(232,56,13,0.08) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      <div style={{ width: '100%', maxWidth: 420, padding: '24px 20px 100px', display: 'flex', flexDirection: 'column', gap: 16, position: 'relative' }}>

        {/* Header */}
        <div style={{ textAlign: 'center', padding: '20px 0 8px' }} className="animate-fade-in">
          <div style={{
            fontSize: 42, fontWeight: 900,
            letterSpacing: '-2px',
            background: 'linear-gradient(135deg, #ff4520, #ffb800)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}>
            🏎️ CARBOOM
          </div>
          {tgApp.user && (
            <div style={{ color: 'rgba(240,240,255,0.5)', fontSize: 13, marginTop: 4 }}>
              Welcome back, {tgApp.user.name}!
            </div>
          )}
        </div>

        {/* Player card */}
        <div className="glass-card animate-slide-up" style={{ padding: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <div>
              <div style={{ fontSize: 12, color: 'rgba(240,240,255,0.45)', letterSpacing: 1 }}>LEVEL</div>
              <div style={{ fontSize: 28, fontWeight: 800, color: '#ff4520' }}>{save.level}</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 12, color: 'rgba(240,240,255,0.45)', letterSpacing: 1 }}>COINS</div>
              <div style={{ fontSize: 22, fontWeight: 700, color: '#ffcc00' }}>💰 {save.coins.toLocaleString()}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 12, color: 'rgba(240,240,255,0.45)', letterSpacing: 1 }}>TOP SPEED</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: '#60a5fa' }}>{Math.round(save.topSpeed)} km/h</div>
            </div>
          </div>
          {/* XP bar */}
          <div style={{ fontSize: 11, color: 'rgba(240,240,255,0.35)', marginBottom: 4 }}>
            XP to Level {save.level + 1}
          </div>
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${xpProgress * 100}%` }} />
          </div>
        </div>

        {/* Daily streak */}
        {save.dailyStreak > 0 && (
          <div className="glass-card" style={{ padding: 12, display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ fontSize: 28 }}>🔥</div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600 }}>Daily Streak: {save.dailyStreak} days</div>
              <div style={{ fontSize: 11, color: 'rgba(240,240,255,0.4)' }}>Keep playing to earn bonus rewards</div>
            </div>
          </div>
        )}

        {/* Play button */}
        <button className="btn btn-primary animate-glow" onClick={onPlay} style={{
          height: 64, fontSize: 20, fontWeight: 800, letterSpacing: 1,
          borderRadius: 16,
        }}>
          ▶ PLAY NOW
        </button>

        {/* Secondary buttons */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <button className="btn btn-secondary" onClick={onGarage} style={{ height: 56, fontSize: 15 }}>
            🚗 Garage
          </button>
          <button className="btn btn-secondary" onClick={onAchievements} style={{ height: 56, fontSize: 15 }}>
            🏆 Awards
          </button>
        </div>

        {/* Stats row */}
        <div className="glass-card" style={{ padding: 14 }}>
          <div style={{ fontSize: 11, color: 'rgba(240,240,255,0.4)', letterSpacing: 1, marginBottom: 10 }}>LIFETIME STATS</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, textAlign: 'center' }}>
            {[
              { label: 'Distance', value: `${(save.totalDistance / 1000).toFixed(1)}km` },
              { label: 'Earned', value: `💰${save.totalCoinsEarned}` },
              { label: 'Unlocked', value: `${Object.keys(save.upgrades).length} cars` },
            ].map(s => (
              <div key={s.label}>
                <div style={{ fontSize: 15, fontWeight: 700 }}>{s.value}</div>
                <div style={{ fontSize: 11, color: 'rgba(240,240,255,0.4)' }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Settings & share row */}
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-secondary" onClick={onSettings} style={{ flex: 1, height: 48, fontSize: 14 }}>
            ⚙️ Settings
          </button>
          {tgApp.isAvailable && (
            <button className="btn btn-secondary" onClick={() => tgApp.shareScore(save.topSpeed, save.level)}
              style={{ flex: 1, height: 48, fontSize: 14 }}>
              📤 Share Score
            </button>
          )}
        </div>

      </div>

      {/* Daily reward popup */}
      {showReward && dailyReward && (
        <div style={{
          position: 'fixed', top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
          zIndex: 200,
        }} className="animate-slide-up">
          <div className="glass-card" style={{ padding: 28, textAlign: 'center', minWidth: 280 }}>
            <div style={{ fontSize: 48, marginBottom: 8 }}>🎁</div>
            <div style={{ fontSize: 20, fontWeight: 800, marginBottom: 4 }}>Daily Reward!</div>
            <div style={{ color: '#ffcc00', fontSize: 22, fontWeight: 700 }}>+{dailyReward.coins} 💰</div>
            <div style={{ color: '#60a5fa', fontSize: 16, fontWeight: 600 }}>+{dailyReward.xp} XP</div>
            {dailyReward.streak > 1 && (
              <div style={{ color: 'rgba(240,240,255,0.5)', fontSize: 13, marginTop: 8 }}>
                🔥 Day {dailyReward.streak} streak bonus!
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
