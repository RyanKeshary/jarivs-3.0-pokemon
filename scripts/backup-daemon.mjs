// =============================================================================
// CONTINUOUS HOURLY BACKUP DAEMON
// scripts/backup-daemon.mjs
// Runs database backup immediately and then automatically every 60 minutes.
// Usage: node scripts/backup-daemon.mjs
// =============================================================================

import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const backupScript = path.resolve(__dirname, 'backup-database.mjs');

const INTERVAL_MINUTES = parseInt(process.env.BACKUP_INTERVAL_MINUTES || '60', 10);
const INTERVAL_MS = INTERVAL_MINUTES * 60 * 1000;

function runBackup() {
  console.log(`\n[${new Date().toISOString()}] 🚀 Initiating scheduled database backup...`);
  const child = spawn(process.execPath, [backupScript], {
    stdio: 'inherit',
    env: process.env,
  });

  child.on('close', (code) => {
    if (code === 0) {
      console.log(`[${new Date().toISOString()}] ✅ Backup finished successfully!`);
    } else {
      console.error(`[${new Date().toISOString()}] ❌ Backup process exited with error code ${code}`);
    }
    console.log(`[${new Date().toISOString()}] ⏳ Next backup scheduled in ${INTERVAL_MINUTES} minutes.`);
  });
}

console.log('================================================================');
console.log('🛡️  KENTO LEAGUE / JARVIS 3.0 CONTINUOUS HOURLY BACKUP DAEMON');
console.log(`Running every ${INTERVAL_MINUTES} minutes.`);
console.log('Press Ctrl+C to terminate the daemon at any time.');
console.log('================================================================');

// Run immediately on start
runBackup();

// Schedule recurring execution
setInterval(runBackup, INTERVAL_MS);
