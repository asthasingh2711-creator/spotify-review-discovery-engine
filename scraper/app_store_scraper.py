from __future__ import annotations

import time
from typing import Any

import requests

from scraper.config import APP_ID_IOS, DATE_START, USER_AGENT
from scraper.utils import in_date_range
from scraper.utils import entry, parse_date

ITUNES_RSS = f"https://itunes.apple.com/us/rss/customerreviews/page={{page}}/id={APP_ID_IOS}/sortby=mostrecent/json"
SESSION = requests.Session()
SESSION.headers.update({"User-Agent": USER_AGENT})
MAX_PAGES = 10


def _parse_review(review: dict[str, Any]) -> dict | None:
    author = review.get("author", {}).get("name", {}).get("label", "")
    title = review.get("title", {}).get("label", "")
    content = review.get("content", {}).get("label", "")
    rating_label = review.get("im:rating", {}).get("label")
    updated = review.get("updated", {}).get("label")
    review_id = review.get("id", {}).get("label", "")
    dt = parse_date(updated)
    url = f"https://apps.apple.com/us/app/id{APP_ID_IOS}?see-all=reviews"
    if review_id:
        url = f"https://itunes.apple.com/us/review?id={APP_ID_IOS}&reviewId={review_id}"
    rating = int(rating_label) if rating_label and rating_label.isdigit() else None
    return entry(
        source="App Store",
        entry_type="review",
        title=title,
        text=content,
        author=author,
        date=dt,
        url=url,
        rating=rating,
        extra={"review_id": review_id},
    )


def scrape_app_store() -> list[dict]:
    results: list[dict] = []
    seen_ids: set[str] = set()
    stop_early = False

    for page in range(1, MAX_PAGES + 1):
        if stop_early:
            break
        try:
            resp = SESSION.get(ITUNES_RSS.format(page=page), timeout=30)
            resp.raise_for_status()
            data = resp.json()
        except (requests.RequestException, ValueError):
            break

        feed = data.get("feed", {})
        entries = feed.get("entry", [])
        if isinstance(entries, dict):
            entries = [entries]
        if not entries:
            break

        page_in_range = 0
        for item in entries:
            if "im:rating" not in item:
                continue
            record = _parse_review(item)
            if not record:
                if item.get("updated", {}).get("label"):
                    dt = parse_date(item["updated"]["label"])
                    if dt and dt < DATE_START:
                        stop_early = True
                continue
            if record["id"] in seen_ids:
                continue
            seen_ids.add(record["id"])
            results.append(record)
            page_in_range += 1

        if page_in_range == 0 and page > 1:
            stop_early = True
        time.sleep(0.8)

    return results
