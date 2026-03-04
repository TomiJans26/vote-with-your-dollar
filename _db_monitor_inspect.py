#!/usr/bin/env python3
import sqlite3
import json

conn = sqlite3.connect('D:\\projects\\company-monitor\\monitor.db')
cursor = conn.cursor()

# Get all tables
cursor.execute("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name;")
tables = [r[0] for r in cursor.fetchall()]

print("=== MONITOR.DB TABLES ===")
for table in tables:
    print(f"\n### {table}")
    
    # Get schema
    cursor.execute(f"PRAGMA table_info({table});")
    cols = cursor.fetchall()
    print("Columns:")
    for col in cols:
        print(f"  - {col[1]}: {col[2]}" + (" NOT NULL" if col[3] else " NULL") + (f" PK" if col[5] else ""))
    
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
            print(f"  {json.dumps(row, indent=4, default=str)}")

conn.close()
