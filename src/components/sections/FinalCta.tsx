'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight, Download, FileText } from 'lucide-react';
import { playRetroBeep } from '@/lib/sound';

interface FinalCtaProps {
  brochureUrl: string;
  pptTemplateUrl: string;
}

export function FinalCta({ brochureUrl, pptTemplateUrl }: FinalCtaProps) {
  return (
    <section className="py-20 bg-gradient-to-r from-[#EE1515] to-[#B70E0E] text-white border-b-4 border-[#1E232A] relative overflow-hidden">
      {/* Decorative Pokéball Watermarks */}
      <div className="absolute -right-16 -bottom-16 w-80 h-80 rounded-full border-[24px] border-white/10 pointer-events-none" />
      <div className="absolute -left-16 -top-16 w-64 h-64 rounded-full border-[20px] border-white/10 pointer-events-none" />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
        <span className="font-pixel text-xs text-[#FFCB05] tracking-widest uppercase block mb-3">
          CHALLENGER STAGE UNLOCKED
        </span>
        <h2 className="font-pixel text-2xl sm:text-4xl text-white tracking-tight leading-tight drop-shadow-[2px_2px_0px_#1E232A]">
          READY TO ENTER THE KENTO LEAGUE ARENA?
        </h2>
        <p className="mt-4 text-base sm:text-lg text-white/90 max-w-2xl mx-auto font-medium">
          Grab your teammates, fire up your code editors, and battle your way to the top of the hackathon leaderboard.
        </p>

        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/auth?mode=register"
            onClick={() => playRetroBeep(880, 'square', 0.1)}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-4 bg-[#FFCB05] hover:bg-[#E5B500] text-[#1E232A] font-pixel text-sm rounded-xl border-3 border-[#1E232A] shadow-[4px_4px_0px_#1E232A] active:translate-x-0.5 active:translate-y-0.5 transition-all cursor-pointer font-bold group"
          >
            <span>REGISTER NOW</span>
            <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
          </Link>

          <a
            href={brochureUrl || '/assets/placeholders/brochure.pdf'}
            download
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-4 bg-white hover:bg-gray-100 text-[#1E232A] font-pixel text-xs rounded-xl border-3 border-[#1E232A] shadow-[4px_4px_0px_#1E232A] transition-all"
          >
            <Download size={16} />
            <span>EVENT BROCHURE</span>
          </a>

          <a
            href={pptTemplateUrl || '/assets/placeholders/template.pptx'}
            download
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-4 bg-[#1E232A] hover:bg-black text-white font-pixel text-xs rounded-xl border-3 border-white shadow-[4px_4px_0px_#FFCB05] transition-all"
          >
            <FileText size={16} />
            <span>PPT TEMPLATE</span>
          </a>
        </div>
      </div>
    </section>
  );
}
