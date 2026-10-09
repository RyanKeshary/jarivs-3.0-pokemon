'use client';

import React, { use, useState, useEffect } from 'react';
import Link from 'next/link';
import { getFestTeamByCode, joinFestTeam } from '@/app/actions/registration';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';

export default function JoinTeamPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const unwrappedParams = use(params);
  const code = (unwrappedParams.code || '').toUpperCase();

  const [teamData, setTeamData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Form State
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [college, setCollege] = useState('SLRTCE Mumbai');
  const [department, setDepartment] = useState('');
  const [yearOfStudy, setYearOfStudy] = useState('3rd Year (TE)');
  const [division, setDivision] = useState('');
  const [rollNo, setRollNo] = useState('');
  const [referenceId, setReferenceId] = useState('');
  const [honeypot, setHoneypot] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [joinedSuccess, setJoinedSuccess] = useState(false);

  useEffect(() => {
    async function loadTeam() {
      setLoading(true);
      setErrorMsg(null);
      const res = await getFestTeamByCode(code);
      setLoading(false);
      if (res.success && res.team) {
        setTeamData(res.team);
      } else {
        setErrorMsg(res.error || 'Team not found.');
      }
    }
    loadTeam();
  }, [code]);

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const emailTrimmed = email.trim().toLowerCase();
    if (!emailTrimmed.endsWith('@slrtce.in')) {
      setErrorMsg('Only official SLRTCE institutional email addresses (@slrtce.in) are permitted.');
      return;
    }

    const cleanPhone = phone.trim().replace(/\D/g, '');
    if (cleanPhone.length !== 10) {
      setErrorMsg('Please enter a valid 10-digit WhatsApp/phone number (numbers only).');
      return;
    }

    if (!division.trim()) {
      setErrorMsg('Please specify your division (e.g. A, B, C).');
      return;
    }

    if (!rollNo.trim()) {
      setErrorMsg('Please specify your roll number.');
      return;
    }

    if (!referenceId.trim()) {
      setErrorMsg('Please enter your Reference ID from your college ID card.');
      return;
    }

    setSubmitting(true);

    const res = await joinFestTeam({
      code,
      member: {
        fullName: fullName.trim(),
        email: emailTrimmed,
        phone: cleanPhone,
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

    setSubmitting(false);

    if (res.success) {
      setJoinedSuccess(true);
    } else {
      setErrorMsg(res.error || 'Failed to join team.');
    }
  };

  return (
    <div className="min-h-screen bg-[#1B1E4A] text-[#E9E6DA] flex flex-col select-none">
      <Navbar />

      <main className="flex-1 max-w-2xl w-full mx-auto px-4 py-12">
        <div className="border border-[#AFAEA2] bg-[#121435] p-6 sm:p-10 shadow-[4px_4px_0px_#0E1026]">
          
          <div className="border-b border-[#AFAEA2]/40 pb-4 mb-6 text-center">
            <span className="label-editorial text-[9px] block">
              SQUAD ROSTER CONVOCATION · CODE {code}
            </span>
            <h1 className="font-serif text-3xl sm:text-4xl text-[#D21319] uppercase font-bold tracking-tight mt-1">
              JOIN TEAM
            </h1>
          </div>

          {loading ? (
            <div className="p-8 text-center text-xs font-mono text-[#AFAEA2]">
              RETRIEVING SQUAD ROSTER RECORDS...
            </div>
          ) : errorMsg && !teamData ? (
            <div className="p-4 bg-[#D21319]/20 border border-[#D21319] text-xs font-grotesk text-center space-y-4">
              <span className="text-[#D21319] font-bold">[ ERROR ]: </span>
              {errorMsg}
              <div>
                <Link
                  href="/"
                  className="inline-block mt-2 px-4 py-2 bg-[#AFAEA2] text-[#1B1E4A] font-bold text-xs uppercase"
                >
                  RETURN TO HOME
                </Link>
              </div>
            </div>
          ) : joinedSuccess ? (
            <div className="text-center py-6 space-y-4">
              <div className="p-4 bg-[#1B1E4A] border border-[#AFAEA2]">
                <span className="label-editorial text-[9px] block mb-1">
                  CONFIRMATION STATUS
                </span>
                <span className="font-serif text-2xl text-[#E9E6DA] font-bold block">
                  ENROLLED IN {teamData?.name}
                </span>
                <p className="font-grotesk text-xs text-[#AFAEA2] mt-2">
                  Your registration has been confirmed under team code {code}. Report to the campus pavilion on 16 October 2026.
                </p>
              </div>

              <Link
                href="/"
                className="inline-block px-8 py-3 bg-[#E9E6DA] text-[#D21319] font-grotesk font-bold text-xs uppercase border border-[#E9E6DA] shadow-[3px_3px_0px_#0E1026]"
              >
                RETURN TO FESTIVAL HOME
              </Link>
            </div>
          ) : (
            <div>
              {/* Squad Preview Card */}
              <div className="p-4 bg-[#1B1E4A] border border-[#AFAEA2]/40 mb-6 text-xs font-mono space-y-1">
                <div className="flex justify-between items-center text-[#E9E6DA] font-bold">
                  <span>TEAM: {teamData?.name}</span>
                  <span className="text-[#D21319]">{teamData?.remainingSlots} SLOTS AVAILABLE</span>
                </div>
                <div className="text-[#AFAEA2]">
                  EVENTS: {teamData?.eventIds?.join(', ')}
                </div>
              </div>

              {errorMsg && (
                <div className="p-3 bg-[#D21319]/20 border border-[#D21319] text-xs font-grotesk mb-4">
                  <span className="text-[#D21319] font-bold">[ NOTICE ]: </span>
                  {errorMsg}
                </div>
              )}

              {/* Join Form */}
              <form onSubmit={handleJoin} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">                  <div>
                    <label className="label-editorial text-[8px] block mb-1">FULL NAME *</label>
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full bg-[#1B1E4A] border border-[#AFAEA2] px-3 py-2 text-xs text-[#E9E6DA] focus:border-[#D21319] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="label-editorial text-[8px] block mb-1">SLRTCE EMAIL ADDRESS *</label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      autoComplete="off"
                      className="w-full bg-[#1B1E4A] border border-[#AFAEA2] px-3 py-2 text-xs text-[#E9E6DA] focus:border-[#D21319] focus:outline-none"
                    />
                    <span className="text-[9px] text-[#AFAEA2]/70 font-mono mt-0.5 block">
                      Must end with @slrtce.in
                    </span>
                  </div>

                  <div>
                    <label className="label-editorial text-[8px] block mb-1">WHATSAPP NUMBER *</label>
                    <input
                      type="tel"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={10}
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                      className="w-full bg-[#1B1E4A] border border-[#AFAEA2] px-3 py-2 text-xs text-[#E9E6DA] focus:border-[#D21319] focus:outline-none"
                    />
                    <span className="text-[9px] text-[#AFAEA2]/70 font-mono mt-0.5 block">
                      Digits only · 10 digits
                    </span>
                  </div>

                  <div>
                    <label className="label-editorial text-[8px] block mb-1">COLLEGE / INSTITUTION *</label>
                    <input
                      type="text"
                      required
                      value={college}
                      onChange={(e) => setCollege(e.target.value)}
                      className="w-full bg-[#1B1E4A] border border-[#AFAEA2] px-3 py-2 text-xs text-[#E9E6DA] focus:border-[#D21319] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="label-editorial text-[8px] block mb-1">DEPARTMENT / BRANCH *</label>
                    <input
                      type="text"
                      required
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                      className="w-full bg-[#1B1E4A] border border-[#AFAEA2] px-3 py-2 text-xs text-[#E9E6DA] focus:border-[#D21319] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="label-editorial text-[8px] block mb-1">YEAR OF STUDY *</label>
                    <select
                      value={yearOfStudy}
                      onChange={(e) => setYearOfStudy(e.target.value)}
                      className="w-full bg-[#1B1E4A] border border-[#AFAEA2] px-3 py-2 text-xs text-[#E9E6DA] focus:border-[#D21319] focus:outline-none"
                    >
                      <option value="1st Year (FE)">1st Year (FE)</option>
                      <option value="2nd Year (SE)">2nd Year (SE)</option>
                      <option value="3rd Year (TE)">3rd Year (TE)</option>
                      <option value="4th Year (BE)">4th Year (BE)</option>
                      <option value="Postgraduate">Postgraduate</option>
                    </select>
                  </div>

                  <div>
                    <label className="label-editorial text-[8px] block mb-1">DIVISION *</label>
                    <input
                      type="text"
                      required
                      value={division}
                      onChange={(e) => setDivision(e.target.value.toUpperCase())}
                      className="w-full bg-[#1B1E4A] border border-[#AFAEA2] px-3 py-2 text-xs text-[#E9E6DA] focus:border-[#D21319] focus:outline-none uppercase"
                    />
                  </div>

                  <div>
                    <label className="label-editorial text-[8px] block mb-1">ROLL NO. *</label>
                    <input
                      type="text"
                      required
                      value={rollNo}
                      onChange={(e) => setRollNo(e.target.value)}
                      className="w-full bg-[#1B1E4A] border border-[#AFAEA2] px-3 py-2 text-xs text-[#E9E6DA] focus:border-[#D21319] focus:outline-none"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="label-editorial text-[8px] block mb-1">REFERENCE ID (FROM YOUR ID CARD) *</label>
                    <input
                      type="text"
                      required
                      value={referenceId}
                      onChange={(e) => setReferenceId(e.target.value)}
                      className="w-full bg-[#1B1E4A] border border-[#AFAEA2] px-3 py-2 text-xs text-[#E9E6DA] focus:border-[#D21319] focus:outline-none"
                    />
                    <span className="text-[9px] text-[#AFAEA2]/70 font-mono mt-0.5 block">
                      Mandatory · Enter the reference ID as printed on your SLRTCE ID card
                    </span>
                  </div>
                </div>

                <div className="pt-4 border-t border-[#AFAEA2]/30 flex justify-end">
                  <button
                    type="submit"
                    disabled={submitting || teamData?.isLocked}
                    className="w-full sm:w-auto px-8 py-3 bg-[#D21319] text-[#E9E6DA] font-grotesk font-bold text-xs uppercase tracking-wider border border-[#D21319] shadow-[3px_3px_0px_#0E1026] hover:bg-[#A80D12] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[1px_1px_0px_#0E1026] cursor-pointer"
                  >
                    {submitting ? 'PROCESSING...' : "JOIN SQUAD ROSTER [ -> ]"}
                  </button>
                </div>
              </form>
            </div>
          )}

        </div>
      </main>

      <Footer />
    </div>
  );
}
