from __future__ import annotations

import json
import traceback
from datetime import datetime, timezone
from typing import Callable

from scraper.app_store_scraper import scrape_app_store
from scraper.community_scraper import scrape_community
from scraper.config import DATA_DIR, DATA_FILE, DATE_END, DATE_START
from scraper.play_store_scraper import scrape_play_store
from scraper.reddit_scraper import scrape_reddit


def _dedupe(entries: list[dict]) -> list[dict]:
    seen: set[str] = set()
    unique: list[dict] = []
    for item in entries:
        key = item.get("id") or f"{item.get('source')}|{item.get('url')}"
        if key not in seen:
            seen.add(key)
            unique.append(item)
    unique.sort(key=lambda x: x.get("date", ""), reverse=True)
    return unique


def run_scrape(progress: Callable[[str], None] | None = None) -> dict:
    def log(msg: str):
        if progress:
            progress(msg)

    all_entries: list[dict] = []
    errors: list[str] = []

    scrapers = [
        ("Reddit", scrape_reddit),
        ("App Store", scrape_app_store),
        ("Play Store", scrape_play_store),
        ("Spotify Community", scrape_community),
    ]

    for name, fn in scrapers:
        log(f"Scraping {name}...")
        try:
            batch = fn()
            log(f"  → {len(batch)} entries from {name}")
            all_entries.extend(batch)
        except Exception as exc:
            msg = f"{name}: {exc}"
            errors.append(msg)
            log(f"  ✗ Error: {msg}")
            traceback.print_exc()

    existing = load_data()
    existing_entries = existing.get("entries") or []
    log(f"Preserving {len(existing_entries)} existing entries…")
    entries = _dedupe(existing_entries + all_entries)
    payload = {
        "scraped_at": datetime.now(timezone.utc).isoformat(),
        "date_range": {
            "start": DATE_START.date().isoformat(),
            "end": DATE_END.date().isoformat(),
        },
        "total_entries": len(entries),
        "sources": {
            source: sum(1 for e in entries if e["source"] == source)
            for source in sorted({e["source"] for e in entries})
        },
        "errors": errors,
        "entries": entries,
    }
    save_data(payload)
    log(f"Done — {len(entries)} total entries saved.")
    return payload


def save_data(payload: dict) -> None:
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    with open(DATA_FILE, "w", encoding="utf-8") as f:
        json.dump(payload, f, ensure_ascii=False, indent=2)


def load_data() -> dict:
    if not DATA_FILE.exists():
        return {
            "scraped_at": None,
            "date_range": {
                "start": DATE_START.date().isoformat(),
                "end": DATE_END.date().isoformat(),
            },
            "total_entries": 0,
            "sources": {},
            "errors": [],
            "entries": [],
        }
    with open(DATA_FILE, encoding="utf-8") as f:
        return json.load(f)


if __name__ == "__main__":
    result = run_scrape(progress=print)
    print(f"\nSaved {result['total_entries']} entries to {DATA_FILE}")
