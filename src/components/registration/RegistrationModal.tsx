'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
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
  // 3-Step Wizard Navigation State
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);

  const [mode, setMode] = useState<'create' | 'join'>('create');

  // Step 1: Events Selection
  const [selectedEvents, setSelectedEvents] = useState<string[]>([]);

  // Step 2: Personal Information
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [college, setCollege] = useState('SLRTCE Mumbai');
  const [department, setDepartment] = useState('');
  const [yearOfStudy, setYearOfStudy] = useState('3rd Year (TE)');
  const [division, setDivision] = useState('');
  const [rollNo, setRollNo] = useState('');
  const [referenceId, setReferenceId] = useState('');

  // Step 3: Squad Details
  const [teamName, setTeamName] = useState('');
  const [joinCodeInput, setJoinCodeInput] = useState('');
  const [targetTeam, setTargetTeam] = useState<any | null>(null);
  const [isVerifyingCode, setIsVerifyingCode] = useState(false);
  const [honeypot, setHoneypot] = useState('');

  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [stepError, setStepError] = useState<string | null>(null);
  const [maxWarning, setMaxWarning] = useState<string | null>(null);
  const [successData, setSuccessData] = useState<any | null>(null);
  const [copied, setCopied] = useState(false);
  const [draftRestored, setDraftRestored] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen) {
      const prevOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = prevOverflow;
      };
    }
  }, [isOpen]);

  // Load draft from localStorage on initial render (do NOT prefill email/login ID)
  useEffect(() => {
    try {
      const savedDraft = localStorage.getItem('indigo_reg_draft');
      if (savedDraft) {
        const parsed = JSON.parse(savedDraft);
        if (parsed.fullName) setFullName(parsed.fullName);
        // Do not prefill login id / email - keep blank
        if (parsed.phone) setPhone(parsed.phone);
        if (parsed.college) setCollege(parsed.college);
        if (parsed.department) setDepartment(parsed.department);
        if (parsed.yearOfStudy) setYearOfStudy(parsed.yearOfStudy);
        if (parsed.division) setDivision(parsed.division);
        if (parsed.rollNo) setRollNo(parsed.rollNo);
        if (parsed.referenceId) setReferenceId(parsed.referenceId);
        if (parsed.teamName) setTeamName(parsed.teamName);
        if (parsed.fullName) setDraftRestored(true);
      }
    } catch {
      // ignore
    }
  }, []);

  // Save draft locally on input change (exclude email so login ID is never prefilled)
  useEffect(() => {
    try {
      localStorage.setItem(
        'indigo_reg_draft',
        JSON.stringify({
          fullName,
          phone,
          college,
          department,
          yearOfStudy,
          division,
          rollNo,
          referenceId,
          teamName,
        })
      );
    } catch {
      // ignore
    }
  }, [fullName, phone, college, department, yearOfStudy, division, rollNo, referenceId, teamName]);

  // Preselection & Join Code handling
  useEffect(() => {
    if (preselectedEventId) {
      setSelectedEvents([preselectedEventId]);
      setMode('create');
    }
    if (initialJoinCode) {
      setJoinCodeInput(initialJoinCode);
      setMode('join');
      setCurrentStep(3);
      handleVerifyCode(initialJoinCode);
    }
  }, [preselectedEventId, initialJoinCode]);

  // Toggle Event Selection with strict Max 2 rule
  const toggleEvent = (id: string) => {
    setMaxWarning(null);
    setStepError(null);
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
    setStepError(null);
    setErrorMsg(null);
    const res = await getFestTeamByCode(code);
    setIsVerifyingCode(false);

    if (res.success && res.team) {
      setTargetTeam(res.team);
      const evIds = (res.team as any).eventIds || (res.team as any).event_ids;
      if (evIds && evIds.length > 0) {
        setSelectedEvents(evIds);
      }
    } else {
      setTargetTeam(null);
      setStepError(res.error || 'Squad not found. Please verify the code.');
    }
  };

  // Step 1 Validation
  const validateStep1 = () => {
    if (mode === 'create' && selectedEvents.length === 0) {
      setStepError('Please select at least 1 competition discipline (max 2) to continue.');
      return false;
    }
    setStepError(null);
    return true;
  };

  // Step 2 Validation
  const validateStep2 = () => {
    if (!fullName.trim()) {
      setStepError('Please enter your full name.');
      return false;
    }
    const emailTrimmed = email.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailTrimmed || !emailRegex.test(emailTrimmed)) {
      setStepError('Please enter a valid email address.');
      return false;
    }
    if (!emailTrimmed.endsWith('@slrtce.in')) {
      setStepError('Only official SLRTCE institutional email addresses (@slrtce.in) are allowed.');
      return false;
    }
    const cleanPhone = phone.trim().replace(/\D/g, '');
    if (cleanPhone.length !== 10) {
      setStepError('Please enter a valid 10-digit WhatsApp/phone number (numbers only).');
      return false;
    }
    if (!college.trim()) {
      setStepError('Please specify your college or institution.');
      return false;
    }
    if (!department.trim()) {
      setStepError('Please specify your department or engineering branch.');
      return false;
    }
    if (!division.trim()) {
      setStepError('Please specify your division (e.g. A, B, C).');
      return false;
    }
    if (!rollNo.trim()) {
      setStepError('Please specify your roll number.');
      return false;
    }
    if (!referenceId.trim()) {
      setStepError('Please enter your Reference ID from your college ID card.');
      return false;
    }
    setStepError(null);
    return true;
  };

  const handleNextFromStep1 = () => {
    if (validateStep1()) {
      setCurrentStep(2);
    }
  };

  const handleNextFromStep2 = () => {
    if (validateStep2()) {
      setCurrentStep(3);
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

  // Final Submit Handler (Step 3)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setStepError(null);

    if (mode === 'create') {
      if (!teamName.trim()) {
        const isSolo =
          selectedEvents.length === 1 &&
          FEST_EVENTS.find((ev) => ev.id === selectedEvents[0])?.maxSize === 1;
        if (!isSolo) {
          setErrorMsg('Please enter a squad name to represent your team.');
          return;
        }
      }
    } else {
      if (!joinCodeInput.trim()) {
        setErrorMsg('Please enter your 8-character squad join code.');
        return;
      }
    }

    setSubmitting(true);

    try {
      if (mode === 'create') {
        const isSolo =
          selectedEvents.length === 1 &&
          FEST_EVENTS.find((ev) => ev.id === selectedEvents[0])?.maxSize === 1;
        const finalTeamName = isSolo && !teamName.trim() ? `${fullName.trim()}'s Squad` : teamName;

        const res = await createFestTeam({
          teamName: finalTeamName,
          eventIds: selectedEvents,
          leader: {
            fullName: fullName.trim(),
            email: email.trim().toLowerCase(),
            phone: phone.trim().replace(/\D/g, '').slice(0, 10),
            college: college.trim(),
            department: department.trim(),
            yearOfStudy: yearOfStudy.trim(),
            division: division.trim().toUpperCase(),
            rollNo: rollNo.trim(),
            referenceId: referenceId.trim(),
            collegeId: referenceId.trim(),
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
          localStorage.removeItem('indigo_reg_draft');
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
        const res = await joinFestTeam({
          code: joinCodeInput.trim(),
          member: {
            fullName: fullName.trim(),
            email: email.trim().toLowerCase(),
            phone: phone.trim().replace(/\D/g, '').slice(0, 10),
            college: college.trim(),
            department: department.trim(),
            yearOfStudy: yearOfStudy.trim(),
            division: division.trim().toUpperCase(),
            rollNo: rollNo.trim(),
            referenceId: referenceId.trim(),
            collegeId: referenceId.trim(),
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
          localStorage.removeItem('indigo_reg_draft');
          window.dispatchEvent(new Event('auth_state_change'));
        } catch {}

        setSuccessData({
          type: 'joined',
          code: res.teamCode,
          name: res.teamName,
          eventIds: targetTeam?.event_ids || selectedEvents,
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

  if (!isOpen || !mounted || typeof document === 'undefined') return null;

  const modalContent = (
    <div className="fixed inset-0 z-[100] bg-black/75 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 select-none overflow-hidden">
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.96 }}
        transition={{ duration: 0.16, ease: 'easeOut' }}
        className="relative w-full max-w-2xl bg-[#FAF9F5] text-black border-2 border-black shadow-[8px_8px_0px_#000] p-3.5 sm:p-4 flex flex-col max-h-[94vh] sm:max-h-[90vh] overflow-hidden"
      >
        {/* HEADER BAR */}
        <div className="relative flex items-center justify-between pb-2 mb-2 border-b-2 border-black flex-shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#D21319] animate-pulse border border-black" />
              <span className="font-mono text-[10px] tracking-wider text-neutral-600 uppercase font-bold">
                INDIGO TECH FEST · JARVIS 3.0
              </span>
              {draftRestored && (
                <span className="font-mono text-[9px] bg-green-100 text-green-800 px-1.5 py-0.2 border border-green-800 font-bold">
                  Draft Restored
                </span>
              )}
            </div>
            <h2 className="text-lg sm:text-xl font-black font-sans uppercase tracking-tight text-black mt-0.5">
              Festival Enlistment & Team Roster
            </h2>
          </div>

          <button
            onClick={onClose}
            className="w-7 h-7 bg-black text-white hover:bg-[#D21319] border border-black shadow-[2px_2px_0px_#000] flex items-center justify-center font-mono font-bold text-xs transition-colors cursor-pointer active:translate-x-[1px] active:translate-y-[1px]"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {/* COMPACT DISQUALIFICATION WARNING BANNER - NO TRUNCATION */}
        <div className="relative mb-2 px-2.5 py-1.5 bg-red-50 border-2 border-[#D21319] flex items-center justify-between gap-1.5 text-xs flex-shrink-0">
          <div className="flex items-center gap-1.5 min-w-0 flex-1">
            <span className="text-sm leading-none shrink-0">⚠️</span>
            <div className="flex flex-col sm:flex-row sm:items-center sm:gap-2 leading-tight">
              <span className="font-mono text-[10px] sm:text-[11px] font-black text-[#b91c1c] uppercase tracking-tight whitespace-normal">
                STRICT RULE: MAX 2 EVENTS PER MEMBER
              </span>
              <span className="hidden md:inline text-neutral-700 text-[9px] font-sans">
                (Disqualification if enrolled in &gt; 2 events)
              </span>
            </div>
          </div>
          <span className="text-[9px] font-mono font-black bg-[#D21319] text-white px-1.5 py-0.5 shrink-0 border border-black shadow-[1px_1px_0px_#000]">
            MAX 2
          </span>
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

            {/* EVENT WHATSAPP GROUPS PROMINENT JOIN LINKS */}
            {successData.eventIds && successData.eventIds.length > 0 && (
              <div className="p-4 bg-emerald-50 border-2 border-emerald-800 shadow-[3px_3px_0px_#065f46] text-left space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-lg">💬</span>
                  <span className="font-mono text-xs font-bold text-emerald-900 uppercase">
                    Join Your Event Official WhatsApp Groups:
                  </span>
                </div>
                <p className="text-[11px] text-emerald-800">
                  Stay updated with live slot calls, problem announcements, and round schedules:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                  {successData.eventIds.map((evId: string) => {
                    const ev = FEST_EVENTS.find((e) => e.id === evId);
                    if (!ev || !ev.whatsappLink) return null;
                    return (
                      <a
                        key={evId}
                        href={ev.whatsappLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2.5 bg-white border-2 border-black hover:bg-emerald-100 flex items-center justify-between gap-2 shadow-[2px_2px_0px_#000] text-xs font-mono font-bold text-black transition cursor-pointer"
                      >
                        <span className="truncate">{ev.title}</span>
                        <span className="text-emerald-700 shrink-0">Join ➔</span>
                      </a>
                    );
                  })}
                </div>
              </div>
            )}

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
                      `Join our team for Indigo Tech Fest (Jarvis 3.0)!\nTeam Name: ${successData.name}\nTeam Code: ${successData.code}`
                    )}`}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full sm:w-auto px-5 py-2.5 bg-[#25D366] hover:bg-[#20ba5a] border-2 border-black shadow-[3px_3px_0px_#000] text-black font-bold text-xs transition text-center active:translate-x-[1px] active:translate-y-[1px]"
                  >
                    Share on WhatsApp ➔
                  </a>
                </div>
              </div>
            )}

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
              <button
                onClick={() => {
                  setSuccessData(null);
                  onClose();
                  router.push('/dashboard');
                }}
                className="w-full sm:w-auto px-8 py-3 bg-[#D21319] hover:bg-[#b00f14] text-white border-2 border-black shadow-[4px_4px_0px_#000] font-mono text-xs font-bold uppercase tracking-wider transition cursor-pointer active:translate-x-[1px] active:translate-y-[1px]"
              >
                Proceed to Dashboard ➔
              </button>
            </div>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto space-y-2.5 pr-0.5">
            {/* 3-STEP PROGRESS STEPPER */}
            <div className="p-1 bg-[#EFECE6] border-2 border-black flex-shrink-0">
              <div className="grid grid-cols-3 gap-1 text-center font-mono">
                {/* Step 1 */}
                <button
                  type="button"
                  onClick={() => setCurrentStep(1)}
                  className={`py-1.5 px-0.5 sm:px-1 border border-black flex items-center justify-center gap-1 transition cursor-pointer ${
                    currentStep === 1
                      ? 'bg-black text-white font-bold shadow-[1.5px_1.5px_0px_#000]'
                      : currentStep > 1
                      ? 'bg-green-100 text-green-900 font-bold'
                      : 'bg-white text-neutral-600'
                  }`}
                >
                  <span className="w-3.5 h-3.5 rounded-full bg-current text-[8.5px] flex items-center justify-center text-white shrink-0 font-bold">
                    {currentStep > 1 ? '✓' : '1'}
                  </span>
                  <span className="text-[9.5px] sm:text-xs uppercase tracking-wider whitespace-nowrap">
                    1. Events
                  </span>
                </button>

                {/* Step 2 */}
                <button
                  type="button"
                  onClick={() => {
                    if (validateStep1()) setCurrentStep(2);
                  }}
                  className={`py-1.5 px-0.5 sm:px-1 border border-black flex items-center justify-center gap-1 transition cursor-pointer ${
                    currentStep === 2
                      ? 'bg-black text-white font-bold shadow-[1.5px_1.5px_0px_#000]'
                      : currentStep > 2
                      ? 'bg-green-100 text-green-900 font-bold'
                      : 'bg-white text-neutral-600'
                  }`}
                >
                  <span className="w-3.5 h-3.5 rounded-full bg-current text-[8.5px] flex items-center justify-center text-white shrink-0 font-bold">
                    {currentStep > 2 ? '✓' : '2'}
                  </span>
                  <span className="text-[9.5px] sm:text-xs uppercase tracking-wider whitespace-nowrap">
                    <span className="hidden xs:inline">2. Personal</span>
                    <span className="xs:hidden">2. You</span>
                  </span>
                </button>

                {/* Step 3 */}
                <button
                  type="button"
                  onClick={() => {
                    if (validateStep1() && validateStep2()) setCurrentStep(3);
                  }}
                  className={`py-1.5 px-0.5 sm:px-1 border border-black flex items-center justify-center gap-1 transition cursor-pointer ${
                    currentStep === 3
                      ? 'bg-black text-white font-bold shadow-[1.5px_1.5px_0px_#000]'
                      : 'bg-white text-neutral-600'
                  }`}
                >
                  <span className="w-3.5 h-3.5 rounded-full bg-current text-[8.5px] flex items-center justify-center text-white shrink-0 font-bold">
                    3
                  </span>
                  <span className="text-[9.5px] sm:text-xs uppercase tracking-wider whitespace-nowrap">
                    3. Squad
                  </span>
                </button>
              </div>
            </div>

            {/* Error Message with Account Exists Warning */}
            {errorMsg && (
              <div className="p-2.5 bg-red-100 border-2 border-[#D21319] text-[#991b1b] text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 font-sans shadow-[2px_2px_0px_#D21319]">
                <div className="flex items-start gap-1.5">
                  <span className="text-base leading-none">⚠️</span>
                  <div>
                    <span className="font-bold block font-mono text-[10px] uppercase text-[#7f1d1d]">
                      {errorMsg.toLowerCase().includes('account already exists')
                        ? 'DUPLICATE REGISTRATION DETECTED · ACCOUNT EXISTS'
                        : 'REGISTRATION WARNING'}
                    </span>
                    <span className="mt-0.5 block leading-relaxed text-[11px]">{errorMsg}</span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
                  {errorMsg.toLowerCase().includes('account already exists') && (
                    <a
                      href="/dashboard"
                      className="px-2.5 py-1 bg-[#D21319] text-white font-mono font-bold text-[10px] uppercase border border-black shadow-[1.5px_1.5px_0px_#000]"
                    >
                      Login to Dashboard ➔
                    </a>
                  )}
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

            {stepError && (
              <div className="p-2 bg-red-50 border-2 border-red-500 text-red-900 text-xs flex items-center justify-between gap-2 font-mono">
                <div className="flex items-center gap-1.5">
                  <span>⚠️</span>
                  <span>{stepError}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setStepError(null)}
                  className="font-bold cursor-pointer text-red-700"
                >
                  ✕
                </button>
              </div>
            )}

            {/* Max Event Warning */}
            {maxWarning && (
              <div className="p-2 bg-amber-100 border-2 border-amber-600 text-amber-900 text-xs flex items-center gap-1.5 font-mono">
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

            {/* STEP 1: EVENT SELECTION (COMPACT FIT) */}
            {currentStep === 1 && (
              <div className="space-y-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 pb-1">
                  <div>
                    <h3 className="text-xs font-black uppercase font-sans text-black">
                      Step 1: Select Your Competitions
                    </h3>
                    <p className="text-[10px] font-mono text-neutral-600 leading-tight">
                      Pick 1 or 2 disciplines only. Teams are allocated per discipline.
                    </p>
                  </div>

                  {/* Counter Badge */}
                  <span
                    className={`self-start sm:self-auto text-[10px] font-mono px-2 py-0.5 border border-black shadow-[1.5px_1.5px_0px_#000] shrink-0 ${
                      selectedEvents.length === 2
                        ? 'bg-[#D21319] text-white font-bold'
                        : selectedEvents.length === 1
                        ? 'bg-green-100 text-green-900 font-bold'
                        : 'bg-white text-black font-bold'
                    }`}
                  >
                    {selectedEvents.length} / 2 Selected
                  </span>
                </div>

                {/* 7 Interactive Compact Event Selection Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                  {FEST_EVENTS.map((ev) => {
                    const isSelected = selectedEvents.includes(ev.id);
                    const isLimitReached = selectedEvents.length >= 2 && !isSelected;

                    return (
                      <div
                        key={ev.id}
                        onClick={() => toggleEvent(ev.id)}
                        className={`px-2.5 py-1.5 border-2 transition-all cursor-pointer flex items-center justify-between gap-2 select-none ${
                          isSelected
                            ? 'bg-[#FFF5F5] border-[#D21319] shadow-[2px_2px_0px_#D21319] ring-1 ring-[#D21319]'
                            : isLimitReached
                            ? 'bg-neutral-100 border-neutral-300 opacity-50 cursor-not-allowed'
                            : 'bg-white border-black hover:bg-[#F9F7F1] shadow-[1.5px_1.5px_0px_#000]'
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="w-8 h-8 border border-black bg-neutral-100 flex items-center justify-center shrink-0 overflow-hidden">
                            <img
                              src={ev.pokemonGif}
                              alt={ev.pokemon}
                              className="w-6 h-6 object-contain"
                              style={{ imageRendering: 'pixelated' }}
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = ev.pokemonStatic;
                              }}
                            />
                          </div>
                          <div className="min-w-0">
                            <div className="text-xs font-black text-black truncate font-sans uppercase leading-tight">
                              {ev.title}
                            </div>
                            <div className="text-[10px] text-neutral-600 truncate font-mono leading-tight">
                              <span className="font-bold text-[#D21319]">{ev.dayTag}</span> • {ev.teamSize}
                            </div>
                          </div>
                        </div>

                        <div
                          className={`w-5 h-5 border-2 border-black flex items-center justify-center shrink-0 transition font-mono ${
                            isSelected
                              ? 'bg-[#D21319] text-white font-bold text-xs'
                              : isLimitReached
                              ? 'bg-neutral-200 text-neutral-500 text-[10px]'
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
                  <div className="p-2 bg-amber-50 border-2 border-amber-600 text-amber-900 text-xs space-y-0.5">
                    <span className="font-bold flex items-center gap-1.5 font-mono text-[11px]">
                      <span>⚠️</span> Schedule Overlap Notice:
                    </span>
                    {activeClashes.map((c, i) => (
                      <div key={i} className="text-[10px] pl-4 font-sans">
                        • {c}
                      </div>
                    ))}
                  </div>
                )}

                {/* Step 1 Actions */}
                <div className="pt-2 flex items-center justify-between gap-2.5">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-3.5 py-1.5 bg-white hover:bg-neutral-100 border-2 border-black shadow-[2px_2px_0px_#000] text-xs font-mono font-bold text-black transition cursor-pointer"
                  >
                    Cancel
                  </button>

                  <button
                    type="button"
                    onClick={handleNextFromStep1}
                    disabled={selectedEvents.length === 0}
                    className="px-5 py-1.5 bg-[#D21319] hover:bg-[#b00f14] disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-xs uppercase tracking-wider transition-all border-2 border-black shadow-[2px_2px_0px_#000] active:translate-x-[1px] active:translate-y-[1px] cursor-pointer flex items-center gap-1.5"
                  >
                    <span>Proceed to Personal Info</span>
                    <span>➔</span>
                  </button>
                </div>
              </div>
            )}

            {/* STEP 2: PERSONAL INFORMATION */}
            {currentStep === 2 && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-black uppercase font-sans text-black">
                    Step 2: Personal Information & Credentials
                  </h3>
                  <p className="text-[11px] font-mono text-neutral-600">
                    Official participant record for festival credentialing & badges.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-white p-4 border-2 border-black shadow-[2px_2px_0px_#000]">
                  <div>
                    <label className="text-[11px] font-mono text-neutral-800 font-bold block mb-1">
                      Full Name <span className="text-[#D21319]">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="e.g. Ada Lovelace"
                      className="w-full bg-[#FAF9F5] border-2 border-black focus:border-[#D21319] px-3 py-2 text-xs text-black placeholder:text-neutral-400 outline-none transition font-sans"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-mono text-neutral-800 font-bold block mb-1">
                      SLRTCE Email ID <span className="text-[#D21319]">*</span>
                    </label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter your @slrtce.in ID"
                      autoComplete="off"
                      className="w-full bg-[#FAF9F5] border-2 border-black focus:border-[#D21319] px-3 py-2 text-xs text-black placeholder:text-neutral-400 outline-none transition font-sans"
                    />
                    <span className="text-[10px] text-neutral-500 font-mono mt-0.5 block">
                      Must end with @slrtce.in
                    </span>
                  </div>

                  <div>
                    <label className="text-[11px] font-mono text-neutral-800 font-bold block mb-1">
                      WhatsApp Number <span className="text-[#D21319]">*</span>
                    </label>
                    <input
                      type="tel"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={10}
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                      placeholder="e.g. 9876543210 (10 digits)"
                      className="w-full bg-[#FAF9F5] border-2 border-black focus:border-[#D21319] px-3 py-2 text-xs text-black placeholder:text-neutral-400 outline-none transition font-sans"
                    />
                    <span className="text-[10px] text-neutral-500 font-mono mt-0.5 block">
                      Numbers only (10 digits)
                    </span>
                  </div>

                  <div>
                    <label className="text-[11px] font-mono text-neutral-800 font-bold block mb-1">
                      College / Institution <span className="text-[#D21319]">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={college}
                      onChange={(e) => setCollege(e.target.value)}
                      placeholder="SLRTCE Mumbai"
                      className="w-full bg-[#FAF9F5] border-2 border-black focus:border-[#D21319] px-3 py-2 text-xs text-black placeholder:text-neutral-400 outline-none transition font-sans"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-mono text-neutral-800 font-bold block mb-1">
                      Department / Branch <span className="text-[#D21319]">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                      placeholder="Computer Engineering"
                      className="w-full bg-[#FAF9F5] border-2 border-black focus:border-[#D21319] px-3 py-2 text-xs text-black placeholder:text-neutral-400 outline-none transition font-sans"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-mono text-neutral-800 font-bold block mb-1">
                      Year of Study <span className="text-[#D21319]">*</span>
                    </label>
                    <select
                      value={yearOfStudy}
                      onChange={(e) => setYearOfStudy(e.target.value)}
                      className="w-full bg-[#FAF9F5] border-2 border-black focus:border-[#D21319] px-3 py-2 text-xs text-black outline-none transition cursor-pointer font-sans"
                    >
                      <option value="1st Year (FE)">1st Year (FE)</option>
                      <option value="2nd Year (SE)">2nd Year (SE)</option>
                      <option value="3rd Year (TE)">3rd Year (TE)</option>
                      <option value="4th Year (BE)">4th Year (BE)</option>
                      <option value="Postgraduate">Postgraduate</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] font-mono text-neutral-800 font-bold block mb-1">
                      Division <span className="text-[#D21319]">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={division}
                      onChange={(e) => setDivision(e.target.value.toUpperCase())}
                      placeholder="e.g. A / B / C"
                      className="w-full bg-[#FAF9F5] border-2 border-black focus:border-[#D21319] px-3 py-2 text-xs text-black placeholder:text-neutral-400 outline-none transition font-sans uppercase"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-mono text-neutral-800 font-bold block mb-1">
                      Roll No. <span className="text-[#D21319]">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={rollNo}
                      onChange={(e) => setRollNo(e.target.value)}
                      placeholder="e.g. 42"
                      className="w-full bg-[#FAF9F5] border-2 border-black focus:border-[#D21319] px-3 py-2 text-xs text-black placeholder:text-neutral-400 outline-none transition font-sans"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="text-[11px] font-mono text-neutral-800 font-bold block mb-1">
                      Reference ID (from your ID card) <span className="text-[#D21319]">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={referenceId}
                      onChange={(e) => setReferenceId(e.target.value)}
                      placeholder="e.g. Reference ID printed on your college ID card"
                      className="w-full bg-[#FAF9F5] border-2 border-black focus:border-[#D21319] px-3 py-2 text-xs text-black placeholder:text-neutral-400 outline-none transition font-sans"
                    />
                    <span className="text-[10px] text-neutral-500 font-mono mt-0.5 block">
                      Mandatory · Enter the reference ID as printed on your SLRTCE ID card
                    </span>
                  </div>
                </div>

                {/* Step 2 Actions */}
                <div className="pt-2 flex items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => setCurrentStep(1)}
                    className="px-4 py-2.5 bg-white hover:bg-neutral-100 border-2 border-black shadow-[2px_2px_0px_#000] text-xs font-mono font-bold text-black transition cursor-pointer flex items-center gap-1.5"
                  >
                    <span>←</span>
                    <span>Back to Events</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleNextFromStep2}
                    className="px-6 py-2.5 bg-[#D21319] hover:bg-[#b00f14] text-white font-bold text-xs uppercase tracking-wider transition-all border-2 border-black shadow-[3px_3px_0px_#000] active:translate-x-[1px] active:translate-y-[1px] cursor-pointer flex items-center gap-1.5"
                  >
                    <span>Proceed to Squad Setup</span>
                    <span>➔</span>
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3: JOIN OR CREATE SQUAD & SUBMIT */}
            {currentStep === 3 && (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <h3 className="text-sm font-black uppercase font-sans text-black">
                    Step 3: Squad Alliance & Enlistment
                  </h3>
                  <p className="text-[11px] font-mono text-neutral-600">
                    Create a fresh squad or join with an existing team code.
                  </p>
                </div>

                {/* Mode Selector */}
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

                {mode === 'create' ? (
                  <div className="p-4 bg-white border-2 border-black shadow-[2px_2px_0px_#000] space-y-3">
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
                        className="w-full bg-[#FAF9F5] border-2 border-black focus:border-[#D21319] px-3.5 py-2 text-xs text-black placeholder:text-neutral-400 outline-none transition font-sans font-bold"
                      />
                    </div>
                    <p className="text-[11px] text-neutral-600 font-mono">
                      ✦ You will become the <strong>Team Leader</strong> and receive a unique 8-character code to invite squad teammates.
                    </p>
                  </div>
                ) : (
                  <div className="p-4 bg-white border-2 border-black shadow-[2px_2px_0px_#000] space-y-3">
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
                          className="flex-1 bg-[#FAF9F5] border-2 border-black focus:border-[#D21319] px-3.5 py-2 text-xs text-black font-mono uppercase tracking-widest placeholder:text-neutral-400 outline-none transition"
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
                      <div className="p-3 bg-neutral-50 border-2 border-black text-xs space-y-1">
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

                {/* REVIEW SUMMARY CARD */}
                <div className="p-3.5 bg-[#EFECE6] border-2 border-black text-xs space-y-2 font-mono">
                  <div className="flex items-center justify-between border-b border-black/20 pb-1.5">
                    <span className="font-bold uppercase text-neutral-700">Enlistment Summary</span>
                    <span className="text-[10px] text-neutral-600">{fullName} ({email})</span>
                  </div>

                  <div className="space-y-1 text-[11px]">
                    <div className="flex items-center justify-between">
                      <span className="text-neutral-600">Selected Disciplines:</span>
                      <span className="font-bold text-black">{selectedEvents.length} Event(s)</span>
                    </div>

                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {selectedEvents.map((evId) => {
                        const ev = FEST_EVENTS.find((e) => e.id === evId);
                        if (!ev) return null;
                        return (
                          <div
                            key={evId}
                            className="px-2 py-0.5 bg-white border border-black text-[10px] font-bold flex items-center gap-1.5"
                          >
                            <span>{ev.title}</span>
                            {ev.whatsappLink && (
                              <a
                                href={ev.whatsappLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-emerald-700 hover:underline"
                                title="WhatsApp Link"
                                onClick={(e) => e.stopPropagation()}
                              >
                                [💬 WA]
                              </a>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Step 3 Actions */}
                <div className="pt-2 flex items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => setCurrentStep(2)}
                    className="px-4 py-2.5 bg-white hover:bg-neutral-100 border-2 border-black shadow-[2px_2px_0px_#000] text-xs font-mono font-bold text-black transition cursor-pointer flex items-center gap-1.5"
                  >
                    <span>←</span>
                    <span>Back to Personal</span>
                  </button>

                  <button
                    type="submit"
                    disabled={submitting || (mode === 'create' && selectedEvents.length === 0)}
                    className="flex-1 py-3 bg-[#D21319] hover:bg-[#b00f14] disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-xs uppercase tracking-wider transition-all border-2 border-black shadow-[4px_4px_0px_#000] active:translate-x-[2px] active:translate-y-[2px] cursor-pointer flex items-center justify-center gap-2"
                  >
                    {submitting ? (
                      <span>Enlisting Squad Roster...</span>
                    ) : (
                      <span>Confirm & Complete Registration ➔</span>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        )}
      </motion.div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
