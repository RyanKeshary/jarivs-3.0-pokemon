import psycopg2

conn = psycopg2.connect('postgresql://postgres.oqqzzyombtcjvlqbjvla:golumolu1234$@aws-0-ap-northeast-1.pooler.supabase.com:5432/postgres')
cur = conn.cursor()

cur.execute("""
    SELECT table_name, column_name, data_type 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
    ORDER BY table_name, ordinal_position;
""")

current_table = None
for table, col, dtype in cur.fetchall():
    if table != current_table:
        print(f"\n--- {table} ---")
        current_table = table
    print(f"  {col}: {dtype}")

conn.close()
