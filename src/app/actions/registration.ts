'use server';

import { sql, createAdminClient } from '@/lib/supabase/admin';
import crypto from 'crypto';

// Character set excluding confusing 0, O, 1, I, L
const CODE_CHARS = '23456789ABCDEFGHJKMNPQRSTUVWXYZ';

function generateHumanFriendlyCode(): string {
  let suffix = '';
  for (let i = 0; i < 4; i++) {
    const randIdx = crypto.randomInt(0, CODE_CHARS.length);
    suffix += CODE_CHARS[randIdx];
  }
  return `JRV-${suffix}`;
}

export interface ParticipantInput {
  fullName: string;
  email: string;
  phone: string;
  college: string;
  department: string;
  yearOfStudy: string;
  collegeId?: string;
  division?: string;
  rollNo?: string;
  referenceId?: string;
}

export interface CreateTeamPayload {
  teamName: string;
  eventIds: string[];
  leader: ParticipantInput;
  honeypot?: string;
}

// 1. Create a Team
export async function createFestTeam(payload: CreateTeamPayload) {
  try {
    // Spam / Honeypot check
    if (payload.honeypot && payload.honeypot.trim().length > 0) {
      throw new Error('Automated submission rejected.');
    }

    const { teamName, eventIds, leader } = payload;

    if (!teamName || teamName.trim().length < 2) {
      throw new Error('Please provide a valid team name (at least 2 characters).');
    }

    if (!eventIds || eventIds.length === 0) {
      throw new Error('Please select at least one competition discipline.');
    }

    if (eventIds.length > 2) {
      throw new Error('Disqualification Rule: A participant or squad can participate in a maximum of 2 events.');
    }

    // Email sanitization & strict SLRTCE domain restriction
    const email = leader.email.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new Error('Please enter a valid email address.');
    }
    if (!email.endsWith('@slrtce.in')) {
      throw new Error('Only official SLRTCE institutional email addresses (@slrtce.in) are permitted.');
    }

    // Phone / WhatsApp: strictly digits only, exactly 10 digits
    const phone = leader.phone.trim().replace(/\D/g, '');
    if (phone.length !== 10) {
      throw new Error('Please enter a valid 10-digit WhatsApp/phone number (numbers only).');
    }

    // Reference ID from ID Card, Division, Roll No are mandatory
    const referenceId = (leader.referenceId || leader.collegeId || '').trim();
    if (!referenceId) {
      throw new Error('Reference ID (from your ID card) is required.');
    }
    const division = (leader.division || '').trim().toUpperCase();
    if (!division) {
      throw new Error('Division is required.');
    }
    const rollNo = (leader.rollNo || '').trim();
    if (!rollNo) {
      throw new Error('Roll Number is required.');
    }

    // 1. Strict duplicate account check: prevent registering twice with the same email
    const existingWithEmail = await sql`
      SELECT fr.email, ft.name as team_name, ft.code as team_code
      FROM public.fest_registrations fr
      JOIN public.fest_teams ft ON fr.team_id = ft.id
      WHERE LOWER(fr.email) = ${email}
    `;

    if (existingWithEmail.length > 0) {
      throw new Error(
        `Account already exists! A registration with email "${email}" is already enrolled under squad "${existingWithEmail[0].team_name}" (Code: ${existingWithEmail[0].team_code}). Please sign in to your dashboard.`
      );
    }

    const cleanRefId = (referenceId || '').trim().toLowerCase();
    const phone10 = phone.slice(-10);

    // Duplicate check and max 2 events per candidate rule across teams with multi-factor matching
    const existingParticipation = await sql`
      SELECT fr.full_name, fr.email, fr.phone, ft.name as team_name, ft.code as team_code, ft.event_ids
      FROM public.fest_registrations fr
      JOIN public.fest_teams ft ON fr.team_id = ft.id
      WHERE (
        LOWER(TRIM(fr.email)) = ${email}
        OR (${phone10.length >= 10} AND RIGHT(REGEXP_REPLACE(fr.phone, '\\D', '', 'g'), 10) = ${phone10})
        OR (${cleanRefId} != '' AND (
          LOWER(TRIM(COALESCE(fr.reference_id, ''))) = ${cleanRefId}
          OR LOWER(TRIM(COALESCE(fr.college_id, ''))) = ${cleanRefId}
        ))
      )
    `;

    const existingEventsSet = new Set<string>();
    for (const record of existingParticipation) {
      const recordedEvents: string[] = record.event_ids || [];
      const overlap = eventIds.filter(e => recordedEvents.includes(e));
      if (overlap.length > 0) {
        throw new Error(
          `You are already enrolled in team "${record.team_name}" (Code: ${record.team_code}) for one or more selected events.`
        );
      }
      recordedEvents.forEach(e => existingEventsSet.add(e));
    }

    if (existingEventsSet.size >= 2) {
      throw new Error(
        `Disqualification Rule: You are already enrolled in 2 events (${Array.from(existingEventsSet).join(', ')}). Maximum limit is strictly 2 events (2 means 2).`
      );
    }

    if (existingEventsSet.size + eventIds.length > 2) {
      throw new Error(
        `Disqualification Rule: You are already enrolled in ${existingEventsSet.size} event(s). Registering for ${eventIds.length} more event(s) exceeds the maximum limit of 2 events (2 means 2).`
      );
    }

    const cleanTeamName = teamName.trim();
    let createdTeams: any[] = [];

    if (eventIds.length === 2) {
      // 2 Events selected: Create 2 separate teams named "${teamName}-A" and "${teamName}-B"
      // Generate unique code for Team A
      let codeA = generateHumanFriendlyCode();
      while ((await sql`SELECT id FROM public.fest_teams WHERE code = ${codeA}`).length > 0) {
        codeA = generateHumanFriendlyCode();
      }
      const tokenA = crypto.randomUUID().replace(/-/g, '') + crypto.randomBytes(8).toString('hex');
      const nameA = `${cleanTeamName}-A`;

      const teamARows = await sql`
        INSERT INTO public.fest_teams (
          code,
          name,
          event_ids,
          leader_email,
          leader_token,
          is_locked,
          status
        ) VALUES (
          ${codeA},
          ${nameA},
          ARRAY[${eventIds[0]}],
          ${email},
          ${tokenA},
          FALSE,
          'Confirmed'
        )
        RETURNING id, code, name, event_ids, leader_token, created_at;
      `;
      const newTeamA = teamARows[0];

      // Leader registration in Team A
      await sql`
        INSERT INTO public.fest_registrations (
          team_id,
          team_code,
          is_leader,
          full_name,
          email,
          phone,
          college,
          department,
          year_of_study,
          college_id,
          reference_id,
          division,
          roll_no,
          status
        ) VALUES (
          ${newTeamA.id},
          ${newTeamA.code},
          TRUE,
          ${leader.fullName.trim()},
          ${email},
          ${phone},
          ${leader.college.trim()},
          ${leader.department.trim()},
          ${leader.yearOfStudy.trim()},
          ${referenceId},
          ${referenceId},
          ${division},
          ${rollNo},
          'Confirmed'
        );
      `;

      // Generate unique code for Team B
      let codeB = generateHumanFriendlyCode();
      while (codeB === codeA || (await sql`SELECT id FROM public.fest_teams WHERE code = ${codeB}`).length > 0) {
        codeB = generateHumanFriendlyCode();
      }
      const tokenB = crypto.randomUUID().replace(/-/g, '') + crypto.randomBytes(8).toString('hex');
      const nameB = `${cleanTeamName}-B`;

      const teamBRows = await sql`
        INSERT INTO public.fest_teams (
          code,
          name,
          event_ids,
          leader_email,
          leader_token,
          is_locked,
          status
        ) VALUES (
          ${codeB},
          ${nameB},
          ARRAY[${eventIds[1]}],
          ${email},
          ${tokenB},
          FALSE,
          'Confirmed'
        )
        RETURNING id, code, name, event_ids, leader_token, created_at;
      `;
      const newTeamB = teamBRows[0];

      // Leader registration in Team B
      await sql`
        INSERT INTO public.fest_registrations (
          team_id,
          team_code,
          is_leader,
          full_name,
          email,
          phone,
          college,
          department,
          year_of_study,
          college_id,
          reference_id,
          division,
          roll_no,
          status
        ) VALUES (
          ${newTeamB.id},
          ${newTeamB.code},
          TRUE,
          ${leader.fullName.trim()},
          ${email},
          ${phone},
          ${leader.college.trim()},
          ${leader.department.trim()},
          ${leader.yearOfStudy.trim()},
          ${referenceId},
          ${referenceId},
          ${division},
          ${rollNo},
          'Confirmed'
        );
      `;

      createdTeams = [
        {
          id: newTeamA.id,
          code: newTeamA.code,
          name: newTeamA.name,
          eventIds: newTeamA.event_ids,
          eventId: eventIds[0],
          leaderToken: newTeamA.leader_token,
        },
        {
          id: newTeamB.id,
          code: newTeamB.code,
          name: newTeamB.name,
          eventIds: newTeamB.event_ids,
          eventId: eventIds[1],
          leaderToken: newTeamB.leader_token,
        }
      ];
    } else {
      // 1 Event selected
      let uniqueCode = generateHumanFriendlyCode();
      while ((await sql`SELECT id FROM public.fest_teams WHERE code = ${uniqueCode}`).length > 0) {
        uniqueCode = generateHumanFriendlyCode();
      }
      const leaderToken = crypto.randomUUID().replace(/-/g, '') + crypto.randomBytes(8).toString('hex');

      const singleTeamRows = await sql`
        INSERT INTO public.fest_teams (
          code,
          name,
          event_ids,
          leader_email,
          leader_token,
          is_locked,
          status
        ) VALUES (
          ${uniqueCode},
          ${cleanTeamName},
          ARRAY[${eventIds[0]}],
          ${email},
          ${leaderToken},
          FALSE,
          'Confirmed'
        )
        RETURNING id, code, name, event_ids, leader_token, created_at;
      `;
      const newTeamSingle = singleTeamRows[0];

      await sql`
        INSERT INTO public.fest_registrations (
          team_id,
          team_code,
          is_leader,
          full_name,
          email,
          phone,
          college,
          department,
          year_of_study,
          college_id,
          reference_id,
          division,
          roll_no,
          status
        ) VALUES (
          ${newTeamSingle.id},
          ${newTeamSingle.code},
          TRUE,
          ${leader.fullName.trim()},
          ${email},
          ${phone},
          ${leader.college.trim()},
          ${leader.department.trim()},
          ${leader.yearOfStudy.trim()},
          ${referenceId},
          ${referenceId},
          ${division},
          ${rollNo},
          'Confirmed'
        );
      `;

      createdTeams = [
        {
          id: newTeamSingle.id,
          code: newTeamSingle.code,
          name: newTeamSingle.name,
          eventIds: newTeamSingle.event_ids,
          eventId: eventIds[0],
          leaderToken: newTeamSingle.leader_token,
        }
      ];
    }

    // Audit Log
    try {
      await sql`
        INSERT INTO public.audit_log (action, actor_email, target_type, details)
        VALUES (
          'fest_team_created',
          ${email},
          'fest_team',
          ${JSON.stringify({ teams: createdTeams.map(t => ({ code: t.code, name: t.name, events: t.eventIds })) })}::jsonb
        );
      `;
    } catch (e) {
      // non-fatal
    }

    // Provision user in auth & profiles for dashboard access
    const defaultPassword = 'TrainerPass2026!';
    try {
      const admin = createAdminClient();
      const { data: authUser } = await admin.auth.admin.createUser({
        email,
        password: defaultPassword,
        email_confirm: true,
        user_metadata: {
          full_name: leader.fullName.trim(),
          phone,
        },
      });

      const uid = authUser?.user?.id;
      if (uid) {
        const trainerId = 'TR-' + createdTeams[0].code.replace('JRV-', '');
        await sql`
          INSERT INTO public.profiles (id, trainer_id, full_name, email, role)
          VALUES (${uid}, ${trainerId}, ${leader.fullName.trim()}, ${email}, 'participant')
          ON CONFLICT (id) DO UPDATE SET full_name = EXCLUDED.full_name
        `;
      }
    } catch {
      // non-fatal if user already exists in auth
    }

    return {
      success: true,
      team: createdTeams[0],
      teams: createdTeams,
      credentials: {
        email,
        password: defaultPassword,
      },
    };
  } catch (err: any) {
    return {
      success: false,
      error: err.message || 'Failed to complete registration.',
    };
  }
}

