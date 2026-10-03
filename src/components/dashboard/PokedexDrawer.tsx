'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, User, Users, Plus, Trash2, Copy, Check, IdCard, Sparkles, ExternalLink, Save } from 'lucide-react';
import { updateProfile, addSocialLink, deleteSocialLink, createTeam, joinTeam, leaveTeam } from '@/app/actions/dashboard';
import { playRetroBeep, playVictoryChime, playPokedexOpenSound } from '@/lib/sound';
import type { Profile, Team, SocialLink } from '@/lib/database.types';

interface PokedexDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  profile: Profile;
  team: Team | null;
  teamMembers: any[];
  socialLinks: SocialLink[];
  onOpenCardModal: () => void;
}

export function PokedexDrawer({
  isOpen,
  onClose,
  profile,
  team,
  teamMembers,
  socialLinks,
  onOpenCardModal,
}: PokedexDrawerProps) {
  const [activeTab, setActiveTab] = useState<'profile' | 'team'>('profile');

  // Profile Edit State
  const [name, setName] = useState(profile.full_name);
  const [avatar, setAvatar] = useState(profile.avatar_url || '/assets/placeholders/monitor.png');
  const [phones, setPhones] = useState<string[]>(profile.phones || []);
  const [newPhone, setNewPhone] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileMsg, setProfileMsg] = useState<string | null>(null);

  // Socials State
  const [socialLabel, setSocialLabel] = useState('github');
  const [socialUrl, setSocialUrl] = useState('');
  const [addingSocial, setAddingSocial] = useState(false);
  const [socialError, setSocialError] = useState<string | null>(null);

  // Team Create / Join State
  const [teamMode, setTeamMode] = useState<'create' | 'join'>('create');
  const [newTeamName, setNewTeamName] = useState('');
  const [joinCodeInput, setJoinCodeInput] = useState('');
  const [teamLoading, setTeamLoading] = useState(false);
  const [teamError, setTeamError] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);

  if (!isOpen) return null;

  // Handle Save Profile
  const handleSaveProfile = async () => {
    setSavingProfile(true);
    setProfileMsg(null);
    try {
      await updateProfile({
        fullName: name,
        avatarUrl: avatar,
        phones,
      });
      playVictoryChime();
      setProfileMsg('Trainer profile synchronized!');
    } catch (err: any) {
      setProfileMsg(err.message || 'Failed to update profile');
    } finally {
      setSavingProfile(false);
    }
  };

  // Add Phone
  const handleAddPhone = () => {
    if (!newPhone.trim()) return;
    setPhones([...phones, newPhone.trim()]);
    setNewPhone('');
  };

  // Remove Phone
  const handleRemovePhone = (index: number) => {
    setPhones(phones.filter((_, i) => i !== index));
  };

  // Add Social Link
  const handleAddSocial = async () => {
    if (!socialUrl.trim()) return;
    setAddingSocial(true);
    setSocialError(null);
    try {
      await addSocialLink(socialLabel, socialUrl);
      setSocialUrl('');
      playRetroBeep(660, 'sine', 0.05);
    } catch (err: any) {
      setSocialError(err.message || 'Failed to add link');
    } finally {
      setAddingSocial(false);
    }
  };

  // Delete Social Link
  const handleDeleteSocial = async (id: string) => {
    try {
      await deleteSocialLink(id);
      playRetroBeep(330, 'square', 0.05);
    } catch (err: any) {
      setSocialError(err.message);
    }
  };

  // Handle Create Team
  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTeamName.trim()) return;
    setTeamLoading(true);
    setTeamError(null);
    try {
      await createTeam(newTeamName);
      playVictoryChime();
      setNewTeamName('');
    } catch (err: any) {
      setTeamError(err.message);
    } finally {
      setTeamLoading(false);
    }
  };

  // Handle Join Team
  const handleJoinTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinCodeInput.trim()) return;
    setTeamLoading(true);
    setTeamError(null);
    try {
      await joinTeam(joinCodeInput);
      playVictoryChime();
      setJoinCodeInput('');
    } catch (err: any) {
      setTeamError(err.message);
    } finally {
      setTeamLoading(false);
    }
  };

  // Handle Leave Team
  const handleLeaveTeam = async () => {
    if (!confirm('Are you sure you want to leave/disband this squad?')) return;
    setTeamLoading(true);
    try {
      await leaveTeam();
      playRetroBeep(330, 'sawtooth', 0.1);
    } catch (err: any) {
      setTeamError(err.message);
    } finally {
      setTeamLoading(false);
    }
  };

  const handleCopyJoinCode = () => {
    if (team?.join_code) {
      navigator.clipboard.writeText(team.join_code);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
      playRetroBeep(880, 'sine', 0.05);
    }
  };

  return (
    <motion.aside
      initial={{ x: '100%', opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: '100%', opacity: 0 }}
      transition={{ duration: 0.35, ease: 'easeInOut' }}
      className="w-full lg:w-96 bg-[#EE1515] border-l-4 border-y-4 border-[#1E232A] rounded-l-2xl shadow-[-8px_0px_0px_#1E232A] flex flex-col h-full z-30 shrink-0 text-white overflow-hidden"
    >
      {/* Pokédex Bezel Header */}
      <div className="p-4 bg-[#D01010] border-b-4 border-[#1E232A] flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          {/* Blue Sensor Light */}
          <div className="w-8 h-8 rounded-full bg-[#3B4CCA] border-2 border-white pulse-glow shadow-md flex items-center justify-center">
            <div className="w-2.5 h-2.5 rounded-full bg-cyan-300" />
          </div>
          {/* Three mini LEDs */}
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-red-400 border border-black" />
            <span className="w-2.5 h-2.5 rounded-full bg-yellow-400 border border-black" />
            <span className="w-2.5 h-2.5 rounded-full bg-green-400 border border-black" />
          </div>
          <span className="font-pixel text-[11px] text-[#FFCB05] tracking-widest ml-2">
            POKÉDEX OS
          </span>
        </div>

        <button
          onClick={onClose}
          className="p-1.5 bg-black/40 hover:bg-black/60 rounded-lg text-white font-mono text-xs cursor-pointer border border-gray-600"
          title="Close Pokédex"
        >
          <X size={16} />
        </button>
      </div>

      {/* Pokédex Page Switcher */}
      <div className="grid grid-cols-2 p-2 bg-[#B70E0E] gap-2 border-b-2 border-[#1E232A]">
        <button
          onClick={() => {
            setActiveTab('profile');
            playRetroBeep(520, 'square', 0.04);
          }}
          className={`py-2 px-3 font-pixel text-[10px] rounded-lg border-2 border-[#1E232A] flex items-center justify-center gap-1.5 transition-all ${
            activeTab === 'profile'
              ? 'bg-[#FFCB05] text-[#1E232A] font-bold shadow-[2px_2px_0px_#1E232A]'
              : 'bg-white/20 text-white hover:bg-white/30'
          }`}
        >
          <User size={12} />
          <span>TRAINER</span>
        </button>

        <button
          onClick={() => {
            setActiveTab('team');
            playRetroBeep(520, 'square', 0.04);
          }}
          className={`py-2 px-3 font-pixel text-[10px] rounded-lg border-2 border-[#1E232A] flex items-center justify-center gap-1.5 transition-all ${
            activeTab === 'team'
              ? 'bg-[#FFCB05] text-[#1E232A] font-bold shadow-[2px_2px_0px_#1E232A]'
              : 'bg-white/20 text-white hover:bg-white/30'
          }`}
        >
          <Users size={12} />
          <span>SQUAD</span>
        </button>
      </div>

      {/* Pokédex Inner Screen Body */}
      <div className="flex-1 p-4 overflow-y-auto bg-[#F8F9FA] text-[#1E232A] border-t-2 border-b-4 border-[#1E232A] font-sans">
        {/* PAGE 1: TRAINER PROFILE */}
        {activeTab === 'profile' && (
          <div className="space-y-4">
            {/* Trainer ID Header Tag */}
            <div className="p-3 bg-[#1E232A] text-white rounded-xl border-2 border-[#1E232A] shadow-[2px_2px_0px_#EE1515]">
              <span className="font-mono text-[9px] text-gray-400 uppercase block">
                OFFICIAL REGISTRATION ID
              </span>
              <span className="font-pixel text-xs text-[#FFCB05] tracking-wider block mt-0.5">
                {profile.trainer_id}
              </span>
            </div>

            {profileMsg && (
              <div className="p-2.5 bg-emerald-50 border border-emerald-400 rounded-lg text-xs text-emerald-800 font-bold">
                {profileMsg}
              </div>
            )}

            {/* Name */}
            <div>
              <label className="font-pixel text-[9px] text-gray-700 block mb-1">
                TRAINER NAME
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 bg-white border-2 border-[#1E232A] rounded-lg font-sans text-xs focus:outline-none focus:border-[#EE1515]"
              />
            </div>

            {/* Email (Read-Only) */}
            <div>
              <label className="font-pixel text-[9px] text-gray-700 block mb-1 flex items-center justify-between">
                <span>COLLEGE EMAIL (READ-ONLY)</span>
                <span className="font-mono text-[8px] text-gray-400">LOCKED</span>
              </label>
              <input
                type="text"
                readOnly
                value={profile.email}
                className="w-full px-3 py-2 bg-gray-100 border-2 border-gray-300 rounded-lg font-mono text-xs text-gray-600 select-all"
              />
            </div>

            {/* Mobile Numbers */}
            <div>
              <label className="font-pixel text-[9px] text-gray-700 block mb-1">
                MOBILE NUMBERS
              </label>
              <div className="space-y-1.5 mb-2">
                {phones.map((phone, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-xs font-mono"
                  >
                    <span>{phone}</span>
                    <button
                      type="button"
                      onClick={() => handleRemovePhone(idx)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  type="tel"
                  placeholder="+91 9876543210"
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  className="flex-1 px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-xs font-mono focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handleAddPhone}
                  className="px-3 py-1.5 bg-[#3B4CCA] text-white rounded-lg text-xs font-bold"
                >
                  ADD
                </button>
              </div>
            </div>

            {/* Social Links (Max 3) */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="font-pixel text-[9px] text-gray-700">
                  SOCIAL LINKS ({socialLinks.length}/3)
                </label>
              </div>

              <div className="space-y-1.5 mb-2">
                {socialLinks.map((link) => (
                  <div
                    key={link.id}
                    className="flex items-center justify-between px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-xs font-sans"
                  >
                    <div className="flex items-center gap-1.5 overflow-hidden">
                      <span className="font-bold uppercase text-[10px] text-[#3B4CCA]">
                        {link.label}:
                      </span>
                      <a
                        href={link.url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-gray-600 truncate hover:underline text-[11px]"
                      >
                        {link.url}
                      </a>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDeleteSocial(link.id)}
                      className="text-red-500 hover:text-red-700 ml-2"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                ))}
              </div>

              {socialLinks.length < 3 && (
                <div className="space-y-1.5 bg-gray-50 p-2.5 rounded-lg border border-gray-200">
                  <div className="flex gap-2">
                    <select
                      value={socialLabel}
                      onChange={(e) => setSocialLabel(e.target.value)}
                      className="px-2 py-1 bg-white border border-gray-300 rounded text-xs"
                    >
                      <option value="github">GitHub</option>
                      <option value="linkedin">LinkedIn</option>
                      <option value="portfolio">Portfolio</option>
                      <option value="twitter">X / Twitter</option>
                    </select>
                    <input
                      type="url"
                      placeholder="https://github.com/username"
                      value={socialUrl}
                      onChange={(e) => setSocialUrl(e.target.value)}
                      className="flex-1 px-2.5 py-1 bg-white border border-gray-300 rounded text-xs"
                    />
                  </div>
                  <button
                    type="button"
                    disabled={addingSocial}
                    onClick={handleAddSocial}
                    className="w-full py-1 bg-[#1E232A] text-white font-pixel text-[9px] rounded flex items-center justify-center gap-1"
                  >
                    <Plus size={10} />
                    <span>ADD SOCIAL LINK</span>
                  </button>
                </div>
              )}
              {socialError && (
                <p className="text-[10px] text-red-500 font-mono mt-1">{socialError}</p>
              )}
            </div>

            {/* Save Profile Button */}
            <button
              type="button"
              disabled={savingProfile}
              onClick={handleSaveProfile}
              className="w-full py-2.5 bg-[#EE1515] hover:bg-[#D01010] text-white font-pixel text-[10px] rounded-lg border-2 border-[#1E232A] shadow-[2px_2px_0_black] flex items-center justify-center gap-2 cursor-pointer"
            >
              <Save size={12} />
              <span>{savingProfile ? 'SAVING PROFILE...' : 'SAVE TRAINER PROFILE'}</span>
            </button>
          </div>
        )}

        {/* PAGE 2: SQUAD & TEAM MANAGEMENT */}
        {activeTab === 'team' && (
          <div className="space-y-4">
            {team ? (
              /* Already in a Team */
              <div className="space-y-4">
                {/* Team Info Card */}
                <div className="p-4 bg-[#1E232A] text-white rounded-xl border-2 border-[#1E232A] shadow-[3px_3px_0_#EE1515]">
                  <span className="font-mono text-[9px] text-[#FFCB05] uppercase block">
                    ACTIVE SQUAD
                  </span>
                  <h4 className="font-pixel text-sm text-white mt-0.5">{team.name}</h4>
                  <div className="mt-2 pt-2 border-t border-gray-700 flex items-center justify-between text-xs font-mono">
                    <div>
                      <span className="text-gray-400 block text-[9px]">TEAM ID</span>
                      <span className="font-bold text-[#FFCB05]">{team.team_id}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-gray-400 block text-[9px]">JOIN CODE</span>
                      <button
                        onClick={handleCopyJoinCode}
                        className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-800 hover:bg-gray-700 rounded border border-gray-600 text-white text-[10px]"
                      >
                        <span>{team.join_code}</span>
                        {copiedCode ? <Check size={10} className="text-emerald-400" /> : <Copy size={10} />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Team Members List */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-pixel text-[10px] text-gray-700 uppercase">
                      MEMBERS ({teamMembers.length}/4)
                    </span>
                    <span className="text-[10px] font-mono text-gray-500 font-bold">
                      CAPACITY: 4 MAX
                    </span>
                  </div>

                  <div className="space-y-2">
                    {teamMembers.map((m) => (
                      <div
                        key={m.user_id}
                        className="p-2.5 bg-white rounded-lg border-2 border-gray-200 flex items-center justify-between gap-2"
                      >
                        <div className="overflow-hidden">
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-xs text-[#1E232A]">
                              {m.full_name}
                            </span>
                            {m.user_id === team.created_by && (
                              <span className="px-1.5 py-0.2 bg-[#FFCB05] text-[#1E232A] rounded font-pixel text-[7px] font-bold">
                                LEADER
                              </span>
                            )}
                          </div>
                          <span className="font-mono text-[9px] text-[#EE1515] block">
                            {m.trainer_id}
                          </span>
                        </div>
                        <span className="font-mono text-[9px] text-gray-400 shrink-0">
                          {m.email}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Leave / Disband Team */}
                <div className="pt-2">
                  <button
                    type="button"
                    disabled={teamLoading}
                    onClick={handleLeaveTeam}
                    className="w-full py-2 bg-red-100 hover:bg-red-200 text-[#EE1515] font-pixel text-[9px] rounded-lg border border-red-300 transition-all cursor-pointer"
                  >
                    {team.created_by === profile.id ? 'DISBAND TEAM SQUAD' : 'LEAVE TEAM SQUAD'}
                  </button>
                  <p className="text-[9px] text-gray-500 text-center mt-1">
                    {team.created_by === profile.id
                      ? 'As leader, disbanding removes all members from this squad.'
                      : 'Leaving frees your slot for another trainer.'}
                  </p>
                </div>
              </div>
            ) : (
              /* No Team -> Create or Join */
              <div className="space-y-4">
                <div className="grid grid-cols-2 p-1 bg-gray-200 rounded-lg gap-1">
                  <button
                    type="button"
                    onClick={() => {
                      setTeamMode('create');
                      setTeamError(null);
                    }}
                    className={`py-1.5 font-pixel text-[9px] rounded ${
                      teamMode === 'create' ? 'bg-white text-black font-bold' : 'text-gray-600'
                    }`}
                  >
                    CREATE SQUAD
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setTeamMode('join');
                      setTeamError(null);
                    }}
                    className={`py-1.5 font-pixel text-[9px] rounded ${
                      teamMode === 'join' ? 'bg-white text-black font-bold' : 'text-gray-600'
                    }`}
                  >
                    JOIN SQUAD
                  </button>
                </div>

                {teamError && (
                  <p className="p-2 bg-red-50 border border-red-300 text-xs text-red-600 rounded">
                    {teamError}
                  </p>
                )}

                {teamMode === 'create' ? (
                  <form onSubmit={handleCreateTeam} className="space-y-3">
                    <div>
                      <label className="font-pixel text-[9px] text-gray-700 block mb-1">
                        SQUAD TEAM NAME
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Team Pikachu"
                        value={newTeamName}
                        onChange={(e) => setNewTeamName(e.target.value)}
                        className="w-full px-3 py-2 bg-white border-2 border-[#1E232A] rounded-lg text-xs"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={teamLoading}
                      className="w-full py-2.5 bg-[#3B4CCA] hover:bg-[#2A3A98] text-white font-pixel text-[10px] rounded-lg border border-black shadow-[2px_2px_0_black]"
                    >
                      {teamLoading ? 'FORMING SQUAD...' : 'FORM NEW SQUAD'}
                    </button>
                  </form>
                ) : (
                  <form onSubmit={handleJoinTeam} className="space-y-3">
                    <div>
                      <label className="font-pixel text-[9px] text-gray-700 block mb-1">
                        SQUAD JOIN CODE OR TEAM ID
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="POKE-XXXXXX or TEAM-KL3-XXXX"
                        value={joinCodeInput}
                        onChange={(e) => setJoinCodeInput(e.target.value)}
                        className="w-full px-3 py-2 bg-white border-2 border-[#1E232A] rounded-lg text-xs uppercase"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={teamLoading}
                      className="w-full py-2.5 bg-[#EE1515] hover:bg-[#D01010] text-white font-pixel text-[10px] rounded-lg border border-black shadow-[2px_2px_0_black]"
                    >
                      {teamLoading ? 'JOINING SQUAD...' : 'ENTER SQUAD'}
                    </button>
                  </form>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Bottom Action: Preview ID Card */}
      <div className="p-3 bg-[#D01010] border-t-2 border-[#1E232A]">
        <button
          type="button"
          onClick={() => {
            playRetroBeep(880, 'sine', 0.05);
            onOpenCardModal();
          }}
          className="w-full py-2.5 bg-[#FFCB05] hover:bg-[#E5B500] active:scale-95 text-[#1E232A] font-pixel text-[10px] rounded-xl border-2 border-black shadow-[3px_3px_0px_black] flex items-center justify-center gap-2 cursor-pointer font-bold"
        >
          <IdCard size={16} />
          <span>PREVIEW ID CARD</span>
        </button>
      </div>
    </motion.aside>
  );
}
