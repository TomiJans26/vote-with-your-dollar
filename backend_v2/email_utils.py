"""Email verification utilities for DollarVote."""
import os
import random
import string
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime, timedelta, timezone


SMTP_HOST = os.environ.get("SMTP_HOST", "smtp-mail.outlook.com")
SMTP_PORT = int(os.environ.get("SMTP_PORT", "587"))
SMTP_USER = os.environ.get("SMTP_USER", "")
SMTP_PASS = os.environ.get("SMTP_PASS", "")
FROM_EMAIL = os.environ.get("FROM_EMAIL", SMTP_USER)
VERIFY_CODE_EXPIRY_MINUTES = 15


def generate_verify_code() -> str:
    """Generate a 6-digit verification code."""
    return "".join(random.choices(string.digits, k=6))


def send_verification_email(to_email: str, username: str, code: str) -> bool:
    """Send a verification code email. Returns True on success."""
    if not SMTP_USER or not SMTP_PASS:
        print(f"[EMAIL] SMTP not configured. Code for {to_email}: {code}")
        return True  # Don't block registration if email isn't configured

    subject = f"DollarVote - Your verification code: {code}"

    html = f"""
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 480px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 24px;">
            <h1 style="color: #0d9488; margin: 0;">🗳️ DollarVote</h1>
            <p style="color: #6b7280; margin: 4px 0 0;">Vote With Your Dollar</p>
        </div>
        <div style="background: #f9fafb; border-radius: 12px; padding: 24px; text-align: center;">
            <p style="color: #374151; font-size: 16px; margin: 0 0 8px;">Hey <strong>{username}</strong>!</p>
            <p style="color: #6b7280; font-size: 14px; margin: 0 0 20px;">Enter this code to verify your email:</p>
            <div style="background: #0d9488; color: white; font-size: 32px; font-weight: bold; letter-spacing: 8px; padding: 16px 24px; border-radius: 8px; display: inline-block;">
                {code}
            </div>
            <p style="color: #9ca3af; font-size: 12px; margin: 20px 0 0;">This code expires in {VERIFY_CODE_EXPIRY_MINUTES} minutes.</p>
        </div>
        <p style="color: #9ca3af; font-size: 11px; text-align: center; margin-top: 24px;">
            If you didn't create a DollarVote account, you can safely ignore this email.
        </p>
    </div>
    """

    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = f"DollarVote <{FROM_EMAIL}>"
    msg["To"] = to_email
    msg.attach(MIMEText(f"Your DollarVote verification code is: {code}\n\nThis code expires in {VERIFY_CODE_EXPIRY_MINUTES} minutes.", "plain"))
    msg.attach(MIMEText(html, "html"))

    try:
        with smtplib.SMTP(SMTP_HOST, SMTP_PORT, timeout=10) as server:
            server.starttls()
            server.login(SMTP_USER, SMTP_PASS)
            server.sendmail(FROM_EMAIL, to_email, msg.as_string())
        print(f"[EMAIL] Verification sent to {to_email}")
        return True
    except Exception as e:
        print(f"[EMAIL] Failed to send to {to_email}: {e}")
        return False
