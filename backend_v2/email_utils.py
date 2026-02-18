"""Email verification utilities for DollarVote."""
import os
import random
import string
import requests
from datetime import datetime, timedelta, timezone


RESEND_API_KEY = os.environ.get("RESEND_API_KEY", "")
FROM_EMAIL = os.environ.get("FROM_EMAIL", "noreply@dollarvote.app")
VERIFY_CODE_EXPIRY_MINUTES = 15


def generate_verify_code() -> str:
    """Generate a 6-digit verification code."""
    return "".join(random.choices(string.digits, k=6))


def send_verification_email(to_email: str, username: str, code: str) -> bool:
    """Send a verification code email via Resend API. Returns True on success."""
    if not RESEND_API_KEY:
        print(f"[EMAIL] Resend not configured. Code for {to_email}: {code}")
        return True  # Don't block registration if email isn't configured

    html = f"""
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 480px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 24px;">
            <h1 style="color: #0d9488; margin: 0;">DollarVote</h1>
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

    try:
        res = requests.post(
            "https://api.resend.com/emails",
            headers={
                "Authorization": f"Bearer {RESEND_API_KEY}",
                "Content-Type": "application/json",
            },
            json={
                "from": f"DollarVote <{FROM_EMAIL}>",
                "to": [to_email],
                "subject": f"DollarVote - Your verification code: {code}",
                "html": html,
            },
            timeout=10,
        )
        if res.status_code in (200, 201):
            print(f"[EMAIL] Verification sent to {to_email}")
            return True
        else:
            print(f"[EMAIL] Resend error {res.status_code}: {res.text}")
            return False
    except Exception as e:
        print(f"[EMAIL] Failed to send to {to_email}: {e}")
        return False


def send_password_reset_email(to_email: str, code: str) -> bool:
    """Send a password reset code email via Resend API. Returns True on success."""
    if not RESEND_API_KEY:
        print(f"[EMAIL] Resend not configured. Reset code for {to_email}: {code}")
        return True

    html = f"""
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 480px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 24px;">
            <h1 style="color: #0d9488; margin: 0;">DollarVote</h1>
            <p style="color: #6b7280; margin: 4px 0 0;">Vote With Your Dollar</p>
        </div>
        <div style="background: #f9fafb; border-radius: 12px; padding: 24px; text-align: center;">
            <p style="color: #374151; font-size: 16px; margin: 0 0 8px;">Password Reset</p>
            <p style="color: #6b7280; font-size: 14px; margin: 0 0 20px;">Enter this code to reset your password:</p>
            <div style="background: #0d9488; color: white; font-size: 32px; font-weight: bold; letter-spacing: 8px; padding: 16px 24px; border-radius: 8px; display: inline-block;">
                {code}
            </div>
            <p style="color: #9ca3af; font-size: 12px; margin: 20px 0 0;">This code expires in {VERIFY_CODE_EXPIRY_MINUTES} minutes.</p>
        </div>
        <p style="color: #9ca3af; font-size: 11px; text-align: center; margin-top: 24px;">
            If you didn't request a password reset, you can safely ignore this email.
        </p>
    </div>
    """

    try:
        res = requests.post(
            "https://api.resend.com/emails",
            headers={
                "Authorization": f"Bearer {RESEND_API_KEY}",
                "Content-Type": "application/json",
            },
            json={
                "from": f"DollarVote <{FROM_EMAIL}>",
                "to": [to_email],
                "subject": f"DollarVote - Your password reset code: {code}",
                "html": html,
            },
            timeout=10,
        )
        if res.status_code in (200, 201):
            print(f"[EMAIL] Password reset sent to {to_email}")
            return True
        else:
            print(f"[EMAIL] Resend error {res.status_code}: {res.text}")
            return False
    except Exception as e:
        print(f"[EMAIL] Failed to send reset to {to_email}: {e}")
        return False
