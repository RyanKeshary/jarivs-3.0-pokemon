'use client';

import React, { use, useState, useEffect } from 'react';
import Link from 'next/link';
import { getLeaderTeamData, leaderManageTeam } from '@/app/actions/registration';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';

export default function LeaderManagePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const unwrappedParams = use(params);
  const token = unwrappedParams.token || '';

  const [team, setTeam] = useState<any | null>(null);
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

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

  return (
    <div className="min-h-screen bg-[#1B1E4A] text-[#E9E6DA] flex flex-col select-none">
      <Navbar />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-12">
        <div className="border border-[#AFAEA2] bg-[#121435] p-6 sm:p-10 shadow-[4px_4px_0px_#0E1026]">
          
          <div className="border-b border-[#AFAEA2]/40 pb-4 mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="label-editorial text-[9px] block">
                LEADER CONSOLE · PASSWORDLESS MAGIC LINK
              </span>
              <h1 className="font-serif text-3xl sm:text-4xl text-[#D21319] uppercase font-bold tracking-tight">
                MANAGE SQUAD ROSTER
              </h1>
            </div>

            <Link
              href="/"
              className="text-xs font-mono text-[#AFAEA2] hover:text-[#E9E6DA] px-3 py-1.5 border border-[#AFAEA2]/40 w-fit"
            >
              [ RETURN TO HOME ]
            </Link>
          </div>

          {loading ? (
            <div className="py-12 text-center text-xs font-mono text-[#AFAEA2]">
              VALIDATING SECURITY TOKEN AND FETCHING TEAM ROSTER...
            </div>
          ) : errorMsg && !team ? (
            <div className="p-4 bg-[#D21319]/20 border border-[#D21319] text-xs font-grotesk text-center">
              <span className="text-[#D21319] font-bold">[ ERROR ]: </span>
              {errorMsg}
            </div>
          ) : !team ? (
            <div className="text-center py-8 text-xs font-mono text-[#AFAEA2]">
              THIS TEAM HAS BEEN DISBANDED.
            </div>
          ) : (
            <div className="space-y-8">
              
              {/* Feedback Notices */}
              {actionNotice && (
                <div className="p-3 bg-[#E9E6DA]/10 border border-[#E9E6DA] text-xs font-mono text-[#E9E6DA]">
                  [ SUCCESS ]: {actionNotice}
                </div>
              )}
              {errorMsg && (
                <div className="p-3 bg-[#D21319]/20 border border-[#D21319] text-xs font-mono text-[#D21319]">
                  [ ERROR ]: {errorMsg}
                </div>
              )}

              {/* Team Metadata & Quick Actions */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 bg-[#1B1E4A] border border-[#AFAEA2]">
                
                {/* Team Name & Rename */}
                <div>
                  <span className="label-editorial text-[8px] block mb-1">TEAM NAME</span>
                  {editingName ? (
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newNameInput}
                        onChange={(e) => setNewNameInput(e.target.value)}
                        className="flex-1 bg-[#121435] border border-[#AFAEA2] px-2 py-1 text-sm text-[#E9E6DA]"
                      />
                      <button
                        onClick={() => {
                          handleAction('rename', { newName: newNameInput });
                          setEditingName(false);
                        }}
                        className="px-3 py-1 bg-[#D21319] text-xs font-bold"
                      >
                        SAVE
                      </button>
                      <button
                        onClick={() => setEditingName(false)}
                        className="px-2 py-1 bg-[#AFAEA2] text-[#1B1E4A] text-xs font-bold"
                      >
                        CANCEL
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3">
                      <span className="font-serif text-2xl font-bold text-[#E9E6DA]">
                        {team.name}
                      </span>
                      <button
                        onClick={() => setEditingName(true)}
                        className="text-[10px] font-mono text-[#AFAEA2] underline hover:text-[#D21319]"
                      >
                        [ RENAME ]
                      </button>
                    </div>
                  )}

                  <div className="mt-3 text-xs font-mono text-[#AFAEA2]">
                    DISCIPLINES: <span className="text-[#E9E6DA]">{team.event_ids?.join(', ')}</span>
                  </div>
                </div>

                {/* Team Code & Status */}
                <div>
                  <span className="label-editorial text-[8px] block mb-1">JOIN CODE</span>
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-2xl font-bold tracking-widest text-[#D21319]">
                      {team.code}
                    </span>
                    <button
                      onClick={() => handleAction('regenerate_code')}
                      className="text-[10px] font-mono text-[#AFAEA2] underline hover:text-[#E9E6DA]"
                    >
                      [ REGENERATE CODE ]
                    </button>
                  </div>

                  <div className="mt-3 flex items-center gap-3 text-xs font-mono">
                    <span className="text-[#AFAEA2]">STATUS: </span>
                    <span className={`px-2 py-0.5 border ${team.is_locked ? 'border-[#D21319] text-[#D21319]' : 'border-[#AFAEA2] text-[#E9E6DA]'}`}>
                      {team.is_locked ? 'LOCKED' : 'OPEN TO JOIN'}
                    </span>
                    <button
                      onClick={() => handleAction(team.is_locked ? 'unlock' : 'lock')}
                      className="underline text-[10px] text-[#AFAEA2] hover:text-[#E9E6DA]"
                    >
                      [{team.is_locked ? 'UNLOCK SQUAD' : 'LOCK SQUAD'}]
                    </button>
                  </div>
                </div>

              </div>

              {/* Members Table */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="label-editorial text-[10px]">
                    SQUAD MEMBERS ({members.length})
                  </span>
                  <span className="text-xs font-mono text-[#AFAEA2]">
                    SHAREABLE LINK: /join/{team.code}
                  </span>
                </div>

                <div className="border border-[#AFAEA2] divide-y divide-[#AFAEA2]/30 bg-[#1B1E4A]">
                  {members.map((m) => (
                    <div
                      key={m.id}
                      className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-[#121435] transition-colors"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-serif text-lg font-bold text-[#E9E6DA]">
                            {m.full_name}
                          </span>
                          {m.is_leader && (
                            <span className="text-[9px] font-mono px-2 py-0.5 bg-[#D21319] text-[#E9E6DA] font-bold">
                              LEADER
                            </span>
                          )}
                        </div>
                        <div className="text-xs font-mono text-[#AFAEA2] mt-0.5">
                          {m.email} · {m.phone} · {m.college} ({m.department}, {m.year_of_study})
                        </div>
                      </div>

                      {!m.is_leader && (
                        <button
                          onClick={() => handleRemoveMember(m.id)}
                          className="px-3 py-1 bg-[#D21319]/20 hover:bg-[#D21319] text-[#D21319] hover:text-[#E9E6DA] border border-[#D21319] text-xs font-mono self-start sm:self-auto cursor-pointer"
                        >
                          REMOVE [ X ]
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Danger Zone: Disband Team */}
              <div className="pt-6 border-t border-[#AFAEA2]/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <span className="label-editorial text-[9px] block text-[#D21319]">
                    DANGER ZONE
                  </span>
                  <p className="font-grotesk text-xs text-[#AFAEA2]">
                    Disbanding will cancel registration for all members and permanently erase this team roster.
                  </p>
                </div>

                <button
                  onClick={() => {
                    if (confirm('Are you absolutely sure you want to disband this squad? This action cannot be reversed.')) {
                      handleAction('disband');
                    }
                  }}
                  className="px-6 py-2.5 bg-[#D21319] text-[#E9E6DA] font-grotesk font-bold text-xs uppercase border border-[#D21319] shadow-[3px_3px_0px_#0E1026] hover:bg-[#A80D12] cursor-pointer"
                >
                  DISBAND TEAM
                </button>
              </div>

            </div>
          )}

        </div>
      </main>

      <Footer />
    </div>
  );
}
