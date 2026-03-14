import io
from typing import Optional

from fastapi import UploadFile, HTTPException
from pdfminer.high_level import extract_text as extract_pdf_text
from pdfminer.pdfparser import PDFSyntaxError
from docx import Document


# ==========================
# Configuration
# ==========================

MAX_FILE_SIZE_MB = 10  # Prevent very large uploads
ALLOWED_EXTENSIONS = {".pdf", ".docx", ".txt"}


# ==========================
# Custom Exceptions
# ==========================

class UnsupportedFileTypeError(Exception):
    pass


class FileTooLargeError(Exception):
    pass


class TextExtractionError(Exception):
    pass


# ==========================
# Core Extraction Function
# ==========================

async def extract_text_from_upload(file: UploadFile) -> str:
    """
    Extract raw text from uploaded PDF, DOCX, or TXT file.

    Returns:
        str: Extracted text content

    Raises:
        HTTPException: If file invalid or extraction fails
    """

    if not file.filename:
        raise HTTPException(status_code=400, detail="Uploaded file must have a filename.")

    filename = file.filename.lower()

    # Validate extension
    extension = _get_extension(filename)
    if extension not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type. Allowed types: {', '.join(ALLOWED_EXTENSIONS)}"
        )

    # Read file content once (important for async compatibility)
    content = await file.read()

    # Validate file size
    _validate_file_size(content)

    file_stream = io.BytesIO(content)

    try:
        if extension == ".pdf":
            text = _extract_pdf(file_stream)

        elif extension == ".docx":
            text = _extract_docx(file_stream)

        elif extension == ".txt":
            text = _extract_txt(content)

        else:
            # Safety fallback
            raise UnsupportedFileTypeError("Unsupported file type.")

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to extract text: {str(e)}"
        )

    # Final cleanup
    cleaned_text = _clean_text(text)

    if not cleaned_text.strip():
        raise HTTPException(
            status_code=400,
            detail="Uploaded document contains no readable text."
        )

    return cleaned_text


# ==========================
# Extraction Helpers
# ==========================

def _extract_pdf(file_stream: io.BytesIO) -> str:
    try:
        return extract_pdf_text(file_stream)
    except PDFSyntaxError:
        raise TextExtractionError("Invalid or corrupted PDF file.")
    except Exception:
        raise TextExtractionError("Failed to parse PDF document.")


def _extract_docx(file_stream: io.BytesIO) -> str:
    try:
        document = Document(file_stream)
        return "\n".join(para.text for para in document.paragraphs)
    except Exception:
        raise TextExtractionError("Failed to parse DOCX document.")


def _extract_txt(content: bytes) -> str:
    try:
        return content.decode("utf-8")
    except UnicodeDecodeError:
        # Fallback encoding
        return content.decode("latin-1")


# ==========================
# Utility Helpers
# ==========================

def _get_extension(filename: str) -> str:
    return "." + filename.split(".")[-1]


def _validate_file_size(content: bytes) -> None:
    size_mb = len(content) / (1024 * 1024)
    if size_mb > MAX_FILE_SIZE_MB:
        raise HTTPException(
            status_code=400,
            detail=f"File size exceeds {MAX_FILE_SIZE_MB}MB limit."
        )


def _clean_text(text: Optional[str]) -> str:
    if not text:
        return ""

    # Normalize whitespace
    text = text.replace("\r", "\n")
    text = "\n".join(line.strip() for line in text.splitlines())

    return text.strip()