'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Users,
  Shield,
  CheckCircle2,
  Clock,
  AlertCircle,
  Download,
  Search,
  Plus,
  RefreshCw,
  LogOut,
  Settings,
  Bell,
  FileText,
  KeyRound,
  Edit,
  Trash2,
  Lock,
  Unlock,
  ChevronLeft,
  ChevronRight,
  Filter,
  Check,
  X,
  ExternalLink,
  Layers,
  Sparkles,
  UserCheck,
  Crown
} from 'lucide-react';
import {
  adminUpdateParticipantStatus,
  adminUpdateParticipantDetails,
  adminCreateManualParticipant,
  adminBulkUpdateStatus,
  adminDeleteParticipant,
  adminBulkDeleteParticipants,
  adminAddCoordinator,
  adminRemoveCoordinator,
  adminResetCoordinatorPassword,
  adminCheckInSquad,
  adminUpdateTeam,
  adminDeleteTeam,
  adminChangeTeamLeader,
  adminMoveMember,
  adminUpdateEvent,
  adminPostFestAnnouncement,
  adminDeleteFestAnnouncement,
  changeAdminPassword,
  adminLogoutAction,
  masterAddAdmin,
  masterRemoveAdmin,
  resetAdminPassword
} from '@/app/actions/admin';
import { createClient } from '@/lib/supabase/client';

interface IndigoAdminDashboardProps {
  data: any;
  onRefresh?: () => void;
}

