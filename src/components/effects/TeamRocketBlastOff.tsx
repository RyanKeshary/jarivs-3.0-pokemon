'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, useScroll, useTransform, useSpring, AnimatePresence } from 'framer-motion';

// Audio manager for smooth start & end with Web Audio API waveform integration
class TeamRocketAudioManager {
  private ctx: AudioContext | null = null;
  private audioBuffer: AudioBuffer | null = null;
  private currentSource: AudioBufferSourceNode | null = null;
  private currentGain: GainNode | null = null;
  private analyser: AnalyserNode | null = null;
  private isFetching = false;
  private fallbackAudio: HTMLAudioElement | null = null;

  private async getContext(): Promise<AudioContext | null> {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      await this.ctx.resume();
    }
    return this.ctx;
  }

  public async preload() {
    if (this.audioBuffer || this.isFetching) return;
    try {
      this.isFetching = true;
      const res = await fetch('/assets/team-rocket-blastoff.mp3');
      const arrayBuf = await res.arrayBuffer();
      const ctx = await this.getContext();
      if (ctx) {
        this.audioBuffer = await ctx.decodeAudioData(arrayBuf);
      }
    } catch {
      // Preload silent fallback
    } finally {
      this.isFetching = false;
    }
  }

  public async play(onWaveform?: (amplitude: number) => void): Promise<number> {
    const ctx = await this.getContext();

    // If Web Audio API is available and buffer decoded
    if (ctx) {
      if (!this.audioBuffer) {
        await this.preload();
      }

      if (this.audioBuffer) {
        // Stop any currently playing audio with a clean 40ms ramp down
        if (this.currentSource && this.currentGain) {
          try {
            const now = ctx.currentTime;
            this.currentGain.gain.cancelScheduledValues(now);
            this.currentGain.gain.setValueAtTime(this.currentGain.gain.value, now);
            this.currentGain.gain.linearRampToValueAtTime(0.0001, now + 0.04);
            setTimeout(() => {
              try {
                this.currentSource?.stop();
                this.currentSource?.disconnect();
              } catch {}
            }, 50);
          } catch {}
        }

        const source = ctx.createBufferSource();
        source.buffer = this.audioBuffer;

        const gain = ctx.createGain();
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 256;
        analyser.smoothingTimeConstant = 0.8;

        const now = ctx.currentTime;
        const duration = this.audioBuffer.duration;

        // Smooth start: exponential ramp up over 60ms to prevent pops
        gain.gain.setValueAtTime(0.001, now);
        gain.gain.exponentialRampToValueAtTime(0.95, now + 0.06);

        // Smooth end: gentle exponential fade-out over last 160ms matching wavelength decay
        const fadeOutStart = Math.max(now + 0.08, now + duration - 0.16);
        gain.gain.setValueAtTime(0.95, fadeOutStart);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

        source.connect(gain);
        gain.connect(analyser);
        analyser.connect(ctx.destination);

        this.currentSource = source;
        this.currentGain = gain;
        this.analyser = analyser;

        source.start(now);

        // Real-time waveform analyzer feedback loop
        if (onWaveform) {
          const bufferLength = analyser.frequencyBinCount;
          const dataArray = new Uint8Array(bufferLength);
          let animationId = 0;
          const startTime = Date.now();

          const checkWavelength = () => {
            if (Date.now() - startTime > duration * 1000) {
              onWaveform(0);
              return;
            }
            analyser.getByteTimeDomainData(dataArray);
            let sum = 0;
            for (let i = 0; i < bufferLength; i++) {
              const val = (dataArray[i] - 128) / 128;
              sum += val * val;
            }
            const rms = Math.sqrt(sum / bufferLength);
            onWaveform(Math.min(rms * 2.5, 1));
            animationId = requestAnimationFrame(checkWavelength);
          };

          animationId = requestAnimationFrame(checkWavelength);
          source.onended = () => {
            cancelAnimationFrame(animationId);
            onWaveform(0);
          };
        }

        return duration;
      }
    }

    // Fallback using standard HTMLAudioElement
    try {
      if (!this.fallbackAudio) {
        this.fallbackAudio = new Audio('/assets/team-rocket-blastoff.mp3');
      }
      this.fallbackAudio.currentTime = 0;
      this.fallbackAudio.volume = 0.9;
      await this.fallbackAudio.play();
      return this.fallbackAudio.duration || 6;
    } catch {
      return 5;
    }
  }
}

