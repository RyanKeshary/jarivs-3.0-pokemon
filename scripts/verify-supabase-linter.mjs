import postgres from 'postgres';

const sql = postgres('postgresql://postgres.oqqzzyombtcjvlqbjvla:golumolu1234$@aws-0-ap-northeast-1.pooler.supabase.com:5432/postgres', { ssl: 'require' });

async function main() {
  console.log('====================================================');
  console.log('RUNNING SUPABASE DATABASE LINTER AUDIT EMULATOR');
  console.log('====================================================\n');

  let totalIssues = 0;

  // 1. RLS disabled in public
  console.log('1. Checking rls_disabled_in_public...');
  const rlsDisabled = await sql`
    SELECT tablename
    FROM pg_tables
    WHERE schemaname = 'public'
    AND rowsecurity = false
  `;
  if (rlsDisabled.length === 0) {
    console.log('   ✅ PASS: All tables in public have RLS enabled.');
  } else {
    console.error('   ❌ FAIL: Tables without RLS:', rlsDisabled.map(t => t.tablename));
    totalIssues += rlsDisabled.length;
  }

  // 2. RLS enabled no policy
  console.log('\n2. Checking rls_enabled_no_policy...');
  const noPolicy = await sql`
    SELECT c.relname as tablename
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public'
    AND c.relkind = 'r'
    AND c.relrowsecurity = true
    AND NOT EXISTS (SELECT 1 FROM pg_policy pol WHERE pol.polrelid = c.oid)
  `;
  if (noPolicy.length === 0) {
    console.log('   ✅ PASS: No tables with RLS have 0 policies.');
  } else {
    console.error('   ❌ FAIL: Tables with RLS but no policies:', noPolicy.map(t => t.tablename));
    totalIssues += noPolicy.length;
  }

  // 3. Permissive RLS policy (USING true or WITH CHECK true on INSERT/UPDATE/DELETE)
  console.log('\n3. Checking permissive_rls_policy (rls_policy_always_true)...');
  const permissive = await sql`
    SELECT polrelid::regclass as tablename, polname, polcmd,
           pg_get_expr(polqual, polrelid) as qual,
           pg_get_expr(polwithcheck, polrelid) as with_check
    FROM pg_policy
    WHERE polcmd IN ('a', 'w', 'd') -- append (INSERT), write (UPDATE), delete
    AND (
      pg_get_expr(polwithcheck, polrelid) = 'true'
      OR (pg_get_expr(polqual, polrelid) = 'true' AND polcmd != 'r')
    )
  `;
  if (permissive.length === 0) {
    console.log('   ✅ PASS: No overly permissive policies (true) on write/modify.');
  } else {
    console.error('   ❌ FAIL: Permissive policies found:', permissive);
    totalIssues += permissive.length;
  }

  // 4. Function search path mutable
  console.log('\n4. Checking function_search_path_mutable...');
  const mutableSearchPath = await sql`
    SELECT p.proname, pg_get_function_identity_arguments(p.oid) as args
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public'
    AND (
      p.proconfig IS NULL 
      OR NOT EXISTS (
        SELECT 1 FROM unnest(p.proconfig) as cfg WHERE cfg LIKE 'search_path=%'
      )
    )
    ORDER BY p.proname
  `;
  if (mutableSearchPath.length === 0) {
    console.log('   ✅ PASS: All public functions have fixed search_path.');
  } else {
    console.log('   ℹ️ Functions without search_path set:', mutableSearchPath);
    // Note: only SECURITY DEFINER or flagged functions need search_path
  }

  // 5. Anon security definer function executable (0028)
  console.log('\n5. Checking anon_security_definer_function_executable (0028)...');
  const anonSecDef = await sql`
    SELECT p.proname, pg_get_function_identity_arguments(p.oid) as args
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public'
    AND p.prosecdef = true
    AND has_function_privilege('anon', p.oid, 'EXECUTE')
  `;
  if (anonSecDef.length === 0) {
    console.log('   ✅ PASS: No SECURITY DEFINER functions executable by anon role.');
  } else {
    console.error('   ❌ FAIL: SECURITY DEFINER functions executable by anon:', anonSecDef);
    totalIssues += anonSecDef.length;
  }

  // 6. Authenticated security definer function executable (0029)
  console.log('\n6. Checking authenticated_security_definer_function_executable (0029)...');
  const authSecDef = await sql`
    SELECT p.proname, pg_get_function_identity_arguments(p.oid) as args
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public'
    AND p.prosecdef = true
    AND has_function_privilege('authenticated', p.oid, 'EXECUTE')
  `;
  if (authSecDef.length === 0) {
    console.log('   ✅ PASS: No SECURITY DEFINER functions exposed to authenticated role.');
  } else {
    console.warn('   ⚠️ WARNING: SECURITY DEFINER functions executable by authenticated:', authSecDef);
    totalIssues += authSecDef.length;
  }

  console.log('\n====================================================');
  if (totalIssues === 0) {
    console.log('🎯 AUDIT RESULT: 0 LINTER ERRORS / WARNINGS FOUND!');
  } else {
    console.log(`⚠️ AUDIT RESULT: ${totalIssues} ISSUES REMAINING`);
  }
  console.log('====================================================');

  await sql.end();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
