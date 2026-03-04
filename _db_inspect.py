#!/usr/bin/env python3
import psycopg2
import json

conn = psycopg2.connect('postgresql://postgres:CDGscgKkiymvRZPvciHiJYstlNweyVTM@hopper.proxy.rlwy.net:41779/railway')
cursor = conn.cursor()

# Get all tables
cursor.execute("""
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema='public' 
    ORDER BY table_name;
""")
tables = [r[0] for r in cursor.fetchall()]

print("=== TABLES ===")
for table in tables:
    print(f"\n### {table}")
    
    # Get column info
    cursor.execute(f"""
        SELECT column_name, data_type, character_maximum_length, is_nullable
        FROM information_schema.columns
        WHERE table_name = '{table}'
        ORDER BY ordinal_position;
    """)
    cols = cursor.fetchall()
    print("Columns:")
    for col in cols:
        print(f"  - {col[0]}: {col[1]}" + (f"({col[2]})" if col[2] else "") + (" NULL" if col[3] == 'YES' else " NOT NULL"))
    
    # Get row count
    cursor.execute(f"SELECT COUNT(*) FROM {table};")
    count = cursor.fetchone()[0]
    print(f"Row count: {count}")
    
    # Get sample data
    if count > 0:
        cursor.execute(f"SELECT * FROM {table} LIMIT 3;")
        samples = cursor.fetchall()
        col_names = [desc[0] for desc in cursor.description]
        print("Sample data:")
        for sample in samples:
            row = dict(zip(col_names, sample))
            # Convert dates to strings for JSON serialization
            for k, v in row.items():
                if hasattr(v, 'isoformat'):
                    row[k] = v.isoformat()
            print(f"  {json.dumps(row, indent=4)}")

# Get foreign keys
print("\n=== FOREIGN KEYS ===")
cursor.execute("""
    SELECT
        tc.constraint_name, 
        tc.table_name, 
        kcu.column_name, 
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name 
    FROM 
        information_schema.table_constraints AS tc 
        JOIN information_schema.key_column_usage AS kcu
          ON tc.constraint_name = kcu.constraint_name
          AND tc.table_schema = kcu.table_schema
        JOIN information_schema.constraint_column_usage AS ccu
          ON ccu.constraint_name = tc.constraint_name
          AND ccu.table_schema = tc.table_schema
    WHERE tc.constraint_type = 'FOREIGN KEY';
""")
fks = cursor.fetchall()
for fk in fks:
    print(f"{fk[1]}.{fk[2]} -> {fk[3]}.{fk[4]}")

# Get indexes
print("\n=== INDEXES ===")
cursor.execute("""
    SELECT tablename, indexname, indexdef
    FROM pg_indexes
    WHERE schemaname = 'public'
    ORDER BY tablename, indexname;
""")
indexes = cursor.fetchall()
for idx in indexes:
    print(f"{idx[0]}: {idx[1]}")
    print(f"  {idx[2]}")

conn.close()
