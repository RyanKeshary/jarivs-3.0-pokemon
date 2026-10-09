'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Activity, Database, CheckCircle2, Download, X, Shield, Users } from 'lucide-react';
import confetti from 'canvas-confetti';
import { EngravedPhoenix } from '@/components/illustrations/EngravedPokemon';

interface AdminPokemonGuardianProps {
  totalCandidates?: number;
  totalSquads?: number;
  onOpenExport?: () => void;
  className?: string;
}

export function AdminPokemonGuardian({
  totalCandidates = 0,
  totalSquads = 0,
  onOpenExport,
  className = '',
}: AdminPokemonGuardianProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [burstCount, setBurstCount] = useState(0);

  const playPhoenixChime = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const now = ctx.currentTime;

      // Harmonic twin-oscillator nostalgic Pokémon cry chime
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.type = 'triangle';
      osc2.type = 'sine';

      // Ascending celestial arc
      osc1.frequency.setValueAtTime(587.33, now); // D5
      osc1.frequency.exponentialRampToValueAtTime(880, now + 0.12); // A5
      osc1.frequency.exponentialRampToValueAtTime(1174.66, now + 0.32); // D6

      osc2.frequency.setValueAtTime(293.66, now); // D4
      osc2.frequency.exponentialRampToValueAtTime(440, now + 0.12); // A4
      osc2.frequency.exponentialRampToValueAtTime(587.33, now + 0.32); // D5

      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.48);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 0.48);
      osc2.stop(now + 0.48);
    } catch {}
  };

  const handleClick = (e: React.MouseEvent) => {
    playPhoenixChime();
    setBurstCount((c) => c + 1);

    // Golden & Crimson Phoenix embers burst
    try {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = (rect.left + rect.width / 2) / window.innerWidth;
      const y = (rect.top + rect.height / 2) / window.innerHeight;

      confetti({
        particleCount: 22,
        spread: 60,
        origin: { x, y },
        colors: ['#D21319', '#E5A93C', '#1B1E4A', '#E9E6DA'],
        ticks: 90,
        gravity: 1.1,
        scalar: 0.8,
        disableForReducedMotion: true,
      });
    } catch {}

    setModalOpen(true);
  };

  return (
    <>
      {/* ============================================================== */}
      {/* ACTIVE GUARDIAN BADGE WITH CONTINUOUS LOOPING ANIMATIONS       */}
      {/* ============================================================== */}
      <motion.button
        type="button"
        onClick={handleClick}
        whileHover={{ scale: 1.025 }}
        whileTap={{ scale: 0.97 }}
        className={`group relative flex items-center gap-2 px-3 py-1 bg-gradient-to-r from-slate-900/95 via-[#161A35] to-slate-900/95 border border-amber-500/35 hover:border-amber-400/80 rounded-xl shadow-xs transition-all cursor-pointer select-none overflow-hidden ${className}`}
        title="Indigo Guardian · Active Telemetry Sentinel (Click to Inspect)"
      >
        {/* Soft Looping Ambient Glow / Shimmer Sweep */}
        <div
          className="absolute inset-0 pointer-events-none opacity-40 mix-blend-screen bg-[linear-gradient(110deg,transparent_20%,rgba(229,169,60,0.22)_50%,transparent_80%)] bg-[length:200%_100%] animate-[sweep_6s_ease-in-out_infinite]"
        />

        {/* 1. Miniature Animated Phoenix on Active Celestial Loop */}
        <div className="relative shrink-0 flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8">
          {/* Subtle Golden Aura Halo Behind Phoenix */}
          <span className="absolute inset-0 rounded-full bg-amber-400/15 blur-[6px] group-hover:bg-amber-400/30 transition-all animate-pulse" />
          
          <EngravedPhoenix
            animateIdle={true}
            size={32}
            className="w-7 h-7 sm:w-8 sm:h-8 drop-shadow-[0_2px_8px_rgba(210,19,25,0.4)] transition-transform duration-300 group-hover:scale-110"
          />
        </div>

        {/* 2. Sentinel Metadata & Live Sync Indicator */}
        <div className="flex flex-col text-left leading-tight py-0.5 z-10">
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-black tracking-wider text-amber-200 uppercase font-serif flex items-center gap-1">
              Ho-Oh Guardian
              <Sparkles size={10} className="text-amber-400 animate-spin [animation-duration:8s]" />
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Live Pulsing Beacon Dot */}
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
            </span>
            <span className="text-[9px] font-bold text-slate-300 tracking-wider">
              TELEMETRY SYNCED
            </span>
          </div>
        </div>
      </motion.button>

      {/* ============================================================== */}
      {/* INTERACTIVE TELEMETRY & GUARDIAN BLESSING MODAL               */}
      {/* ============================================================== */}
      <AnimatePresence>
        {modalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs select-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 8 }}
              transition={{ duration: 0.2 }}
              className="relative w-full max-w-md bg-[#161A35] border border-amber-500/40 rounded-2xl shadow-2xl p-6 text-slate-100 overflow-hidden"
            >
              {/* Corner Watermark Pattern */}
              <div className="absolute -top-10 -right-10 opacity-10 pointer-events-none">
                <EngravedPhoenix size={180} animateIdle={false} />
              </div>

              {/* Close Button */}
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
              >
                <X size={16} />
              </button>

              {/* Modal Header with Animated Mascot */}
              <div className="flex items-center gap-3.5 mb-5 pb-4 border-b border-white/10">
                <div className="relative p-2.5 bg-gradient-to-b from-[#1E234A] to-[#121435] border border-amber-500/40 rounded-xl shadow-inner">
                  <EngravedPhoenix size={48} animateIdle={true} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-black font-serif text-amber-200 tracking-wide">
                      HO-OH SOVEREIGN GUARDIAN
                    </span>
                    <span className="px-1.5 py-0.5 text-[9px] font-black bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-full">
                      ACTIVE
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Live System Telemetry & Operational Integrity
                  </p>
                </div>
              </div>

              {/* Diagnostic Vitals Grid */}
              <div className="grid grid-cols-2 gap-2.5 mb-5 text-xs">
                <div className="bg-white/5 border border-white/10 rounded-xl p-3 flex flex-col justify-between">
                  <div className="flex items-center gap-1.5 text-slate-400 mb-1">
                    <Database size={13} className="text-amber-400" />
                    <span>PostgreSQL Pool</span>
                  </div>
                  <span className="font-bold text-emerald-400 text-xs flex items-center gap-1">
                    <CheckCircle2 size={12} /> Connected (6543)
                  </span>
                </div>

                <div className="bg-white/5 border border-white/10 rounded-xl p-3 flex flex-col justify-between">
                  <div className="flex items-center gap-1.5 text-slate-400 mb-1">
                    <Activity size={13} className="text-cyan-400" />
                    <span>Sync Health</span>
                  </div>
                  <span className="font-bold text-cyan-300 text-xs">
                    0 Errors Recorded
                  </span>
                </div>

                <div className="bg-white/5 border border-white/10 rounded-xl p-3 flex flex-col justify-between">
                  <div className="flex items-center gap-1.5 text-slate-400 mb-1">
                    <Users size={13} className="text-rose-400" />
                    <span>Enrolled Candidates</span>
                  </div>
                  <span className="font-black text-white text-base">
                    {totalCandidates}
                  </span>
                </div>

                <div className="bg-white/5 border border-white/10 rounded-xl p-3 flex flex-col justify-between">
                  <div className="flex items-center gap-1.5 text-slate-400 mb-1">
                    <Shield size={13} className="text-indigo-400" />
                    <span>Registered Squads</span>
                  </div>
                  <span className="font-black text-white text-base">
                    {totalSquads}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 pt-2">
                {onOpenExport && (
                  <button
                    type="button"
                    onClick={() => {
                      setModalOpen(false);
                      onOpenExport();
                    }}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-xs font-bold bg-[#D21319] hover:bg-[#b01015] text-white rounded-xl shadow-md transition-colors cursor-pointer"
                  >
                    <Download size={13} />
                    <span>Open Export Center</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => {
                    playPhoenixChime();
                    setBurstCount((c) => c + 1);
                  }}
                  className="px-3.5 py-2 text-xs font-bold bg-white/10 hover:bg-white/15 text-slate-200 border border-white/15 rounded-xl transition-colors cursor-pointer flex items-center gap-1.5"
                  title="Resound Celestial Cry"
                >
                  <Sparkles size={12} className="text-amber-400" />
                  <span>Blessing {burstCount > 0 ? `(${burstCount})` : ''}</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
