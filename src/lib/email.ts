import { Resend } from 'resend';
import nodemailer from 'nodemailer';

// Gmail SMTP configuration (100% Free, direct delivery to any email without domain restrictions)
export const GMAIL_USER = (process.env.GMAIL_USER || process.env.SMTP_USER || 'indigotechfest@gmail.com').trim();
export const GMAIL_APP_PASSWORD = (process.env.GMAIL_APP_PASSWORD || process.env.SMTP_PASS || 'talatmfbuydlrdfq').replace(/\s+/g, '');
export const isGmailSmtpConfigured = true;

// Resend configuration fallback
const RESEND_API_KEY = process.env.RESEND_API_KEY || 're_xxxxxxxxx';
export const RESEND_FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'Indigo Techfest <alert@indigotechfest.in>';
export const RESEND_FALLBACK_FROM = 'Indigo Techfest <onboarding@resend.dev>';
const APP_BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://jarivs-3-0-pokemon.vercel.app';

export const resend = new Resend(RESEND_API_KEY);

function getGmailTransporter() {
  const user = (process.env.GMAIL_USER || process.env.SMTP_USER || GMAIL_USER || 'indigotechfest@gmail.com').trim();
  const pass = (process.env.GMAIL_APP_PASSWORD || process.env.SMTP_PASS || GMAIL_APP_PASSWORD || 'talatmfbuydlrdfq').replace(/\s+/g, '');
  if (!user || !pass) return null;
  return nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
      user,
      pass,
    },
    tls: {
      rejectUnauthorized: true,
    },
  });
}

export interface SquadItem {
  teamName: string;
  teamCode: string;
  disciplineName: string;
  isWaitlist: boolean;
  leaderToken?: string;
}

/**
 * Minimalist & Aesthetic Pokémon-Themed Enrollment Status Template
 */
