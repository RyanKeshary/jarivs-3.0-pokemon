'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Sparkles, Calendar, MapPin, ArrowRight, ShieldCheck } from 'lucide-react';
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
    <section className="relative overflow-hidden pt-8 pb-16 sm:pt-14 sm:pb-24 border-b-4 border-[#1E232A] bg-gradient-to-b from-[#FFF5F5] to-white">
      {/* Decorative background grid and Pokéball accents */}
      <div className="absolute inset-0 opacity-5 bg-[radial-gradient(#EE1515_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none" />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
        {/* Region & Edition Badge */}
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#FFCB05]/20 border-2 border-[#1E232A] shadow-[2px_2px_0px_#1E232A] text-xs font-bold text-[#1E232A] mb-6"
        >
          <Sparkles size={14} className="text-[#EE1515]" />
          <span>SLRTCE CAMPUS · 18 OCTOBER 2026</span>
          <span className="w-1.5 h-1.5 rounded-full bg-[#EE1515]" />
          <span className="text-[#3B4CCA]">ANNUAL CODING LEAGUE</span>
        </motion.div>

        {/* Main Event Title */}
        <motion.h1
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.6 }}
          className="font-pixel text-2xl sm:text-4xl md:text-5xl text-[#EE1515] tracking-tight leading-tight sm:leading-snug max-w-4xl mx-auto drop-shadow-[2px_2px_0px_#1E232A]"
        >
          {name}
        </motion.h1>

        {/* Tagline */}
        <motion.p
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mt-4 text-base sm:text-xl text-gray-700 max-w-2xl mx-auto font-medium"
        >
          {tagline}
        </motion.p>

        {/* Live Countdown */}
        <div className="mt-4">
          <p className="font-pixel text-[11px] sm:text-xs text-gray-600 tracking-wider">
            BATTLE ARENA OPENS IN:
          </p>
          <Countdown targetDate={countdownTarget} />
        </div>

        {/* Registration Deadline Warning */}
        <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-red-50 border-2 border-[#EE1515] rounded-lg text-xs font-mono text-[#EE1515] font-bold mb-8 shadow-sm">
          <Calendar size={14} />
          <span suppressHydrationWarning>Registration Closes: {formattedRegDeadline} IST</span>
          <span className="text-gray-400">|</span>
          <span className="text-gray-600 font-normal">Teams of 1 to 4</span>
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/auth?mode=register"
            onClick={() => playRetroBeep(880, 'square', 0.08)}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-4 bg-[#EE1515] hover:bg-[#D01010] active:scale-95 text-white font-pixel text-sm rounded-xl border-3 border-[#1E232A] shadow-[5px_5px_0px_#1E232A] transition-all cursor-pointer group"
          >
            <span>REGISTER FOR THE EVENT</span>
            <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
          </Link>

          <Link
            href="/auth?mode=login"
            onClick={() => playRetroBeep(440, 'square', 0.05)}
            className="w-full sm:w-auto px-6 py-4 bg-white hover:bg-gray-50 active:scale-95 text-[#1E232A] font-pixel text-xs rounded-xl border-3 border-[#1E232A] shadow-[4px_4px_0px_#1E232A] transition-all text-center"
          >
            TRAINER LOGIN
          </Link>
        </div>

        {/* Quick Highlights Strip */}
        <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto pt-8 border-t-2 border-dashed border-gray-300">
          <div className="bg-white p-3 rounded-lg border-2 border-[#1E232A] shadow-[2px_2px_0px_#1E232A]">
            <span className="font-pixel text-sm sm:text-base text-[#3B4CCA] block">₹90,000+</span>
            <span className="text-[11px] text-gray-600 font-bold uppercase">Total Prize Pool</span>
          </div>
          <div className="bg-white p-3 rounded-lg border-2 border-[#1E232A] shadow-[2px_2px_0px_#1E232A]">
            <span className="font-pixel text-sm sm:text-base text-[#EE1515] block">24 HOURS</span>
            <span className="text-[11px] text-gray-600 font-bold uppercase">Non-Stop Hacking</span>
          </div>
          <div className="bg-white p-3 rounded-lg border-2 border-[#1E232A] shadow-[2px_2px_0px_#1E232A]">
            <span className="font-pixel text-sm sm:text-base text-[#FFCB05] block">4 TRACKS</span>
            <span className="text-[11px] text-gray-600 font-bold uppercase">AI, Web3, IoT & Open</span>
          </div>
          <div className="bg-white p-3 rounded-lg border-2 border-[#1E232A] shadow-[2px_2px_0px_#1E232A]">
            <span className="font-pixel text-sm sm:text-base text-emerald-600 block">@slrtce.in</span>
            <span className="text-[11px] text-gray-600 font-bold uppercase">Exclusive Domain</span>
          </div>
        </div>
      </div>
    </section>
  );
}
