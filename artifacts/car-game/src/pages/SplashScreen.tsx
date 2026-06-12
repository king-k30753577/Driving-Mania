import { useEffect, useState } from 'react';

interface Props {
  onDone: () => void;
}

export function SplashScreen({ onDone }: Props) {
  const [progress, setProgress] = useState(0);
  const [phase, setPhase] = useState<'logo' | 'loading' | 'done'>('logo');

  useEffect(() => {
    const t1 = setTimeout(() => setPhase('loading'), 800);
    const interval = setInterval(() => {
      setProgress(p => {
        if (p >= 100) {
          clearInterval(interval);
          setPhase('done');
          setTimeout(onDone, 400);
          return 100;
        }
        return p + 2 + Math.random() * 4;
      });
    }, 60);
    return () => { clearTimeout(t1); clearInterval(interval); };
  }, [onDone]);

  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: 'linear-gradient(135deg, #0a0a0f 0%, #0f0f1a 50%, #0a0a0f 100%)',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      zIndex: 100,
    }}>
      {/* Animated logo */}
      <div style={{ textAlign: 'center', marginBottom: 40 }}
           className={phase !== 'logo' ? 'animate-slide-up' : ''}>
        {/* Car icon */}
        <div style={{
          fontSize: 72, marginBottom: 8,
          filter: 'drop-shadow(0 0 24px rgba(232,56,13,0.7))',
          animation: 'glow-pulse 2s ease-in-out infinite',
        }}>
          🏎️
        </div>
        <div style={{
          fontSize: 48, fontWeight: 900,
          letterSpacing: '-2px',
          background: 'linear-gradient(135deg, #ff4520, #ffb800)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          lineHeight: 1,
        }}>
          CARBOOM
        </div>
        <div style={{ color: 'rgba(240,240,255,0.4)', fontSize: 13, letterSpacing: 4, marginTop: 4 }}>
          STREET RACING
        </div>
      </div>

      {/* Loading bar */}
      {phase === 'loading' || phase === 'done' ? (
        <div style={{ width: 220, textAlign: 'center' }} className="animate-fade-in">
          <div style={{ color: 'rgba(240,240,255,0.5)', fontSize: 12, marginBottom: 10, letterSpacing: 2 }}>
            {progress < 40 ? 'BUILDING CITY...' :
             progress < 70 ? 'WARMING UP ENGINE...' :
             progress < 90 ? 'CHECKING TIRES...' : 'READY!'}
          </div>
          <div className="progress-bar" style={{ width: '100%' }}>
            <div className="progress-fill" style={{ width: `${Math.min(100, progress)}%` }} />
          </div>
          <div style={{ color: 'rgba(240,240,255,0.3)', fontSize: 11, marginTop: 8 }}>
            {Math.floor(Math.min(100, progress))}%
          </div>
        </div>
      ) : null}

      {/* Version tag */}
      <div style={{
        position: 'absolute', bottom: 24,
        color: 'rgba(240,240,255,0.2)', fontSize: 11
      }}>
        v1.0.0 · Powered by Three.js
      </div>
    </div>
  );
}
