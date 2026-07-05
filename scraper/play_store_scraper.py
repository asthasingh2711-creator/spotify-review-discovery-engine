from __future__ import annotations

from google_play_scraper import Sort, reviews

from scraper.config import APP_ID_ANDROID
from scraper.utils import entry, parse_date


def scrape_play_store(max_reviews: int = 500) -> list[dict]:
    results: list[dict] = []
    seen_ids: set[str] = set()
    token = None
    batch_size = 200

    while len(results) < max_reviews:
        batch, token = reviews(
            APP_ID_ANDROID,
            lang="en",
            country="us",
            sort=Sort.NEWEST,
            count=min(batch_size, max_reviews - len(results)),
            continuation_token=token,
        )
        if not batch:
            break

        oldest_in_batch = None
        for r in batch:
            dt = parse_date(r.get("at"))
            if dt:
                oldest_in_batch = dt if oldest_in_batch is None else min(oldest_in_batch, dt)
            record = entry(
                source="Play Store",
                entry_type="review",
                title=f"{r.get('score', '?')}★ review",
                text=r.get("content", ""),
                author=r.get("userName", ""),
                date=dt,
                url=f"https://play.google.com/store/apps/details?id={APP_ID_ANDROID}&reviewId={r.get('reviewId', '')}",
                rating=r.get("score"),
                extra={
                    "review_id": r.get("reviewId"),
                    "thumbs_up": r.get("thumbsUpCount"),
                    "app_version": r.get("reviewCreatedVersion"),
                },
            )
            if record and record["id"] not in seen_ids:
                seen_ids.add(record["id"])
                results.append(record)

        from scraper.config import DATE_START
        if oldest_in_batch and oldest_in_batch < DATE_START:
            break
        if not token:
            break

    return results
