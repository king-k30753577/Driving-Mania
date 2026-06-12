import { GameStats } from '../game/GameEngine';
import { saveSystem } from '../game/SaveSystem';

interface Props {
  stats: GameStats;
  showFPS: boolean;
  onPause: () => void;
  onCameraSwitch: () => void;
}

const CAM_LABELS: Record<string, string> = {
  chase: '3rd Person',
  cockpit: 'Cockpit',
  hood: 'Hood',
  cinematic: 'Cinematic',
};

const WEATHER_ICONS: Record<string, string> = {
  clear: '☀️', rain: '🌧️', fog: '🌫️', storm: '⛈️',
};

export function HUD({ stats, showFPS, onPause, onCameraSwitch }: Props) {
  const xpProg = saveSystem.xpProgress();
  const nitroPct = stats.nitroMax > 0 ? stats.nitroFuel / stats.nitroMax : 0;

  return (
    <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 5 }}>

      {/* Speed gauge - bottom center */}
      <div style={{
        position: 'absolute', bottom: 100, left: '50%', transform: 'translateX(-50%)',
        textAlign: 'center', pointerEvents: 'none',
      }}>
        <div style={{
          fontSize: 64, fontWeight: 900, lineHeight: 1,
          fontVariantNumeric: 'tabular-nums',
          color: stats.speed > 120 ? '#ff4520' : stats.speed > 80 ? '#ffb800' : '#f0f0ff',
          textShadow: '0 2px 12px rgba(0,0,0,0.8)',
          filter: stats.isNitro ? 'drop-shadow(0 0 10px #00aaff)' : undefined,
        }}>
          {stats.speed}
        </div>
        <div style={{
          fontSize: 13, color: 'rgba(240,240,255,0.5)',
          letterSpacing: 3, textShadow: '0 1px 6px rgba(0,0,0,0.9)',
        }}>
          KM/H
        </div>
      </div>

      {/* RPM arc — bottom center left */}
      <div style={{
        position: 'absolute', bottom: 90, left: '50%',
        transform: 'translateX(calc(-50% - 90px))',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
      }}>
        <div style={{ fontSize: 11, color: 'rgba(240,240,255,0.35)', letterSpacing: 1 }}>RPM</div>
        <div style={{ display: 'flex', gap: 3 }}>
          {Array.from({ length: 8 }, (_, i) => (
            <div key={i} style={{
              width: 4, height: 14 + (i < 6 ? i * 2 : (7 - i) * 2),
              borderRadius: 2,
              background: i / 8 < stats.rpm
                ? (i >= 6 ? '#ff2200' : '#ff8800')
                : 'rgba(255,255,255,0.1)',
              transition: 'background 0.05s',
            }} />
          ))}
        </div>
      </div>

      {/* Nitro bar */}
      {stats.nitroMax > 0 && (
        <div style={{
          position: 'absolute', bottom: 90, right: 20,
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
        }}>
          <div style={{ fontSize: 11, color: 'rgba(240,240,255,0.35)', letterSpacing: 1 }}>NITRO</div>
          <div style={{
            width: 8, height: 60,
            background: 'rgba(255,255,255,0.08)',
            borderRadius: 4, overflow: 'hidden',
            position: 'relative',
          }}>
            <div style={{
              position: 'absolute', bottom: 0, left: 0, right: 0,
              height: `${nitroPct * 100}%`,
              background: stats.isNitro ? '#00aaff' : '#0066cc',
              borderRadius: 4,
              transition: 'height 0.1s, background 0.1s',
              boxShadow: stats.isNitro ? '0 0 12px #00aaff' : undefined,
            }} />
          </div>
        </div>
      )}

      {/* Top bar */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0,
        display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
        padding: '12px 16px',
        background: 'linear-gradient(to bottom, rgba(0,0,0,0.5) 0%, transparent 100%)',
      }}>
        {/* Left: coins + level */}
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: '#ffcc00', textShadow: '0 1px 6px rgba(0,0,0,0.8)' }}>
            💰 {stats.coins.toLocaleString()}
          </div>
          <div style={{ fontSize: 13, color: 'rgba(240,240,255,0.6)', textShadow: '0 1px 6px rgba(0,0,0,0.8)' }}>
            Lv.{stats.level}
          </div>
        </div>

        {/* Right: pause + camera */}
        <div style={{ display: 'flex', gap: 8, pointerEvents: 'all' }}>
          <button className="btn-icon" style={{
            fontSize: 16, background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.15)',
          }} onClick={onCameraSwitch} title="Switch Camera">
            📷
          </button>
          <button className="btn-icon" style={{
            fontSize: 16, background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.15)',
          }} onClick={onPause} title="Pause">
            ⏸
          </button>
        </div>
      </div>

      {/* Camera mode tag */}
      <div style={{
        position: 'absolute', top: 56, left: '50%', transform: 'translateX(-50%)',
      }}>
        <span className="tag tag-blue" style={{ fontSize: 11 }}>
          {CAM_LABELS[stats.cameraMode] ?? stats.cameraMode}
        </span>
      </div>

      {/* Drift indicator */}
      {stats.isDrifting && (
        <div style={{
          position: 'absolute', top: '40%', left: '50%',
          transform: 'translate(-50%, -50%)',
          fontSize: 22, fontWeight: 900,
          color: '#ff8800',
          letterSpacing: 4,
          textShadow: '0 0 20px rgba(255,136,0,0.8)',
          animation: 'pulse 0.5s ease-in-out infinite',
          pointerEvents: 'none',
        }}>
          DRIFT!
        </div>
      )}

      {/* Nitro active indicator */}
      {stats.isNitro && (
        <div style={{
          position: 'absolute', top: '44%', left: '50%',
          transform: 'translate(-50%, -50%)',
          fontSize: 18, fontWeight: 900,
          color: '#00aaff',
          letterSpacing: 4,
          textShadow: '0 0 20px rgba(0,170,255,0.9)',
          animation: 'pulse 0.3s ease-in-out infinite',
          pointerEvents: 'none',
        }}>
          NITRO!
        </div>
      )}

      {/* Weather & time */}
      <div style={{
        position: 'absolute', top: 56, right: 16,
        display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4,
      }}>
        <span style={{ fontSize: 18 }}>{WEATHER_ICONS[stats.weather] ?? '☀️'}</span>
        <span style={{ fontSize: 11, color: 'rgba(240,240,255,0.4)' }}>
          {formatTime(stats.timeOfDay)}
        </span>
      </div>

      {/* Damage indicator */}
      {stats.damage > 30 && (
        <div style={{
          position: 'absolute', bottom: 160, left: 16,
          display: 'flex', flexDirection: 'column', gap: 4,
        }}>
          <div style={{ fontSize: 11, color: stats.damage > 70 ? '#ff4444' : 'rgba(240,240,255,0.4)', letterSpacing: 1 }}>
            {stats.damage > 70 ? '⚠️ CRITICAL' : '🔧 DAMAGE'}
          </div>
          <div style={{ width: 60, height: 4, background: 'rgba(255,255,255,0.1)', borderRadius: 2, overflow: 'hidden' }}>
            <div style={{
              height: '100%',
              width: `${100 - stats.damage}%`,
              background: stats.damage > 70 ? '#ff2200' : '#ff8800',
              borderRadius: 2,
              transition: 'width 0.3s',
            }} />
          </div>
        </div>
      )}

      {/* XP bar */}
      <div style={{
        position: 'absolute', bottom: 82, left: '50%',
        transform: 'translateX(calc(-50% + 50px))',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
      }}>
        <div style={{ width: 80, height: 3, background: 'rgba(255,255,255,0.08)', borderRadius: 2, overflow: 'hidden' }}>
          <div style={{
            height: '100%',
            width: `${xpProg * 100}%`,
            background: 'linear-gradient(90deg, #ff4520, #ffb800)',
            borderRadius: 2,
          }} />
        </div>
      </div>

      {/* FPS */}
      {showFPS && (
        <div style={{
          position: 'absolute', top: 56, left: 16,
          fontSize: 12, color: stats.fps >= 50 ? '#44ff88' : stats.fps >= 30 ? '#ffbb00' : '#ff4444',
          fontVariantNumeric: 'tabular-nums',
          textShadow: '0 1px 4px rgba(0,0,0,0.8)',
        }}>
          {stats.fps} FPS
        </div>
      )}
    </div>
  );
}

function formatTime(t: number): string {
  // t: 0-1, 0=midnight, 0.5=noon
  const hours = (t * 24) % 24;
  const h = Math.floor(hours);
  const m = Math.floor((hours - h) * 60);
  const ampm = h < 12 ? 'AM' : 'PM';
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${m.toString().padStart(2, '0')} ${ampm}`;
}
