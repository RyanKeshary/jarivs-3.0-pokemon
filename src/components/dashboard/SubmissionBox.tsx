'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  UploadCloud,
  FileText,
  Lock,
  CheckCircle2,
  History,
  AlertTriangle,
  ExternalLink,
  Download,
  Loader2,
  FileCode,
  FileCheck,
  RefreshCw,
} from 'lucide-react';
import { getDeckDownloadUrl } from '@/app/actions/dashboard';
import { playRetroBeep, playVictoryChime } from '@/lib/sound';
import type { Submission } from '@/lib/database.types';

interface SubmissionBoxProps {
  submissions: Submission[];
  teamId?: string;
  deadline: string;
  onPokedexRequest: () => void;
}

interface UploadingFileState {
  name: string;
  size: number;
  type: string;
}

function formatBytes(bytes?: number | string | null): string {
  if (!bytes) return '';
  const num = typeof bytes === 'string' ? parseInt(bytes, 10) : bytes;
  if (isNaN(num) || num <= 0) return '';
  if (num < 1024) return `${num} B`;
  if (num < 1024 * 1024) return `${(num / 1024).toFixed(1)} KB`;
  return `${(num / (1024 * 1024)).toFixed(2)} MB`;
}

function getDisplayFileName(sub: Submission): string {
  if (sub.file_name) return sub.file_name;
  const raw = sub.ppt_url ? sub.ppt_url.split('/').pop() || 'presentation_deck' : 'presentation_deck';
  return raw.replace(/^deck_\d+_/, '').replace(/^v_\d+_/, '');
}

function getFileExtension(filename: string): string {
  return filename.split('.').pop()?.toUpperCase() || 'DECK';
}

