'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Activity, Database, CheckCircle2, Download, X, Shield, Users, ArrowUpRight } from 'lucide-react';
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
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
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

      gain.gain.setValueAtTime(0.07, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 0.45);
      osc2.stop(now + 0.45);
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
        particleCount: 20,
        spread: 55,
        origin: { x, y },
        colors: ['#D21319', '#E5A93C', '#161A35', '#E9E6DA'],
        ticks: 80,
        gravity: 1.1,
        scalar: 0.75,
        disableForReducedMotion: true,
      });
    } catch {}

    setModalOpen(true);
  };

  return (
    <>
      {/* ============================================================== */}
      {/* REFINED LIGHT-EXECUTIVE GUARDIAN PILL FOR TOP MASTHEAD         */}
      {/* ============================================================== */}
      <motion.button
        type="button"
        onClick={handleClick}
        whileHover={{ scale: 1.02, y: -1 }}
        whileTap={{ scale: 0.98 }}
        className={`group relative flex items-center gap-2 px-2 sm:px-2.5 py-1 sm:py-1.5 bg-gradient-to-r from-amber-50/60 via-white to-amber-50/40 hover:from-amber-100/70 hover:to-white border border-amber-300/80 hover:border-amber-400 rounded-lg shadow-2xs hover:shadow-xs transition-all cursor-pointer select-none ${className}`}
        title="Ho-Oh Sovereign Sentinel · Live Telemetry (Click to Inspect)"
      >
        {/* Subtle Ambient Shimmer Sweep */}
        <div
          className="absolute inset-0 pointer-events-none rounded-lg opacity-30 mix-blend-overlay bg-[linear-gradient(110deg,transparent_20%,rgba(229,169,60,0.4)_50%,transparent_80%)] bg-[length:200%_100%] animate-[sweep_5s_ease-in-out_infinite]"
        />

        {/* 1. Miniature Animated Phoenix Emblem */}
        <div className="relative shrink-0 flex items-center justify-center w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-white border border-amber-200/90 shadow-2xs group-hover:border-amber-400 transition-colors">
          <span className="absolute inset-0 rounded-full bg-amber-400/10 blur-[4px] group-hover:bg-amber-400/25 transition-all animate-pulse" />
          <EngravedPhoenix
            animateIdle={true}
            size={24}
            className="w-5 h-5 sm:w-6 sm:h-6 drop-shadow-[0_1px_4px_rgba(210,19,25,0.3)] transition-transform duration-300 group-hover:scale-110"
          />
        </div>

        {/* 2. Sentinel Metadata & Live Sync Indicator */}
        <div className="flex flex-col text-left leading-tight py-0.2 min-w-0">
          <div className="flex items-center gap-1">
            <span className="text-[10px] sm:text-[11px] font-black tracking-wider text-slate-900 uppercase font-serif truncate">
              HO-OH GUARDIAN
            </span>
            <Sparkles size={9} className="text-amber-500 shrink-0 group-hover:rotate-45 transition-transform" />
          </div>

          <div className="flex items-center gap-1.5">
            {/* Live Pulsing Beacon Dot */}
            <span className="relative flex h-1.5 w-1.5 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
            </span>
            <span className="text-[8.5px] sm:text-[9px] font-mono font-bold text-emerald-700 tracking-wider whitespace-nowrap">
              LIVE SYNC
            </span>
          </div>
        </div>
      </motion.button>

      {/* ============================================================== */}
      {/* INTERACTIVE TELEMETRY & GUARDIAN BLESSING MODAL               */}
      {/* ============================================================== */}
      <AnimatePresence>
        {modalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs select-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 8 }}
              transition={{ duration: 0.18 }}
              className="relative w-full max-w-md bg-white border-2 border-slate-900 rounded-2xl shadow-[6px_6px_0px_#000] p-6 text-slate-900 overflow-hidden"
            >
              {/* Corner Watermark Pattern */}
              <div className="absolute -top-12 -right-12 opacity-5 pointer-events-none">
                <EngravedPhoenix size={220} animateIdle={false} />
              </div>

              {/* Close Button */}
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="absolute top-4 right-4 p-1.5 text-slate-500 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-lg transition-colors cursor-pointer"
              >
                <X size={16} />
              </button>

              {/* Modal Header with Animated Mascot */}
              <div className="flex items-center gap-3.5 mb-5 pb-4 border-b border-slate-200">
                <div className="relative p-2 bg-gradient-to-b from-amber-50 to-amber-100/60 border border-amber-300 rounded-xl shadow-xs">
                  <EngravedPhoenix size={44} animateIdle={true} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-base font-black font-serif text-slate-900 tracking-wide uppercase">
                      HO-OH GUARDIAN
                    </span>
                    <span className="px-1.5 py-0.5 text-[9px] font-mono font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 rounded">
                      ACTIVE
                    </span>
                  </div>
                  <p className="text-[11px] font-mono text-slate-500 mt-0.5">
                    Jarvis 3.0 Telemetry Sentinel &amp; Operational Beacon
                  </p>
                </div>
              </div>

              {/* Live Telemetry Health Cards */}
              <div className="grid grid-cols-2 gap-3 mb-5">
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                  <div className="flex items-center gap-1.5 text-slate-500 text-[10px] font-mono uppercase mb-1">
                    <Users size={12} className="text-blue-600" />
                    <span>Total Candidates</span>
                  </div>
                  <div className="text-2xl font-black text-slate-900 font-sans">
                    {totalCandidates}
                  </div>
                  <div className="text-[10px] text-emerald-700 font-bold mt-0.5 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    Database Synced
                  </div>
                </div>

                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                  <div className="flex items-center gap-1.5 text-slate-500 text-[10px] font-mono uppercase mb-1">
                    <Shield size={12} className="text-[#D21319]" />
                    <span>Registered Squads</span>
                  </div>
                  <div className="text-2xl font-black text-slate-900 font-sans">
                    {totalSquads}
                  </div>
                  <div className="text-[10px] text-emerald-700 font-bold mt-0.5 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    Active Rosters
                  </div>
                </div>
              </div>

              {/* System Protocol Status Log */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2 mb-5 font-mono text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 text-[11px] flex items-center gap-1.5">
                    <Database size={12} className="text-indigo-600" /> PostgreSQL Pooler
                  </span>
                  <span className="font-bold text-emerald-700 flex items-center gap-1 text-[11px]">
                    <CheckCircle2 size={12} /> port 6543 OK
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-500 text-[11px] flex items-center gap-1.5">
                    <Activity size={12} className="text-amber-600" /> Cry Harmonizer
                  </span>
                  <span className="font-bold text-slate-700 text-[11px]">
                    8-Bit Web Audio Ready
                  </span>
                </div>

                <div className="flex items-center justify-between pt-1 border-t border-slate-200 text-[10px] text-slate-400">
                  <span>Guardian Blessings Sent:</span>
                  <span className="font-bold text-slate-600">{burstCount}</span>
                </div>
              </div>

              {/* Quick Actions Footer */}
              <div className="flex items-center gap-2">
                {onOpenExport && (
                  <button
                    type="button"
                    onClick={() => {
                      setModalOpen(false);
                      onOpenExport();
                    }}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 bg-[#D21319] hover:bg-[#b00f14] text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
                  >
                    <Download size={13} />
                    <span>CSV Export Center</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={playPhoenixChime}
                  className="flex items-center justify-center gap-1.5 py-2.5 px-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                  title="Play 8-Bit Cry Chime"
                >
                  <Sparkles size={13} className="text-amber-500" />
                  <span>Chime</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
