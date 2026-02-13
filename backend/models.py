from datetime import datetime, timezone
from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash

db = SQLAlchemy()


class User(db.Model):
    __tablename__ = "users"

    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(255), unique=True, nullable=False, index=True)
    username = db.Column(db.String(80), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(255), nullable=False)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = db.Column(
        db.DateTime,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    beliefs = db.relationship("BeliefProfile", backref="user", cascade="all, delete-orphan")
    scan_history = db.relationship("ScanHistory", backref="user", cascade="all, delete-orphan")

    def set_password(self, password: str):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password: str) -> bool:
        return check_password_hash(self.password_hash, password)

    def to_dict(self):
        return {
            "id": self.id,
            "email": self.email,
            "username": self.username,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }


class BeliefProfile(db.Model):
    __tablename__ = "belief_profiles"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False, index=True)
    issue_key = db.Column(db.String(100), nullable=False)
    stance = db.Column(db.Float, default=0.0)  # -1.0 to 1.0 (stored as -2..2 from frontend, normalized)
    importance = db.Column(db.Integer, default=0)  # 0-3
    updated_at = db.Column(
        db.DateTime,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    __table_args__ = (db.UniqueConstraint("user_id", "issue_key", name="uq_user_issue"),)


class ScanHistory(db.Model):
    __tablename__ = "scan_history"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False, index=True)
    upc = db.Column(db.String(50), nullable=False)
    product_name = db.Column(db.String(255))
    brand = db.Column(db.String(255))
    parent_company = db.Column(db.String(255))
    alignment_score = db.Column(db.Float)
    scanned_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