// 2. Fetch Team Public Info by Code (for joiners)
export async function getFestTeamByCode(code: string) {
  try {
    const cleanCode = code.trim().toUpperCase();

    const teamRows = await sql`
      SELECT id, code, name, event_ids, is_locked, is_waitlist, status
      FROM public.fest_teams
      WHERE code = ${cleanCode}
    `;

    if (teamRows.length === 0) {
      return { success: false, error: 'No active team found with code ' + cleanCode };
    }

    const team = teamRows[0];

    // Fetch member count
    const memberCountRows = await sql`
      SELECT COUNT(*)::int as count FROM public.fest_registrations WHERE team_id = ${team.id}
    `;
    const memberCount = memberCountRows[0].count;

    // Determine max team size allowed across selected events
    const eventRows = await sql`
      SELECT max_team_size FROM public.fest_events WHERE id = ANY(${team.event_ids})
    `;
    const maxCapacity = eventRows.length > 0 
      ? Math.max(...eventRows.map((e: any) => e.max_team_size || 4))
      : 4;

    const remainingSlots = Math.max(0, maxCapacity - memberCount);

    return {
      success: true,
      team: {
        code: team.code,
        name: team.name,
        eventIds: team.event_ids,
        isLocked: team.is_locked || remainingSlots === 0,
        memberCount,
        maxCapacity,
        remainingSlots,
      },
    };
  } catch (err: any) {
    return { success: false, error: err.message || 'Error fetching team details.' };
  }
}

