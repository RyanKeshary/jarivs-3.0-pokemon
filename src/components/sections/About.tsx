'use client';

import React from 'react';
import { Trophy, Award, Medal, MapPin, CheckCircle, ShieldAlert, Cpu, Database, Radio, Compass } from 'lucide-react';
import type { LandingContent } from '@/lib/database.types';

interface AboutProps {
  content: LandingContent;
}

const TRACK_ICONS: Record<number, React.ReactNode> = {
  0: <Cpu className="text-[#EE1515]" size={28} />,
  1: <Database className="text-[#3B4CCA]" size={28} />,
  2: <Radio className="text-[#FFCB05]" size={28} />,
  3: <Compass className="text-emerald-500" size={28} />,
};

export function About({ content }: AboutProps) {
  const { venue, prizes, tracks, rules, eligibility } = content;

  return (
    <section id="about" className="py-16 sm:py-24 bg-[#F8F9FA] border-b-4 border-[#1E232A]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-block px-3 py-1 bg-[#EE1515] text-white font-pixel text-[10px] rounded mb-3 shadow-[2px_2px_0px_#1E232A]">
            GYM BRIEFING
          </div>
          <h2 className="font-pixel text-xl sm:text-3xl text-[#1E232A] tracking-tight">
            ABOUT KENTO LEAGUE 3.0
          </h2>
          <p className="mt-3 text-gray-600 font-medium">
            Everything you need to know before stepping into the arena at Shree L. R. Tiwari College of Engineering.
          </p>
        </div>

        {/* Venue Banner */}
        <div className="bg-white border-3 border-[#1E232A] rounded-2xl p-6 sm:p-8 shadow-[6px_6px_0px_#1E232A] mb-16 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-[#EE1515]/10 border-2 border-[#EE1515] flex items-center justify-center shrink-0">
              <MapPin size={32} className="text-[#EE1515]" />
            </div>
            <div>
              <span className="font-pixel text-[11px] text-[#EE1515] block uppercase">ARENA VENUE</span>
              <h3 className="text-lg sm:text-xl font-bold text-[#1E232A] mt-1">{venue}</h3>
              <p className="text-sm text-gray-500 mt-0.5">High-speed Wi-Fi, mentorship bays, Poké-snacks, & rest rooms provided.</p>
            </div>
          </div>

          <div className="px-5 py-3 bg-amber-50 border-2 border-[#FFCB05] rounded-xl text-center shrink-0">
            <span className="font-pixel text-[10px] text-amber-800 uppercase block">ELIGIBILITY REQUIREMENT</span>
            <span className="text-xs font-bold text-[#1E232A] mt-1 block">{eligibility}</span>
          </div>
        </div>

        {/* Prizes Section */}
        <div id="prizes" className="mb-20">
          <div className="text-center mb-10">
            <h3 className="font-pixel text-lg sm:text-2xl text-[#EE1515]">
              CHAMPIONSHIP PRIZES & BOUNTIES
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              Top squads claim cash prizes, official league trophies, and bragging rights across the region.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {prizes.map((prize, idx) => {
              const styles = [
                {
                  bg: 'bg-gradient-to-b from-amber-100 to-white',
                  border: 'border-[#FFCB05]',
                  shadow: 'shadow-[5px_5px_0px_#C7A008] hover:shadow-[7px_7px_0px_#C7A008]',
                  icon: <Trophy size={36} className="text-amber-500 animate-bounce" />,
                  tag: 'CHAMPION',
                },
                {
                  bg: 'bg-gradient-to-b from-slate-100 to-white',
                  border: 'border-slate-400',
                  shadow: 'shadow-[5px_5px_0px_#475569] hover:shadow-[7px_7px_0px_#475569]',
                  icon: <Award size={36} className="text-slate-500" />,
                  tag: 'ELITE FOUR',
                },
                {
                  bg: 'bg-gradient-to-b from-amber-50 to-white',
                  border: 'border-amber-700',
                  shadow: 'shadow-[5px_5px_0px_#78350F] hover:shadow-[7px_7px_0px_#78350F]',
                  icon: <Medal size={36} className="text-amber-700" />,
                  tag: 'GYM LEADER',
                },
              ][idx] || {
                bg: 'bg-white',
                border: 'border-[#1E232A]',
                shadow: 'shadow-[4px_4px_0px_#1E232A] hover:shadow-[6px_6px_0px_#1E232A]',
                icon: <Trophy size={32} />,
                tag: 'FINALIST',
              };

              return (
                <div
                  key={prize.place}
                  className={`${styles.bg} border-3 ${styles.border} ${styles.shadow} rounded-2xl p-6 text-center hover-lift flex flex-col justify-between cursor-default`}
                >
                  <div>
                    <div className="w-16 h-16 mx-auto rounded-full bg-white border-2 border-[#1E232A] flex items-center justify-center shadow-md mb-4 group-hover:rotate-6 transition-transform">
                      {styles.icon}
                    </div>
                    <span className="font-pixel text-[10px] text-gray-500 block uppercase">
                      {styles.tag}
                    </span>
                    <h4 className="font-pixel text-sm sm:text-base text-[#1E232A] mt-1">
                      {prize.place}
                    </h4>
                  </div>
                  <div className="mt-6 pt-4 border-t-2 border-gray-200">
                    <span className="font-pixel text-base sm:text-lg text-[#EE1515] block">
                      {prize.amount}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Tracks Section */}
        <div id="tracks" className="mb-20">
          <div className="text-center mb-10">
            <h3 className="font-pixel text-lg sm:text-2xl text-[#3B4CCA]">
              GYM BATTLE TRACKS
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              Choose your battlefield. Each track challenges trainers with unique technical problem statements.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {tracks.map((track, i) => (
              <div
                key={track.name}
                className="bg-white border-3 border-[#1E232A] rounded-2xl p-6 shadow-[5px_5px_0px_#1E232A] hover:shadow-[7px_7px_0px_#3B4CCA] hover-lift transition-all cursor-default group"
              >
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-gray-50 group-hover:bg-red-50/50 rounded-xl border-2 border-[#1E232A] shrink-0 transition-colors">
                    {TRACK_ICONS[i] || <Cpu size={28} />}
                  </div>
                  <div>
                    <span className="font-mono text-xs font-bold text-gray-400">TRACK 0{i + 1}</span>
                    <h4 className="font-pixel text-sm text-[#1E232A] group-hover:text-[#3B4CCA] mt-1 transition-colors">{track.name}</h4>
                    <p className="text-sm text-gray-600 mt-2 leading-relaxed">{track.desc}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Rules & Guidelines */}
        <div id="rules" className="bg-white border-3 border-[#1E232A] rounded-2xl p-6 sm:p-8 shadow-[6px_6px_0px_#1E232A]">
          <div className="flex items-center gap-3 mb-6 pb-4 border-b-2 border-gray-200">
            <ShieldAlert className="text-[#EE1515]" size={28} />
            <div>
              <h3 className="font-pixel text-base sm:text-lg text-[#1E232A]">TRAINER CODE & LEAGUE RULES</h3>
              <p className="text-xs text-gray-500 font-mono">Fair play guidelines enforced by the League Committee</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {rules.map((rule, idx) => (
              <div key={idx} className="flex items-start gap-3 p-3 bg-gray-50 hover:bg-red-50/40 rounded-xl border border-gray-200 hover:border-[#EE1515] transition-all">
                <CheckCircle size={18} className="text-[#EE1515] shrink-0 mt-0.5" />
                <span className="text-sm text-gray-700 font-medium">{rule}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
