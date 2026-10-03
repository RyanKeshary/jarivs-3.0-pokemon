import { useState, useEffect, useCallback } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '../../lib/supabase';
import { Art } from '../ui/Art';
import { pokedexClose } from '../../lib/assets';
import { TrainerCardModal } from './TrainerCardModal';
import { playSelectSound, playPokedexSound, playSuccessSound } from '../../lib/sound';

interface PokedexProps {
  onClose?: () => void;
  onProfileUpdated?: () => void;
  onTeamUpdated?: () => void;
}

interface SocialLink {
  platform: 'github' | 'linkedin' | 'x' | 'instagram' | 'website';
  url: string;
}

interface TeamMember {
  user_id: string;
  is_leader: boolean;
  trainer_id?: string | null;
  full_name?: string | null;
  email?: string | null;
}

export default function Pokedex({ onClose, onProfileUpdated, onTeamUpdated }: PokedexProps) {
  const [view, setView] = useState<'profile' | 'team'>('profile');
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  // Profile data
  const [fullName, setFullName] = useState('');
  const [trainerId, setTrainerId] = useState('');
  const [mobile, setMobile] = useState('');
  const [socials, setSocials] = useState<SocialLink[]>([]);
  const [role, setRole] = useState('trainer');

  // Team data
  const [team, setTeam] = useState<{
    id: string;
    team_id?: string | null;
    name: string;
    join_code: string;
    leader_id: string | null;
    max_members: number;
    locked?: boolean;
  } | null>(null);
  const [members, setMembers] = useState<TeamMember[]>([]);

  // Team action inputs
  const [teamNameInput, setTeamNameInput] = useState('');
  const [joinCodeInput, setJoinCodeInput] = useState('');
  const [teamTab, setTeamTab] = useState<'info' | 'create' | 'join'>('info');

  // ID Card preview modal
  const [showIdCard, setShowIdCard] = useState(false);

  // Fetch full profile and team information
  const loadData = useCallback(async (userSession: Session) => {
    try {
      setLoading(true);
      const uid = userSession.user.id;

      // 1. Fetch profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', uid)
        .single();

      if (profile) {
        setFullName(profile.full_name || '');
        setTrainerId(profile.trainer_id || '');
        setMobile(profile.mobile || '');
        setRole(profile.role || 'trainer');
        if (Array.isArray(profile.socials)) {
          setSocials(profile.socials as unknown as SocialLink[]);
        } else {
          setSocials([]);
        }
      }

      // 2. Fetch team via RPC
      const { data: teamData } = await supabase.rpc('my_team');
      if (teamData?.team) {
        setTeam(teamData.team);
        setMembers(teamData.members || []);
        setTeamTab('info');
      } else {
        setTeam(null);
        setMembers([]);
        setTeamTab('create');
      }
    } catch (err) {
      console.error('Failed to load Pokédex data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    playPokedexSound();
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      if (data.session) loadData(data.session);
    });

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) loadData(session);
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [loadData]);

  // Save profile updates
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session) return;
    playSelectSound();
    setSaving(true);
    setStatusMsg(null);

    try {
      // Validate mobile format: optional or E.164
      if (mobile.trim() && !/^\+?[1-9][0-9]{6,14}$/.test(mobile.trim())) {
        throw new Error('Invalid mobile format. Example: +919876543210');
      }

      // Validate socials: max 3
      if (socials.length > 3) {
        throw new Error('Maximum 3 social profiles allowed');
      }
      for (const s of socials) {
        if (!/^https?:\/\//i.test(s.url.trim())) {
          throw new Error(`Social URL must begin with http:// or https://: ${s.url}`);
        }
      }

      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: fullName.trim(),
          mobile: mobile.trim() || null,
          socials: socials as any,
          updated_at: new Date().toISOString(),
        })
        .eq('id', session.user.id);

      if (error) throw error;

      playSuccessSound();
      setStatusMsg({ type: 'ok', text: 'Profile updated successfully!' });
      onProfileUpdated?.();
    } catch (err: any) {
      setStatusMsg({ type: 'err', text: err.message || 'Failed to update profile' });
    } finally {
      setSaving(false);
    }
  };

  // Add social link (up to 3)
  const addSocial = () => {
    playSelectSound();
    if (socials.length >= 3) {
      setStatusMsg({ type: 'err', text: 'Maximum 3 socials allowed' });
      return;
    }
    setSocials([...socials, { platform: 'github', url: '' }]);
  };

  const updateSocial = (index: number, field: keyof SocialLink, val: string) => {
    const updated = [...socials];
    updated[index] = { ...updated[index], [field]: val };
    setSocials(updated);
  };

  const removeSocial = (index: number) => {
    playSelectSound();
    setSocials(socials.filter((_, i) => i !== index));
  };

  // Create team handler
  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teamNameInput.trim()) return;
    playSelectSound();
    setSaving(true);
    setStatusMsg(null);

    try {
      const { error } = await supabase.rpc('create_team', {
        p_name: teamNameInput.trim(),
      });
      if (error) throw error;

      playSuccessSound();
      setStatusMsg({ type: 'ok', text: 'Team registered! Share your join code.' });
      setTeamNameInput('');
      if (session) await loadData(session);
      onTeamUpdated?.();
    } catch (err: any) {
      setStatusMsg({ type: 'err', text: err.message || 'Failed to create team' });
    } finally {
      setSaving(false);
    }
  };

  // Join team handler
  const handleJoinTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinCodeInput.trim()) return;
    playSelectSound();
    setSaving(true);
    setStatusMsg(null);

    try {
      const { error } = await supabase.rpc('join_team', {
        p_code: joinCodeInput.trim().toUpperCase(),
      });
      if (error) throw error;

      playSuccessSound();
      setStatusMsg({ type: 'ok', text: 'Joined squad successfully!' });
      setJoinCodeInput('');
      if (session) await loadData(session);
      onTeamUpdated?.();
    } catch (err: any) {
      setStatusMsg({ type: 'err', text: err.message || 'Failed to join team' });
    } finally {
      setSaving(false);
    }
  };

  // Leave team handler
  const handleLeaveTeam = async () => {
    if (!confirm('Are you sure you want to leave this team?')) return;
    playSelectSound();
    setSaving(true);
    setStatusMsg(null);

    try {
      const { error } = await supabase.rpc('leave_team');
      if (error) throw error;

      playSuccessSound();
      setStatusMsg({ type: 'ok', text: 'Left team successfully' });
      if (session) await loadData(session);
      onTeamUpdated?.();
    } catch (err: any) {
      setStatusMsg({ type: 'err', text: err.message || 'Failed to leave team' });
    } finally {
      setSaving(false);
    }
  };

  const isLeader = team && session?.user?.id === team.leader_id;

  return (
    <>
      <div className="flex flex-col h-full bg-white rounded-2xl border-4 border-red-600 shadow-2xl overflow-hidden font-sans text-slate-800">
        {/* Device Top Bar: LED & Speaker Grill */}
        <div className="bg-red-600 px-5 py-3 flex items-center justify-between text-white border-b-2 border-red-700">
          <div className="flex items-center gap-3">
            <span className="relative flex h-5 w-5 items-center justify-center">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-300 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-4 w-4 bg-sky-400 border border-white shadow-inner"></span>
            </span>
            <div className="flex gap-1.5">
              <span className="h-2 w-2 rounded-full bg-amber-300"></span>
              <span className="h-2 w-2 rounded-full bg-emerald-400"></span>
            </div>
            <span className="font-pixel text-[11px] tracking-wider uppercase ml-1">POKÉDEX V3.0</span>
          </div>
          <button
            onClick={() => {
              playSelectSound();
              onClose?.();
            }}
            className="rounded-full bg-white/20 p-1.5 hover:bg-white/30 transition-colors"
            aria-label="Close Pokédex"
          >
            <Art asset={pokedexClose} alt="Close" className="h-5 w-5 invert" />
          </button>
        </div>

        {/* View Switcher Tabs */}
        <div className="bg-slate-100 p-2 border-b border-slate-200 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => {
              playSelectSound();
              setView('profile');
              setStatusMsg(null);
            }}
            className={`py-2 px-3 rounded-lg font-pixel text-[10px] uppercase tracking-wider transition ${
              view === 'profile'
                ? 'bg-red-600 text-white shadow-sm'
                : 'bg-white text-slate-700 hover:bg-slate-200 border border-slate-200'
            }`}
          >
            Trainer Profile
          </button>
          <button
            type="button"
            onClick={() => {
              playSelectSound();
              setView('team');
              setStatusMsg(null);
            }}
            className={`py-2 px-3 rounded-lg font-pixel text-[10px] uppercase tracking-wider transition ${
              view === 'team'
                ? 'bg-red-600 text-white shadow-sm'
                : 'bg-white text-slate-700 hover:bg-slate-200 border border-slate-200'
            }`}
          >
            Team Squad {team ? `(${team.name})` : ''}
          </button>
        </div>

        {/* Feedback message banner */}
        {statusMsg && (
          <div
            className={`px-4 py-2 text-xs font-semibold ${
              statusMsg.type === 'ok' ? 'bg-emerald-50 text-emerald-800 border-b border-emerald-200' : 'bg-red-50 text-red-800 border-b border-red-200'
            }`}
          >
            {statusMsg.text}
          </div>
        )}

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5 bg-slate-50/50">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <span className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-red-600" />
              <p className="font-pixel text-[10px] text-slate-500 uppercase tracking-widest">Scanning Pokédex...</p>
            </div>
          ) : view === 'profile' ? (
            /* ========================================================== */
            /* PAGE 1: TRAINER PROFILE                                    */
            /* ========================================================== */
            <form onSubmit={handleSaveProfile} className="space-y-4">
              {/* Trainer ID Tag */}
              <div className="rounded-xl border border-red-200 bg-red-50/80 p-3 flex items-center justify-between">
                <div>
                  <span className="font-mono text-[10px] font-bold text-red-600 uppercase tracking-wider block">
                    Trainer Identification
                  </span>
                  <span className="font-mono text-base font-bold text-slate-900 tracking-wider">
                    {trainerId || 'TRN-KL3-000000'}
                  </span>
                </div>
                <span className="rounded-full bg-red-600 text-white text-[10px] font-pixel px-2.5 py-1 uppercase">
                  {role}
                </span>
              </div>

              {/* Full Name */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Trainer Full Name</label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-red-500 focus:ring-1 focus:ring-red-500 focus:outline-hidden"
                  placeholder="Red Satoshi"
                />
              </div>

              {/* Email (Read-only) */}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                  Registered Email <span className="text-[10px] text-slate-400 normal-case">(Read-only)</span>
                </label>
                <input
                  type="email"
                  disabled
                  value={session?.user?.email || ''}
                  className="w-full rounded-lg border border-slate-200 bg-slate-100 px-3 py-2 text-sm font-mono text-slate-600 cursor-not-allowed"
                />
              </div>

              {/* Mobile Number */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Mobile Number <span className="text-[10px] text-slate-400 font-mono">(E.164 format)</span>
                </label>
                <input
                  type="tel"
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-mono text-slate-900 focus:border-red-500 focus:ring-1 focus:ring-red-500 focus:outline-hidden"
                  placeholder="+919876543210"
                />
              </div>

              {/* Social Links (Max 3) */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-slate-700 uppercase">
                    Social Links <span className="text-slate-400">({socials.length}/3)</span>
                  </label>
                  {socials.length < 3 && (
                    <button
                      type="button"
                      onClick={addSocial}
                      className="text-[11px] font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1"
                    >
                      + Add Link
                    </button>
                  )}
                </div>

                <div className="space-y-2">
                  {socials.map((soc, idx) => (
                    <div key={idx} className="flex gap-2 items-center">
                      <select
                        value={soc.platform}
                        onChange={(e) => updateSocial(idx, 'platform', e.target.value as any)}
                        className="rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-800 font-medium"
                      >
                        <option value="github">GitHub</option>
                        <option value="linkedin">LinkedIn</option>
                        <option value="x">X / Twitter</option>
                        <option value="instagram">Instagram</option>
                        <option value="website">Portfolio</option>
                      </select>
                      <input
                        type="url"
                        required
                        value={soc.url}
                        onChange={(e) => updateSocial(idx, 'url', e.target.value)}
                        placeholder="https://..."
                        className="flex-1 rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-900"
                      />
                      <button
                        type="button"
                        onClick={() => removeSocial(idx)}
                        className="text-slate-400 hover:text-red-500 p-1"
                        aria-label="Remove social link"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                  {socials.length === 0 && (
                    <p className="text-xs text-slate-400 italic">No social links added yet. Click &apos;+ Add Link&apos; to link GitHub/LinkedIn.</p>
                  )}
                </div>
              </div>

              <button
                type="submit"
                disabled={saving}
                className="w-full rounded-xl bg-red-600 hover:bg-red-700 py-2.5 px-4 font-pixel text-xs text-white uppercase tracking-wider shadow-md transition disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save Profile Changes'}
              </button>
            </form>
          ) : (
            /* ========================================================== */
            /* PAGE 2: TEAM SQUAD                                         */
            /* ========================================================== */
            <div className="space-y-4">
              {team ? (
                /* IN A TEAM */
                <div className="space-y-4">
                  <div className="rounded-xl border border-blue-200 bg-blue-50/80 p-4">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[10px] font-bold text-blue-600 uppercase tracking-wider">
                        Squad Name
                      </span>
                      <span className="font-mono text-xs font-bold text-blue-800">{team.team_id || 'TEAM-XXXX'}</span>
                    </div>
                    <p className="text-xl font-bold text-slate-900 mt-1">{team.name}</p>

                    <div className="mt-3 flex items-center justify-between pt-3 border-t border-blue-200/70">
                      <div>
                        <span className="text-[10px] font-mono text-slate-500 block">JOIN CODE:</span>
                        <span className="font-pixel text-sm text-red-600 tracking-widest">{team.join_code}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          playSelectSound();
                          navigator.clipboard.writeText(team.join_code);
                          setStatusMsg({ type: 'ok', text: 'Join code copied to clipboard!' });
                        }}
                        className="rounded-lg bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 text-xs font-semibold shadow-xs"
                      >
                        Copy Code
                      </button>
                    </div>
                  </div>

                  {/* Member List */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-xs font-bold uppercase text-slate-700 tracking-wider">
                        Squad Members ({members.length}/{team.max_members || 4})
                      </h4>
                      <span className="text-[11px] font-mono text-slate-500">Max {team.max_members || 4}</span>
                    </div>

                    <div className="space-y-2">
                      {members.map((m, idx) => (
                        <div
                          key={m.user_id || idx}
                          className="flex items-center justify-between p-3 rounded-xl border border-slate-200 bg-white shadow-2xs"
                        >
                          <div className="flex items-center gap-2.5">
                            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 font-pixel text-[10px] text-slate-700">
                              {idx + 1}
                            </span>
                            <div>
                              <p className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                                {m.full_name || 'Trainer Member'}
                                {m.is_leader && (
                                  <span className="rounded-sm bg-amber-100 px-1 py-0.2 text-[9px] font-bold text-amber-700 border border-amber-300">
                                    LEADER
                                  </span>
                                )}
                              </p>
                              <p className="font-mono text-[10px] text-slate-500">{m.trainer_id || 'ID Pending'}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Leave Team Button */}
                  <div className="pt-2 border-t border-slate-200">
                    <button
                      type="button"
                      onClick={handleLeaveTeam}
                      disabled={saving}
                      className="w-full rounded-xl border-2 border-red-500 text-red-600 hover:bg-red-50 py-2.5 px-4 font-pixel text-[10px] uppercase tracking-wider transition disabled:opacity-50"
                    >
                      {isLeader && members.length > 1 ? 'Leave Team (Passes Leadership)' : 'Leave / Disband Team'}
                    </button>
                  </div>
                </div>
              ) : (
                /* NOT IN A TEAM: TABS FOR CREATE / JOIN */
                <div className="space-y-4">
                  <div className="flex rounded-xl bg-slate-200 p-1">
                    <button
                      type="button"
                      onClick={() => {
                        playSelectSound();
                        setTeamTab('create');
                      }}
                      className={`flex-1 rounded-lg py-2 font-pixel text-[10px] uppercase tracking-wider transition ${
                        teamTab === 'create' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
                      }`}
                    >
                      Create Team
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        playSelectSound();
                        setTeamTab('join');
                      }}
                      className={`flex-1 rounded-lg py-2 font-pixel text-[10px] uppercase tracking-wider transition ${
                        teamTab === 'join' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
                      }`}
                    >
                      Join via Code
                    </button>
                  </div>

                  {teamTab === 'create' ? (
                    <form onSubmit={handleCreateTeam} className="space-y-4 bg-white p-4 rounded-xl border border-slate-200">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Squad Name</label>
                        <input
                          type="text"
                          required
                          value={teamNameInput}
                          onChange={(e) => setTeamNameInput(e.target.value)}
                          placeholder="e.g. Pallet Town Pioneers"
                          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-red-500 focus:ring-1 focus:ring-red-500 focus:outline-hidden"
                        />
                      </div>
                      <p className="text-[11px] text-slate-500 leading-relaxed">
                        As the founder, you will be designated the team leader. You can invite up to 3 more trainers with a 6-character code.
                      </p>
                      <button
                        type="submit"
                        disabled={saving || !teamNameInput.trim()}
                        className="w-full rounded-xl bg-red-600 hover:bg-red-700 py-2.5 font-pixel text-xs text-white uppercase tracking-wider shadow-sm transition disabled:opacity-50"
                      >
                        {saving ? 'Creating...' : 'Register Squad'}
                      </button>
                    </form>
                  ) : (
                    <form onSubmit={handleJoinTeam} className="space-y-4 bg-white p-4 rounded-xl border border-slate-200">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                          6-Character Join Code
                        </label>
                        <input
                          type="text"
                          required
                          maxLength={6}
                          value={joinCodeInput}
                          onChange={(e) => setJoinCodeInput(e.target.value.toUpperCase())}
                          placeholder="e.g. X8T2WQ"
                          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-base font-pixel text-center text-red-600 tracking-widest focus:border-red-500 focus:ring-1 focus:ring-red-500 focus:outline-hidden uppercase"
                        />
                      </div>
                      <p className="text-[11px] text-slate-500 leading-relaxed">
                        Enter the secret join code provided by your squad leader to join forces.
                      </p>
                      <button
                        type="submit"
                        disabled={saving || joinCodeInput.length !== 6}
                        className="w-full rounded-xl bg-blue-600 hover:bg-blue-700 py-2.5 font-pixel text-xs text-white uppercase tracking-wider shadow-sm transition disabled:opacity-50"
                      >
                        {saving ? 'Joining...' : 'Join Squad'}
                      </button>
                    </form>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Pokédex Footer: Preview ID Card Action */}
        <div className="p-4 bg-white border-t border-slate-200">
          <button
            type="button"
            onClick={() => {
              playSelectSound();
              setShowIdCard(true);
            }}
            className="w-full rounded-xl bg-linear-to-r from-amber-400 via-amber-500 to-amber-600 hover:from-amber-500 hover:to-amber-700 py-3 font-pixel text-xs text-slate-900 uppercase tracking-wider shadow-md hover:shadow-lg active:scale-98 transition flex items-center justify-center gap-2 border border-amber-600/30"
          >
            <span>★</span> Preview Trainer ID Card <span>★</span>
          </button>
        </div>
      </div>

      {/* Trainer ID Card Modal with PNG Export */}
      <TrainerCardModal
        isOpen={showIdCard}
        onClose={() => setShowIdCard(false)}
        trainer={{
          trainerId: trainerId || 'TRN-KL3-000000',
          name: fullName || 'Trainer',
          email: session?.user?.email || '',
          role,
        }}
        team={team ? { name: team.name, teamId: team.team_id || team.id } : null}
      />
    </>
  );
}