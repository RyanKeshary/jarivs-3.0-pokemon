'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Sparkles, Calendar, ArrowRight, ShieldCheck, Zap, Flame, Trophy } from 'lucide-react';
import { Countdown } from '@/components/ui/Countdown';
import { playRetroBeep } from '@/lib/sound';

interface HeroProps {
  name: string;
  tagline: string;
  countdownTarget: string;
  registrationDeadline: string;
}

export function Hero({
  name,
  tagline,
  countdownTarget,
  registrationDeadline,
}: HeroProps) {
  const formattedRegDeadline = new Date(registrationDeadline).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <section className="relative overflow-hidden pt-8 pb-14 sm:pt-14 sm:pb-24 border-b-4 border-[#1E232A] bg-gradient-to-b from-[#FFF5F5] via-white to-[#F8F9FA] gpu-accelerate">
      {/* Decorative background grid and Pokéball accents */}
      <div className="absolute inset-0 opacity-5 bg-[radial-gradient(#EE1515_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none" />

      {/* Floating Animated Ambient Pokéball Orbs in Background */}
      <div className="absolute -top-12 -left-12 w-48 h-48 rounded-full border-8 border-[#EE1515]/10 animate-float pointer-events-none hidden md:block" />
      <div className="absolute top-1/3 -right-16 w-56 h-56 rounded-full border-8 border-[#3B4CCA]/10 animate-float-reverse pointer-events-none hidden md:block" />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
        {/* Region & Edition Badge */}
        <motion.div
          initial={{ y: -15, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.4 }}
          className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 rounded-full bg-[#FFCB05]/20 border-2 border-[#1E232A] shadow-[2px_2px_0px_#1E232A] text-[10px] sm:text-xs font-bold text-[#1E232A] mb-5 hover:scale-105 transition-transform cursor-default"
        >
          <Sparkles size={14} className="text-[#EE1515] animate-pulse" />
          <span>SLRTCE CAMPUS · 18 OCTOBER 2026</span>
          <span className="w-1.5 h-1.5 rounded-full bg-[#EE1515]" />
          <span className="text-[#3B4CCA]">ANNUAL CODING LEAGUE</span>
        </motion.div>

        {/* Main Event Title with Fluid Responsiveness */}
        <motion.h1
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="font-pixel text-xl sm:text-3xl md:text-4xl lg:text-5xl text-[#EE1515] tracking-tight leading-snug sm:leading-snug max-w-4xl mx-auto drop-shadow-[2px_2px_0px_#1E232A] break-words"
        >
          {name}
        </motion.h1>

        {/* Tagline */}
        <motion.p
          initial={{ y: 15, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="mt-3 sm:mt-4 text-sm sm:text-lg md:text-xl text-gray-700 max-w-2xl mx-auto font-medium px-2"
        >
          {tagline}
        </motion.p>

        {/* Live Countdown */}
        <div className="mt-5">
          <p className="font-pixel text-[10px] sm:text-xs text-gray-600 tracking-wider">
            BATTLE ARENA OPENS IN:
          </p>
          <Countdown targetDate={countdownTarget} />
        </div>

        {/* Registration Deadline Warning */}
        <div className="inline-flex flex-wrap items-center justify-center gap-1.5 sm:gap-2 px-3.5 py-1.5 bg-red-50 border-2 border-[#EE1515] rounded-xl text-[11px] sm:text-xs font-mono text-[#EE1515] font-bold mb-8 shadow-sm">
          <Calendar size={13} className="shrink-0" />
          <span suppressHydrationWarning>Registration Closes: {formattedRegDeadline} IST</span>
          <span className="text-gray-300 hidden sm:inline">|</span>
          <span className="text-gray-600 font-normal">Squads of 1 to 4</span>
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 sm:gap-4 max-w-md mx-auto sm:max-w-none">
          <Link
            href="/auth?mode=register"
            onClick={() => playRetroBeep(880, 'square', 0.08)}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-3.5 sm:py-4 bg-[#EE1515] hover:bg-[#D01010] text-white font-pixel text-xs sm:text-sm rounded-xl border-3 border-[#1E232A] shadow-[5px_5px_0px_#1E232A] cursor-pointer group pixel-btn animate-shimmer"
          >
            <span>REGISTER FOR THE EVENT</span>
            <ArrowRight size={17} className="group-hover:translate-x-1.5 transition-transform" />
          </Link>

          <Link
            href="/auth?mode=login"
            onClick={() => playRetroBeep(440, 'square', 0.05)}
            className="w-full sm:w-auto px-7 py-3.5 sm:py-4 bg-white hover:bg-gray-50 text-[#1E232A] font-pixel text-xs rounded-xl border-3 border-[#1E232A] shadow-[4px_4px_0px_#1E232A] text-center pixel-btn"
          >
            TRAINER LOGIN
          </Link>
        </div>

        {/* Quick Highlights Strip */}
        <div className="mt-10 sm:mt-14 grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 max-w-4xl mx-auto pt-7 border-t-2 border-dashed border-gray-300">
          <div className="bg-white p-3 sm:p-3.5 rounded-xl border-2 border-[#1E232A] shadow-[3px_3px_0px_#1E232A] hover-lift">
            <span className="font-pixel text-xs sm:text-base text-[#3B4CCA] block">₹90,000+</span>
            <span className="text-[10px] sm:text-[11px] text-gray-600 font-bold uppercase mt-0.5 block">Total Prize Pool</span>
          </div>
          <div className="bg-white p-3 sm:p-3.5 rounded-xl border-2 border-[#1E232A] shadow-[3px_3px_0px_#1E232A] hover-lift">
            <span className="font-pixel text-xs sm:text-base text-[#EE1515] block">24 HOURS</span>
            <span className="text-[10px] sm:text-[11px] text-gray-600 font-bold uppercase mt-0.5 block">Non-Stop Hacking</span>
          </div>
          <div className="bg-white p-3 sm:p-3.5 rounded-xl border-2 border-[#1E232A] shadow-[3px_3px_0px_#1E232A] hover-lift">
            <span className="font-pixel text-xs sm:text-base text-[#FFCB05] block">4 TRACKS</span>
            <span className="text-[10px] sm:text-[11px] text-gray-600 font-bold uppercase mt-0.5 block">AI, Web3, IoT & Open</span>
          </div>
          <div className="bg-white p-3 sm:p-3.5 rounded-xl border-2 border-[#1E232A] shadow-[3px_3px_0px_#1E232A] hover-lift">
            <span className="font-pixel text-xs sm:text-base text-emerald-600 block">@slrtce.in</span>
            <span className="text-[10px] sm:text-[11px] text-gray-600 font-bold uppercase mt-0.5 block">College Arena</span>
          </div>
        </div>
      </div>
    </section>
  );
}