// 3. Join an existing team
export async function joinFestTeam(payload: {
  code: string;
  member: ParticipantInput;
  honeypot?: string;
}) {
  try {
    if (payload.honeypot && payload.honeypot.trim().length > 0) {
      throw new Error('Submission rejected.');
    }

    const cleanCode = payload.code.trim().toUpperCase();
    const teamRows = await sql`
      SELECT id, code, name, event_ids, is_locked FROM public.fest_teams WHERE code = ${cleanCode}
    `;

    if (teamRows.length === 0) {
      throw new Error('Invalid or expired team code. Please check and try again.');
    }

    const team = teamRows[0];

    // Immediate capacity and lock verification
    const currentMembers = await sql`
      SELECT COUNT(*)::int as count FROM public.fest_registrations WHERE team_id = ${team.id}
    `;
    const memberCount = currentMembers[0].count;

    const eventRows = await sql`
      SELECT max_team_size FROM public.fest_events WHERE id = ANY(${team.event_ids})
    `;
    const maxCapacity = eventRows.length > 0 
      ? Math.min(...eventRows.map((e: any) => e.max_team_size || 4))
      : 4;

    if (memberCount >= maxCapacity || team.is_locked) {
      if (!team.is_locked) {
        await sql`UPDATE public.fest_teams SET is_locked = TRUE WHERE id = ${team.id}`;
      }
      throw new Error(
        `Team Limit Reached: Squad "${team.name}" has already reached its maximum roster limit of ${maxCapacity} member(s). Registration is closed for this squad.`
      );
    }

    const member = payload.member;
    const email = member.email.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new Error('Please enter a valid email address.');
    }
    if (!email.endsWith('@slrtce.in')) {
      throw new Error('Only official SLRTCE institutional email addresses (@slrtce.in) are permitted.');
    }

    const phone = member.phone.trim().replace(/\D/g, '');
    if (phone.length !== 10) {
      throw new Error('Please enter a valid 10-digit WhatsApp/phone number (numbers only).');
    }

    const referenceId = (member.referenceId || member.collegeId || '').trim();
    if (!referenceId) {
      throw new Error('Reference ID (from your ID card) is required.');
    }
    const division = (member.division || '').trim().toUpperCase();
    if (!division) {
      throw new Error('Division is required.');
    }
    const rollNo = (member.rollNo || '').trim();
    if (!rollNo) {
      throw new Error('Roll Number is required.');
    }

    // 1. Strict duplicate account check: prevent registering twice with the same email
    const existingWithEmail = await sql`
      SELECT fr.email, ft.name as team_name, ft.code as team_code
      FROM public.fest_registrations fr
      JOIN public.fest_teams ft ON fr.team_id = ft.id
      WHERE LOWER(fr.email) = ${email}
    `;

    if (existingWithEmail.length > 0) {
      throw new Error(
        `Account already exists! A registration with email "${email}" is already enrolled under squad "${existingWithEmail[0].team_name}" (Code: ${existingWithEmail[0].team_code}). Please sign in to your dashboard.`
      );
    }


    const cleanRefId = (referenceId || '').trim().toLowerCase();
    const phone10 = phone.slice(-10);

    // Duplicate check for this member across email, phone, reference/college ID, and event limits
    const existing = await sql`
      SELECT fr.email, fr.phone, ft.name as team_name, ft.code as team_code, ft.event_ids
      FROM public.fest_registrations fr
      JOIN public.fest_teams ft ON fr.team_id = ft.id
      WHERE (
        LOWER(TRIM(fr.email)) = ${email}
        OR (${phone10.length >= 10} AND RIGHT(REGEXP_REPLACE(fr.phone, '\\D', '', 'g'), 10) = ${phone10})
        OR (${cleanRefId} != '' AND (
          LOWER(TRIM(COALESCE(fr.reference_id, ''))) = ${cleanRefId}
          OR LOWER(TRIM(COALESCE(fr.college_id, ''))) = ${cleanRefId}
        ))
      )
    `;

    const existingMemberEvents = new Set<string>();
    for (const record of existing) {
      const recordedEvents: string[] = record.event_ids || [];
      const overlap = team.event_ids.filter((e: string) => recordedEvents.includes(e));
      if (overlap.length > 0) {
        throw new Error(
          `You are already enrolled in team "${record.team_name}" (Code: ${record.team_code}) for this discipline.`
        );
      }
      recordedEvents.forEach((e: string) => existingMemberEvents.add(e));
    }

    if (existingMemberEvents.size >= 2) {
      throw new Error(
        `Disqualification Rule: You are already enrolled in 2 events (${Array.from(existingMemberEvents).join(', ')}). Maximum limit is strictly 2 events (2 means 2).`
      );
    }

    const combinedMemberEvents = new Set([...existingMemberEvents, ...team.event_ids]);
    if (combinedMemberEvents.size > 2) {
      throw new Error(
        `Disqualification Rule: A participant can participate in a maximum of 2 events. You are already enrolled in ${existingMemberEvents.size} event(s), and joining this squad (${team.event_ids.length} event(s)) exceeds the 2-event limit (2 means 2).`
      );
    }

    // Insert participant
    await sql`
      INSERT INTO public.fest_registrations (
        team_id,
        team_code,
        is_leader,
        full_name,
        email,
        phone,
        college,
        department,
        year_of_study,
        college_id,
        reference_id,
        division,
        roll_no,
        status
      ) VALUES (
        ${team.id},
        ${team.code},
        FALSE,
        ${member.fullName.trim()},
        ${email},
        ${phone},
        ${member.college.trim()},
        ${member.department.trim()},
        ${member.yearOfStudy.trim()},
        ${referenceId},
        ${referenceId},
        ${division},
        ${rollNo},
        'Confirmed'
      );
    `;

    // If new count hits max capacity, auto-lock
    if (memberCount + 1 >= maxCapacity) {
      await sql`UPDATE public.fest_teams SET is_locked = TRUE WHERE id = ${team.id}`;
    }

    // Provision user in auth & profiles for dashboard access
    const defaultPassword = 'TrainerPass2026!';
    try {
      const admin = createAdminClient();
      const { data: authUser } = await admin.auth.admin.createUser({
        email,
        password: defaultPassword,
        email_confirm: true,
        user_metadata: {
          full_name: member.fullName.trim(),
          phone,
        },
      });

      const uid = authUser?.user?.id;
      if (uid) {
        const trainerId = 'TR-' + team.code.replace('JRV-', '') + '-' + (memberCount + 1);
        await sql`
          INSERT INTO public.profiles (id, trainer_id, full_name, email, role)
          VALUES (${uid}, ${trainerId}, ${member.fullName.trim()}, ${email}, 'participant')
          ON CONFLICT (id) DO UPDATE SET full_name = EXCLUDED.full_name
        `;
      }
    } catch {
      // non-fatal
    }

    return {
      success: true,
      teamName: team.name,
      teamCode: team.code,
      credentials: {
        email,
        password: defaultPassword,
      },
    };
  } catch (err: any) {
    return {
      success: false,
      error: err.message || 'Unable to join team.',
    };
  }
}

