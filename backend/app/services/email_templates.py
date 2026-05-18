from __future__ import annotations

import html


def _escape(s: str) -> str:
    return html.escape(s, quote=True)


def email_verification_subject() -> str:
    return "Verify your email address"


def email_verification_text(*, verify_url: str, expires_in_label: str) -> str:
    return "\n".join(
        [
            "Please verify your email address for your account.",
            "",
            f"Open this link ({expires_in_label}):",
            verify_url,
            "",
            "If you did not create an account, you can ignore this email.",
        ]
    )


def email_verification_html(*, verify_url: str, expires_in_label: str) -> str:
    escaped_url = _escape(verify_url)
    escaped_label = _escape(expires_in_label)
    return f"""<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"/></head>
<body style="font-family:system-ui,sans-serif;line-height:1.5;color:#111;">
  <p>Please verify your email address.</p>
  <p><a href="{escaped_url}" style="color:#2563eb;">Verify email</a> ({escaped_label})</p>
  <p style="font-size:14px;color:#444;">If you did not create an account, you can ignore this email.</p>
</body>
</html>"""


def password_reset_subject() -> str:
    return "Reset your password"


def password_reset_text(*, reset_url: str, expires_in_label: str) -> str:
    return "\n".join(
        [
            "We received a request to reset your password.",
            "",
            f"Open this link to choose a new password ({expires_in_label}):",
            reset_url,
            "",
            "If you did not request this, you can ignore this email.",
        ]
    )


def password_reset_html(*, reset_url: str, expires_in_label: str) -> str:
    escaped_url = _escape(reset_url)
    escaped_label = _escape(expires_in_label)
    return f"""<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"/></head>
<body style="font-family:system-ui,sans-serif;line-height:1.5;color:#111;">
  <p>We received a request to reset your password.</p>
  <p><a href="{escaped_url}" style="color:#2563eb;">Reset password</a> ({escaped_label})</p>
  <p style="font-size:14px;color:#444;">If you did not request this, you can ignore this email.</p>
</body>
</html>"""
