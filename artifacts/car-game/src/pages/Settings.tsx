import { useState } from 'react';
import { saveSystem, GameSettings } from '../game/SaveSystem';

interface Props {
  onBack: () => void;
}

export function Settings({ onBack }: Props) {
  const [settings, setSettings] = useState<GameSettings>(saveSystem.get().settings);
  const [toast, setToast] = useState<string | null>(null);

  const update = (patch: Partial<GameSettings>) => {
    const next = { ...settings, ...patch };
    setSettings(next);
    saveSystem.updateSettings(patch);
  };

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2000);
  };

  const handleReset = () => {
    if (window.confirm('Reset ALL progress? This cannot be undone!')) {
      saveSystem.reset();
      setSettings(saveSystem.get().settings);
      showToast('Progress reset.');
    }
  };

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
        <div style={{ fontSize: 20, fontWeight: 800 }}>⚙️ SETTINGS</div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 16px 100px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Sound */}
          <section>
            <div style={{ fontSize: 11, color: 'rgba(240,240,255,0.4)', letterSpacing: 1, marginBottom: 12 }}>AUDIO</div>
            <div className="glass-card" style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 16 }}>
              <SliderSetting
                label="🎵 Music Volume"
                value={settings.musicVolume}
                onChange={v => update({ musicVolume: v })}
              />
              <SliderSetting
                label="🔊 SFX Volume"
                value={settings.sfxVolume}
                onChange={v => update({ sfxVolume: v })}
              />
            </div>
          </section>

          {/* Controls */}
          <section>
            <div style={{ fontSize: 11, color: 'rgba(240,240,255,0.4)', letterSpacing: 1, marginBottom: 12 }}>CONTROLS</div>
            <div className="glass-card" style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 10 }}>Control Mode</div>
                <div style={{ display: 'flex', gap: 8 }}>
                  {[
                    { id: 'buttons', label: '🎮 Buttons' },
                    { id: 'wheel', label: '🕹️ Wheel' },
                    { id: 'tilt', label: '📱 Tilt' },
                  ].map(m => (
                    <button key={m.id}
                      className="btn btn-secondary"
                      onClick={() => update({ controlMode: m.id as any })}
                      style={{
                        flex: 1, height: 42, fontSize: 13,
                        borderColor: settings.controlMode === m.id ? '#ff4520' : undefined,
                        color: settings.controlMode === m.id ? '#ff4520' : undefined,
                      }}>
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>

              {settings.controlMode === 'tilt' && (
                <SliderSetting
                  label="📱 Tilt Sensitivity"
                  value={settings.tiltSensitivity}
                  onChange={v => update({ tiltSensitivity: v })}
                />
              )}

              <ToggleSetting
                label="🔄 Flip Steering"
                desc="Invert left/right for tilt mode"
                value={settings.steeringFlip}
                onChange={v => update({ steeringFlip: v })}
              />

              <div style={{
                padding: 12, borderRadius: 8,
                background: 'rgba(255,255,255,0.04)',
                fontSize: 13, color: 'rgba(240,240,255,0.5)',
              }}>
                <strong style={{ color: 'rgba(240,240,255,0.8)' }}>Keyboard:</strong> WASD/Arrows = Drive · Space = Handbrake · Shift = Nitro · C = Camera · H = Horn · Esc = Pause
              </div>
            </div>
          </section>

          {/* Graphics */}
          <section>
            <div style={{ fontSize: 11, color: 'rgba(240,240,255,0.4)', letterSpacing: 1, marginBottom: 12 }}>GRAPHICS</div>
            <div className="glass-card" style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 10 }}>Quality</div>
                <div style={{ display: 'flex', gap: 8 }}>
                  {[
                    { id: 'low', label: '⚡ Low' },
                    { id: 'medium', label: '⚖️ Medium' },
                    { id: 'high', label: '✨ High' },
                  ].map(q => (
                    <button key={q.id}
                      className="btn btn-secondary"
                      onClick={() => update({ graphicsQuality: q.id as any })}
                      style={{
                        flex: 1, height: 42, fontSize: 13,
                        borderColor: settings.graphicsQuality === q.id ? '#ff4520' : undefined,
                        color: settings.graphicsQuality === q.id ? '#ff4520' : undefined,
                      }}>
                      {q.label}
                    </button>
                  ))}
                </div>
                <div style={{ fontSize: 11, color: 'rgba(240,240,255,0.35)', marginTop: 6 }}>
                  Requires restart to take effect
                </div>
              </div>

              <ToggleSetting
                label="📊 Show FPS"
                desc="Display frames per second counter"
                value={settings.showFPS}
                onChange={v => update({ showFPS: v })}
              />
            </div>
          </section>

          {/* Danger zone */}
          <section>
            <div style={{ fontSize: 11, color: 'rgba(240,240,255,0.4)', letterSpacing: 1, marginBottom: 12 }}>DATA</div>
            <div className="glass-card" style={{ padding: 16 }}>
              <button className="btn btn-secondary" onClick={handleReset} style={{
                width: '100%', height: 48,
                color: '#ff4444', borderColor: 'rgba(255,68,68,0.3)',
              }}>
                ⚠️ Reset All Progress
              </button>
              <div style={{ fontSize: 11, color: 'rgba(240,240,255,0.3)', textAlign: 'center', marginTop: 8 }}>
                This will delete all coins, upgrades, and achievements
              </div>
            </div>
          </section>

        </div>
      </div>

      {toast && (
        <div style={{
          position: 'fixed', top: '20%', left: '50%',
          transform: 'translate(-50%, -50%)',
          background: 'rgba(16,16,28,0.95)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 12, padding: '12px 24px',
          fontSize: 14, fontWeight: 600,
          zIndex: 100,
        }} className="animate-slide-up">
          {toast}
        </div>
      )}
    </div>
  );
}

function SliderSetting({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
        <span style={{ fontSize: 14, fontWeight: 500 }}>{label}</span>
        <span style={{ fontSize: 13, color: 'rgba(240,240,255,0.5)' }}>{Math.round(value * 100)}%</span>
      </div>
      <input type="range" min={0} max={1} step={0.05} value={value}
        onChange={e => onChange(parseFloat(e.target.value))}
        style={{ width: '100%', accentColor: '#ff4520' }}
      />
    </div>
  );
}

function ToggleSetting({ label, desc, value, onChange }: {
  label: string; desc: string; value: boolean; onChange: (v: boolean) => void;
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
      <div>
        <div style={{ fontSize: 14, fontWeight: 500 }}>{label}</div>
        <div style={{ fontSize: 12, color: 'rgba(240,240,255,0.4)' }}>{desc}</div>
      </div>
      <button onClick={() => onChange(!value)} style={{
        width: 50, height: 26, borderRadius: 13,
        background: value ? '#ff4520' : 'rgba(255,255,255,0.1)',
        border: 'none', cursor: 'pointer',
        position: 'relative', transition: 'background 0.2s', flexShrink: 0,
      }}>
        <div style={{
          position: 'absolute', top: 3, left: value ? 26 : 3,
          width: 20, height: 20, borderRadius: '50%',
          background: 'white', transition: 'left 0.2s',
        }} />
      </button>
    </div>
  );
}
