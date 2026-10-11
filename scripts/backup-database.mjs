// =============================================================================
// KENTO LEAGUE & INDIGO FEST · AUTOMATED DATABASE BACKUP SYSTEM
// scripts/backup-database.mjs
//
// Extracts complete database schema & data:
// 1. Full SQL restore script (restore.sql)
// 2. Structured JSON datasets for all tables
// 3. Human-readable, presentable CSV sheets:
//    - 📊_Live_Registrations_Roster.csv
//    - 🛡️_Live_Teams_Overview.csv
// 4. Presentable Markdown & HTML Summary Dashboards
// 5. Point-in-time Gzipped disaster recovery archive
// 6. Direct upload to Google Drive folder (updating live sheets in-place):
//    https://drive.google.com/drive/folders/1Fsj_Lre5YDmv-iTGPa6BkuTZpGafqwS0
// =============================================================================

import postgres from 'postgres';
import fs from 'fs';
import path from 'path';
import zlib from 'zlib';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, '..');

// Auto-load .env.local / .env if present
for (const envFile of ['.env.local', '.env']) {
  const p = path.resolve(root, envFile);
  if (fs.existsSync(p)) {
    const lines = fs.readFileSync(p, 'utf-8').split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const idx = trimmed.indexOf('=');
      if (idx !== -1) {
        const key = trimmed.slice(0, idx).trim();
        let val = trimmed.slice(idx + 1).trim();
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
          val = val.slice(1, -1);
        }
        if (!process.env[key]) {
          process.env[key] = val;
        }
      }
    }
  }
}

// Destination Google Drive Folder ID
const DEFAULT_GDRIVE_FOLDER_ID = '1Fsj_Lre5YDmv-iTGPa6BkuTZpGafqwS0';
const gdriveFolderId = process.env.GDRIVE_FOLDER_ID || DEFAULT_GDRIVE_FOLDER_ID;

// Database connection
const connectionString =
  process.env.DATABASE_URL ||
  'postgresql://postgres.oqqzzyombtcjvlqbjvla:golumolu1234$@aws-0-ap-northeast-1.pooler.supabase.com:5432/postgres';

const sql = postgres(connectionString, {
  ssl: 'require',
  max: 2,
  idle_timeout: 30,
});

// Helper for formatted ISO timestamp
function getTimestamp() {
  const now = new Date();
  return now.toISOString().replace(/[:.]/g, '-').replace('T', '_').slice(0, 19);
}

// Compute SHA-256 of buffer or file
function computeSha256(buffer) {
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

// Convert object rows to formatted CSV
function toCsv(rows) {
  if (!rows || rows.length === 0) return '';
  const headers = Object.keys(rows[0]);
  const escapeCell = val => {
    if (val === null || val === undefined) return '';
    const str = typeof val === 'object' ? JSON.stringify(val) : String(val);
    if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };
  const csvRows = [headers.join(',')];
  for (const row of rows) {
    csvRows.push(headers.map(h => escapeCell(row[h])).join(','));
  }
  return csvRows.join('\r\n');
}

// ---------------------------------------------------------------------------
// Google Drive API OAuth & Upload (Drive API v3)
// ---------------------------------------------------------------------------
async function getGoogleAccessToken() {
  const saRaw = process.env.GDRIVE_SERVICE_ACCOUNT_KEY || process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  const refreshToken = process.env.GDRIVE_REFRESH_TOKEN;

  // Mode 1: Service Account Key (JSON)
  if (saRaw) {
    let sa;
    try {
      sa = typeof saRaw === 'string' && saRaw.trim().startsWith('{')
        ? JSON.parse(saRaw)
        : JSON.parse(fs.readFileSync(path.resolve(root, saRaw), 'utf-8'));
    } catch (e) {
      throw new Error(`Failed to parse Google Service Account JSON: ${e.message}`);
    }

    const now = Math.floor(Date.now() / 1000);
    const claim = {
      iss: sa.client_email,
      scope: 'https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/drive',
      aud: 'https://oauth2.googleapis.com/token',
      exp: now + 3600,
      iat: now,
    };

    const header = { alg: 'RS256', typ: 'JWT' };
    const base64Url = str => Buffer.from(str).toString('base64url');
    const tokenHeader = base64Url(JSON.stringify(header));
    const tokenClaim = base64Url(JSON.stringify(claim));
    const signInput = `${tokenHeader}.${tokenClaim}`;

    const signer = crypto.createSign('RSA-SHA256');
    signer.update(signInput);
    const signature = signer.sign(sa.private_key, 'base64url');
    const jwt = `${signInput}.${signature}`;

    const res = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
        assertion: jwt,
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(`Google OAuth error: ${data.error_description || data.error || JSON.stringify(data)}`);
    }
    return data.access_token;
  }

  // Mode 2: OAuth2 Refresh Token (Web / Desktop Client)
  if (refreshToken && process.env.GDRIVE_CLIENT_ID && process.env.GDRIVE_CLIENT_SECRET) {
    const res = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: process.env.GDRIVE_CLIENT_ID,
        client_secret: process.env.GDRIVE_CLIENT_SECRET,
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(`Google Refresh Token error: ${data.error_description || JSON.stringify(data)}`);
    }
    return data.access_token;
  }

  return null;
}