// 4. Fetch Leader Team Details via secret token
export async function getLeaderTeamData(token: string) {
  try {
    const cleanToken = token.trim();
    const teamRows = await sql`
      SELECT id, code, name, event_ids, leader_email, leader_token, is_locked, is_waitlist, status, created_at
      FROM public.fest_teams
      WHERE leader_token = ${cleanToken} OR UPPER(code) = ${cleanToken.toUpperCase()}
    `;

    if (teamRows.length === 0) {
      return { success: false, error: 'Invalid or expired squad management link.' };
    }

    const team = teamRows[0];
    const isLeader = team.leader_token === cleanToken;

    const members = await sql`
      SELECT id, full_name, email, phone, college, department, year_of_study, college_id, is_leader, status, created_at
      FROM public.fest_registrations
      WHERE team_id = ${team.id}
      ORDER BY is_leader DESC, created_at ASC
    `;

    return {
      success: true,
      team,
      members,
      isLeader,
    };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to load team data.' };
  }
}

// 5. Leader Manage Team Actions (no password required)
export async function leaderManageTeam(payload: {
  token: string;
  action: 'rename' | 'regenerate_code' | 'remove_member' | 'lock' | 'unlock' | 'disband';
  newName?: string;
  memberId?: string;
}) {
  try {
    const cleanToken = payload.token.trim();
    const teamRows = await sql`
      SELECT id, code, name, is_locked FROM public.fest_teams WHERE leader_token = ${cleanToken}
    `;

    if (teamRows.length === 0) {
      throw new Error('Unauthorized or invalid team management token.');
    }

    const team = teamRows[0];

    switch (payload.action) {
      case 'rename': {
        if (!payload.newName || payload.newName.trim().length < 2) {
          throw new Error('New team name must be at least 2 characters.');
        }
        await sql`UPDATE public.fest_teams SET name = ${payload.newName.trim()}, updated_at = NOW() WHERE id = ${team.id}`;
        return { success: true, message: 'Team successfully renamed.' };
      }

      case 'regenerate_code': {
        const newCode = generateHumanFriendlyCode();
        await sql`
          UPDATE public.fest_teams SET code = ${newCode}, updated_at = NOW() WHERE id = ${team.id}
        `;
        await sql`
          UPDATE public.fest_registrations SET team_code = ${newCode} WHERE team_id = ${team.id}
        `;
        return { success: true, message: 'New team code generated: ' + newCode, newCode };
      }

      case 'remove_member': {
        if (!payload.memberId) throw new Error('Member ID required.');
        // Cannot remove leader
        const target = await sql`SELECT is_leader FROM public.fest_registrations WHERE id = ${payload.memberId} AND team_id = ${team.id}`;
        if (target.length === 0) throw new Error('Member not found in team.');
        if (target[0].is_leader) throw new Error('Team leader cannot be removed. You can disband the team instead.');

        await sql`DELETE FROM public.fest_registrations WHERE id = ${payload.memberId} AND team_id = ${team.id}`;
        // If team was locked due to size, unlock it
        await sql`UPDATE public.fest_teams SET is_locked = FALSE WHERE id = ${team.id}`;
        return { success: true, message: 'Member removed from team roster.' };
      }

      case 'lock': {
        await sql`UPDATE public.fest_teams SET is_locked = TRUE, updated_at = NOW() WHERE id = ${team.id}`;
        return { success: true, message: 'Team roster locked.' };
      }

      case 'unlock': {
        await sql`UPDATE public.fest_teams SET is_locked = FALSE, updated_at = NOW() WHERE id = ${team.id}`;
        return { success: true, message: 'Team roster unlocked.' };
      }

      case 'disband': {
        await sql`DELETE FROM public.fest_teams WHERE id = ${team.id}`;
        return { success: true, message: 'Team disbanded and all registrations cleared.' };
      }

      default:
        throw new Error('Invalid management action.');
    }
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to perform management action.' };
  }
}
