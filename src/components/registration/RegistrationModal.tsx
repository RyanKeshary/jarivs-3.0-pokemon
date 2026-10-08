'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { createClient } from '@/lib/supabase/client';
import { FEST_EVENTS, FestEventItem } from '@/components/sections/EventsLedger';
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

  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [maxWarning, setMaxWarning] = useState<string | null>(null);
  const [successData, setSuccessData] = useState<any | null>(null);
  const [copied, setCopied] = useState(false);
  const [draftRestored, setDraftRestored] = useState(false);

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
        if (parsed.fullName || parsed.email) setDraftRestored(true);
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
        setMaxWarning('STRICT DISQUALIFICATION RULE: Maximum 2 events permitted per participant. Deselect an event to change selection.');
        setTimeout(() => setMaxWarning(null), 5000);
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
      setErrorMsg(res.error || 'Squad not found. Please verify the code.');
    }
  };

  // Trigger celebration confetti
  const launchCelebration = () => {
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#D21319', '#0284c7', '#d97706', '#059669', '#9333ea']
      });
    } catch {
      // ignore
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
          throw new Error('Please select at least 1 competition discipline (maximum 2).');
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

        try {
          if (res.credentials) {
            const supabase = createClient();
            await supabase.auth.signInWithPassword({
              email: res.credentials.email,
              password: res.credentials.password,
            });
          }
          localStorage.setItem('indigo_user_registered', 'true');
          localStorage.setItem('indigo_logged_in', 'true');
          localStorage.removeItem('indigo_logged_out');
          localStorage.setItem('indigo_user_events_count', String(selectedEvents.length));
          window.dispatchEvent(new Event('auth_state_change'));
        } catch {}

        setSuccessData({
          type: 'created',
          code: res.team.code,
          name: res.team.name,
          leaderToken: res.team.leaderToken,
          eventIds: res.team.eventIds,
        });
        launchCelebration();
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

        try {
          if (res.credentials) {
            const supabase = createClient();
            await supabase.auth.signInWithPassword({
              email: res.credentials.email,
              password: res.credentials.password,
            });
          }
          localStorage.setItem('indigo_user_registered', 'true');
          localStorage.setItem('indigo_logged_in', 'true');
          localStorage.removeItem('indigo_logged_out');
          localStorage.setItem('indigo_user_events_count', '2');
          window.dispatchEvent(new Event('auth_state_change'));
        } catch {}

        setSuccessData({
          type: 'joined',
          code: res.teamCode,
          name: res.teamName,
        });
        launchCelebration();
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
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-start justify-center p-3 sm:p-6 overflow-y-auto select-none">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 16 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
        className="relative w-full max-w-2xl bg-[#FAF9F5] text-black border-2 border-black shadow-[10px_10px_0px_#000] my-4 sm:my-8 p-5 sm:p-7 overflow-y-auto max-h-[92vh]"
      >
        {/* HEADER BAR (LIGHT THEME) */}
        <div className="relative flex items-center justify-between pb-3.5 mb-4 border-b-2 border-black">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#D21319] animate-pulse border border-black" />
              <span className="font-mono text-[10px] tracking-wider text-neutral-600 uppercase font-bold">
                INDIGO TECH FEST · JARVIS 3.0
              </span>
              {draftRestored && (
                <span className="font-mono text-[9px] bg-green-100 text-green-800 px-2 py-0.2 border border-green-800 font-bold">
                  Draft Restored
                </span>
              )}
            </div>
            <h2 className="text-xl sm:text-2xl font-black font-sans uppercase tracking-tight text-black mt-1">
              Festival Enlistment & Team Roster
            </h2>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 bg-black text-white hover:bg-[#D21319] border border-black shadow-[2px_2px_0px_#000] flex items-center justify-center font-mono font-bold text-sm transition-colors cursor-pointer active:translate-x-[1px] active:translate-y-[1px]"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {/* PROMINENT DISQUALIFICATION WARNING BANNER (LIGHT THEME) */}
        <div className="relative mb-5 p-3.5 bg-red-50 border-2 border-[#D21319] shadow-[3px_3px_0px_rgba(210,19,25,0.25)] flex items-start gap-3 text-xs">
          <span className="text-xl leading-none">⚠️</span>
          <div>
            <span className="font-bold text-[#b91c1c] uppercase tracking-wide block font-mono text-[11px]">
              STRICT DISQUALIFICATION RULE: MAXIMUM 2 EVENTS PER MEMBER
            </span>
            <span className="text-neutral-800 text-[11px] leading-relaxed block mt-0.5 font-sans">
              Each student can participate in a maximum of <strong>2 events</strong> across the fest.
              Enrolling in more than 2 events will result in immediate disqualification of the participant.
            </span>
          </div>
        </div>

        {/* SUCCESS BOARDING PASS VIEW */}
        {successData ? (
          <div className="space-y-5 text-center py-4">
            <div className="w-16 h-16 mx-auto bg-green-100 border-2 border-black shadow-[4px_4px_0px_#000] flex items-center justify-center text-green-800 text-3xl font-bold">
              ✓
            </div>

            <div>
              <span className="font-mono text-xs text-neutral-600 tracking-widest uppercase block font-bold">
                Official Credential Issued
              </span>
              <h3 className="text-2xl sm:text-3xl font-black text-black uppercase mt-1">
                {successData.type === 'created' ? 'Squad Created Successfully!' : 'Enrolled into Squad!'}
              </h3>
            </div>

            {/* Credential Card */}
            <div className="p-6 bg-white border-2 border-black shadow-[6px_6px_0px_#000] text-center relative">
              <span className="font-mono text-[10px] tracking-widest text-neutral-600 uppercase block mb-1 font-bold">
                YOUR UNIQUE SQUAD CODE
              </span>
              <div className="text-4xl sm:text-5xl font-mono font-black text-[#D21319] tracking-widest my-2">
                {successData.code}
              </div>
              <div className="text-xs font-mono text-black">
                SQUAD NAME: <span className="font-bold">{successData.name}</span>
              </div>
            </div>

            {successData.type === 'created' && (
              <div className="space-y-3">
                <p className="text-xs text-neutral-700 font-sans">
                  Share this code with your teammates so they can join your squad roster:
                </p>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5">
                  <button
                    onClick={() => copyToClipboard(successData.code)}
                    className="w-full sm:w-auto px-5 py-2.5 bg-white hover:bg-neutral-100 border-2 border-black shadow-[3px_3px_0px_#000] text-black font-mono font-bold text-xs transition cursor-pointer active:translate-x-[1px] active:translate-y-[1px]"
                  >
                    {copied ? '✓ Code Copied!' : 'Copy Team Code'}
                  </button>

                  <a
                    href={`https://wa.me/?text=${encodeURIComponent(
                      `Join our team for Indigo Tech Fest (Jarvis 3.0)!\nTeam Name: ${successData.name}\nTeam Code: ${successData.code}\nJoin link: ${typeof window !== 'undefined' ? window.location.origin : ''}/join/${successData.code}`
                    )}`}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full sm:w-auto px-5 py-2.5 bg-[#25D366] hover:bg-[#20ba5a] border-2 border-black shadow-[3px_3px_0px_#000] text-black font-bold text-xs transition text-center active:translate-x-[1px] active:translate-y-[1px]"
                  >
                    Share on WhatsApp ➔
                  </a>
                </div>

                {successData.leaderToken && (
                  <div className="pt-2">
                    <a
                      href={`/team/manage/${successData.leaderToken}`}
                      className="inline-block text-xs font-mono font-bold text-[#0284c7] hover:underline"
                    >
                      Manage Squad Roster & Members [ ↗ ]
                    </a>
                  </div>
                )}
              </div>
            )}

            <div className="flex flex-col sm:flex-row items-center justify-center gap-2 pt-4">
              <button
                onClick={() => {
                  setSuccessData(null);
                  onClose();
                }}
                className="w-full sm:w-auto px-8 py-3 bg-[#D21319] hover:bg-[#b00f14] text-white border-2 border-black shadow-[4px_4px_0px_#000] font-mono text-xs font-bold uppercase tracking-wider transition cursor-pointer active:translate-x-[1px] active:translate-y-[1px]"
              >
                Done & Close Registration
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* MODE SWITCHER TABS (LIGHT EDITORIAL) */}
            <div className="grid grid-cols-2 p-1 bg-[#EFECE6] border-2 border-black text-xs font-mono">
              <button
                type="button"
                onClick={() => setMode('create')}
                className={`py-2 px-3 text-xs font-bold transition-all cursor-pointer ${
                  mode === 'create'
                    ? 'bg-black text-white shadow-[2px_2px_0px_#000]'
                    : 'text-neutral-700 hover:text-black'
                }`}
              >
                1. Create a Team
              </button>
              <button
                type="button"
                onClick={() => setMode('join')}
                className={`py-2 px-3 text-xs font-bold transition-all cursor-pointer ${
                  mode === 'join'
                    ? 'bg-black text-white shadow-[2px_2px_0px_#000]'
                    : 'text-neutral-700 hover:text-black'
                }`}
              >
                2. Join with Code
              </button>
            </div>

            {/* Error Message with Account Exists Warning */}
            {errorMsg && (
              <div className="p-3.5 bg-red-100 border-2 border-[#D21319] text-[#991b1b] text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 font-sans shadow-[3px_3px_0px_#D21319]">
                <div className="flex items-start gap-2">
                  <span className="text-lg leading-none">⚠️</span>
                  <div>
                    <span className="font-bold block font-mono text-[11px] uppercase text-[#7f1d1d]">
                      {errorMsg.toLowerCase().includes('account already exists')
                        ? 'DUPLICATE REGISTRATION DETECTED · ACCOUNT EXISTS'
                        : 'REGISTRATION WARNING'}
                    </span>
                    <span className="mt-0.5 block leading-relaxed">{errorMsg}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                  <button
                    type="button"
                    onClick={() => setErrorMsg(null)}
                    className="text-xs font-bold text-[#991b1b] hover:text-black ml-1 cursor-pointer"
                    aria-label="Dismiss error"
                  >
                    ✕
                  </button>
                </div>
              </div>
            )}

            {/* Max Event Warning */}
            {maxWarning && (
              <div className="p-3 bg-amber-100 border-2 border-amber-600 text-amber-900 text-xs flex items-center gap-2 font-mono">
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
                {/* 1. EVENT SELECTION GRID (STRICT 2 EVENT ENFORCEMENT) */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-bold text-black tracking-wide uppercase font-mono">
                      Select Events <span className="text-neutral-600 font-normal normal-case">(Pick 1 or 2 Only)</span>
                    </label>

                    {/* Counter Badge */}
                    <span
                      className={`text-[11px] font-mono px-2.5 py-0.5 border border-black shadow-[2px_2px_0px_#000] ${
                        selectedEvents.length === 2
                          ? 'bg-[#D21319] text-white font-bold'
                          : selectedEvents.length === 1
                          ? 'bg-green-100 text-green-900 font-bold'
                          : 'bg-white text-black'
                      }`}
                    >
                      {selectedEvents.length} / 2 Selected {selectedEvents.length === 2 && '• MAXIMUM LIMIT REACHED'}
                    </span>
                  </div>

                  {/* 7 Interactive Event Selection Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {FEST_EVENTS.map((ev) => {
                      const isSelected = selectedEvents.includes(ev.id);
                      const isLimitReached = selectedEvents.length >= 2 && !isSelected;

                      return (
                        <div
                          key={ev.id}
                          onClick={() => toggleEvent(ev.id)}
                          className={`p-2.5 border-2 transition-all cursor-pointer flex items-center justify-between gap-2.5 select-none ${
                            isSelected
                              ? 'bg-[#FFF5F5] border-[#D21319] shadow-[3px_3px_0px_#D21319] ring-1 ring-[#D21319]'
                              : isLimitReached
                              ? 'bg-neutral-100 border-neutral-300 opacity-50 cursor-not-allowed'
                              : 'bg-white border-black hover:bg-[#F9F7F1] shadow-[2px_2px_0px_#000]'
                          }`}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <div className="w-9 h-9 border border-black bg-neutral-100 flex items-center justify-center shrink-0 overflow-hidden">
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
                              <div className="text-xs font-bold text-black truncate font-sans">
                                {ev.name.split(':')[0]}
                              </div>
                              <div className="text-[10px] text-neutral-600 flex items-center gap-1.5 mt-0.5 font-mono">
                                <span className="font-bold text-[#D21319]">{ev.dayTag}</span>
                                <span>•</span>
                                <span>{ev.teamSize}</span>
                              </div>
                            </div>
                          </div>

                          <div
                            className={`w-5 h-5 border border-black flex items-center justify-center shrink-0 transition ${
                              isSelected
                                ? 'bg-[#D21319] text-white font-bold'
                                : isLimitReached
                                ? 'bg-neutral-200 text-neutral-500'
                                : 'bg-white'
                            }`}
                          >
                            {isSelected ? '✓' : isLimitReached ? '🔒' : ''}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Schedule Clash Warning Alert */}
                  {activeClashes.length > 0 && (
                    <div className="mt-2.5 p-2.5 bg-amber-50 border-2 border-amber-600 text-amber-900 text-xs space-y-1">
                      <span className="font-bold flex items-center gap-1.5 font-mono">
                        <span>⚠️</span> Schedule Overlap Notice:
                      </span>
                      {activeClashes.map((c, i) => (
                        <div key={i} className="text-[11px] pl-5 font-sans">
                          • {c}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Squad / Team Name */}
                <div>
                  <label className="text-xs font-mono font-bold text-black tracking-wide uppercase block mb-1">
                    Squad / Team Name <span className="text-[#D21319]">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={teamName}
                    onChange={(e) => setTeamName(e.target.value)}
                    placeholder="e.g. Snorlax Protocol or Cyber Charizards"
                    className="w-full bg-white border-2 border-black shadow-[2px_2px_0px_#000] focus:border-[#D21319] px-3.5 py-2 text-xs text-black placeholder:text-neutral-400 outline-none transition font-sans"
                  />
                </div>
              </>
            ) : (
              /* JOIN SQUAD MODE */
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-mono font-bold text-black tracking-wide uppercase block mb-1">
                    Enter Squad Code <span className="text-[#D21319]">*</span>
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      required
                      value={joinCodeInput}
                      onChange={(e) => setJoinCodeInput(e.target.value.toUpperCase())}
                      placeholder="e.g. JRV-ABCD"
                      className="flex-1 bg-white border-2 border-black shadow-[2px_2px_0px_#000] focus:border-[#D21319] px-3.5 py-2 text-xs text-black font-mono uppercase tracking-widest placeholder:text-neutral-400 outline-none transition"
                    />
                    <button
                      type="button"
                      onClick={() => handleVerifyCode()}
                      disabled={isVerifyingCode || !joinCodeInput.trim()}
                      className="px-4 py-2 bg-black hover:bg-[#D21319] text-white border-2 border-black shadow-[2px_2px_0px_#000] font-mono text-xs font-bold transition cursor-pointer disabled:opacity-50 active:translate-x-[1px] active:translate-y-[1px]"
                    >
                      {isVerifyingCode ? 'Checking...' : 'Verify Squad'}
                    </button>
                  </div>
                </div>

                {/* Verified Squad Preview */}
                {targetTeam && (
                  <div className="p-3.5 bg-white border-2 border-black shadow-[3px_3px_0px_#000] text-xs space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[10px] bg-green-100 text-green-900 border border-black font-bold uppercase px-1.5 py-0.5">
                        ✓ Squad Verified
                      </span>
                      <span className="font-mono text-xs text-black font-bold">{targetTeam.code}</span>
                    </div>
                    <div className="text-sm font-bold text-black font-sans">{targetTeam.name}</div>
                    <div className="text-[11px] text-neutral-700 font-mono">
                      Disciplines: {(targetTeam.event_ids || targetTeam.eventIds || []).join(', ')}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* PARTICIPANT CREDENTIALS SECTION */}
            <div className="pt-3 border-t-2 border-black space-y-2.5">
              <span className="text-xs font-mono font-bold text-black tracking-wide uppercase block">
                {mode === 'create' ? 'Team Leader Information' : 'Participant Credentials'}
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="text-[11px] font-mono text-neutral-700 font-bold block mb-1">
                    Full Name <span className="text-[#D21319]">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Ada Lovelace"
                    className="w-full bg-white border-2 border-black shadow-[2px_2px_0px_#000] focus:border-[#D21319] px-3 py-1.5 text-xs text-black placeholder:text-neutral-400 outline-none transition font-sans"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-mono text-neutral-700 font-bold block mb-1">
                    Email Address <span className="text-[#D21319]">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="ada@slrtce.in"
                    className="w-full bg-white border-2 border-black shadow-[2px_2px_0px_#000] focus:border-[#D21319] px-3 py-1.5 text-xs text-black placeholder:text-neutral-400 outline-none transition font-sans"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-mono text-neutral-700 font-bold block mb-1">
                    Phone / WhatsApp <span className="text-[#D21319]">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 98200 00000"
                    className="w-full bg-white border-2 border-black shadow-[2px_2px_0px_#000] focus:border-[#D21319] px-3 py-1.5 text-xs text-black placeholder:text-neutral-400 outline-none transition font-sans"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-mono text-neutral-700 font-bold block mb-1">
                    College / Institution <span className="text-[#D21319]">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={college}
                    onChange={(e) => setCollege(e.target.value)}
                    placeholder="SLRTCE Mumbai"
                    className="w-full bg-white border-2 border-black shadow-[2px_2px_0px_#000] focus:border-[#D21319] px-3 py-1.5 text-xs text-black placeholder:text-neutral-400 outline-none transition font-sans"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-mono text-neutral-700 font-bold block mb-1">
                    Department / Branch <span className="text-[#D21319]">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    placeholder="Computer Engineering"
                    className="w-full bg-white border-2 border-black shadow-[2px_2px_0px_#000] focus:border-[#D21319] px-3 py-1.5 text-xs text-black placeholder:text-neutral-400 outline-none transition font-sans"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-mono text-neutral-700 font-bold block mb-1">
                    Year of Study <span className="text-[#D21319]">*</span>
                  </label>
                  <select
                    value={yearOfStudy}
                    onChange={(e) => setYearOfStudy(e.target.value)}
                    className="w-full bg-white border-2 border-black shadow-[2px_2px_0px_#000] focus:border-[#D21319] px-3 py-1.5 text-xs text-black outline-none transition cursor-pointer font-sans"
                  >
                    <option value="1st Year (FE)">1st Year (FE)</option>
                    <option value="2nd Year (SE)">2nd Year (SE)</option>
                    <option value="3rd Year (TE)">3rd Year (TE)</option>
                    <option value="4th Year (BE)">4th Year (BE)</option>
                    <option value="Postgraduate">Postgraduate</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="text-[11px] font-mono text-neutral-700 font-bold block mb-1">
                    Roll No. / College ID (Optional)
                  </label>
                  <input
                    type="text"
                    value={collegeId}
                    onChange={(e) => setCollegeId(e.target.value)}
                    placeholder="e.g. SLRTCE/2026/CS/042"
                    className="w-full bg-white border-2 border-black shadow-[2px_2px_0px_#000] focus:border-[#D21319] px-3 py-1.5 text-xs text-black placeholder:text-neutral-400 outline-none transition font-sans"
                  />
                </div>
              </div>
            </div>

            {/* ACTION SUBMIT BUTTON */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={submitting || (mode === 'create' && selectedEvents.length === 0)}
                className="w-full py-3 bg-[#D21319] hover:bg-[#b00f14] disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-xs uppercase tracking-wider transition-all border-2 border-black shadow-[4px_4px_0px_#000] active:translate-x-[2px] active:translate-y-[2px] cursor-pointer flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <span>Recording Credentials...</span>
                ) : mode === 'create' ? (
                  <span>
                    Confirm Registration ({selectedEvents.length} Event{selectedEvents.length === 1 ? '' : 's'}) ➔
                  </span>
                ) : (
                  <span>Join Squad Roster ➔</span>
                )}
              </button>
            </div>
          </form>
        )}
      </motion.div>
    </div>
  );
}