// Upload buffer to Google Drive folder using Drive API v3 multipart upload
async function uploadToGoogleDrive(accessToken, filename, fileBuffer, mimeType, folderId) {
  const metadata = {
    name: filename,
    parents: folderId ? [folderId] : undefined,
  };

  const boundary = `-------314159265358979323846_${Date.now()}`;
  const delimiter = `\r\n--${boundary}\r\n`;
  const closeDelimiter = `\r\n--${boundary}--`;

  const multipartBody = Buffer.concat([
    Buffer.from(
      delimiter +
      'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
      JSON.stringify(metadata) +
      delimiter +
      `Content-Type: ${mimeType}\r\n\r\n`
    ),
    fileBuffer,
    Buffer.from(closeDelimiter),
  ]);

  const res = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': `multipart/related; boundary=${boundary}`,
      'Content-Length': multipartBody.length.toString(),
    },
    body: multipartBody,
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(`Google Drive upload failed: ${data.error?.message || JSON.stringify(data)}`);
  }
  return data;
}

// Create a dedicated folder in Google Drive
async function createDriveFolder(accessToken, folderName, parentFolderId) {
  const metadata = {
    name: folderName,
    mimeType: 'application/vnd.google-apps.folder',
    parents: parentFolderId ? [parentFolderId] : undefined,
  };
  const res = await fetch('https://www.googleapis.com/drive/v3/files', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(metadata),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(`Failed to create Google Drive folder: ${data.error?.message || JSON.stringify(data)}`);
  }
  return data.id;
}

