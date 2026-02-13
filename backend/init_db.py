"""Initialize the database (create all tables)."""
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app import create_app
from models import db

app = create_app()
with app.app_context():
    db.create_all()
    print("Database initialized successfully.")
