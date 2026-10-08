'use client';

import React, { useEffect, useRef } from 'react';

interface DynamicStageProps {
  onEnterClick?: () => void;
  onRegisterClick?: () => void;
  hideActionDock?: boolean;
}

export function DynamicStage({ onEnterClick, onRegisterClick, hideActionDock = false }: DynamicStageProps) {
  const sceneRef = useRef<HTMLDivElement>(null);
  const fxlRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const sc = sceneRef.current;
    const fxl = fxlRef.current;
    if (!sc || !fxl) return;

    const R = Math.random;
    let tx = 0;
    let ty = 0;
    let cx = 0;
    let cy = 0;
    let last = -1e9;
    let animFrameId: number;

    const handlePointerMove = (e: PointerEvent) => {
      last = performance.now();
      tx = -(e.clientY / window.innerHeight - 0.5) * 9;
      ty = (e.clientX / window.innerWidth - 0.5) * 12;
    };

    window.addEventListener('pointermove', handlePointerMove, { passive: true });

    function renderLoop(t: number) {
      if (t - last > 3000) {
        tx = Math.sin(t / 3800) * 2.2;
        ty = Math.sin(t / 5200) * 3.4;
      }
      cx += (tx - cx) * 0.06;
      cy += (ty - cy) * 0.06;
      if (sc) {
        sc.style.transform = `rotateX(${cx.toFixed(3)}deg) rotateY(${cy.toFixed(3)}deg)`;
      }
      animFrameId = requestAnimationFrame(renderLoop);
    }

    animFrameId = requestAnimationFrame(renderLoop);

    function emit(left: number, top: number, char: string, size: number) {
      if (!fxl) return;
      const s = document.createElement('span');
      s.className = 'fx';
      s.textContent = char;
      s.style.cssText = `left:${left}%;top:${top}%;font-size:${size}vw;--dx:${R() * 40 - 10}px`;
      fxl.appendChild(s);
      setTimeout(() => {
        s.remove();
      }, 4000);
    }

    // Jigglypuff singing notes ♪♫♬
    const notes = ['♪', '♫', '♬'];
    const intervalNotes = setInterval(() => {
      emit(13 + R() * 5, 31 + R() * 5, notes[Math.floor(R() * notes.length)], 1 + R() * 0.9);
    }, 650);

    // Snorlax snoozing zZ
    const snoreChars = ['z', 'Z'];
    const intervalSnore = setInterval(() => {
      emit(70 + R() * 4, 7 + R() * 3, snoreChars[Math.floor(R() * snoreChars.length)], 1 + R() * 0.7);
    }, 1700);

    // Eevee sleeping z
    const intervalEevee = setInterval(() => {
      emit(65.5 + R() * 4, 70 + R() * 3, 'z', 0.9 + R() * 0.4);
    }, 2300);

    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      cancelAnimationFrame(animFrameId);
      clearInterval(intervalNotes);
      clearInterval(intervalSnore);
      clearInterval(intervalEevee);
    };
  }, []);

  return (
    <div className="w-full h-full flex items-center justify-center select-none relative overflow-hidden">
      
      {/* 3D Perspective Tilt Wrapper (Edge-to-Edge Full Screen) */}
      <div className="tilt">
        <div className="stage">
          <div ref={sceneRef} className="scene" id="scene">
            


            {/* Layer 2: Flapping Wings (--z: 28px) */}
            <div className="L w" style={{ ['--z' as any]: '28px', ['--s' as any]: 0.9767 }}>
              <div className="l wl" title="Phoenix Left Wing" />
              <div className="l wr" title="Phoenix Right Wing" />
            </div>

            {/* Layer 3: Satin Red Ribbon Arch (--z: 50px) */}
            <div className="L r" style={{ ['--z' as any]: '50px', ['--s' as any]: 0.9583 }}>
              <div className="l rd" title="Satin Ribbons" />
            </div>

            {/* Layer 4: Snorlax Transparent Sprite & Ambient FX (--z: 70px) */}
            <div className="L" style={{ ['--z' as any]: '70px', ['--s' as any]: 0.9417 }}>
              <div className="l sn" title="Snorlax · Slumbering Colossus" />
            </div>

            {/* Layer 5: Ambient Moving Fog (--z: 90px) */}
            <div className="L" style={{ ['--z' as any]: '90px', ['--s' as any]: 0.925 }}>
              <div className="fog" style={{ left: 0, top: '20%' }} />
              <div className="fog" style={{ left: '30%', top: '40%', animationDelay: '-14s' }} />
            </div>

            {/* Layer 6: FX, Drifting Dust, Falling Feathers, Embers (--z: 110px) */}
            <div ref={fxlRef} className="L" id="fxl" style={{ ['--z' as any]: '110px', ['--s' as any]: 0.9083 }}>
              <i className="d" style={{ left: '31.1%', top: '83.3%', width: '3px', height: '3px', background: '#D21319', animationDuration: '13.8s', animationDelay: '-1.6s' }} />
              <i className="d" style={{ left: '40.6%', top: '95.1%', width: '2px', height: '2px', background: '#AFAEA2', animationDuration: '17.0s', animationDelay: '-13.8s' }} />
              <i className="d" style={{ left: '52.0%', top: '61.6%', width: '3px', height: '3px', background: '#AFAEA2', animationDuration: '16.8s', animationDelay: '-14.9s' }} />
              <i className="d" style={{ left: '22.6%', top: '95.6%', width: '3px', height: '3px', background: '#AFAEA2', animationDuration: '17.3s', animationDelay: '-14.5s' }} />
              <i className="d" style={{ left: '20.6%', top: '58.6%', width: '3px', height: '3px', background: '#D21319', animationDuration: '15.3s', animationDelay: '-13.2s' }} />
              <i className="d" style={{ left: '10.3%', top: '76.4%', width: '3px', height: '3px', background: '#AFAEA2', animationDuration: '15.7s', animationDelay: '-9.1s' }} />
              <i className="d" style={{ left: '25.7%', top: '56.8%', width: '3px', height: '3px', background: '#AFAEA2', animationDuration: '18.4s', animationDelay: '-14.7s' }} />
              <i className="d" style={{ left: '2.7%', top: '57.5%', width: '3px', height: '3px', background: '#AFAEA2', animationDuration: '16.0s', animationDelay: '-5.6s' }} />
              <i className="d" style={{ left: '41.7%', top: '75.9%', width: '3px', height: '3px', background: '#D21319', animationDuration: '13.3s', animationDelay: '-2.9s' }} />
              <i className="d" style={{ left: '26.9%', top: '87.8%', width: '3px', height: '3px', background: '#AFAEA2', animationDuration: '9.8s', animationDelay: '-8.3s' }} />
              <i className="d" style={{ left: '51.8%', top: '78.9%', width: '3px', height: '3px', background: '#AFAEA2', animationDuration: '16.0s', animationDelay: '-2.6s' }} />
              <i className="d" style={{ left: '8.4%', top: '94.8%', width: '3px', height: '3px', background: '#AFAEA2', animationDuration: '15.4s', animationDelay: '-7.9s' }} />
              <i className="d" style={{ left: '36.2%', top: '84.8%', width: '3px', height: '3px', background: '#D21319', animationDuration: '12.2s', animationDelay: '-10.1s' }} />
              <i className="d" style={{ left: '11.7%', top: '43.7%', width: '3px', height: '3px', background: '#AFAEA2', animationDuration: '11.3s', animationDelay: '-13.8s' }} />
              <i className="d" style={{ left: '13.7%', top: '96.1%', width: '3px', height: '3px', background: '#AFAEA2', animationDuration: '11.9s', animationDelay: '-0.5s' }} />
              <i className="d" style={{ left: '68.9%', top: '93.8%', width: '3px', height: '3px', background: '#AFAEA2', animationDuration: '18.5s', animationDelay: '-13.2s' }} />
              <i className="d" style={{ left: '3.7%', top: '57.3%', width: '3px', height: '3px', background: '#D21319', animationDuration: '18.7s', animationDelay: '-14.0s' }} />
              <i className="d" style={{ left: '84.7%', top: '92.2%', width: '4px', height: '4px', background: '#AFAEA2', animationDuration: '15.8s', animationDelay: '-1.4s' }} />
              <i className="d" style={{ left: '87.8%', top: '57.5%', width: '3px', height: '3px', background: '#AFAEA2', animationDuration: '11.5s', animationDelay: '-10.8s' }} />
              <i className="d" style={{ left: '33.8%', top: '40.6%', width: '3px', height: '3px', background: '#AFAEA2', animationDuration: '9.4s', animationDelay: '-3.1s' }} />
              <i className="d" style={{ left: '97.7%', top: '74.3%', width: '3px', height: '3px', background: '#D21319', animationDuration: '13.4s', animationDelay: '-3.7s' }} />
              <i className="d" style={{ left: '12.9%', top: '43.7%', width: '3px', height: '3px', background: '#AFAEA2', animationDuration: '16.4s', animationDelay: '-10.7s' }} />

              {/* Falling Feathers */}
              <svg className="ft" viewBox="-8 0 16 46" style={{ left: '18%', width: '1.1%', animationDuration: '19s', animationDelay: '-3s' }}>
                <path d="M0 0C7 10 7 28 0 46C-7 28-7 10 0 0Z" fill="#AFAEA2" fillOpacity="0.75" />
                <path d="M0 2V46" stroke="#1B1E4A" strokeWidth="0.7" />
              </svg>
              <svg className="ft" viewBox="-8 0 16 46" style={{ left: '52%', width: '0.88%', animationDuration: '24s', animationDelay: '-11s' }}>
                <path d="M0 0C7 10 7 28 0 46C-7 28-7 10 0 0Z" fill="#AFAEA2" fillOpacity="0.75" />
                <path d="M0 2V46" stroke="#1B1E4A" strokeWidth="0.7" />
              </svg>
              <svg className="ft" viewBox="-8 0 16 46" style={{ left: '82%', width: '1.21%', animationDuration: '21s', animationDelay: '-16s' }}>
                <path d="M0 0C7 10 7 28 0 46C-7 28-7 10 0 0Z" fill="#AFAEA2" fillOpacity="0.75" />
                <path d="M0 2V46" stroke="#1B1E4A" strokeWidth="0.7" />
              </svg>
              <svg className="ft" viewBox="-8 0 16 46" style={{ left: '35%', width: '0.77%', animationDuration: '27s', animationDelay: '-20s' }}>
                <path d="M0 0C7 10 7 28 0 46C-7 28-7 10 0 0Z" fill="#AFAEA2" fillOpacity="0.75" />
                <path d="M0 2V46" stroke="#1B1E4A" strokeWidth="0.7" />
              </svg>
              <svg className="ft" viewBox="-8 0 16 46" style={{ left: '68%', width: '0.99%', animationDuration: '22s', animationDelay: '-7s' }}>
                <path d="M0 0C7 10 7 28 0 46C-7 28-7 10 0 0Z" fill="#AFAEA2" fillOpacity="0.75" />
                <path d="M0 2V46" stroke="#1B1E4A" strokeWidth="0.7" />
              </svg>

              {/* Floating Crimson Embers */}
              <i className="e" style={{ left: '94.2%', width: '3px', height: '3px', animationDuration: '9.6s', animationDelay: '-6.6s' }} />
              <i className="e" style={{ left: '57.8%', width: '3px', height: '3px', animationDuration: '7.9s', animationDelay: '-0.4s' }} />
              <i className="e" style={{ left: '81.5%', width: '4px', height: '4px', animationDuration: '7.8s', animationDelay: '-12.0s' }} />
              <i className="e" style={{ left: '64.3%', width: '3px', height: '3px', animationDuration: '7.2s', animationDelay: '-2.4s' }} />
              <i className="e" style={{ left: '44.2%', width: '4px', height: '4px', animationDuration: '9.0s', animationDelay: '-2.6s' }} />
              <i className="e" style={{ left: '44.7%', width: '3px', height: '3px', animationDuration: '9.9s', animationDelay: '-5.1s' }} />
              <i className="e" style={{ left: '23.3%', width: '3px', height: '3px', animationDuration: '7.1s', animationDelay: '-0.4s' }} />
              <i className="e" style={{ left: '26.8%', width: '4px', height: '4px', animationDuration: '9.2s', animationDelay: '-9.3s' }} />
              <i className="e" style={{ left: '42.2%', width: '3px', height: '3px', animationDuration: '7.6s', animationDelay: '-3.9s' }} />
              <i className="e" style={{ left: '86.8%', width: '3px', height: '3px', animationDuration: '7.9s', animationDelay: '-1.4s' }} />
              <i className="e" style={{ left: '56.6%', width: '4px', height: '4px', animationDuration: '11.8s', animationDelay: '-7.8s' }} />
              <i className="e" style={{ left: '84.9%', width: '3px', height: '3px', animationDuration: '10.3s', animationDelay: '-0.5s' }} />
              <i className="e" style={{ left: '39.4%', width: '3px', height: '3px', animationDuration: '8.6s', animationDelay: '-11.2s' }} />
              <i className="e" style={{ left: '56.8%', width: '4px', height: '4px', animationDuration: '11.7s', animationDelay: '-2.0s' }} />
            </div>

          </div>

          {/* Overlays */}
          <div className="glow" />
          <div className="sweep" />
          <div className="vig" />
          <div className="grain" />
        </div>
      </div>
    </div>
  );
}