export function generateStatusEmailHtml(payload: {
  leaderName: string;
  teams: SquadItem[];
}): { subject: string; html: string } {
  const { leaderName, teams } = payload;
  const hasWaitlist = teams.some((t) => t.isWaitlist);
  const allWaitlist = teams.every((t) => t.isWaitlist);

  let subject = 'Indigo Tech Fest: Squad Enrollment Confirmation';
  if (allWaitlist) {
    subject = 'Indigo Tech Fest: Waitlist Queue Notice';
  } else if (hasWaitlist) {
    subject = 'Indigo Tech Fest: Squad Status Update (Confirmed + Waitlist)';
  }

  const teamsHtml = teams
    .map((t, idx) => {
      const isConfirmed = !t.isWaitlist;
      const accentColor = isConfirmed ? '#10B981' : '#F59E0B';
      const badgeBg = isConfirmed ? '#ECFDF5' : '#FFFBEB';
      const badgeBorder = isConfirmed ? '#A7F3D0' : '#FDE68A';
      const badgeText = isConfirmed ? '● CONFIRMED ENTRY · PRE-CAPACITY SLOT' : '⏳ STANDBY QUEUE · POST-CAPACITY WAITLIST';

      const manageUrl = t.leaderToken
        ? `${APP_BASE_URL}/team/manage/${t.leaderToken}`
        : `${APP_BASE_URL}/`;

      return `
      <div style="background: #ffffff; border: 1px solid #E2E8F0; border-radius: 14px; padding: 22px; margin-bottom: 18px; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);">
        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #F1F5F9; padding-bottom: 12px; margin-bottom: 14px;">
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 11px; font-weight: 800; letter-spacing: 1.2px; text-transform: uppercase; color: #EE1515;">
            ${teams.length > 1 ? `Discipline ${idx + 1}` : 'Tournament Discipline'}
          </div>
          <div style="background: ${badgeBg}; color: ${accentColor}; border: 1px solid ${badgeBorder}; padding: 3px 9px; font-family: monospace; font-size: 10px; font-weight: 700; border-radius: 9999px; letter-spacing: 0.5px;">
            ${badgeText}
          </div>
        </div>

        <h3 style="margin: 0 0 14px 0; font-size: 19px; color: #0F172A; font-weight: 800; letter-spacing: -0.3px;">
          ${t.disciplineName}
        </h3>

        <!-- Squad Details Table -->
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 16px; font-size: 13px;">
          <tr>
            <td style="color: #64748B; padding: 6px 0; font-weight: 500;">Squad Name</td>
            <td style="color: #0F172A; font-weight: 700; text-align: right; padding: 6px 0;">${t.teamName}</td>
          </tr>
          <tr>
            <td style="color: #64748B; padding: 6px 0; font-weight: 500;">Squad Join Code</td>
            <td style="text-align: right; padding: 6px 0;">
              <span style="font-family: monospace; font-weight: 800; font-size: 14px; background: #FEF2F2; color: #DC2626; padding: 3px 8px; border-radius: 6px; border: 1px solid #FECACA; letter-spacing: 1px;">
                ${t.teamCode}
              </span>
            </td>
          </tr>
          <tr>
            <td style="color: #64748B; padding: 6px 0; font-weight: 500;">Enrollment Bracket</td>
            <td style="color: ${accentColor}; font-weight: 700; text-align: right; padding: 6px 0;">
              ${isConfirmed ? '✓ Confirmed Slot (In-Capacity)' : 'Standby Queue (Capacity Overflow)'}
            </td>
          </tr>
        </table>

        <!-- Context Callout -->
        ${
          isConfirmed
            ? `
          <div style="background: #F0FDF4; border-radius: 10px; border: 1px solid #BBF7D0; padding: 12px 14px; font-size: 12px; color: #166534; line-height: 1.5; margin-bottom: 16px;">
            <strong>✓ Slot Locked:</strong> Your squad enrolled before event cap was reached. Your bracket placement is officially locked for festival day.
          </div>
        `
            : `
          <div style="background: #FFFBEB; border-radius: 10px; border: 1px solid #FDE68A; padding: 12px 14px; font-size: 12px; color: #92400E; line-height: 1.5; margin-bottom: 16px;">
            <strong>⏳ Waitlist Queue:</strong> This discipline hit maximum capacity prior to submission. Your squad is safely queued in the standby roster. If confirmed squads withdraw or brackets expand, teams are promoted in order of registration.
          </div>
        `
        }

        <!-- Manage Roster CTA -->
        <div style="text-align: center;">
          <a href="${manageUrl}" style="display: inline-block; background: #0F172A; color: #FFFFFF; text-decoration: none; padding: 10px 20px; font-size: 12px; font-weight: 700; border-radius: 8px; letter-spacing: 0.3px; transition: background 0.2s;">
            Open Squad Roster Terminal ➔
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
<body style="margin: 0; padding: 0; background-color: #F8FAFC; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; color: #0F172A; -webkit-font-smoothing: antialiased;">
  
  <div style="max-width: 580px; margin: 32px auto; padding: 0 16px;">
    
    <!-- POKEBALL ACCENT TOP BAR -->
    <div style="height: 5px; border-radius: 5px 5px 0 0; background: linear-gradient(90deg, #EE1515 0%, #EE1515 35%, #0F172A 35%, #0F172A 65%, #2563EB 65%, #2563EB 100%);"></div>

    <!-- HEADER: SLEEK MINIMAL POKEMON THEMED -->
    <div style="background: #0F172A; padding: 28px 24px 24px 24px; text-align: center; color: #FFFFFF;">
      
      <!-- Mini Pokéball Badge (Bulletproof Email HTML/CSS) -->
      <table align="center" border="0" cellpadding="0" cellspacing="0" style="margin: 0 auto 12px auto;">
        <tr>
          <td style="width: 32px; height: 32px; border-radius: 16px; background-color: #FFFFFF; border: 3px solid #0F172A; text-align: center; vertical-align: middle; overflow: hidden; padding: 0; box-sizing: border-box;">
            <div style="height: 13px; background-color: #EE1515; border-bottom: 2px solid #0F172A;"></div>
            <div style="height: 13px; background-color: #FFFFFF;"></div>
          </td>
        </tr>
      </table>

      <div style="font-family: monospace; font-size: 10px; letter-spacing: 2px; text-transform: uppercase; color: #94A3B8; font-weight: 700; margin-bottom: 6px;">
        Kanto League &bull; Indigo Plateau
      </div>
      <h1 style="margin: 0; font-size: 22px; font-weight: 900; letter-spacing: -0.5px; text-transform: uppercase; color: #FFFFFF;">
        INDIGO TECH FEST &bull; JARVIS 3.0
      </h1>
      <p style="margin: 6px 0 0 0; font-size: 12px; color: #94A3B8; font-family: monospace;">
        Official Squad Registration Telemetry
      </p>
    </div>

    <!-- MAIN BODY -->
    <div style="background: #FFFFFF; border: 1px solid #E2E8F0; border-top: none; padding: 24px 24px 20px 24px; border-radius: 0 0 14px 14px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); margin-bottom: 20px;">
      
      <p style="font-size: 15px; margin: 0 0 8px 0; color: #0F172A; font-weight: 600;">
        Greetings, <strong>${leaderName}</strong> 👋
      </p>
      <p style="font-size: 13px; line-height: 1.6; color: #475569; margin: 0;">
        Your squad telemetry for <strong>Indigo Tech Fest (Jarvis 3.0)</strong> has been logged into the festival ledger. Review your discipline allocation and capacity status below:
      </p>

      <div style="margin-top: 20px;">
        ${teamsHtml}
      </div>

      <!-- KEY INSTRUCTIONS -->
      <div style="background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 10px; padding: 16px; margin-top: 10px;">
        <div style="font-size: 12px; font-weight: 700; color: #0F172A; margin-bottom: 8px;">
          📌 Festival Check-In &amp; Instructions:
        </div>
        <ul style="margin: 0; padding-left: 18px; font-size: 12px; color: #475569; line-height: 1.6;">
          <li style="margin-bottom: 4px;">Share your <strong>Squad Code</strong> with teammates so they can join your official roster.</li>
          <li style="margin-bottom: 4px;">Check-in opens early on festival morning at the Registration Desk.</li>
          <li>All team members must carry valid college identification cards.</li>
        </ul>
      </div>

    </div>

    <!-- SUPPORT & CONTACT BLOCK (USER SPECIFIED) -->
    <div style="background: #FFFFFF; border: 1px solid #E2E8F0; border-radius: 14px; padding: 20px; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04); margin-bottom: 24px; text-align: center;">
      <div style="font-size: 11px; font-family: monospace; font-weight: 800; text-transform: uppercase; letter-spacing: 1.2px; color: #EE1515; margin-bottom: 6px;">
        Festival Helpdesk &amp; Support
      </div>
      <div style="font-size: 13px; font-weight: 700; color: #0F172A; margin-bottom: 12px;">
        For any query, contact:
      </div>
      
      <table style="width: 100%; border-collapse: collapse; max-width: 440px; margin: 0 auto; font-size: 12px;">
        <tr>
          <td style="padding: 6px 4px; text-align: center; width: 33.3%;">
            <div style="background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 8px; padding: 8px 6px;">
              <span style="display: block; font-size: 14px; margin-bottom: 2px;">⚡</span>
              <strong style="color: #0F172A; font-size: 11px;">Technical Coordinator</strong>
            </div>
          </td>
          <td style="padding: 6px 4px; text-align: center; width: 33.3%;">
            <div style="background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 8px; padding: 8px 6px;">
              <span style="display: block; font-size: 14px; margin-bottom: 2px;">👑</span>
              <strong style="color: #0F172A; font-size: 11px;">President</strong>
            </div>
          </td>
          <td style="padding: 6px 4px; text-align: center; width: 33.3%;">
            <div style="background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 8px; padding: 8px 6px;">
              <span style="display: block; font-size: 14px; margin-bottom: 2px;">🏛️</span>
              <strong style="color: #0F172A; font-size: 11px;">Takniki Desk</strong>
            </div>
          </td>
        </tr>
      </table>
    </div>

    <!-- MINIMALIST FOOTER -->
    <div style="text-align: center; font-size: 11px; color: #94A3B8; padding-bottom: 30px;">
      <p style="margin: 0 0 4px 0; font-weight: 500;">
        Indigo Tech Fest · Jarvis 3.0 · SLRTCE
      </p>
      <p style="margin: 0; font-family: monospace; font-size: 10px;">
        Official Dispatch via <a href="mailto:${GMAIL_USER}" style="color: #64748B; text-decoration: none;">${GMAIL_USER}</a>
      </p>
    </div>

  </div>
</body>
</html>
  `;

  return { subject, html };
}

/**
 * Minimalist & Aesthetic Pokémon-Themed Custom Broadcast Bulletin Template
 */
export function generateBroadcastEmailHtml(payload: {
  title: string;
  content: string;
  recipientName?: string;
}): { subject: string; html: string } {
  const { title, content, recipientName = 'Team Captain' } = payload;
  const subject = `[Indigo Tech Fest Notice] ${title}`;

  const formattedContent = content
    .split('\n')
    .filter((line) => line.trim().length > 0)
    .map((p) => `<p style="margin: 0 0 12px 0; font-size: 14px; line-height: 1.65; color: #334155;">${p}</p>`)
    .join('');

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${subject}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #F8FAFC; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; color: #0F172A; -webkit-font-smoothing: antialiased;">
  
  <div style="max-width: 580px; margin: 32px auto; padding: 0 16px;">
    
    <!-- POKEBALL ACCENT TOP BAR -->
    <div style="height: 5px; border-radius: 5px 5px 0 0; background: linear-gradient(90deg, #EE1515 0%, #EE1515 35%, #0F172A 35%, #0F172A 65%, #2563EB 65%, #2563EB 100%);"></div>

    <!-- HEADER -->
    <div style="background: #0F172A; padding: 26px 24px; text-align: center; color: #FFFFFF;">
      <div style="font-family: monospace; font-size: 10px; letter-spacing: 2px; text-transform: uppercase; color: #EF4444; font-weight: 700; margin-bottom: 6px;">
        ⚡ Official Festival Bulletin
      </div>
      <h1 style="margin: 0; font-size: 21px; font-weight: 900; letter-spacing: -0.4px; color: #FFFFFF;">
        INDIGO TECH FEST · JARVIS 3.0
      </h1>
      <p style="margin: 4px 0 0 0; font-size: 11px; color: #94A3B8; font-family: monospace;">
        Dispatch from Tournament Directorate
      </p>
    </div>

    <!-- MAIN BODY -->
    <div style="background: #FFFFFF; border: 1px solid #E2E8F0; border-top: none; padding: 26px 24px 22px 24px; border-radius: 0 0 14px 14px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); margin-bottom: 20px;">
      
      <div style="display: inline-block; background: #FEF2F2; color: #DC2626; border: 1px solid #FECACA; padding: 3px 10px; border-radius: 9999px; font-family: monospace; font-size: 10px; font-weight: 700; margin-bottom: 14px;">
        📢 ANNOUNCEMENT
      </div>

      <h2 style="margin: 0 0 16px 0; font-size: 19px; font-weight: 800; color: #0F172A; letter-spacing: -0.3px;">
        ${title}
      </h2>

      <div style="border-left: 3px solid #EE1515; padding-left: 16px; margin: 16px 0 20px 0;">
        ${formattedContent}
      </div>

      <div style="margin-top: 24px; text-align: center;">
        <a href="${APP_BASE_URL}" style="display: inline-block; background: #EE1515; color: #FFFFFF; text-decoration: none; padding: 11px 24px; font-size: 12px; font-weight: 700; border-radius: 8px; letter-spacing: 0.3px;">
          Visit Festival Portal ➔
        </a>
      </div>

    </div>

    <!-- SUPPORT & CONTACT BLOCK -->
    <div style="background: #FFFFFF; border: 1px solid #E2E8F0; border-radius: 14px; padding: 18px; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04); margin-bottom: 24px; text-align: center;">
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

    <!-- MINIMALIST FOOTER -->
    <div style="text-align: center; font-size: 11px; color: #94A3B8; padding-bottom: 30px;">
      <p style="margin: 0 0 4px 0; font-weight: 500;">
        Indigo Tech Fest · Jarvis 3.0 · SLRTCE
      </p>
      <p style="margin: 0; font-family: monospace; font-size: 10px;">
        Sent via <a href="mailto:${GMAIL_USER}" style="color: #64748B; text-decoration: none;">${GMAIL_USER}</a>
      </p>
    </div>

  </div>
</body>
</html>
  `;

  return { subject, html };
}

function htmlToPlainText(html: string): string {
  return html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<br\s*[\/]?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<\/div>/gi, '\n')
    .replace(/<\/h[1-6]>/gi, '\n\n')
    .replace(/<li[^>]*>/gi, '• ')
    .replace(/<\/li>/gi, '\n')
    .replace(/<a[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/gi, '$2 ($1)')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\n\s*\n\s*\n/g, '\n\n')
    .trim();
}

/**
 * Sends an email with smart sender handling:
 * Attempts Gmail SMTP (alert <indigotechfest@gmail.com>) first if configured.
 * If not configured or if sending fails, seamlessly falls back to Resend.
 */
async function sendWithSmartSender(options: {
  to: string;
  subject: string;
  html: string;
  text?: string;
}): Promise<{ success: boolean; id?: string; error?: string; senderUsed?: string }> {
  const cleanEmail = (options.to || '').trim().toLowerCase();
  if (!cleanEmail || !cleanEmail.includes('@')) {
    return { success: false, error: 'Invalid recipient email address.' };
  }

  // Priority 1: Gmail SMTP (Direct delivery to any email without domain restrictions)
  if (isGmailSmtpConfigured) {
    try {
      const transporter = getGmailTransporter();
      if (transporter) {
        const rawName = (process.env.GMAIL_FROM_NAME || '').trim();
        // If "alert", format as "Indigo Tech Fest Alert" so Gmail phishing heuristics don't flag a bare 'alert' from a freemail account
        const fromName = (!rawName || rawName.toLowerCase() === 'alert')
          ? 'Indigo Tech Fest Alert'
          : rawName;
        const senderString = `"${fromName}" <${GMAIL_USER}>`;
        
        // Strip spam-trigger emojis from subject lines for superior Gmail inbox placement
        const cleanSubject = options.subject
          .replace(/^[\s\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]+/u, '')
          .trim();

        const plainText = options.text || htmlToPlainText(options.html);

        const info = await transporter.sendMail({
          from: senderString,
          replyTo: senderString,
          to: cleanEmail,
          subject: cleanSubject || options.subject,
          text: plainText,
          html: options.html,
          headers: {
            'X-Priority': '3',
            'X-Mailer': 'Indigo Festival Telemetry',
            'X-Entity-Ref-ID': `${cleanEmail}-${Date.now()}`,
          },
        });

        return {
          success: true,
          id: info.messageId,
          senderUsed: senderString,
        };
      }
    } catch (smtpErr: any) {
      console.warn('[Gmail SMTP Warning] Dispatch failed, trying Resend fallback:', smtpErr.message);
      // Fall through to Resend
    }
  }

  // Priority 2: Resend using configured domain or fallback
  const primaryFrom = RESEND_FROM_EMAIL;
  try {
    const res = await resend.emails.send({
      from: primaryFrom,
      to: cleanEmail,
      subject: options.subject,
      html: options.html,
    });

    if (!res.error) {
      return { success: true, id: res.data?.id, senderUsed: primaryFrom };
    }

    // Check if error is unverified domain
    const isUnverifiedDomain =
      res.error.message?.includes('not verified') ||
      res.error.name === 'validation_error' ||
      (res.error as any).statusCode === 403;

    if (isUnverifiedDomain && (cleanEmail === 'ryankeshary@gmail.com' || cleanEmail === 'kesharyryan@gmail.com')) {
      const targetOwner = 'ryankeshary@gmail.com';
      console.warn(`[Resend Notice] Domain ${primaryFrom} not yet verified on Resend. Falling back to sandbox ${RESEND_FALLBACK_FROM} for owner test.`);
      const fallbackRes = await resend.emails.send({
        from: RESEND_FALLBACK_FROM,
        to: targetOwner,
        subject: options.subject,
        html: options.html,
      });

      if (!fallbackRes.error) {
        return { success: true, id: fallbackRes.data?.id, senderUsed: RESEND_FALLBACK_FROM };
      }
      return { success: false, error: fallbackRes.error.message };
    }

    if (isUnverifiedDomain) {
      return {
        success: false,
        error: `Domain "indigotechfest.in" is not verified in Resend. Please provide Gmail SMTP credentials (GMAIL_USER and GMAIL_APP_PASSWORD) in .env or verify indigotechfest.in at https://resend.com/domains so emails can reach external recipients like ${cleanEmail}.`,
      };
    }

    return { success: false, error: res.error.message };
  } catch (err: any) {
    return { success: false, error: err.message || 'Email dispatch failed.' };
  }
}

