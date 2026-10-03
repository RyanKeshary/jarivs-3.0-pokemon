'use client';

import React, { useRef, useState } from 'react';
import Image from 'next/image';
import { Download, X, Sparkles, Camera, Check, AlertCircle, Loader2 } from 'lucide-react';
import { toPng } from 'html-to-image';
import { playVictoryChime, playRetroBeep } from '@/lib/sound';
import { uploadTrainerAvatar } from '@/app/actions/dashboard';
import type { Profile, Team } from '@/lib/database.types';

interface TrainerCardModalProps {
  profile: Profile;
  team: Team | null;
  isOpen: boolean;
  onClose: () => void;
  canUpload?: boolean;
  onAvatarUpdated?: (newUrl: string) => void;
}

const BADGES = ['🪨', '💧', '⚡', '🌿', '🔮', '🔥', '🌋', '🌎'];

export function TrainerCardModal({
  profile,
  team,
  isOpen,
  onClose,
  canUpload = true,
  onAvatarUpdated,
}: TrainerCardModalProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [downloading, setDownloading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [currentAvatar, setCurrentAvatar] = useState<string | null>(
    profile.avatar_url && !profile.avatar_url.includes('placeholder')
      ? profile.avatar_url
      : null
  );
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

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

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      setStatusMessage({ text: 'Image exceeds 5MB limit', type: 'error' });
      playRetroBeep(220, 'sawtooth', 0.15);
      return;
    }

    setIsUploading(true);
    setStatusMessage(null);
    playRetroBeep(440, 'square', 0.05);

    try {
      const formData = new FormData();
      formData.append('file', file);
      if (profile?.id) {
        formData.append('targetUserId', profile.id);
      }

      const res = await uploadTrainerAvatar(formData);
      if (res?.success && res.avatar_url) {
        setCurrentAvatar(res.avatar_url);
        setStatusMessage({ text: 'Trainer photo updated!', type: 'success' });
        playRetroBeep(880, 'sine', 0.1);
        onAvatarUpdated?.(res.avatar_url);
      }
    } catch (err: any) {
      console.error('Avatar upload failed:', err);
      setStatusMessage({ text: err.message || 'Failed to upload photo', type: 'error' });
      playRetroBeep(220, 'sawtooth', 0.15);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-[#1E232A] border-4 border-[#FFCB05] rounded-2xl max-w-md w-full p-5 sm:p-6 shadow-2xl relative">
        {/* Hidden File Input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/gif"
          onChange={handleFileChange}
          className="hidden"
        />

        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-gray-700">
          <div className="flex items-center gap-2">
            <Sparkles size={16} className="text-[#FFCB05] animate-pulse" />
            <span className="font-pixel text-xs text-[#FFCB05]">OFFICIAL TRAINER CARD</span>
          </div>
          <button
            onClick={() => {
              playRetroBeep(440, 'square', 0.05);
              onClose();
            }}
            className="text-gray-400 hover:text-white px-2 py-1 rounded text-sm hover:bg-gray-800 transition-colors cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Status Notification */}
        {statusMessage && (
          <div
            className={`mb-3 p-2 rounded-lg text-xs font-mono font-bold flex items-center gap-2 border-2 ${
              statusMessage.type === 'success'
                ? 'bg-emerald-950/80 border-emerald-500 text-emerald-300'
                : 'bg-red-950/80 border-red-500 text-red-300'
            }`}
          >
            {statusMessage.type === 'success' ? <Check size={14} /> : <AlertCircle size={14} />}
            <span>{statusMessage.text}</span>
          </div>
        )}

        {/* The Printable Trainer Card Element */}
        <div
          ref={cardRef}
          className="bg-gradient-to-br from-[#EE1515] via-[#D01010] to-[#8B0000] p-4 sm:p-5 rounded-2xl border-4 border-[#1E232A] shadow-xl text-white relative overflow-hidden select-none"
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
            <div className="w-24 sm:w-28 rounded-xl bg-white border-3 border-[#1E232A] p-1.5 flex flex-col items-center justify-between shrink-0 shadow-md relative group">
              <div className="relative w-full h-24 bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center">
                {currentAvatar ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={currentAvatar}
                    alt={profile.full_name}
                    crossOrigin="anonymous"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center text-gray-400">
                    <span className="text-3xl">🧢</span>
                    <span className="font-pixel text-[6px] text-gray-500 mt-1">NO PHOTO</span>
                  </div>
                )}

                {/* Upload Hover Button Over Photo Frame */}
                {canUpload && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      fileInputRef.current?.click();
                    }}
                    disabled={isUploading}
                    className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-white transition-opacity cursor-pointer p-1 text-center"
                    title="Upload Trainer Photo"
                  >
                    {isUploading ? (
                      <Loader2 size={18} className="animate-spin text-[#FFCB05]" />
                    ) : (
                      <>
                        <Camera size={18} className="text-[#FFCB05] mb-0.5" />
                        <span className="font-pixel text-[6px] text-[#FFCB05] leading-tight">
                          UPLOAD PHOTO
                        </span>
                      </>
                    )}
                  </button>
                )}
              </div>
              <span className="font-pixel text-[7px] text-[#1E232A] mt-1">SLRTCE ARENA</span>
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
                <span key={i} className="filter drop-shadow-sm hover:scale-125 transition-transform cursor-default">
                  {b}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="mt-5 flex flex-col gap-2.5">
          {canUpload && (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="w-full py-2 bg-white hover:bg-gray-100 text-[#1E232A] font-pixel text-[9px] rounded-xl border-2 border-[#1E232A] shadow-[2px_2px_0px_#1E232A] flex items-center justify-center gap-2 cursor-pointer active:scale-95 transition-all"
            >
              {isUploading ? (
                <>
                  <Loader2 size={13} className="animate-spin text-[#EE1515]" />
                  <span>UPLOADING PHOTO TO LEAGUE DATABASE...</span>
                </>
              ) : (
                <>
                  <Camera size={13} className="text-[#EE1515]" />
                  <span>{currentAvatar ? 'CHANGE TRAINER PHOTO' : 'UPLOAD TRAINER PHOTO'}</span>
                </>
              )}
            </button>
          )}

          <div className="flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 bg-gray-700 hover:bg-gray-600 text-white font-pixel text-xs rounded-xl border border-gray-500 cursor-pointer active:scale-95 transition-all"
            >
              CLOSE
            </button>
            <button
              type="button"
              onClick={handleDownload}
              disabled={downloading}
              className="flex-1 py-2.5 bg-[#FFCB05] hover:bg-[#E5B500] active:scale-95 text-[#1E232A] font-pixel text-xs rounded-xl border-2 border-black shadow-[3px_3px_0px_black] flex items-center justify-center gap-2 cursor-pointer font-bold transition-all"
            >
              <Download size={14} />
              <span>{downloading ? 'GENERATING PNG...' : 'DOWNLOAD ID CARD (PNG)'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
