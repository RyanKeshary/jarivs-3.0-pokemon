'use client';

import React, { use, useState, useEffect } from 'react';
import Link from 'next/link';
import { getLeaderTeamData, leaderManageTeam } from '@/app/actions/registration';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { FEST_EVENTS } from '@/components/sections/EventsLedger';

export default function LeaderManagePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const unwrappedParams = use(params);
  const token = unwrappedParams.token || '';

  const [team, setTeam] = useState<any | null>(null);
  const [members, setMembers] = useState<any[]>([]);
  const [isLeader, setIsLeader] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [actionNotice, setActionNotice] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);

  // Rename team state
  const [editingName, setEditingName] = useState(false);
  const [newNameInput, setNewNameInput] = useState('');

  const loadData = async () => {
    setLoading(true);
    setErrorMsg(null);
    const res = await getLeaderTeamData(token);
    setLoading(false);

    if (res.success && res.team) {
      setTeam(res.team);
      setMembers(res.members || []);
      setIsLeader(!!res.isLeader);
      setNewNameInput(res.team.name);
    } else {
      setErrorMsg(res.error || 'Failed to authenticate management token.');
    }
  };

  useEffect(() => {
    if (token) loadData();
  }, [token]);

  const handleAction = async (action: 'rename' | 'regenerate_code' | 'lock' | 'unlock' | 'disband', payload?: any) => {
    setActionNotice(null);
    setErrorMsg(null);

    const res = await leaderManageTeam({
      token,
      action,
      ...payload,
    });

    if (res.success) {
      setActionNotice(res.message || 'Action executed successfully.');
      if (action === 'disband') {
        setTeam(null);
        setMembers([]);
      } else {
        loadData();
      }
    } else {
      setErrorMsg(res.error || 'Action failed.');
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!confirm('Are you sure you want to remove this member from your squad?')) return;
    const res = await leaderManageTeam({
      token,
      action: 'remove_member',
      memberId,
    });
    if (res.success) {
      setActionNotice(res.message || 'Member removed successfully.');
      loadData();
    } else {
      setErrorMsg(res.error || 'Failed to remove member.');
    }
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  // Find associated events
  const registeredEvents = team
    ? FEST_EVENTS.filter((ev) => (team.event_ids || team.eventIds || []).includes(ev.id))
    : [];

  return (
    <div className="min-h-screen bg-[#FAF9F5] text-black flex flex-col select-none">
      <Navbar />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-8 sm:py-12">
        <div className="border-2 border-black bg-white p-6 sm:p-10 shadow-[8px_8px_0px_#000]">
          
          {/* HEADER BAR */}
          <div className="border-b-2 border-black pb-4 mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="w-2.5 h-2.5 rounded-full bg-[#D21319] animate-pulse border border-black" />
                <span className="font-mono text-[10px] tracking-wider text-neutral-600 uppercase font-bold">
                  INDIGO TECH FEST · SQUAD USER PANEL
                </span>
                <span
                  className={`font-mono text-[9px] px-2 py-0.5 border border-black font-bold uppercase shadow-[1px_1px_0px_#000] ${
                    isLeader
                      ? 'bg-[#D21319] text-white'
                      : 'bg-green-100 text-green-900'
                  }`}
                >
                  {isLeader ? 'Leader Console' : 'Member Roster View'}
                </span>
              </div>
              <h1 className="font-sans text-2xl sm:text-3xl text-black uppercase font-black tracking-tight">
                Squad Management & Roster
              </h1>
            </div>

            <Link
              href="/"
              className="text-xs font-mono font-bold text-black hover:bg-[#FAF9F5] px-3.5 py-2 border-2 border-black shadow-[2px_2px_0px_#000] w-fit active:translate-x-[1px] active:translate-y-[1px] transition"
            >
              [ ➔ Return to Ledger ]
            </Link>
          </div>

          {loading ? (
            <div className="py-16 text-center text-xs font-mono text-neutral-600">
              <span className="inline-block animate-spin mr-2">⚙</span>
              VALIDATING SQUAD CREDENTIALS AND RETRIEVING LIVE ROSTER...
            </div>
          ) : errorMsg && !team ? (
            <div className="p-5 bg-red-50 border-2 border-[#D21319] text-xs text-center shadow-[3px_3px_0px_#D21319]">
              <span className="text-[#D21319] font-bold font-mono">[ ERROR ]: </span>
              <span className="font-sans text-neutral-900">{errorMsg}</span>
              <div className="mt-3">
                <Link
                  href="/"
                  className="inline-block px-4 py-1.5 bg-black text-white font-mono text-xs font-bold"
                >
                  Return to Home
                </Link>
              </div>
            </div>
          ) : !team ? (
            <div className="text-center py-12 text-xs font-mono text-neutral-600">
              THIS SQUAD HAS BEEN DISBANDED OR DOES NOT EXIST.
            </div>
          ) : (
            <div className="space-y-6">
              
              {/* Feedback Notices */}
              {actionNotice && (
                <div className="p-3 bg-green-50 border-2 border-green-800 text-xs font-mono text-green-900 shadow-[2px_2px_0px_#000] flex items-center justify-between">
                  <span>[ SUCCESS ]: {actionNotice}</span>
                  <button onClick={() => setActionNotice(null)} className="font-bold ml-2">✕</button>
                </div>
              )}
              {errorMsg && (
                <div className="p-3 bg-red-50 border-2 border-[#D21319] text-xs font-mono text-[#D21319] shadow-[2px_2px_0px_#D21319] flex items-center justify-between">
                  <span>[ ERROR ]: {errorMsg}</span>
                  <button onClick={() => setErrorMsg(null)} className="font-bold ml-2">✕</button>
                </div>
              )}

              {/* Team Metadata & Share Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 p-5 bg-[#FAF9F5] border-2 border-black shadow-[4px_4px_0px_#000]">
                
                {/* Team Name & Disciplines */}
                <div className="flex flex-col justify-between">
                  <div>
                    <span className="font-mono text-[10px] font-bold tracking-widest text-neutral-600 uppercase block mb-1">
                      SQUAD NAME
                    </span>

                    {editingName && isLeader ? (
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={newNameInput}
                          onChange={(e) => setNewNameInput(e.target.value)}
                          className="flex-1 bg-white border-2 border-black px-2.5 py-1 text-sm text-black font-sans font-bold"
                        />
                        <button
                          onClick={() => {
                            handleAction('rename', { newName: newNameInput });
                            setEditingName(false);
                          }}
                          className="px-3 py-1 bg-[#D21319] text-white text-xs font-bold border border-black shadow-[2px_2px_0px_#000]"
                        >
                          SAVE
                        </button>
                        <button
                          onClick={() => setEditingName(false)}
                          className="px-2 py-1 bg-neutral-200 text-black text-xs font-bold border border-black"
                        >
                          ✕
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-3">
                        <span className="font-sans text-xl sm:text-2xl font-black text-black">
                          {team.name}
                        </span>
                        {isLeader && (
                          <button
                            onClick={() => setEditingName(true)}
                            className="text-[10px] font-mono text-neutral-600 underline hover:text-[#D21319] cursor-pointer"
                          >
                            [ RENAME ]
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Registered Disciplines Chips */}
                  <div className="mt-4">
                    <span className="font-mono text-[10px] font-bold tracking-widest text-neutral-600 uppercase block mb-1.5">
                      REGISTERED DISCIPLINES ({registeredEvents.length})
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {registeredEvents.map((ev) => (
                        <div
                          key={ev.id}
                          className="flex items-center gap-2 bg-white border border-black px-2.5 py-1 shadow-[2px_2px_0px_#000]"
                        >
                          <img
                            src={ev.pokemonGif}
                            alt={ev.pokemon}
                            className="w-5 h-5 object-contain"
                            style={{ imageRendering: 'pixelated' }}
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = ev.pokemonStatic;
                            }}
                          />
                          <span className="text-xs font-bold font-sans text-black truncate max-w-[160px]">
                            {ev.name.split(':')[0]}
                          </span>
                          <span className="text-[10px] font-mono text-[#D21319] font-bold">
                            {ev.dayTag}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Team Code & Share Actions */}
                <div className="flex flex-col justify-between border-t md:border-t-0 md:border-l-2 border-black pt-4 md:pt-0 md:pl-5">
                  <div>
                    <span className="font-mono text-[10px] font-bold tracking-widest text-neutral-600 uppercase block mb-1">
                      SQUAD JOIN CODE
                    </span>
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-3xl sm:text-4xl font-black tracking-widest text-[#D21319]">
                        {team.code}
                      </span>
                      {isLeader && (
                        <button
                          onClick={() => handleAction('regenerate_code')}
                          className="text-[10px] font-mono text-neutral-600 underline hover:text-black cursor-pointer"
                          title="Generate a new squad join code"
                        >
                          [ NEW CODE ]
                        </button>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-2 mt-2">
                      <button
                        onClick={() => copyCode(team.code)}
                        className="px-3 py-1 bg-white hover:bg-neutral-100 border border-black shadow-[2px_2px_0px_#000] text-xs font-mono font-bold cursor-pointer active:translate-x-[1px] active:translate-y-[1px]"
                      >
                        {copiedCode ? '✓ Copied' : 'Copy Code'}
                      </button>

                      <a
                        href={`https://wa.me/?text=${encodeURIComponent(
                          `Join our team for Indigo Tech Fest (Jarvis 3.0)!\nTeam Name: ${team.name}\nTeam Code: ${team.code}\nManage link: ${typeof window !== 'undefined' ? window.location.href : ''}`
                        )}`}
                        target="_blank"
                        rel="noreferrer"
                        className="px-3 py-1 bg-[#25D366] hover:bg-[#20ba5a] border border-black shadow-[2px_2px_0px_#000] text-black text-xs font-bold active:translate-x-[1px] active:translate-y-[1px]"
                      >
                        Share WhatsApp ➔
                      </a>
                    </div>
                  </div>

                  {/* Squad Lock Status */}
                  <div className="mt-4 pt-3 border-t border-black/20 flex items-center justify-between text-xs font-mono">
                    <div className="flex items-center gap-2">
                      <span className="text-neutral-600 font-bold">STATUS:</span>
                      <span
                        className={`px-2 py-0.5 border font-bold ${
                          team.is_locked
                            ? 'bg-red-50 border-[#D21319] text-[#D21319]'
                            : 'bg-green-50 border-green-700 text-green-900'
                        }`}
                      >
                        {team.is_locked ? 'LOCKED (ROSTER FINAL)' : 'OPEN TO JOIN'}
                      </span>
                    </div>

                    {isLeader && (
                      <button
                        onClick={() => handleAction(team.is_locked ? 'unlock' : 'lock')}
                        className="underline text-[11px] font-bold text-neutral-700 hover:text-black cursor-pointer"
                      >
                        {team.is_locked ? '[ UNLOCK SQUAD ]' : '[ LOCK SQUAD ]'}
                      </button>
                    )}
                  </div>
                </div>

              </div>

              {/* Members Table */}
              <div>
                <div className="flex items-center justify-between mb-2.5">
                  <span className="font-mono text-xs font-bold text-black uppercase tracking-wide">
                    Squad Members Roster ({members.length})
                  </span>
                  <span className="text-[11px] font-mono text-neutral-600">
                    Max size per event enforced
                  </span>
                </div>

                <div className="border-2 border-black divide-y-2 divide-black bg-white shadow-[4px_4px_0px_#000]">
                  {members.map((m, idx) => (
                    <div
                      key={m.id}
                      className="p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-[#FAF9F5] transition-colors"
                    >
                      <div className="flex items-start sm:items-center gap-3">
                        <div className="w-8 h-8 rounded-none border border-black bg-neutral-100 flex items-center justify-center font-mono font-bold text-xs shrink-0">
                          #{idx + 1}
                        </div>

                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-sans text-sm sm:text-base font-bold text-black">
                              {m.full_name}
                            </span>
                            {m.is_leader && (
                              <span className="text-[9px] font-mono px-2 py-0.5 bg-[#D21319] text-white font-bold border border-black">
                                LEADER
                              </span>
                            )}
                          </div>
                          <div className="text-xs font-mono text-neutral-600 mt-0.5">
                            {m.email} · {m.phone} · <span className="font-sans text-neutral-800">{m.college}</span> ({m.department}, {m.year_of_study})
                          </div>
                        </div>
                      </div>

                      {isLeader && !m.is_leader && (
                        <button
                          onClick={() => handleRemoveMember(m.id)}
                          className="px-3 py-1 bg-red-100 hover:bg-[#D21319] text-[#D21319] hover:text-white border border-[#D21319] text-xs font-mono font-bold self-start sm:self-auto cursor-pointer transition shadow-[1px_1px_0px_#000]"
                        >
                          REMOVE [ X ]
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Leader Danger Zone vs Member Information Notice */}
              {isLeader ? (
                <div className="pt-4 border-t-2 border-black flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 bg-red-50 border-2 border-[#D21319] shadow-[3px_3px_0px_rgba(210,19,25,0.2)]">
                  <div>
                    <span className="font-mono text-xs font-bold text-[#b91c1c] uppercase block">
                      ⚠️ SQUAD LEADER DANGER ZONE
                    </span>
                    <p className="font-sans text-xs text-neutral-700 mt-0.5">
                      Disbanding will cancel all member registrations under this squad and permanently erase this team roster.
                    </p>
                  </div>

                  <button
                    onClick={() => {
                      if (confirm('Are you absolutely sure you want to disband this squad? This action cannot be reversed.')) {
                        handleAction('disband');
                      }
                    }}
                    className="px-5 py-2.5 bg-[#D21319] hover:bg-[#a80d12] text-white font-mono font-bold text-xs uppercase border-2 border-black shadow-[3px_3px_0px_#000] cursor-pointer whitespace-nowrap active:translate-x-[1px] active:translate-y-[1px]"
                  >
                    DISBAND SQUAD
                  </button>
                </div>
              ) : (
                <div className="p-4 bg-neutral-50 border-2 border-black text-xs font-sans text-neutral-700 shadow-[3px_3px_0px_#000]">
                  <span className="font-mono font-bold text-black uppercase block mb-1">
                    ℹ️ SQUAD PARTICIPANT NOTICE
                  </span>
                  You are registered in this squad. If your squad needs a name change or member adjustments, please coordinate with your team leader.
                </div>
              )}

            </div>
          )}

        </div>
      </main>

      <Footer />
    </div>
  );
}
