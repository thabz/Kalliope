#!/usr/bin/env python3.10

import pdfplumber
import sys

def extract_text_from_pdf(pdf_path):
    text = ""
    with pdfplumber.open(pdf_path) as pdf:
        for page in pdf.pages:
            text += page.extract_text()
    return text

if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Usage: python extract_text_pdfplumber.py <pdf_path>")
        sys.exit(1)

    pdf_path = sys.argv[1]
    text = extract_text_from_pdf(pdf_path)
    print(text)