const audioManager = new TeamRocketAudioManager();

export function TeamRocketBlastOff() {
  const [showQuote, setShowQuote] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [waveVibration, setWaveVibration] = useState(0);

  // Easter egg counter: random target between 10 and 67
  const [clickCount, setClickCount] = useState(0);
  const targetClicksRef = useRef(Math.floor(Math.random() * (67 - 10 + 1)) + 10);
  const [showMemeModal, setShowMemeModal] = useState(false);

  useEffect(() => {
    setMounted(true);
    audioManager.preload();
  }, []);

  const { scrollYProgress } = useScroll();

  // Physics-smoothed scroll progress for buttery 60/120fps motion
  const smoothProgress = useSpring(scrollYProgress, {
    damping: 28,
    stiffness: 85,
    mass: 0.5,
  });

  // LINEAR TRAJECTORY INCLINED UPWARDS FROM LEFT TO RIGHT:
  // Starts completely off-screen lower-left (-40vw, 92vh) and linearly ascends towards upper-right (106vw, -10vh)
  const x = useTransform(smoothProgress, [0, 1], ['-40vw', '106vw']);
  const y = useTransform(smoothProgress, [0, 1], ['92vh', '-10vh']);

  // Completely hidden at the start (opacity = 0 while scroll <= 0.05), smoothly emerges as user scrolls down
  const opacity = useTransform(smoothProgress, [0, 0.06, 0.94, 1], [0, 1, 1, 0]);

  // Distant perspective shrinkage as they blast off into the stratosphere
  const scale = useTransform(smoothProgress, [0, 0.65, 1], [1.05, 0.78, 0.32]);

  // Dynamic aerial wobble along the ascent vector
  const rotate = useTransform(smoothProgress, [0, 0.5, 1], [-6, 3, 14]);

  // Star twinkle opacity near the culmination of the blast-off
  const twinkleOpacity = useTransform(smoothProgress, [0.84, 0.94, 1], [0, 1, 0.8]);
  const twinkleScale = useTransform(smoothProgress, [0.84, 0.94, 1], [0.3, 1.3, 1]);

  if (!mounted) return null;

  const handleClick = async () => {
    // 1. Play the requested audio with smooth fade-in and smooth fade-out
    audioManager.play((amp) => {
      setWaveVibration(amp);
    });

    setShowQuote(true);
    setTimeout(() => setShowQuote(false), 3800);

    // 2. Track clicks for the 10-67 random easter egg
    const nextClicks = clickCount + 1;
    setClickCount(nextClicks);

    if (nextClicks >= targetClicksRef.current) {
      // Trigger funny meme presentation!
      setShowMemeModal(true);
      // Reset counter and set new random target between 10 and 67
      setClickCount(0);
      targetClicksRef.current = Math.floor(Math.random() * (67 - 10 + 1)) + 10;
    }
  };

  return (
    <>
      <div
        aria-hidden="true"
        className="fixed inset-0 pointer-events-none z-25 overflow-hidden select-none"
      >
        {/* Scroll-Driven Team Rocket Flying Capsule */}
        <motion.div
          style={{
            x,
            y,
            scale,
            rotate,
            opacity,
          }}
          className="absolute top-0 left-0 will-change-transform"
        >
          <div
            className="relative group pointer-events-auto cursor-pointer"
            onClick={handleClick}
            style={{
              transform: waveVibration > 0 ? `scale(${1 + waveVibration * 0.12}) rotate(${(waveVibration - 0.5) * 8}deg)` : undefined,
              transition: 'transform 0.05s ease-out',
            }}
          >
            {/* Comic Dialogue Balloon */}
            <AnimatePresence>
              {showQuote && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.8 }}
                  animate={{ opacity: 1, y: -16, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.85 }}
                  className="absolute -top-14 left-1/2 -translate-x-1/2 bg-white text-black font-mono font-bold text-[10px] sm:text-xs py-1.5 px-3 rounded-xl shadow-2xl border-2 border-[#D21319] whitespace-nowrap z-30"
                >
                  <span className="flex items-center gap-1.5">
                    <span>🚀</span>
                    <span>TEAM ROCKET FIRSE FAIL HO GAYI!</span>
                  </span>
                  {/* Speech balloon tail */}
                  <div className="absolute left-1/2 -bottom-2 -translate-x-1/2 w-0 h-0 border-x-4 border-x-transparent border-t-8 border-t-[#D21319]" />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Audio Wavelength Pulsing Ring Effect */}
            {waveVibration > 0.05 && (
              <div
                className="absolute inset-0 rounded-full pointer-events-none animate-ping opacity-40 border-2 border-[#D21319]"
                style={{
                  transform: `scale(${1 + waveVibration * 0.4})`,
                }}
              />
            )}

            {/* Jessie, James & Meowth Sprite */}
            <img
              src="/assets/team-rocket-blastoff.png"
              alt="Team Rocket Blasting Off"
              loading="lazy"
              decoding="async"
              className="w-36 sm:w-48 md:w-56 h-auto object-contain filter drop-shadow-[0_12px_24px_rgba(0,0,0,0.55)] group-hover:scale-105 transition-transform duration-200"
              draggable={false}
            />

            {/* Iconic Anime Twinkle Star (Apex of Flight) */}
            <motion.div
              style={{
                opacity: twinkleOpacity,
                scale: twinkleScale,
              }}
              className="absolute -top-4 -right-4 pointer-events-none"
            >
              <svg
                className="w-8 h-8 text-amber-300 animate-spin"
                style={{ animationDuration: '4s' }}
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M12 0L14.5 9.5L24 12L14.5 14.5L12 24L9.5 14.5L0 12L9.5 9.5L12 0Z" />
              </svg>
            </motion.div>
          </div>
        </motion.div>
      </div>

      {/* ============================================================== */}
      {/* FUNNY EASTER EGG MEME MODAL (TRIGGERS AFTER RANDOM 10-67 CLICKS) */}
      {/* ============================================================== */}
      <AnimatePresence>
        {showMemeModal && (
          <div
            className="fixed inset-0 z-[120] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 select-none"
            onClick={() => setShowMemeModal(false)}
          >
            <motion.div
              initial={{ scale: 0, rotate: -25, opacity: 0 }}
              animate={{
                scale: [0, 1.25, 0.95, 1.05, 1],
                rotate: [-25, 14, -8, 4, 0],
                opacity: 1,
              }}
              exit={{ scale: 0.1, rotate: 20, opacity: 0 }}
              transition={{
                type: 'spring',
                stiffness: 260,
                damping: 14,
              }}
              onClick={(e) => e.stopPropagation()}
              className="relative max-w-sm w-full bg-[#FAF9F5] border-4 border-black shadow-[10px_10px_0px_#D21319] p-5 text-center flex flex-col items-center"
            >
              {/* Close Button */}
              <button
                onClick={() => setShowMemeModal(false)}
                className="absolute top-2.5 right-2.5 w-7 h-7 bg-black text-white hover:bg-[#D21319] border border-black shadow-[2px_2px_0px_#000] flex items-center justify-center font-mono font-bold text-xs transition-colors cursor-pointer"
                aria-label="Close"
              >
                ✕
              </button>

              {/* Comic Alert Header */}
              <div className="inline-block bg-[#D21319] text-white px-2.5 py-0.5 border-2 border-black font-mono text-[10px] font-black uppercase tracking-wider shadow-[2px_2px_0px_#000] mb-3 animate-bounce">
                ⚡ A WILD SECRET MEME APPEARED!
              </div>

              {/* The Funny Meme Image */}
              <div className="relative w-56 h-56 sm:w-64 sm:h-64 my-1 border-3 border-black bg-white shadow-[4px_4px_0px_#000] overflow-hidden flex items-center justify-center">
                <img
                  src="/assets/secret-meme.png"
                  alt="Secret Meme"
                  className="w-full h-full object-contain hover:scale-105 transition-transform duration-200"
                />
              </div>

              {/* Funny Caption */}
              <div className="mt-3.5 space-y-1">
                <div className="font-sans font-black text-sm uppercase tracking-tight text-black">
                  Pikachu after dealing with Team Rocket...
                </div>
                <div className="font-mono text-[11px] text-neutral-600 font-bold">
                  (You unlocked the secret blast-off easter egg! ⚡)
                </div>
              </div>

              <button
                onClick={() => setShowMemeModal(false)}
                className="mt-4 px-4 py-1.5 bg-black hover:bg-[#D21319] text-white font-mono font-bold text-xs uppercase tracking-wider border-2 border-black shadow-[2px_2px_0px_#000] active:translate-x-[1px] active:translate-y-[1px] cursor-pointer transition-colors"
              >
                DISMISS MEME
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