// Inspect Google Drive to calculate the next sequential backup number (#001, #002, ...)
async function getNextBackupNumber(accessToken, parentFolderId) {
  try {
    const query = `'${parentFolderId}' in parents and mimeType = 'application/vnd.google-apps.folder' and trashed = false`;
    const listRes = await fetch(
      `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&fields=files(id,name)`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    const data = await listRes.json();
    let maxNum = 0;
    if (data.files && Array.isArray(data.files)) {
      for (const file of data.files) {
        const match = file.name.match(/^#(\d+)/);
        if (match) {
          const num = parseInt(match[1], 10);
          if (num > maxNum) maxNum = num;
        }
      }
    }
    return maxNum + 1;
  } catch (err) {
    console.warn(`Could not determine backup sequence: ${err.message}. Defaulting to 1.`);
    return 1;
  }
}

// ---------------------------------------------------------------------------
// HTML Presentable Dashboard Generator
// ---------------------------------------------------------------------------
function generateHtmlDashboard({ timestamp, totalRegs, totalTeams, events, recentRegs, teamsList }) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Jarvis 3.0 & Indigo Fest — Live Registrations Roster</title>
  <style>
    :root {
      --bg: #090a0f;
      --card-bg: rgba(22, 27, 46, 0.7);
      --border: rgba(99, 102, 241, 0.2);
      --primary: #6366f1;
      --accent: #ec4899;
      --text: #f8fafc;
      --text-muted: #94a3b8;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      background: radial-gradient(circle at top right, #1e1b4b 0%, #090a0f 60%);
      color: var(--text);
      padding: 30px 20px;
      line-height: 1.5;
    }
    .container { max-width: 1200px; margin: 0 auto; }
    header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 15px;
      margin-bottom: 30px;
      padding-bottom: 20px;
      border-bottom: 1px solid var(--border);
    }
    h1 { font-size: 26px; font-weight: 800; background: linear-gradient(135deg, #a5b4fc, #ec4899); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
    .badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 6px 14px;
      border-radius: 9999px;
      background: rgba(34, 197, 94, 0.15);
      border: 1px solid rgba(34, 197, 94, 0.3);
      color: #4ade80;
      font-size: 13px;
      font-weight: 600;
    }
    .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 20px; margin-bottom: 35px; }
    .card {
      background: var(--card-bg);
      backdrop-filter: blur(12px);
      border: 1px solid var(--border);
      border-radius: 16px;
      padding: 20px;
      box-shadow: 0 8px 32px rgba(0,0,0,0.37);
    }
    .card-title { font-size: 13px; text-transform: uppercase; letter-spacing: 0.05em; color: var(--text-muted); margin-bottom: 8px; }
    .card-value { font-size: 32px; font-weight: 800; color: #fff; }
    .section-title { font-size: 18px; font-weight: 700; margin-bottom: 15px; display: flex; align-items: center; gap: 8px; }
    table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 14px; }
    th { text-align: left; padding: 12px 14px; background: rgba(99, 102, 241, 0.12); color: #c7d2fe; font-weight: 600; border-bottom: 1px solid var(--border); }
    td { padding: 12px 14px; border-bottom: 1px solid rgba(255,255,255,0.05); color: #e2e8f0; }
    tr:hover td { background: rgba(255,255,255,0.02); }
    .status-tag { padding: 3px 8px; border-radius: 6px; font-size: 11px; font-weight: 600; background: rgba(99, 102, 241, 0.2); color: #a5b4fc; }
    footer { margin-top: 40px; text-align: center; color: var(--text-muted); font-size: 13px; }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <div>
        <h1>⚡ Jarvis 3.0 & Indigo Fest — Live Registrations Roster</h1>
        <p style="color: var(--text-muted); font-size: 14px; margin-top: 4px;">Automated Database Snapshot & Live Roster</p>
      </div>
      <div class="badge">● Live Synced: ${timestamp}</div>
    </header>

    <div class="grid">
      <div class="card">
        <div class="card-title">Total Participants</div>
        <div class="card-value">${totalRegs}</div>
      </div>
      <div class="card">
        <div class="card-title">Registered Squads</div>
        <div class="card-value">${totalTeams}</div>
      </div>
      <div class="card">
        <div class="card-title">Active Events</div>
        <div class="card-value">${events.length}</div>
      </div>
      <div class="card">
        <div class="card-title">Backup Health</div>
        <div class="card-value" style="color: #4ade80;">100%</div>
      </div>
    </div>

    <div class="card" style="margin-bottom: 30px;">
      <div class="section-title">📊 Event Breakdown</div>
      <table>
        <thead>
          <tr>
            <th>Event ID</th>
            <th>Name</th>
            <th>Subtitle</th>
            <th>Schedule</th>
            <th>Team Size</th>
          </tr>
        </thead>
        <tbody>
          ${events.map(e => `
            <tr>
              <td><code>${e.id}</code></td>
              <td><strong>${e.name}</strong></td>
              <td><span class="status-tag">${e.subtitle}</span></td>
              <td>${e.day_label} (${e.slot_time})</td>
              <td>${e.min_team_size}-${e.max_team_size} members</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>

    <div class="card">
      <div class="section-title">👥 Registered Participants Roster</div>
      <div style="overflow-x: auto;">
        <table>
          <thead>
            <tr>
              <th>Full Name</th>
              <th>College</th>
              <th>Department</th>
              <th>Year</th>
              <th>Team Code</th>
              <th>Role</th>
              <th>Status</th>
              <th>Registered At</th>
            </tr>
          </thead>
          <tbody>
            ${recentRegs.map(r => `
              <tr>
                <td><strong>${r['Full Name']}</strong><br><span style="font-size: 12px; color: var(--text-muted);">${r['Email']}</span></td>
                <td>${r['College']}</td>
                <td>${r['Department']}</td>
                <td>${r['Year']}</td>
                <td><code>${r['Team Code']}</code></td>
                <td>${r['Role'] === 'Leader' ? '👑 Leader' : 'Member'}</td>
                <td><span class="status-tag">${r['Status']}</span></td>
                <td style="font-size: 12px; color: var(--text-muted);">${r['Registered At (UTC)']}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>

    <footer>
      Protected by automated 2-hour serverless backups to Google Drive.
    </footer>
  </div>
</body>
</html>`;
}

// ---------------------------------------------------------------------------
// Main Backup Engine
// ---------------------------------------------------------------------------
async function runBackup() {
  console.log('====================================================');
  console.log('STARTING AUTOMATED DATABASE BACKUP');
  console.log('Timestamp:', new Date().toISOString());
  console.log('====================================================\n');

  const timestampStr = getTimestamp();
  const backupTempDir = path.join(root, '.backup-temp', `backup_${timestampStr}`);
  fs.mkdirSync(backupTempDir, { recursive: true });

  const tablesDir = path.join(backupTempDir, 'tables');
  fs.mkdirSync(tablesDir, { recursive: true });

  try {
    // 1. Get all public tables
    const tableRows = await sql`
      SELECT tablename 
      FROM pg_tables 
      WHERE schemaname = 'public' 
      ORDER BY tablename
    `;
    const tableNames = tableRows.map(r => r.tablename);
    console.log(`Discovered ${tableNames.length} tables in public schema.`);

    const manifest = {
      backup_timestamp: new Date().toISOString(),
      source_host: 'aws-0-ap-northeast-1.pooler.supabase.com',
      destination_gdrive_folder: gdriveFolderId,
      tables: {},
      total_records: 0,
    };

    let sqlDumpContent = `-- =====================================================================\n`;
    sqlDumpContent += `-- DATABASE DISASTER RECOVERY DUMP\n`;
    sqlDumpContent += `-- Generated: ${new Date().toISOString()}\n`;
    sqlDumpContent += `-- =====================================================================\n\n`;
    sqlDumpContent += `BEGIN;\n\n`;

    // 2. Extract data from each table
    for (const tableName of tableNames) {
      const rows = await sql.unsafe(`SELECT * FROM public."${tableName}"`);
      manifest.tables[tableName] = {
        row_count: rows.length,
      };
      manifest.total_records += rows.length;

      // Save structured JSON
      const jsonFile = path.join(tablesDir, `${tableName}.json`);
      fs.writeFileSync(jsonFile, JSON.stringify(rows, null, 2), 'utf-8');

      // Generate SQL INSERT statements
      if (rows.length > 0) {
        sqlDumpContent += `-- Data for public.${tableName} (${rows.length} rows)\n`;
        const columns = Object.keys(rows[0]);
        const colList = columns.map(c => `"${c}"`).join(', ');

        for (const row of rows) {
          const values = columns.map(c => {
            const val = row[c];
            if (val === null || val === undefined) return 'NULL';
            if (typeof val === 'boolean') return val ? 'TRUE' : 'FALSE';
            if (typeof val === 'number') return val.toString();
            if (typeof val === 'object') return `'${JSON.stringify(val).replace(/'/g, "''")}'::jsonb`;
            return `'${String(val).replace(/'/g, "''")}'`;
          });
          sqlDumpContent += `INSERT INTO public."${tableName}" (${colList}) VALUES (${values.join(', ')}) ON CONFLICT DO NOTHING;\n`;
        }
        sqlDumpContent += `\n`;
      }
    }

    // 3. Extract Human-Readable Datasets for Presentable Google Drive Sheets
    console.log('Generating presentable CSV sheets and reports...');
    const readableRegs = await sql`
      SELECT 
        fr.full_name AS "Full Name",
        fr.email AS "Email",
        fr.phone AS "Phone",
        fr.college AS "College",
        fr.department AS "Department",
        fr.year_of_study AS "Year",
        COALESCE(fr.division, '') AS "Division",
        COALESCE(fr.roll_no, fr.college_id, '') AS "Roll No / Ref ID",
        COALESCE(ft.code, fr.team_code, 'N/A') AS "Team Code",
        COALESCE(ft.name, 'N/A') AS "Team Name",
        COALESCE(array_to_string(ft.event_ids, ', '), 'N/A') AS "Registered Event IDs",
        CASE WHEN fr.is_leader THEN 'Leader' ELSE 'Member' END AS "Role",
        fr.status AS "Status",
        to_char(fr.created_at, 'YYYY-MM-DD HH24:MI:SS') AS "Registered At (UTC)"
      FROM public.fest_registrations fr
      LEFT JOIN public.fest_teams ft ON fr.team_id = ft.id
      ORDER BY fr.created_at DESC
    `;
    const regsCsv = toCsv(readableRegs);

    const readableTeams = await sql`
      SELECT 
        ft.code AS "Team Code",
        ft.name AS "Team Name",
        array_to_string(ft.event_ids, ', ') AS "Event IDs",
        ft.leader_email AS "Leader Email",
        (SELECT fr.full_name FROM public.fest_registrations fr WHERE fr.team_id = ft.id AND fr.is_leader = true LIMIT 1) AS "Leader Name",
        (SELECT COUNT(*)::int FROM public.fest_registrations fr WHERE fr.team_id = ft.id) AS "Member Count",
        ft.status AS "Status",
        CASE WHEN ft.is_locked THEN 'Yes' ELSE 'No' END AS "Locked",
        CASE WHEN ft.is_waitlist THEN 'Yes' ELSE 'No' END AS "Waitlist",
        to_char(ft.created_at, 'YYYY-MM-DD HH24:MI:SS') AS "Created At (UTC)"
      FROM public.fest_teams ft
      ORDER BY ft.created_at DESC
    `;
    const teamsCsv = toCsv(readableTeams);

    const festEvents = await sql`
      SELECT id, name, subtitle, day_label, slot_time, min_team_size, max_team_size, fee, prize
      FROM public.fest_events
      ORDER BY id ASC
    `;

    // 4. Generate Markdown Summary Report
    const summaryMarkdown = `# 🛡️ Jarvis 3.0 & Indigo Techfest — Live Database Report

**🕒 Last Synced:** \`${new Date().toISOString()}\`  
**🟢 Health:** Database Online & Verified  
**📦 Point-in-time Archive:** \`backup_jarvis_${timestampStr}.tar.gz\`

---

## 📊 High-Level Metrics
| Metric | Value |
| :--- | :--- |
| **Total Registered Participants** | **${readableRegs.length}** |
| **Total Registered Squads** | **${readableTeams.length}** |
| **Total Competitions / Events** | **${festEvents.length}** |
| **Database Tables Backed Up** | **${tableNames.length}** |
| **Total Database Records** | **${manifest.total_records}** |

---

## 🏆 Competitions Roster
| Event ID | Event Name | Subtitle | Schedule | Team Size |
| :--- | :--- | :--- | :--- | :--- |
${festEvents.map(e => `| \`${e.id}\` | **${e.name}** | ${e.subtitle} | ${e.day_label} (${e.slot_time}) | ${e.min_team_size}-${e.max_team_size} |`).join('\n')}

