'use client';

import React, { useEffect, useRef } from 'react';

interface DynamicStageProps {
  onEnterClick?: () => void;
  onRegisterClick?: () => void;
  hideActionDock?: boolean;
}

export function DynamicStage({ onEnterClick, onRegisterClick, hideActionDock = false }: DynamicStageProps) {
  const sceneLRef = useRef<HTMLDivElement>(null);
  const scenePRef = useRef<HTMLDivElement>(null);
  const fxLRef = useRef<HTMLDivElement>(null);
  const fxPRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const CFG: Record<string, { n: [number, number, number, number]; s: [number, number, number, number]; e: [number, number, number, number] }> = {
      l: { n: [13, 31, 5, 5], s: [70, 7, 4, 3], e: [65.5, 70, 4, 3] },
      p: { n: [4, 36, 5, 4], s: [86, 16, 4, 3], e: [44, 77, 4, 3] },
    };
    const R = Math.random;
    let tx = 0;
    let ty = 0;
    let cx = 0;
    let cy = 0;
    let last = -1e9;
    let animFrameId: number;

    const handlePointerMove = (e: PointerEvent) => {
      if (e.pointerType === 'touch') return;
      last = performance.now();
      tx = -(e.clientY / window.innerHeight - 0.5) * 9;
      ty = (e.clientX / window.innerWidth - 0.5) * 12;
    };

    window.addEventListener('pointermove', handlePointerMove, { passive: true });

    function renderLoop(t: number) {
      if (document.hidden) {
        animFrameId = requestAnimationFrame(renderLoop);
        return;
      }

      if (t - last > 3000) {
        tx = Math.sin(t / 3800) * 2.2;
        ty = Math.sin(t / 5200) * 3.4;
      }
      cx += (tx - cx) * 0.06;
      cy += (ty - cy) * 0.06;

      const isMobileNow = window.innerWidth < 768;
      const targetScene = isMobileNow ? scenePRef.current : sceneLRef.current;
      const transformVal = `rotateX(${cx.toFixed(3)}deg) rotateY(${cy.toFixed(3)}deg)`;
      if (targetScene) targetScene.style.transform = transformVal;

      animFrameId = requestAnimationFrame(renderLoop);
    }

    animFrameId = requestAnimationFrame(renderLoop);

    function emit(i: 'l' | 'p', pos: [number, number, number, number], ch: string, sc: number) {
      if (document.hidden) return;
      const fl = i === 'l' ? fxLRef.current : fxPRef.current;
      if (!fl) return;
      // Cap max concurrent particles to 6 to prevent DOM bloat and garbage collection spikes
      if (fl.children.length > 6) {
        fl.firstElementChild?.remove();
      }
      const W = fl.offsetWidth;
      if (!W) return;
      const s = document.createElement('span');
      s.className = 'fx';
      s.textContent = ch;
      s.style.cssText = `left:${pos[0] + R() * pos[2]}%;top:${pos[1] + R() * pos[3]}%;font-size:${(W * 0.014 * sc).toFixed(1)}px;--dx:${(R() * W * 0.03).toFixed(0)}px;--dy:-${(W * 0.05).toFixed(0)}px`;
      fl.appendChild(s);
      setTimeout(() => {
        s.remove();
      }, 3500);
    }

    const notes = ['♪', '♫', '♬'];
    const snoreChars = ['z', 'Z'];

    // Adaptive intervals: on mobile viewports, spawn less frequently to conserve battery & frame rate
    const isMobile = window.innerWidth < 768;
    const noteIntervalTime = isMobile ? 2200 : 900;
    const snoreIntervalTime = isMobile ? 3800 : 2000;
    const eeveeIntervalTime = isMobile ? 5000 : 2800;

    const intervalNotes = setInterval(() => {
      const isMob = window.innerWidth < 768;
      const id = isMob ? 'p' : 'l';
      emit(id, CFG[id].n, notes[Math.floor(R() * notes.length)], 1 + R() * 0.9);
    }, noteIntervalTime);

    const intervalSnore = setInterval(() => {
      const isMob = window.innerWidth < 768;
      const id = isMob ? 'p' : 'l';
      emit(id, CFG[id].s, snoreChars[Math.floor(R() * snoreChars.length)], 1 + R() * 0.7);
    }, snoreIntervalTime);

    const intervalEevee = setInterval(() => {
      const isMob = window.innerWidth < 768;
      const id = isMob ? 'p' : 'l';
      emit(id, CFG[id].e, 'z', 0.9 + R() * 0.4);
    }, eeveeIntervalTime);

    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      cancelAnimationFrame(animFrameId);
      clearInterval(intervalNotes);
      clearInterval(intervalSnore);
      clearInterval(intervalEevee);
    };
  }, []);

  const playRetroBeep = (freq: number) => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      gain.gain.setValueAtTime(0.05, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.3);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.3);
    } catch {
      // Audio might be blocked by browser autoplay policy until user gesture
    }
  };

  return (
    <div className="w-full h-full flex items-center justify-center select-none relative overflow-hidden [clip-path:inset(0)] touch-pan-y pointer-events-auto">
      {/* 3D Perspective Tilt Wrapper (Edge-to-Edge Full Screen) */}
      <div className="tilt">
        {/* ============================================================== */}
        {/* LANDSCAPE STAGE (Tablets & Laptops: >= 768px, exactly as before) */}
        {/* ============================================================== */}
        <div className="stage st-l">
          <div ref={sceneLRef} className="scene" id="scn-l">
            {/* Animated Ribbons */}
            <div className="L" style={{ ['--z' as any]: '12px', ['--s' as any]: 0.99 }}>
              <svg
                className="rib"
                viewBox="0 0 1000 558"
                preserveAspectRatio="none"
                fill="none"
                stroke="#D21319"
                strokeLinecap="round"
                opacity="0.6"
              >
                <path strokeWidth="2.4" d="M30 0C70 90 -10 170 40 270S20 440 50 558">
                  <animate
                    attributeName="d"
                    dur="11s"
                    repeatCount="indefinite"
                    calcMode="spline"
                    keySplines=".5 0 .5 1;.5 0 .5 1"
                    keyTimes="0;.5;1"
                    values="M30 0C70 90 -10 170 40 270S20 440 50 558;M50 0C10 100 80 190 20 290S60 450 30 558;M30 0C70 90 -10 170 40 270S20 440 50 558"
                  />
                </path>
                <path strokeWidth="2" d="M975 0C940 100 1010 200 960 300S985 450 950 558">
                  <animate
                    attributeName="d"
                    dur="13s"
                    repeatCount="indefinite"
                    calcMode="spline"
                    keySplines=".5 0 .5 1;.5 0 .5 1"
                    keyTimes="0;.5;1"
                    values="M975 0C940 100 1010 200 960 300S985 450 950 558;M955 0C1000 90 930 210 985 310S950 460 975 558;M975 0C940 100 1010 200 960 300S985 450 950 558"
                  />
                </path>
              </svg>
            </div>

            {/* Wings */}
            <div className="L w" style={{ ['--z' as any]: '1px', ['--s' as any]: 0.9992 }}>
              <div className="l wl" title="Phoenix Left Wing" />
              <div className="l wr" title="Phoenix Right Wing" />
            </div>

            {/* Red Arch Ribbon */}
            <div className="L r" style={{ ['--z' as any]: '2px', ['--s' as any]: 0.9983 }}>
              <div className="l rd" title="Satin Ribbons" />
            </div>

            {/* Interactive Pokémon Sprites */}
            <div className="L" style={{ ['--z' as any]: '55px', ['--s' as any]: 0.9542 }}>
              <div className="s jiggly" title="Jigglypuff" onClick={() => playRetroBeep(440)} />
              <div className="s gengar" title="Gengar" onClick={() => playRetroBeep(330)} />
              <div className="s pika" title="Pikachu" onClick={() => playRetroBeep(880)} />
              <div className="s psy" title="Psyduck" onClick={() => playRetroBeep(520)} />
              <div className="s eevee" title="Eevee" onClick={() => playRetroBeep(660)} />
              <div className="l sn" title="Snorlax" onClick={() => playRetroBeep(220)} />
            </div>

            {/* Ambient Fog */}
            <div className="L" style={{ ['--z' as any]: '90px', ['--s' as any]: 0.925 }}>
              <div className="fog" style={{ left: 0, top: '20%' }} />
              <div className="fog" style={{ left: '30%', top: '40%', animationDelay: '-14s' }} />
            </div>

            {/* Dust, Feathers, Embers for Landscape */}
            <div ref={fxLRef} className="L" id="fx-l" style={{ ['--z' as any]: '110px', ['--s' as any]: 0.9083 }}>
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

              {/* Feathers */}
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

              {/* Crimson Embers */}
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

        {/* ============================================================== */}
        {/* PORTRAIT STAGE (Mobile Phones: < 768px from site)            */}
        {/* ============================================================== */}
        <div className="stage st-p">
          <div ref={scenePRef} className="scene" id="scn-p">
            {/* Wings */}
            <div className="L w" style={{ ['--z' as any]: '1px', ['--s' as any]: 0.9992 }}>
              <div className="l wl" title="Phoenix Left Wing" />
              <div className="l wr" title="Phoenix Right Wing" />
            </div>

            {/* Red Arch Ribbon */}
            <div className="L r" style={{ ['--z' as any]: '2px', ['--s' as any]: 0.9983 }}>
              <div className="l rd" title="Satin Ribbons" />
            </div>

            {/* Interactive Pokémon Sprites (Portrait Composition) */}
            <div className="L" style={{ ['--z' as any]: '55px', ['--s' as any]: 0.9542 }}>
              <div className="s jiggly" title="Jigglypuff" onClick={() => playRetroBeep(440)} />
              <div className="s gengar" title="Gengar" onClick={() => playRetroBeep(330)} />
              <div className="s pika" title="Pikachu" onClick={() => playRetroBeep(880)} />
              <div className="s psy" title="Psyduck" onClick={() => playRetroBeep(520)} />
              <div className="s eevee" title="Eevee" onClick={() => playRetroBeep(660)} />
              <div className="l sn" title="Snorlax" onClick={() => playRetroBeep(220)} />
            </div>

            {/* Ambient Fog */}
            <div className="L" style={{ ['--z' as any]: '90px', ['--s' as any]: 0.925 }}>
              <div className="fog" style={{ left: 0, top: '20%' }} />
              <div className="fog" style={{ left: '30%', top: '40%', animationDelay: '-14s' }} />
            </div>

            {/* Dust, Feathers, Embers for Portrait */}
            <div ref={fxPRef} className="L" id="fx-p" style={{ ['--z' as any]: '110px', ['--s' as any]: 0.9083 }}>
              <i className="d" style={{ left: '60.9%', top: '56.0%', width: '4px', height: '4px', background: '#D21319', animationDuration: '10.9s', animationDelay: '-12.2s' }} />
              <i className="d" style={{ left: '50.3%', top: '93.9%', width: '3px', height: '3px', background: '#AFAEA2', animationDuration: '9.8s', animationDelay: '-10.0s' }} />
              <i className="d" style={{ left: '71.9%', top: '50.2%', width: '2px', height: '2px', background: '#AFAEA2', animationDuration: '18.5s', animationDelay: '-17.1s' }} />
              <i className="d" style={{ left: '17.1%', top: '54.3%', width: '4px', height: '4px', background: '#AFAEA2', animationDuration: '10.1s', animationDelay: '-9.1s' }} />
              <i className="d" style={{ left: '76.3%', top: '63.0%', width: '2px', height: '2px', background: '#D21319', animationDuration: '16.5s', animationDelay: '-1.8s' }} />
              <i className="d" style={{ left: '21.7%', top: '53.5%', width: '3px', height: '3px', background: '#AFAEA2', animationDuration: '16.9s', animationDelay: '-16.0s' }} />
              <i className="d" style={{ left: '89.5%', top: '63.8%', width: '3px', height: '3px', background: '#AFAEA2', animationDuration: '12.4s', animationDelay: '-0.8s' }} />
              <i className="d" style={{ left: '86.4%', top: '43.3%', width: '2px', height: '2px', background: '#AFAEA2', animationDuration: '12.8s', animationDelay: '-8.9s' }} />
              <i className="d" style={{ left: '24.7%', top: '84.2%', width: '2px', height: '2px', background: '#D21319', animationDuration: '17.5s', animationDelay: '-17.4s' }} />
              <i className="d" style={{ left: '13.6%', top: '74.7%', width: '2px', height: '2px', background: '#AFAEA2', animationDuration: '18.0s', animationDelay: '-3.7s' }} />
              <i className="d" style={{ left: '87.7%', top: '48.0%', width: '2px', height: '2px', background: '#AFAEA2', animationDuration: '18.2s', animationDelay: '-9.0s' }} />
              <i className="d" style={{ left: '53.6%', top: '51.9%', width: '4px', height: '4px', background: '#AFAEA2', animationDuration: '9.7s', animationDelay: '-3.5s' }} />
              <i className="d" style={{ left: '69.3%', top: '48.7%', width: '2px', height: '2px', background: '#D21319', animationDuration: '18.4s', animationDelay: '-13.0s' }} />
              <i className="d" style={{ left: '7.2%', top: '73.3%', width: '2px', height: '2px', background: '#AFAEA2', animationDuration: '15.1s', animationDelay: '-2.7s' }} />
              <i className="d" style={{ left: '72.7%', top: '74.5%', width: '3px', height: '3px', background: '#AFAEA2', animationDuration: '9.3s', animationDelay: '-15.6s' }} />
              <i className="d" style={{ left: '93.3%', top: '54.2%', width: '4px', height: '4px', background: '#AFAEA2', animationDuration: '15.1s', animationDelay: '-0.8s' }} />
              <i className="d" style={{ left: '83.2%', top: '71.3%', width: '3px', height: '3px', background: '#D21319', animationDuration: '14.7s', animationDelay: '-12.4s' }} />
              <i className="d" style={{ left: '12.6%', top: '92.9%', width: '3px', height: '3px', background: '#AFAEA2', animationDuration: '12.7s', animationDelay: '-3.8s' }} />
              <i className="d" style={{ left: '96.7%', top: '74.5%', width: '3px', height: '3px', background: '#AFAEA2', animationDuration: '9.2s', animationDelay: '-14.4s' }} />
              <i className="d" style={{ left: '2.1%', top: '46.7%', width: '3px', height: '3px', background: '#AFAEA2', animationDuration: '11.2s', animationDelay: '-4.9s' }} />
              <i className="d" style={{ left: '31.5%', top: '57.1%', width: '2px', height: '2px', background: '#D21319', animationDuration: '14.2s', animationDelay: '-1.0s' }} />
              <i className="d" style={{ left: '76.9%', top: '88.5%', width: '4px', height: '4px', background: '#AFAEA2', animationDuration: '14.0s', animationDelay: '-12.8s' }} />

              {/* Feathers */}
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

              {/* Crimson Embers */}
              <i className="e" style={{ left: '26.3%', width: '3px', height: '3px', animationDuration: '10.4s', animationDelay: '-5.1s' }} />
              <i className="e" style={{ left: '24.7%', width: '3px', height: '3px', animationDuration: '11.8s', animationDelay: '-4.8s' }} />
              <i className="e" style={{ left: '38.1%', width: '4px', height: '4px', animationDuration: '11.2s', animationDelay: '-4.4s' }} />
              <i className="e" style={{ left: '65.7%', width: '3px', height: '3px', animationDuration: '7.0s', animationDelay: '-10.1s' }} />
              <i className="e" style={{ left: '27.3%', width: '4px', height: '4px', animationDuration: '6.3s', animationDelay: '-11.7s' }} />
              <i className="e" style={{ left: '19.2%', width: '3px', height: '3px', animationDuration: '11.7s', animationDelay: '-11.8s' }} />
              <i className="e" style={{ left: '60.0%', width: '3px', height: '3px', animationDuration: '6.1s', animationDelay: '-0.7s' }} />
              <i className="e" style={{ left: '22.6%', width: '4px', height: '4px', animationDuration: '8.3s', animationDelay: '-7.3s' }} />
              <i className="e" style={{ left: '93.8%', width: '3px', height: '3px', animationDuration: '8.1s', animationDelay: '-1.7s' }} />
              <i className="e" style={{ left: '55.8%', width: '3px', height: '3px', animationDuration: '6.8s', animationDelay: '-1.0s' }} />
              <i className="e" style={{ left: '55.3%', width: '4px', height: '4px', animationDuration: '10.2s', animationDelay: '-0.8s' }} />
              <i className="e" style={{ left: '45.4%', width: '3px', height: '3px', animationDuration: '10.2s', animationDelay: '-9.2s' }} />
              <i className="e" style={{ left: '39.0%', width: '3px', height: '3px', animationDuration: '11.3s', animationDelay: '-2.0s' }} />
              <i className="e" style={{ left: '70.3%', width: '4px', height: '4px', animationDuration: '10.6s', animationDelay: '-10.6s' }} />
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
