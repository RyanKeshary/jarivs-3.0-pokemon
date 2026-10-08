'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FEST_EVENTS } from '@/components/sections/EventsLedger';
import { createFestTeam, joinFestTeam, getFestTeamByCode } from '@/app/actions/registration';

interface RegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  preselectedEventId?: string | null;
  initialJoinCode?: string | null;
}

export function RegistrationModal({
  isOpen,
  onClose,
  preselectedEventId,
  initialJoinCode,
}: RegistrationModalProps) {
  const [mode, setMode] = useState<'create' | 'join'>('create');

  // Form State
  const [selectedEvents, setSelectedEvents] = useState<string[]>([]);
  const [teamName, setTeamName] = useState('');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [college, setCollege] = useState('');
  const [department, setDepartment] = useState('');
  const [yearOfStudy, setYearOfStudy] = useState('3rd Year (TE)');
  const [collegeId, setCollegeId] = useState('');
  const [honeypot, setHoneypot] = useState('');

  // Join Mode State
  const [joinCodeInput, setJoinCodeInput] = useState('');
  const [targetTeam, setTargetTeam] = useState<any | null>(null);
  const [isVerifyingCode, setIsVerifyingCode] = useState(false);

  // Status & Feedback
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [maxWarning, setMaxWarning] = useState<string | null>(null);
  const [successData, setSuccessData] = useState<any | null>(null);
  const [copied, setCopied] = useState(false);

  // Load draft from localStorage on initial render
  useEffect(() => {
    try {
      const savedDraft = localStorage.getItem('indigo_reg_draft');
      if (savedDraft) {
        const parsed = JSON.parse(savedDraft);
        if (parsed.fullName) setFullName(parsed.fullName);
        if (parsed.email) setEmail(parsed.email);
        if (parsed.phone) setPhone(parsed.phone);
        if (parsed.college) setCollege(parsed.college);
        if (parsed.department) setDepartment(parsed.department);
        if (parsed.yearOfStudy) setYearOfStudy(parsed.yearOfStudy);
        if (parsed.teamName) setTeamName(parsed.teamName);
      }
    } catch {
      // ignore
    }
  }, []);

  // Save draft locally on input change
  useEffect(() => {
    try {
      localStorage.setItem(
        'indigo_reg_draft',
        JSON.stringify({
          fullName,
          email,
          phone,
          college,
          department,
          yearOfStudy,
          teamName,
        })
      );
    } catch {
      // ignore
    }
  }, [fullName, email, phone, college, department, yearOfStudy, teamName]);

  // Preselection & Join Code handling
  useEffect(() => {
    if (preselectedEventId) {
      setSelectedEvents([preselectedEventId]);
      setMode('create');
    }
    if (initialJoinCode) {
      setJoinCodeInput(initialJoinCode);
      setMode('join');
      handleVerifyCode(initialJoinCode);
    }
  }, [preselectedEventId, initialJoinCode]);

  // Toggle Event Selection with strict Max 2 rule
  const toggleEvent = (id: string) => {
    setMaxWarning(null);
    if (selectedEvents.includes(id)) {
      setSelectedEvents((prev) => prev.filter((item) => item !== id));
    } else {
      if (selectedEvents.length >= 2) {
        setMaxWarning('Disqualification Alert: You can select a maximum of 2 events. Deselect one to switch.');
        setTimeout(() => setMaxWarning(null), 4000);
        return;
      }
      setSelectedEvents((prev) => [...prev, id]);
    }
  };

  // Schedule Clash Detection
  const detectClashes = (): string[] => {
    const clashes: string[] = [];
    if (selectedEvents.includes('build-asor')) {
      if (selectedEvents.includes('project-exhibition')) {
        clashes.push('Builda-saur overlaps with Poké Expo (10:00 AM - 01:00 PM)');
      }
      if (selectedEvents.includes('treasure-hunt')) {
        clashes.push('Builda-saur overlaps with Team Rocket\'s Pokéquest (11:30 AM - 02:30 PM)');
      }
      if (selectedEvents.includes('pid-geotto')) {
        clashes.push('Builda-saur overlaps with PID-geotto Robot Trials (01:30 PM - 04:30 PM)');
      }
      if (selectedEvents.includes('quiz-tle')) {
        clashes.push('Builda-saur overlaps with Quiz-tle Rounds 1 & 2 (02:00 PM - 04:30 PM)');
      }
    }
    if (selectedEvents.includes('treasure-hunt') && selectedEvents.includes('pid-geotto')) {
      clashes.push('Team Rocket\'s Pokéquest (11:30 AM - 02:30 PM) overlaps with PID-geotto (01:30 PM - 04:30 PM)');
    }
    if (selectedEvents.includes('pid-geotto') && selectedEvents.includes('quiz-tle')) {
      clashes.push('PID-geotto Robot Trials (01:30 PM) clashes with Quiz-tle (02:00 PM)');
    }
    return clashes;
  };

  const activeClashes = detectClashes();

  // Verify Team Code for Join Mode
  const handleVerifyCode = async (codeToTest?: string) => {
    const code = (codeToTest || joinCodeInput).trim().toUpperCase();
    if (!code) return;

    setIsVerifyingCode(true);
    setErrorMsg(null);
    const res = await getFestTeamByCode(code);
    setIsVerifyingCode(false);

    if (res.success && res.team) {
      setTargetTeam(res.team);
    } else {
      setTargetTeam(null);
      setErrorMsg(res.error || 'Team not found.');
    }
  };

  // Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSubmitting(true);

    try {
      if (mode === 'create') {
        if (selectedEvents.length === 0) {
          throw new Error('Please select at least 1 event discipline (maximum 2).');
        }
        if (selectedEvents.length > 2) {
          throw new Error('Disqualification Rule: You cannot register for more than 2 events.');
        }

        const isSolo =
          selectedEvents.length === 1 &&
          FEST_EVENTS.find((ev) => ev.id === selectedEvents[0])?.maxSize === 1;
        const finalTeamName = isSolo && !teamName.trim() ? `${fullName.trim()}'s Squad` : teamName;

        const res = await createFestTeam({
          teamName: finalTeamName,
          eventIds: selectedEvents,
          leader: {
            fullName,
            email,
            phone,
            college,
            department,
            yearOfStudy,
            collegeId,
          },
          honeypot,
        });

        if (!res.success || !res.team) {
          throw new Error(res.error || 'Failed to create team.');
        }

        setSuccessData({
          type: 'created',
          code: res.team.code,
          name: res.team.name,
          leaderToken: res.team.leaderToken,
          eventIds: res.team.eventIds,
        });
      } else {
        if (!joinCodeInput.trim()) {
          throw new Error('Please enter your squad code.');
        }

        const res = await joinFestTeam({
          code: joinCodeInput.trim(),
          member: {
            fullName,
            email,
            phone,
            college,
            department,
            yearOfStudy,
            collegeId,
          },
          honeypot,
        });

        if (!res.success) {
          throw new Error(res.error);
        }

        setSuccessData({
          type: 'joined',
          code: res.teamCode,
          name: res.teamName,
        });
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'An error occurred during registration.');
    } finally {
      setSubmitting(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-[#090b1c]/85 backdrop-blur-md flex items-start justify-center p-3 sm:p-6 overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 12 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
        className="relative w-full max-w-2xl bg-[#111432] border border-white/10 rounded-2xl shadow-2xl my-6 p-5 sm:p-8 text-[#E9E6DA] overflow-y-auto max-h-[92vh]"
      >
        {/* Top Decorative Subtle Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-24 bg-gradient-to-b from-[#D21319]/15 to-transparent blur-2xl pointer-events-none" />

        {/* Header Bar */}
        <div className="relative flex items-center justify-between pb-4 mb-4 border-b border-white/10">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#D21319] animate-pulse" />
              <span className="font-mono text-[10px] tracking-wider text-[#AFAEA2] uppercase">
                INDIGO TECH FEST · JARVIS 3.0
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold font-sans tracking-tight text-white mt-1">
              Fest Registration
            </h2>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/15 border border-white/10 flex items-center justify-center text-[#AFAEA2] hover:text-white transition-colors cursor-pointer text-sm"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {/* PROMINENT DISQUALIFICATION WARNING BANNER */}
        <div className="relative mb-5 p-3 sm:p-3.5 rounded-xl bg-[#D21319]/10 border border-[#D21319]/30 flex items-start gap-3 text-xs">
          <span className="text-base leading-none">⚠️</span>
          <div>
            <span className="font-bold text-[#f87171] uppercase tracking-wide block">
              Strict Rule: Maximum 2 Events Per Member
            </span>
            <span className="text-neutral-300 text-[11px] leading-relaxed block mt-0.5">
              Each student can participate in a maximum of <strong>2 events</strong> across the fest.
              Enrolling in more than 2 events will result in immediate disqualification of the participant.
            </span>
          </div>
        </div>

        {/* SUCCESS VIEW */}
        {successData ? (
          <div className="space-y-6 text-center py-4">
            <div className="w-14 h-14 mx-auto rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 text-2xl font-bold">
              ✓
            </div>

            <div>
              <span className="font-mono text-xs text-[#AFAEA2] tracking-wider uppercase block">
                Official Registration Confirmed
              </span>
              <h3 className="text-2xl font-bold text-white mt-1">
                {successData.type === 'created' ? 'Squad Created Successfully!' : 'Enrolled into Squad!'}
              </h3>
            </div>

            <div className="p-5 rounded-xl bg-[#0b0e24] border border-white/10 text-center relative">
              <span className="font-mono text-[10px] tracking-widest text-[#AFAEA2] uppercase block mb-1">
                YOUR UNIQUE TEAM CODE
              </span>
              <div className="text-3xl sm:text-4xl font-mono font-bold text-white tracking-widest my-2">
                {successData.code}
              </div>
              <div className="text-xs text-[#AFAEA2]">
                TEAM NAME: <span className="text-white font-semibold">{successData.name}</span>
              </div>
            </div>

            {successData.type === 'created' && (
              <div className="space-y-3">
                <p className="text-xs text-[#AFAEA2]">
                  Share this code with your teammates so they can join your squad roster:
                </p>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5">
                  <button
                    onClick={() => copyToClipboard(successData.code)}
                    className="w-full sm:w-auto px-5 py-2.5 rounded-lg bg-white/10 hover:bg-white/20 text-white font-semibold text-xs transition cursor-pointer border border-white/10"
                  >
                    {copied ? '✓ Code Copied!' : 'Copy Team Code'}
                  </button>

                  <a
                    href={`https://wa.me/?text=${encodeURIComponent(
                      `Join our team for Indigo Tech Fest (Jarvis 3.0)!\nTeam Name: ${successData.name}\nTeam Code: ${successData.code}\nJoin link: ${typeof window !== 'undefined' ? window.location.origin : ''}/join/${successData.code}`
                    )}`}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full sm:w-auto px-5 py-2.5 rounded-lg bg-[#25D366] hover:bg-[#20ba5a] text-black font-semibold text-xs transition text-center"
                  >
                    Share on WhatsApp →
                  </a>
                </div>

                {successData.leaderToken && (
                  <div className="mt-4 p-3 rounded-lg bg-white/5 border border-white/10 text-left text-xs font-mono space-y-1">
                    <span className="text-[#f87171] font-semibold block text-[11px]">
                      Leader Management Link:
                    </span>
                    <p className="text-[#AFAEA2] text-[11px]">
                      Bookmark this link to edit your team roster or view teammates:
                    </p>
                    <a
                      href={`/team/manage/${successData.leaderToken}`}
                      className="text-white underline break-all block pt-0.5 hover:text-[#f87171]"
                    >
                      {typeof window !== 'undefined' ? window.location.origin : ''}/team/manage/{successData.leaderToken}
                    </a>
                  </div>
                )}
              </div>
            )}

            <div className="pt-2">
              <button
                onClick={onClose}
                className="w-full py-2.5 rounded-lg bg-white/10 hover:bg-white/20 text-white font-semibold text-xs transition cursor-pointer"
              >
                Done / Close
              </button>
            </div>
          </div>
        ) : (
          /* FORM VIEW */
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Smooth Tab Switcher */}
            <div className="p-1 rounded-xl bg-[#090b1c] border border-white/10 grid grid-cols-2 gap-1">
              <button
                type="button"
                onClick={() => setMode('create')}
                className={`py-2 px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  mode === 'create'
                    ? 'bg-[#D21319] text-white shadow-md'
                    : 'text-[#AFAEA2] hover:text-white'
                }`}
              >
                1. Create a Team
              </button>

              <button
                type="button"
                onClick={() => setMode('join')}
                className={`py-2 px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  mode === 'join'
                    ? 'bg-[#D21319] text-white shadow-md'
                    : 'text-[#AFAEA2] hover:text-white'
                }`}
              >
                2. Join with Code
              </button>
            </div>

            {/* Error Message */}
            {errorMsg && (
              <div className="p-3 rounded-lg bg-[#D21319]/20 border border-[#D21319] text-white text-xs flex items-center justify-between">
                <span>{errorMsg}</span>
                <button
                  type="button"
                  onClick={() => setErrorMsg(null)}
                  className="text-xs text-white/70 hover:text-white ml-2"
                >
                  ✕
                </button>
              </div>
            )}

            {/* Max Event Exceeded Warning */}
            {maxWarning && (
              <div className="p-2.5 rounded-lg bg-amber-500/20 border border-amber-500/50 text-amber-200 text-xs flex items-center gap-2">
                <span>⚠️</span>
                <span>{maxWarning}</span>
              </div>
            )}

            {/* Honeypot field */}
            <div className="hidden" aria-hidden="true">
              <input
                type="text"
                value={honeypot}
                onChange={(e) => setHoneypot(e.target.value)}
                tabIndex={-1}
                autoComplete="off"
              />
            </div>

            {mode === 'create' ? (
              <>
                {/* 1. Event Selection Grid */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-semibold text-white tracking-wide uppercase">
                      Select Events <span className="text-[#AFAEA2] font-normal normal-case">(Pick 1 or 2)</span>
                    </label>

                    {/* Counter Badge */}
                    <span
                      className={`text-[11px] font-mono px-2 py-0.5 rounded-full border ${
                        selectedEvents.length === 2
                          ? 'bg-[#D21319]/20 border-[#D21319] text-[#f87171] font-bold'
                          : selectedEvents.length === 1
                          ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                          : 'bg-white/5 border-white/10 text-[#AFAEA2]'
                      }`}
                    >
                      {selectedEvents.length} / 2 Selected {selectedEvents.length === 2 && '• Limit Reached'}
                    </span>
                  </div>

                  {/* Compact, Smooth Event Cards with Pokemon Thumbnails */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {FEST_EVENTS.map((ev) => {
                      const isSelected = selectedEvents.includes(ev.id);
                      const isLimitReached = selectedEvents.length >= 2 && !isSelected;

                      return (
                        <div
                          key={ev.id}
                          onClick={() => toggleEvent(ev.id)}
                          className={`p-2.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-2.5 select-none ${
                            isSelected
                              ? 'bg-[#181c45] border-[#D21319] shadow-[0_0_12px_rgba(210,19,25,0.25)]'
                              : isLimitReached
                              ? 'bg-[#0b0d21]/50 border-white/5 opacity-50 cursor-not-allowed'
                              : 'bg-[#0c0e25] border-white/10 hover:border-white/25 hover:bg-[#12163b]'
                          }`}
                        >
                          {/* Left: Thumbnail & Info */}
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-9 h-9 rounded-lg bg-black/40 border border-white/10 flex items-center justify-center shrink-0 overflow-hidden">
                              <img
                                src={ev.pokemonGif}
                                alt={ev.pokemon}
                                className="w-8 h-8 object-contain"
                                style={{ imageRendering: 'pixelated' }}
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src = ev.pokemonStatic;
                                }}
                              />
                            </div>
                            <div className="min-w-0">
                              <div className="text-xs font-bold text-white truncate">
                                {ev.name.split(':')[0]}
                              </div>
                              <div className="text-[10px] text-[#AFAEA2] font-mono flex items-center gap-1.5 mt-0.5">
                                <span>{ev.dayTag}</span>
                                <span>•</span>
                                <span>{ev.teamSize}</span>
                              </div>
                            </div>
                          </div>

                          {/* Right: Smooth Check Indicator */}
                          <div
                            className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 border transition-all ${
                              isSelected
                                ? 'bg-[#D21319] border-[#D21319] text-white shadow-sm'
                                : 'border-white/20 bg-transparent'
                            }`}
                          >
                            {isSelected && (
                              <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 20 20">
                                <path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" />
                              </svg>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Schedule Clash Warning */}
                  {activeClashes.length > 0 && (
                    <div className="mt-2.5 p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs space-y-0.5">
                      <span className="font-semibold block text-[11px]">Notice: Schedule Overlap Detected</span>
                      {activeClashes.map((clash, idx) => (
                        <p key={idx} className="text-[11px] text-amber-300/80">
                          • {clash}
                        </p>
                      ))}
                    </div>
                  )}
                </div>

                {/* Team Name Input */}
                <div>
                  <label className="text-xs font-medium text-white block mb-1">
                    Squad / Team Name <span className="text-[#f87171]">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={teamName}
                    onChange={(e) => setTeamName(e.target.value)}
                    placeholder="e.g. Snorlax Protocol or Cyber Charizards"
                    className="w-full bg-[#090b1c] border border-white/15 focus:border-[#D21319] focus:ring-1 focus:ring-[#D21319] rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-neutral-500 outline-none transition"
                  />
                </div>
              </>
            ) : (
              /* Join Mode with Code */
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-medium text-white block mb-1">
                    Squad Code (e.g. JRV-XXXX) <span className="text-[#f87171]">*</span>
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      required
                      value={joinCodeInput}
                      onChange={(e) => setJoinCodeInput(e.target.value.toUpperCase())}
                      placeholder="JRV-7K4M"
                      className="flex-1 bg-[#090b1c] border border-white/15 focus:border-[#D21319] focus:ring-1 focus:ring-[#D21319] rounded-xl px-3.5 py-2.5 text-xs font-mono tracking-wider text-white uppercase outline-none transition"
                    />
                    <button
                      type="button"
                      onClick={() => handleVerifyCode()}
                      disabled={isVerifyingCode}
                      className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs transition cursor-pointer border border-white/10 shrink-0"
                    >
                      {isVerifyingCode ? 'Checking...' : 'Verify'}
                    </button>
                  </div>
                </div>

                {targetTeam && (
                  <div className="p-3 rounded-xl bg-[#090b1c] border border-emerald-500/30 text-xs space-y-1">
                    <div className="flex justify-between items-center text-white font-bold">
                      <span>Squad: {targetTeam.name}</span>
                      <span className="text-emerald-400 font-mono text-[11px]">
                        {targetTeam.remainingSlots} slots open
                      </span>
                    </div>
                    <div className="text-[#AFAEA2] text-[11px]">
                      Events: {targetTeam.eventIds.join(', ')}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Participant Credentials */}
            <div className="pt-2 border-t border-white/10 space-y-3">
              <span className="text-xs font-bold text-white tracking-wide uppercase block">
                {mode === 'create' ? 'Team Leader Details' : 'Member Details'}
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] text-[#AFAEA2] block mb-1">
                    Full Name <span className="text-[#f87171]">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Ada Lovelace"
                    className="w-full bg-[#090b1c] border border-white/15 focus:border-[#D21319] focus:ring-1 focus:ring-[#D21319] rounded-lg px-3 py-2 text-xs text-white placeholder-neutral-500 outline-none transition"
                  />
                </div>

                <div>
                  <label className="text-[11px] text-[#AFAEA2] block mb-1">
                    Email Address <span className="text-[#f87171]">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="ada@slrtce.in"
                    className="w-full bg-[#090b1c] border border-white/15 focus:border-[#D21319] focus:ring-1 focus:ring-[#D21319] rounded-lg px-3 py-2 text-xs text-white placeholder-neutral-500 outline-none transition"
                  />
                </div>

                <div>
                  <label className="text-[11px] text-[#AFAEA2] block mb-1">
                    Phone / WhatsApp <span className="text-[#f87171]">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 98200 00000"
                    className="w-full bg-[#090b1c] border border-white/15 focus:border-[#D21319] focus:ring-1 focus:ring-[#D21319] rounded-lg px-3 py-2 text-xs text-white placeholder-neutral-500 outline-none transition"
                  />
                </div>

                <div>
                  <label className="text-[11px] text-[#AFAEA2] block mb-1">
                    College / Institution <span className="text-[#f87171]">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={college}
                    onChange={(e) => setCollege(e.target.value)}
                    placeholder="SLRTCE Mumbai"
                    className="w-full bg-[#090b1c] border border-white/15 focus:border-[#D21319] focus:ring-1 focus:ring-[#D21319] rounded-lg px-3 py-2 text-xs text-white placeholder-neutral-500 outline-none transition"
                  />
                </div>

                <div>
                  <label className="text-[11px] text-[#AFAEA2] block mb-1">
                    Department / Branch <span className="text-[#f87171]">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    placeholder="Computer Engineering"
                    className="w-full bg-[#090b1c] border border-white/15 focus:border-[#D21319] focus:ring-1 focus:ring-[#D21319] rounded-lg px-3 py-2 text-xs text-white placeholder-neutral-500 outline-none transition"
                  />
                </div>

                <div>
                  <label className="text-[11px] text-[#AFAEA2] block mb-1">
                    Year of Study <span className="text-[#f87171]">*</span>
                  </label>
                  <select
                    value={yearOfStudy}
                    onChange={(e) => setYearOfStudy(e.target.value)}
                    className="w-full bg-[#090b1c] border border-white/15 focus:border-[#D21319] focus:ring-1 focus:ring-[#D21319] rounded-lg px-3 py-2 text-xs text-white outline-none transition cursor-pointer"
                  >
                    <option value="1st Year (FE)">1st Year (FE)</option>
                    <option value="2nd Year (SE)">2nd Year (SE)</option>
                    <option value="3rd Year (TE)">3rd Year (TE)</option>
                    <option value="4th Year (BE)">4th Year (BE)</option>
                    <option value="Postgraduate">Postgraduate</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="text-[11px] text-[#AFAEA2] block mb-1">
                    Roll No. / College ID (Optional)
                  </label>
                  <input
                    type="text"
                    value={collegeId}
                    onChange={(e) => setCollegeId(e.target.value)}
                    placeholder="e.g. SLRTCE/2026/CS/042"
                    className="w-full bg-[#090b1c] border border-white/15 focus:border-[#D21319] focus:ring-1 focus:ring-[#D21319] rounded-lg px-3 py-2 text-xs text-white placeholder-neutral-500 outline-none transition"
                  />
                </div>
              </div>
            </div>

            {/* Submit Action Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={submitting || (mode === 'create' && selectedEvents.length === 0)}
                className="w-full py-3 rounded-xl bg-[#D21319] hover:bg-[#b00f14] disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-xs uppercase tracking-wider transition-all duration-150 shadow-lg cursor-pointer flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <span>Processing Registration...</span>
                ) : mode === 'create' ? (
                  <span>
                    Confirm Registration ({selectedEvents.length} Event{selectedEvents.length === 1 ? '' : 's'}) →
                  </span>
                ) : (
                  <span>Join Squad Roster →</span>
                )}
              </button>
            </div>
          </form>
        )}
      </motion.div>
    </div>
  );
}
