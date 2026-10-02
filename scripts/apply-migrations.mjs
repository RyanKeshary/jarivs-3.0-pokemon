/**
 * Applies every SQL file in supabase/migrations in filename order, inside a
 * transaction each, and records what it ran in kanto.schema_migrations.
 *
 *   node scripts/apply-migrations.mjs           # apply pending migrations
 *   node scripts/apply-migrations.mjs --status  # list applied vs pending
 *   node scripts/apply-migrations.mjs --force   # re-run even if already applied
 *
 * Design choices
 *  - The ledger lives in the non-exposed `kanto` schema, so a client can never
 *    read or forge it through PostgREST.
 *  - Checksums are stored. Editing a migration that has already run is reported
 *    as a conflict instead of being silently ignored, because the usual fix is
 *    to add a new migration rather than edit an old one.
 */
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import postgres from 'postgres';

import { ROOT, connectionOptions, describeTarget, loadEnv, MissingDatabaseUrlError } from './lib/db.mjs';

const MIGRATIONS_DIR = path.join(ROOT, 'supabase', 'migrations');
const args = new Set(process.argv.slice(2));
const force = args.has('--force');
const statusOnly = args.has('--status');

const c = {
  dim: (s) => `\x1b[2m${s}\x1b[0m`,
  ok: (s) => `\x1b[32m${s}\x1b[0m`,
  warn: (s) => `\x1b[33m${s}\x1b[0m`,
  err: (s) => `\x1b[31m${s}\x1b[0m`,
  bold: (s) => `\x1b[1m${s}\x1b[0m`,
};

function readMigrations() {
  if (!fs.existsSync(MIGRATIONS_DIR)) {
    throw new Error(`No migrations directory at ${MIGRATIONS_DIR}`);
  }
  return fs
    .readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith('.sql'))
    .sort() // zero-padded prefixes make lexicographic order == apply order
    .map((name) => {
      const sql = fs.readFileSync(path.join(MIGRATIONS_DIR, name), 'utf8');
      return { name, sql, checksum: createHash('sha256').update(sql).digest('hex') };
    });
}

async function ensureLedger(sql) {
  // One statement per call: the driver sends tagged templates as a single
  // prepared statement, which Postgres rejects for multi-command strings.
  await sql`create schema if not exists kanto`;
  await sql`
    create table if not exists kanto.schema_migrations (
      name       text        primary key,
      checksum   text        not null,
      applied_at timestamptz not null default now()
    )
  `;
}

async function main() {
  loadEnv();
  const migrations = readMigrations();
  if (migrations.length === 0) throw new Error('No .sql files found in supabase/migrations');

  const opts = connectionOptions();
  // `onnotice` has to go in the SAME object as the connection options:
  // postgres.js does `const o = (typeof a === 'string' ? b : a) || {}`, so a
  // second argument is silently dropped when the first one is an object.
  //
  // It matters because `if not exists` / `drop trigger if exists` are supposed to
  // be quiet. Without this, every migration dumps a wall of NOTICE objects.
  const sql = postgres({ ...opts, onnotice: () => {} });

  try {
    const [target] = await sql`select current_database() as db, current_user as usr, version() as v`;
    console.log(c.dim(`connected to ${describeTarget(opts)} (${target.db})`));
    console.log(c.dim(`postgres ${target.v.split(' ').slice(0, 2).join(' ')}`));

    await ensureLedger(sql);
    const applied = new Map(
      (await sql`select name, checksum from kanto.schema_migrations`).map((r) => [r.name, r.checksum]),
    );

    const pending = [];
    const conflicts = [];
    for (const m of migrations) {
      if (!applied.has(m.name)) pending.push(m);
      else if (applied.get(m.name) !== m.checksum && !force) conflicts.push(m);
    }

    if (statusOnly) {
      console.log('');
      for (const m of migrations) {
        const at = applied.has(m.name) ? c.ok('applied') : c.warn('pending');
        const flag = conflicts.includes(m) ? c.err('  <- checksum changed') : '';
        console.log(`  ${at}  ${m.name}${flag}`);
      }
      console.log(
        `\n${applied.size} applied, ${pending.length} pending` +
          (conflicts.length ? `, ${c.err(`${conflicts.length} with changed checksums`)}` : ''),
      );
      return;
    }

    if (conflicts.length) {
      console.error(
        c.err(
          `\nThese migrations were already applied but have been edited since:\n${conflicts
            .map((m) => `  - ${m.name}`)
            .join('\n')}\n\n` +
            'Add a new migration instead of editing an applied one, or re-run with --force.',
        ),
      );
      process.exitCode = 1;
      return;
    }

    if (pending.length === 0) {
      console.log(c.ok('\nnothing to do - database is up to date'));
      return;
    }

    console.log('');
    for (const m of pending) {
      process.stdout.write(`  ${c.dim('->')} ${m.name} ... `);
      // Each migration is atomic: a failure halfway through leaves no partial
      // schema behind, which matters a lot for the RLS work.
      await sql.begin(async (tx) => {
        await tx.unsafe(m.sql);
        await tx`insert into kanto.schema_migrations (name, checksum) values (${m.name}, ${m.checksum})`;
      });
      console.log(c.ok('ok'));
    }

    console.log(c.ok(`\napplied ${pending.length} migration(s)`));
  } finally {
    await sql.end({ timeout: 5 });
  }
}

main().catch((err) => {
  if (err instanceof MissingDatabaseUrlError) {
    console.error(c.err(`\n${err.message}\n`));
  } else {
    console.error(c.err(`\nmigration failed: ${err.message}`));
    if (process.env.DEBUG) console.error(err);
  }
  process.exitCode = 1;
});
