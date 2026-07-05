from __future__ import annotations

import hashlib
import re
from datetime import datetime, timezone
from typing import Any

from dateutil import parser as date_parser

from scraper.config import DATE_END, DATE_START


def parse_date(value: str | int | float | datetime | None) -> datetime | None:
    if value is None:
        return None
    if isinstance(value, datetime):
        dt = value
    elif isinstance(value, (int, float)):
        dt = datetime.fromtimestamp(value, tz=timezone.utc)
    else:
        try:
            dt = date_parser.parse(str(value))
        except (ValueError, TypeError, OverflowError):
            return None
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    return dt.astimezone(timezone.utc)


def in_date_range(dt: datetime | None) -> bool:
    if dt is None:
        return False
    return DATE_START <= dt <= DATE_END


def make_entry_id(source: str, url: str, date: str) -> str:
    raw = f"{source}|{url}|{date}"
    return hashlib.sha256(raw.encode()).hexdigest()[:16]


def clean_text(text: str | None, max_len: int = 5000) -> str:
    if not text:
        return ""
    cleaned = re.sub(r"\s+", " ", text).strip()
    if len(cleaned) > max_len:
        return cleaned[: max_len - 3] + "..."
    return cleaned


def entry(
    *,
    source: str,
    entry_type: str,
    title: str,
    text: str,
    author: str,
    date: datetime | None,
    url: str,
    rating: int | float | None = None,
    extra: dict[str, Any] | None = None,
) -> dict[str, Any] | None:
    if not in_date_range(date):
        return None
    iso_date = date.isoformat() if date else ""
    return {
        "id": make_entry_id(source, url, iso_date),
        "source": source,
        "type": entry_type,
        "title": clean_text(title, 500),
        "text": clean_text(text),
        "author": clean_text(author, 200) or "Anonymous",
        "date": iso_date,
        "rating": rating,
        "url": url,
        **(extra or {}),
    }
