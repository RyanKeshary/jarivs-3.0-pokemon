import psycopg2

conn_str = 'postgresql://postgres.oqqzzyombtcjvlqbjvla:golumolu1234$@aws-0-ap-northeast-1.pooler.supabase.com:5432/postgres'
conn = psycopg2.connect(conn_str)
cur = conn.cursor()

print("--- Tables in public ---")
cur.execute("SELECT tablename FROM pg_tables WHERE schemaname = 'public'")
for row in cur.fetchall():
    print(row[0])

print("\n--- Auth Users ---")
cur.execute("SELECT id, email, created_at FROM auth.users")
for row in cur.fetchall():
    print(row)

print("\n--- Profiles Table Columns ---")
cur.execute("""
    SELECT column_name, data_type 
    FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'profiles'
""")
for row in cur.fetchall():
    print(row)

conn.close()
