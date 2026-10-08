'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Volume2, VolumeX, LogOut, ArrowLeft, Shield, Sparkles } from 'lucide-react';
import { AnnouncementsBox } from './AnnouncementsBox';
import { StatusUpdatesBox } from './StatusUpdatesBox';
import { SubmissionBox } from './SubmissionBox';
import { ResourcesBox } from './ResourcesBox';
import { PokedexDrawer } from './PokedexDrawer';
import { TrainerCardModal } from './TrainerCardModal';
import { createClient } from '@/lib/supabase/client';
import { isSoundEnabled, toggleSound, playPokedexOpenSound, playRetroBeep } from '@/lib/sound';
import type { Profile, Team, SocialLink, Announcement, StatusUpdate, ProblemStatement, Submission, EventSettings } from '@/lib/database.types';

interface VideoPhoneDashboardProps {
  profile: Profile;
  team: Team | null;
  teamMembers: any[];
  socialLinks: SocialLink[];
  announcements: Announcement[];
  statusUpdates: StatusUpdate[];
  problemStatements: ProblemStatement[];
  submissions: Submission[];
  eventSettings: EventSettings;
}

export function VideoPhoneDashboard({
  profile,
  team,
  teamMembers,
  socialLinks,
  announcements,
  statusUpdates,
  problemStatements,
  submissions,
  eventSettings,
}: VideoPhoneDashboardProps) {
  const router = useRouter();
  const [activeProfile, setActiveProfile] = useState<Profile>(profile);
  const [isPokedexOpen, setIsPokedexOpen] = useState(false);
  const [isCardModalOpen, setIsCardModalOpen] = useState(false);
  const [selectedCardProfile, setSelectedCardProfile] = useState<Profile>(profile);
  const [selectedCardTeam, setSelectedCardTeam] = useState<Team | null>(team);
  const [soundOn, setSoundOn] = useState(false);

  const handleOpenTrainerCard = (targetProfile?: any, targetTeam?: any) => {
    playRetroBeep(520, 'sine', 0.05);
    setSelectedCardProfile(targetProfile || activeProfile);
    setSelectedCardTeam(targetTeam !== undefined ? targetTeam : team);
    setIsCardModalOpen(true);
  };

  const handleAvatarUpdated = (newUrl: string) => {
    setActiveProfile((prev) => ({ ...prev, avatar_url: newUrl }));
    setSelectedCardProfile((prev) => ({ ...prev, avatar_url: newUrl }));
  };

  useEffect(() => {
    setSoundOn(isSoundEnabled());
  }, []);

  const handleSoundToggle = () => {
    const newState = toggleSound();
    setSoundOn(newState);
    if (newState) playRetroBeep(880, 'sine', 0.05);
  };

  const handleLogout = async () => {
    playRetroBeep(330, 'square', 0.08);
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
    } catch {}

    try {
      localStorage.setItem('indigo_logged_out', 'true');
      localStorage.removeItem('indigo_logged_in');
      localStorage.removeItem('indigo_user_registered');
      localStorage.removeItem('indigo_user_events_count');
      window.dispatchEvent(new Event('auth_state_change'));
    } catch {}

    window.location.href = '/auth?mode=login';
  };

  const togglePokedex = () => {
    if (!isPokedexOpen) {
      playPokedexOpenSound();
    } else {
      playRetroBeep(440, 'square', 0.05);
    }
    setIsPokedexOpen(!isPokedexOpen);
  };

  return (
    <div className="min-h-screen bg-[#12161A] p-2 sm:p-4 lg:p-6 flex flex-col justify-between select-none">
      {/* RETRO POKÉMON CENTER VIDEO-PHONE FRAME */}
      <div className="max-w-[1600px] w-full mx-auto flex-1 flex flex-col bg-[#2A3439] border-4 border-[#1E232A] rounded-3xl p-3 sm:p-5 shadow-[0_0_50px_rgba(0,0,0,0.8)] relative">
        {/* Device Top Bezel: Camera, Antenna & LEDs */}
        <div className="flex items-center justify-between px-3 py-2 bg-[#1E232A] rounded-2xl border-2 border-gray-700 mb-3 shadow-inner">
          {/* Left LEDs */}
          <div className="flex items-center gap-2">
            <span className="w-3.5 h-3.5 rounded-full bg-emerald-500 border border-white shadow-[0_0_10px_#10B981] animate-pulse" />
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 border border-white" />
            <span className="font-pixel text-[9px] sm:text-[10px] text-emerald-400 tracking-wider hidden sm:inline ml-1">
              POKÉ-COMM SYSTEM V3.0 · ONLINE
            </span>
          </div>

          {/* Center Video-Phone Camera Lens */}
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-black border-2 border-gray-500 flex items-center justify-center">
              <div className="w-2.5 h-2.5 rounded-full bg-blue-900 border border-blue-400" />
            </div>
            <span className="font-pixel text-[9px] sm:text-[11px] text-[#FFCB05] tracking-widest uppercase">
              PROFESSOR OAK COMM-LINK
            </span>
          </div>

          {/* Right Controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleSoundToggle}
              className="p-1.5 bg-gray-800 hover:bg-gray-700 rounded-lg text-white border border-gray-600 transition-all cursor-pointer"
              title={soundOn ? 'Mute 8-bit sound' : 'Unmute 8-bit sound'}
            >
              {soundOn ? <Volume2 size={14} className="text-[#FFCB05]" /> : <VolumeX size={14} />}
            </button>

            <Link
              href="/"
              className="hidden sm:flex items-center gap-1 px-2.5 py-1 bg-gray-800 hover:bg-gray-700 text-gray-200 text-xs rounded-lg border border-gray-600 font-mono"
            >
              <ArrowLeft size={12} />
              <span>Arena</span>
            </Link>

            {(profile.role === 'admin' || profile.role === 'master') && (
              <a
                href="/admin"
                className="flex items-center gap-1 px-2.5 py-1 bg-[#EE1515] hover:bg-[#D01010] text-white text-xs rounded-lg border border-white font-pixel text-[9px]"
              >
                <Shield size={12} />
                <span>ADMIN</span>
              </a>
            )}

            <button
              onClick={handleLogout}
              className="p-1.5 bg-red-950/80 hover:bg-red-900 text-red-300 rounded-lg border border-red-700 cursor-pointer"
              title="Logout"
            >
              <LogOut size={14} />
            </button>
          </div>
        </div>

        {/* SCREEN INNER BEZEL */}
        <div className="flex-1 flex overflow-hidden rounded-2xl border-4 border-[#1E232A] bg-[#151A1D] crt-scanlines relative shadow-inner">
          {/* Main 2x2 Screen Content Area */}
          <div className="flex-1 flex flex-col p-3 sm:p-5 overflow-y-auto">
            {/* Trainer Status Bar inside monitor */}
            <div className="flex flex-wrap items-center justify-between gap-2 pb-3 mb-3 border-b-2 border-gray-800 text-white font-mono text-xs">
              <div
                onClick={() => handleOpenTrainerCard(activeProfile, team)}
                className="flex items-center gap-3 cursor-pointer group"
                title="Click to view your Official Trainer ID Card"
              >
                <div className="px-2.5 py-1 bg-[#EE1515] group-hover:bg-[#D01010] rounded text-white font-pixel text-[9px] flex items-center gap-1 shadow-sm transition-colors">
                  <span>🪪</span>
                  <span>{activeProfile.trainer_id}</span>
                </div>
                <span className="font-bold text-sm text-gray-100 group-hover:text-[#FFCB05] transition-colors">
                  {activeProfile.full_name}
                </span>
                <span className="text-gray-500 hidden md:inline">|</span>
                <span className="text-gray-400 text-xs hidden md:inline">{activeProfile.email}</span>
                <span className="text-[8px] font-pixel px-1.5 py-0.5 bg-white/10 group-hover:bg-[#FFCB05] group-hover:text-[#1E232A] rounded border border-white/20 transition-colors">
                  VIEW ID
                </span>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-gray-400 text-[11px]">SQUAD:</span>
                {team ? (
                  <span className="px-2 py-0.5 bg-[#3B4CCA]/30 border border-[#3B4CCA] text-cyan-300 rounded font-pixel text-[9px]">
                    {team.name} ({team.team_id})
                  </span>
                ) : (
                  <span className="px-2 py-0.5 bg-amber-950/60 border border-amber-600 text-amber-300 rounded font-pixel text-[9px]">
                    SOLO TRAINER
                  </span>
                )}
              </div>
            </div>

            {/* SYMMETRIC 2x2 GRID OF 4 BOXES */}
            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 min-h-[500px]">
              {/* Box 1 (top-left): Latest Announcements */}
              <AnnouncementsBox initialAnnouncements={announcements} />

              {/* Box 2 (top-right): Status Updates for team */}
              <StatusUpdatesBox initialUpdates={statusUpdates} teamId={team?.id} />

              {/* Box 3 (bottom-left): Submission Box */}
              <SubmissionBox
                submissions={submissions}
                teamId={team?.id}
                deadline={eventSettings.deadline}
                onPokedexRequest={() => setIsPokedexOpen(true)}
              />

              {/* Box 4 (bottom-right): Resources & Problem Statements */}
              <ResourcesBox
                brochureUrl={eventSettings.brochure_url}
                pptTemplateUrl={eventSettings.ppt_template_url}
                problemStatements={problemStatements}
              />
            </div>
          </div>

          {/* FAR RIGHT: TALL VERTICAL POKÉDEX BUTTON (Ash & Oak Video-Phone Spec) */}
          <div className="flex items-center justify-center p-2 bg-[#1E232A] border-l-4 border-[#1E232A] z-20 shrink-0">
            <button
              onClick={togglePokedex}
              title="Click to launch Pokédex"
              className={`group flex flex-col items-center justify-between py-6 px-2.5 sm:px-3 rounded-2xl border-3 transition-all cursor-pointer select-none ${
                isPokedexOpen
                  ? 'bg-[#FFCB05] text-[#1E232A] border-white shadow-[0_0_20px_#FFCB05]'
                  : 'bg-[#EE1515] hover:bg-[#D01010] text-white border-[#1E232A] shadow-[4px_4px_0_#990000] hover:scale-105 active:scale-95'
              }`}
            >
              {/* Top Pokeball Mini Icon */}
              <div className="w-5 h-5 rounded-full bg-white border-2 border-[#1E232A] flex items-center justify-center mb-3">
                <div className="w-2 h-2 rounded-full bg-[#EE1515]" />
              </div>

              {/* Stacked Vertical Letters P-O-K-É-D-E-X */}
              <div className="flex flex-col items-center gap-1.5 font-pixel text-xs sm:text-sm tracking-wider font-bold">
                <span>P</span>
                <span>O</span>
                <span>K</span>
                <span>É</span>
                <span>D</span>
                <span>E</span>
                <span>X</span>
              </div>

              {/* Bottom Indicator */}
              <div className="mt-3 flex flex-col items-center">
                <span className="w-2 h-2 rounded-full bg-white animate-ping" />
              </div>
            </button>
          </div>

          {/* SLIDING POKÉDEX DRAWER OVERLAY */}
          <PokedexDrawer
            isOpen={isPokedexOpen}
            onClose={() => setIsPokedexOpen(false)}
            profile={activeProfile}
            team={team}
            teamMembers={teamMembers}
            socialLinks={socialLinks}
            onOpenCardModal={handleOpenTrainerCard}
          />
        </div>
      </div>

      {/* Trainer Card PNG Modal */}
      <TrainerCardModal
        isOpen={isCardModalOpen}
        onClose={() => setIsCardModalOpen(false)}
        profile={selectedCardProfile}
        team={selectedCardTeam}
        canUpload={selectedCardProfile.id === activeProfile.id}
        onAvatarUpdated={handleAvatarUpdated}
      />
    </div>
  );
}
