/**
 * Shared Postgres connection for the scripts/ folder.
 *
 * Keeping the env loading and the pooler fallback in one place means the
 * migration runner and any future backfill script behave identically.
 */
import fs from 'node:fs';
import path from 'node:path';

export const ROOT = path.resolve(import.meta.dirname, '..', '..');

/**
 * Loads .env into process.env without clobbering variables that are already set,
 * so `DATABASE_URL=... node scripts/apply-migrations.mjs` still wins.
 */
export function loadEnv() {
  const file = path.join(ROOT, '.env');
  if (!fs.existsSync(file)) return;
  for (const rawLine of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    const eq = line.indexOf('=');
    if (eq === -1) continue;
    const key = line.slice(0, eq).trim();
    let value = line.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!(key in process.env)) process.env[key] = value;
  }
}

export class MissingDatabaseUrlError extends Error {
  constructor() {
    super(
      'DATABASE_URL is not set.\n' +
        '  Add it to .env - see .env.example.\n' +
        '  Use the pooler host, not db.<ref>.supabase.co, if you are on an IPv4-only network:\n' +
        '    postgresql://postgres.<project-ref>:<password>@aws-0-<region>.pooler.supabase.com:5432/postgres',
    );
    this.name = 'MissingDatabaseUrlError';
  }
}

export function connectionOptions() {
  loadEnv();
  const url = process.env.DATABASE_URL;
  if (!url) throw new MissingDatabaseUrlError();

  const parsed = new URL(url);
  return {
    host: parsed.hostname,
    port: Number(parsed.port || 5432),
    database: decodeURIComponent(parsed.pathname.replace(/^\//, '')) || 'postgres',
    // Supabase's pooler wants the tenant in the username: postgres.<project-ref>
    user: decodeURIComponent(parsed.username),
    password: decodeURIComponent(parsed.password),
    // Supabase requires TLS; "require" tells the driver to verify the cert chain.
    ssl: 'require',
    max: 1,
    connect_timeout: 20,
    idle_timeout: 20,
  };
}

/** Human-readable target for logs, with the password stripped out. */
export function describeTarget(opts) {
  return `${opts.user}@${opts.host}:${opts.port}/${opts.database}`;
}
