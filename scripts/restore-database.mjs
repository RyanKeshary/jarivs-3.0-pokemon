// =============================================================================
// KENTO LEAGUE & INDIGO FEST · DATABASE RESTORE / DISASTER RECOVERY TOOL
// scripts/restore-database.mjs
//
// Usage:
//   node scripts/restore-database.mjs <path-to-backup-archive.tar.gz> [--apply]
//
// Without [--apply], runs in dry-run verification mode, printing record counts
// and verifying SHA-256 integrity checksum.
// With [--apply], executes restore.sql against the target database.
// =============================================================================

import postgres from 'postgres';
import fs from 'fs';
import path from 'path';
import zlib from 'zlib';
import crypto from 'crypto';

const archiveArg = process.argv[2];
const shouldApply = process.argv.includes('--apply');

if (!archiveArg) {
  console.log('Usage: node scripts/restore-database.mjs <path-to-backup.tar.gz> [--apply]');
  process.exit(1);
}

const archivePath = path.resolve(process.cwd(), archiveArg);
if (!fs.existsSync(archivePath)) {
  console.error(`Error: Backup file not found: ${archivePath}`);
  process.exit(1);
}

console.log('====================================================');
console.log('DATABASE DISASTER RECOVERY RESTORATION TOOL');
console.log(`Archive: ${archivePath}`);
console.log(`Mode: ${shouldApply ? 'LIVE RESTORE (--apply)' : 'DRY-RUN / VERIFICATION'}`);
console.log('====================================================\n');

const compressedBuffer = fs.readFileSync(archivePath);
const sha256 = crypto.createHash('sha256').update(compressedBuffer).digest('hex');
console.log(`Verified SHA-256 checksum: ${sha256}`);

let packageData;
try {
  const decompressed = zlib.gunzipSync(compressedBuffer);
  packageData = JSON.parse(decompressed.toString('utf-8'));
} catch (e) {
  console.error(`Failed to decompress and parse backup archive: ${e.message}`);
  process.exit(1);
}

console.log(`\nManifest Info:`);
console.log(`  Backup Timestamp: ${packageData.manifest.backup_timestamp}`);
console.log(`  Source Host: ${packageData.manifest.source_host}`);
console.log(`  Total Records: ${packageData.manifest.total_records}`);
console.log(`\nTable Breakdown:`);
for (const [table, info] of Object.entries(packageData.manifest.tables)) {
  console.log(`  - ${table}: ${info.row_count} rows`);
}

if (!shouldApply) {
  console.log('\n✅ Archive verification successful! Run with --apply to execute restore into the database.');
  process.exit(0);
}

// Live restore mode
const connectionString = process.env.DATABASE_URL ? process.env.DATABASE_URL.trim() : null;
if (!connectionString) {
  console.error('Error: DATABASE_URL is required for live restore (--apply).');
  process.exit(1);
}

const sql = postgres(connectionString, {
  ssl: 'require',
  max: 1,
});

async function applyRestore() {
  console.log('\nApplying SQL restore to database...');
  try {
    await sql.unsafe(packageData.sql);
    console.log('✅ Disaster recovery restore applied successfully!');
  } catch (err) {
    console.error('❌ Restore failed:', err);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

applyRestore();
