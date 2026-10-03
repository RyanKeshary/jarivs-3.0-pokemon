'use client';

import React, { useRef, useState } from 'react';
import Image from 'next/image';
import { Download, X, Sparkles, Shield, Award } from 'lucide-react';
import { toPng } from 'html-to-image';
import { playVictoryChime, playRetroBeep } from '@/lib/sound';
import type { Profile, Team } from '@/lib/database.types';

interface TrainerCardModalProps {
  profile: Profile;
  team: Team | null;
  isOpen: boolean;
  onClose: () => void;
}

const BADGES = ['🪨', '💧', '⚡', '🌿', '🔮', '🔥', '🌋', '🌎'];

export function TrainerCardModal({
  profile,
  team,
  isOpen,
  onClose,
}: TrainerCardModalProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [downloading, setDownloading] = useState(false);

  if (!isOpen) return null;

  const handleDownload = async () => {
    if (!cardRef.current) return;
    setDownloading(true);
    playVictoryChime();

    try {
      const dataUrl = await toPng(cardRef.current, {
        cacheBust: true,
        pixelRatio: 2,
      });
      const link = document.createElement('a');
      link.download = `${profile.trainer_id}_TrainerCard.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Error generating card image:', err);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
      <div className="bg-[#1E232A] border-4 border-[#FFCB05] rounded-2xl max-w-md w-full p-6 shadow-2xl relative">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-gray-700">
          <div className="flex items-center gap-2">
            <Sparkles size={16} className="text-[#FFCB05]" />
            <span className="font-pixel text-xs text-[#FFCB05]">OFFICIAL TRAINER CARD</span>
          </div>
          <button
            onClick={() => {
              playRetroBeep(440, 'square', 0.05);
              onClose();
            }}
            className="text-gray-400 hover:text-white px-2 py-1 rounded text-sm hover:bg-gray-800"
          >
            ✕
          </button>
        </div>

        {/* The Printable Trainer Card Element */}
        <div
          ref={cardRef}
          className="bg-gradient-to-br from-[#EE1515] via-[#D01010] to-[#8B0000] p-5 rounded-2xl border-4 border-[#1E232A] shadow-xl text-white relative overflow-hidden select-none"
        >
          {/* Top Card Bar */}
          <div className="flex items-center justify-between border-b-2 border-white/30 pb-2 mb-3">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-full bg-white flex items-center justify-center border border-[#1E232A]">
                <div className="w-2 h-2 rounded-full bg-[#EE1515]" />
              </div>
              <span className="font-pixel text-[11px] tracking-wider text-white">
                TRAINER CARD
              </span>
            </div>
            <span className="font-mono text-[10px] bg-black/40 px-2 py-0.5 rounded text-[#FFCB05] font-bold">
              KENTO LEAGUE 3.0
            </span>
          </div>

          {/* Main Card Content */}
          <div className="flex gap-4 items-start">
            {/* Left Photo Frame */}
            <div className="w-24 h-28 rounded-xl bg-white border-3 border-[#1E232A] p-1.5 flex flex-col items-center justify-between shrink-0 shadow-md">
              <div className="relative w-full h-20 bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center">
                {profile.avatar_url ? (
                  <Image
                    src={profile.avatar_url}
                    alt={profile.full_name}
                    fill
                    className="object-contain"
                  />
                ) : (
                  <div className="text-3xl">🧢</div>
                )}
              </div>
              <span className="font-pixel text-[7px] text-[#1E232A]">SLRTCE ARENA</span>
            </div>

            {/* Right Information */}
            <div className="flex-1 min-w-0 space-y-1.5">
              <div>
                <span className="font-mono text-[8px] text-white/70 uppercase block">
                  TRAINER ID NO.
                </span>
                <span className="font-pixel text-xs text-[#FFCB05] block truncate">
                  {profile.trainer_id}
                </span>
              </div>

              <div>
                <span className="font-mono text-[8px] text-white/70 uppercase block">
                  NAME
                </span>
                <span className="font-bold text-sm text-white block truncate">
                  {profile.full_name}
                </span>
              </div>

              <div>
                <span className="font-mono text-[8px] text-white/70 uppercase block">
                  SQUAD / TEAM
                </span>
                <span className="font-mono text-xs font-bold text-white block truncate">
                  {team ? `${team.name} (${team.team_id})` : 'SOLO TRAINER (NO TEAM)'}
                </span>
              </div>

              <div>
                <span className="font-mono text-[8px] text-white/70 uppercase block">
                  DOMAIN
                </span>
                <span className="font-mono text-[10px] text-white/90 block truncate">
                  {profile.email}
                </span>
              </div>
            </div>
          </div>

          {/* Bottom Gym Badges Strip */}
          <div className="mt-4 pt-2.5 border-t-2 border-white/30 flex items-center justify-between">
            <span className="font-pixel text-[8px] text-[#FFCB05]">BADGES:</span>
            <div className="flex items-center gap-1.5 text-sm">
              {BADGES.map((b, i) => (
                <span key={i} className="filter drop-shadow-sm">
                  {b}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="mt-6 flex items-center justify-between gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2.5 bg-gray-700 hover:bg-gray-600 text-white font-pixel text-xs rounded-xl border border-gray-500 cursor-pointer"
          >
            CLOSE
          </button>
          <button
            onClick={handleDownload}
            disabled={downloading}
            className="flex-1 py-2.5 bg-[#FFCB05] hover:bg-[#E5B500] active:scale-95 text-[#1E232A] font-pixel text-xs rounded-xl border-2 border-black shadow-[3px_3px_0px_black] flex items-center justify-center gap-2 cursor-pointer font-bold"
          >
            <Download size={14} />
            <span>{downloading ? 'GENERATING PNG...' : 'DOWNLOAD ID CARD (PNG)'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