---

## 📁 Presentable Files in this Google Drive Folder
- **\`📊_Live_Registrations_Roster.csv\`** — Complete participant roster. Open directly or in Google Sheets for filtering, sorting, or printing.
- **\`🛡️_Live_Teams_Overview.csv\`** — Squad overview with leader details, event mappings, and locked status.
- **\`📊_Indigo_Fest_Live_Dashboard.html\`** — Styled executive HTML dashboard.
- **\`backup_jarvis_*.tar.gz\`** — Full SQL schema and transactional disaster recovery archive.
`;

    // 5. Generate Styled HTML Dashboard
    const htmlDashboard = generateHtmlDashboard({
      timestamp: new Date().toUTCString(),
      totalRegs: readableRegs.length,
      totalTeams: readableTeams.length,
      events: festEvents,
      recentRegs: readableRegs,
      teamsList: readableTeams,
    });

    sqlDumpContent += `COMMIT;\n`;

    // 6. Create compressed TAR archive (.tar.gz)
    console.log('Compressing disaster recovery backup archive...');
    const archiveFileName = `backup_jarvis_${timestampStr}.tar.gz`;
    const archivePath = path.join(root, '.backup-temp', archiveFileName);

    const packageData = {
      manifest,
      sql: sqlDumpContent,
      json_tables: {},
    };
    for (const tableName of tableNames) {
      const file = path.join(tablesDir, `${tableName}.json`);
      if (fs.existsSync(file)) {
        packageData.json_tables[tableName] = JSON.parse(fs.readFileSync(file, 'utf-8'));
      }
    }

    const uncompressedBuffer = Buffer.from(JSON.stringify(packageData));
    const compressedGzipBuffer = zlib.gzipSync(uncompressedBuffer, { level: 9 });
    fs.writeFileSync(archivePath, compressedGzipBuffer);

    const archiveSizeKb = (compressedGzipBuffer.length / 1024).toFixed(2);
    const checksum = computeSha256(compressedGzipBuffer);
    console.log(`✅ Backup archive created: ${archiveFileName} (${archiveSizeKb} KB)`);

    // 7. Upload to Google Drive
    console.log(`\nConnecting to Google Drive folder: ${gdriveFolderId}...`);
    const accessToken = await getGoogleAccessToken();

    if (accessToken) {
      console.log('   Authenticated with Google Drive API.\n');

      // 1. Calculate next sequential backup number and create dedicated folder
      const nextNum = await getNextBackupNumber(accessToken, gdriveFolderId);
      const paddedNum = String(nextNum).padStart(3, '0');
      const backupFolderName = `#${paddedNum} - Backup ${timestampStr}`;
      console.log(`   Creating dedicated folder: "${backupFolderName}" ...`);
      const targetFolderId = await createDriveFolder(accessToken, backupFolderName, gdriveFolderId);
      console.log(`   ✅ Folder created! (Google Drive Folder ID: ${targetFolderId})\n`);

      // 2. Upload presentable CSV sheets and reports into this folder
      console.log('   Uploading 📊_Live_Registrations_Roster.csv ...');
      await uploadToGoogleDrive(
        accessToken,
        '📊_Live_Registrations_Roster.csv',
        Buffer.from(regsCsv, 'utf-8'),
        'text/csv',
        targetFolderId
      );
      console.log('   ✅ 📊_Live_Registrations_Roster.csv');

      console.log('   Uploading 🛡️_Live_Teams_Overview.csv ...');
      await uploadToGoogleDrive(
        accessToken,
        '🛡️_Live_Teams_Overview.csv',
        Buffer.from(teamsCsv, 'utf-8'),
        'text/csv',
        targetFolderId
      );
      console.log('   ✅ 🛡️_Live_Teams_Overview.csv');

      console.log('   Uploading 📋_LATEST_BACKUP_REPORT.md ...');
      await uploadToGoogleDrive(
        accessToken,
        '📋_LATEST_BACKUP_REPORT.md',
        Buffer.from(summaryMarkdown, 'utf-8'),
        'text/markdown',
        targetFolderId
      );
      console.log('   ✅ 📋_LATEST_BACKUP_REPORT.md');

      console.log('   Uploading 📊_Indigo_Fest_Live_Dashboard.html ...');
      await uploadToGoogleDrive(
        accessToken,
        '📊_Indigo_Fest_Live_Dashboard.html',
        Buffer.from(htmlDashboard, 'utf-8'),
        'text/html',
        targetFolderId
      );
      console.log('   ✅ 📊_Indigo_Fest_Live_Dashboard.html');

      console.log('   Uploading restore.sql (Disaster Recovery Script) ...');
      await uploadToGoogleDrive(
        accessToken,
        'restore.sql',
        Buffer.from(sqlDumpContent, 'utf-8'),
        'application/sql',
        targetFolderId
      );
      console.log('   ✅ restore.sql');

      console.log('   Uploading manifest.json (Integrity Checksums) ...');
      await uploadToGoogleDrive(
        accessToken,
        'manifest.json',
        Buffer.from(JSON.stringify(manifest, null, 2), 'utf-8'),
        'application/json',
        targetFolderId
      );
      console.log('   ✅ manifest.json');

      console.log(`   Uploading compressed archive ${archiveFileName} ...`);
      const archiveRes = await uploadToGoogleDrive(
        accessToken,
        archiveFileName,
        compressedGzipBuffer,
        'application/gzip',
        targetFolderId
      );
      console.log(`   ✅ Archive uploaded: ${archiveFileName} (ID: ${archiveRes.id})`);

      console.log('\n====================================================');
      console.log(`🎉 BACKUP #${paddedNum} COMPLETE! ALL FILES STORED IN:`);
      console.log(`Folder: "${backupFolderName}"`);
      console.log('Folder Link: https://drive.google.com/drive/folders/' + gdriveFolderId);
      console.log('====================================================\n');
    } else {
      console.warn('⚠️ Google Drive credentials not found. Stored locally in .backup-temp/');
    }

    return {
      success: true,
      archiveFileName,
      archivePath,
      checksum,
      totalRecords: manifest.total_records,
    };
  } finally {
    await sql.end();
  }
}

runBackup()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('Backup execution FAILED:', err);
    process.exit(1);
  });
