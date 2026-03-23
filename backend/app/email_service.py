"""
Email Service for AI Interview Platform
Sends professional interview invitation emails via SMTP.
Uses Python's built-in smtplib — no extra dependencies required.
"""
import os
import smtplib
import logging
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

logger = logging.getLogger(__name__)

# ── SMTP Configuration (read from environment) ──────────────────────────────
SMTP_HOST = os.getenv("SMTP_HOST", "")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SMTP_USER = os.getenv("SMTP_USER", "")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD", "")
SMTP_FROM_EMAIL = os.getenv("SMTP_FROM_EMAIL", SMTP_USER)
SMTP_FROM_NAME = os.getenv("SMTP_FROM_NAME", "Blue Planet Infosolution HR")
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3000")


def _smtp_configured() -> bool:
    """Return True only when all required SMTP settings are present."""
    return bool(SMTP_HOST and SMTP_USER and SMTP_PASSWORD)


# ── HTML Email Builder ──────────────────────────────────────────────────────

def build_interview_invitation_html(
    candidate_name: str,
    role_title: str,
    scheduled_date: str,
    scheduled_time: str,
    interview_link: str,
) -> str:
    """Return a styled HTML body for the interview invitation email."""

    return f"""
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Interview Invitation</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f6f9;font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f6f9;padding:40px 0;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0"
               style="background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
          
          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#1a237e 0%,#0d47a1 50%,#1565c0 100%);padding:36px 40px;text-align:center;">
              <h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:700;letter-spacing:0.5px;">
                Blue Planet Infosolution
              </h1>
              <p style="margin:8px 0 0;color:rgba(255,255,255,0.85);font-size:14px;font-weight:400;">
                Interview Invitation
              </p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:36px 40px 20px;">
              <!-- Greeting -->
              <p style="margin:0 0 20px;font-size:16px;color:#333333;">
                Dear <strong>{candidate_name}</strong>,
              </p>

              <!-- Congratulations -->
              <p style="margin:0 0 16px;font-size:15px;color:#333333;line-height:1.6;">
                <strong>Congratulations!</strong> We are pleased to inform you that your application has
                been shortlisted for the role of <strong>{role_title}</strong> at
                <strong>Blue Planet Infosolution</strong>.
              </p>

              <p style="margin:0 0 24px;font-size:15px;color:#555555;line-height:1.6;">
                Your profile has been reviewed by our team, and we would like to invite you to attend the
                interview for the next stage of the selection process.
              </p>

              <!-- Interview Details Card -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
                     style="background-color:#f0f4ff;border-left:4px solid #1a237e;border-radius:8px;margin-bottom:24px;">
                <tr>
                  <td style="padding:24px 28px;">
                    <h3 style="margin:0 0 16px;font-size:16px;color:#1a237e;font-weight:700;">
                      📋 Interview Details
                    </h3>
                    <table role="presentation" cellpadding="0" cellspacing="0" style="font-size:14px;color:#333;">
                      <tr>
                        <td style="padding:4px 0;font-weight:600;width:100px;vertical-align:top;">Company:</td>
                        <td style="padding:4px 0 4px 12px;">Blue Planet Infosolution</td>
                      </tr>
                      <tr>
                        <td style="padding:4px 0;font-weight:600;vertical-align:top;">Role:</td>
                        <td style="padding:4px 0 4px 12px;">{role_title}</td>
                      </tr>
                      <tr>
                        <td style="padding:4px 0;font-weight:600;vertical-align:top;">Date:</td>
                        <td style="padding:4px 0 4px 12px;">{scheduled_date}</td>
                      </tr>
                      <tr>
                        <td style="padding:4px 0;font-weight:600;vertical-align:top;">Time:</td>
                        <td style="padding:4px 0 4px 12px;">{scheduled_time}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Meeting Link Button -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
                <tr>
                  <td align="center">
                    <a href="{interview_link}" target="_blank"
                       style="display:inline-block;padding:14px 36px;background:linear-gradient(135deg,#1a237e,#1565c0);
                              color:#ffffff;text-decoration:none;border-radius:8px;font-size:15px;font-weight:600;
                              letter-spacing:0.3px;">
                      Join Interview
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Instructions -->
              <p style="margin:0 0 16px;font-size:14px;color:#555555;line-height:1.6;">
                Please make sure to join the interview at the scheduled date and time. Further
                instructions regarding the interview process will be shared with you if required.
              </p>

              <!-- Wishes -->
              <p style="margin:0 0 8px;font-size:15px;color:#333333;line-height:1.6;">
                We congratulate you once again and wish you the very best for your interview.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:20px 40px 32px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="border-top:1px solid #e0e0e0;padding-top:20px;">
                    <p style="margin:0 0 4px;font-size:14px;color:#333;font-weight:600;">Best regards,</p>
                    <p style="margin:0 0 2px;font-size:14px;color:#1a237e;font-weight:700;">HR Team</p>
                    <p style="margin:0;font-size:13px;color:#777;">Blue Planet Infosolution</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Bottom Bar -->
          <tr>
            <td style="background-color:#1a237e;padding:14px 40px;text-align:center;">
              <p style="margin:0;font-size:12px;color:rgba(255,255,255,0.7);">
                &copy; 2026 Blue Planet Infosolution. All rights reserved.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
"""


# ── Email Sender ─────────────────────────────────────────────────────────────

def send_interview_invitation_email(
    candidate_name: str,
    candidate_email: str,
    role_title: str,
    scheduled_date: str,
    scheduled_time: str,
    interview_id: str,
) -> bool:
    """
    Send the interview invitation email.
    Returns True on success, False on failure or if SMTP is not configured.
    Never raises — all errors are logged.
    """
    if not _smtp_configured():
        logger.warning("SMTP not configured – skipping interview invitation email for %s", candidate_email)
        return False

    interview_link = f"{FRONTEND_URL}/interview?id={interview_id}"
    subject = f"Interview Invitation – {role_title} | Blue Planet Infosolution"

    html_body = build_interview_invitation_html(
        candidate_name=candidate_name,
        role_title=role_title,
        scheduled_date=scheduled_date,
        scheduled_time=scheduled_time,
        interview_link=interview_link,
    )

    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = f"{SMTP_FROM_NAME} <{SMTP_FROM_EMAIL}>"
    msg["To"] = candidate_email

    # Plain-text fallback
    plain_text = (
        f"Dear {candidate_name},\n\n"
        f"Congratulations! Your application has been shortlisted for the role of "
        f"{role_title} at Blue Planet Infosolution.\n\n"
        f"Interview Details:\n"
        f"  Company: Blue Planet Infosolution\n"
        f"  Role: {role_title}\n"
        f"  Date: {scheduled_date}\n"
        f"  Time: {scheduled_time}\n"
        f"  Meeting Link: {interview_link}\n\n"
        f"Please make sure to join the interview at the scheduled date and time.\n\n"
        f"We congratulate you once again and wish you the very best for your interview.\n\n"
        f"Best regards,\nHR Team\nBlue Planet Infosolution"
    )

    msg.attach(MIMEText(plain_text, "plain"))
    msg.attach(MIMEText(html_body, "html"))

    try:
        with smtplib.SMTP(SMTP_HOST, SMTP_PORT, timeout=15) as server:
            server.ehlo()
            server.starttls()
            server.ehlo()
            server.login(SMTP_USER, SMTP_PASSWORD)
            server.send_message(msg)
        logger.info("Interview invitation email sent to %s for role '%s'", candidate_email, role_title)
        return True
    except Exception as exc:
        logger.error("Failed to send interview invitation email to %s: %s", candidate_email, exc)
        return False
