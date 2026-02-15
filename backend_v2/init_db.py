"""Initialize the database tables on Railway PostgreSQL."""
import os
import sys

# Set the DATABASE_URL for Railway
DB_URL = os.environ.get("DATABASE_URL", "postgresql://postgres:CDGscgKkiymvRZPvciHiJYstlNweyVTM@hopper.proxy.rlwy.net:41779/railway")
os.environ["DATABASE_URL"] = DB_URL

from database import engine, Base
from models import *  # Import all models so Base knows about them

print(f"Connecting to: {DB_URL[:50]}...")
print("Creating tables...")
Base.metadata.create_all(bind=engine)
print("Done! Tables created successfully.")

# List tables
from sqlalchemy import inspect
inspector = inspect(engine)
tables = inspector.get_table_names()
print(f"\nTables ({len(tables)}):")
for t in sorted(tables):
    print(f"  - {t}")