export function SubmissionBox({
  submissions: initialSubmissions,
  teamId,
  deadline,
  onPokedexRequest,
}: SubmissionBoxProps) {
  const router = useRouter();
  const [submissions, setSubmissions] = useState<Submission[]>(initialSubmissions || []);
  const [uploading, setUploading] = useState(false);
  const [uploadingFile, setUploadingFile] = useState<UploadingFileState | null>(null);
  const [downloadingPath, setDownloadingPath] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Synchronize state when initial props update
  useEffect(() => {
    if (initialSubmissions && initialSubmissions.length > 0) {
      setSubmissions(initialSubmissions);
    }
  }, [initialSubmissions]);

  const isLocked = new Date() > new Date(deadline);
  const latestSubmission = submissions[0] || null;

  const handleDownload = async (storagePath: string) => {
    setDownloadingPath(storagePath);
    try {
      const res = await getDeckDownloadUrl(storagePath);
      if (res.signedUrl) {
        window.open(res.signedUrl, '_blank');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to download deck');
    } finally {
      setDownloadingPath(null);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setErrorMsg(null);
    setSuccessMsg(null);

    // Validate size (50MB)
    if (file.size > 52428800) {
      setErrorMsg('File size exceeds the 50MB hackathon limit.');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    // Validate extension
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (!['pdf', 'ppt', 'pptx'].includes(ext || '')) {
      setErrorMsg('Invalid format. Only .pdf, .ppt, or .pptx presentation decks are accepted.');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    setUploading(true);
    setUploadingFile({
      name: file.name,
      size: file.size,
      type: ext || 'deck',
    });

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/submissions/upload', {
        method: 'POST',
        body: formData,
      });

      const res = await response.json();
      if (!response.ok || !res.success) {
        throw new Error(res.error || 'Upload failed');
      }

      playVictoryChime();
      setSuccessMsg(`Deck uploaded successfully as Version ${res.version}!`);

      // Immediately insert or update active submission in local view
      if (res.submission) {
        const newSub: Submission = res.submission;
        setSubmissions((prev) => [newSub, ...prev.filter((s) => s.id !== newSub.id && s.version !== newSub.version)]);
      }

      // Refresh server state
      router.refresh();
    } catch (err: any) {
      playRetroBeep(220, 'sawtooth', 0.15);
      setErrorMsg(err.message || 'Upload failed');
    } finally {
      setUploading(false);
      setUploadingFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="bg-[#1E232A] text-white rounded-xl border-3 border-[#334155] p-4 flex flex-col h-full shadow-[4px_4px_0px_#1E232A] overflow-hidden">
      {/* Box Header */}
      <div className="flex items-center justify-between border-b-2 border-gray-700 pb-2 mb-3">
        <div className="flex items-center gap-2">
          <UploadCloud size={16} className="text-[#EE1515]" />
          <h3 className="font-pixel text-[11px] text-[#EE1515] tracking-wider uppercase">
            BOX 3: SUBMISSION PORTAL
          </h3>
        </div>
        {isLocked ? (
          <div className="flex items-center gap-1 text-[10px] font-mono text-red-400 bg-red-950/60 px-2 py-0.5 rounded border border-red-800">
            <Lock size={10} />
            <span>LOCKED</span>
          </div>
        ) : (
          <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800">
            OPEN
          </span>
        )}
      </div>

      {/* Main Body */}
      {!teamId ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center p-4">
          <AlertTriangle size={28} className="text-amber-400 mb-2" />
          <p className="font-pixel text-xs text-amber-300">NO TEAM DETECTED</p>
          <p className="text-xs text-gray-400 mt-1 max-w-xs font-sans">
            You must form or join a squad before uploading your hackathon project deck.
          </p>
          <button
            onClick={onPokedexRequest}
            className="mt-3 px-3 py-1.5 bg-[#FFCB05] text-[#1E232A] font-pixel text-[10px] rounded-lg border border-[#1E232A] shadow-[2px_2px_0_black] cursor-pointer hover:bg-yellow-400 transition-colors"
          >
            OPEN POKÉDEX TO JOIN TEAM
          </button>
        </div>
      ) : (
        <div className="flex-1 flex flex-col justify-between overflow-y-auto pr-1">
          <div>
            {/* Live Uploading Progress / Selected File State */}
            {uploading && uploadingFile && (
              <div className="p-3 bg-red-950/40 border border-[#EE1515] rounded-lg mb-3 shadow-[0_0_15px_rgba(238,21,21,0.25)]">
                <div className="flex items-center justify-between">
                  <span className="font-pixel text-[10px] text-[#EE1515] flex items-center gap-1.5 animate-pulse">
                    <Loader2 size={12} className="animate-spin text-[#EE1515]" />
                    <span>TRANSMITTING DECK TO SILPH CO. NETWORK...</span>
                  </span>
                  <span className="font-mono text-[9px] text-[#FFCB05] bg-black/60 px-2 py-0.5 rounded border border-[#FFCB05]/50 font-bold uppercase">
                    .{uploadingFile.type}
                  </span>
                </div>
                <div className="mt-2.5 flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded bg-red-900/50 border border-red-500/50 flex items-center justify-center shrink-0">
                    <FileText size={18} className="text-[#FFCB05]" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-mono text-xs text-white truncate font-semibold">
                      {uploadingFile.name}
                    </p>
                    <p className="font-mono text-[10px] text-gray-300">
                      {formatBytes(uploadingFile.size)} · Uploading...
                    </p>
                  </div>
                </div>
                {/* Animated progress bar */}
                <div className="mt-2.5 w-full bg-black/80 rounded-full h-1.5 overflow-hidden border border-gray-700">
                  <div className="bg-gradient-to-r from-[#EE1515] via-[#FFCB05] to-[#EE1515] h-full w-full animate-pulse" />
                </div>
              </div>
            )}

            {/* Active Submission Card */}
            {!uploading && latestSubmission ? (
              <div className="p-3 bg-gradient-to-br from-gray-800/90 to-gray-900/90 rounded-lg border-2 border-emerald-500/60 shadow-[0_0_15px_rgba(16,185,129,0.15)] mb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <FileCheck size={14} className="text-emerald-400" />
                    <span className="font-pixel text-[10px] text-[#FFCB05]">
                      ACTIVE DECK · VERSION {latestSubmission.version}
                    </span>
                  </div>
                  <span className="text-[9px] font-mono text-emerald-400 bg-emerald-950/70 border border-emerald-700/60 px-1.5 py-0.5 rounded" suppressHydrationWarning>
                    {latestSubmission.submitted_at
                      ? new Date(latestSubmission.submitted_at).toLocaleString([], {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })
                      : 'Just now'}
                  </span>
                </div>

                <div className="mt-2.5 p-2 bg-black/40 rounded border border-gray-700 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-xs text-gray-100 min-w-0">
                    <div className="w-7 h-7 rounded bg-emerald-950/60 border border-emerald-500/40 flex items-center justify-center shrink-0">
                      <FileText size={15} className="text-emerald-400" />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate font-mono text-[11px] font-semibold text-white">
                        {getDisplayFileName(latestSubmission)}
                      </p>
                      <p className="font-mono text-[9px] text-gray-400">
                        {getFileExtension(getDisplayFileName(latestSubmission))}
                        {latestSubmission.deck_size_bytes
                          ? ` · ${formatBytes(latestSubmission.deck_size_bytes)}`
                          : ''}{' '}
                        · Status: {latestSubmission.status.toUpperCase()}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleDownload(latestSubmission.ppt_url)}
                    disabled={downloadingPath === latestSubmission.ppt_url}
                    className="shrink-0 px-2.5 py-1.5 bg-emerald-600/30 hover:bg-emerald-600/50 text-emerald-300 border border-emerald-500/50 rounded font-pixel text-[8px] flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    {downloadingPath === latestSubmission.ppt_url ? (
                      <Loader2 size={10} className="animate-spin" />
                    ) : (
                      <Download size={10} />
                    )}
                    <span>VIEW DECK</span>
                  </button>
                </div>
              </div>
            ) : !uploading && !latestSubmission ? (
              <div className="p-4 bg-gray-800/40 rounded-lg border border-dashed border-gray-700 text-center mb-3">
                <FileText size={24} className="text-gray-500 mx-auto mb-1.5 opacity-60" />
                <p className="text-xs text-gray-300 font-mono">No presentation deck uploaded yet.</p>
                <p className="text-[10px] text-gray-500 font-sans mt-0.5">
                  Upload your slide deck in .PPT, .PPTX, or .PDF format below.
                </p>
              </div>
            ) : null}

            {/* Version History List */}
            {submissions.length > 1 && (
              <div className="mb-3">
                <span className="font-mono text-[10px] text-gray-400 uppercase flex items-center gap-1 mb-1">
                  <History size={12} />
                  <span>Version History ({submissions.length})</span>
                </span>
                <div className="space-y-1.5 max-h-24 overflow-y-auto text-[11px] font-mono pr-0.5">
                  {submissions.map((sub, idx) => (
                    <div
                      key={sub.id || idx}
                      className="flex items-center justify-between px-2.5 py-1.5 bg-black/30 hover:bg-black/50 rounded border border-gray-800 text-gray-300 transition-colors"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-[10px] font-pixel text-[#FFCB05] shrink-0">
                          v{sub.version}
                        </span>
                        <span className="truncate text-[10px] text-gray-300">
                          {getDisplayFileName(sub)}
                        </span>
                        {sub.deck_size_bytes && (
                          <span className="text-[9px] text-gray-500 shrink-0">
                            ({formatBytes(sub.deck_size_bytes)})
                          </span>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => handleDownload(sub.ppt_url)}
                        disabled={downloadingPath === sub.ppt_url}
                        className="text-[9px] text-cyan-400 hover:text-cyan-300 font-pixel flex items-center gap-1 cursor-pointer shrink-0 ml-2"
                      >
                        {downloadingPath === sub.ppt_url ? (
                          <Loader2 size={9} className="animate-spin" />
                        ) : (
                          <ExternalLink size={9} />
                        )}
                        <span>VIEW</span>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Feedback messages */}
          {errorMsg && (
            <div className="p-2 bg-red-950/60 border border-red-800 text-red-300 rounded font-mono text-[11px] mb-2 flex items-center gap-1.5">
              <AlertTriangle size={13} className="shrink-0 text-red-400" />
              <span>{errorMsg}</span>
            </div>
          )}
          {successMsg && (
            <div className="p-2 bg-emerald-950/60 border border-emerald-800 text-emerald-300 rounded font-mono text-[11px] mb-2 flex items-center gap-1.5">
              <CheckCircle2 size={13} className="shrink-0 text-emerald-400" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Upload Button or Locked Banner */}
          <div className="mt-2">
            {isLocked ? (
              <div className="p-2.5 bg-red-950/40 rounded-lg border border-red-800 text-center text-xs text-red-300 font-mono">
                Submissions are locked for judging.
              </div>
            ) : (
              <div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.ppt,.pptx"
                  className="hidden"
                  onChange={handleFileChange}
                />
                <button
                  type="button"
                  disabled={uploading}
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full py-2.5 bg-[#EE1515] hover:bg-[#D01010] active:scale-95 disabled:opacity-50 text-white font-pixel text-[10px] rounded-lg border border-white shadow-[2px_2px_0px_black] transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  {uploading ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <UploadCloud size={14} />
                  )}
                  <span>
                    {uploading
                      ? 'TRANSMITTING DECK...'
                      : latestSubmission
                      ? 'REPLACE / UPLOAD NEW VERSION'
                      : 'UPLOAD PRESENTATION DECK (PPT/PDF)'}
                  </span>
                </button>
                <p className="text-[9px] text-center text-gray-400 mt-1 font-mono">
                  Accepted formats: .pdf, .ppt, .pptx · Max 50MB
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
