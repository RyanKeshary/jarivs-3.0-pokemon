import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../lib/supabase';
import { useNow, computeCountdown, formatIstDateTime } from '../lib/time';
import { useEventConfig } from '../hooks/useEventConfig';
import Pokedex from '../components/pokdex/Index';
import { isSoundEnabled, setSoundEnabled, playSelectSound, playSuccessSound } from '../lib/sound';

interface Announcement {
  id: string;
  title: string;
  body: string;
  created_at: string;
}

interface ProblemStatement {
  id: string;
  title: string;
  description: string;
  file_path: string | null;
  visible: boolean;
}

interface TeamInfo {
  id: string;
  team_id?: string | null;
  name: string;
  join_code: string;
  leader_id: string | null;
  max_members: number;
}

interface SubmissionInfo {
  id: string;
  team_id: string;
  title?: string | null;
  file_name?: string | null;
  file_path?: string | null;
  version?: number;
  uploaded_at?: string;
  submitted_at?: string | null;
  status?: string;
  deck_size_bytes?: number | null;
}

export default function Center() {
  const navigate = useNavigate();
  const [showPokedex, setShowPokedex] = useState(false);
  const [soundActive, setSoundActive] = useState(() => isSoundEnabled());
  const now = useNow(1000);
  const eventQuery = useEventConfig();

  // State
  const [profile, setProfile] = useState<any>(null);
  const [team, setTeam] = useState<TeamInfo | null>(null);
  const [membersCount, setMembersCount] = useState<number>(0);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [problemStatements, setProblemStatements] = useState<ProblemStatement[]>([]);
  const [submission, setSubmission] = useState<SubmissionInfo | null>(null);
  const [signedUrl, setSignedUrl] = useState<string | null>(null);

  // Uploading state
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Selected Problem Statement for details modal
  const [selectedStatement, setSelectedStatement] = useState<ProblemStatement | null>(null);

  // Sound toggle handler
  const handleToggleSound = () => {
    const next = !soundActive;
    setSoundActive(next);
    setSoundEnabled(next);
    if (next) playSuccessSound();
  };

  // Auth Guard
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate('/auth', { replace: true });
      }
    });

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) navigate('/auth', { replace: true });
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [navigate]);

  // Load Trainer & Team Data
  const loadUserData = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      // Profile
      const { data: prof } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();
      if (prof) setProfile(prof);

      // Team
      const { data: teamData } = await supabase.rpc('my_team');
      if (teamData?.team) {
        setTeam(teamData.team);
        setMembersCount(teamData.members?.length || 1);

        // Fetch submission for this team
        const { data: subs } = await supabase
          .from('submissions')
          .select('*')
          .eq('team_id', teamData.team.id)
          .maybeSingle();

        if (subs) {
          setSubmission(subs);
          if (subs.file_path) {
            // Generate signed URL (valid for 1 hour)
            const { data: signed } = await supabase.storage
              .from('submissions')
              .createSignedUrl(subs.file_path, 3600);
            if (signed?.signedUrl) setSignedUrl(signed.signedUrl);
          }
        } else {
          setSubmission(null);
          setSignedUrl(null);
        }
      } else {
        setTeam(null);
        setMembersCount(0);
        setSubmission(null);
        setSignedUrl(null);
      }
    } catch (err) {
      console.error('Error loading dashboard data:', err);
    }
  }, []);

  // Load Announcements & Problem Statements
  const loadResources = useCallback(async () => {
    try {
      // Announcements
      const { data: ann } = await supabase
        .from('announcements')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);
      if (ann) setAnnouncements(ann);

      // Visible Problem Statements
      const { data: ps } = await supabase
        .from('problem_statements')
        .select('*')
        .eq('visible', true)
        .order('created_at', { ascending: false });
      if (ps) setProblemStatements(ps);
    } catch (err) {
      console.error('Error loading resources:', err);
    }
  }, []);

  useEffect(() => {
    loadUserData();
    loadResources();
  }, [loadUserData, loadResources]);

  // Realtime Supabase Subscriptions
  useEffect(() => {
    // 1. Announcements channel
    const annChannel = supabase
      .channel('public:announcements')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'announcements' },
        () => {
          loadResources();
        }
      )
      .subscribe();

    // 2. Problem statements channel
    const psChannel = supabase
      .channel('public:problem_statements')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'problem_statements' },
        () => {
          loadResources();
        }
      )
      .subscribe();

    // 3. Submissions channel
    const subChannel = supabase
      .channel('public:submissions')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'submissions' },
        () => {
          loadUserData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(annChannel);
      supabase.removeChannel(psChannel);
      supabase.removeChannel(subChannel);
    };
  }, [loadResources, loadUserData]);

  // Keyboard shortcut: Escape closes Pokédex
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && showPokedex) {
        setShowPokedex(false);
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [showPokedex]);

  const event = eventQuery.data;

  // Countdown Calculation
  const countdown = event
    ? computeCountdown(event.countdown_target, event.event_ends_at, now)
    : { valid: false, days: 0, hours: 0, minutes: 0, seconds: 0, ended: false };

  // Check if submissions are locked
  const isSubmissionLocked = Boolean(
    event?.countdown_target && new Date(event.countdown_target).getTime() < Date.now(),
  );

  // Submission Upload Handler
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!team) {
      alert('You must create or join a team first before submitting your deck.');
      return;
    }

    if (isSubmissionLocked) {
      alert('Submissions are locked! The deadline has passed.');
      return;
    }

    // Check size limit: 50MB
    const MAX_SIZE = 50 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      setUploadError('File exceeds 50MB limit.');
      return;
    }

    // Check format
    const allowedExtensions = ['.ppt', '.pptx', '.pdf'];
    const fileExt = file.name.slice(file.name.lastIndexOf('.')).toLowerCase();
    if (!allowedExtensions.includes(fileExt)) {
      setUploadError('Only PPT, PPTX, or PDF files are permitted.');
      return;
    }

    playSelectSound();
    setUploading(true);
    setUploadError(null);
    setUploadProgress('Preparing upload...');

    try {
      const nextVersion = (submission?.version || 0) + 1;
      // Sanitize file name
      const cleanName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
      const storagePath = `${team.id}/v${nextVersion}/${cleanName}`;

      setUploadProgress('Transferring deck to secure Pokémon storage...');

      // 1. Upload to Supabase Storage
      const { error: storageError } = await supabase.storage
        .from('submissions')
        .upload(storagePath, file, {
          cacheControl: '3600',
          upsert: true,
        });

      if (storageError) throw storageError;

      setUploadProgress('Recording submission...');

      // 2. Insert or update submissions table row
      if (submission?.id) {
        const { error: dbError } = await supabase
          .from('submissions')
          .update({
            file_path: storagePath,
            file_name: file.name,
            version: nextVersion,
            uploaded_at: new Date().toISOString(),
            submitted_at: new Date().toISOString(),
            status: 'submitted',
            deck_size_bytes: file.size,
            updated_at: new Date().toISOString(),
          })
          .eq('id', submission.id);

        if (dbError) throw dbError;
      } else {
        const { error: dbError } = await supabase
          .from('submissions')
          .insert({
            team_id: team.id,
            file_path: storagePath,
            file_name: file.name,
            version: 1,
            title: `${team.name} Deck`,
            status: 'submitted',
            submitted_at: new Date().toISOString(),
            deck_size_bytes: file.size,
          });

        if (dbError) throw dbError;
      }

      playSuccessSound();
      setUploadProgress('Deck submitted successfully!');
      setTimeout(() => setUploadProgress(null), 3500);
      await loadUserData();
    } catch (err: any) {
      console.error('Submission failed:', err);
      setUploadError(err.message || 'Failed to upload deck. Please try again.');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSignOut = async () => {
    playSelectSound();
    await supabase.auth.signOut();
    navigate('/auth', { replace: true });
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-start p-3 sm:p-6 lg:p-8 font-sans">
      {/* Top Header: Pokémon Center Video-Phone Branding */}
      <header className="w-full max-w-7xl mb-4 flex flex-wrap items-center justify-between gap-3 bg-white px-5 py-3 rounded-2xl border-2 border-slate-200 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-600 text-white font-pixel text-xs shadow-md">
            PC
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <h1 className="font-pixel text-[11px] sm:text-xs text-slate-900 tracking-wider uppercase">
                Pokémon Center Terminal #03
              </h1>
            </div>
            <p className="text-[10px] text-slate-500 font-mono">
              Live Video-Phone Link · Kanto League Hackathon 3.0
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Sound Toggle */}
          <button
            onClick={handleToggleSound}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-mono font-semibold transition ${
              soundActive
                ? 'bg-amber-100 text-amber-900 border border-amber-300'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
            title="Toggle Retro 8-bit Sound Effects"
          >
            <span>{soundActive ? '🔊 Sound: ON' : '🔇 Sound: OFF'}</span>
          </button>

          {/* Trainer Badge */}
          <div className="hidden sm:flex items-center gap-2 px-3 py-1 bg-slate-100 rounded-full border border-slate-200">
            <span className="font-mono text-xs font-bold text-red-600">
              {profile?.trainer_id || 'TRN-KL3-000000'}
            </span>
            <span className="text-xs text-slate-600 font-medium">({profile?.full_name || 'Trainer'})</span>
          </div>

          {/* Sign Out */}
          <button
            onClick={handleSignOut}
            className="text-xs font-mono text-slate-500 hover:text-red-600 px-2 py-1 transition"
          >
            Disconnect
          </button>
        </div>
      </header>

      {/* Main Terminal Frame */}
      <main className="w-full max-w-7xl relative flex-1 flex flex-col">
        {/* Retro Device Screen Container */}
        <div className="relative w-full rounded-3xl bg-slate-900 p-2 sm:p-4 shadow-2xl border-4 border-slate-800">
          {/* CRT Monitor Outer Bezel Accent */}
          <div className="flex items-center justify-between px-3 py-1.5 text-slate-400 text-[10px] font-mono border-b border-slate-800 mb-2">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-red-500" />
              <span>COMMUNICATION CHANNEL: PROFESSOR OAK // SLRTCE</span>
            </div>
            <div className="hidden md:flex items-center gap-4">
              <span>SECURITY: ENCRYPTED RLS</span>
              <span>STATION: PALLET TOWN HQ</span>
            </div>
          </div>

          {/* Monitor Screen Interior with Glassmorphic / Clean Light Card Deck */}
          <div className="relative rounded-2xl bg-slate-50 p-4 sm:p-6 overflow-hidden min-h-[640px] flex gap-4">
            {/* Left Content Area: Dynamic shrinking 2x2 Grid */}
            <motion.div
              layout
              transition={{ duration: 0.35, ease: 'easeInOut' }}
              className={`flex-1 flex flex-col transition-all duration-300 ${
                showPokedex ? 'lg:pr-4' : ''
              }`}
            >
              {/* Event Live Banner inside Screen */}
              <div className="mb-4 rounded-xl bg-linear-to-r from-red-600 via-red-500 to-amber-500 p-3.5 text-white flex flex-wrap items-center justify-between gap-3 shadow-sm">
                <div>
                  <span className="font-pixel text-[9px] uppercase tracking-wider text-amber-200 block">
                    Tournament Countdown Target
                  </span>
                  <span className="text-base sm:text-lg font-bold">
                    {event?.event_name || 'Kanto League · Jarvis Hackathon 3.0'}
                  </span>
                </div>
                <div className="flex items-center gap-2 bg-black/25 px-3 py-1.5 rounded-lg border border-white/20 font-mono text-sm">
                  <span className="text-amber-300 font-pixel text-xs">DEADLINE:</span>
                  <span className="font-bold">
                    {countdown.valid
                      ? `${countdown.days}d ${countdown.hours}h ${countdown.minutes}m ${countdown.seconds}s`
                      : 'EVENT OPEN'}
                  </span>
                </div>
              </div>

              {/* Symmetric 2x2 Grid of 4 Boxes */}
              <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 auto-rows-fr">
                {/* ======================================================== */}
                {/* BOX 1 (Top-Left): Latest Announcements (Realtime)         */}
                {/* ======================================================== */}
                <div className="rounded-2xl border-2 border-slate-200 bg-white p-4 shadow-sm flex flex-col h-full hover:border-red-300 transition">
                  <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-red-600" />
                      <h2 className="font-pixel text-[10px] text-red-600 uppercase tracking-wider">
                        Latest Announcements
                      </h2>
                    </div>
                    <span className="rounded-full bg-red-50 text-red-700 font-mono text-[10px] px-2 py-0.5 font-bold">
                      REALTIME
                    </span>
                  </div>

                  <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 max-h-56">
                    {announcements.length > 0 ? (
                      announcements.map((ann) => (
                        <div
                          key={ann.id}
                          className="rounded-xl border border-slate-100 bg-slate-50/70 p-3 hover:bg-slate-50 transition"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <h3 className="font-bold text-xs text-slate-900 leading-snug">{ann.title}</h3>
                            <span className="text-[10px] font-mono text-slate-400 shrink-0">
                              {formatIstDateTime(ann.created_at)}
                            </span>
                          </div>
                          {ann.body && (
                            <p className="mt-1 text-xs text-slate-600 leading-relaxed line-clamp-3">
                              {ann.body}
                            </p>
                          )}
                        </div>
                      ))
                    ) : (
                      <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400">
                        <span className="font-pixel text-xs text-slate-300 mb-1">NO ANNOUNCEMENTS</span>
                        <p className="text-xs">Professor Oak broadcast signals are quiet.</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* ======================================================== */}
                {/* BOX 2 (Top-Right): Status Updates for the Team            */}
                {/* ======================================================== */}
                <div className="rounded-2xl border-2 border-slate-200 bg-white p-4 shadow-sm flex flex-col h-full hover:border-blue-300 transition">
                  <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-blue-600" />
                      <h2 className="font-pixel text-[10px] text-blue-600 uppercase tracking-wider">
                        Team & Status Feed
                      </h2>
                    </div>
                    <span className="rounded-full bg-blue-50 text-blue-700 font-mono text-[10px] px-2 py-0.5 font-bold">
                      {team ? 'SQUAD ACTIVE' : 'FREE AGENT'}
                    </span>
                  </div>

                  <div className="flex-1 space-y-3">
                    {team ? (
                      <>
                        <div className="p-3 rounded-xl bg-blue-50/80 border border-blue-100 flex items-center justify-between">
                          <div>
                            <span className="text-[10px] font-mono font-bold text-blue-600 uppercase block">
                              Active Squad
                            </span>
                            <span className="text-sm font-bold text-slate-900">{team.name}</span>
                          </div>
                          <div className="text-right">
                            <span className="text-[10px] font-mono text-slate-500 block">JOIN CODE</span>
                            <span className="font-pixel text-xs text-red-600 tracking-wider">
                              {team.join_code}
                            </span>
                          </div>
                        </div>

                        {/* Squad Capacity Bar */}
                        <div>
                          <div className="flex justify-between text-xs font-mono text-slate-600 mb-1">
                            <span>SQUAD CAPACITY</span>
                            <span>{membersCount} / {team.max_members || 4} TRAINERS</span>
                          </div>
                          <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-blue-600 rounded-full transition-all"
                              style={{ width: `${(membersCount / (team.max_members || 4)) * 100}%` }}
                            />
                          </div>
                        </div>

                        {/* Submission status tag */}
                        <div className="p-2.5 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between text-xs">
                          <span className="font-semibold text-slate-700">Project Deck:</span>
                          <span
                            className={`font-mono px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                              submission?.status === 'submitted'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {submission?.status === 'submitted' ? `v${submission.version || 1} SUBMITTED` : 'NOT SUBMITTED'}
                          </span>
                        </div>
                      </>
                    ) : (
                      <div className="h-full flex flex-col items-center justify-center text-center p-4 text-slate-500">
                        <p className="text-xs mb-2">You are currently registered as a Solo Free Agent.</p>
                        <button
                          onClick={() => {
                            playSelectSound();
                            setShowPokedex(true);
                          }}
                          className="rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-pixel text-[10px] uppercase px-3 py-1.5 shadow-xs"
                        >
                          Launch Pokédex to Create/Join Team
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* ======================================================== */}
                {/* BOX 3 (Bottom-Left): Submission Box (Storage & Versions)  */}
                {/* ======================================================== */}
                <div className="rounded-2xl border-2 border-slate-200 bg-white p-4 shadow-sm flex flex-col h-full hover:border-emerald-300 transition">
                  <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-emerald-600" />
                      <h2 className="font-pixel text-[10px] text-emerald-600 uppercase tracking-wider">
                        Deck Submissions
                      </h2>
                    </div>
                    {isSubmissionLocked ? (
                      <span className="rounded-full bg-red-100 text-red-800 font-mono text-[10px] px-2 py-0.5 font-bold">
                        LOCKED
                      </span>
                    ) : (
                      <span className="rounded-full bg-emerald-50 text-emerald-800 font-mono text-[10px] px-2 py-0.5 font-bold">
                        OPEN
                      </span>
                    )}
                  </div>

                  <div className="flex-1 flex flex-col justify-between space-y-3">
                    {submission ? (
                      <div className="p-3 rounded-xl bg-emerald-50/70 border border-emerald-200">
                        <div className="flex items-start justify-between">
                          <div>
                            <span className="font-mono text-[10px] font-bold text-emerald-700 uppercase block">
                              Active Version: v{submission.version || 1}
                            </span>
                            <span className="text-xs font-bold text-slate-900 break-all">
                              {submission.file_name || 'presentation_deck.pptx'}
                            </span>
                          </div>
                          {signedUrl && (
                            <a
                              href={signedUrl}
                              target="_blank"
                              rel="noreferrer"
                              download
                              className="text-[11px] font-bold text-emerald-700 hover:underline shrink-0"
                            >
                              Download ↗
                            </a>
                          )}
                        </div>
                        <p className="mt-1 text-[10px] font-mono text-slate-500">
                          Submitted on {formatIstDateTime(submission.submitted_at || submission.uploaded_at || '')}
                        </p>
                      </div>
                    ) : (
                      <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4 text-center">
                        <p className="text-xs font-semibold text-slate-700">No deck uploaded yet</p>
                        <p className="text-[11px] text-slate-500 mt-1">Accepts PPT, PPTX, or PDF (Max 50MB)</p>
                      </div>
                    )}

                    {/* Upload Controls */}
                    <div>
                      {uploadError && <p className="text-xs text-red-600 mb-2 font-medium">{uploadError}</p>}
                      {uploadProgress && (
                        <p className="text-xs text-emerald-600 mb-2 font-mono font-medium animate-pulse">
                          {uploadProgress}
                        </p>
                      )}

                      <input
                        ref={fileInputRef}
                        type="file"
                        accept=".ppt,.pptx,.pdf"
                        onChange={handleFileUpload}
                        className="hidden"
                        id="deck-file-input"
                        disabled={uploading || isSubmissionLocked}
                      />

                      <label
                        htmlFor="deck-file-input"
                        className={`w-full flex items-center justify-center gap-2 rounded-xl py-2.5 px-4 font-pixel text-[10px] uppercase tracking-wider cursor-pointer shadow-sm transition ${
                          isSubmissionLocked
                            ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                            : uploading
                            ? 'bg-slate-300 text-slate-600 cursor-wait'
                            : submission
                            ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                            : 'bg-red-600 hover:bg-red-700 text-white'
                        }`}
                      >
                        {uploading
                          ? 'Uploading Deck...'
                          : isSubmissionLocked
                          ? 'Submissions Deadline Passed'
                          : submission
                          ? 'Replace Deck (Bumps Version)'
                          : 'Upload Project Deck'}
                      </label>
                    </div>
                  </div>
                </div>

                {/* ======================================================== */}
                {/* BOX 4 (Bottom-Right): Resources & Problem Statements     */}
                {/* ======================================================== */}
                <div className="rounded-2xl border-2 border-slate-200 bg-white p-4 shadow-sm flex flex-col h-full hover:border-amber-300 transition">
                  <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-amber-500" />
                      <h2 className="font-pixel text-[10px] text-amber-600 uppercase tracking-wider">
                        Event Resources
                      </h2>
                    </div>
                    <span className="font-mono text-[10px] text-slate-400">DOWNLOADS</span>
                  </div>

                  <div className="flex-1 overflow-y-auto space-y-2 pr-1 max-h-56">
                    {/* Official Brochure */}
                    <a
                      href="/downloads/brochure.pdf"
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center justify-between p-2.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-amber-50 hover:border-amber-200 transition text-xs font-semibold text-slate-800"
                    >
                      <span className="flex items-center gap-2">
                        <span>📄</span> Event Brochure & Rulebook
                      </span>
                      <span className="font-mono text-[10px] text-amber-700">PDF ↗</span>
                    </a>

                    {/* Official PPT Template */}
                    <a
                      href="/downloads/template.pptx"
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center justify-between p-2.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-amber-50 hover:border-amber-200 transition text-xs font-semibold text-slate-800"
                    >
                      <span className="flex items-center gap-2">
                        <span>📊</span> Official Presentation Template
                      </span>
                      <span className="font-mono text-[10px] text-amber-700">PPTX ↗</span>
                    </a>

                    {/* Problem Statements */}
                    <div className="pt-2 border-t border-slate-100">
                      <p className="text-[10px] font-mono text-slate-500 uppercase tracking-wider mb-1.5">
                        Published Problem Statements
                      </p>
                      {problemStatements.length > 0 ? (
                        problemStatements.map((ps) => (
                          <button
                            key={ps.id}
                            type="button"
                            onClick={() => {
                              playSelectSound();
                              setSelectedStatement(ps);
                            }}
                            className="w-full text-left p-2 rounded-lg bg-slate-50 hover:bg-slate-100 text-xs font-medium text-slate-800 mb-1 flex items-center justify-between transition"
                          >
                            <span className="truncate">{ps.title}</span>
                            <span className="text-[10px] text-blue-600 font-bold shrink-0 ml-2">View →</span>
                          </button>
                        ))
                      ) : (
                        <p className="text-[11px] text-slate-400 italic">No statements published yet.</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* ========================================================== */}
            {/* FAR RIGHT: TALL VERTICAL POKÉDEX BUTTON                    */}
            {/* ========================================================== */}
            {!showPokedex && (
              <div className="hidden lg:flex items-center justify-center shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    playSelectSound();
                    setShowPokedex(true);
                  }}
                  className="group relative flex flex-col items-center justify-center gap-1.5 bg-linear-to-b from-red-600 via-red-500 to-red-700 hover:from-red-500 hover:to-red-600 text-white rounded-2xl py-8 px-3.5 shadow-xl border-2 border-white/40 active:scale-95 transition-all"
                  title="Click to launch"
                >
                  <span className="h-3 w-3 rounded-full bg-sky-300 animate-ping mb-2" />
                  {/* Vertically stacked letters */}
                  {'POKÉDEX'.split('').map((letter, idx) => (
                    <span
                      key={idx}
                      className="font-pixel text-xs font-bold leading-none select-none tracking-widest"
                    >
                      {letter}
                    </span>
                  ))}
                  <span className="mt-2 text-[9px] font-pixel text-amber-200">▶</span>

                  {/* Hover tooltip */}
                  <span className="absolute -left-28 bg-slate-900 text-white text-[10px] font-pixel uppercase px-2.5 py-1 rounded-md opacity-0 group-hover:opacity-100 transition pointer-events-none whitespace-nowrap shadow-lg">
                    Click to launch
                  </span>
                </button>
              </div>
            )}

            {/* ========================================================== */}
            {/* ANIMATED POKÉDEX OVERLAY (Slides & Shrinks smoothly)       */}
            {/* ========================================================== */}
            <AnimatePresence>
              {showPokedex && (
                <motion.div
                  initial={{ opacity: 0, x: 80, scale: 0.95 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  exit={{ opacity: 0, x: 80, scale: 0.95 }}
                  transition={{ duration: 0.3, ease: 'easeOut' }}
                  className="w-full lg:w-96 shrink-0 z-30"
                >
                  <Pokedex
                    onClose={() => {
                      playSelectSound();
                      setShowPokedex(false);
                    }}
                    onProfileUpdated={loadUserData}
                    onTeamUpdated={loadUserData}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Mobile Pokédex Fixed Float Launch Button */}
        {!showPokedex && (
          <button
            type="button"
            onClick={() => {
              playSelectSound();
              setShowPokedex(true);
            }}
            className="lg:hidden fixed bottom-6 right-6 z-40 rounded-full bg-red-600 text-white px-5 py-3 font-pixel text-xs uppercase shadow-2xl border-2 border-white flex items-center gap-2 active:scale-95"
          >
            <span>🔴</span> Launch Pokédex
          </button>
        )}
      </main>

      {/* Problem Statement Modal View */}
      {selectedStatement && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl border-4 border-amber-400">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <span className="font-pixel text-[10px] text-amber-600 uppercase">Problem Statement</span>
              <button
                onClick={() => setSelectedStatement(null)}
                className="text-slate-400 hover:text-slate-600 font-bold p-1"
              >
                ✕
              </button>
            </div>
            <h3 className="mt-3 text-lg font-bold text-slate-900">{selectedStatement.title}</h3>
            <p className="mt-3 text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">
              {selectedStatement.description}
            </p>
            {selectedStatement.file_path && (
              <div className="mt-4 pt-3 border-t border-slate-100 flex justify-end">
                <a
                  href={selectedStatement.file_path}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-lg bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 text-xs font-semibold"
                >
                  Download Attached File ↗
                </a>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}