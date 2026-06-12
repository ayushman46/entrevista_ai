from fastapi import HTTPException
import re


def validate_file_extension(filename: str):
    allowed = {".pdf", ".docx", ".doc"}
    ext = "." + filename.lower().rsplit(".", 1)[-1] if "." in filename else ""
    if ext not in allowed:
        raise HTTPException(
            400,
            f"File type '{ext}' not supported. Allowed: {', '.join(allowed)}"
        )


def sanitize_text(text: str, max_length: int = 10000) -> str:
    """Remove potential prompt injection attempts from resume text."""
    # Remove common injection patterns
    injection_patterns = [
        r"ignore previous instructions",
        r"ignore all previous",
        r"system prompt",
        r"<\|.*?\|>",
        r"\[\[.*?\]\]",
    ]
    for pattern in injection_patterns:
        text = re.sub(pattern, "", text, flags=re.IGNORECASE)

    # Truncate
    return text[:max_length].strip()


def validate_answer_text(text: str) -> str:
    if not text or not text.strip():
        raise HTTPException(400, "Answer cannot be empty")
    if len(text) > 5000:
        raise HTTPException(400, "Answer too long (max 5000 characters)")
    return text.strip()
