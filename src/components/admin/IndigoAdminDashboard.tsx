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
  Crown,
  Eye,
  EyeOff,
  Copy
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
  resetAdminPassword,
  adminResetBatchPasswords,
  adminResetAllAdminsPassword,
  adminResetAllCoordinatorsPassword
} from '@/app/actions/admin';
import { createClient } from '@/lib/supabase/client';
import { AdminPokemonGuardian } from './AdminPokemonGuardian';

const DEFAULT_FEST_EVENTS = [
  { id: 'project-exhibition', name: 'Poké Expo: Project Exhibition' },
  { id: 'pid-geotto', name: 'Pidgetto: Line-Follower Race' },
  { id: 'treasure-hunt', name: "Team Rocket's Pokéquest: Treasure Hunt" },
  { id: 'quiz-tle', name: 'Quiztle: Technical Quiz' },
  { id: 'build-asor', name: 'Buildasaur: Buildathon' },
  { id: 'snorreelax', name: 'Snorreelax: Reel Making Competition' },
  { id: 'cad-mander', name: 'Cadmander: AutoCAD Competition' },
];

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
  const [manualModalError, setManualModalError] = useState<string | null>(null);
  const [feedbackNotice, setFeedbackNotice] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [mobileTabsMenuOpen, setMobileTabsMenuOpen] = useState(false);

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
    eventId: 'project-exhibition',
    isLeader: true,
    status: 'Confirmed'
  });

  // Check-In Mode Search State
  const [checkinQuery, setCheckinQuery] = useState('');

  // Password Change State
  const [newPassword, setNewPassword] = useState('');
  const [passwordMsg, setPasswordMsg] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

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

  // Floating Toast Notification
  const [toast, setToast] = useState<{
    id: number;
    type: 'success' | 'error';
    message: string;
    subtext?: string;
  } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success', subtext?: string) => {
    const id = Date.now();
    setToast({ id, type, message, subtext });
    setTimeout(() => {
      setToast((curr) => (curr?.id === id ? null : curr));
    }, 4500);
  };

  // Password Management Modal State for Coordinators & Admins (Supports single & batch scopes)
  const [passwordModalUser, setPasswordModalUser] = useState<{
    id?: string;
    email?: string;
    name?: string;
    role: 'admin' | 'coordinator' | 'all_admins' | 'all_coordinators' | 'all_staff';
  } | null>(null);
  const [passwordTargetScope, setPasswordTargetScope] = useState<'single' | 'all_admins' | 'all_coordinators' | 'all_staff'>('all_admins');
  const [targetNewPassword, setTargetNewPassword] = useState('password@67');
  const [showTargetPassword, setShowTargetPassword] = useState(true);
  const [passwordModalSuccess, setPasswordModalSuccess] = useState<{
    password: string;
    scope: string;
    count: number;
    emails?: string[];
  } | null>(null);
  const [copiedPassword, setCopiedPassword] = useState(false);

  const { metrics, perEventStats, timelineData, registrations, teams, events, announcements, auditLogs, currentUser, adminUsers, coordinators = [] } = data;

  const availableEvents = useMemo(() => {
    if (events && events.length > 0) {
      return events.map((e: any) => ({
        id: e.id,
        name: e.name || e.id
      }));
    }
    return DEFAULT_FEST_EVENTS;
  }, [events]);

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
        alert(res?.error || 'Failed to delete participant record.');
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
        alert(res?.error || 'Failed to delete selected participants.');
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

  // Password Modal Open & Save (Supports both single user and all at once)
  const handleOpenPasswordModal = (user: { id: string; email: string; name: string; role: 'admin' | 'coordinator' }) => {
    const defaultScope = user.role === 'admin' ? 'all_admins' : 'all_coordinators';
    setPasswordModalUser(user);
    setPasswordTargetScope(defaultScope);
    setTargetNewPassword('password@67');
    setShowTargetPassword(true);
    setPasswordModalSuccess(null);
    setCopiedPassword(false);
  };

  const handleOpenBatchPasswordModal = (scope: 'all_admins' | 'all_coordinators' | 'all_staff') => {
    setPasswordModalUser({
      role: scope,
      name:
        scope === 'all_admins'
          ? 'All Administrators'
          : scope === 'all_coordinators'
          ? 'All Gate Coordinators'
          : 'All Festival Staff',
      email:
        scope === 'all_admins'
          ? `${visibleAdminUsers.length} Admin Officers`
          : scope === 'all_coordinators'
          ? `${coordinators.length} Coordinators`
          : 'All Staff Members',
    });
    setPasswordTargetScope(scope);
    setTargetNewPassword('password@67');
    setShowTargetPassword(true);
    setPasswordModalSuccess(null);
    setCopiedPassword(false);
  };

  const handleSaveUserPassword = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!passwordModalUser) return;
    if (targetNewPassword.length < 6) {
      showToast('Password must be at least 6 characters long.', 'error');
      return;
    }
    setIsProcessing(true);
    try {
      let res: any;
      if (passwordTargetScope === 'all_admins') {
        res = await adminResetAllAdminsPassword(targetNewPassword);
      } else if (passwordTargetScope === 'all_coordinators') {
        res = await adminResetAllCoordinatorsPassword(targetNewPassword);
      } else if (passwordTargetScope === 'all_staff') {
        res = await adminResetBatchPasswords('all_staff', targetNewPassword);
      } else if (passwordModalUser.role === 'admin') {
        res = await resetAdminPassword(passwordModalUser.id!, targetNewPassword);
      } else {
        res = await adminResetCoordinatorPassword(passwordModalUser.id!, targetNewPassword);
      }

      if (res?.success) {
        const pass = res.newPassword || targetNewPassword;
        const count = res.count || 1;
        const scopeDesc =
          passwordTargetScope === 'all_admins'
            ? `All Administrators (${count} accounts)`
            : passwordTargetScope === 'all_coordinators'
            ? `All Gate Coordinators (${count} accounts)`
            : passwordTargetScope === 'all_staff'
            ? `All Staff (${count} accounts)`
            : passwordModalUser.email;

        setPasswordModalSuccess({
          password: pass,
          scope: scopeDesc || 'Accounts',
          count,
          emails: res.emails || (passwordModalUser.email ? [passwordModalUser.email] : []),
        });

        showToast(
          `Password updated for ${scopeDesc}!`,
          'success',
          `Active Password: ${pass}`
        );
        if (onRefresh) onRefresh();
      } else {
        showToast(res?.error || 'Failed to update password.', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Error updating password.', 'error');
    } finally {
      setIsProcessing(false);
    }
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
        showToast(`Administrator ${newAdminEmail.trim()} appointed!`, 'success', 'Password: password@67');
        setMasterNotice(`Administrator ${newAdminEmail.trim()} appointed successfully! Default password is set to password@67`);
        setNewAdminEmail('');
        setNewAdminName('');
        if (onRefresh) onRefresh();
      }
    } catch (err: any) {
      showToast(err.message || 'Error appointing administrator.', 'error');
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
        showToast(`Admin access revoked for ${email}.`, 'success');
        setMasterNotice(`Admin access revoked for ${email}.`);
        if (onRefresh) onRefresh();
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to revoke admin.', 'error');
      setMasterNotice(`Error: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleResetAdminPass = async (adminId: string, email: string) => {
    handleOpenPasswordModal({
      id: adminId,
      email,
      name: 'Admin Officer',
      role: 'admin',
    });
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
        showToast(`Gate coordinator ${newCoordEmail.trim()} appointed!`, 'success', 'Password: password@67');
        setCoordNotice(`Gate coordinator ${newCoordEmail.trim()} appointed successfully! Default password is password@67`);
        setNewCoordEmail('');
        setNewCoordName('');
        if (onRefresh) onRefresh();
      } else {
        showToast(res?.error || 'Failed to appoint coordinator.', 'error');
        setCoordNotice(`Error: ${res?.error || 'Failed to appoint coordinator.'}`);
      }
    } catch (err: any) {
      showToast(err.message || 'Error configuring coordinator authentication.', 'error');
      setCoordNotice(`Error: ${err.message || 'Error configuring coordinator authentication.'}`);
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
        showToast(`Coordinator access removed for ${email}.`, 'success');
        setCoordNotice(`Coordinator access removed for ${email}.`);
        if (onRefresh) onRefresh();
      } else {
        showToast(res?.error || 'Failed to remove coordinator.', 'error');
        setCoordNotice(`Error: ${res?.error || 'Failed to remove coordinator.'}`);
      }
    } catch (err: any) {
      showToast(err.message || 'Error removing coordinator.', 'error');
      setCoordNotice(`Error: ${err.message || 'Error removing coordinator.'}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleResetCoordPass = async (coordId: string, email: string) => {
    handleOpenPasswordModal({
      id: coordId,
      email,
      name: 'Gate Coordinator',
      role: 'coordinator',
    });
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
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 font-sans flex flex-col antialiased overflow-x-hidden w-full max-w-full">
      
      {/* 1. TOP EXECUTIVE MASTHEAD (LIGHT THEMED) */}
      <header className="bg-white border-b border-slate-200 shadow-xs sticky top-0 z-30 w-full max-w-full">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-2.5 sm:py-3 flex items-center justify-between gap-2 w-full">
          
          {/* Brand & Identity */}
          <div className="flex items-center gap-2.5 min-w-0">
            <img
              src="/logo.png"
              alt="Indigo Tech Fest Logo"
              className="w-7 h-7 sm:w-8 sm:h-8 rounded-full object-contain shrink-0 ring-1 ring-slate-200 shadow-xs"
            />
            <div className="flex items-center gap-1.5 min-w-0">
              <Link
                href="/"
                className="font-serif text-[15px] sm:text-2xl font-black text-[#D21319] tracking-tight hover:opacity-90 leading-none whitespace-nowrap"
              >
                INDIGO TECH FEST
              </Link>
              <span className="hidden sm:inline-block text-[9px] sm:text-[10px] font-mono font-bold uppercase tracking-wider bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded border border-slate-200 shrink-0">
                {isCoordinator ? 'COORDINATOR' : 'ADMIN CONSOLE'}
              </span>
            </div>
          </div>

          {/* Quick Action Links & User profile */}
          <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
            {/* Desktop user role pill */}
            <div className="hidden lg:flex items-center gap-2 px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono text-slate-700">
              {isCoordinator ? <UserCheck size={13} className="text-blue-600" /> : <Shield size={13} className="text-[#D21319]" />}
              <span className="font-semibold truncate max-w-[150px]">{currentUser?.email || (isCoordinator ? 'Coordinator' : 'Admin')}</span>
              {isCoordinator && (
                <span className="px-1.5 py-0.2 bg-blue-100 text-blue-800 text-[9px] font-bold rounded">COORDINATOR</span>
              )}
            </div>

            {onRefresh && (
              <button
                onClick={onRefresh}
                className="p-1.5 sm:p-2 text-slate-600 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors cursor-pointer"
                title="Refresh latest telemetry"
              >
                <RefreshCw size={13} />
              </button>
            )}

            {!isCoordinator && (
              <AdminPokemonGuardian
                totalCandidates={registrations.length}
                totalSquads={teams.length}
                onOpenExport={() => setSideExportOpen(true)}
              />
            )}

            <button
              onClick={handleLogout}
              className="flex items-center gap-1 px-2 py-1.5 sm:px-2.5 text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg shadow-2xs transition-colors cursor-pointer"
              title="Sign out from Administrator Console"
            >
              <LogOut size={13} />
              <span className="text-[11px] sm:text-xs">Logout</span>
            </button>
          </div>

        </div>

        {/* Action Tabs Bar - Only visible to Admins/Managers, HIDDEN for Coordinators */}
        {!isCoordinator && (
          <div className="border-t border-slate-100 bg-slate-50/90 w-full max-w-full">
            {/* Desktop Tabs Bar (Wide Screens >= md) */}
            <div className="hidden md:flex max-w-7xl mx-auto items-center gap-1.5 px-4 sm:px-6 lg:px-8 py-2 overflow-x-auto no-scrollbar">
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
                    className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer whitespace-nowrap ${
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
            </div>

            {/* Mobile Tab Navigator (Strictly Zero Horizontal Scroll) */}
            <div className="md:hidden px-3 py-2 space-y-1.5 w-full max-w-full">
              {/* Primary 4 Quick Operational Tabs (Equal Grid, 100% Responsive) */}
              <div className="grid grid-cols-4 gap-1 w-full">
                {[
                  { id: 'dashboard', label: 'Overview', icon: Layers },
                  { id: 'registrations', label: 'Regs', icon: Users },
                  { id: 'teams', label: 'Squads', icon: Shield },
                  { id: 'checkin', label: 'Check-In', icon: CheckCircle2 },
                ].map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => {
                        setActiveTab(tab.id as any);
                        setMobileTabsMenuOpen(false);
                      }}
                      className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer text-center w-full min-w-0 ${
                        isActive
                          ? 'bg-[#D21319] text-white shadow-xs ring-1 ring-[#D21319]'
                          : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <Icon size={14} className="mb-0.5 shrink-0" />
                      <span className="truncate w-full leading-tight">{tab.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Mobile Sub-bar: Active View Tag & Expandable Menu Toggle */}
              <div className="flex items-center justify-between pt-1 border-t border-slate-200/60 text-xs">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 font-bold shrink-0">VIEW:</span>
                  <span className="text-xs font-bold text-slate-900 truncate">
                    {activeTab === 'dashboard' ? 'Overview' :
                     activeTab === 'registrations' ? 'Registrations' :
                     activeTab === 'teams' ? 'Squads' :
                     activeTab === 'checkin' ? 'Rapid Check-In' :
                     activeTab === 'events' ? 'Disciplines' :
                     activeTab === 'announcements' ? 'Notices' :
                     activeTab === 'coordinators' ? 'Coordinators' :
                     activeTab === 'audit' ? 'Audit Log' :
                     activeTab === 'master' ? 'Master Console' :
                     'Security'}
                  </span>
                </div>

                <button
                  onClick={() => setMobileTabsMenuOpen(!mobileTabsMenuOpen)}
                  className={`flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold rounded-lg border transition-colors cursor-pointer shadow-2xs ${
                    mobileTabsMenuOpen || !['dashboard', 'registrations', 'teams', 'checkin'].includes(activeTab)
                      ? 'bg-slate-900 text-white border-slate-900'
                      : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                  }`}
                >
                  <Layers size={12} />
                  <span>{mobileTabsMenuOpen ? 'Hide Menu ▲' : 'All Sections (10) ▼'}</span>
                </button>
              </div>

              {/* Expandable Mobile Grid (All 10 Sections with Large Tap Targets) */}
              {mobileTabsMenuOpen && (
                <div className="grid grid-cols-2 gap-1.5 p-2 bg-white rounded-xl border border-slate-200 shadow-sm mt-1 animate-in fade-in duration-150">
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
                        onClick={() => {
                          setActiveTab(tab.id as any);
                          setMobileTabsMenuOpen(false);
                        }}
                        className={`flex items-center gap-2 p-2 rounded-lg text-xs font-bold transition-all text-left cursor-pointer ${
                          isActive
                            ? 'bg-[#D21319] text-white shadow-xs'
                            : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200/70'
                        }`}
                      >
                        <Icon size={14} className="shrink-0" />
                        <span className="truncate">{tab.label}</span>
                      </button>
                    );
                  })}

                  <button
                    onClick={() => {
                      setSideExportOpen(true);
                      setMobileTabsMenuOpen(false);
                    }}
                    className="col-span-2 flex items-center justify-center gap-1.5 p-2 rounded-lg text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 transition-colors cursor-pointer"
                  >
                    <Download size={14} className="text-[#D21319]" />
                    <span>Open CSV Export Center</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </header>

      {/* 2. MAIN CONTENT BODY */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 overflow-x-hidden">
        
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
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 bg-white border border-slate-200 rounded-xl shadow-xs">
              <div>
                <h1 className="text-base sm:text-lg font-bold text-slate-900">Festival Overview</h1>
                <p className="text-xs text-slate-500">Live operational telemetry &amp; enrollment status</p>
              </div>

              <div className="grid grid-cols-2 sm:flex sm:items-center gap-2 w-full sm:w-auto">
                <button
                  onClick={() => {
                    setManualModalError(null);
                    setManualModalOpen(true);
                  }}
                  className="col-span-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-bold bg-[#D21319] hover:bg-[#b00f14] text-white rounded-lg shadow-xs transition-colors cursor-pointer"
                >
                  <Plus size={14} />
                  <span>On-Spot Reg</span>
                </button>

                <button
                  onClick={() => setActiveTab('checkin')}
                  className="col-span-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-xs transition-colors cursor-pointer"
                >
                  <CheckCircle2 size={14} />
                  <span>Rapid Check-In</span>
                </button>

                <button
                  onClick={() => setSideExportOpen(true)}
                  className="col-span-2 sm:col-span-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 rounded-lg transition-colors cursor-pointer"
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
                    onClick={() => {
                      setManualModalError(null);
                      setManualModalOpen(true);
                    }}
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
              <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Active Gate Coordinators</h3>
                  <p className="text-xs text-slate-500">Authorized personnel who can scan and check in festival participants</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono bg-white px-2 py-0.5 border border-slate-200 rounded">
                    {coordinators.length} Officers
                  </span>
                  {coordinators.length > 0 && (
                    <button
                      type="button"
                      onClick={() => handleOpenBatchPasswordModal('all_coordinators')}
                      disabled={isProcessing}
                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-mono font-bold text-xs rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 shadow-xs shrink-0"
                      title="Change password for all coordinators at once"
                    >
                      <KeyRound size={13} />
                      <span>Change All Coordinators Password</span>
                    </button>
                  )}
                </div>
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
                        className="px-2.5 py-1.5 text-xs font-bold text-slate-700 hover:text-black bg-slate-100 hover:bg-slate-200 rounded transition-colors cursor-pointer flex items-center gap-1"
                        title="Change or reset password and view credentials"
                      >
                        <KeyRound size={12} />
                        <span>Change Password</span>
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
              <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Current Administrative Officers</h3>
                  <p className="text-xs text-slate-500">Manage credentials and access privileges</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono bg-white px-2 py-0.5 border border-slate-200 rounded">
                    {visibleAdminUsers.length} Officers
                  </span>
                  {visibleAdminUsers.length > 0 && (
                    <button
                      type="button"
                      onClick={() => handleOpenBatchPasswordModal('all_admins')}
                      disabled={isProcessing}
                      className="px-3 py-1.5 bg-[#D21319] hover:bg-[#b00f14] text-white font-mono font-bold text-xs rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 shadow-xs shrink-0"
                      title="Change password for all administrators at once"
                    >
                      <KeyRound size={13} />
                      <span>Change All Admins Password</span>
                    </button>
                  )}
                </div>
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
                              className="px-2.5 py-1.5 text-xs font-bold text-slate-700 hover:text-black bg-slate-100 hover:bg-slate-200 rounded transition-colors cursor-pointer flex items-center gap-1"
                              title="Change or reset password and view credentials"
                            >
                              <KeyRound size={12} />
                              <span>Change Password</span>
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
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter at least 6 characters"
                    className="w-full bg-white border border-slate-300 rounded-lg p-2.5 pr-10 text-xs text-slate-900 focus:border-[#D21319] focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 p-1 cursor-pointer transition-colors"
                    title={showPassword ? 'Hide password' : 'Show password'}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
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
                  onChange={(e) => {
                    const selectedTeamId = e.target.value;
                    const matchedTeam = teams?.find((t: any) => t.id === selectedTeamId);
                    const matchedEventId = matchedTeam?.event_ids?.[0];
                    setManualForm(prev => ({
                      ...prev,
                      teamId: selectedTeamId,
                      ...(matchedEventId ? { eventId: matchedEventId } : {})
                    }));
                  }}
                  className="w-full bg-white border border-slate-300 rounded-lg p-2 text-slate-900 font-medium"
                >
                  <option value="">Create Independent On-Spot Squad</option>
                  {teams.map((t: any) => (
                    <option key={t.id} value={t.id}>{t.name} ({t.code})</option>
                  ))}
                </select>
              </div>

              <div className="col-span-2">
                <div className="flex items-center justify-between mb-1">
                  <label className="text-slate-700 font-bold block">
                    Event / Discipline <span className="text-red-500">*</span>
                  </label>
                  {manualForm.teamId && (
                    <span className="text-[10px] text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                      Linked to Squad
                    </span>
                  )}
                </div>
                <select
                  value={manualForm.eventId}
                  disabled={Boolean(manualForm.teamId)}
                  onChange={(e) => setManualForm({ ...manualForm, eventId: e.target.value })}
                  className={`w-full border rounded-lg p-2 text-slate-900 font-medium transition-colors ${
                    manualForm.teamId
                      ? 'bg-slate-100 border-slate-200 text-slate-500 cursor-not-allowed'
                      : 'bg-white border-slate-300 focus:border-[#D21319] focus:ring-1 focus:ring-[#D21319]'
                  }`}
                >
                  {availableEvents.map((ev: any) => (
                    <option key={ev.id} value={ev.id}>
                      {ev.name}
                    </option>
                  ))}
                </select>
                <p className="text-[10px] text-slate-500 mt-1">
                  {manualForm.teamId
                    ? 'Event is automatically determined by the selected squad.'
                    : 'Select one of the 7 official Jarvis 3.0 events for this participant.'}
                </p>
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

            {manualModalError && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs font-semibold rounded-lg flex items-start gap-2 animate-in fade-in">
                <AlertCircle size={16} className="text-red-500 shrink-0 mt-0.5" />
                <span className="leading-relaxed">{manualModalError}</span>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                onClick={() => {
                  setManualModalError(null);
                  setManualModalOpen(false);
                }}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                disabled={isProcessing}
                onClick={async () => {
                  try {
                    setIsProcessing(true);
                    setManualModalError(null);
                    await adminCreateManualParticipant({
                      fullName: manualForm.fullName,
                      email: manualForm.email,
                      phone: manualForm.phone,
                      college: manualForm.college,
                      department: manualForm.department,
                      yearOfStudy: manualForm.yearOfStudy,
                      collegeId: manualForm.collegeId,
                      teamId: manualForm.teamId || undefined,
                      eventId: manualForm.eventId || 'project-exhibition',
                      isLeader: !manualForm.teamId,
                      status: manualForm.status
                    });
                    setManualModalOpen(false);
                    setManualForm({
                      fullName: '',
                      email: '',
                      phone: '',
                      college: '',
                      department: '',
                      yearOfStudy: '3rd Year',
                      collegeId: '',
                      teamId: '',
                      eventId: 'project-exhibition',
                      isLeader: true,
                      status: 'Confirmed'
                    });
                    setFeedbackNotice('On-spot participant registered successfully!');
                    if (onRefresh) onRefresh();
                  } catch (err: any) {
                    const message = err.message || 'Failed to register on-spot participant';
                    setManualModalError(message);
                  } finally {
                    setIsProcessing(false);
                  }
                }}
                className="px-5 py-2 bg-[#D21319] hover:bg-[#b00f14] disabled:opacity-50 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer"
              >
                {isProcessing ? 'Registering...' : 'Register On-Spot'}
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

      {/* ========================================================
          TOAST NOTIFICATION POPUP (Instant Feedback)
         ======================================================== */}
      {toast && (
        <div className="fixed top-5 right-5 z-[100] max-w-sm w-full bg-white border-2 border-black shadow-[6px_6px_0px_#000] p-4 flex items-start gap-3 pointer-events-auto transition-all animate-in fade-in slide-in-from-top-4">
          <div className={`p-2 shrink-0 rounded-full ${toast.type === 'success' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
            {toast.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-bold text-black font-mono uppercase tracking-wider">
              {toast.type === 'success' ? 'System Notification' : 'Action Alert'}
            </div>
            <div className="text-xs text-neutral-800 font-sans mt-0.5 break-words font-medium">
              {toast.message}
            </div>
            {toast.subtext && (
              <div className="mt-1.5 flex items-center justify-between gap-2 p-1.5 bg-neutral-100 border border-neutral-300 rounded text-[11px] font-mono text-neutral-900">
                <span className="truncate">{toast.subtext}</span>
                <button
                  type="button"
                  onClick={() => {
                    const passMatch = toast.subtext?.replace(/^Password:\s*/, '');
                    if (passMatch) navigator.clipboard.writeText(passMatch);
                  }}
                  className="px-1.5 py-0.5 bg-white hover:bg-neutral-200 border border-black text-[10px] font-bold shrink-0 cursor-pointer"
                  title="Copy password"
                >
                  Copy
                </button>
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={() => setToast(null)}
            className="text-neutral-400 hover:text-black p-1 cursor-pointer transition-colors"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* ========================================================
          MODAL: CHANGE / RESET USER PASSWORD (Supports ALL AT ONCE & Single)
         ======================================================== */}
      {passwordModalUser && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-white border-2 border-black rounded-xl p-6 shadow-[8px_8px_0px_#000] space-y-4">
            <div className="flex justify-between items-start border-b border-neutral-200 pb-3">
              <div>
                <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-[#D21319] block">
                  {passwordTargetScope === 'all_admins'
                    ? 'BATCH ADMINISTRATOR CREDENTIALS'
                    : passwordTargetScope === 'all_coordinators'
                    ? 'BATCH COORDINATOR CREDENTIALS'
                    : passwordTargetScope === 'all_staff'
                    ? 'GLOBAL FESTIVAL STAFF CREDENTIALS'
                    : passwordModalUser.role === 'admin'
                    ? 'ADMINISTRATOR CREDENTIALS'
                    : 'COORDINATOR CREDENTIALS'}
                </span>
                <h3 className="text-base font-bold text-slate-900">
                  {passwordTargetScope.startsWith('all_')
                    ? `Change Password for ${
                        passwordTargetScope === 'all_admins'
                          ? 'ALL Administrators'
                          : passwordTargetScope === 'all_coordinators'
                          ? 'ALL Gate Coordinators'
                          : 'ALL Staff'
                      } at Once`
                    : 'Change Password'}
                </h3>
                <p className="text-xs text-slate-500 font-mono mt-0.5">
                  {passwordTargetScope === 'all_admins'
                    ? `Will update all ${visibleAdminUsers.length} administrator accounts`
                    : passwordTargetScope === 'all_coordinators'
                    ? `Will update all ${coordinators.length} gate coordinator accounts`
                    : passwordTargetScope === 'all_staff'
                    ? 'Will update all administrators and coordinators simultaneously'
                    : `${passwordModalUser.name} · ${passwordModalUser.email}`}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setPasswordModalUser(null);
                  setPasswordModalSuccess(null);
                  setCopiedPassword(false);
                }}
                className="text-slate-400 hover:text-black p-1 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {passwordModalSuccess ? (
              <div className="space-y-4">
                <div className="p-4 bg-emerald-50 border-2 border-emerald-600 rounded-lg text-emerald-950 space-y-2">
                  <div className="flex items-center gap-2 font-bold text-xs text-emerald-800">
                    <CheckCircle2 size={16} />
                    <span>Password Successfully Updated for {passwordModalSuccess.count} {passwordModalSuccess.count === 1 ? 'Account' : 'Accounts'}!</span>
                  </div>
                  <p className="text-xs text-slate-600">
                    The credentials for <strong className="text-black">{passwordModalSuccess.scope}</strong> have been updated and are active immediately:
                  </p>
                  <div className="p-3 bg-white border border-emerald-300 rounded font-mono text-center my-2">
                    <span className="text-[10px] text-slate-400 uppercase tracking-widest block font-bold mb-1">
                      NEW ACTIVE PASSWORD
                    </span>
                    <span className="text-2xl font-black text-[#D21319] tracking-wider select-all">
                      {passwordModalSuccess.password}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(passwordModalSuccess.password);
                      setCopiedPassword(true);
                      setTimeout(() => setCopiedPassword(false), 2000);
                    }}
                    className="w-full py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-mono font-bold text-xs rounded transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    {copiedPassword ? (
                      <>
                        <Check size={14} />
                        <span>✓ Password Copied to Clipboard</span>
                      </>
                    ) : (
                      <>
                        <Copy size={14} />
                        <span>Copy Password</span>
                      </>
                    )}
                  </button>

                  {passwordModalSuccess.emails && passwordModalSuccess.emails.length > 0 && (
                    <div className="mt-3 pt-2 border-t border-emerald-200">
                      <span className="text-[10px] font-mono font-bold text-emerald-900 block mb-1">
                        Updated Accounts ({passwordModalSuccess.emails.length}):
                      </span>
                      <div className="max-h-28 overflow-y-auto flex flex-wrap gap-1 pr-1">
                        {passwordModalSuccess.emails.map((em) => (
                          <span
                            key={em}
                            className="px-2 py-0.5 bg-white border border-emerald-300 text-emerald-900 rounded text-[10px] font-mono"
                          >
                            ✓ {em}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setPasswordModalUser(null);
                    setPasswordModalSuccess(null);
                    setCopiedPassword(false);
                  }}
                  className="w-full py-2.5 bg-black hover:bg-neutral-800 text-white font-bold text-xs rounded-lg transition-colors cursor-pointer"
                >
                  Done
                </button>
              </div>
            ) : (
              <form onSubmit={handleSaveUserPassword} className="space-y-4">
                {/* Scope Selection: All at once VS Single */}
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1.5">
                    Target Accounts Scope *
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 font-mono text-xs">
                    {passwordModalUser.role === 'coordinator' || passwordModalUser.role === 'all_coordinators' ? (
                      <>
                        <button
                          type="button"
                          onClick={() => setPasswordTargetScope('all_coordinators')}
                          className={`p-2.5 text-left rounded-lg border transition-all cursor-pointer ${
                            passwordTargetScope === 'all_coordinators'
                              ? 'border-blue-600 bg-blue-50/80 text-blue-950 font-bold ring-1 ring-blue-600'
                              : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-white'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center text-[9px] ${
                              passwordTargetScope === 'all_coordinators' ? 'border-blue-600 bg-blue-600 text-white' : 'border-slate-400'
                            }`}>
                              {passwordTargetScope === 'all_coordinators' ? '✓' : ''}
                            </span>
                            <span className="font-bold">All Coordinators ({coordinators.length})</span>
                          </div>
                          <span className="text-[10px] text-slate-500 block mt-1 ml-5.5 font-sans">
                            Applies to all gate coordinators at once
                          </span>
                        </button>

                        {passwordModalUser.id && (
                          <button
                            type="button"
                            onClick={() => setPasswordTargetScope('single')}
                            className={`p-2.5 text-left rounded-lg border transition-all cursor-pointer ${
                              passwordTargetScope === 'single'
                                ? 'border-blue-600 bg-blue-50/80 text-blue-950 font-bold ring-1 ring-blue-600'
                                : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-white'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <span className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center text-[9px] ${
                                passwordTargetScope === 'single' ? 'border-blue-600 bg-blue-600 text-white' : 'border-slate-400'
                              }`}>
                                {passwordTargetScope === 'single' ? '✓' : ''}
                              </span>
                              <span className="font-bold truncate">Only This Coordinator</span>
                            </div>
                            <span className="text-[10px] text-slate-500 block mt-1 ml-5.5 font-sans truncate">
                              {passwordModalUser.email}
                            </span>
                          </button>
                        )}
                      </>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={() => setPasswordTargetScope('all_admins')}
                          className={`p-2.5 text-left rounded-lg border transition-all cursor-pointer ${
                            passwordTargetScope === 'all_admins'
                              ? 'border-[#D21319] bg-red-50/80 text-red-950 font-bold ring-1 ring-[#D21319]'
                              : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-white'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center text-[9px] ${
                              passwordTargetScope === 'all_admins' ? 'border-[#D21319] bg-[#D21319] text-white' : 'border-slate-400'
                            }`}>
                              {passwordTargetScope === 'all_admins' ? '✓' : ''}
                            </span>
                            <span className="font-bold">All Admins ({visibleAdminUsers.length})</span>
                          </div>
                          <span className="text-[10px] text-slate-500 block mt-1 ml-5.5 font-sans">
                            Applies to all administrators at once
                          </span>
                        </button>

                        {passwordModalUser.id && (
                          <button
                            type="button"
                            onClick={() => setPasswordTargetScope('single')}
                            className={`p-2.5 text-left rounded-lg border transition-all cursor-pointer ${
                              passwordTargetScope === 'single'
                                ? 'border-[#D21319] bg-red-50/80 text-red-950 font-bold ring-1 ring-[#D21319]'
                                : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-white'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <span className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center text-[9px] ${
                                passwordTargetScope === 'single' ? 'border-[#D21319] bg-[#D21319] text-white' : 'border-slate-400'
                              }`}>
                                {passwordTargetScope === 'single' ? '✓' : ''}
                              </span>
                              <span className="font-bold truncate">Only This Officer</span>
                            </div>
                            <span className="text-[10px] text-slate-500 block mt-1 ml-5.5 font-sans truncate">
                              {passwordModalUser.email}
                            </span>
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Set New Password *
                  </label>
                  <div className="relative">
                    <input
                      type={showTargetPassword ? 'text' : 'password'}
                      required
                      value={targetNewPassword}
                      onChange={(e) => setTargetNewPassword(e.target.value)}
                      placeholder="Enter at least 6 characters"
                      className="w-full bg-white border border-slate-300 rounded-lg p-2.5 pr-10 text-xs font-mono text-slate-900 focus:border-[#D21319] focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowTargetPassword((p) => !p)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 p-1 cursor-pointer"
                      title={showTargetPassword ? 'Hide password' : 'Show password'}
                    >
                      {showTargetPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setTargetNewPassword('password@67')}
                    className="px-2.5 py-1 text-[11px] font-mono bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 rounded cursor-pointer transition-colors"
                  >
                    Default (password@67)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const rand = 'Pass@' + Math.floor(1000 + Math.random() * 9000);
                      setTargetNewPassword(rand);
                    }}
                    className="px-2.5 py-1 text-[11px] font-mono bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 rounded cursor-pointer transition-colors"
                  >
                    Generate Random
                  </button>
                </div>

                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-900 text-xs">
                  ✦ After saving, the password will be shown directly on screen with a copy button and list of all updated accounts.
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setPasswordModalUser(null)}
                    className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-black cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isProcessing || targetNewPassword.length < 6}
                    className="px-5 py-2 bg-[#D21319] hover:bg-[#b00f14] disabled:opacity-50 text-white font-bold text-xs rounded-lg transition-colors cursor-pointer flex items-center gap-1.5"
                  >
                    <KeyRound size={14} />
                    <span>{isProcessing ? 'Saving...' : 'Apply Password to Target'}</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
