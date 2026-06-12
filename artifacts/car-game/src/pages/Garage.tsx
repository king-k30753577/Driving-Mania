import { useState } from 'react';
import { saveSystem, UpgradeLevel } from '../game/SaveSystem';
import { CAR_COLORS, CAR_DEFS } from '../game/Car3D';

interface Props {
  onBack: () => void;
}

type CarId = 'sports' | 'muscle' | 'suv' | 'supercar';

const UPGRADE_STATS: Array<{ key: keyof UpgradeLevel; label: string; icon: string }> = [
  { key: 'engine', label: 'Engine', icon: '🔧' },
  { key: 'brakes', label: 'Brakes', icon: '🛑' },
  { key: 'tires', label: 'Tires', icon: '⭕' },
  { key: 'handling', label: 'Handling', icon: '🎯' },
  { key: 'nitro', label: 'Nitro', icon: '⚡' },
];

export function Garage({ onBack }: Props) {
  const [save, setSave] = useState(saveSystem.get());
  const [selectedCar, setSelectedCar] = useState<CarId>(save.selectedCar as CarId);
  const [selectedColor, setSelectedColor] = useState(save.selectedColor);
  const [toast, setToast] = useState<string | null>(null);
  const [tab, setTab] = useState<'cars' | 'upgrades' | 'paint'>('cars');

  const refresh = () => setSave(saveSystem.get());

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2000);
  };

  const handleSelectCar = (carId: CarId) => {
    setSelectedCar(carId);
    saveSystem.setSelectedCar(carId);
    refresh();
  };

  const handleBuyCar = (carId: CarId) => {
    const price = CAR_DEFS[carId].price;
    if (price === 0) {
      handleSelectCar(carId);
      return;
    }
    if (save.upgrades[carId]) {
      handleSelectCar(carId);
      return;
    }
    if (saveSystem.spendCoins(price)) {
      // Create initial upgrade entry
      saveSystem.get().upgrades[carId] = { engine: 1, brakes: 1, tires: 1, handling: 1, nitro: 0 };
      saveSystem.save();
      handleSelectCar(carId);
      showToast(`${CAR_DEFS[carId].label} unlocked! 🚗`);
    } else {
      showToast('Not enough coins! 💸');
    }
    refresh();
  };

  const handleUpgrade = (stat: keyof UpgradeLevel) => {
    const result = saveSystem.upgradeVehicle(selectedCar, stat);
    if (result) {
      showToast(`${UPGRADE_STATS.find(u => u.key === stat)?.label} upgraded! ✅`);
    } else {
      const upgrades = saveSystem.getUpgrades(selectedCar);
      const level = upgrades[stat];
      if (level >= 5) {
        showToast('Already maxed! 🏆');
      } else {
        showToast('Not enough coins! 💸');
      }
    }
    refresh();
  };

  const handleColorSelect = (i: number) => {
    setSelectedColor(i);
    saveSystem.setSelectedColor(i);
    refresh();
  };

  const currentUpgrades = saveSystem.getUpgrades(selectedCar);
  const owned = (carId: CarId) => carId === 'sports' || !!save.upgrades[carId];

  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: '#0a0a0f',
      display: 'flex', flexDirection: 'column',
      overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{
        padding: '16px 20px 0',
        display: 'flex', alignItems: 'center', gap: 12,
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        paddingBottom: 12,
        flexShrink: 0,
      }}>
        <button className="btn btn-ghost" onClick={onBack} style={{ padding: '8px 12px', fontSize: 16 }}>←</button>
        <div style={{ fontSize: 20, fontWeight: 800 }}>🚗 GARAGE</div>
        <div style={{ marginLeft: 'auto', color: '#ffcc00', fontWeight: 700 }}>
          💰 {save.coins.toLocaleString()}
        </div>
      </div>

      {/* Tabs */}
      <div style={{
        display: 'flex', gap: 0,
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        flexShrink: 0,
      }}>
        {[
          { id: 'cars', label: 'VEHICLES' },
          { id: 'upgrades', label: 'UPGRADES' },
          { id: 'paint', label: 'PAINT' },
        ].map(t => (
          <button key={t.id}
            onClick={() => setTab(t.id as any)}
            style={{
              flex: 1, padding: '12px 8px', fontSize: 12, fontWeight: 700,
              letterSpacing: 1, border: 'none', cursor: 'pointer',
              background: 'transparent', fontFamily: 'inherit',
              color: tab === t.id ? '#ff4520' : 'rgba(240,240,255,0.4)',
              borderBottom: tab === t.id ? '2px solid #ff4520' : '2px solid transparent',
              transition: 'all 0.15s',
            }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 16px 100px' }}>

        {/* VEHICLES tab */}
        {tab === 'cars' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {(Object.entries(CAR_DEFS) as [CarId, typeof CAR_DEFS[keyof typeof CAR_DEFS]][]).map(([carId, def]) => {
              const isOwned = owned(carId);
              const isSelected = selectedCar === carId;
              return (
                <div key={carId} className="glass-card" style={{
                  padding: 16,
                  border: isSelected ? '1px solid #ff4520' : undefined,
                  boxShadow: isSelected ? '0 0 20px rgba(232,56,13,0.25)' : undefined,
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    {/* Car icon */}
                    <div style={{
                      width: 60, height: 48, borderRadius: 8,
                      background: `radial-gradient(circle, ${hexColor(CAR_COLORS[def.color])} 0%, rgba(0,0,0,0.5) 100%)`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 30, flexShrink: 0,
                    }}>🚗</div>

                    {/* Info */}
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, fontSize: 16 }}>{def.label}</div>
                      {!isOwned && (
                        <div style={{ color: '#ffcc00', fontSize: 13, marginTop: 2 }}>💰 {def.price.toLocaleString()}</div>
                      )}
                      {isOwned && (
                        <div style={{ fontSize: 12, color: '#44cc88', marginTop: 2 }}>✅ Owned</div>
                      )}
                      {isSelected && (
                        <div style={{ fontSize: 12, color: '#ff4520', marginTop: 2 }}>⭐ Active</div>
                      )}
                    </div>

                    {/* Action button */}
                    <button
                      className={`btn ${isSelected ? 'btn-secondary' : 'btn-primary'}`}
                      style={{ height: 40, fontSize: 13, padding: '0 16px' }}
                      onClick={() => handleBuyCar(carId)}
                    >
                      {isSelected ? 'Selected' : isOwned ? 'Select' : `Buy`}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* UPGRADES tab */}
        {tab === 'upgrades' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ fontSize: 13, color: 'rgba(240,240,255,0.4)', marginBottom: 4 }}>
              Upgrading: {CAR_DEFS[selectedCar]?.label ?? selectedCar}
            </div>

            {UPGRADE_STATS.map(({ key, label, icon }) => {
              const level = currentUpgrades[key];
              const maxed = level >= 5;
              const cost = saveSystem.upgradeCost(level);
              return (
                <div key={key} className="glass-card" style={{ padding: 14 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ fontSize: 22 }}>{icon}</span>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 15 }}>{label}</div>
                        <div style={{ fontSize: 12, color: 'rgba(240,240,255,0.4)' }}>
                          {maxed ? 'MAX LEVEL' : `Level ${level}/5`}
                        </div>
                      </div>
                    </div>
                    <button
                      className="btn btn-primary"
                      style={{ height: 38, fontSize: 13, padding: '0 16px', opacity: maxed ? 0.4 : 1 }}
                      onClick={() => !maxed && handleUpgrade(key)}
                      disabled={maxed}
                    >
                      {maxed ? 'MAX' : `💰${cost.toLocaleString()}`}
                    </button>
                  </div>
                  {/* Level bars */}
                  <div style={{ display: 'flex', gap: 5 }}>
                    {Array.from({ length: 5 }, (_, i) => (
                      <div key={i} style={{
                        flex: 1, height: 5, borderRadius: 3,
                        background: i < level
                          ? `linear-gradient(90deg, #ff4520, #ffb800)`
                          : 'rgba(255,255,255,0.08)',
                        transition: 'background 0.3s',
                      }} />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* PAINT tab */}
        {tab === 'paint' && (
          <div>
            <div style={{ fontSize: 13, color: 'rgba(240,240,255,0.4)', marginBottom: 16 }}>
              Choose your paint color
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14 }}>
              {CAR_COLORS.map((color, i) => (
                <div
                  key={i}
                  className={`color-swatch ${selectedColor === i ? 'selected' : ''}`}
                  style={{
                    background: hexColor(color),
                    boxShadow: selectedColor === i ? `0 0 16px ${hexColor(color)}` : undefined,
                  }}
                  onClick={() => handleColorSelect(i)}
                />
              ))}
            </div>

            {/* Preview box */}
            <div className="glass-card" style={{ marginTop: 20, padding: 20, textAlign: 'center' }}>
              <div style={{
                width: 80, height: 48, borderRadius: 8, margin: '0 auto',
                background: `radial-gradient(circle, ${hexColor(CAR_COLORS[selectedColor])} 0%, rgba(0,0,0,0.4) 100%)`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 36,
              }}>🚗</div>
              <div style={{ marginTop: 10, fontSize: 13, color: 'rgba(240,240,255,0.5)' }}>
                Color applied: #{hexColor(CAR_COLORS[selectedColor]).replace('#', '').toUpperCase()}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Toast */}
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

function hexColor(n: number): string {
  return `#${n.toString(16).padStart(6, '0')}`;
}
