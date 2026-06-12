import { saveSystem } from '../game/SaveSystem';

interface Props {
  onResume: () => void;
  onMainMenu: () => void;
  onResetCar: () => void;
  onWeatherChange: (w: string) => void;
  currentWeather: string;
}

const WEATHERS = [
  { id: 'clear', label: '☀️ Clear' },
  { id: 'rain', label: '🌧️ Rain' },
  { id: 'fog', label: '🌫️ Fog' },
  { id: 'storm', label: '⛈️ Storm' },
];

export function PauseMenu({ onResume, onMainMenu, onResetCar, onWeatherChange, currentWeather }: Props) {
  const save = saveSystem.get();
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 50,
      background: 'rgba(0,0,0,0.75)',
      backdropFilter: 'blur(8px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <div className="glass-card animate-slide-up" style={{
        padding: 28, width: 320, maxWidth: '92vw',
        display: 'flex', flexDirection: 'column', gap: 14,
      }}>
        <div style={{ textAlign: 'center', marginBottom: 4 }}>
          <div style={{ fontSize: 26, fontWeight: 800 }}>⏸ PAUSED</div>
          <div style={{ fontSize: 13, color: 'rgba(240,240,255,0.4)', marginTop: 2 }}>
            Lv.{save.level} · 💰 {save.coins.toLocaleString()}
          </div>
        </div>

        <button className="btn btn-primary" onClick={onResume} style={{ height: 54, fontSize: 17 }}>
          ▶ RESUME
        </button>

        <button className="btn btn-secondary" onClick={onResetCar} style={{ height: 48 }}>
          🔄 Reset Car Position
        </button>

        {/* Weather selector */}
        <div>
          <div style={{ fontSize: 11, color: 'rgba(240,240,255,0.4)', letterSpacing: 1, marginBottom: 8 }}>
            WEATHER
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {WEATHERS.map(w => (
              <button key={w.id}
                className="btn btn-secondary"
                onClick={() => onWeatherChange(w.id)}
                style={{
                  height: 38, fontSize: 13,
                  borderColor: currentWeather === w.id ? '#ff4520' : undefined,
                  color: currentWeather === w.id ? '#ff4520' : undefined,
                }}>
                {w.label}
              </button>
            ))}
          </div>
        </div>

        <button className="btn btn-ghost" onClick={onMainMenu} style={{ marginTop: 4 }}>
          ← Main Menu
        </button>
      </div>
    </div>
  );
}
