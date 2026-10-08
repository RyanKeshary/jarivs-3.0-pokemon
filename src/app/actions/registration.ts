'use server';

import { sql } from '@/lib/supabase/admin';
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

    // Email & Phone sanitization
    const email = leader.email.trim().toLowerCase();
    const phone = leader.phone.trim().replace(/[^0-9+]/g, '');

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new Error('Please enter a valid email address.');
    }

    if (phone.length < 10) {
      throw new Error('Please enter a valid contact phone or WhatsApp number.');
    }

    // Duplicate check and max 2 events per candidate rule across teams
    const existingParticipation = await sql`
      SELECT fr.full_name, fr.email, fr.phone, ft.name as team_name, ft.code as team_code, ft.event_ids
      FROM public.fest_registrations fr
      JOIN public.fest_teams ft ON fr.team_id = ft.id
      WHERE (LOWER(fr.email) = ${email} OR fr.phone = ${phone})
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

    if (existingEventsSet.size + eventIds.length > 2) {
      throw new Error(
        `Disqualification Rule: You are already enrolled in ${existingEventsSet.size} event(s). A participant can participate in a maximum of 2 events in total.`
      );
    }

    // Generate unique code
    let uniqueCode = generateHumanFriendlyCode();
    let codeExists = await sql`SELECT id FROM public.fest_teams WHERE code = ${uniqueCode}`;
    while (codeExists.length > 0) {
      uniqueCode = generateHumanFriendlyCode();
      codeExists = await sql`SELECT id FROM public.fest_teams WHERE code = ${uniqueCode}`;
    }

    // Generate secret magic link token for leader management
    const leaderToken = crypto.randomUUID().replace(/-/g, '') + crypto.randomBytes(8).toString('hex');

    // Insert Team
    const newTeamRows = await sql`
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
        ${teamName.trim()},
        ${eventIds},
        ${email},
        ${leaderToken},
        FALSE,
        'Confirmed'
      )
      RETURNING id, code, name, event_ids, leader_token, created_at;
    `;

    const newTeam = newTeamRows[0];

    // Insert Leader Registration
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
        status
      ) VALUES (
        ${newTeam.id},
        ${newTeam.code},
        TRUE,
        ${leader.fullName.trim()},
        ${email},
        ${phone},
        ${leader.college.trim()},
        ${leader.department.trim()},
        ${leader.yearOfStudy.trim()},
        ${leader.collegeId ? leader.collegeId.trim() : null},
        'Confirmed'
      );
    `;

    // Audit Log
    try {
      await sql`
        INSERT INTO public.audit_log (action, actor_email, target_type, details)
        VALUES (
          'fest_team_created',
          ${email},
          'fest_team',
          ${JSON.stringify({ code: newTeam.code, teamName: newTeam.name, events: eventIds })}::jsonb
        );
      `;
    } catch (e) {
      // non-fatal
    }

    return {
      success: true,
      team: {
        id: newTeam.id,
        code: newTeam.code,
        name: newTeam.name,
        eventIds: newTeam.event_ids,
        leaderToken: newTeam.leader_token,
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
      throw new Error('Invalid or expired team code.');
    }

    const team = teamRows[0];

    if (team.is_locked) {
      throw new Error('This squad roster has already been locked by the leader.');
    }

    const member = payload.member;
    const email = member.email.trim().toLowerCase();
    const phone = member.phone.trim().replace(/[^0-9+]/g, '');

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new Error('Please enter a valid email address.');
    }
    if (phone.length < 10) {
      throw new Error('Please enter a valid phone or WhatsApp number.');
    }

    // Capacity verification
    const currentMembers = await sql`
      SELECT COUNT(*)::int as count FROM public.fest_registrations WHERE team_id = ${team.id}
    `;
    const memberCount = currentMembers[0].count;

    const eventRows = await sql`
      SELECT max_team_size FROM public.fest_events WHERE id = ANY(${team.event_ids})
    `;
    const maxCapacity = eventRows.length > 0 
      ? Math.max(...eventRows.map((e: any) => e.max_team_size || 4))
      : 4;

    if (memberCount >= maxCapacity) {
      // Auto-lock team
      await sql`UPDATE public.fest_teams SET is_locked = TRUE WHERE id = ${team.id}`;
      throw new Error('This team has already reached its maximum allowed roster capacity.');
    }

    // Duplicate check for this member
    const existing = await sql`
      SELECT fr.email, fr.phone, ft.name as team_name, ft.code as team_code, ft.event_ids
      FROM public.fest_registrations fr
      JOIN public.fest_teams ft ON fr.team_id = ft.id
      WHERE (LOWER(fr.email) = ${email} OR fr.phone = ${phone})
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

    const combinedMemberEvents = new Set([...existingMemberEvents, ...team.event_ids]);
    if (combinedMemberEvents.size > 2) {
      throw new Error(
        `Disqualification Rule: A participant can participate in a maximum of 2 events. You are already enrolled in ${existingMemberEvents.size} event(s), and joining this squad (${team.event_ids.length} events) exceeds the 2-event limit.`
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
        ${member.collegeId ? member.collegeId.trim() : null},
        'Confirmed'
      );
    `;

    // If new count hits max capacity, auto-lock
    if (memberCount + 1 >= maxCapacity) {
      await sql`UPDATE public.fest_teams SET is_locked = TRUE WHERE id = ${team.id}`;
    }

    return {
      success: true,
      teamName: team.name,
      teamCode: team.code,
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
      WHERE leader_token = ${cleanToken}
    `;

    if (teamRows.length === 0) {
      return { success: false, error: 'Invalid or expired management link.' };
    }

    const team = teamRows[0];

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