/**
 * Sends a status notification email to a team leader.
 */
export async function sendLeaderStatusEmail(payload: {
  leaderEmail: string;
  leaderName: string;
  teams: SquadItem[];
}): Promise<{ success: boolean; id?: string; error?: string; senderUsed?: string }> {
  try {
    const { subject, html } = generateStatusEmailHtml({
      leaderName: payload.leaderName || 'Team Captain',
      teams: payload.teams,
    });

    return await sendWithSmartSender({
      to: payload.leaderEmail,
      subject,
      html,
    });
  } catch (err: any) {
    console.error(`[Resend Error] Failed to send status to ${payload.leaderEmail}:`, err);
    return { success: false, error: err.message || 'Unknown error' };
  }
}

/**
 * Sends a custom broadcast announcement email to a leader.
 */
export async function sendLeaderCustomBroadcastEmail(payload: {
  leaderEmail: string;
  leaderName?: string;
  title: string;
  content: string;
}): Promise<{ success: boolean; id?: string; error?: string; senderUsed?: string }> {
  try {
    const { subject, html } = generateBroadcastEmailHtml({
      title: payload.title,
      content: payload.content,
      recipientName: payload.leaderName,
    });

    return await sendWithSmartSender({
      to: payload.leaderEmail,
      subject,
      html,
    });
  } catch (err: any) {
    console.error(`[Resend Error] Failed to broadcast to ${payload.leaderEmail}:`, err);
    return { success: false, error: err.message || 'Unknown error' };
  }
}
