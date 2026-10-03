'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Users,
  Shield,
  FileText,
  Bell,
  Settings,
  Download,
  Search,
  Plus,
  Trash2,
  Eye,
  EyeOff,
  ExternalLink,
  CheckCircle,
  AlertTriangle,
  ArrowLeft,
  Crown,
  Activity,
  History,
  Lock,
  Key,
  Check,
} from 'lucide-react';
import {
  upsertProblemStatement,
  deleteProblemStatement,
  toggleProblemStatementVisibility,
  createAnnouncement,
  deleteAnnouncement,
  createStatusUpdate,
  updateEventSettings,
  promoteToAdmin,
  demoteAdmin,
  getSubmissionSignedUrl,
  changeAdminPassword,
  resetAdminPassword,
} from '@/app/actions/admin';
import { playRetroBeep, playVictoryChime } from '@/lib/sound';

interface AdminDashboardProps {
  data: any;
}

export function AdminDashboard({ data }: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'participants' | 'teams' | 'problems' | 'announcements' | 'settings' | 'master'>('overview');

  // Search & Filter States
  const [participantSearch, setParticipantSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [teamSearch, setTeamSearch] = useState('');

  // Problem Statements Form State
  const [psTitle, setPsTitle] = useState('');
  const [psDesc, setPsDesc] = useState('');
  const [psFileUrl, setPsFileUrl] = useState('');
  const [psVisible, setPsVisible] = useState(true);
  const [editingPsId, setEditingPsId] = useState<string | null>(null);

  // Announcement Form State
  const [annTitle, setAnnTitle] = useState('');
  const [annContent, setAnnContent] = useState('');
  const [annPriority, setAnnPriority] = useState('normal');

  // Master Promotion State
  const [promoteEmail, setPromoteEmail] = useState('');
  const [promoteMsg, setPromoteMsg] = useState<string | null>(null);

  // Settings State
  const [settingsForm, setSettingsForm] = useState(data.eventSettings || {});
  const [settingsSaved, setSettingsSaved] = useState(false);

  // Password Change State
  const [newAdminPassword, setNewAdminPassword] = useState('');
  const [confirmAdminPassword, setConfirmAdminPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [resettingId, setResettingId] = useState<string | null>(null);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(null);

    if (newAdminPassword.length < 6) {
      setPasswordError('Password must be at least 6 characters long.');
      playRetroBeep(300, 'sawtooth', 0.1);
      return;
    }
    if (newAdminPassword !== confirmAdminPassword) {
      setPasswordError('Passwords do not match.');
      playRetroBeep(300, 'sawtooth', 0.1);
      return;
    }

    setChangingPassword(true);
    try {
      await changeAdminPassword(newAdminPassword);
      playVictoryChime();
      setPasswordSuccess('Password successfully updated and active!');
      setNewAdminPassword('');
      setConfirmAdminPassword('');
    } catch (err: any) {
      setPasswordError(err.message || 'Failed to update password');
      playRetroBeep(300, 'sawtooth', 0.1);
    } finally {
      setChangingPassword(false);
    }
  };

  // Signed URL preview state
  const [signedUrlLoading, setSignedUrlLoading] = useState<string | null>(null);

  // Filtered Participants
  const filteredParticipants = (data.participants || []).filter((p: any) => {
    const matchesSearch =
      p.full_name?.toLowerCase().includes(participantSearch.toLowerCase()) ||
      p.email?.toLowerCase().includes(participantSearch.toLowerCase()) ||
      p.trainer_id?.toLowerCase().includes(participantSearch.toLowerCase());
    const matchesRole = roleFilter === 'all' || p.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  // Filtered Teams
  const filteredTeams = (data.teams || []).filter((t: any) => {
    return (
      t.name?.toLowerCase().includes(teamSearch.toLowerCase()) ||
      t.team_id?.toLowerCase().includes(teamSearch.toLowerCase()) ||
      t.leader_name?.toLowerCase().includes(teamSearch.toLowerCase())
    );
  });

  // CSV Export
  const handleExportCSV = () => {
    playRetroBeep(880, 'sine', 0.05);
    const headers = ['Trainer ID', 'Full Name', 'Email', 'Role', 'Squad ID', 'Squad Name', 'Phones', 'Registered At'];
    const rows = filteredParticipants.map((p: any) => [
      `"${p.trainer_id || ''}"`,
      `"${p.full_name || ''}"`,
      `"${p.email || ''}"`,
      `"${p.role || ''}"`,
      `"${p.team_code || 'SOLO'}"`,
      `"${p.team_name || 'None'}"`,
      `"${(p.phones || []).join(', ')}"`,
      `"${p.created_at || ''}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e: any) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `kento_league_trainers_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Preview Submission Deck
  const handlePreviewDeck = async (filePath: string) => {
    setSignedUrlLoading(filePath);
    try {
      const res = await getSubmissionSignedUrl(filePath);
      window.open(res.signedUrl, '_blank');
    } catch (err: any) {
      alert(`Error opening file: ${err.message}`);
    } finally {
      setSignedUrlLoading(null);
    }
  };

  // Handle PS Submit
  const handleSaveProblemStatement = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await upsertProblemStatement({
        id: editingPsId || undefined,
        title: psTitle,
        description: psDesc,
        file_url: psFileUrl,
        is_visible: psVisible,
      });
      playVictoryChime();
      setPsTitle('');
      setPsDesc('');
      setPsFileUrl('');
      setEditingPsId(null);
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Handle Announcement Submit
  const handleSaveAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createAnnouncement(annTitle, annContent, annPriority);
      playVictoryChime();
      setAnnTitle('');
      setAnnContent('');
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Handle Admin Promotion
  const handlePromoteAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setPromoteMsg(null);
    try {
      const res = await promoteToAdmin(promoteEmail);
      playVictoryChime();
      setPromoteMsg(`Successfully promoted ${res.name} to Admin!`);
      setPromoteEmail('');
    } catch (err: any) {
      setPromoteMsg(`Error: ${err.message}`);
    }
  };

  // Handle Settings Save
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateEventSettings({
        name: settingsForm.name,
        tagline: settingsForm.tagline,
        countdownTarget: settingsForm.countdown_target,
        deadline: settingsForm.deadline,
        registrationDeadline: settingsForm.registration_deadline,
        brochureUrl: settingsForm.brochure_url,
        pptTemplateUrl: settingsForm.ppt_template_url,
        landingContent: settingsForm.landing_content,
      });
      playVictoryChime();
      setSettingsSaved(true);
      setTimeout(() => setSettingsSaved(false), 3000);
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="min-h-screen bg-[#F1F5F9] text-[#1E232A] flex flex-col font-sans">
      {/* Top Admin Header Bar */}
      <header className="bg-[#1E232A] text-white border-b-4 border-[#EE1515] sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="p-1.5 bg-gray-800 hover:bg-gray-700 rounded-lg text-gray-300 font-mono text-xs flex items-center gap-1 border border-gray-600"
            >
              <ArrowLeft size={14} />
              <span>Trainer Terminal</span>
            </Link>
            <div className="flex items-center gap-2">
              <span className="font-pixel text-xs sm:text-sm text-[#FFCB05] tracking-wider">
                INDIGO PLATEAU COMMAND
              </span>
              <span className="px-2 py-0.5 bg-[#EE1515] rounded font-pixel text-[8px] text-white">
                {data.isMaster ? 'MASTER ROOT' : 'LEAGUE ADMIN'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 text-xs font-mono">
            <span className="text-gray-400 hidden sm:inline">Operator:</span>
            <span className="text-[#FFCB05] font-bold">{data.currentRole?.toUpperCase()}</span>
          </div>
        </div>

        {/* Admin Navigation Tabs */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex overflow-x-auto gap-2 py-1 scrollbar-none text-xs">
          {[
            { id: 'overview', label: 'OVERVIEW', icon: <Activity size={14} /> },
            { id: 'participants', label: 'TRAINERS', icon: <Users size={14} /> },
            { id: 'teams', label: 'SQUADS', icon: <Shield size={14} /> },
            { id: 'problems', label: 'PROBLEM STATEMENTS', icon: <FileText size={14} /> },
            { id: 'announcements', label: 'BROADCASTS', icon: <Bell size={14} /> },
            { id: 'settings', label: 'EVENT SETTINGS', icon: <Settings size={14} /> },
            ...(data.isMaster ? [{ id: 'master', label: 'MASTER VAULT', icon: <Crown size={14} /> }] : []),
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                playRetroBeep(440, 'square', 0.03);
                setActiveTab(tab.id as any);
              }}
              className={`flex items-center gap-1.5 px-3.5 py-2 font-pixel text-[10px] rounded-t-lg transition-all shrink-0 cursor-pointer ${
                activeTab === tab.id
                  ? 'bg-[#F1F5F9] text-[#1E232A] font-bold border-t-2 border-x-2 border-[#1E232A]'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </header>

      {/* Main Admin Workspace */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full">
        {/* TAB 1: OVERVIEW */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* Metric Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div className="bg-white border-3 border-[#1E232A] rounded-2xl p-6 shadow-[5px_5px_0_#1E232A]">
                <span className="font-mono text-xs text-gray-500 font-bold uppercase block">
                  REGISTERED TRAINERS
                </span>
                <span className="font-pixel text-3xl sm:text-4xl text-[#EE1515] mt-2 block">
                  {data.metrics.totalParticipants}
                </span>
                <span className="text-xs text-gray-600 mt-2 block">
                  All verified @slrtce.in trainers
                </span>
              </div>

              <div className="bg-white border-3 border-[#1E232A] rounded-2xl p-6 shadow-[5px_5px_0_#1E232A]">
                <span className="font-mono text-xs text-gray-500 font-bold uppercase block">
                  ACTIVE SQUADS
                </span>
                <span className="font-pixel text-3xl sm:text-4xl text-[#3B4CCA] mt-2 block">
                  {data.metrics.totalTeams}
                </span>
                <span className="text-xs text-gray-600 mt-2 block">
                  Teams formed with unique Team IDs
                </span>
              </div>

              <div className="bg-white border-3 border-[#1E232A] rounded-2xl p-6 shadow-[5px_5px_0_#1E232A]">
                <span className="font-mono text-xs text-gray-500 font-bold uppercase block">
                  SUBMISSION DECKS
                </span>
                <span className="font-pixel text-3xl sm:text-4xl text-[#FFCB05] mt-2 block text-shadow-sm">
                  {data.metrics.totalSubmissions}
                </span>
                <span className="text-xs text-gray-600 mt-2 block">
                  Uploaded presentations in secure bucket
                </span>
              </div>
            </div>

            {/* Quick Actions Panel */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Quick Announcement */}
              <div className="bg-white border-3 border-[#1E232A] rounded-2xl p-6 shadow-[5px_5px_0_#1E232A]">
                <div className="flex items-center gap-2 mb-4">
                  <Bell className="text-[#EE1515]" size={20} />
                  <h3 className="font-pixel text-xs sm:text-sm text-[#1E232A]">
                    POST ARENA BROADCAST
                  </h3>
                </div>
                <form onSubmit={handleSaveAnnouncement} className="space-y-3">
                  <input
                    type="text"
                    required
                    placeholder="Announcement Title (e.g. Problem Statement Released!)"
                    value={annTitle}
                    onChange={(e) => setAnnTitle(e.target.value)}
                    className="w-full px-3 py-2 border-2 border-[#1E232A] rounded-lg text-xs"
                  />
                  <textarea
                    required
                    rows={3}
                    placeholder="Broadcast message details..."
                    value={annContent}
                    onChange={(e) => setAnnContent(e.target.value)}
                    className="w-full px-3 py-2 border-2 border-[#1E232A] rounded-lg text-xs"
                  />
                  <div className="flex items-center justify-between">
                    <select
                      value={annPriority}
                      onChange={(e) => setAnnPriority(e.target.value)}
                      className="px-2.5 py-1.5 border-2 border-[#1E232A] rounded-lg text-xs font-mono"
                    >
                      <option value="normal">Normal Priority</option>
                      <option value="urgent">Urgent Alert</option>
                    </select>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-[#EE1515] text-white font-pixel text-[10px] rounded-lg border-2 border-[#1E232A] shadow-[2px_2px_0_black]"
                    >
                      BROADCAST TO ARENA
                    </button>
                  </div>
                </form>
              </div>

              {/* Event Live Status */}
              <div className="bg-white border-3 border-[#1E232A] rounded-2xl p-6 shadow-[5px_5px_0_#1E232A] flex flex-col justify-between">
                <div>
                  <h3 className="font-pixel text-xs sm:text-sm text-[#3B4CCA] mb-3">
                    ARENA CLOCK & SCHEDULE
                  </h3>
                  <div className="space-y-2 text-xs font-mono">
                    <div className="flex justify-between p-2 bg-gray-50 rounded border">
                      <span className="text-gray-500">COUNTDOWN TARGET:</span>
                      <span className="font-bold text-[#EE1515]">
                        {new Date(data.eventSettings.countdown_target).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between p-2 bg-gray-50 rounded border">
                      <span className="text-gray-500">SUBMISSION DEADLINE:</span>
                      <span className="font-bold text-[#1E232A]">
                        {new Date(data.eventSettings.deadline).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between p-2 bg-gray-50 rounded border">
                      <span className="text-gray-500">REGISTRATION LOCK:</span>
                      <span className="font-bold text-[#1E232A]">
                        {new Date(data.eventSettings.registration_deadline).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t">
                  <button
                    onClick={() => setActiveTab('settings')}
                    className="w-full py-2 bg-gray-100 hover:bg-gray-200 text-[#1E232A] font-pixel text-[10px] rounded-lg border border-[#1E232A]"
                  >
                    CONFIGURE EVENT DATES & TIMELINE
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: PARTICIPANTS */}
        {activeTab === 'participants' && (
          <div className="bg-white border-3 border-[#1E232A] rounded-2xl p-6 shadow-[5px_5px_0_#1E232A]">
            {/* Table Controls */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <div className="relative flex-1 sm:w-64">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search Name, Email, Trainer ID..."
                    value={participantSearch}
                    onChange={(e) => setParticipantSearch(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 border-2 border-[#1E232A] rounded-xl text-xs"
                  />
                </div>
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className="px-3 py-2 border-2 border-[#1E232A] rounded-xl text-xs font-mono"
                >
                  <option value="all">All Roles</option>
                  <option value="participant">Participant</option>
                  <option value="admin">Admin</option>
                  <option value="master">Master</option>
                </select>
              </div>

              <button
                onClick={handleExportCSV}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-[#3B4CCA] hover:bg-[#2A3A98] text-white font-pixel text-[10px] rounded-xl border-2 border-[#1E232A] shadow-[2px_2px_0_black]"
              >
                <Download size={14} />
                <span>EXPORT CSV ({filteredParticipants.length})</span>
              </button>
            </div>

            {/* Participants Table */}
            <div className="overflow-x-auto border-2 border-gray-200 rounded-xl">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-gray-100 border-b-2 border-gray-300 font-pixel text-[9px] text-gray-600">
                    <th className="p-3">TRAINER ID</th>
                    <th className="p-3">NAME</th>
                    <th className="p-3">EMAIL</th>
                    <th className="p-3">ROLE</th>
                    <th className="p-3">SQUAD</th>
                    <th className="p-3">PHONE</th>
                    <th className="p-3">JOINED</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 font-sans">
                  {filteredParticipants.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-6 text-center text-gray-500 font-mono">
                        No trainers match the current search filter.
                      </td>
                    </tr>
                  ) : (
                    filteredParticipants.map((p: any) => (
                      <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                        <td className="p-3 font-pixel text-[10px] text-[#EE1515]">{p.trainer_id}</td>
                        <td className="p-3 font-bold text-[#1E232A]">{p.full_name}</td>
                        <td className="p-3 font-mono text-gray-600">{p.email}</td>
                        <td className="p-3">
                          <span
                            className={`px-2 py-0.5 rounded font-pixel text-[8px] ${
                              p.role === 'master'
                                ? 'bg-[#FFCB05] text-[#1E232A]'
                                : p.role === 'admin'
                                ? 'bg-[#EE1515] text-white'
                                : 'bg-gray-200 text-gray-700'
                            }`}
                          >
                            {p.role}
                          </span>
                        </td>
                        <td className="p-3 font-mono">
                          {p.team_code ? (
                            <span className="text-[#3B4CCA] font-bold">
                              {p.team_name} ({p.team_code})
                            </span>
                          ) : (
                            <span className="text-gray-400">Solo</span>
                          )}
                        </td>
                        <td className="p-3 font-mono text-gray-600">
                          {(p.phones || []).join(', ') || 'None'}
                        </td>
                        <td className="p-3 font-mono text-gray-500 text-[10px]">
                          {new Date(p.created_at).toLocaleDateString()}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: SQUADS (TEAMS) */}
        {activeTab === 'teams' && (
          <div className="bg-white border-3 border-[#1E232A] rounded-2xl p-6 shadow-[5px_5px_0_#1E232A]">
            <div className="flex items-center justify-between mb-6">
              <div className="relative w-72">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search Squads by Name or ID..."
                  value={teamSearch}
                  onChange={(e) => setTeamSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 border-2 border-[#1E232A] rounded-xl text-xs"
                />
              </div>
              <span className="font-mono text-xs text-gray-500 font-bold">
                TOTAL SQUADS: {filteredTeams.length}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredTeams.map((team: any) => (
                <div
                  key={team.id}
                  className="bg-gray-50 border-2 border-[#1E232A] rounded-xl p-4 shadow-[3px_3px_0_#1E232A] flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-pixel text-[11px] text-[#EE1515]">{team.team_id}</span>
                      <span className="px-2 py-0.5 bg-black/10 rounded font-mono text-[10px] font-bold">
                        JOIN CODE: {team.join_code}
                      </span>
                    </div>

                    <h4 className="font-bold text-base text-[#1E232A] mb-1">{team.name}</h4>
                    <p className="text-xs text-gray-500 font-mono">
                      Leader: {team.leader_name} ({team.leader_email})
                    </p>

                    <div className="mt-3 pt-2 border-t border-gray-200">
                      <span className="text-[10px] font-mono text-gray-500 uppercase block mb-1">
                        MEMBERS ENROLLED: {team.member_count} / 4
                      </span>
                    </div>
                  </div>

                  {/* Submission Status & PPT Preview */}
                  <div className="mt-4 pt-3 border-t border-gray-200 flex items-center justify-between">
                    <div>
                      {team.submissions_list && team.submissions_list.length > 0 ? (
                        <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded font-pixel text-[8px] font-bold">
                          SUBMITTED (v{team.submissions_list[0].version})
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 bg-amber-100 text-amber-800 rounded font-pixel text-[8px]">
                          NO SUBMISSION
                        </span>
                      )}
                    </div>

                    {team.submissions_list && team.submissions_list[0] && (
                      <button
                        onClick={() => handlePreviewDeck(team.submissions_list[0].ppt_url)}
                        disabled={signedUrlLoading === team.submissions_list[0].ppt_url}
                        className="flex items-center gap-1.5 px-3 py-1 bg-[#EE1515] hover:bg-[#D01010] text-white font-pixel text-[8px] rounded-lg border border-black shadow-[1px_1px_0_black]"
                      >
                        <ExternalLink size={10} />
                        <span>
                          {signedUrlLoading === team.submissions_list[0].ppt_url
                            ? 'FETCHING...'
                            : 'VIEW PPT DECK'}
                        </span>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 4: PROBLEM STATEMENTS */}
        {activeTab === 'problems' && (
          <div className="space-y-6">
            {/* Create/Edit Form */}
            <div className="bg-white border-3 border-[#1E232A] rounded-2xl p-6 shadow-[5px_5px_0_#1E232A]">
              <h3 className="font-pixel text-xs sm:text-sm text-[#1E232A] mb-4">
                {editingPsId ? 'EDIT PROBLEM STATEMENT' : 'ADD NEW PROBLEM STATEMENT'}
              </h3>
              <form onSubmit={handleSaveProblemStatement} className="space-y-4">
                <div>
                  <label className="font-pixel text-[9px] text-gray-700 block mb-1">
                    TITLE
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="AI Poké-Copilot for Smart Municipalities"
                    value={psTitle}
                    onChange={(e) => setPsTitle(e.target.value)}
                    className="w-full px-3 py-2 border-2 border-[#1E232A] rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="font-pixel text-[9px] text-gray-700 block mb-1">
                    DESCRIPTION / SPECIFICATIONS
                  </label>
                  <textarea
                    required
                    rows={4}
                    placeholder="Detailed problem statement requirements, datasets, and judging criteria..."
                    value={psDesc}
                    onChange={(e) => setPsDesc(e.target.value)}
                    className="w-full px-3 py-2 border-2 border-[#1E232A] rounded-lg text-xs font-sans"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="font-pixel text-[9px] text-gray-700 block mb-1">
                      ATTACHED FILE / DATASET URL (OPTIONAL)
                    </label>
                    <input
                      type="url"
                      placeholder="https://.../problem-spec.pdf"
                      value={psFileUrl}
                      onChange={(e) => setPsFileUrl(e.target.value)}
                      className="w-full px-3 py-2 border-2 border-[#1E232A] rounded-lg text-xs font-mono"
                    />
                  </div>
                  <div className="flex items-center gap-3 pt-6">
                    <label className="flex items-center gap-2 cursor-pointer font-bold text-xs">
                      <input
                        type="checkbox"
                        checked={psVisible}
                        onChange={(e) => setPsVisible(e.target.checked)}
                        className="w-4 h-4 rounded border-gray-300 text-[#EE1515]"
                      />
                      <span>Visible to participants immediately</span>
                    </label>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    type="submit"
                    className="px-6 py-2.5 bg-[#EE1515] text-white font-pixel text-[10px] rounded-lg border-2 border-[#1E232A] shadow-[2px_2px_0_black]"
                  >
                    {editingPsId ? 'UPDATE STATEMENT' : 'SAVE STATEMENT'}
                  </button>
                  {editingPsId && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingPsId(null);
                        setPsTitle('');
                        setPsDesc('');
                        setPsFileUrl('');
                      }}
                      className="px-4 py-2.5 bg-gray-200 text-gray-800 font-pixel text-[10px] rounded-lg"
                    >
                      CANCEL
                    </button>
                  )}
                </div>
              </form>
            </div>

            {/* Existing Statements */}
            <div className="bg-white border-3 border-[#1E232A] rounded-2xl p-6 shadow-[5px_5px_0_#1E232A]">
              <h3 className="font-pixel text-xs sm:text-sm text-[#1E232A] mb-4">
                STATEMENT REGISTRY ({data.problemStatements.length})
              </h3>
              <div className="space-y-3">
                {data.problemStatements.map((ps: any) => (
                  <div
                    key={ps.id}
                    className="p-4 bg-gray-50 border-2 border-[#1E232A] rounded-xl flex items-start justify-between gap-4"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-pixel text-xs text-[#1E232A]">{ps.title}</span>
                        {ps.is_visible ? (
                          <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded font-mono text-[9px] font-bold">
                            VISIBLE
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 bg-gray-200 text-gray-600 rounded font-mono text-[9px] font-bold">
                            HIDDEN
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-600 font-sans line-clamp-2">{ps.description}</p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => toggleProblemStatementVisibility(ps.id, !ps.is_visible)}
                        className="p-2 bg-white hover:bg-gray-100 rounded-lg border border-gray-300 text-gray-700"
                        title={ps.is_visible ? 'Hide from participants' : 'Make visible'}
                      >
                        {ps.is_visible ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                      <button
                        onClick={() => {
                          setEditingPsId(ps.id);
                          setPsTitle(ps.title);
                          setPsDesc(ps.description);
                          setPsFileUrl(ps.file_url || '');
                          setPsVisible(ps.is_visible);
                        }}
                        className="px-2.5 py-1.5 bg-white hover:bg-gray-100 rounded-lg border border-gray-300 font-pixel text-[8px]"
                      >
                        EDIT
                      </button>
                      <button
                        onClick={() => {
                          if (confirm('Delete this statement?')) deleteProblemStatement(ps.id);
                        }}
                        className="p-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg border border-red-300"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: BROADCASTS & ANNOUNCEMENTS */}
        {activeTab === 'announcements' && (
          <div className="bg-white border-3 border-[#1E232A] rounded-2xl p-6 shadow-[5px_5px_0_#1E232A]">
            <h3 className="font-pixel text-xs sm:text-sm text-[#1E232A] mb-4">
              ARENA BROADCASTS FEED
            </h3>
            <div className="space-y-3">
              {data.announcements.map((ann: any) => (
                <div
                  key={ann.id}
                  className="p-4 bg-gray-50 border-2 border-[#1E232A] rounded-xl flex items-start justify-between gap-4"
                >
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-pixel text-xs text-[#1E232A]">{ann.title}</span>
                      <span className="text-[10px] font-mono text-gray-500">
                        {new Date(ann.created_at).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-xs text-gray-700 font-sans leading-relaxed">{ann.content}</p>
                  </div>
                  <button
                    onClick={() => {
                      if (confirm('Delete broadcast?')) deleteAnnouncement(ann.id);
                    }}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg border border-red-300"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 6: EVENT SETTINGS */}
        {activeTab === 'settings' && (
          <div className="space-y-6">
            <div className="bg-white border-3 border-[#1E232A] rounded-2xl p-6 shadow-[5px_5px_0_#1E232A]">
              <div className="flex items-center justify-between mb-6">
              <h3 className="font-pixel text-xs sm:text-sm text-[#1E232A]">
                EVENT CONFIGURATION & LANDING CONTENT
              </h3>
              {settingsSaved && (
                <span className="px-3 py-1 bg-emerald-100 text-emerald-800 rounded font-pixel text-[9px] font-bold">
                  CHANGES SYNCHRONIZED TO LEAGUE DB!
                </span>
              )}
            </div>

            <form onSubmit={handleSaveSettings} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="font-pixel text-[9px] text-gray-700 block mb-1">
                    EVENT NAME
                  </label>
                  <input
                    type="text"
                    value={settingsForm.name || ''}
                    onChange={(e) => setSettingsForm({ ...settingsForm, name: e.target.value })}
                    className="w-full px-3 py-2 border-2 border-[#1E232A] rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="font-pixel text-[9px] text-gray-700 block mb-1">
                    TAGLINE
                  </label>
                  <input
                    type="text"
                    value={settingsForm.tagline || ''}
                    onChange={(e) => setSettingsForm({ ...settingsForm, tagline: e.target.value })}
                    className="w-full px-3 py-2 border-2 border-[#1E232A] rounded-lg text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="font-pixel text-[9px] text-gray-700 block mb-1">
                    COUNTDOWN TARGET (OCT 18)
                  </label>
                  <input
                    type="text"
                    value={settingsForm.countdown_target || ''}
                    onChange={(e) => setSettingsForm({ ...settingsForm, countdown_target: e.target.value })}
                    className="w-full px-3 py-2 border-2 border-[#1E232A] rounded-lg text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="font-pixel text-[9px] text-gray-700 block mb-1">
                    SUBMISSION DEADLINE
                  </label>
                  <input
                    type="text"
                    value={settingsForm.deadline || ''}
                    onChange={(e) => setSettingsForm({ ...settingsForm, deadline: e.target.value })}
                    className="w-full px-3 py-2 border-2 border-[#1E232A] rounded-lg text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="font-pixel text-[9px] text-gray-700 block mb-1">
                    REGISTRATION DEADLINE
                  </label>
                  <input
                    type="text"
                    value={settingsForm.registration_deadline || ''}
                    onChange={(e) => setSettingsForm({ ...settingsForm, registration_deadline: e.target.value })}
                    className="w-full px-3 py-2 border-2 border-[#1E232A] rounded-lg text-xs font-mono"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="px-6 py-3 bg-[#EE1515] text-white font-pixel text-xs rounded-xl border-2 border-[#1E232A] shadow-[3px_3px_0_black]"
              >
                SAVE EVENT SETTINGS
              </button>
            </form>
          </div>

          {/* ADMIN CREDENTIALS & PASSWORD MANAGEMENT */}
          <div className="bg-white border-3 border-[#1E232A] rounded-2xl p-6 shadow-[5px_5px_0_#1E232A] mt-6">
            <div className="flex items-center gap-2 mb-2">
              <Lock className="text-[#EE1515]" size={20} />
              <h3 className="font-pixel text-xs sm:text-sm text-[#1E232A]">
                ADMIN SECURITY & PASSWORD SETTINGS
              </h3>
            </div>
            <p className="text-xs text-gray-600 mb-4 font-sans">
              Update your administrator credentials. All newly promoted Admins and Masters start with the default password: <code className="bg-amber-100 text-[#1E232A] px-2 py-0.5 rounded font-mono font-bold border border-amber-300">password@67</code>.
            </p>

            <div className="mb-4 p-3 bg-gray-50 border border-gray-200 rounded-xl flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="font-pixel text-[9px] text-gray-500">OPERATOR:</span>
                <span className="font-mono text-xs font-bold text-[#1E232A]">{data.userEmail || 'Active Admin'}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-pixel text-[9px] text-gray-500">CLEARANCE:</span>
                <span className="px-2 py-0.5 bg-[#FFCB05] text-[#1E232A] font-pixel text-[9px] font-bold rounded border border-[#1E232A]">
                  {data.currentRole?.toUpperCase() || 'ADMIN'}
                </span>
              </div>
            </div>

            {passwordSuccess && (
              <div className="mb-4 p-3 bg-emerald-50 border border-emerald-400 rounded-xl flex items-center gap-2 text-emerald-800 text-xs font-bold font-sans">
                <Check size={16} />
                <span>{passwordSuccess}</span>
              </div>
            )}

            {passwordError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-400 rounded-xl flex items-center gap-2 text-red-800 text-xs font-bold font-sans">
                <AlertTriangle size={16} />
                <span>{passwordError}</span>
              </div>
            )}

            <form onSubmit={handleChangePassword} className="space-y-4 max-w-md">
              <div>
                <label className="font-pixel text-[9px] text-gray-700 block mb-1">
                  NEW PASSWORD
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={newAdminPassword}
                    onChange={(e) => setNewAdminPassword(e.target.value)}
                    placeholder="Enter new password (min. 6 characters)"
                    required
                    className="w-full px-3 py-2 pr-10 border-2 border-[#1E232A] rounded-lg text-xs font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2.5 top-2.5 text-gray-500 hover:text-gray-800"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div>
                <label className="font-pixel text-[9px] text-gray-700 block mb-1">
                  CONFIRM NEW PASSWORD
                </label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={confirmAdminPassword}
                  onChange={(e) => setConfirmAdminPassword(e.target.value)}
                  placeholder="Re-enter new password"
                  required
                  className="w-full px-3 py-2 border-2 border-[#1E232A] rounded-lg text-xs font-mono"
                />
              </div>

              <button
                type="submit"
                disabled={changingPassword}
                className="px-6 py-2.5 bg-[#3B4CCA] hover:bg-blue-700 text-white font-pixel text-xs rounded-xl border-2 border-[#1E232A] shadow-[3px_3px_0_black] flex items-center gap-2 disabled:opacity-50"
              >
                <Key size={14} />
                <span>{changingPassword ? 'UPDATING...' : 'UPDATE PASSWORD'}</span>
              </button>
            </form>
          </div>
        </div>
        )}

        {/* TAB 7: MASTER VAULT (Master only) */}
        {activeTab === 'master' && data.isMaster && (
          <div className="space-y-6">
            {/* Promote Admin Form */}
            <div className="bg-white border-3 border-[#1E232A] rounded-2xl p-6 shadow-[5px_5px_0_#1E232A]">
              <div className="flex items-center gap-2 mb-4">
                <Crown className="text-amber-500" size={24} />
                <h3 className="font-pixel text-sm text-[#1E232A]">
                  MASTER COMMAND: PROMOTE ADMIN
                </h3>
              </div>
              <p className="text-xs text-gray-600 mb-4 font-sans">
                Promote any verified @slrtce.in trainer to League Admin role with elevated privileges. New admins will receive default password <code className="bg-amber-100 text-amber-800 px-1 py-0.5 rounded font-mono font-bold">password@67</code>.
              </p>

              {promoteMsg && (
                <div className="p-3 bg-amber-50 border border-amber-300 rounded-lg text-xs font-mono font-bold mb-4">
                  {promoteMsg}
                </div>
              )}

              <form onSubmit={handlePromoteAdmin} className="flex gap-3">
                <input
                  type="email"
                  required
                  placeholder="trainer@slrtce.in"
                  value={promoteEmail}
                  onChange={(e) => setPromoteEmail(e.target.value)}
                  className="flex-1 px-3 py-2 border-2 border-[#1E232A] rounded-lg text-xs"
                />
                <button
                  type="submit"
                  className="px-6 py-2 bg-[#3B4CCA] text-white font-pixel text-[10px] rounded-lg border-2 border-[#1E232A] shadow-[2px_2px_0_black]"
                >
                  PROMOTE TO ADMIN
                </button>
              </form>
            </div>

            {/* Current Admins List */}
            <div className="bg-white border-3 border-[#1E232A] rounded-2xl p-6 shadow-[5px_5px_0_#1E232A]">
              <h3 className="font-pixel text-xs sm:text-sm text-[#1E232A] mb-4">
                ACTIVE ADMINS & MASTERS ({data.admins.length})
              </h3>
              <div className="space-y-2">
                {data.admins.map((adm: any) => (
                  <div
                    key={adm.id}
                    className="p-3 bg-gray-50 border border-gray-300 rounded-lg flex flex-wrap items-center justify-between gap-2"
                  >
                    <div>
                      <span className="font-bold text-xs text-[#1E232A] mr-2">{adm.full_name}</span>
                      <span className="font-mono text-xs text-gray-600">{adm.email}</span>
                      <span className="ml-2 font-pixel text-[8px] px-2 py-0.5 bg-[#FFCB05] text-[#1E232A] rounded">
                        {adm.role}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={async () => {
                          if (confirm(`Reset password to "password@67" for ${adm.full_name}?`)) {
                            setResettingId(adm.id);
                            try {
                              await resetAdminPassword(adm.id);
                              playVictoryChime();
                              alert(`Password for ${adm.full_name} (${adm.email}) has been reset to "password@67"!`);
                            } catch (err: any) {
                              alert(err.message);
                            } finally {
                              setResettingId(null);
                            }
                          }
                        }}
                        disabled={resettingId === adm.id}
                        className="px-2 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 font-pixel text-[8px] rounded border border-amber-300 disabled:opacity-50"
                      >
                        {resettingId === adm.id ? 'RESETTING...' : 'RESET PWD'}
                      </button>

                      {adm.role === 'admin' && (
                        <button
                          onClick={() => {
                            if (confirm(`Revoke admin privileges for ${adm.full_name}?`)) demoteAdmin(adm.id);
                          }}
                          className="px-2 py-1 bg-red-100 hover:bg-red-200 text-red-700 font-pixel text-[8px] rounded border border-red-300"
                        >
                          REVOKE ADMIN
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Audit Log Table */}
            <div className="bg-white border-3 border-[#1E232A] rounded-2xl p-6 shadow-[5px_5px_0_#1E232A]">
              <div className="flex items-center gap-2 mb-4">
                <History size={18} className="text-[#EE1515]" />
                <h3 className="font-pixel text-xs sm:text-sm text-[#1E232A]">
                  AUDIT LOG REGISTRY ({data.auditLogs.length})
                </h3>
              </div>

              <div className="overflow-x-auto border rounded-xl max-h-96">
                <table className="w-full text-left text-xs">
                  <thead className="bg-gray-100 font-pixel text-[9px] text-gray-600 border-b">
                    <tr>
                      <th className="p-2.5">TIMESTAMP</th>
                      <th className="p-2.5">OPERATOR</th>
                      <th className="p-2.5">ACTION</th>
                      <th className="p-2.5">TARGET</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y font-mono text-[11px]">
                    {data.auditLogs.map((log: any) => (
                      <tr key={log.id} className="hover:bg-gray-50">
                        <td className="p-2.5 text-gray-500">{new Date(log.created_at).toLocaleString()}</td>
                        <td className="p-2.5 font-bold text-gray-800">{log.actor_email || 'SYSTEM'}</td>
                        <td className="p-2.5 text-[#EE1515] font-bold">{log.action}</td>
                        <td className="p-2.5 text-gray-600 truncate max-w-xs">{log.target_type}: {log.target_id}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
