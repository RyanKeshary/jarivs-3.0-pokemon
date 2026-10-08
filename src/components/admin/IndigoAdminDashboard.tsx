'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  adminUpdateParticipantStatus,
  adminUpdateParticipantDetails,
  adminCreateManualParticipant,
  adminBulkUpdateStatus,
  adminUpdateTeam,
  adminDeleteTeam,
  adminChangeTeamLeader,
  adminMoveMember,
  adminUpdateEvent,
  adminPostFestAnnouncement,
  adminDeleteFestAnnouncement,
  changeAdminPassword
} from '@/app/actions/admin';

interface IndigoAdminDashboardProps {
  data: any;
  onRefresh?: () => void;
}

export function IndigoAdminDashboard({ data, onRefresh }: IndigoAdminDashboardProps) {
  const [activeTab, setActiveTab] = useState<
    'dashboard' | 'registrations' | 'teams' | 'checkin' | 'events' | 'announcements' | 'audit' | 'password'
  >('dashboard');

  // Registrations Filter & Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [eventFilter, setEventFilter] = useState('ALL');
  const [dayFilter, setDayFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [completionFilter, setCompletionFilter] = useState('ALL');
  const [selectedRegIds, setSelectedRegIds] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 15;

  // Modals & Forms State
  const [editingParticipant, setEditingParticipant] = useState<any | null>(null);
  const [manualModalOpen, setManualModalOpen] = useState(false);
  const [feedbackNotice, setFeedbackNotice] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Manual participant form state
  const [manualForm, setManualForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    college: '',
    department: '',
    yearOfStudy: '3rd Year',
    collegeId: '',
    teamId: '',
    isLeader: true,
    status: 'Confirmed'
  });

  // Check-In Mode Search State
  const [checkinQuery, setCheckinQuery] = useState('');

  // Password Change State
  const [newPassword, setNewPassword] = useState('');
  const [passwordMsg, setPasswordMsg] = useState<string | null>(null);

  // Announcement Form State
  const [announcementTitle, setAnnouncementTitle] = useState('');
  const [announcementContent, setAnnouncementContent] = useState('');

  // Editing Event Settings State
  const [editingEvent, setEditingEvent] = useState<any | null>(null);

  const { metrics, perEventStats, timelineData, registrations, teams, events, announcements, auditLogs, currentUser } = data;

  // Filtered registrations
  const filteredRegistrations = useMemo(() => {
    return (registrations || []).filter((reg: any) => {
      // Search query
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        reg.full_name?.toLowerCase().includes(q) ||
        reg.email?.toLowerCase().includes(q) ||
        reg.phone?.includes(q) ||
        reg.team_code?.toLowerCase().includes(q) ||
        reg.team_name?.toLowerCase().includes(q) ||
        reg.college?.toLowerCase().includes(q);

      if (!matchesSearch) return false;

      // Event filter
      if (eventFilter !== 'ALL' && !(reg.event_ids || []).includes(eventFilter)) {
        return false;
      }

      // Status filter
      if (statusFilter !== 'ALL' && reg.status !== statusFilter) {
        return false;
      }

      return true;
    });
  }, [registrations, searchQuery, eventFilter, statusFilter]);

  // Pagination for registrations
  const totalPages = Math.ceil(filteredRegistrations.length / pageSize) || 1;
  const paginatedRegistrations = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredRegistrations.slice(start, start + pageSize);
  }, [filteredRegistrations, currentPage]);

  // Bulk Select Toggle
  const toggleSelectAll = () => {
    if (selectedRegIds.length === paginatedRegistrations.length) {
      setSelectedRegIds([]);
    } else {
      setSelectedRegIds(paginatedRegistrations.map((r: any) => r.id));
    }
  };

  const toggleSelectOne = (id: string) => {
    setSelectedRegIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Status Handlers
  const handleStatusChange = async (id: string, newStatus: string) => {
    setIsProcessing(true);
    await adminUpdateParticipantStatus(id, newStatus);
    setIsProcessing(false);
    setFeedbackNotice(`Status updated to ${newStatus}.`);
    if (onRefresh) onRefresh();
  };

  const handleBulkStatus = async (newStatus: string) => {
    if (selectedRegIds.length === 0) return;
    setIsProcessing(true);
    await adminBulkUpdateStatus(selectedRegIds, newStatus);
    setIsProcessing(false);
    setFeedbackNotice(`Updated status for ${selectedRegIds.length} participants.`);
    setSelectedRegIds([]);
    if (onRefresh) onRefresh();
  };

  // CSV Export
  const exportToCSV = (filterType: 'all' | 'checkedin' | 'day1' | 'day2' = 'all') => {
    let rows = registrations || [];
    if (filterType === 'checkedin') {
      rows = rows.filter((r: any) => r.status === 'Checked In');
    }

    const headers = [
      'ID',
      'Full Name',
      'Email',
      'Phone',
      'College',
      'Department',
      'Year',
      'College ID',
      'Team Name',
      'Team Code',
      'Events',
      'Status',
      'Registered At'
    ];

    const csvContent = [
      headers.join(','),
      ...rows.map((r: any) =>
        [
          r.id,
          `"${r.full_name}"`,
          r.email,
          r.phone,
          `"${r.college}"`,
          `"${r.department}"`,
          r.year_of_study,
          `"${r.college_id || ''}"`,
          `"${r.team_name}"`,
          r.team_code,
          `"${(r.event_ids || []).join('; ')}"`,
          r.status,
          r.created_at
        ].join(',')
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `indigo_tech_fest_${filterType}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Print Check-In Sheet
  const handlePrintSheet = (eventId?: string) => {
    window.print();
  };

  // Password Change
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      setPasswordMsg('Password must be at least 6 characters.');
      return;
    }
    const res = await changeAdminPassword(newPassword);
    if (res.success) {
      setPasswordMsg('Password changed successfully.');
      setNewPassword('');
    } else {
      setPasswordMsg('Failed to change password.');
    }
  };

  // Post Announcement
  const handlePostAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!announcementTitle.trim() || !announcementContent.trim()) return;
    await adminPostFestAnnouncement(announcementTitle, announcementContent);
    setAnnouncementTitle('');
    setAnnouncementContent('');
    setFeedbackNotice('Announcement published to site banner.');
    if (onRefresh) onRefresh();
  };

  return (
    <div className="min-h-screen bg-[#1B1E4A] text-[#E9E6DA] flex flex-col select-none">
      
      {/* Top Admin Navigation Header */}
      <header className="sticky top-0 z-30 bg-[#121435] border-b border-[#AFAEA2] px-4 sm:px-8 py-3">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          
          <div className="flex items-center gap-4">
            <Link href="/" className="font-serif text-xl sm:text-2xl text-[#D21319] font-bold uppercase tracking-tight">
              INDIGO TECH FEST
            </Link>
            <span className="label-editorial text-[9px] border border-[#AFAEA2]/40 px-2 py-0.5">
              ADMINISTRATIVE MASTHEAD · {currentUser?.email}
            </span>
          </div>

          {/* Action Tabs */}
          <nav className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
            {(
              [
                { id: 'dashboard', label: 'DASHBOARD' },
                { id: 'registrations', label: 'REGISTRATIONS' },
                { id: 'teams', label: 'TEAMS' },
                { id: 'checkin', label: 'CHECK-IN' },
                { id: 'events', label: 'EVENT SETTINGS' },
                { id: 'announcements', label: 'NOTICES' },
                { id: 'audit', label: 'AUDIT LOG' },
                { id: 'password', label: 'SECURITY' }
              ] as const
            ).map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-3 py-1 text-xs font-grotesk font-bold uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap ${
                    isActive
                      ? 'bg-[#D21319] text-[#E9E6DA] border border-[#D21319] shadow-[2px_2px_0px_#0E1026]'
                      : 'bg-[#AFAEA2] text-[#1B1E4A] border border-[#AFAEA2] shadow-[2px_2px_0px_#0E1026] hover:bg-[#E9E6DA]'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </nav>

        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-8 py-8">
        
        {/* Global Feedback Banner */}
        {feedbackNotice && (
          <div className="mb-6 p-3 bg-[#121435] border border-[#E9E6DA] text-xs font-mono flex items-center justify-between">
            <span>[ SYSTEM ]: {feedbackNotice}</span>
            <button onClick={() => setFeedbackNotice(null)} className="underline ml-4">[ DISMISS ]</button>
          </div>
        )}

        {/* 1. DASHBOARD TAB */}
        {activeTab === 'dashboard' && (
          <div className="space-y-8">
            
            {/* Top Metric Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-5 bg-[#121435] border border-[#AFAEA2] shadow-[3px_3px_0px_#0E1026]">
                <span className="label-editorial text-[9px] block">TOTAL REGISTRANTS</span>
                <span className="font-serif text-3xl sm:text-5xl font-bold text-[#E9E6DA] block mt-1">
                  {metrics.totalParticipants}
                </span>
                <span className="text-[10px] font-mono text-[#AFAEA2] mt-1 block">CONFIRMED CANDIDATES</span>
              </div>

              <div className="p-5 bg-[#121435] border border-[#AFAEA2] shadow-[3px_3px_0px_#0E1026]">
                <span className="label-editorial text-[9px] block">REGISTERED SQUADS</span>
                <span className="font-serif text-3xl sm:text-5xl font-bold text-[#E9E6DA] block mt-1">
                  {metrics.totalTeams}
                </span>
                <span className="text-[10px] font-mono text-[#AFAEA2] mt-1 block">ACTIVE TEAM ROSTERS</span>
              </div>

              <div className="p-5 bg-[#121435] border border-[#AFAEA2] shadow-[3px_3px_0px_#0E1026]">
                <span className="label-editorial text-[9px] block text-[#D21319]">INCOMPLETE SQUADS</span>
                <span className="font-serif text-3xl sm:text-5xl font-bold text-[#D21319] block mt-1">
                  {metrics.incompleteTeamsCount}
                </span>
                <span className="text-[10px] font-mono text-[#AFAEA2] mt-1 block">BELOW MINIMUM ROSTER SIZE</span>
              </div>

              <div className="p-5 bg-[#121435] border border-[#AFAEA2] shadow-[3px_3px_0px_#0E1026]">
                <span className="label-editorial text-[9px] block">WAITLIST ROSTERS</span>
                <span className="font-serif text-3xl sm:text-5xl font-bold text-[#AFAEA2] block mt-1">
                  {metrics.waitlistCount}
                </span>
                <span className="text-[10px] font-mono text-[#AFAEA2] mt-1 block">OVER-CAPACITY QUEUE</span>
              </div>
            </div>

            {/* Registrations Over Time Line Chart in Theme Colors */}
            <div className="p-6 bg-[#121435] border border-[#AFAEA2] shadow-[3px_3px_0px_#0E1026]">
              <div className="flex items-center justify-between mb-4 border-b border-[#AFAEA2]/30 pb-2">
                <span className="label-editorial text-xs">
                  REGISTRATIONS OVER TIME · CHRONOLOGICAL INFLUX
                </span>
                <span className="text-xs font-mono text-[#AFAEA2]">THEME COLOR SPECTRUM</span>
              </div>

              {timelineData && timelineData.length > 0 ? (
                <div className="h-44 flex items-end gap-3 pt-6 px-2 overflow-x-auto">
                  {timelineData.map((d: any, idx: number) => {
                    const maxCount = Math.max(...timelineData.map((t: any) => t.count), 1);
                    const heightPercent = Math.max(15, (d.count / maxCount) * 100);

                    return (
                      <div key={idx} className="flex-1 min-w-[50px] flex flex-col items-center gap-2">
                        <span className="font-mono text-xs text-[#E9E6DA] font-bold">{d.count}</span>
                        <div
                          className="w-full bg-[#D21319] border-t-2 border-[#E9E6DA] transition-all"
                          style={{ height: `${heightPercent}%` }}
                        />
                        <span className="text-[10px] font-mono text-[#AFAEA2] truncate w-full text-center">
                          {d.date}
                        </span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="py-12 text-center text-xs font-mono text-[#AFAEA2]">
                  AWAITING INITIAL REGISTRATION FLUX...
                </div>
              )}
            </div>

            {/* Per-Event Counts vs Capacity */}
            <div className="p-6 bg-[#121435] border border-[#AFAEA2] shadow-[3px_3px_0px_#0E1026]">
              <div className="border-b border-[#AFAEA2]/30 pb-2 mb-4 flex justify-between items-center">
                <span className="label-editorial text-xs">
                  DISCIPLINE ALLOCATION VS CAPACITY LIMITS
                </span>
                <span className="text-xs font-mono text-[#AFAEA2]">6 DISCIPLINES</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {perEventStats.map((ev: any) => (
                  <div key={ev.id} className="p-4 bg-[#1B1E4A] border border-[#AFAEA2]/40">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h4 className="font-serif text-base font-bold text-[#E9E6DA]">
                          {ev.name}
                        </h4>
                        <span className="text-[10px] font-mono text-[#AFAEA2]">
                          {ev.day} · {ev.teamCount} Teams ({ev.participantCount} Participants)
                        </span>
                      </div>
                      <span className="text-xs font-mono font-bold text-[#D21319]">
                        {ev.teamCount} / {ev.capacity} ({ev.percentage}%)
                      </span>
                    </div>

                    <div className="w-full h-2.5 bg-[#121435] border border-[#AFAEA2]/30">
                      <div
                        className="h-full bg-[#D21319]"
                        style={{ width: `${ev.percentage}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}

        {/* 2. REGISTRATIONS TAB */}
        {activeTab === 'registrations' && (
          <div className="space-y-6">
            
            {/* Control Bar: Search, Filters, Bulk Actions */}
            <div className="p-4 bg-[#121435] border border-[#AFAEA2] flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 shadow-[3px_3px_0px_#0E1026]">
              
              {/* Search */}
              <input
                type="text"
                placeholder="Search by name, email, phone, team code, college..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="flex-1 bg-[#1B1E4A] border border-[#AFAEA2] px-3 py-1.5 text-xs text-[#E9E6DA] font-mono focus:border-[#D21319] focus:outline-none"
              />

              {/* Event Filter */}
              <select
                value={eventFilter}
                onChange={(e) => {
                  setEventFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="bg-[#1B1E4A] border border-[#AFAEA2] px-3 py-1.5 text-xs text-[#E9E6DA] font-mono"
              >
                <option value="ALL">All Disciplines</option>
                {events.map((ev: any) => (
                  <option key={ev.id} value={ev.id}>{ev.name.split(':')[0]}</option>
                ))}
              </select>

              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="bg-[#1B1E4A] border border-[#AFAEA2] px-3 py-1.5 text-xs text-[#E9E6DA] font-mono"
              >
                <option value="ALL">All Statuses</option>
                <option value="Confirmed">Confirmed</option>
                <option value="Checked In">Checked In</option>
                <option value="Qualified for Day 2">Qualified for Day 2</option>
                <option value="Pending">Pending</option>
                <option value="Disqualified">Disqualified</option>
              </select>

              {/* Export & On-Spot Registration Buttons */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setManualModalOpen(true)}
                  className="px-3 py-1.5 bg-[#D21319] text-[#E9E6DA] font-bold text-xs uppercase border border-[#D21319] shadow-[2px_2px_0px_#0E1026]"
                >
                  + ON-SPOT REG.
                </button>

                <button
                  onClick={() => exportToCSV('all')}
                  className="px-3 py-1.5 bg-[#AFAEA2] text-[#1B1E4A] font-bold text-xs uppercase border border-[#AFAEA2] shadow-[2px_2px_0px_#0E1026] hover:bg-[#E9E6DA]"
                >
                  CSV EXPORT
                </button>
              </div>

            </div>

            {/* Bulk Selection Actions */}
            {selectedRegIds.length > 0 && (
              <div className="p-3 bg-[#121435] border border-[#D21319] flex items-center justify-between text-xs font-mono">
                <span>{selectedRegIds.length} PARTICIPANTS SELECTED</span>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleBulkStatus('Checked In')}
                    className="px-2.5 py-1 bg-[#E9E6DA] text-[#1B1E4A] font-bold"
                  >
                    MARK CHECKED IN
                  </button>
                  <button
                    onClick={() => handleBulkStatus('Qualified for Day 2')}
                    className="px-2.5 py-1 bg-[#D21319] text-[#E9E6DA] font-bold"
                  >
                    MARK QUALIFIED DAY 2
                  </button>
                  <button
                    onClick={() => handleBulkStatus('Disqualified')}
                    className="px-2.5 py-1 bg-[#AFAEA2] text-[#1B1E4A] font-bold"
                  >
                    DISQUALIFY
                  </button>
                </div>
              </div>
            )}

            {/* Registrations Table */}
            <div className="border border-[#AFAEA2] bg-[#121435] overflow-x-auto shadow-[3px_3px_0px_#0E1026]">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-[#1B1E4A] border-b border-[#AFAEA2]/40 text-[#AFAEA2]">
                  <tr>
                    <th className="p-3 w-8">
                      <input
                        type="checkbox"
                        checked={selectedRegIds.length === paginatedRegistrations.length && paginatedRegistrations.length > 0}
                        onChange={toggleSelectAll}
                      />
                    </th>
                    <th className="p-3">PARTICIPANT</th>
                    <th className="p-3">CONTACT</th>
                    <th className="p-3">SQUAD / CODE</th>
                    <th className="p-3">COLLEGE</th>
                    <th className="p-3">STATUS</th>
                    <th className="p-3 text-right">ACTIONS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#AFAEA2]/20">
                  {paginatedRegistrations.map((reg: any) => (
                    <tr key={reg.id} className="hover:bg-[#1B1E4A]/60">
                      <td className="p-3">
                        <input
                          type="checkbox"
                          checked={selectedRegIds.includes(reg.id)}
                          onChange={() => toggleSelectOne(reg.id)}
                        />
                      </td>
                      <td className="p-3">
                        <div className="font-bold text-[#E9E6DA] font-serif text-sm">
                          {reg.full_name}
                        </div>
                        {reg.is_leader && (
                          <span className="text-[9px] px-1 bg-[#D21319] text-[#E9E6DA] font-bold">
                            LEADER
                          </span>
                        )}
                      </td>
                      <td className="p-3 text-[#AFAEA2]">
                        <div>{reg.email}</div>
                        <div>{reg.phone}</div>
                      </td>
                      <td className="p-3">
                        <div className="text-[#E9E6DA] font-bold">{reg.team_name}</div>
                        <div className="text-[#D21319] tracking-wider">{reg.team_code}</div>
                      </td>
                      <td className="p-3 text-[#AFAEA2]">
                        <div>{reg.college}</div>
                        <div className="text-[10px]">{reg.department} ({reg.year_of_study})</div>
                      </td>
                      <td className="p-3">
                        <select
                          value={reg.status}
                          onChange={(e) => handleStatusChange(reg.id, e.target.value)}
                          className={`text-[11px] px-2 py-0.5 border bg-[#1B1E4A] ${
                            reg.status === 'Checked In'
                              ? 'border-[#E9E6DA] text-[#E9E6DA]'
                              : reg.status === 'Qualified for Day 2'
                              ? 'border-[#D21319] text-[#D21319]'
                              : 'border-[#AFAEA2] text-[#AFAEA2]'
                          }`}
                        >
                          <option value="Confirmed">Confirmed</option>
                          <option value="Checked In">Checked In</option>
                          <option value="Qualified for Day 2">Qualified for Day 2</option>
                          <option value="Pending">Pending</option>
                          <option value="Disqualified">Disqualified</option>
                        </select>
                      </td>
                      <td className="p-3 text-right">
                        <button
                          onClick={() => setEditingParticipant(reg)}
                          className="px-2 py-1 bg-[#AFAEA2] text-[#1B1E4A] font-bold text-[10px] uppercase hover:bg-[#E9E6DA]"
                        >
                          EDIT
                        </button>
                      </td>
                    </tr>
                  ))}
                  {paginatedRegistrations.length === 0 && (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-[#AFAEA2]">
                        NO MATCHING REGISTRATION RECORDS FOUND.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            <div className="flex items-center justify-between text-xs font-mono pt-2">
              <span className="text-[#AFAEA2]">
                SHOWING {filteredRegistrations.length} RESULTS (PAGE {currentPage} OF {totalPages})
              </span>
              <div className="flex gap-2">
                <button
                  disabled={currentPage <= 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  className="px-3 py-1 bg-[#121435] border border-[#AFAEA2] disabled:opacity-30"
                >
                  PREVIOUS
                </button>
                <button
                  disabled={currentPage >= totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  className="px-3 py-1 bg-[#121435] border border-[#AFAEA2] disabled:opacity-30"
                >
                  NEXT
                </button>
              </div>
            </div>

          </div>
        )}

        {/* 3. TEAMS MANAGEMENT TAB */}
        {activeTab === 'teams' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center border-b border-[#AFAEA2]/30 pb-3">
              <span className="label-editorial text-xs">
                SQUAD ROSTER ARCHIVE ({teams.length} TEAMS)
              </span>
              <button
                onClick={() => exportToCSV('all')}
                className="px-3 py-1 bg-[#AFAEA2] text-[#1B1E4A] font-bold text-xs uppercase"
              >
                EXPORT TEAMS
              </button>
            </div>

            <div className="border border-[#AFAEA2] bg-[#121435] divide-y divide-[#AFAEA2]/25 shadow-[3px_3px_0px_#0E1026]">
              {teams.map((t: any) => (
                <div key={t.id} className="p-4 sm:p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 hover:bg-[#1B1E4A]/60">
                  <div>
                    <div className="flex items-center gap-3">
                      <span className="font-serif text-lg font-bold text-[#E9E6DA]">
                        {t.name}
                      </span>
                      <span className="font-mono text-xs font-bold text-[#D21319] tracking-wider">
                        [{t.code}]
                      </span>
                      {t.is_waitlist && (
                        <span className="text-[9px] px-1.5 py-0.5 border border-[#AFAEA2] text-[#AFAEA2]">
                          WAITLIST
                        </span>
                      )}
                      {t.is_locked && (
                        <span className="text-[9px] px-1.5 py-0.5 border border-[#D21319] text-[#D21319]">
                          LOCKED
                        </span>
                      )}
                    </div>
                    <div className="text-xs font-mono text-[#AFAEA2] mt-1">
                      LEADER: {t.leader_name || t.leader_email} · ROSTER: {t.member_count} MEMBERS · EVENTS: {(t.event_ids || []).join(', ')}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      onClick={async () => {
                        await adminUpdateTeam(t.id, { isLocked: !t.is_locked });
                        if (onRefresh) onRefresh();
                      }}
                      className="px-2.5 py-1 border border-[#AFAEA2] text-[10px] font-mono hover:bg-[#E9E6DA] hover:text-[#1B1E4A]"
                    >
                      {t.is_locked ? 'UNLOCK' : 'LOCK'}
                    </button>

                    <button
                      onClick={async () => {
                        await adminUpdateTeam(t.id, { isWaitlist: !t.is_waitlist });
                        if (onRefresh) onRefresh();
                      }}
                      className="px-2.5 py-1 border border-[#AFAEA2] text-[10px] font-mono hover:bg-[#E9E6DA] hover:text-[#1B1E4A]"
                    >
                      {t.is_waitlist ? 'REMOVE WAITLIST' : 'WAITLIST'}
                    </button>

                    <button
                      onClick={async () => {
                        if (confirm(`Delete squad ${t.name} (${t.code}) and all member records?`)) {
                          await adminDeleteTeam(t.id);
                          if (onRefresh) onRefresh();
                        }
                      }}
                      className="px-2.5 py-1 bg-[#D21319]/20 border border-[#D21319] text-[#D21319] hover:bg-[#D21319] hover:text-[#E9E6DA] text-[10px] font-mono"
                    >
                      DELETE
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 4. CHECK-IN MODE (PHONE-FRIENDLY ONSITE DESK) */}
        {activeTab === 'checkin' && (
          <div className="max-w-2xl mx-auto space-y-6">
            <div className="p-6 bg-[#121435] border border-[#AFAEA2] text-center shadow-[4px_4px_0px_#0E1026]">
              <span className="label-editorial text-[10px] block mb-1">
                ONSITE REGISTRATION DESK · PHONE-OPTIMIZED
              </span>
              <h2 className="font-serif text-3xl text-[#E9E6DA] font-bold uppercase mb-4">
                RAPID CHECK-IN SCANNER
              </h2>

              <input
                type="text"
                autoFocus
                placeholder="Type Attendee Name, JRV-Code, or Phone..."
                value={checkinQuery}
                onChange={(e) => setCheckinQuery(e.target.value)}
                className="w-full bg-[#1B1E4A] border-2 border-[#AFAEA2] p-4 text-base sm:text-lg text-[#E9E6DA] font-mono text-center focus:border-[#D21319] focus:outline-none"
              />
            </div>

            {/* Matching Check-in Candidates */}
            <div className="space-y-3">
              {(registrations || [])
                .filter((r: any) => {
                  const q = checkinQuery.trim().toLowerCase();
                  if (!q) return false;
                  return (
                    r.full_name?.toLowerCase().includes(q) ||
                    r.team_code?.toLowerCase().includes(q) ||
                    r.phone?.includes(q) ||
                    r.email?.toLowerCase().includes(q)
                  );
                })
                .slice(0, 10)
                .map((r: any) => (
                  <div
                    key={r.id}
                    className="p-5 bg-[#121435] border border-[#AFAEA2] flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-[3px_3px_0px_#0E1026]"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-serif text-xl font-bold text-[#E9E6DA]">
                          {r.full_name}
                        </span>
                        <span className="font-mono text-xs font-bold text-[#D21319]">
                          [{r.team_code}]
                        </span>
                      </div>
                      <div className="text-xs font-mono text-[#AFAEA2] mt-1">
                        TEAM: {r.team_name} · {r.phone} · {r.college}
                      </div>
                      <div className="text-xs font-mono text-[#E9E6DA] mt-0.5">
                        STATUS: <span className="font-bold">{r.status}</span>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={async () => {
                          await adminUpdateParticipantStatus(r.id, 'Checked In');
                          setFeedbackNotice(`${r.full_name} CHECKED IN.`);
                          if (onRefresh) onRefresh();
                        }}
                        className="px-6 py-3 bg-[#E9E6DA] text-[#1B1E4A] font-grotesk font-bold text-sm tracking-wider uppercase border border-[#E9E6DA] shadow-[2px_2px_0px_#0E1026]"
                      >
                        CHECK IN [ OK ]
                      </button>
                    </div>
                  </div>
                ))}

              {checkinQuery && (registrations || []).filter((r: any) => {
                const q = checkinQuery.trim().toLowerCase();
                return r.full_name?.toLowerCase().includes(q) || r.team_code?.toLowerCase().includes(q) || r.phone?.includes(q);
              }).length === 0 && (
                <div className="p-8 text-center text-xs font-mono text-[#AFAEA2] bg-[#121435] border border-[#AFAEA2]/30">
                  NO MATCHING CANDIDATES FOUND FOR "{checkinQuery}".
                </div>
              )}
            </div>
          </div>
        )}

        {/* 5. EVENT SETTINGS TAB */}
        {activeTab === 'events' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center border-b border-[#AFAEA2]/30 pb-3">
              <span className="label-editorial text-xs">
                EVENT DISCIPLINE ARCHITECT & CAPACITY LIMITS
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {events.map((ev: any) => (
                <div key={ev.id} className="p-6 bg-[#121435] border border-[#AFAEA2] shadow-[3px_3px_0px_#0E1026] space-y-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-serif text-xl font-bold text-[#E9E6DA]">
                        {ev.name}
                      </h3>
                      <span className="label-editorial text-[9px] text-[#AFAEA2]">
                        {ev.day_label} · {ev.slot_time}
                      </span>
                    </div>

                    <button
                      onClick={async () => {
                        await adminUpdateEvent(ev.id, { is_open: !ev.is_open });
                        if (onRefresh) onRefresh();
                      }}
                      className={`text-[10px] font-mono px-2 py-0.5 border ${
                        ev.is_open ? 'border-[#E9E6DA] text-[#E9E6DA]' : 'border-[#D21319] text-[#D21319]'
                      }`}
                    >
                      {ev.is_open ? 'PORTAL OPEN' : 'PORTAL CLOSED'}
                    </button>
                  </div>

                  <p className="font-grotesk text-xs text-[#AFAEA2]">
                    {ev.description}
                  </p>

                  <div className="grid grid-cols-3 gap-2 pt-3 border-t border-[#AFAEA2]/20 text-xs font-mono text-[#AFAEA2]">
                    <div>
                      <span className="block text-[8px] uppercase">CAPACITY</span>
                      <span className="text-[#E9E6DA] font-bold">{ev.capacity} TEAMS</span>
                    </div>
                    <div>
                      <span className="block text-[8px] uppercase">TEAM SIZE</span>
                      <span className="text-[#E9E6DA] font-bold">{ev.min_team_size} - {ev.max_team_size}</span>
                    </div>
                    <div>
                      <span className="block text-[8px] uppercase">FEE</span>
                      <span className="text-[#E9E6DA] font-bold">{ev.fee}</span>
                    </div>
                  </div>

                  <div className="pt-2 text-right">
                    <button
                      onClick={() => setEditingEvent(ev)}
                      className="px-3 py-1 bg-[#AFAEA2] text-[#1B1E4A] font-bold text-xs uppercase"
                    >
                      EDIT CONFIG
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 6. ANNOUNCEMENTS TAB */}
        {activeTab === 'announcements' && (
          <div className="max-w-3xl mx-auto space-y-8">
            {/* Post Notice Form */}
            <form onSubmit={handlePostAnnouncement} className="p-6 bg-[#121435] border border-[#AFAEA2] shadow-[3px_3px_0px_#0E1026] space-y-4">
              <span className="label-editorial text-xs block text-[#D21319]">
                PUBLISH FEST NOTICE / BANNER BULLETIN
              </span>

              <div>
                <label className="label-editorial text-[8px] block mb-1">NOTICE HEADLINE</label>
                <input
                  type="text"
                  required
                  value={announcementTitle}
                  onChange={(e) => setAnnouncementTitle(e.target.value)}
                  placeholder="e.g. Schedule Update for Day 2 Technical Quiz"
                  className="w-full bg-[#1B1E4A] border border-[#AFAEA2] p-2.5 text-xs text-[#E9E6DA] font-grotesk focus:border-[#D21319] focus:outline-none"
                />
              </div>

              <div>
                <label className="label-editorial text-[8px] block mb-1">BULLETIN CONTENT</label>
                <textarea
                  required
                  rows={3}
                  value={announcementContent}
                  onChange={(e) => setAnnouncementContent(e.target.value)}
                  placeholder="Detailed instructions or venue update..."
                  className="w-full bg-[#1B1E4A] border border-[#AFAEA2] p-2.5 text-xs text-[#E9E6DA] font-grotesk focus:border-[#D21319] focus:outline-none"
                />
              </div>

              <div className="text-right">
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-[#D21319] text-[#E9E6DA] font-grotesk font-bold text-xs uppercase border border-[#D21319] shadow-[2px_2px_0px_#0E1026]"
                >
                  DISPATCH NOTICE {'[ -> ]'}
                </button>
              </div>
            </form>

            {/* List Existing Announcements */}
            <div className="border border-[#AFAEA2] bg-[#121435] divide-y divide-[#AFAEA2]/20">
              {announcements.map((a: any) => (
                <div key={a.id} className="p-4 flex justify-between items-start gap-4">
                  <div>
                    <h4 className="font-serif text-base font-bold text-[#E9E6DA]">{a.title}</h4>
                    <p className="font-grotesk text-xs text-[#AFAEA2] mt-1">{a.content}</p>
                    <span className="text-[10px] font-mono text-[#AFAEA2] block mt-2">
                      {new Date(a.created_at).toLocaleString()}
                    </span>
                  </div>
                  <button
                    onClick={async () => {
                      await adminDeleteFestAnnouncement(a.id);
                      if (onRefresh) onRefresh();
                    }}
                    className="text-[10px] font-mono text-[#D21319] underline"
                  >
                    [ DELETE ]
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 7. AUDIT LOG TAB */}
        {activeTab === 'audit' && (
          <div className="space-y-4">
            <span className="label-editorial text-xs block">
              CHRONICLE OF ADMINISTRATIVE ACTIONS & AUDIT LOG
            </span>

            <div className="border border-[#AFAEA2] bg-[#121435] divide-y divide-[#AFAEA2]/20 font-mono text-xs">
              {auditLogs.map((log: any) => (
                <div key={log.id} className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <span className="text-[#D21319] font-bold mr-2">[{log.action}]</span>
                    <span className="text-[#E9E6DA]">{log.actor_email || 'System'}</span>
                    <span className="text-[#AFAEA2] ml-2">{'->'} {log.target_type} ({log.target_id || ''})</span>
                  </div>
                  <span className="text-[10px] text-[#AFAEA2]">
                    {new Date(log.created_at).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 8. PASSWORD / SECURITY TAB */}
        {activeTab === 'password' && (
          <div className="max-w-md mx-auto p-6 bg-[#121435] border border-[#AFAEA2] shadow-[3px_3px_0px_#0E1026] space-y-4">
            <span className="label-editorial text-xs block text-[#D21319]">
              CHANGE ADMINISTRATOR PASSWORD
            </span>
            <p className="font-grotesk text-xs text-[#AFAEA2]">
              Logged in as {currentUser?.email}. Update your secret master credentials below.
            </p>

            {passwordMsg && (
              <div className="p-3 bg-[#1B1E4A] border border-[#AFAEA2] text-xs font-mono">
                {passwordMsg}
              </div>
            )}

            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label className="label-editorial text-[8px] block mb-1">NEW PASSWORD</label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new master password"
                  className="w-full bg-[#1B1E4A] border border-[#AFAEA2] p-2.5 text-xs text-[#E9E6DA] focus:border-[#D21319] focus:outline-none"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-[#D21319] text-[#E9E6DA] font-grotesk font-bold text-xs uppercase border border-[#D21319] shadow-[2px_2px_0px_#0E1026]"
              >
                UPDATE PASSWORD {'[ -> ]'}
              </button>
            </form>
          </div>
        )}

      </main>

      {/* EDIT PARTICIPANT MODAL */}
      {editingParticipant && (
        <div className="fixed inset-0 z-50 bg-[#0E1026]/90 flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-[#121435] border border-[#AFAEA2] p-6 shadow-[4px_4px_0px_#0E1026] space-y-4">
            <div className="flex justify-between items-center border-b border-[#AFAEA2]/30 pb-2">
              <span className="label-editorial text-xs">EDIT PARTICIPANT RECORD</span>
              <button onClick={() => setEditingParticipant(null)} className="font-mono text-xs text-[#AFAEA2]">[ CLOSE ]</button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <label className="label-editorial text-[8px] block mb-1">FULL NAME</label>
                <input
                  type="text"
                  value={editingParticipant.full_name}
                  onChange={(e) => setEditingParticipant({ ...editingParticipant, full_name: e.target.value })}
                  className="w-full bg-[#1B1E4A] border border-[#AFAEA2] p-2 text-[#E9E6DA]"
                />
              </div>

              <div>
                <label className="label-editorial text-[8px] block mb-1">EMAIL</label>
                <input
                  type="email"
                  value={editingParticipant.email}
                  onChange={(e) => setEditingParticipant({ ...editingParticipant, email: e.target.value })}
                  className="w-full bg-[#1B1E4A] border border-[#AFAEA2] p-2 text-[#E9E6DA]"
                />
              </div>

              <div>
                <label className="label-editorial text-[8px] block mb-1">PHONE</label>
                <input
                  type="tel"
                  value={editingParticipant.phone}
                  onChange={(e) => setEditingParticipant({ ...editingParticipant, phone: e.target.value })}
                  className="w-full bg-[#1B1E4A] border border-[#AFAEA2] p-2 text-[#E9E6DA]"
                />
              </div>

              <div>
                <label className="label-editorial text-[8px] block mb-1">COLLEGE</label>
                <input
                  type="text"
                  value={editingParticipant.college}
                  onChange={(e) => setEditingParticipant({ ...editingParticipant, college: e.target.value })}
                  className="w-full bg-[#1B1E4A] border border-[#AFAEA2] p-2 text-[#E9E6DA]"
                />
              </div>

              <div>
                <label className="label-editorial text-[8px] block mb-1">STATUS</label>
                <select
                  value={editingParticipant.status}
                  onChange={(e) => setEditingParticipant({ ...editingParticipant, status: e.target.value })}
                  className="w-full bg-[#1B1E4A] border border-[#AFAEA2] p-2 text-[#E9E6DA]"
                >
                  <option value="Confirmed">Confirmed</option>
                  <option value="Checked In">Checked In</option>
                  <option value="Qualified for Day 2">Qualified for Day 2</option>
                  <option value="Pending">Pending</option>
                  <option value="Disqualified">Disqualified</option>
                </select>
              </div>

              <div>
                <label className="label-editorial text-[8px] block mb-1">YEAR</label>
                <input
                  type="text"
                  value={editingParticipant.year_of_study}
                  onChange={(e) => setEditingParticipant({ ...editingParticipant, year_of_study: e.target.value })}
                  className="w-full bg-[#1B1E4A] border border-[#AFAEA2] p-2 text-[#E9E6DA]"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-[#AFAEA2]/30">
              <button
                onClick={() => setEditingParticipant(null)}
                className="px-4 py-2 bg-[#AFAEA2] text-[#1B1E4A] text-xs font-bold"
              >
                CANCEL
              </button>
              <button
                onClick={async () => {
                  await adminUpdateParticipantDetails(editingParticipant.id, {
                    fullName: editingParticipant.full_name,
                    email: editingParticipant.email,
                    phone: editingParticipant.phone,
                    college: editingParticipant.college,
                    department: editingParticipant.department || '',
                    yearOfStudy: editingParticipant.year_of_study || '',
                    collegeId: editingParticipant.college_id,
                    status: editingParticipant.status
                  });
                  setEditingParticipant(null);
                  if (onRefresh) onRefresh();
                }}
                className="px-5 py-2 bg-[#D21319] text-[#E9E6DA] text-xs font-bold"
              >
                SAVE DETAILS
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MANUAL ON-SPOT REGISTRATION MODAL */}
      {manualModalOpen && (
        <div className="fixed inset-0 z-50 bg-[#0E1026]/90 flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-[#121435] border border-[#AFAEA2] p-6 shadow-[4px_4px_0px_#0E1026] space-y-4">
            <div className="flex justify-between items-center border-b border-[#AFAEA2]/30 pb-2">
              <span className="label-editorial text-xs">MANUAL / ON-SPOT REGISTRATION</span>
              <button onClick={() => setManualModalOpen(false)} className="font-mono text-xs text-[#AFAEA2]">[ CLOSE ]</button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="col-span-2">
                <label className="label-editorial text-[8px] block mb-1">TARGET TEAM (OPTIONAL)</label>
                <select
                  value={manualForm.teamId}
                  onChange={(e) => setManualForm({ ...manualForm, teamId: e.target.value })}
                  className="w-full bg-[#1B1E4A] border border-[#AFAEA2] p-2 text-[#E9E6DA]"
                >
                  <option value="">Create Independent On-Spot Squad</option>
                  {teams.map((t: any) => (
                    <option key={t.id} value={t.id}>{t.name} ({t.code})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="label-editorial text-[8px] block mb-1">FULL NAME</label>
                <input
                  type="text"
                  required
                  value={manualForm.fullName}
                  onChange={(e) => setManualForm({ ...manualForm, fullName: e.target.value })}
                  className="w-full bg-[#1B1E4A] border border-[#AFAEA2] p-2 text-[#E9E6DA]"
                />
              </div>

              <div>
                <label className="label-editorial text-[8px] block mb-1">EMAIL</label>
                <input
                  type="email"
                  required
                  value={manualForm.email}
                  onChange={(e) => setManualForm({ ...manualForm, email: e.target.value })}
                  className="w-full bg-[#1B1E4A] border border-[#AFAEA2] p-2 text-[#E9E6DA]"
                />
              </div>

              <div>
                <label className="label-editorial text-[8px] block mb-1">PHONE</label>
                <input
                  type="tel"
                  required
                  value={manualForm.phone}
                  onChange={(e) => setManualForm({ ...manualForm, phone: e.target.value })}
                  className="w-full bg-[#1B1E4A] border border-[#AFAEA2] p-2 text-[#E9E6DA]"
                />
              </div>

              <div>
                <label className="label-editorial text-[8px] block mb-1">COLLEGE</label>
                <input
                  type="text"
                  required
                  value={manualForm.college}
                  onChange={(e) => setManualForm({ ...manualForm, college: e.target.value })}
                  className="w-full bg-[#1B1E4A] border border-[#AFAEA2] p-2 text-[#E9E6DA]"
                />
              </div>

              <div>
                <label className="label-editorial text-[8px] block mb-1">DEPARTMENT</label>
                <input
                  type="text"
                  value={manualForm.department}
                  onChange={(e) => setManualForm({ ...manualForm, department: e.target.value })}
                  className="w-full bg-[#1B1E4A] border border-[#AFAEA2] p-2 text-[#E9E6DA]"
                />
              </div>

              <div>
                <label className="label-editorial text-[8px] block mb-1">STATUS</label>
                <select
                  value={manualForm.status}
                  onChange={(e) => setManualForm({ ...manualForm, status: e.target.value })}
                  className="w-full bg-[#1B1E4A] border border-[#AFAEA2] p-2 text-[#E9E6DA]"
                >
                  <option value="Confirmed">Confirmed</option>
                  <option value="Checked In">Checked In</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-[#AFAEA2]/30">
              <button
                onClick={() => setManualModalOpen(false)}
                className="px-4 py-2 bg-[#AFAEA2] text-[#1B1E4A] text-xs font-bold"
              >
                CANCEL
              </button>
              <button
                onClick={async () => {
                  await adminCreateManualParticipant({
                    fullName: manualForm.fullName,
                    email: manualForm.email,
                    phone: manualForm.phone,
                    college: manualForm.college,
                    department: manualForm.department,
                    yearOfStudy: manualForm.yearOfStudy,
                    collegeId: manualForm.collegeId,
                    teamId: manualForm.teamId || undefined,
                    isLeader: !manualForm.teamId,
                    status: manualForm.status
                  });
                  setManualModalOpen(false);
                  if (onRefresh) onRefresh();
                }}
                className="px-5 py-2 bg-[#D21319] text-[#E9E6DA] text-xs font-bold"
              >
                REGISTER ON-SPOT
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT EVENT CONFIG MODAL */}
      {editingEvent && (
        <div className="fixed inset-0 z-50 bg-[#0E1026]/90 flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-[#121435] border border-[#AFAEA2] p-6 shadow-[4px_4px_0px_#0E1026] space-y-4">
            <div className="flex justify-between items-center border-b border-[#AFAEA2]/30 pb-2">
              <span className="label-editorial text-xs">EDIT EVENT SETTINGS · {editingEvent.name}</span>
              <button onClick={() => setEditingEvent(null)} className="font-mono text-xs text-[#AFAEA2]">[ CLOSE ]</button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <label className="label-editorial text-[8px] block mb-1">CAPACITY (TEAMS)</label>
                <input
                  type="number"
                  value={editingEvent.capacity}
                  onChange={(e) => setEditingEvent({ ...editingEvent, capacity: parseInt(e.target.value) || 50 })}
                  className="w-full bg-[#1B1E4A] border border-[#AFAEA2] p-2 text-[#E9E6DA]"
                />
              </div>

              <div>
                <label className="label-editorial text-[8px] block mb-1">SLOT TIME</label>
                <input
                  type="text"
                  value={editingEvent.slot_time}
                  onChange={(e) => setEditingEvent({ ...editingEvent, slot_time: e.target.value })}
                  className="w-full bg-[#1B1E4A] border border-[#AFAEA2] p-2 text-[#E9E6DA]"
                />
              </div>

              <div>
                <label className="label-editorial text-[8px] block mb-1">MIN TEAM SIZE</label>
                <input
                  type="number"
                  value={editingEvent.min_team_size}
                  onChange={(e) => setEditingEvent({ ...editingEvent, min_team_size: parseInt(e.target.value) || 1 })}
                  className="w-full bg-[#1B1E4A] border border-[#AFAEA2] p-2 text-[#E9E6DA]"
                />
              </div>

              <div>
                <label className="label-editorial text-[8px] block mb-1">MAX TEAM SIZE</label>
                <input
                  type="number"
                  value={editingEvent.max_team_size}
                  onChange={(e) => setEditingEvent({ ...editingEvent, max_team_size: parseInt(e.target.value) || 4 })}
                  className="w-full bg-[#1B1E4A] border border-[#AFAEA2] p-2 text-[#E9E6DA]"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-[#AFAEA2]/30">
              <button
                onClick={() => setEditingEvent(null)}
                className="px-4 py-2 bg-[#AFAEA2] text-[#1B1E4A] text-xs font-bold"
              >
                CANCEL
              </button>
              <button
                onClick={async () => {
                  await adminUpdateEvent(editingEvent.id, {
                    capacity: editingEvent.capacity,
                    slot_time: editingEvent.slot_time,
                    min_team_size: editingEvent.min_team_size,
                    max_team_size: editingEvent.max_team_size,
                  });
                  setEditingEvent(null);
                  if (onRefresh) onRefresh();
                }}
                className="px-5 py-2 bg-[#D21319] text-[#E9E6DA] text-xs font-bold"
              >
                SAVE CONFIG
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
