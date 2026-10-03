// apply-migrations.mjs
import postgres from 'postgres';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

// Connection string from env or fallback
const connectionString = process.env.DATABASE_URL || 'postgresql://postgres.oqqzzyombtcjvlqbjvla:golumolu1234$@aws-0-ap-northeast-1.pooler.supabase.com:5432/postgres';

const sql = postgres(connectionString, {
  ssl: 'require',
  max: 1
});

async function run() {
  console.log('Connecting to database...');
  try {
    const res = await sql`SELECT NOW()`;
    console.log('Connected! Server time:', res[0].now);

    const migrationsDir = path.join(root, 'supabase', 'migrations');
    if (!fs.existsSync(migrationsDir)) {
      console.error('No migrations directory found:', migrationsDir);
      process.exit(1);
    }

    const files = fs.readdirSync(migrationsDir).filter(f => f.endsWith('.sql')).sort();
    console.log(`Found ${files.length} migration files.`);

    await sql`
      CREATE TABLE IF NOT EXISTS public._migrations (
        name TEXT PRIMARY KEY,
        applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `;

    for (const file of files) {
      const filePath = path.join(migrationsDir, file);
      const existing = await sql`SELECT name FROM public._migrations WHERE name = ${file}`;
      if (existing.length > 0 && !process.argv.includes('--force')) {
        console.log(`  [SKIP] ${file} (already applied)`);
        continue;
      }

      console.log(`  [APPLYING] ${file}...`);
      const content = fs.readFileSync(filePath, 'utf-8');
      await sql.unsafe(content);
      await sql`
        INSERT INTO public._migrations (name, applied_at)
        VALUES (${file}, NOW())
        ON CONFLICT (name) DO UPDATE SET applied_at = NOW()
      `;
      console.log(`  [DONE] ${file}`);
    }

    console.log('All migrations applied successfully!');
  } catch (err) {
    console.error('Migration error:', err);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

run();
