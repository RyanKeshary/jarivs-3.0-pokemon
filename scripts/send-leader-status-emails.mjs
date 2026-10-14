import postgres from 'postgres';
import { Resend } from 'resend';
import fs from 'fs';
import path from 'path';

// Auto-load .env.local if present
try {
  const envPath = path.resolve(process.cwd(), '.env.local');
  if (fs.existsSync(envPath)) {
    const lines = fs.readFileSync(envPath, 'utf8').split('\n');
    for (const line of lines) {
      const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
      if (match) {
        const key = match[1];
        let value = (match[2] || '').trim();
        if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
        if (!process.env[key]) process.env[key] = value;
      }
    }
  }
} catch {}

const connectionString = process.env.DATABASE_URL || 'postgresql://postgres.oqqzzyombtcjvlqbjvla:golumolu1234$@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres';
const resendApiKey = process.env.RESEND_API_KEY || 're_xxxxxxxxx';
const fromEmail = process.env.RESEND_FROM_EMAIL || 'Indigo Techfest <alert@indigotechfest.in>';
const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://indigo-techfest.vercel.app';

const sql = postgres(connectionString, { ssl: 'require' });
const resend = new Resend(resendApiKey);

async function run() {
  console.log('--- INDIGO TECH FEST: TEAM LEADER STATUS EMAIL BROADCAST ---');
  console.log(`Using Resend API Key: ${resendApiKey.slice(0, 10)}...`);
  console.log(`From address: ${fromEmail}`);

  // Fetch events to get friendly names
  const events = await sql`SELECT id, name FROM public.fest_events`;
  const eventMap = new Map(events.map(e => [e.id, e.name]));

  // Fetch all teams with their leader details
  const teams = await sql`
    SELECT 
      ft.id,
      ft.code,
      ft.name,
      ft.event_ids,
      ft.leader_email,
      ft.leader_token,
      ft.is_waitlist,
      ft.status,
      ft.created_at,
      (SELECT fr.full_name FROM public.fest_registrations fr WHERE fr.team_id = ft.id AND fr.is_leader = true LIMIT 1) as leader_name
    FROM public.fest_teams ft
    ORDER BY ft.created_at ASC
  `;

  console.log(`Retrieved ${teams.length} total squads from database.`);

  // Group teams by leader email so leaders of 2 events get a single consolidated email
  const leaderMap = new Map();
  for (const t of teams) {
    const email = (t.leader_email || '').toLowerCase().trim();
    if (!email) continue;
    if (!leaderMap.has(email)) {
      leaderMap.set(email, {
        email,
        name: t.leader_name || 'Team Captain',
        teams: []
      });
    }
    const eventName = t.event_ids && t.event_ids.length > 0 ? (eventMap.get(t.event_ids[0]) || t.event_ids[0]) : 'Tournament Event';
    leaderMap.get(email).teams.push({
      teamName: t.name,
      teamCode: t.code,
      disciplineName: eventName,
      isWaitlist: Boolean(t.is_waitlist),
      status: t.status,
      leaderToken: t.leader_token
    });
  }

  console.log(`Found ${leaderMap.size} unique team leaders to notify.`);
  
  const waitlistCount = Array.from(leaderMap.values()).filter(l => l.teams.some(t => t.isWaitlist)).length;
  console.log(`- Confirmed leaders: ${leaderMap.size - waitlistCount}`);
  console.log(`- Waitlist leaders: ${waitlistCount}`);

  const targetArg = (process.argv[2] || '').trim().toLowerCase();
  let dispatchList = Array.from(leaderMap.entries());

  if (targetArg) {
    dispatchList = dispatchList.filter(([email]) => email.toLowerCase() === targetArg);
    console.log(`\n[FILTER ACTIVE] Targeting single email: ${targetArg} (${dispatchList.length} matching found)`);
    if (dispatchList.length === 0) {
      console.log(`Target ${targetArg} has no recorded teams in database. Dispatching preview demo template...`);
      dispatchList = [[
        targetArg,
        {
          email: targetArg,
          name: 'Demo Leader',
          teams: [
            {
              teamName: 'Demo Squad Alpha',
              teamCode: 'JRV-TEST',
              disciplineName: "Team Rocket's Pokéquest: Treasure Hunt",
              isWaitlist: false,
              status: 'Confirmed',
              leaderToken: 'demo-token'
            },
            {
              teamName: 'Demo Squad Beta',
              teamCode: 'JRV-WAIT',
              disciplineName: 'Buildasaur: Buildathon',
              isWaitlist: true,
              status: 'Waitlist',
              leaderToken: 'demo-token'
            }
          ]
        }
      ]];
    }
  }

  let successCount = 0;
  let failCount = 0;

  for (const [email, leader] of dispatchList) {
    const hasWaitlist = leader.teams.some(t => t.isWaitlist);
    const allWaitlist = leader.teams.every(t => t.isWaitlist);

    let subject = 'Indigo Tech Fest (Jarvis 3.0) — Squad Enrollment Confirmation';
    if (allWaitlist) {
      subject = 'Indigo Tech Fest (Jarvis 3.0) — Waitlist Queue Notice';
    } else if (hasWaitlist) {
      subject = 'Indigo Tech Fest (Jarvis 3.0) — Squad Status Update (Confirmed + Waitlist)';
    }

    const cardsHtml = leader.teams.map((t, idx) => {
      const isConfirmed = !t.isWaitlist;
      const statusColor = isConfirmed ? '#059669' : '#d97706';
      const statusBg = isConfirmed ? '#ecfdf5' : '#fffbeb';
      const statusBorder = isConfirmed ? '#a7f3d0' : '#fde68a';
      const badgeText = isConfirmed ? 'CONFIRMED · ENROLLED BEFORE LIMIT' : 'WAITLIST QUEUE · REGISTERED AFTER LIMIT';
      const manageUrl = t.leaderToken ? `${appUrl}/team/manage/${t.leaderToken}` : `${appUrl}/`;

      return `
        <div style="background: #ffffff; border: 2px solid #000000; box-shadow: 4px 4px 0px #000000; padding: 20px; margin-bottom: 20px;">
          <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #e5e5e5; padding-bottom: 10px; margin-bottom: 12px;">
            <span style="font-family: monospace; font-size: 11px; font-weight: bold; text-transform: uppercase; color: #D21319;">
              ${leader.teams.length > 1 ? `Discipline ${idx + 1}` : 'Tournament Discipline'}
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

          ${isConfirmed ? `
            <div style="background: #f0fdf4; border-left: 4px solid #10b981; padding: 10px 12px; margin-top: 14px; font-size: 12px; color: #065f46; line-height: 1.5;">
              <strong>Slot Confirmed:</strong> Your squad enrolled before discipline capacity was reached. Your roster slot is officially reserved for tournament day.
            </div>
          ` : `
            <div style="background: #fffbeb; border-left: 4px solid #f59e0b; padding: 10px 12px; margin-top: 14px; font-size: 12px; color: #92400e; line-height: 1.5;">
              <strong>Waitlist Standby:</strong> This discipline reached maximum team capacity prior to your registration. Your squad has been assigned to the Standby Waitlist Queue. If any confirmed team withdraws, forfeits, or organizers expand bracket capacity, waitlisted squads are promoted in order of registration. You can still manage your roster.
            </div>
          `}

          <div style="margin-top: 16px; text-align: center;">
            <a href="${manageUrl}" style="display: inline-block; background: #D21319; color: #ffffff; text-decoration: none; padding: 10px 20px; font-family: monospace; font-size: 12px; font-weight: bold; border: 2px solid #000000; box-shadow: 2px 2px 0px #000000;">
              Manage Squad Roster &amp; Team Details ➔
            </a>
          </div>
        </div>
      `;
    }).join('');

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
        Hello <strong>${leader.name}</strong>,
      </p>
      <p style="font-size: 13px; line-height: 1.6; color: #4b5563; margin: 0;">
        This email confirms your squad registration status for <strong>Indigo Tech Fest (Jarvis 3.0)</strong>. Review your competition disciplines and enrollment capacity status below:
      </p>
    </div>

    <!-- SQUADS LIST -->
    ${cardsHtml}

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

    <!-- SUPPORT & CONTACT BLOCK -->
    <div style="background: #ffffff; border: 1px solid #E2E8F0; border-radius: 12px; padding: 18px; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04); margin-bottom: 24px; text-align: center;">
      <div style="font-size: 11px; font-family: monospace; font-weight: 800; text-transform: uppercase; letter-spacing: 1.2px; color: #EE1515; margin-bottom: 4px;">
        Festival Helpdesk &amp; Support
      </div>
      <div style="font-size: 13px; font-weight: 700; color: #0F172A; margin-bottom: 12px;">
        For any query, contact:
      </div>
      <table style="width: 100%; border-collapse: collapse; max-width: 440px; margin: 0 auto; font-size: 12px;">
        <tr>
          <td style="padding: 4px; text-align: center; width: 33.3%;">
            <div style="background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 8px; padding: 8px 4px;">
              <span style="display: block; font-size: 13px;">⚡</span>
              <strong style="color: #0F172A; font-size: 11px;">Technical Coordinator</strong>
            </div>
          </td>
          <td style="padding: 4px; text-align: center; width: 33.3%;">
            <div style="background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 8px; padding: 8px 4px;">
              <span style="display: block; font-size: 13px;">👑</span>
              <strong style="color: #0F172A; font-size: 11px;">President</strong>
            </div>
          </td>
          <td style="padding: 4px; text-align: center; width: 33.3%;">
            <div style="background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 8px; padding: 8px 4px;">
              <span style="display: block; font-size: 13px;">🏛️</span>
              <strong style="color: #0F172A; font-size: 11px;">Takniki Desk</strong>
            </div>
          </td>
        </tr>
      </table>
    </div>

    <!-- FOOTER -->
    <div style="text-align: center; font-family: monospace; font-size: 11px; color: #6b7280; padding: 12px 0 30px 0;">
      <p style="margin: 0 0 4px 0;">Indigo Tech Fest · Jarvis 3.0 · Powered by Kanto League Protocol</p>
      <p style="margin: 0;">Portal: <a href="${appUrl}" style="color: #D21319; font-weight: bold;">${appUrl}</a> · Sent via alert@indigotechfest.in</p>
    </div>

  </div>
</body>
</html>
    `;

    try {
      let res = await resend.emails.send({
        from: fromEmail,
        to: email,
        subject,
        html
      });

      if (res.error && (res.error.message?.includes('not verified') || res.error?.statusCode === 403) && email === 'ryankeshary@gmail.com') {
        console.log(`[SANDBOX FALLBACK] indigotechfest.in awaiting DNS verification in Resend. Retrying preview to account owner with onboarding@resend.dev...`);
        res = await resend.emails.send({
          from: 'Indigo Techfest <onboarding@resend.dev>',
          to: email,
          subject,
          html
        });
      }

      if (res.error) {
        console.warn(`[FAILED] ${email}: ${res.error.message}`);
        failCount++;
      } else {
        console.log(`[SUCCESS] Email dispatched to ${email} (Resend ID: ${res.data?.id})`);
        successCount++;
      }
    } catch (err) {
      console.error(`[EXCEPTION] ${email}:`, err.message);
      failCount++;
    }

    // Small delay to respect Resend rate limit (10 emails/sec)
    await new Promise(r => setTimeout(r, 120));
  }

  console.log('\n--- BROADCAST SUMMARY ---');
  console.log(`Total Leaders: ${leaderMap.size}`);
  console.log(`Successfully sent: ${successCount}`);
  console.log(`Failed / Blocked: ${failCount}`);

  await sql.end();
}

run().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
