import postgres from 'postgres';

const sql = postgres('postgresql://postgres.oqqzzyombtcjvlqbjvla:golumolu1234$@aws-0-ap-northeast-1.pooler.supabase.com:5432/postgres', { ssl: 'require' });

const DEFAULT_PASSWORD = 'password@67';

async function main() {
  console.log('--- Setting default password "password@67" for all Admins and Masters ---');

  // Get all admin, master, manager emails from master_allowlist & profiles
  const masters = await sql`SELECT email FROM public.master_allowlist`;
  const profiles = await sql`SELECT id, email, role FROM public.profiles WHERE role::text IN ('admin', 'master', 'manager')`;

  const targetEmails = Array.from(new Set([
    ...masters.map(m => m.email.toLowerCase()),
    ...profiles.map(p => p.email.toLowerCase())
  ]));

  console.log('Target emails:', targetEmails);

  for (const email of targetEmails) {
    const updated = await sql`
      UPDATE auth.users
      SET encrypted_password = crypt(${DEFAULT_PASSWORD}, gen_salt('bf', 10)),
          updated_at = NOW()
      WHERE LOWER(email) = ${email}
      RETURNING id, email;
    `;

    if (updated.length > 0) {
      console.log(`✅ Set password to "${DEFAULT_PASSWORD}" for ${email} (User ID: ${updated[0].id})`);
    } else {
      console.log(`⚠️ User ${email} does not exist in auth.users yet.`);
    }
  }

  // Also verify that when they sign in, their password matches
  for (const email of targetEmails) {
    const match = await sql`
      SELECT id, email, (encrypted_password = crypt(${DEFAULT_PASSWORD}, encrypted_password)) as password_matches
      FROM auth.users
      WHERE LOWER(email) = ${email}
    `;
    console.log(`Verification for ${email}:`, match[0]);
  }

  await sql.end();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
