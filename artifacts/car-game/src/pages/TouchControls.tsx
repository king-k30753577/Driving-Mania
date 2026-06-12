import { useEffect, useRef, useCallback } from 'react';
import { GameEngine } from '../game/GameEngine';
import { saveSystem } from '../game/SaveSystem';

interface Props {
  engine: GameEngine | null;
}

export function TouchControls({ engine }: Props) {
  const steeringRef = useRef<HTMLDivElement>(null);
  const isDraggingWheel = useRef(false);
  const wheelStartX = useRef(0);
  const settings = saveSystem.get().settings;
  const mode = settings.controlMode;

  // Button touch handler
  const makeButtonHandlers = useCallback((name: string) => ({
    onTouchStart: (e: React.TouchEvent) => {
      e.preventDefault();
      engine?.setControlButton(name, true);
    },
    onTouchEnd: (e: React.TouchEvent) => {
      e.preventDefault();
      engine?.setControlButton(name, false);
    },
    onTouchCancel: (e: React.TouchEvent) => {
      e.preventDefault();
      engine?.setControlButton(name, false);
    },
    onMouseDown: () => engine?.setControlButton(name, true),
    onMouseUp: () => engine?.setControlButton(name, false),
    onMouseLeave: () => engine?.setControlButton(name, false),
  }), [engine]);

  // Steering wheel drag
  useEffect(() => {
    if (!steeringRef.current || mode !== 'wheel') return;
    const el = steeringRef.current;
    const W = 130;

    const onStart = (clientX: number) => {
      isDraggingWheel.current = true;
      wheelStartX.current = clientX;
    };
    const onMove = (clientX: number) => {
      if (!isDraggingWheel.current) return;
      const delta = clientX - wheelStartX.current;
      const angle = Math.max(-1, Math.min(1, delta / (W * 0.6)));
      engine?.setSteeringWheel(angle);
      el.style.transform = `rotate(${angle * 40}deg)`;
    };
    const onEnd = () => {
      isDraggingWheel.current = false;
      engine?.setSteeringWheel(0);
      el.style.transform = 'rotate(0deg)';
    };

    const tStart = (e: TouchEvent) => { e.preventDefault(); onStart(e.touches[0].clientX); };
    const tMove = (e: TouchEvent) => { e.preventDefault(); onMove(e.touches[0].clientX); };
    const tEnd = () => onEnd();
    const mStart = (e: MouseEvent) => onStart(e.clientX);
    const mMove = (e: MouseEvent) => onMove(e.clientX);
    const mEnd = () => onEnd();

    el.addEventListener('touchstart', tStart, { passive: false });
    el.addEventListener('touchmove', tMove, { passive: false });
    el.addEventListener('touchend', tEnd);
    window.addEventListener('mousemove', mMove);
    window.addEventListener('mouseup', mEnd);
    el.addEventListener('mousedown', mStart);

    return () => {
      el.removeEventListener('touchstart', tStart);
      el.removeEventListener('touchmove', tMove);
      el.removeEventListener('touchend', tEnd);
      window.removeEventListener('mousemove', mMove);
      window.removeEventListener('mouseup', mEnd);
      el.removeEventListener('mousedown', mStart);
    };
  }, [engine, mode]);

  if (mode === 'tilt') {
    // Tilt mode — only show gas/brake/handbrake buttons
    return (
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 10 }}>
        {/* Gas */}
        <button className="touch-control" {...makeButtonHandlers('gas')} style={{
          position: 'absolute', bottom: 30, right: 24,
          width: 80, height: 80, fontSize: 28,
          pointerEvents: 'all',
        }}>⬆️</button>
        {/* Brake */}
        <button className="touch-control" {...makeButtonHandlers('brake')} style={{
          position: 'absolute', bottom: 120, right: 24,
          width: 68, height: 68, fontSize: 22,
          pointerEvents: 'all',
        }}>⬇️</button>
        {/* Handbrake */}
        <button className="touch-control" {...makeButtonHandlers('handbrake')} style={{
          position: 'absolute', bottom: 30, left: 24,
          width: 72, height: 72, fontSize: 14, fontWeight: 700,
          pointerEvents: 'all',
        }}>HB</button>
        {/* Nitro */}
        <button className="touch-control" {...makeButtonHandlers('nitro')} style={{
          position: 'absolute', bottom: 120, left: 24,
          width: 60, height: 60, fontSize: 14, fontWeight: 700,
          color: '#00aaff', borderColor: '#00aaff',
          pointerEvents: 'all',
        }}>N2O</button>
        {/* Tilt reminder */}
        <div style={{
          position: 'absolute', bottom: 30, left: '50%', transform: 'translateX(-50%)',
          fontSize: 11, color: 'rgba(240,240,255,0.3)', letterSpacing: 1,
          pointerEvents: 'none',
        }}>TILT TO STEER</div>
      </div>
    );
  }

  if (mode === 'wheel') {
    return (
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 10 }}>
        {/* Steering wheel */}
        <div ref={steeringRef} className="steering-wheel" style={{
          position: 'absolute', bottom: 30, left: '50%',
          transform: 'translateX(-50%)',
          width: 130, height: 130,
          borderRadius: '50%',
          border: '3px solid rgba(255,255,255,0.25)',
          background: 'rgba(0,0,0,0.3)',
          backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'grab',
          pointerEvents: 'all',
          transition: 'transform 0.1s ease-out',
          userSelect: 'none',
        }}>
          {/* Wheel spokes */}
          <div style={{ width: '100%', height: '100%', position: 'relative', borderRadius: '50%', overflow: 'hidden' }}>
            {[0, 120, 240].map(deg => (
              <div key={deg} style={{
                position: 'absolute', left: '50%', top: '50%',
                width: 3, height: '42%',
                background: 'rgba(255,255,255,0.4)',
                transformOrigin: '50% 0',
                transform: `translateX(-50%) rotate(${deg}deg)`,
              }} />
            ))}
            <div style={{
              position: 'absolute', left: '50%', top: '50%',
              transform: 'translate(-50%, -50%)',
              width: 28, height: 28, borderRadius: '50%',
              background: 'rgba(255,255,255,0.15)',
              border: '2px solid rgba(255,255,255,0.3)',
            }} />
          </div>
        </div>

        {/* Gas */}
        <button className="touch-control" {...makeButtonHandlers('gas')} style={{
          position: 'absolute', bottom: 40, right: 20,
          width: 88, height: 88, fontSize: 32,
          pointerEvents: 'all',
        }}>⛽</button>
        {/* Brake */}
        <button className="touch-control" {...makeButtonHandlers('brake')} style={{
          position: 'absolute', bottom: 140, right: 24,
          width: 68, height: 68, fontSize: 22,
          pointerEvents: 'all',
        }}>🛑</button>
        {/* Handbrake */}
        <button className="touch-control" {...makeButtonHandlers('handbrake')} style={{
          position: 'absolute', bottom: 40, left: 20,
          width: 72, height: 72, fontSize: 14, fontWeight: 800,
          pointerEvents: 'all',
        }}>HB</button>
        {/* Nitro */}
        <button className="touch-control" {...makeButtonHandlers('nitro')} style={{
          position: 'absolute', bottom: 130, left: 24,
          width: 60, height: 60, fontSize: 13, fontWeight: 700,
          color: '#00aaff', borderColor: '#00aaff',
          pointerEvents: 'all',
        }}>N2O</button>
      </div>
    );
  }

  // Default: buttons mode
  return (
    <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 10 }}>
      {/* Gas button */}
      <button className="touch-control" {...makeButtonHandlers('gas')} style={{
        position: 'absolute', bottom: 40, right: 20,
        width: 88, height: 88, fontSize: 30,
        background: 'rgba(0,200,0,0.2)',
        borderColor: 'rgba(0,255,0,0.4)',
        pointerEvents: 'all',
      }}>▲</button>

      {/* Brake button */}
      <button className="touch-control" {...makeButtonHandlers('brake')} style={{
        position: 'absolute', bottom: 140, right: 24,
        width: 68, height: 68, fontSize: 22,
        background: 'rgba(200,0,0,0.2)',
        borderColor: 'rgba(255,50,0,0.4)',
        pointerEvents: 'all',
      }}>▼</button>

      {/* Left button */}
      <button className="touch-control" {...makeButtonHandlers('left')} style={{
        position: 'absolute', bottom: 40, left: 20,
        width: 78, height: 78, fontSize: 26,
        pointerEvents: 'all',
      }}>◀</button>

      {/* Right button */}
      <button className="touch-control" {...makeButtonHandlers('right')} style={{
        position: 'absolute', bottom: 40, left: 110,
        width: 78, height: 78, fontSize: 26,
        pointerEvents: 'all',
      }}>▶</button>

      {/* Handbrake */}
      <button className="touch-control" {...makeButtonHandlers('handbrake')} style={{
        position: 'absolute', bottom: 130, left: 24,
        width: 70, height: 70, fontSize: 12, fontWeight: 800,
        letterSpacing: 0.5,
        pointerEvents: 'all',
      }}>HAND{'\n'}BRAKE</button>

      {/* Nitro */}
      <button className="touch-control" {...makeButtonHandlers('nitro')} style={{
        position: 'absolute', bottom: 130, left: 106,
        width: 60, height: 60, fontSize: 13, fontWeight: 700,
        color: '#00aaff', borderColor: '#00aaff',
        pointerEvents: 'all',
      }}>N2O</button>
    </div>
  );
}
