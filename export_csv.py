#!/usr/bin/env python3
"""Export scraped data to CSV for offline use."""

from __future__ import annotations

import csv
import sys
from pathlib import Path

from scraper.scrape_all import load_data

COLUMNS = ["id", "source", "type", "date", "rating", "title", "text", "author", "url"]


def export_csv(output: Path | None = None) -> Path:
    data = load_data()
    out = output or Path(__file__).resolve().parent / "data" / "reviews_discussions.csv"
    out.parent.mkdir(parents=True, exist_ok=True)

    with open(out, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=COLUMNS, extrasaction="ignore")
        writer.writeheader()
        for entry in data.get("entries", []):
            writer.writerow(entry)

    return out


if __name__ == "__main__":
    path = export_csv(Path(sys.argv[1]) if len(sys.argv) > 1 else None)
    print(f"Exported to {path}")
