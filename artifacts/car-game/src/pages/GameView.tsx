import { useEffect, useRef, useState, useCallback } from 'react';
import { GameEngine, GameStats } from '../game/GameEngine';
import { saveSystem } from '../game/SaveSystem';
import { HUD } from './HUD';
import { TouchControls } from './TouchControls';
import { PauseMenu } from './PauseMenu';

interface Props {
  onExit: () => void;
}

export function GameView({ onExit }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<GameEngine | null>(null);
  const [stats, setStats] = useState<GameStats | null>(null);
  const [paused, setPaused] = useState(false);
  const [coinPopup, setCoinPopup] = useState<{ amount: number; key: number } | null>(null);
  const [initialized, setInitialized] = useState(false);
  const statsInterval = useRef<ReturnType<typeof setInterval> | undefined>(undefined);
  const coinKey = useRef(0);
  const settings = saveSystem.get().settings;

  const handlePause = useCallback(() => {
    setPaused(true);
    engineRef.current?.setPaused(true);
  }, []);

  const handleResume = useCallback(() => {
    setPaused(false);
    engineRef.current?.setPaused(false);
  }, []);

  const handleResetCar = useCallback(() => {
    engineRef.current?.resetCar();
  }, []);

  const handleWeatherChange = useCallback((w: string) => {
    engineRef.current?.setWeather(w as any);
  }, []);

  const handleCameraSwitch = useCallback(() => {
    // Camera switch is handled by keyboard C or the button in HUD
    // We pass a dummy control button to simulate it
    const engine = engineRef.current;
    if (engine) {
      engine.setControlButton('_camera_switch', true);
      setTimeout(() => engine.setControlButton('_camera_switch', false), 100);
    }
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || initialized) return;
    setInitialized(true);

    const engine = new GameEngine();
    engineRef.current = engine;

    engine.init(canvas, (event, data) => {
      if (event === 'pause') {
        setPaused(p => {
          const next = !p;
          engine.setPaused(next);
          return next;
        });
      }
      if (event === 'coin') {
        coinKey.current++;
        setCoinPopup({ amount: data.amount, key: coinKey.current });
        setTimeout(() => setCoinPopup(null), 1500);
      }
    });

    // Stats polling
    statsInterval.current = setInterval(() => {
      if (engineRef.current) {
        setStats(engineRef.current.getStats());
      }
    }, 80);

    // Handle resize
    const onResize = () => {
      engine.resize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', onResize);

    return () => {
      clearInterval(statsInterval.current);
      window.removeEventListener('resize', onResize);
      engine.destroy();
      engineRef.current = null;
    };
  }, [initialized]);

  // Handle camera switch button from HUD (since engine handles C key internally)
  useEffect(() => {
    // Override camera switch in GameEngine.ts via Controls mock
    // The HUD button will dispatch 'c' key event
  }, []);

  const handleExitToMenu = () => {
    saveSystem.save();
    onExit();
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: '#0a0a0f' }}>
      {/* Game canvas */}
      <canvas
        ref={canvasRef}
        style={{ width: '100%', height: '100%', display: 'block' }}
        width={window.innerWidth}
        height={window.innerHeight}
      />

      {/* HUD */}
      {stats && !paused && (
        <HUD
          stats={stats}
          showFPS={settings.showFPS}
          onPause={handlePause}
          onCameraSwitch={() => {
            // Dispatch C key event for camera switching
            window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyC', bubbles: true }));
            setTimeout(() => window.dispatchEvent(new KeyboardEvent('keyup', { code: 'KeyC', bubbles: true })), 100);
          }}
        />
      )}

      {/* Touch Controls */}
      {!paused && (
        <TouchControls engine={engineRef.current} />
      )}

      {/* Coin popup */}
      {coinPopup && (
        <div key={coinPopup.key} style={{
          position: 'fixed', top: '35%', left: '50%',
          transform: 'translate(-50%, -50%)',
          fontSize: 22, fontWeight: 800, color: '#ffcc00',
          textShadow: '0 0 12px rgba(255,204,0,0.7)',
          pointerEvents: 'none',
          animation: 'slide-up 0.3s ease forwards',
          zIndex: 20,
        }}>
          +{coinPopup.amount} 💰
        </div>
      )}

      {/* Pause menu */}
      {paused && (
        <PauseMenu
          onResume={handleResume}
          onMainMenu={handleExitToMenu}
          onResetCar={handleResetCar}
          onWeatherChange={handleWeatherChange}
          currentWeather={stats?.weather ?? 'clear'}
        />
      )}
    </div>
  );
}
