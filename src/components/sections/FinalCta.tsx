'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight, Download, FileText, Sparkles } from 'lucide-react';
import { playRetroBeep } from '@/lib/sound';

interface FinalCtaProps {
  brochureUrl: string;
  pptTemplateUrl: string;
}

export function FinalCta({ brochureUrl, pptTemplateUrl }: FinalCtaProps) {
  return (
    <section className="py-20 sm:py-28 bg-transparent text-white relative">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="bg-[#EE1515]/95 backdrop-blur-xl border-4 border-[#1E232A] rounded-3xl p-8 sm:p-12 text-center shadow-[10px_10px_0px_#1E232A] relative overflow-hidden">
          {/* Decorative Pokéball Watermarks */}
          <div className="absolute -right-16 -bottom-16 w-72 h-72 rounded-full border-[20px] border-white/10 pointer-events-none" />
          <div className="absolute -left-16 -top-16 w-56 h-56 rounded-full border-[16px] border-white/10 pointer-events-none" />

          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-black/30 border border-white/30 text-[#FFCB05] font-pixel text-xs mb-4">
            <Sparkles size={14} className="text-[#FFCB05]" />
            <span>CHALLENGER STAGE UNLOCKED</span>
          </div>

          <h2 className="font-pixel text-2xl sm:text-4xl lg:text-5xl text-white tracking-tight leading-tight drop-shadow-[0_4px_12px_rgba(0,0,0,0.5)]">
            READY TO ENTER THE KENTO LEAGUE?
          </h2>

          <p className="mt-4 text-base sm:text-lg text-white/95 max-w-2xl mx-auto font-medium leading-relaxed">
            Assemble your team of trainers, fire up your code editors, and battle your way across the 6 arena tracks at SLRTCE!
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/auth?mode=register"
              onClick={() => playRetroBeep(880, 'square', 0.1)}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-4 bg-[#FFCB05] hover:bg-[#E5B500] text-[#1E232A] font-pixel text-sm rounded-2xl border-3 border-[#1E232A] shadow-[4px_4px_0px_#1E232A] active:translate-x-0.5 active:translate-y-0.5 transition-all cursor-pointer font-bold group"
            >
              <span>REGISTER SQUAD</span>
              <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </Link>

            <a
              href={brochureUrl || '/assets/placeholders/brochure.pdf'}
              download
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-4 bg-white hover:bg-gray-100 text-[#1E232A] font-pixel text-xs rounded-2xl border-3 border-[#1E232A] shadow-[4px_4px_0px_#1E232A] transition-all"
            >
              <Download size={16} />
              <span>EVENT BROCHURE</span>
            </a>

            <a
              href={pptTemplateUrl || '/assets/placeholders/template.pptx'}
              download
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-4 bg-[#1E232A] hover:bg-black text-white font-pixel text-xs rounded-2xl border-3 border-white shadow-[4px_4px_0px_#FFCB05] transition-all"
            >
              <FileText size={16} />
              <span>PPT TEMPLATE</span>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
