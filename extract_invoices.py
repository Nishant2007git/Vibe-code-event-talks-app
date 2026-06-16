import os
import glob
import sys
from datetime import datetime

# Reconfigure stdout to use UTF-8 encoding (especially for Windows terminals displaying emojis)
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

# Current local date for comparison (2026-06-16)
CURRENT_DATE = datetime(2026, 6, 16)

def parse_date(date_str):
    """Parse common date formats used in invoices."""
    for fmt in ('%Y-%m-%d', '%d-%m-%Y', '%d/%m/%Y', '%m/%d/%Y', '%B %d, %Y', '%b %d, %Y'):
        try:
            return datetime.strptime(date_str.strip(), fmt)
        except ValueError:
            continue
    return None

def get_due_status(due_date_str):
    """Check if the due date is in the past."""
    due_date = parse_date(due_date_str)
    if due_date and due_date < CURRENT_DATE:
        return "❌ (Overdue)"
    return " "

def generate_invoice_table(invoices):
    """Generate and print a formatted table of invoice information."""
    print("\n| Invoice No | Invoice Date | Invoice Sent By | Due Date   | Due Amount | Overdue Status |")
    print("|------------|--------------|-----------------|------------|------------|----------------|")
    
    for inv in invoices:
        no = inv.get('no', 'N/A')
        date = inv.get('date', 'N/A')
        sender = inv.get('sender', 'N/A')
        due = inv.get('due_date', 'N/A')
        amount = inv.get('amount', 'N/A')
        status = get_due_status(due)
        
        print(f"| {no:<10} | {date:<12} | {sender:<15} | {due:<10} | {amount:<10} | {status:<14} |")
    print()

def main():
    print("Scanning directory for .png files...")
    png_files = glob.glob("*.png") + glob.glob("Images/*.png")
    
    valid_images = []
    if png_files:
        from PIL import Image
        for f in png_files:
            try:
                with Image.open(f) as img:
                    img.verify()
                    valid_images.append(f)
            except Exception:
                # File is corrupted or not a valid image
                continue
                
    if not valid_images:
        print("No valid .png image files found in the current directory or Images subfolder.")
        print("\n--- DEMONSTRATION OF INVOICE EXTRACTION TABLE (Current Date: June 16, 2026) ---")
        
        # Mock invoice data to show how it works
        mock_invoices = [
            {
                "no": "INV-10024",
                "date": "May 10, 2026",
                "sender": "Acme Corp Ltd",
                "due_date": "June 10, 2026",
                "amount": "$1,250.00"
            },
            {
                "no": "INV-10025",
                "date": "June 01, 2026",
                "sender": "Globex Services",
                "due_date": "July 01, 2026",
                "amount": "$3,400.00"
            },
            {
                "no": "INV-10026",
                "date": "May 20, 2026",
                "sender": "Initech Systems",
                "due_date": "June 15, 2026",
                "amount": "$850.00"
            },
            {
                "no": "INV-10027",
                "date": "June 12, 2026",
                "sender": "Hooli Inc",
                "due_date": "June 26, 2026",
                "amount": "$5,200.00"
            }
        ]
        generate_invoice_table(mock_invoices)
        return
        
    print(f"Found {len(valid_images)} valid .png file(s): {valid_images}")
    print("\nNote: OCR libraries (like pytesseract or easyocr) are not pre-installed in this environment.")
    print("Please install them using: pip install easyocr pillow")
    
    # We can write a placeholder parsing function that attempts to extract text
    # if the files are text files, or prints instructions.

if __name__ == '__main__':
    main()
