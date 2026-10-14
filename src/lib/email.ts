import { Resend } from 'resend';

// Resend API key loaded from environment variable (replace re_xxxxxxxxx with your real API key in .env.local)
const RESEND_API_KEY = process.env.RESEND_API_KEY || 're_xxxxxxxxx';
const RESEND_FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'Indigo Techfest <onboarding@resend.dev>';
const APP_BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://indigo-techfest.vercel.app';

export const resend = new Resend(RESEND_API_KEY);

export interface TeamStatusEmailPayload {
  to: string;
  leaderName: string;
  teamName: string;
  teamCode: string;
  disciplineName: string;
  isWaitlist: boolean;
  leaderToken?: string;
  waitlistPosition?: number;
}

export function generateStatusEmailHtml(payload: {
  leaderName: string;
  teams: Array<{
    teamName: string;
    teamCode: string;
    disciplineName: string;
    isWaitlist: boolean;
    leaderToken?: string;
  }>;
}): { subject: string; html: string } {
  const { leaderName, teams } = payload;
  const hasWaitlist = teams.some((t) => t.isWaitlist);
  const allWaitlist = teams.every((t) => t.isWaitlist);

  let subject = 'Indigo Tech Fest (Jarvis 3.0) — Squad Enrollment Confirmation';
  if (allWaitlist) {
    subject = 'Indigo Tech Fest (Jarvis 3.0) — Waitlist Queue Notice';
  } else if (hasWaitlist) {
    subject = 'Indigo Tech Fest (Jarvis 3.0) — Squad Status Update (Confirmed + Waitlist)';
  }

  const teamsHtml = teams
    .map((t, idx) => {
      const isConfirmed = !t.isWaitlist;
      const statusColor = isConfirmed ? '#059669' : '#d97706';
      const statusBg = isConfirmed ? '#ecfdf5' : '#fffbeb';
      const statusBorder = isConfirmed ? '#a7f3d0' : '#fde68a';
      const badgeText = isConfirmed ? 'CONFIRMED · ENROLLED BEFORE LIMIT' : 'WAITLIST QUEUE · REGISTERED AFTER LIMIT';

      const manageUrl = t.leaderToken
        ? `${APP_BASE_URL}/team/manage/${t.leaderToken}`
        : `${APP_BASE_URL}/`;

      return `
      <div style="background: #ffffff; border: 2px solid #000000; box-shadow: 4px 4px 0px #000000; padding: 20px; margin-bottom: 20px;">
        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #e5e5e5; padding-bottom: 10px; margin-bottom: 12px;">
          <span style="font-family: monospace; font-size: 11px; font-weight: bold; text-transform: uppercase; color: #D21319;">
            ${teams.length > 1 ? `Discipline ${idx + 1}` : 'Tournament Discipline'}
          </span>
          <span style="background: ${statusBg}; color: ${statusColor}; border: 1px solid ${statusBorder}; padding: 3px 8px; font-family: monospace; font-size: 10px; font-weight: bold; border-radius: 4px;">
            ${badgeText}
          </span>
        </div>

        <h3 style="margin: 0 0 8px 0; font-size: 18px; color: #111827; font-weight: 900;">
          ${t.disciplineName}
        </h3>

        <table style="width: 100%; border-collapse: collapse; margin-top: 10px; font-family: monospace; font-size: 13px;">
          <tr>
            <td style="color: #6b7280; padding: 4px 0;">Squad Name:</td>
            <td style="color: #111827; font-weight: bold; text-align: right; padding: 4px 0;">${t.teamName}</td>
          </tr>
          <tr>
            <td style="color: #6b7280; padding: 4px 0;">Squad Code:</td>
            <td style="color: #D21319; font-weight: 900; font-size: 16px; text-align: right; padding: 4px 0; letter-spacing: 1px;">${t.teamCode}</td>
          </tr>
          <tr>
            <td style="color: #6b7280; padding: 4px 0;">Enrollment Status:</td>
            <td style="color: ${statusColor}; font-weight: bold; text-align: right; padding: 4px 0;">
              ${isConfirmed ? '✓ Confirmed Slot' : '⏳ Standby Waitlist Queue'}
            </td>
          </tr>
        </table>

        ${
          isConfirmed
            ? `
          <div style="background: #f0fdf4; border-left: 4px solid #10b981; padding: 10px 12px; margin-top: 14px; font-size: 12px; color: #065f46; line-height: 1.5;">
            <strong>Slot Confirmed:</strong> Your team registered before event capacity was reached. Your roster slot is officially reserved for competition day.
          </div>
        `
            : `
          <div style="background: #fffbeb; border-left: 4px solid #f59e0b; padding: 10px 12px; margin-top: 14px; font-size: 12px; color: #92400e; line-height: 1.5;">
            <strong>Waitlist Notice:</strong> This discipline reached maximum team capacity prior to your registration. Your squad has been assigned to the Standby Waitlist Queue. If a confirmed team withdraws or event organizers expand bracket capacity, waitlisted squads are promoted in order of registration. You can still manage your roster.
          </div>
        `
        }

        <div style="margin-top: 16px; text-align: center;">
          <a href="${manageUrl}" style="display: inline-block; background: #D21319; color: #ffffff; text-decoration: none; padding: 10px 20px; font-family: monospace; font-size: 12px; font-weight: bold; border: 2px solid #000000; box-shadow: 2px 2px 0px #000000;">
            Manage Squad Roster &amp; Team Details ➔
          </a>
        </div>
      </div>
    `;
    })
    .join('');

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${subject}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #FAF9F5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #111827;">
  <div style="max-width: 600px; margin: 30px auto; padding: 0 16px;">
    
    <!-- HEADER -->
    <div style="background: #111827; border: 2px solid #000000; box-shadow: 4px 4px 0px #000000; padding: 24px; text-align: center; color: #ffffff;">
      <div style="font-family: monospace; font-size: 11px; letter-spacing: 2px; text-transform: uppercase; color: #ef4444; font-weight: bold; margin-bottom: 6px;">
        Kanto League · Indigo Plateau
      </div>
      <h1 style="margin: 0; font-size: 24px; font-weight: 900; letter-spacing: -0.5px; text-transform: uppercase;">
        INDIGO TECH FEST · JARVIS 3.0
      </h1>
      <p style="margin: 6px 0 0 0; font-family: monospace; font-size: 12px; color: #9ca3af;">
        Official Squad Registration Telemetry
      </p>
    </div>

    <!-- SALUTATION -->
    <div style="background: #ffffff; border: 2px solid #000000; border-top: none; padding: 20px 24px 12px 24px; box-shadow: 4px 4px 0px #000000; margin-bottom: 20px;">
      <p style="font-size: 15px; margin: 0 0 10px 0;">
        Hello <strong>${leaderName}</strong>,
      </p>
      <p style="font-size: 13px; line-height: 1.6; color: #4b5563; margin: 0;">
        This email confirms your squad registration status for <strong>Indigo Tech Fest (Jarvis 3.0)</strong>. Review your competition disciplines and enrollment capacity status below:
      </p>
    </div>

    <!-- SQUADS LIST -->
    ${teamsHtml}

    <!-- IMPORTANT GUIDELINES -->
    <div style="background: #ffffff; border: 2px solid #000000; box-shadow: 4px 4px 0px #000000; padding: 20px; font-size: 12px; color: #4b5563; line-height: 1.6; margin-bottom: 24px;">
      <div style="font-family: monospace; font-weight: bold; color: #111827; font-size: 13px; margin-bottom: 8px;">
        📌 Important Guidelines for Team Leaders:
      </div>
      <ul style="margin: 0; padding-left: 18px;">
        <li style="margin-bottom: 6px;">Share your <strong>Squad Join Code</strong> with your teammates so they can register their details into your roster.</li>
        <li style="margin-bottom: 6px;">Check-in opens on festival morning at the Registration Desk using your Squad Code.</li>
        <li style="margin-bottom: 6px;">Ensure all team members carry valid college identification cards.</li>
        <li>For any disputes or queries, contact the coordinator listed in your event rules ledger.</li>
      </ul>
    </div>

    <!-- FOOTER -->
    <div style="text-align: center; font-family: monospace; font-size: 11px; color: #6b7280; padding: 12px 0 30px 0;">
      <p style="margin: 0 0 4px 0;">Indigo Tech Fest · Jarvis 3.0 · Powered by Kanto League Protocol</p>
      <p style="margin: 0;">Portal: <a href="${APP_BASE_URL}" style="color: #D21319; font-weight: bold;">${APP_BASE_URL}</a></p>
    </div>

  </div>
</body>
</html>
  `;

  return { subject, html };
}

/**
 * Sends a status notification email to a team leader.
 * Safely catches and returns error info without crashing the caller.
 */
export async function sendLeaderStatusEmail(payload: {
  leaderEmail: string;
  leaderName: string;
  teams: Array<{
    teamName: string;
    teamCode: string;
    disciplineName: string;
    isWaitlist: boolean;
    leaderToken?: string;
  }>;
}): Promise<{ success: boolean; id?: string; error?: string }> {
  try {
    const cleanEmail = (payload.leaderEmail || '').trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      return { success: false, error: 'Invalid recipient email address.' };
    }

    const { subject, html } = generateStatusEmailHtml({
      leaderName: payload.leaderName || 'Team Captain',
      teams: payload.teams,
    });

    const response = await resend.emails.send({
      from: RESEND_FROM_EMAIL,
      to: cleanEmail,
      subject,
      html,
    });

    if (response.error) {
      console.warn(`[Resend Error] Failed to send email to ${cleanEmail}:`, response.error);
      return { success: false, error: response.error.message };
    }

    return { success: true, id: response.data?.id };
  } catch (err: any) {
    console.error(`[Resend Exception] Error sending to ${payload.leaderEmail}:`, err);
    return { success: false, error: err.message || 'Unknown email sending failure.' };
  }
}
