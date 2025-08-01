import requests
import json
from typing import List
import os
import base64
import mimetypes

# --- CONFIGURATION (Unchanged) ---
ULTRAMSG_INSTANCE_ID = "instance130052"  # Your UltraMsg Instance ID
ULTRAMSG_TOKEN = "gxk8o0lq7caawdmh"      # Your UltraMsg Token

# This function for sending text remains the same
def send_bulk_whatsapp(recipient_numbers: List[str], message_body: str) -> bool:
    if "instance12345" in ULTRAMSG_INSTANCE_ID or "your_ultramsg_token" in ULTRAMSG_TOKEN:
        print("\nERROR: UltraMsg credentials are not configured.")
        return False
    if not recipient_numbers: return False

    url = f"https://api.ultramsg.com/{ULTRAMSG_INSTANCE_ID}/messages/chat"
    success_count = 0
    for number in recipient_numbers:
        payload = {"token": ULTRAMSG_TOKEN, "to": number, "body": message_body}
        headers = {'content-type': 'application/x-www-form-urlencoded'}
        try:
            response = requests.post(url, data=payload, headers=headers)
            if response.ok and not response.json().get('error'):
                success_count += 1
        except Exception:
            pass # Error handling can be improved here
    return success_count == len(recipient_numbers)

# NEW: Function to send attachments (documents, images)
def send_whatsapp_attachment(recipient_numbers: List[str], file_path: str, caption: str = "") -> bool:
    if not os.path.exists(file_path):
        print(f"ERROR: Attachment file not found at {file_path}")
        return False

    # Read the file and encode it in base64
    with open(file_path, "rb") as f:
        file_data = base64.b64encode(f.read()).decode('utf-8')

    # Determine the file type to choose the correct API endpoint
    mime_type, _ = mimetypes.guess_type(file_path)
    file_type = mime_type.split('/')[0] if mime_type else None
    filename = os.path.basename(file_path)

    if file_type == 'image':
        endpoint = 'image'
        payload_key = 'image'
        data_uri = f"data:{mime_type};base64,{file_data}"
    elif file_type == 'application' or file_type == 'text':
        endpoint = 'document'
        payload_key = 'document'
        data_uri = f"data:{mime_type};base64,{file_data}"
    else:
        print(f"Unsupported file type for WhatsApp: {mime_type}")
        return False

    url = f"https://api.ultramsg.com/{ULTRAMSG_INSTANCE_ID}/messages/{endpoint}"
    
    success_count = 0
    print(f"Preparing to send WhatsApp attachment: {filename}")
    for number in recipient_numbers:
        payload = {
            "token": ULTRAMSG_TOKEN,
            "to": number,
            "caption": caption,
            payload_key: data_uri
        }
        # For documents, we also need to send the filename
        if endpoint == 'document':
            payload['filename'] = filename

        headers = {'content-type': 'application/x-www-form-urlencoded'}
        try:
            response = requests.post(url, data=payload, headers=headers)
            if response.ok and not response.json().get('error'):
                print(f"  -> Attachment sent successfully to {number}")
                success_count += 1
            else:
                print(f"  -> FAILED to send attachment to {number}. Reason: {response.json().get('error')}")
        except Exception as e:
            print(f"  -> An unexpected error occurred for {number}: {e}")

    return success_count == len(recipient_numbers)