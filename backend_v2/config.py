import os
from datetime import timedelta

basedir = os.path.abspath(os.path.dirname(__file__))


class Settings:
    SECRET_KEY: str = os.environ.get("SECRET_KEY", "dev-secret-change-in-production")
    JWT_SECRET_KEY: str = os.environ.get("JWT_SECRET_KEY", SECRET_KEY)
    JWT_ACCESS_EXPIRE_MINUTES: int = 15
    JWT_REFRESH_EXPIRE_DAYS: int = 30
    JWT_ALGORITHM: str = "HS256"

    # Database — supports PostgreSQL (production) and MSSQL (local dev)
    DATABASE_URL_ENV: str = os.environ.get("DATABASE_URL", "")
    MSSQL_DRIVER: str = os.environ.get("MSSQL_DRIVER", "ODBC Driver 17 for SQL Server")
    MSSQL_SERVER: str = os.environ.get("MSSQL_SERVER", r".\SQLEXPRESS01")
    MSSQL_DATABASE: str = os.environ.get("MSSQL_DATABASE", "DollarVote")

    @property
    def DATABASE_URL(self) -> str:
        # If DATABASE_URL is set (Railway/production), use it
        if self.DATABASE_URL_ENV:
            url = self.DATABASE_URL_ENV
            # SQLAlchemy needs postgresql:// not postgres://
            if url.startswith("postgres://"):
                url = url.replace("postgres://", "postgresql://", 1)
            return url
        # Otherwise fall back to local MSSQL
        from urllib.parse import quote_plus
        conn = (
            f"DRIVER={{{self.MSSQL_DRIVER}}};"
            f"SERVER={self.MSSQL_SERVER};"
            f"DATABASE={self.MSSQL_DATABASE};"
            "Trusted_Connection=yes;"
            "TrustServerCertificate=yes;"
        )
        return f"mssql+pyodbc:///?odbc_connect={quote_plus(conn)}"

    # FEC
    FEC_API_KEY: str = os.environ.get("FEC_API_KEY", "DEMO_KEY")

    # CORS
    CORS_ORIGINS: list[str] = os.environ.get(
        "CORS_ORIGINS", "http://localhost:5173,http://localhost:3000,https://dollarvote.app,https://www.dollarvote.app"
    ).split(",")

    # Data files
    DATA_DIR: str = os.environ.get("DATA_DIR", os.path.join(basedir, "data"))


settings = Settings()
