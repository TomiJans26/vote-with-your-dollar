from datetime import datetime, timezone
from sqlalchemy import (
    Column, Integer, String, Float, Boolean, DateTime, ForeignKey, Text,
    UniqueConstraint,
)
from sqlalchemy.orm import relationship
from database import Base


def _utcnow():
    return datetime.now(timezone.utc)


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, autoincrement=True)
    email = Column(String(255), unique=True, nullable=False, index=True)
    username = Column(String(80), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    email_verified = Column(Boolean, default=False)
    verify_code = Column(String(10), nullable=True)
    verify_code_expires = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=_utcnow)
    updated_at = Column(DateTime, default=_utcnow, onupdate=_utcnow)

    beliefs = relationship("BeliefProfile", back_populates="user", cascade="all, delete-orphan")
    scans = relationship("ScanHistory", back_populates="user", cascade="all, delete-orphan")

    def to_dict(self):
        return {
            "id": self.id,
            "email": self.email,
            "username": self.username,
            "email_verified": self.email_verified,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }


class Issue(Base):
    __tablename__ = "issues"

    id = Column(Integer, primary_key=True, autoincrement=True)
    key = Column(String(100), unique=True, nullable=False)
    name = Column(String(255), nullable=False)
    category = Column(String(100))
    description = Column(Text)
    icon = Column(String(50))


class BeliefProfile(Base):
    __tablename__ = "belief_profiles"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    issue_key = Column(String(100), nullable=False)
    stance = Column(Float, default=0.0)
    importance = Column(Integer, default=0)
    is_deal_breaker = Column(Boolean, default=False)
    updated_at = Column(DateTime, default=_utcnow, onupdate=_utcnow)

    user = relationship("User", back_populates="beliefs")

    __table_args__ = (UniqueConstraint("user_id", "issue_key", name="uq_user_issue"),)


class Company(Base):
    __tablename__ = "companies"

    id = Column(Integer, primary_key=True, autoincrement=True)
    slug = Column(String(100), unique=True, nullable=False, index=True)
    name = Column(String(255), nullable=False)
    ticker = Column(String(20))
    industry = Column(String(255))
    country = Column(String(10))
    description = Column(Text)
    logo_url = Column(String(500))
    created_at = Column(DateTime, default=_utcnow)

    brands = relationship("Brand", back_populates="company", cascade="all, delete-orphan")
    issues = relationship("CompanyIssue", back_populates="company", cascade="all, delete-orphan")
    pac_donations = relationship("PacDonation", back_populates="company", cascade="all, delete-orphan")


class Brand(Base):
    __tablename__ = "brands"

    id = Column(Integer, primary_key=True, autoincrement=True)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=False, index=True)
    name = Column(String(255), nullable=False)
    category = Column(String(255))

    company = relationship("Company", back_populates="brands")


class CompanyIssue(Base):
    __tablename__ = "company_issues"

    id = Column(Integer, primary_key=True, autoincrement=True)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=False, index=True)
    issue_key = Column(String(100), nullable=False)
    stance = Column(Float, default=0.0)
    confidence = Column(String(50))
    notes = Column(Text)
    source_url = Column(String(500))
    last_updated = Column(DateTime, default=_utcnow)

    company = relationship("Company", back_populates="issues")

    __table_args__ = (UniqueConstraint("company_id", "issue_key", name="uq_company_issue"),)


class PacDonation(Base):
    __tablename__ = "pac_donations"

    id = Column(Integer, primary_key=True, autoincrement=True)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=False, index=True)
    pac_name = Column(String(255))
    fec_committee_id = Column(String(50))
    cycle_year = Column(Integer)
    democrat_amount = Column(Float, default=0)
    republican_amount = Column(Float, default=0)
    other_amount = Column(Float, default=0)
    total = Column(Float, default=0)

    company = relationship("Company", back_populates="pac_donations")


class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, autoincrement=True)
    barcode = Column(String(50), unique=True, index=True)
    name = Column(String(255))
    brand_id = Column(Integer, ForeignKey("brands.id"), nullable=True)
    category = Column(String(255))
    image_url = Column(String(500))
    source = Column(String(50))

    brand = relationship("Brand")


class ScanHistory(Base):
    __tablename__ = "scan_history"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=True)
    barcode = Column(String(50))
    product_name = Column(String(255))
    brand_name = Column(String(255))
    parent_company = Column(String(255))
    alignment_score = Column(Float)
    scanned_at = Column(DateTime, default=_utcnow)

    user = relationship("User", back_populates="scans")
    product = relationship("Product")


class ProductCategory(Base):
    __tablename__ = "product_categories"

    id = Column(Integer, primary_key=True, autoincrement=True)
    slug = Column(String(100), unique=True, nullable=False)
    name = Column(String(255), nullable=False)
    parent_id = Column(Integer, ForeignKey("product_categories.id"), nullable=True)

    parent = relationship("ProductCategory", remote_side=[id])
