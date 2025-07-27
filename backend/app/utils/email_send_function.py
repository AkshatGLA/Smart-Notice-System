import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.mime.base import MIMEBase
from email import encoders
from typing import List
import os

# --- CONFIGURATION (Unchanged) ---
EMAIL_SENDER_ADDRESS = os.environ.get("EMAIL_SENDER_ADDRESS", "team.smart.notice@gmail.com")
EMAIL_SENDER_PASSWORD = os.environ.get("EMAIL_SENDER_PASSWORD", "sqbpaqxlstzrxabk")
SMTP_SERVER = "smtp.gmail.com"
SMTP_PORT = 587

# MODIFIED: The function now accepts an 'attachments' parameter
def send_bulk_email(recipient_emails: List[str], subject: str, body: str, attachments: List[str] = None) -> bool:
    if not all([EMAIL_SENDER_ADDRESS, EMAIL_SENDER_PASSWORD, recipient_emails]):
        print("ERROR: Email credentials are not configured or recipient list is empty.")
        return False

    message = MIMEMultipart()
    message["From"] = EMAIL_SENDER_ADDRESS
    message["Bcc"] = ", ".join(recipient_emails)
    message["Subject"] = subject
    
    message.attach(MIMEText(body, "html"))

    # NEW: This block handles attaching files
    if attachments:
        for file_path in attachments:
            try:
                with open(file_path, "rb") as attachment_file:
                    # Create a MIMEBase object
                    part = MIMEBase("application", "octet-stream")
                    part.set_payload(attachment_file.read())
                
                # Encode file in base64
                encoders.encode_base64(part)
                
                # Add a header to tell the email client the file's name
                part.add_header(
                    "Content-Disposition",
                    f"attachment; filename={os.path.basename(file_path)}",
                )
                
                # Attach the file part to the message
                message.attach(part)
                print(f"✅ Successfully attached {os.path.basename(file_path)}")
            except Exception as e:
                print(f"❌ Could not attach file {file_path}. Error: {e}")

    # The rest of the function remains the same
    try:
        print(f"Connecting to email server {SMTP_SERVER}...")
        server = smtplib.SMTP(SMTP_SERVER, SMTP_PORT)
        server.starttls()
        server.login(EMAIL_SENDER_ADDRESS, EMAIL_SENDER_PASSWORD)
        print(f"Sending email to {len(recipient_emails)} recipients...")
        server.sendmail(EMAIL_SENDER_ADDRESS, recipient_emails, message.as_string())
        print("✅ Email sent successfully!")
        return True
    except Exception as e:
        print(f"❌ Email sending failed: {e}")
        return False
    finally:
        if 'server' in locals() and server:
            server.quit()