export function IndigoAdminDashboard({ data, onRefresh }: IndigoAdminDashboardProps) {
  const [activeTab, setActiveTab] = useState<
    'dashboard' | 'registrations' | 'teams' | 'checkin' | 'events' | 'announcements' | 'coordinators' | 'audit' | 'master' | 'password'
  >('dashboard');

  // Registrations Filter & Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [eventFilter, setEventFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedRegIds, setSelectedRegIds] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 15;

  // Modals & Forms State
  const [editingParticipant, setEditingParticipant] = useState<any | null>(null);
  const [manualModalOpen, setManualModalOpen] = useState(false);
  const [feedbackNotice, setFeedbackNotice] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleLogout = async () => {
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
    } catch {}
    try {
      localStorage.removeItem('indigo_logged_in');
      localStorage.setItem('indigo_logged_out', 'true');
      window.dispatchEvent(new Event('auth_state_change'));
    } catch {}
    await adminLogoutAction();
    window.location.href = '/';
  };

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

  // Master Admin Officer Management State
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [newAdminName, setNewAdminName] = useState('');
  const [masterNotice, setMasterNotice] = useState<string | null>(null);

  // Coordinator Management State (Admins & Managers)
  const [newCoordEmail, setNewCoordEmail] = useState('');
  const [newCoordName, setNewCoordName] = useState('');
  const [coordNotice, setCoordNotice] = useState<string | null>(null);

  const { metrics, perEventStats, timelineData, registrations, teams, events, announcements, auditLogs, currentUser, adminUsers, coordinators = [] } = data;

  const isCoordinator = currentUser?.role === 'coordinator';
  const currentTab = isCoordinator ? 'checkin' : activeTab;

  // Master status privacy: Ryan Keshary is only visible as master to ryankeshary@gmail.com
  const isCurrentUserRyan = currentUser?.email?.toLowerCase() === 'ryankeshary@gmail.com';

  const visibleAdminUsers = useMemo(() => {
    return (adminUsers || []).filter((admin: any) => {
      const isRyan = admin.email?.toLowerCase() === 'ryankeshary@gmail.com';
      if (isRyan && !isCurrentUserRyan) {
        return false;
      }
      return true;
    });
  }, [adminUsers, isCurrentUserRyan]);

  // Filtered registrations
  const filteredRegistrations = useMemo(() => {
    return (registrations || []).filter((reg: any) => {
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

      if (eventFilter !== 'ALL' && !(reg.event_ids || []).includes(eventFilter)) {
        return false;
      }

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

  // Participant Deletion Handlers
  const handleDeleteParticipant = async (participant: any) => {
    const confirmMsg = `Are you sure you want to permanently delete candidate "${participant.full_name}" (${participant.email})?\n\nThis will completely purge their registration, squad membership, and authentication account from the database so they can re-register from scratch.`;
    if (!window.confirm(confirmMsg)) return;

    setIsProcessing(true);
    try {
      const res = await adminDeleteParticipant(participant.id);
      if (res?.success) {
        setFeedbackNotice(`Successfully purged candidate "${participant.full_name}" (${participant.email}). They can now re-register.`);
        setSelectedRegIds((prev) => prev.filter((id) => id !== participant.id));
        if (onRefresh) onRefresh();
      } else {
        alert('Failed to delete participant record.');
      }
    } catch (err: any) {
      alert(err.message || 'Error occurred while deleting candidate.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedRegIds.length === 0) return;
    const confirmMsg = `Are you sure you want to permanently delete all ${selectedRegIds.length} selected participant(s)?\n\nTheir registrations, squad memberships, and authentication accounts will be completely wiped from the database so they can re-register.`;
    if (!window.confirm(confirmMsg)) return;

    setIsProcessing(true);
    try {
      const res = await adminBulkDeleteParticipants(selectedRegIds);
      if (res?.success) {
        setFeedbackNotice(`Successfully deleted ${res.count || selectedRegIds.length} candidate(s).`);
        setSelectedRegIds([]);
        if (onRefresh) onRefresh();
      } else {
        alert('Failed to delete selected participants.');
      }
    } catch (err: any) {
      alert(err.message || 'Error during bulk deletion.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Side Export Drawer State
  const [sideExportOpen, setSideExportOpen] = useState(false);

  // Checked-In Count memo
  const checkedInCount = useMemo(() => {
    return (registrations || []).filter((r: any) => r.status === 'Checked In').length;
  }, [registrations]);

  // CSV Export: All Registrations or Checked-In Attendees
  const exportRegistrationsCSV = (filterType: 'all' | 'checkedin' = 'all') => {
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
      'Year of Study',
      'College ID',
      'Team Name',
      'Team Code',
      'Is Captain',
      'Enlisted Disciplines',
      'Status',
      'Registered At'
    ];

    const csvContent = [
      headers.join(','),
      ...rows.map((r: any) =>
        [
          r.id,
          `"${(r.full_name || '').replace(/"/g, '""')}"`,
          r.email,
          r.phone,
          `"${(r.college || '').replace(/"/g, '""')}"`,
          `"${(r.department || '').replace(/"/g, '""')}"`,
          r.year_of_study,
          `"${r.college_id || ''}"`,
          `"${(r.team_name || '').replace(/"/g, '""')}"`,
          r.team_code,
          r.is_leader ? 'Yes' : 'No',
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
    const filename =
      filterType === 'checkedin'
        ? `indigo_checkins_${new Date().toISOString().slice(0, 10)}.csv`
        : `indigo_all_registrations_${new Date().toISOString().slice(0, 10)}.csv`;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // CSV Export: Team / Squad Registrations
  const exportTeamsCSV = () => {
    const rows = teams || [];
    const headers = [
      'Team ID',
      'Squad Code',
      'Squad Name',
      'Captain Name',
      'Captain Email',
      'Captain Phone',
      'Member Count',
      'Enlisted Disciplines',
      'Is Locked',
      'Is Waitlist',
      'Manage Token',
      'Created At'
    ];

    const csvContent = [
      headers.join(','),
      ...rows.map((t: any) =>
        [
          t.id,
          t.code,
          `"${(t.name || '').replace(/"/g, '""')}"`,
          `"${(t.leader_name || '').replace(/"/g, '""')}"`,
          t.leader_email || '',
          t.leader_phone || '',
          t.member_count || 0,
          `"${(t.event_ids || []).join('; ')}"`,
          t.is_locked ? 'Locked' : 'Open',
          t.is_waitlist ? 'Waitlist' : 'Active',
          t.manage_token || '',
          t.created_at
        ].join(',')
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `indigo_team_registrations_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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

  // Master Admin Handlers
  const handleAddAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAdminEmail.trim()) return;
    setIsProcessing(true);
    setMasterNotice(null);
    try {
      const res = await masterAddAdmin(newAdminEmail.trim(), newAdminName.trim());
      if (res.success) {
        setMasterNotice(`Administrator ${newAdminEmail.trim()} appointed successfully! Default password is set to password@67`);
        setNewAdminEmail('');
        setNewAdminName('');
        if (onRefresh) onRefresh();
      }
    } catch (err: any) {
      setMasterNotice(`Error: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRevokeAdmin = async (adminId: string, email: string) => {
    if (!confirm(`Are you sure you want to revoke admin privileges for ${email}?`)) return;
    setIsProcessing(true);
    setMasterNotice(null);
    try {
      const res = await masterRemoveAdmin(adminId);
      if (res.success) {
        setMasterNotice(`Admin access revoked for ${email}.`);
        if (onRefresh) onRefresh();
      }
    } catch (err: any) {
      setMasterNotice(`Error: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleResetAdminPass = async (adminId: string, email: string) => {
    if (!confirm(`Reset credentials for ${email} to default password@67?`)) return;
    setIsProcessing(true);
    setMasterNotice(null);
    try {
      const res = await resetAdminPassword(adminId);
      if (res.success) {
        setMasterNotice(`Credentials successfully reset to password@67 for ${email}.`);
      }
    } catch (err: any) {
      setMasterNotice(`Error: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  // Coordinator Management Handlers (Admins & Managers)
  const handleAddCoordinator = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCoordEmail.trim() || !newCoordName.trim()) return;
    setIsProcessing(true);
    setCoordNotice(null);
    try {
      const res = await adminAddCoordinator(newCoordEmail.trim(), newCoordName.trim());
      if (res?.success) {
        setCoordNotice(`Gate coordinator ${newCoordEmail.trim()} appointed successfully! Default password is password@67`);
        setNewCoordEmail('');
        setNewCoordName('');
        if (onRefresh) onRefresh();
      }
    } catch (err: any) {
      setCoordNotice(`Error: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRemoveCoordinator = async (coordId: string, email: string) => {
    if (!confirm(`Are you sure you want to remove gate coordinator credentials for ${email}?`)) return;
    setIsProcessing(true);
    setCoordNotice(null);
    try {
      const res = await adminRemoveCoordinator(coordId);
      if (res?.success) {
        setCoordNotice(`Coordinator access removed for ${email}.`);
        if (onRefresh) onRefresh();
      }
    } catch (err: any) {
      setCoordNotice(`Error: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleResetCoordPass = async (coordId: string, email: string) => {
    if (!confirm(`Reset credentials for coordinator ${email} to default password@67?`)) return;
    setIsProcessing(true);
    setCoordNotice(null);
    try {
      const res = await adminResetCoordinatorPassword(coordId);
      if (res?.success) {
        setCoordNotice(`Credentials successfully reset to password@67 for coordinator ${email}.`);
      }
    } catch (err: any) {
      setCoordNotice(`Error: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  // Status Badge Helper
  const renderStatusBadge = (status: string) => {
    switch (status) {
      case 'Checked In':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
            <UserCheck size={11} /> Checked In
          </span>
        );
      case 'Confirmed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 size={11} /> Confirmed
          </span>
        );
      case 'Qualified for Day 2':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
            <Sparkles size={11} /> Day 2 Qualified
          </span>
        );
      case 'Disqualified':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
            <AlertCircle size={11} /> Disqualified
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
            <Clock size={11} /> {status || 'Pending'}
          </span>
        );
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 font-sans flex flex-col antialiased">
      
      {/* 1. TOP EXECUTIVE MASTHEAD (LIGHT THEMED) */}
      <header className="bg-white border-b border-slate-200 shadow-xs sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-col md:flex-row items-center justify-between gap-3">
          
          {/* Brand & Identity */}
          <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-start">
            <div className="flex items-center gap-2.5">
              <span className="w-3 h-3 bg-[#D21319] rounded-sm shadow-sm" />
              <Link href="/" className="font-serif text-xl sm:text-2xl font-black text-[#D21319] tracking-tight hover:opacity-90">
                INDIGO TECH FEST
              </Link>
              <span className="hidden sm:inline-block text-[10px] font-mono font-bold uppercase tracking-wider bg-slate-100 text-slate-700 px-2 py-0.5 rounded border border-slate-200">
                {isCoordinator ? 'COORDINATOR DESK' : 'ADMIN CONSOLE'}
              </span>
            </div>

            {/* User pill & Action buttons on mobile */}
            <div className="flex items-center gap-2 md:hidden">
              {!isCoordinator && (
                <button
                  onClick={() => setSideExportOpen(true)}
                  className="flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded transition-colors cursor-pointer"
                  title="CSV Export Sidebar"
                >
                  <Download size={12} className="text-[#D21319]" />
                  <span>Export</span>
                </button>
              )}
              <button
                onClick={handleLogout}
                className="flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded transition-colors"
                title="Logout"
              >
                <LogOut size={12} />
                <span>Logout</span>
              </button>
            </div>
          </div>

          {/* User profile & Quick action links (Desktop) */}
          <div className="hidden md:flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono text-slate-700">
              {isCoordinator ? <UserCheck size={13} className="text-blue-600" /> : <Shield size={13} className="text-[#D21319]" />}
              <span className="font-semibold">{currentUser?.email || (isCoordinator ? 'Coordinator' : 'Administrator')}</span>
              {isCoordinator && (
                <span className="px-1.5 py-0.2 bg-blue-100 text-blue-800 text-[9px] font-bold rounded">COORDINATOR</span>
              )}
            </div>

            {onRefresh && (
              <button
                onClick={onRefresh}
                className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors cursor-pointer"
                title="Refresh latest data"
              >
                <RefreshCw size={15} />
              </button>
            )}

            {!isCoordinator && (
              <button
                onClick={() => setSideExportOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-lg shadow-2xs transition-colors cursor-pointer"
                title="Open CSV Export Center"
              >
                <Download size={13} className="text-[#D21319]" />
                <span>EXPORT CSV</span>
              </button>
            )}

            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg shadow-2xs transition-colors cursor-pointer"
              title="Sign out from Administrator Console"
            >
              <LogOut size={13} />
              <span>LOGOUT</span>
            </button>
          </div>

        </div>

        {/* Action Tabs Bar - Only visible to Admins/Managers, HIDDEN for Coordinators */}
        {!isCoordinator && (
          <div className="border-t border-slate-100 bg-slate-50/80 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto flex items-center gap-1.5 overflow-x-auto py-2 scrollbar-none">
              {[
                { id: 'dashboard', label: 'Overview', icon: Layers },
                { id: 'registrations', label: 'Registrations', icon: Users },
                { id: 'teams', label: 'Squads', icon: Shield },
                { id: 'checkin', label: 'Rapid Check-In', icon: CheckCircle2 },
                { id: 'events', label: 'Disciplines', icon: Settings },
                { id: 'announcements', label: 'Notices', icon: Bell },
                { id: 'coordinators', label: 'Coordinators', icon: UserCheck },
                { id: 'audit', label: 'Audit Log', icon: FileText },
                ...(currentUser?.isMaster ? [{ id: 'master', label: 'Master Console', icon: Crown }] : []),
                { id: 'password', label: 'Security', icon: KeyRound },
              ].map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                      isActive
                        ? 'bg-[#D21319] text-white shadow-xs'
                        : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100 hover:text-slate-900'
                    }`}
                  >
                    <Icon size={14} />
                    <span>{tab.label}</span>
                  </button>
                );
              })}

              <button
                onClick={() => setSideExportOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer whitespace-nowrap bg-white text-slate-700 border border-slate-300 hover:bg-slate-100 hover:text-slate-900 ml-auto shrink-0 shadow-2xs"
                title="Open CSV Export Sidebar"
              >
                <Download size={13} className="text-[#D21319]" />
                <span>Export CSV</span>
              </button>
            </div>
          </div>
        )}
      </header>

      {/* 2. MAIN CONTENT BODY */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        
        {/* Global Feedback Banner */}
        {feedbackNotice && (
          <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-xl text-xs font-mono flex items-center justify-between shadow-xs">
            <div className="flex items-center gap-2">
              <CheckCircle2 size={16} className="text-emerald-600" />
              <span>{feedbackNotice}</span>
            </div>
            <button
              onClick={() => setFeedbackNotice(null)}
              className="text-emerald-700 hover:text-emerald-900 font-bold underline ml-4 cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* ========================================================
            TAB 1: DASHBOARD OVERVIEW (Admins & Managers)
           ======================================================== */}
        {currentTab === 'dashboard' && !isCoordinator && (
          <div className="space-y-6">
            
            {/* Quick Actions Header Strip */}
            <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-white border border-slate-200 rounded-xl shadow-xs">
              <div>
                <h1 className="text-lg font-bold text-slate-900">Festival Overview</h1>
                <p className="text-xs text-slate-500">Live operational telemetry & enrollment status</p>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={() => setManualModalOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-[#D21319] hover:bg-[#b00f14] text-white rounded-lg shadow-xs transition-colors cursor-pointer"
                >
                  <Plus size={14} />
                  <span>On-Spot Register</span>
                </button>

                <button
                  onClick={() => setActiveTab('checkin')}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-xs transition-colors cursor-pointer"
                >
                  <CheckCircle2 size={14} />
                  <span>Rapid Check-In</span>
                </button>

                <button
                  onClick={() => setSideExportOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 rounded-lg transition-colors cursor-pointer"
                  title="Open CSV Export Hub"
                >
                  <Download size={14} className="text-[#D21319]" />
                  <span>Export Center</span>
                </button>
              </div>
            </div>

            {/* 4 Primary Metric Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              
              {/* Total Registrants */}
              <div className="p-5 bg-white border border-slate-200 rounded-xl shadow-xs hover:border-blue-400 transition-colors">
                <div className="flex items-center justify-between text-blue-600 mb-2">
                  <span className="text-xs font-bold tracking-wider uppercase text-slate-500">Total Candidates</span>
                  <div className="p-2 bg-blue-50 rounded-lg">
                    <Users size={18} />
                  </div>
                </div>
                <div className="text-3xl font-black text-slate-900">{metrics.totalParticipants}</div>
                <div className="text-[11px] text-slate-500 font-medium mt-1">Confirmed Enrolled Candidates</div>
              </div>

              {/* Registered Squads */}
              <div className="p-5 bg-white border border-slate-200 rounded-xl shadow-xs hover:border-emerald-400 transition-colors">
                <div className="flex items-center justify-between text-emerald-600 mb-2">
                  <span className="text-xs font-bold tracking-wider uppercase text-slate-500">Registered Squads</span>
                  <div className="p-2 bg-emerald-50 rounded-lg">
                    <Shield size={18} />
                  </div>
                </div>
                <div className="text-3xl font-black text-slate-900">{metrics.totalTeams}</div>
                <div className="text-[11px] text-slate-500 font-medium mt-1">Active Team Rosters</div>
              </div>

              {/* Incomplete Squads */}
              <div className="p-5 bg-white border border-slate-200 rounded-xl shadow-xs hover:border-amber-400 transition-colors">
                <div className="flex items-center justify-between text-amber-600 mb-2">
                  <span className="text-xs font-bold tracking-wider uppercase text-slate-500">Pending Slots</span>
                  <div className="p-2 bg-amber-50 rounded-lg">
                    <AlertCircle size={18} />
                  </div>
                </div>
                <div className="text-3xl font-black text-amber-700">{metrics.incompleteTeamsCount}</div>
                <div className="text-[11px] text-slate-500 font-medium mt-1">Below Minimum Roster Size</div>
              </div>

              {/* Waitlist */}
              <div className="p-5 bg-white border border-slate-200 rounded-xl shadow-xs hover:border-purple-400 transition-colors">
                <div className="flex items-center justify-between text-purple-600 mb-2">
                  <span className="text-xs font-bold tracking-wider uppercase text-slate-500">Waitlist Queue</span>
                  <div className="p-2 bg-purple-50 rounded-lg">
                    <Clock size={18} />
                  </div>
                </div>
                <div className="text-3xl font-black text-slate-900">{metrics.waitlistCount}</div>
                <div className="text-[11px] text-slate-500 font-medium mt-1">Over-Capacity Standby Teams</div>
              </div>

            </div>

            {/* Registrations Influx Timeline */}
            <div className="p-6 bg-white border border-slate-200 rounded-xl shadow-xs">
              <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
                <div>
                  <h2 className="text-sm font-bold text-slate-900">Registrations Timeline</h2>
                  <p className="text-xs text-slate-500">Chronological influx of participants</p>
                </div>
                <span className="text-xs font-mono font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                  Daily Volume
                </span>
              </div>

              {timelineData && timelineData.length > 0 ? (
                <div className="h-44 flex items-end gap-3 pt-6 px-2 overflow-x-auto">
                  {timelineData.map((d: any, idx: number) => {
                    const maxCount = Math.max(...timelineData.map((t: any) => t.count), 1);
                    const heightPercent = Math.max(15, (d.count / maxCount) * 100);

                    return (
                      <div key={idx} className="flex-1 min-w-[50px] flex flex-col items-center gap-2">
                        <span className="text-xs font-mono font-bold text-slate-800">{d.count}</span>
                        <div className="w-full bg-slate-100 rounded-t-md h-32 flex items-end p-0.5">
                          <div
                            className="w-full bg-[#D21319] hover:bg-[#b00f14] transition-all rounded-t-xs"
                            style={{ height: `${heightPercent}%` }}
                          />
                        </div>
                        <span className="text-[10px] font-mono text-slate-600 font-medium whitespace-nowrap">{d.date}</span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-8 text-center text-xs font-mono text-slate-500 bg-slate-50 rounded-lg">
                  No timeline telemetry recorded yet.
                </div>
              )}
            </div>

            {/* Per-Event Capacities */}
            <div className="p-6 bg-white border border-slate-200 rounded-xl shadow-xs">
              <div className="border-b border-slate-100 pb-3 mb-4 flex justify-between items-center">
                <div>
                  <h2 className="text-sm font-bold text-slate-900">Discipline Capacity Tracker</h2>
                  <p className="text-xs text-slate-500">Live team allocations across the 6 tournament events</p>
                </div>
                <span className="text-xs font-mono font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                  {perEventStats.length} Disciplines
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {perEventStats.map((ev: any) => {
                  const isFull = ev.percentage >= 100;
                  const isHigh = ev.percentage >= 80;

                  return (
                    <div key={ev.id} className="p-4 bg-slate-50/70 border border-slate-200 rounded-xl">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h4 className="text-sm font-bold text-slate-900">{ev.name}</h4>
                          <span className="text-[11px] font-mono text-slate-500 block mt-0.5">
                            {ev.day} · {ev.teamCount} Teams ({ev.participantCount} Participants)
                          </span>
                        </div>
                        <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded ${
                          isFull
                            ? 'bg-rose-100 text-rose-800'
                            : isHigh
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}>
                          {ev.percentage}%
                        </span>
                      </div>

                      <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden mt-3">
                        <div
                          className={`h-full transition-all ${
                            isFull ? 'bg-rose-600' : isHigh ? 'bg-amber-500' : 'bg-emerald-600'
                          }`}
                          style={{ width: `${Math.min(100, ev.percentage)}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-[10px] font-mono text-slate-500 mt-1">
                        <span>{ev.teamCount} enrolled</span>
                        <span>Cap: {ev.capacity} teams</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>
        )}

        {/* ========================================================
            TAB 2: REGISTRATIONS MANAGEMENT (Admins & Managers)
           ======================================================== */}
        {currentTab === 'registrations' && !isCoordinator && (
          <div className="space-y-4">
            
            {/* Control Bar: Search, Filters, Bulk Actions */}
            <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-xs space-y-3">
              <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
                
                {/* Search Input */}
                <div className="relative flex-1">
                  <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search candidate name, email, phone, JRV code, college..."
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="w-full pl-9 pr-3 py-2 bg-white text-slate-900 placeholder:text-slate-400 border border-slate-300 rounded-lg text-xs font-mono focus:border-[#D21319] focus:ring-1 focus:ring-[#D21319] focus:outline-none"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>

                {/* Filters & Actions */}
                <div className="flex items-center gap-2 flex-wrap">
                  
                  {/* Event Filter */}
                  <select
                    value={eventFilter}
                    onChange={(e) => {
                      setEventFilter(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs font-mono text-slate-700 focus:border-[#D21319] focus:outline-none"
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
                    className="bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs font-mono text-slate-700 focus:border-[#D21319] focus:outline-none"
                  >
                    <option value="ALL">All Statuses</option>
                    <option value="Confirmed">Confirmed</option>
                    <option value="Checked In">Checked In</option>
                    <option value="Qualified for Day 2">Qualified for Day 2</option>
                    <option value="Pending">Pending</option>
                    <option value="Disqualified">Disqualified</option>
                  </select>

                  {/* Add Manual Participant */}
                  <button
                    onClick={() => setManualModalOpen(true)}
                    className="inline-flex items-center gap-1 px-3 py-2 bg-[#D21319] hover:bg-[#b00f14] text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
                  >
                    <Plus size={14} />
                    <span>On-Spot Reg</span>
                  </button>

                  {/* Export CSV */}
                  <button
                    onClick={() => setSideExportOpen(true)}
                    className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                    title="Export all or filtered CSV"
                  >
                    <Download size={14} className="text-[#D21319]" />
                    <span>Export CSV</span>
                  </button>

                </div>
              </div>

              {/* Bulk Actions (If items selected) */}
              {selectedRegIds.length > 0 && (
                <div className="flex items-center justify-between p-2.5 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-900">
                  <div className="flex items-center gap-2">
                    <span className="font-bold">{selectedRegIds.length} candidate(s) selected</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleBulkStatus('Checked In')}
                      disabled={isProcessing}
                      className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded shadow-2xs"
                    >
                      Mark Checked In
                    </button>
                    <button
                      onClick={() => handleBulkStatus('Confirmed')}
                      disabled={isProcessing}
                      className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded shadow-2xs"
                    >
                      Mark Confirmed
                    </button>
                    <button
                      onClick={() => handleBulkStatus('Qualified for Day 2')}
                      disabled={isProcessing}
                      className="px-2.5 py-1 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded shadow-2xs"
                    >
                      Mark Day 2
                    </button>
                    <button
                      onClick={handleBulkDelete}
                      disabled={isProcessing}
                      className="inline-flex items-center gap-1 px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded shadow-2xs cursor-pointer transition-colors"
                      title="Permanently delete selected candidates so they can re-register"
                    >
                      <Trash2 size={12} />
                      <span>Delete Selected ({selectedRegIds.length})</span>
                    </button>
                    <button
                      onClick={() => setSelectedRegIds([])}
                      className="px-2.5 py-1 text-slate-600 hover:text-slate-900"
                    >
                      Clear
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Registrations Table (Light, High-Contrast) */}
            <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold uppercase tracking-wider">
                    <tr>
                      <th className="p-3.5 w-10">
                        <input
                          type="checkbox"
                          checked={
                            paginatedRegistrations.length > 0 &&
                            selectedRegIds.length === paginatedRegistrations.length
                          }
                          onChange={toggleSelectAll}
                          className="rounded border-slate-300 text-[#D21319] focus:ring-[#D21319]"
                        />
                      </th>
                      <th className="p-3.5">Candidate Details</th>
                      <th className="p-3.5">Squad & Code</th>
                      <th className="p-3.5">Contact</th>
                      <th className="p-3.5">College & Dept</th>
                      <th className="p-3.5">Status</th>
                      <th className="p-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {paginatedRegistrations.map((reg: any) => (
                      <tr key={reg.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="p-3.5">
                          <input
                            type="checkbox"
                            checked={selectedRegIds.includes(reg.id)}
                            onChange={() => toggleSelectOne(reg.id)}
                            className="rounded border-slate-300 text-[#D21319] focus:ring-[#D21319]"
                          />
                        </td>
                        <td className="p-3.5">
                          <div className="font-bold text-slate-900 text-sm">{reg.full_name}</div>
                          <div className="text-[11px] font-mono text-slate-500">{reg.email}</div>
                          {reg.is_leader && (
                            <span className="inline-block mt-0.5 px-1.5 py-0.2 bg-amber-50 text-amber-800 border border-amber-200 rounded text-[9px] font-bold">
                              CAPTAIN
                            </span>
                          )}
                        </td>
                        <td className="p-3.5">
                          <div className="font-semibold text-slate-800">{reg.team_name}</div>
                          <div className="font-mono text-xs text-[#D21319] font-bold">[{reg.team_code}]</div>
                        </td>
                        <td className="p-3.5 font-mono text-slate-700">
                          <div>{reg.phone}</div>
                        </td>
                        <td className="p-3.5 text-slate-600">
                          <div className="font-medium text-slate-800">{reg.college}</div>
                          <div className="text-[11px] text-slate-500">{reg.department || 'General'} · {reg.year_of_study || 'N/A'}</div>
                        </td>
                        <td className="p-3.5">
                          {renderStatusBadge(reg.status)}
                        </td>
                        <td className="p-3.5 text-right">
                          <div className="inline-flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => setEditingParticipant(reg)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded border border-slate-300 transition-colors cursor-pointer"
                              title="Edit candidate details"
                            >
                              <Edit size={12} />
                              <span>Edit</span>
                            </button>
                            <button
                              onClick={() => handleDeleteParticipant(reg)}
                              disabled={isProcessing}
                              className="inline-flex items-center gap-1 px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 hover:text-rose-800 font-bold text-xs rounded border border-rose-200 transition-colors cursor-pointer disabled:opacity-50"
                              title="Permanently delete candidate so they can re-register"
                            >
                              <Trash2 size={12} />
                              <span>Delete</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {paginatedRegistrations.length === 0 && (
                      <tr>
                        <td colSpan={7} className="p-8 text-center text-slate-500 font-mono">
                          No matching registration records found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination Controls */}
              <div className="p-3.5 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600">
                <span className="font-mono">
                  Showing {filteredRegistrations.length} total candidates (Page {currentPage} of {totalPages})
                </span>
                <div className="flex gap-2">
                  <button
                    disabled={currentPage <= 1}
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    className="inline-flex items-center gap-1 px-3 py-1 bg-white border border-slate-300 rounded font-semibold disabled:opacity-40 hover:bg-slate-100 transition-colors cursor-pointer"
                  >
                    <ChevronLeft size={13} />
                    <span>Previous</span>
                  </button>
                  <button
                    disabled={currentPage >= totalPages}
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    className="inline-flex items-center gap-1 px-3 py-1 bg-white border border-slate-300 rounded font-semibold disabled:opacity-40 hover:bg-slate-100 transition-colors cursor-pointer"
                  >
                    <span>Next</span>
                    <ChevronRight size={13} />
                  </button>
                </div>
              </div>
            </div>

          </div>
        )}

        {/* ========================================================
            TAB 3: TEAMS & SQUADS ARCHIVE (Admins & Managers)
           ======================================================== */}
        {currentTab === 'teams' && !isCoordinator && (
          <div className="space-y-4">
            
            <div className="flex justify-between items-center bg-white p-4 border border-slate-200 rounded-xl shadow-xs">
              <div>
                <h2 className="text-base font-bold text-slate-900">Registered Squads Archive</h2>
                <p className="text-xs text-slate-500">{teams.length} total teams formed across the tournament</p>
              </div>
              <button
                onClick={exportTeamsCSV}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                title="Download team registrations CSV"
              >
                <Download size={14} className="text-[#D21319]" />
                <span>Export Teams (.csv)</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {teams.map((t: any) => (
                <div key={t.id} className="p-5 bg-white border border-slate-200 rounded-xl shadow-xs hover:border-slate-300 transition-colors space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-bold text-slate-900">{t.name}</h3>
                        <span className="font-mono text-xs font-bold text-[#D21319] bg-rose-50 border border-rose-200 px-2 py-0.5 rounded">
                          [{t.code}]
                        </span>
                      </div>
                      <div className="text-xs text-slate-500 mt-1">
                        Captain: <strong className="text-slate-800">{t.leader_name || t.leader_email}</strong> · Roster: <strong className="text-slate-800">{t.member_count} Members</strong>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {t.is_waitlist && (
                        <span className="text-[10px] px-2 py-0.5 rounded font-bold bg-amber-50 text-amber-800 border border-amber-200">
                          Waitlist
                        </span>
                      )}
                      {t.is_locked && (
                        <span className="text-[10px] px-2 py-0.5 rounded font-bold bg-slate-100 text-slate-800 border border-slate-300">
                          Locked
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="text-xs font-mono text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                    <span className="text-[10px] text-slate-400 block uppercase font-bold">Enlisted Disciplines:</span>
                    <span>{(t.event_ids || []).join(', ') || 'No disciplines'}</span>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                    <button
                      onClick={async () => {
                        await adminUpdateTeam(t.id, { isLocked: !t.is_locked });
                        if (onRefresh) onRefresh();
                      }}
                      className="inline-flex items-center gap-1 px-2.5 py-1 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 text-xs font-medium rounded transition-colors cursor-pointer"
                    >
                      {t.is_locked ? <Unlock size={12} /> : <Lock size={12} />}
                      <span>{t.is_locked ? 'Unlock' : 'Lock'}</span>
                    </button>

                    <button
                      onClick={async () => {
                        await adminUpdateTeam(t.id, { isWaitlist: !t.is_waitlist });
                        if (onRefresh) onRefresh();
                      }}
                      className="inline-flex items-center gap-1 px-2.5 py-1 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 text-xs font-medium rounded transition-colors cursor-pointer"
                    >
                      <span>{t.is_waitlist ? 'Off Waitlist' : 'Waitlist'}</span>
                    </button>

                    <button
                      onClick={async () => {
                        if (confirm(`Delete squad ${t.name} (${t.code}) and all member records?`)) {
                          await adminDeleteTeam(t.id);
                          if (onRefresh) onRefresh();
                        }
                      }}
                      className="inline-flex items-center gap-1 px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold rounded transition-colors cursor-pointer"
                    >
                      <Trash2 size={12} />
                      <span>Delete</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>

          </div>
        )}

        {/* ========================================================
            TAB 4: RAPID CHECK-IN SCANNER (Accessible to Coordinators & Admins)
           ======================================================== */}
        {currentTab === 'checkin' && (
          <div className="max-w-2xl mx-auto space-y-6">
            
            <div className="p-8 bg-white border border-slate-200 rounded-2xl shadow-sm text-center space-y-3">
              <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl mx-auto flex items-center justify-center">
                <CheckCircle2 size={24} />
              </div>
              <h2 className="text-xl font-bold text-slate-900">Rapid Attendee Check-In</h2>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Search candidate name, unique JRV squad token, or phone number to register immediate festival admission.
              </p>

              {/* Progress & Quick Export Button */}
              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-700 border border-blue-200 rounded-full text-xs font-mono font-bold">
                  <UserCheck size={13} /> {checkedInCount} of {registrations?.length || 0} Checked In
                </span>
                <button
                  onClick={() => exportRegistrationsCSV('checkedin')}
                  className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                  title="Download CSV of all currently checked-in attendees"
                >
                  <Download size={13} className="text-[#D21319]" />
                  <span>Export Check-Ins CSV</span>
                </button>
              </div>

              <div className="relative mt-4">
                <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  autoFocus
                  placeholder="Type attendee name, JRV-Code, or phone number..."
                  value={checkinQuery}
                  onChange={(e) => setCheckinQuery(e.target.value)}
                  className="w-full pl-11 pr-4 py-3.5 bg-slate-50 hover:bg-white focus:bg-white border-2 border-slate-300 focus:border-blue-600 rounded-xl text-base font-mono text-slate-900 focus:outline-none transition-all"
                />
              </div>
            </div>

            {/* Results list */}
            <div className="space-y-3">
              {/* Squad Batch Check-In Bar: When search matches multiple candidates in an enrolled squad */}
              {(() => {
                const q = checkinQuery.trim().toLowerCase();
                if (!q) return null;
                const matches = (registrations || []).filter((r: any) => {
                  return (
                    r.full_name?.toLowerCase().includes(q) ||
                    r.team_code?.toLowerCase().includes(q) ||
                    r.phone?.includes(q) ||
                    r.email?.toLowerCase().includes(q)
                  );
                });
                const unchecked = matches.filter((r: any) => r.status !== 'Checked In');
                if (unchecked.length <= 1) return null;

                return (
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-mono text-blue-900 shadow-2xs">
                    <div>
                      <strong>{unchecked.length}</strong> matching candidates ready for admission.
                    </div>
                    <button
                      onClick={async () => {
                        setIsProcessing(true);
                        await adminBulkUpdateStatus(unchecked.map((r: any) => r.id), 'Checked In');
                        setIsProcessing(false);
                        setFeedbackNotice(`Successfully checked in ${unchecked.length} candidates.`);
                        if (onRefresh) onRefresh();
                      }}
                      disabled={isProcessing}
                      className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-xs cursor-pointer flex items-center gap-1.5 transition-colors"
                    >
                      <Check size={13} />
                      <span>Check In Entire Squad ({unchecked.length})</span>
                    </button>
                  </div>
                );
              })()}

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
                .map((r: any) => {
                  const isChecked = r.status === 'Checked In';

                  return (
                    <div
                      key={r.id}
                      className="p-5 bg-white border border-slate-200 rounded-xl shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-base font-bold text-slate-900">{r.full_name}</span>
                          <span className="font-mono text-xs font-bold text-[#D21319]">[{r.team_code}]</span>
                        </div>
                        <div className="text-xs text-slate-500 mt-1">
                          Squad: <strong className="text-slate-700">{r.team_name}</strong> · {r.phone} · {r.college}
                        </div>
                        <div className="mt-1.5">{renderStatusBadge(r.status)}</div>
                      </div>

                      <div>
                        {isChecked ? (
                          <div className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-50 text-emerald-700 font-bold text-xs rounded-lg border border-emerald-200">
                            <Check size={14} /> Checked In
                          </div>
                        ) : (
                          <button
                            onClick={async () => {
                              await adminUpdateParticipantStatus(r.id, 'Checked In');
                              setFeedbackNotice(`${r.full_name} successfully checked in.`);
                              if (onRefresh) onRefresh();
                            }}
                            className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg shadow-xs transition-colors cursor-pointer"
                          >
                            <Check size={14} />
                            <span>CHECK IN</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}

              {checkinQuery &&
                (registrations || []).filter((r: any) => {
                  const q = checkinQuery.trim().toLowerCase();
                  return (
                    r.full_name?.toLowerCase().includes(q) ||
                    r.team_code?.toLowerCase().includes(q) ||
                    r.phone?.includes(q)
                  );
                }).length === 0 && (
                  <div className="p-8 text-center text-xs font-mono text-slate-500 bg-white border border-slate-200 rounded-xl">
                    No registered candidate found matching &quot;{checkinQuery}&quot;.
                  </div>
                )}
            </div>

          </div>
        )}

        {/* ========================================================
            TAB 5: EVENT SETTINGS & CONFIG (Admins & Managers)
           ======================================================== */}
        {currentTab === 'events' && !isCoordinator && (
          <div className="space-y-4">
            
            <div className="bg-white p-4 border border-slate-200 rounded-xl shadow-xs">
              <h2 className="text-base font-bold text-slate-900">Event Discipline Capacity Controls</h2>
              <p className="text-xs text-slate-500">Configure team limits, registration portal status, and team size boundaries</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {events.map((ev: any) => (
                <div key={ev.id} className="p-6 bg-white border border-slate-200 rounded-xl shadow-xs space-y-4">
                  <div className="flex justify-between items-start gap-2">
                    <div>
                      <h3 className="text-base font-bold text-slate-900">{ev.name}</h3>
                      <span className="text-xs font-mono text-slate-500 block mt-0.5">
                        {ev.day_label} · {ev.slot_time}
                      </span>
                    </div>

                    <button
                      onClick={async () => {
                        await adminUpdateEvent(ev.id, { is_open: !ev.is_open });
                        if (onRefresh) onRefresh();
                      }}
                      className={`text-xs font-bold px-3 py-1 rounded-full border transition-colors cursor-pointer ${
                        ev.is_open
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                          : 'bg-rose-50 text-rose-700 border-rose-300'
                      }`}
                    >
                      {ev.is_open ? '● Portal Open' : '○ Closed'}
                    </button>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed">
                    {ev.description}
                  </p>

                  <div className="grid grid-cols-3 gap-2 pt-3 border-t border-slate-100 text-xs font-mono">
                    <div className="bg-slate-50 p-2 rounded">
                      <span className="block text-[9px] uppercase text-slate-400 font-bold">Capacity</span>
                      <strong className="text-slate-800">{ev.capacity} Teams</strong>
                    </div>
                    <div className="bg-slate-50 p-2 rounded">
                      <span className="block text-[9px] uppercase text-slate-400 font-bold">Team Size</span>
                      <strong className="text-slate-800">{ev.min_team_size} - {ev.max_team_size}</strong>
                    </div>
                    <div className="bg-slate-50 p-2 rounded">
                      <span className="block text-[9px] uppercase text-slate-400 font-bold">Tariff</span>
                      <strong className="text-slate-800">{ev.fee || 'Free'}</strong>
                    </div>
                  </div>

                  <div className="pt-2 text-right">
                    <button
                      onClick={() => setEditingEvent(ev)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded border border-slate-300 transition-colors cursor-pointer"
                    >
                      <Edit size={12} />
                      <span>Edit Parameters</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>

          </div>
        )}

        {/* ========================================================
            TAB 6: ANNOUNCEMENTS & NOTICES (Admins & Managers)
           ======================================================== */}
        {currentTab === 'announcements' && !isCoordinator && (
          <div className="max-w-3xl mx-auto space-y-6">
            
            {/* Post Notice Form */}
            <form onSubmit={handlePostAnnouncement} className="p-6 bg-white border border-slate-200 rounded-xl shadow-xs space-y-4">
              <div>
                <h2 className="text-base font-bold text-slate-900">Publish Festival Bulletin</h2>
                <p className="text-xs text-slate-500">Post announcements that appear on the participant dashboard & banner</p>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Headline</label>
                <input
                  type="text"
                  required
                  value={announcementTitle}
                  onChange={(e) => setAnnouncementTitle(e.target.value)}
                  placeholder="e.g. Schedule Update for Day 2 Cad-Mander Round"
                  className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-xs text-slate-900 focus:border-[#D21319] focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Message Content</label>
                <textarea
                  required
                  rows={3}
                  value={announcementContent}
                  onChange={(e) => setAnnouncementContent(e.target.value)}
                  placeholder="Enter detailed room instructions, timing reminders, or protocol notices..."
                  className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-xs text-slate-900 focus:border-[#D21319] focus:outline-none"
                />
              </div>

              <div className="text-right">
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#D21319] hover:bg-[#b00f14] text-white font-bold text-xs rounded-lg transition-colors cursor-pointer"
                >
                  <Bell size={13} />
                  <span>Dispatch Announcement</span>
                </button>
              </div>
            </form>

            {/* List Existing Announcements */}
            <div className="bg-white border border-slate-200 rounded-xl shadow-xs divide-y divide-slate-100 overflow-hidden">
              {announcements.map((a: any) => (
                <div key={a.id} className="p-5 flex justify-between items-start gap-4 hover:bg-slate-50/60 transition-colors">
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">{a.title}</h4>
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">{a.content}</p>
                    <span className="text-[10px] font-mono text-slate-400 block mt-2">
                      {new Date(a.created_at).toLocaleString()}
                    </span>
                  </div>
                  <button
                    onClick={async () => {
                      await adminDeleteFestAnnouncement(a.id);
                      if (onRefresh) onRefresh();
                    }}
                    className="inline-flex items-center gap-1 text-xs font-bold text-rose-600 hover:text-rose-800 p-1 cursor-pointer"
                    title="Delete notice"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}
              {announcements.length === 0 && (
                <div className="p-8 text-center text-xs font-mono text-slate-500">
                  No bulletins posted yet.
                </div>
              )}
            </div>

          </div>
        )}

        {/* ========================================================
            TAB: GATE COORDINATORS MANAGEMENT (Admins & Managers)
           ======================================================== */}
        {currentTab === 'coordinators' && !isCoordinator && (
          <div className="space-y-6">
            <div className="bg-white p-5 border border-slate-200 rounded-xl shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <UserCheck size={18} className="text-blue-600" />
                  <span>Festival Gate Coordinators</span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Appoint gate desk coordinators. Coordinators have access strictly and exclusively to the Rapid Attendee Check-In scanner.
                </p>
              </div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-700 border border-blue-200 rounded-lg text-xs font-mono font-bold shrink-0">
                <Users size={13} /> {coordinators.length} Coordinator{coordinators.length === 1 ? '' : 's'} Appointed
              </span>
            </div>

            {coordNotice && (
              <div className="p-3.5 bg-blue-50 border border-blue-300 rounded-lg text-xs font-mono text-blue-900 flex items-center justify-between">
                <span>{coordNotice}</span>
                <button
                  type="button"
                  onClick={() => setCoordNotice(null)}
                  className="font-bold text-blue-700 hover:text-blue-900 cursor-pointer"
                >
                  ✕
                </button>
              </div>
            )}

            {/* Appoint New Coordinator Form */}
            <form onSubmit={handleAddCoordinator} className="p-6 bg-white border border-slate-200 rounded-xl shadow-xs space-y-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Appoint Gate Coordinator</h3>
                <p className="text-xs text-slate-500">
                  Provision gate check-in credentials. Newly appointed coordinators default to password: <strong className="text-black font-mono">password@67</strong>
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Coordinator Email Address *</label>
                  <input
                    type="email"
                    required
                    value={newCoordEmail}
                    onChange={(e) => setNewCoordEmail(e.target.value)}
                    placeholder="e.g. coordinator@slrtce.in"
                    className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-xs text-slate-900 focus:border-[#D21319] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Coordinator Full Name *</label>
                  <input
                    type="text"
                    required
                    value={newCoordName}
                    onChange={(e) => setNewCoordName(e.target.value)}
                    placeholder="e.g. Rahul Sharma (Check-In Lead)"
                    className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-xs text-slate-900 focus:border-[#D21319] focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
                <span className="text-[11px] font-mono text-slate-500">
                  ✦ Default credentials: Email + <strong className="text-slate-800">password@67</strong> (Coordinators can access Check-In ONLY)
                </span>

                <button
                  type="submit"
                  disabled={isProcessing || !newCoordEmail.trim() || !newCoordName.trim()}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-xs rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow-xs"
                >
                  <Plus size={14} />
                  <span>Appoint Coordinator</span>
                </button>
              </div>
            </form>

            {/* Active Coordinators Table */}
            <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
              <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Active Gate Coordinators</h3>
                  <p className="text-xs text-slate-500">Authorized personnel who can scan and check in festival participants</p>
                </div>
                <span className="text-xs font-mono bg-white px-2 py-0.5 border border-slate-200 rounded">
                  {coordinators.length} Officers
                </span>
              </div>

              <div className="divide-y divide-slate-100 font-mono text-xs">
                {coordinators.map((coord: any) => (
                  <div key={coord.id || coord.email} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50 transition-colors">
                    <div>
                      <div className="font-bold text-slate-900 flex items-center gap-2">
                        <span>{coord.full_name || 'Gate Coordinator'}</span>
                        <span className="px-2 py-0.2 text-[10px] rounded uppercase font-bold bg-blue-100 text-blue-900 border border-blue-200">
                          COORDINATOR
                        </span>
                      </div>
                      <div className="text-slate-500 text-xs font-sans mt-0.5">{coord.email}</div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleResetCoordPass(coord.id, coord.email)}
                        disabled={isProcessing}
                        className="px-2.5 py-1.5 text-xs font-bold text-slate-700 hover:text-black bg-slate-100 hover:bg-slate-200 rounded transition-colors cursor-pointer"
                        title="Reset password to password@67"
                      >
                        Reset Password
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRemoveCoordinator(coord.id, coord.email)}
                        disabled={isProcessing}
                        className="px-2.5 py-1.5 text-xs font-bold text-rose-700 hover:text-white hover:bg-rose-600 bg-rose-50 rounded border border-rose-200 transition-colors cursor-pointer"
                        title="Remove Coordinator Access"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
                {coordinators.length === 0 && (
                  <div className="p-8 text-center text-slate-500 font-mono text-xs">
                    No gate coordinators appointed yet. Appoint coordinators above to delegate check-in duties.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ========================================================
            TAB 7: AUDIT LOGS (Admins & Managers)
           ======================================================== */}
        {currentTab === 'audit' && !isCoordinator && (
          <div className="space-y-4">
            <div className="bg-white p-4 border border-slate-200 rounded-xl shadow-xs">
              <h2 className="text-base font-bold text-slate-900">Administrative Audit Trail & Officer Roster</h2>
              <p className="text-xs text-slate-500">Official registry of appointed administrators and chronological audit trail</p>
            </div>

            {/* Appointed Administrators Roster Card (Required by Audit view) */}
            <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
              <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold font-mono uppercase text-slate-900">Active Festival Administrators</h3>
                  <p className="text-[11px] text-slate-500 font-sans">Officers with administrative console privileges</p>
                </div>
                <span className="text-[11px] font-mono bg-white px-2.5 py-0.5 border border-slate-200 rounded font-bold text-slate-700">
                  {visibleAdminUsers.length} Officers Appointed
                </span>
              </div>
              <div className="divide-y divide-slate-100 font-mono text-xs">
                {visibleAdminUsers.map((admin: any) => {
                  const isRyan = admin.email?.toLowerCase() === 'ryankeshary@gmail.com';
                  const isMasterOfficer =
                    (isRyan && isCurrentUserRyan) ||
                    admin.email?.toLowerCase() === 'shrey.sleeps@gmail.com';
                  return (
                    <div key={admin.id || admin.email} className="p-3.5 flex items-center justify-between gap-3 hover:bg-slate-50 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className={`w-2.5 h-2.5 rounded-full ${isMasterOfficer ? 'bg-amber-500 shadow-[0_0_8px_#f59e0b]' : 'bg-emerald-500'}`} />
                        <div>
                          <div className="font-bold text-slate-900 flex items-center gap-2">
                            <span>{admin.full_name || 'Admin Officer'}</span>
                            <span className={`px-2 py-0.2 text-[10px] rounded uppercase font-bold ${
                              isMasterOfficer
                                ? 'bg-amber-100 text-amber-900 border border-amber-300'
                                : 'bg-slate-100 text-slate-700 border border-slate-200'
                            }`}>
                              {isMasterOfficer ? 'MASTER' : 'ADMIN'}
                            </span>
                          </div>
                          <div className="text-slate-500 text-[11px] font-sans">{admin.email}</div>
                        </div>
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {admin.created_at ? new Date(admin.created_at).toLocaleDateString() : 'System'}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Audit Logs List */}
            <div className="bg-white border border-slate-200 rounded-xl shadow-xs divide-y divide-slate-100 font-mono text-xs overflow-hidden">
              <div className="p-3 bg-slate-50 border-b border-slate-200 font-bold text-xs text-slate-800">
                Action Event Trail
              </div>
              {auditLogs.map((log: any) => (
                <div key={log.id} className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-slate-50 transition-colors">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[#D21319] font-bold">[{log.action}]</span>
                    <span className="text-slate-800">{log.actor_email || 'System'}</span>
                    <span className="text-slate-500">➔ {log.target_type} ({log.target_id || ''})</span>
                  </div>
                  <span className="text-[10px] text-slate-400">
                    {new Date(log.created_at).toLocaleString()}
                  </span>
                </div>
              ))}
              {auditLogs.length === 0 && (
                <div className="p-8 text-center text-xs font-mono text-slate-500">
                  No audit entries recorded yet.
                </div>
              )}
            </div>
          </div>
        )}

        {/* ========================================================
            TAB: MASTER CONSOLE (MASTERS ONLY)
           ======================================================== */}
        {currentTab === 'master' && !isCoordinator && currentUser?.isMaster && (
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-neutral-900 to-black text-white p-6 rounded-xl shadow-sm border border-neutral-800">
              <div className="flex items-center gap-2 mb-1">
                <Crown size={18} className="text-amber-400" />
                <span className="font-mono text-xs uppercase tracking-widest text-amber-400 font-bold">
                  MASTER ORGANIZER CONSOLE
                </span>
              </div>
              <h2 className="text-lg font-bold font-sans">Appoint & Manage Festival Administrators</h2>
              <p className="text-xs text-neutral-400 mt-0.5">
                Exclusive privileges restricted to {isCurrentUserRyan ? 'ryankeshary@gmail.com and shrey.sleeps@gmail.com' : 'shrey.sleeps@gmail.com'}.
                Other admins cannot view or access this console.
              </p>
            </div>

            {masterNotice && (
              <div className="p-3.5 bg-amber-50 border border-amber-300 rounded-lg text-xs font-mono text-amber-900 flex items-center justify-between">
                <span>{masterNotice}</span>
                <button
                  type="button"
                  onClick={() => setMasterNotice(null)}
                  className="font-bold text-amber-700 hover:text-black cursor-pointer"
                >
                  ✕
                </button>
              </div>
            )}

            {/* Appoint New Administrator Form */}
            <form onSubmit={handleAddAdmin} className="p-6 bg-white border border-slate-200 rounded-xl shadow-xs space-y-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Appoint New Administrator Officer</h3>
                <p className="text-xs text-slate-500">
                  Provision admin privileges. Newly appointed admins will default to password: <strong className="text-black font-mono">password@67</strong>
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Admin Email Address *</label>
                  <input
                    type="email"
                    required
                    value={newAdminEmail}
                    onChange={(e) => setNewAdminEmail(e.target.value)}
                    placeholder="e.g. officer@slrtce.in"
                    className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-xs text-slate-900 focus:border-[#D21319] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Officer Full Name</label>
                  <input
                    type="text"
                    value={newAdminName}
                    onChange={(e) => setNewAdminName(e.target.value)}
                    placeholder="e.g. Prof. Alan Turing"
                    className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-xs text-slate-900 focus:border-[#D21319] focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <span className="text-[11px] font-mono text-slate-500">
                  ✦ Default credentials: Email + <strong className="text-slate-800">password@67</strong>
                </span>

                <button
                  type="submit"
                  disabled={isProcessing || !newAdminEmail.trim()}
                  className="px-5 py-2.5 bg-black hover:bg-[#D21319] disabled:opacity-50 text-white font-bold text-xs rounded-lg transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <Crown size={13} />
                  <span>Appoint Administrator</span>
                </button>
              </div>
            </form>

            {/* Active Administrators Roster Table */}
            <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
              <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Current Administrative Officers</h3>
                  <p className="text-xs text-slate-500">Manage credentials and access privileges</p>
                </div>
                <span className="text-xs font-mono bg-white px-2 py-0.5 border border-slate-200 rounded">
                  {visibleAdminUsers.length} Officers
                </span>
              </div>

              <div className="divide-y divide-slate-100 font-mono text-xs">
                {visibleAdminUsers.map((admin: any) => {
                  const isRyan = admin.email?.toLowerCase() === 'ryankeshary@gmail.com';
                  const isMasterOfficer =
                    (isRyan && isCurrentUserRyan) ||
                    admin.email?.toLowerCase() === 'shrey.sleeps@gmail.com';
                  return (
                    <div key={admin.id || admin.email} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50">
                      <div>
                        <div className="font-bold text-slate-900 flex items-center gap-2">
                          <span>{admin.full_name || 'Admin Officer'}</span>
                          <span className={`px-2 py-0.2 text-[10px] rounded uppercase font-bold ${
                            isMasterOfficer ? 'bg-amber-100 text-amber-900 border border-amber-300' : 'bg-slate-100 text-slate-700'
                          }`}>
                            {isMasterOfficer ? 'MASTER ORGANIZER' : 'ADMIN OFFICER'}
                          </span>
                        </div>
                        <div className="text-slate-500 text-xs font-sans mt-0.5">{admin.email}</div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {!isMasterOfficer && (
                          <>
                            <button
                              type="button"
                              onClick={() => handleResetAdminPass(admin.id, admin.email)}
                              disabled={isProcessing}
                              className="px-2.5 py-1.5 text-xs font-bold text-slate-700 hover:text-black bg-slate-100 hover:bg-slate-200 rounded transition-colors cursor-pointer"
                              title="Reset password to password@67"
                            >
                              Reset to password@67
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRevokeAdmin(admin.id, admin.email)}
                              disabled={isProcessing}
                              className="px-2.5 py-1.5 text-xs font-bold text-rose-700 hover:text-white hover:bg-rose-600 bg-rose-50 rounded border border-rose-200 transition-colors cursor-pointer"
                              title="Revoke Admin Access"
                            >
                              Revoke Access
                            </button>
                          </>
                        )}
                        {isMasterOfficer && (
                          <span className="text-[11px] text-amber-700 font-bold font-sans">
                            Master Account (Immutable)
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ========================================================
            TAB 8: SECURITY & PASSWORD (Admins & Managers)
           ======================================================== */}
        {currentTab === 'password' && !isCoordinator && (
          <div className="max-w-md mx-auto p-6 bg-white border border-slate-200 rounded-xl shadow-xs space-y-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">Change Admin Master Password</h2>
              <p className="text-xs text-slate-500">Logged in as {currentUser?.email}. Update master credentials below.</p>
            </div>

            {passwordMsg && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs font-mono text-blue-800">
                {passwordMsg}
              </div>
            )}

            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">New Secret Passcode</label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter at least 6 characters"
                  className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-xs text-slate-900 focus:border-[#D21319] focus:outline-none"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-[#D21319] hover:bg-[#b00f14] text-white font-bold text-xs rounded-lg transition-colors cursor-pointer"
              >
                Update Password
              </button>
            </form>
          </div>
        )}

      </main>

      {/* ========================================================
          MODAL: EDIT PARTICIPANT DETAILS
         ======================================================== */}
      {editingParticipant && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-white border border-slate-200 rounded-2xl p-6 shadow-xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900">Edit Participant Record</h3>
              <button onClick={() => setEditingParticipant(null)} className="text-slate-400 hover:text-slate-600">
                <X size={16} />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <label className="text-slate-600 font-bold block mb-1">Full Name</label>
                <input
                  type="text"
                  value={editingParticipant.full_name}
                  onChange={(e) => setEditingParticipant({ ...editingParticipant, full_name: e.target.value })}
                  className="w-full bg-white border border-slate-300 rounded-lg p-2 text-slate-900 font-medium"
                />
              </div>

              <div>
                <label className="text-slate-600 font-bold block mb-1">Email</label>
                <input
                  type="email"
                  value={editingParticipant.email}
                  onChange={(e) => setEditingParticipant({ ...editingParticipant, email: e.target.value })}
                  className="w-full bg-white border border-slate-300 rounded-lg p-2 text-slate-900 font-medium"
                />
              </div>

              <div>
                <label className="text-slate-600 font-bold block mb-1">Phone</label>
                <input
                  type="tel"
                  value={editingParticipant.phone}
                  onChange={(e) => setEditingParticipant({ ...editingParticipant, phone: e.target.value })}
                  className="w-full bg-white border border-slate-300 rounded-lg p-2 text-slate-900 font-medium"
                />
              </div>

              <div>
                <label className="text-slate-600 font-bold block mb-1">College</label>
                <input
                  type="text"
                  value={editingParticipant.college}
                  onChange={(e) => setEditingParticipant({ ...editingParticipant, college: e.target.value })}
                  className="w-full bg-white border border-slate-300 rounded-lg p-2 text-slate-900 font-medium"
                />
              </div>

              <div>
                <label className="text-slate-600 font-bold block mb-1">Status</label>
                <select
                  value={editingParticipant.status}
                  onChange={(e) => setEditingParticipant({ ...editingParticipant, status: e.target.value })}
                  className="w-full bg-white border border-slate-300 rounded-lg p-2 text-slate-900 font-medium"
                >
                  <option value="Confirmed">Confirmed</option>
                  <option value="Checked In">Checked In</option>
                  <option value="Qualified for Day 2">Qualified for Day 2</option>
                  <option value="Pending">Pending</option>
                  <option value="Disqualified">Disqualified</option>
                </select>
              </div>

              <div>
                <label className="text-slate-600 font-bold block mb-1">Year of Study</label>
                <input
                  type="text"
                  value={editingParticipant.year_of_study}
                  onChange={(e) => setEditingParticipant({ ...editingParticipant, year_of_study: e.target.value })}
                  className="w-full bg-white border border-slate-300 rounded-lg p-2 text-slate-900 font-medium"
                />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  const target = editingParticipant;
                  setEditingParticipant(null);
                  handleDeleteParticipant(target);
                }}
                disabled={isProcessing}
                className="inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs rounded-lg border border-rose-200 transition-colors cursor-pointer disabled:opacity-50"
                title="Permanently delete candidate so they can re-register"
              >
                <Trash2 size={13} />
                <span>Delete Candidate</span>
              </button>

              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setEditingParticipant(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg transition-colors cursor-pointer"
                >
                  Cancel
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
                  className="px-5 py-2 bg-[#D21319] hover:bg-[#b00f14] text-white text-xs font-bold rounded-lg transition-colors cursor-pointer"
                >
                  Save Details
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL: MANUAL ON-SPOT REGISTRATION
         ======================================================== */}
      {manualModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-white border border-slate-200 rounded-2xl p-6 shadow-xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900">Manual / On-Spot Participant Enrollment</h3>
              <button onClick={() => setManualModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X size={16} />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="col-span-2">
                <label className="text-slate-600 font-bold block mb-1">Target Squad (Optional)</label>
                <select
                  value={manualForm.teamId}
                  onChange={(e) => setManualForm({ ...manualForm, teamId: e.target.value })}
                  className="w-full bg-white border border-slate-300 rounded-lg p-2 text-slate-900 font-medium"
                >
                  <option value="">Create Independent On-Spot Squad</option>
                  {teams.map((t: any) => (
                    <option key={t.id} value={t.id}>{t.name} ({t.code})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-slate-600 font-bold block mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={manualForm.fullName}
                  onChange={(e) => setManualForm({ ...manualForm, fullName: e.target.value })}
                  className="w-full bg-white border border-slate-300 rounded-lg p-2 text-slate-900 font-medium"
                />
              </div>

              <div>
                <label className="text-slate-600 font-bold block mb-1">Email</label>
                <input
                  type="email"
                  required
                  value={manualForm.email}
                  onChange={(e) => setManualForm({ ...manualForm, email: e.target.value })}
                  className="w-full bg-white border border-slate-300 rounded-lg p-2 text-slate-900 font-medium"
                />
              </div>

              <div>
                <label className="text-slate-600 font-bold block mb-1">Phone</label>
                <input
                  type="tel"
                  required
                  value={manualForm.phone}
                  onChange={(e) => setManualForm({ ...manualForm, phone: e.target.value })}
                  className="w-full bg-white border border-slate-300 rounded-lg p-2 text-slate-900 font-medium"
                />
              </div>

              <div>
                <label className="text-slate-600 font-bold block mb-1">College</label>
                <input
                  type="text"
                  required
                  value={manualForm.college}
                  onChange={(e) => setManualForm({ ...manualForm, college: e.target.value })}
                  className="w-full bg-white border border-slate-300 rounded-lg p-2 text-slate-900 font-medium"
                />
              </div>

              <div>
                <label className="text-slate-600 font-bold block mb-1">Department</label>
                <input
                  type="text"
                  value={manualForm.department}
                  onChange={(e) => setManualForm({ ...manualForm, department: e.target.value })}
                  className="w-full bg-white border border-slate-300 rounded-lg p-2 text-slate-900 font-medium"
                />
              </div>

              <div>
                <label className="text-slate-600 font-bold block mb-1">Status</label>
                <select
                  value={manualForm.status}
                  onChange={(e) => setManualForm({ ...manualForm, status: e.target.value })}
                  className="w-full bg-white border border-slate-300 rounded-lg p-2 text-slate-900 font-medium"
                >
                  <option value="Confirmed">Confirmed</option>
                  <option value="Checked In">Checked In</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                onClick={() => setManualModalOpen(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg transition-colors"
              >
                Cancel
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
                className="px-5 py-2 bg-[#D21319] hover:bg-[#b00f14] text-white text-xs font-bold rounded-lg transition-colors cursor-pointer"
              >
                Register On-Spot
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL: EDIT EVENT CONFIG
         ======================================================== */}
      {editingEvent && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-white border border-slate-200 rounded-2xl p-6 shadow-xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900">Edit Settings · {editingEvent.name}</h3>
              <button onClick={() => setEditingEvent(null)} className="text-slate-400 hover:text-slate-600">
                <X size={16} />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <label className="text-slate-600 font-bold block mb-1">Capacity (Teams)</label>
                <input
                  type="number"
                  value={editingEvent.capacity}
                  onChange={(e) => setEditingEvent({ ...editingEvent, capacity: parseInt(e.target.value) || 50 })}
                  className="w-full bg-white border border-slate-300 rounded-lg p-2 text-slate-900 font-medium"
                />
              </div>

              <div>
                <label className="text-slate-600 font-bold block mb-1">Slot Timing</label>
                <input
                  type="text"
                  value={editingEvent.slot_time}
                  onChange={(e) => setEditingEvent({ ...editingEvent, slot_time: e.target.value })}
                  className="w-full bg-white border border-slate-300 rounded-lg p-2 text-slate-900 font-medium"
                />
              </div>

              <div>
                <label className="text-slate-600 font-bold block mb-1">Min Team Size</label>
                <input
                  type="number"
                  value={editingEvent.min_team_size}
                  onChange={(e) => setEditingEvent({ ...editingEvent, min_team_size: parseInt(e.target.value) || 1 })}
                  className="w-full bg-white border border-slate-300 rounded-lg p-2 text-slate-900 font-medium"
                />
              </div>

              <div>
                <label className="text-slate-600 font-bold block mb-1">Max Team Size</label>
                <input
                  type="number"
                  value={editingEvent.max_team_size}
                  onChange={(e) => setEditingEvent({ ...editingEvent, max_team_size: parseInt(e.target.value) || 4 })}
                  className="w-full bg-white border border-slate-300 rounded-lg p-2 text-slate-900 font-medium"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                onClick={() => setEditingEvent(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg transition-colors"
              >
                Cancel
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
                className="px-5 py-2 bg-[#D21319] hover:bg-[#b00f14] text-white text-xs font-bold rounded-lg transition-colors cursor-pointer"
              >
                Save Settings
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          SLIDE-OVER SIDEBAR: CSV EXPORT CENTER
         ======================================================== */}
      {sideExportOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          {/* Backdrop */}
          <div
            onClick={() => setSideExportOpen(false)}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity cursor-pointer"
          />

          {/* Right-aligned Slide-over Sidebar Drawer */}
          <div className="fixed inset-y-0 right-0 max-w-full flex pl-10 z-50">
            <div className="w-screen max-w-md bg-white border-l border-slate-200 shadow-2xl flex flex-col h-full animate-in slide-in-from-right duration-200">
              {/* Sidebar Header */}
              <div className="p-4 sm:p-5 bg-slate-50 border-b border-slate-200 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-[#D21319] text-white rounded-xl shadow-xs shrink-0">
                    <Download size={18} />
                  </div>
                  <div>
                    <h2 className="text-base font-black text-slate-900 tracking-tight">CSV Export Center</h2>
                    <p className="text-xs text-slate-500">Instant spreadsheet exports for festival operations</p>
                  </div>
                </div>
                <button
                  onClick={() => setSideExportOpen(false)}
                  className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer shrink-0"
                  title="Close export sidebar"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Sidebar Body */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
                <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-200">
                  Export real-time festival records into standard UTF-8 CSV formats, suitable for Microsoft Excel, Google Sheets, and attendance desks.
                </p>

                <div className="space-y-3.5">
                  {/* Option 1: Checked-In Attendees Only */}
                  <div className="p-4 bg-white border-2 border-blue-200 rounded-xl hover:border-blue-500 transition-colors shadow-2xs space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg">
                          <UserCheck size={16} />
                        </div>
                        <div>
                          <h3 className="text-xs font-bold text-slate-900">Check-Ins Report</h3>
                          <span className="text-[10px] font-mono text-blue-600 font-bold block">
                            {checkedInCount} Admitted
                          </span>
                        </div>
                      </div>
                      <span className="text-[9px] font-mono px-1.5 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-full font-bold">
                        .CSV
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 leading-snug">
                      Verified candidates admitted through the Rapid Check-In desk with timestamps and contact numbers.
                    </p>
                    <button
                      onClick={() => exportRegistrationsCSV('checkedin')}
                      className="w-full flex items-center justify-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg shadow-xs transition-colors cursor-pointer"
                    >
                      <Download size={13} />
                      <span>Download Check-Ins</span>
                    </button>
                  </div>

                  {/* Option 2: All Registrations */}
                  <div className="p-4 bg-white border-2 border-slate-200 rounded-xl hover:border-[#D21319] transition-colors shadow-2xs space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-rose-50 text-[#D21319] rounded-lg">
                          <Users size={16} />
                        </div>
                        <div>
                          <h3 className="text-xs font-bold text-slate-900">All Registrations</h3>
                          <span className="text-[10px] font-mono text-slate-600 font-bold block">
                            {registrations?.length || 0} Total Candidates
                          </span>
                        </div>
                      </div>
                      <span className="text-[9px] font-mono px-1.5 py-0.5 bg-slate-100 text-slate-700 border border-slate-200 rounded-full font-bold">
                        .CSV
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 leading-snug">
                      Comprehensive census of all individual candidate profiles, college affiliations, contact emails, and events.
                    </p>
                    <button
                      onClick={() => exportRegistrationsCSV('all')}
                      className="w-full flex items-center justify-center gap-1.5 px-3 py-2 bg-[#D21319] hover:bg-[#b00f14] text-white font-bold text-xs rounded-lg shadow-xs transition-colors cursor-pointer"
                    >
                      <Download size={13} />
                      <span>Download Census</span>
                    </button>
                  </div>

                  {/* Option 3: Team / Squad Registrations */}
                  <div className="p-4 bg-white border-2 border-emerald-200 rounded-xl hover:border-emerald-500 transition-colors shadow-2xs space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg">
                          <Shield size={16} />
                        </div>
                        <div>
                          <h3 className="text-xs font-bold text-slate-900">Squad Registrations</h3>
                          <span className="text-[10px] font-mono text-emerald-700 font-bold block">
                            {teams?.length || 0} Squads
                          </span>
                        </div>
                      </div>
                      <span className="text-[9px] font-mono px-1.5 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full font-bold">
                        .CSV
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 leading-snug">
                      All created squads with JRV codes, team captains, roster sizes, discipline tracks, and token keys.
                    </p>
                    <button
                      onClick={exportTeamsCSV}
                      className="w-full flex items-center justify-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg shadow-xs transition-colors cursor-pointer"
                    >
                      <Download size={13} />
                      <span>Download Squads</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Sidebar Footer */}
              <div className="p-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500 font-mono shrink-0">
                <span className="text-[11px]">UTF-8 (.csv) format</span>
                <button
                  onClick={() => setSideExportOpen(false)}
                  className="px-3.5 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-lg font-semibold transition-colors cursor-pointer text-xs"
                >
                  Close Sidebar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
