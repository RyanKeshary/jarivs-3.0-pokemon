import postgres from 'postgres';
import { connectionOptions, loadEnv } from './lib/db.mjs';

loadEnv();

const sql = postgres(connectionOptions());

async function main() {
  try {
    const DEFAULT_PASSWORD = process.env.DEFAULT_ADMIN_PASSWORD || 'password@67';
    const targetAccounts = [
      { email: 'ryankeshary@gmail.com', role: 'manager', name: 'Ryan Keshary' },
      { email: 'shrey.sleeps@gmail.com', role: 'manager', name: 'Shrey' },
    ];

    for (const account of targetAccounts) {
      const email = account.email.toLowerCase();
      const existingUsers = await sql`
        SELECT id FROM auth.users WHERE lower(email) = ${email};
      `;

      let userId;
      if (existingUsers.length > 0) {
        userId = existingUsers[0].id;
        console.log(`Setting password to ${DEFAULT_PASSWORD} for existing user: ${email} (${userId})`);
        await sql`
          UPDATE auth.users
          SET 
            encrypted_password = crypt(${DEFAULT_PASSWORD}, gen_salt('bf', 10)),
            email_confirmed_at = coalesce(email_confirmed_at, now()),
            raw_app_meta_data = '{"provider":"email","providers":["email"]}'::jsonb,
            raw_user_meta_data = jsonb_build_object('sub', ${userId}::text, 'email', ${email}::text, 'full_name', ${account.name}::text),
            is_super_admin = null,
            phone = null,
            confirmation_token = '',
            recovery_token = '',
            email_change_token_new = '',
            email_change = '',
            updated_at = now()
          WHERE id = ${userId};
        `;
      } else {
        console.log(`Creating auth user ${email} with default password ${DEFAULT_PASSWORD}...`);
        userId = (await sql`SELECT gen_random_uuid() as id;`)[0].id;

        await sql`
          INSERT INTO auth.users (
            instance_id,
            id,
            aud,
            role,
            email,
            encrypted_password,
            email_confirmed_at,
            raw_app_meta_data,
            raw_user_meta_data,
            confirmation_token,
            recovery_token,
            email_change_token_new,
            email_change,
            created_at,
            updated_at
          ) VALUES (
            '00000000-0000-0000-0000-000000000000',
            ${userId},
            'authenticated',
            'authenticated',
            ${email},
            crypt(${DEFAULT_PASSWORD}, gen_salt('bf', 10)),
            now(),
            '{"provider":"email","providers":["email"]}'::jsonb,
            jsonb_build_object('sub', ${userId}::text, 'email', ${email}::text, 'full_name', ${account.name}::text),
            '',
            '',
            '',
            '',
            now(),
            now()
          );
        `;
      }

      // Upsert identity
      await sql`
        INSERT INTO auth.identities (
          id,
          user_id,
          provider_id,
          identity_data,
          provider,
          created_at,
          updated_at
        ) VALUES (
          gen_random_uuid(),
          ${userId},
          ${userId},
          jsonb_build_object('sub', ${userId}::text, 'email', ${email}::text, 'email_verified', true, 'phone_verified', false),
          'email',
          now(),
          now()
        )
        ON CONFLICT (provider_id, provider) DO UPDATE
        SET 
          identity_data = jsonb_build_object('sub', ${userId}::text, 'email', ${email}::text, 'email_verified', true, 'phone_verified', false),
          updated_at = now();
      `;

      // Ensure role in profiles
      await sql`
        UPDATE public.profiles
        SET role = ${account.role}::public.user_role
        WHERE id = ${userId};
      `;
      console.log(`✓ Configured user, identity, and profile for ${email}`);
    }

    console.log('✓ All admin and manager accounts configured with default password password@67');
  } catch (err) {
    console.error('Error in setup-admin-passwords:', err);
  } finally {
    await sql.end();
  }
}

main();
