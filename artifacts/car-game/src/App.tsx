import { useState, useEffect } from 'react';
import { SplashScreen } from './pages/SplashScreen';
import { MainMenu } from './pages/MainMenu';
import { GameView } from './pages/GameView';
import { Garage } from './pages/Garage';
import { Settings } from './pages/Settings';
import { Achievements } from './pages/Achievements';
import { tgApp } from './telegram/TelegramApp';

type Screen = 'splash' | 'menu' | 'game' | 'garage' | 'settings' | 'achievements';

export default function App() {
  const [screen, setScreen] = useState<Screen>('splash');

  useEffect(() => {
    // Initialize Telegram Mini App
    tgApp.init();

    // Prevent pull-to-refresh and default gestures on mobile
    const preventDefault = (e: TouchEvent) => {
      if (e.touches.length > 1) e.preventDefault();
    };
    document.addEventListener('touchstart', preventDefault, { passive: false });

    // Prevent context menu
    document.addEventListener('contextmenu', e => e.preventDefault());

    return () => {
      document.removeEventListener('touchstart', preventDefault);
    };
  }, []);

  const go = (s: Screen) => setScreen(s);

  return (
    <div style={{ width: '100%', height: '100%', overflow: 'hidden', position: 'fixed', inset: 0 }}>
      {screen === 'splash' && (
        <SplashScreen onDone={() => go('menu')} />
      )}

      {screen === 'menu' && (
        <MainMenu
          onPlay={() => go('game')}
          onGarage={() => go('garage')}
          onSettings={() => go('settings')}
          onAchievements={() => go('achievements')}
        />
      )}

      {screen === 'game' && (
        <GameView onExit={() => go('menu')} />
      )}

      {screen === 'garage' && (
        <Garage onBack={() => go('menu')} />
      )}

      {screen === 'settings' && (
        <Settings onBack={() => go('menu')} />
      )}

      {screen === 'achievements' && (
        <Achievements onBack={() => go('menu')} />
      )}
    </div>
  );
}
