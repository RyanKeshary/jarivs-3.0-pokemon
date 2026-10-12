# 🛡️ Automated Database Backup & Disaster Recovery System

## Overview
This automated backup system protects all hackathon registration data, teams, submissions, profiles, and event settings for **Kento League / Jarvis 3.0**.

The system operates **completely independent of the live Next.js web application**:
- **Zero performance impact** on user registrations or site speed.
- **Automated Execution:** Runs every **2 hours** via GitHub Actions serverless cron (`0 */2 * * *`).
- **Destination:** Securely uploaded directly to your specified Google Drive folder:
  - **Folder ID:** `1Fsj_Lre5YDmv-iTGPa6BkuTZpGafqwS0`
  - **Folder Link:** [Google Drive Destination Folder](https://drive.google.com/drive/folders/1Fsj_Lre5YDmv-iTGPa6BkuTZpGafqwS0)
- **Secondary Redundancy:** Every backup is also stored as an encrypted GitHub Actions artifact with a 14-day retention window.
- **Disaster Recovery:** Includes a verified one-command restore engine (`npm run db:restore`).

---

## What Gets Backed Up Every 2 Hours

Each backup automatically creates a dedicated numbered folder in Google Drive (e.g., `#001 - Backup 2026-10-11_13-49-35`, `#002 - Backup ...`).

Inside each backup folder, you will find:

1. **`📊_Live_Registrations_Roster.csv`:**
   - Formatted spreadsheet viewable directly in Google Drive or Google Sheets with all participant names, colleges, roll numbers, contact info, squad codes, and registered events.
2. **`🛡️_Live_Teams_Overview.csv`:**
   - Full squad list with team names, codes, event mappings, member counts, and leader details.
3. **`📋_LATEST_BACKUP_REPORT.md`:**
   - Formatted Markdown report with high-level KPI metrics, competition rosters, and timestamp.
4. **`📊_Indigo_Fest_Live_Dashboard.html`:**
   - Interactive, styled executive HTML dashboard.
5. **`restore.sql`:**
   - Standalone transactional SQL file to instantly reconstruct and repopulate all 24 public tables.
6. **`manifest.json`:**
   - Complete metadata summary and SHA-256 checksums.
7. **`backup_jarvis_YYYY-MM-DD_HH-mm-ss.tar.gz`:**
   - Full compressed disaster-recovery archive containing raw JSON datasets and SQL scripts.

---

## One-Time Google Drive Setup (2 Minutes)

To allow the automated backup script to upload backups directly into your Google Drive folder:

### Step 1: Create a Google Cloud Service Account
1. Open the [Google Cloud Console](https://console.cloud.google.com/).
2. Select or create a project (e.g. `Jarvis-Backups`).
3. Enable the **Google Drive API**:
   - Go to **APIs & Services > Library** → Search for **Google Drive API** → Click **Enable**.
4. Go to **APIs & Services > Credentials** → Click **Create Credentials** → **Service Account**:
   - Name: `jarvis-backup-bot`
   - Role: Not required (leave default) → Click **Done**.
5. Click on the created Service Account → Go to the **Keys** tab → Click **Add Key > Create new key** → Choose **JSON** → Click **Create**.
   - A `.json` key file will download to your computer.
   - Note the `client_email` inside the JSON (e.g., `jarvis-backup-bot@your-project.iam.gserviceaccount.com`).

### Step 2: Share your Google Drive Folder with the Service Account
1. Open your destination Google Drive folder:
   [https://drive.google.com/drive/folders/1Fsj_Lre5YDmv-iTGPa6BkuTZpGafqwS0](https://drive.google.com/drive/folders/1Fsj_Lre5YDmv-iTGPa6BkuTZpGafqwS0)
2. Click **Share**.
3. Paste the service account email (`...iam.gserviceaccount.com`).
4. Set permission to **Editor** and uncheck "Notify people" → Click **Send** / **Share**.

### Step 3: Add the Secrets to GitHub
1. Go to your GitHub repository: `https://github.com/RyanKeshary/jarivs-3.0-pokemon`.
2. Navigate to **Settings > Secrets and variables > Actions**.
3. Add the following 3 repository secrets:
   - **`GDRIVE_CLIENT_ID`**: Paste your Google OAuth Client ID
   - **`GDRIVE_CLIENT_SECRET`**: Paste your Google OAuth Client Secret
   - **`GDRIVE_REFRESH_TOKEN`**: Paste your Google Drive OAuth Refresh Token
4. Ensure `DATABASE_URL` is also set (already configured for your CI pipeline).

---

## Running Backups

### 1. Fully Automated (Multi-Tier Schedule: Vercel Cron & GitHub Actions)
1. **GitHub Actions Schedule:**
   The workflow [`.github/workflows/database-backup.yml`](file:///.github/workflows/database-backup.yml) is scheduled with cron:
   - `- cron: '17 * * * *'`
   - `- cron: '47 * * * *'`
   Running at `:17` and `:47` avoids the top-of-hour (`:00`) queue congestion on GitHub where workflows get delayed or dropped.
2. **Vercel Cron Trigger:**
   [`vercel.json`](file:///vercel.json) schedules an automated hourly ping to `/api/cron/backup` which dispatches the GitHub Actions backup immediately.
3. **External Cron Webhook (Guaranteed 100% Hourly Precision):**
   You can also set any free cron service (like [cron-job.org](https://cron-job.org) or UptimeRobot) to ping:
   `https://indigo-techfest.vercel.app/api/cron/backup` every hour.
   Because this is an active external HTTP request, it dispatches the GitHub Actions runner immediately without waiting on GitHub's internal scheduler queue.

### 2. Admin Dashboard Instant Backup (1 Click)
In your Indigo Admin Dashboard ([IndigoAdminDashboard.tsx](file:///src/components/admin/IndigoAdminDashboard.tsx)), next to the **Export CSV** button:
- Click the green **Drive Backup** button anytime to instantly trigger a full disaster recovery backup to Google Drive.

### 3. Continuous Local Daemon (100% Reliable Every Hour)
If you want guaranteed hourly backups running in the background on your machine or local server during the fest:
```bash
npm run db:backup:daemon
```
Runs an initial backup immediately, and continues executing every 60 minutes.

### 4. Single On-Demand Local Backup
```bash
npm run db:backup
```

---

## Disaster Recovery & Restoration

If data is ever corrupted or accidentally deleted:

### Verify a Backup Archive (Dry-Run)
```bash
node scripts/restore-database.mjs path/to/backup_archive.tar.gz
```
Verifies SHA-256 checksum, unpacks manifest, and lists row counts per table without making database changes.

### Apply Full Restoration
```bash
node scripts/restore-database.mjs path/to/backup_archive.tar.gz --apply
```
Safely applies the transactional restore script (`restore.sql`) into the Supabase database.
