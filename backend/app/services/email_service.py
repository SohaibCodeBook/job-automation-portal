from __future__ import annotations

from email.message import EmailMessage
from urllib.parse import quote

import aiosmtplib

from app.core.config import settings
from app.core.security import sign_email_verification_token, sign_password_reset_token
from app.services.email_templates import (
    email_verification_html,
    email_verification_subject,
    email_verification_text,
    password_reset_html,
    password_reset_subject,
    password_reset_text,
)


class SmtpConfigurationError(RuntimeError):
    pass


def _smtp_settings() -> tuple[str, int, str, str, str]:
    missing: list[str] = []
    if not settings.SMTP_HOST.strip():
        missing.append("SMTP_HOST")
    if not settings.SMTP_USER.strip():
        missing.append("SMTP_USER")
    if not settings.SMTP_PASS:
        missing.append("SMTP_PASS")
    if not settings.SMTP_FROM.strip():
        missing.append("SMTP_FROM")
    if missing:
        raise SmtpConfigurationError(
            f"Missing SMTP configuration: {', '.join(missing)}"
        )
    port = settings.SMTP_PORT
    if port <= 0:
        raise SmtpConfigurationError("SMTP_PORT must be a positive number.")
    return (
        settings.SMTP_HOST.strip(),
        port,
        settings.SMTP_USER.strip(),
        settings.SMTP_PASS,
        settings.SMTP_FROM.strip(),
    )


def _frontend_base_url() -> str:
    return settings.FRONTEND_BASE_URL.rstrip("/")


async def _send_mail(*, to: str, subject: str, text: str, html_body: str) -> None:
    host, port, user, password, from_addr = _smtp_settings()
    message = EmailMessage()
    message["From"] = from_addr
    message["To"] = to
    message["Subject"] = subject
    message.set_content(text)
    message.add_alternative(html_body, subtype="html")

    use_tls = settings.SMTP_SECURE or port == 465
    smtp = aiosmtplib.SMTP(hostname=host, port=port, use_tls=use_tls)
    await smtp.connect()
    if not use_tls and port == 587:
        try:
            await smtp.starttls()
        except aiosmtplib.SMTPException:
            pass
    await smtp.login(user, password)
    await smtp.send_message(message)
    await smtp.quit()


async def send_email_verification_message(to_email: str) -> None:
    normalized = to_email.strip().lower()
    token = sign_email_verification_token(normalized)
    verify_url = f"{_frontend_base_url()}/verify-email?token={quote(token)}"
    expires_label = "link expires in 24 hours"
    await _send_mail(
        to=normalized,
        subject=email_verification_subject(),
        text=email_verification_text(
            verify_url=verify_url, expires_in_label=expires_label
        ),
        html_body=email_verification_html(
            verify_url=verify_url, expires_in_label=expires_label
        ),
    )


async def send_password_reset_email(to_email: str) -> None:
    normalized = to_email.strip().lower()
    token = sign_password_reset_token(normalized)
    reset_url = f"{_frontend_base_url()}/reset-password?token={quote(token)}"
    expires_label = "link expires in 1 hour"
    await _send_mail(
        to=normalized,
        subject=password_reset_subject(),
        text=password_reset_text(reset_url=reset_url, expires_in_label=expires_label),
        html_body=password_reset_html(reset_url=reset_url, expires_in_label=expires_label),
    )
