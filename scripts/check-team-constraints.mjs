import postgres from 'postgres';
const conn = 'postgresql://postgres.oqqzzyombtcjvlqbjvla:golumolu1234$@aws-0-ap-northeast-1.pooler.supabase.com:5432/postgres';
const sql = postgres(conn, { ssl: 'require', max: 1 });

async function main() {
  const res = await sql`
    SELECT conname, pg_get_constraintdef(oid) 
    FROM pg_constraint 
    WHERE conrelid = 'public.teams'::regclass
  `;
  for (const r of res) {
    console.log(r.conname, '-->', r.pg_get_constraintdef);
  }
  await sql.end();
}
main();
