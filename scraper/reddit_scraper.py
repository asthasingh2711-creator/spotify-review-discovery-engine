from __future__ import annotations

import time
from typing import Any

import requests

from scraper.config import DATE_END, DATE_START, REDDIT_SEARCH_QUERIES, REDDIT_SUBREDDITS, USER_AGENT
from scraper.utils import clean_text, entry, parse_date

PULLPUSH_BASE = "https://api.pullpush.io/reddit/search"
SESSION = requests.Session()
SESSION.headers.update({"User-Agent": USER_AGENT})

AFTER_TS = int(DATE_START.timestamp())
BEFORE_TS = int(DATE_END.timestamp())


def _fetch_pullpush(endpoint: str, params: dict) -> list[dict]:
    try:
        resp = SESSION.get(f"{PULLPUSH_BASE}/{endpoint}/", params=params, timeout=60)
        resp.raise_for_status()
        return resp.json().get("data", [])
    except (requests.RequestException, ValueError):
        return []


def _paginate_pullpush(endpoint: str, base_params: dict, max_items: int = 400) -> list[dict]:
    results: list[dict] = []
    before = BEFORE_TS

    while len(results) < max_items:
        params = {**base_params, "after": AFTER_TS, "before": before, "size": 100, "sort": "desc", "sort_type": "created_utc"}
        batch = _fetch_pullpush(endpoint, params)
        if not batch:
            break
        results.extend(batch)
        oldest = min(item.get("created_utc", before) for item in batch)
        if oldest <= AFTER_TS or oldest >= before:
            break
        before = oldest - 1
        time.sleep(0.5)

    return results[:max_items]


def _submission_to_entry(post: dict) -> dict | None:
    title = post.get("title", "")
    body = post.get("selftext", "")
    if not title and not body:
        return None
    created = parse_date(post.get("created_utc"))
    permalink = post.get("permalink", "")
    url = f"https://www.reddit.com{permalink}" if permalink else post.get("url", "")
    return entry(
        source="Reddit",
        entry_type="discussion",
        title=title,
        text=body or title,
        author=post.get("author", ""),
        date=created,
        url=url,
        extra={
            "subreddit": post.get("subreddit", ""),
            "score": post.get("score"),
            "num_comments": post.get("num_comments"),
        },
    )


def _comment_to_entry(comment: dict) -> dict | None:
    body = comment.get("body", "")
    if not body or body in ("[deleted]", "[removed]"):
        return None
    created = parse_date(comment.get("created_utc"))
    permalink = comment.get("permalink", "")
    url = f"https://www.reddit.com{permalink}" if permalink else ""
    link_title = comment.get("link_title", "")
    return entry(
        source="Reddit",
        entry_type="comment",
        title=f"Re: {clean_text(link_title, 200)}" if link_title else "Reddit comment",
        text=body,
        author=comment.get("author", ""),
        date=created,
        url=url,
        extra={
            "subreddit": comment.get("subreddit", ""),
            "score": comment.get("score"),
        },
    )


def scrape_reddit() -> list[dict]:
    seen: set[str] = set()
    results: list[dict] = []

    def add(items: list[dict | None]):
        for item in items:
            if item and item["id"] not in seen:
                seen.add(item["id"])
                results.append(item)

    for sub in REDDIT_SUBREDDITS:
        posts = _paginate_pullpush("submission", {"subreddit": sub}, max_items=200)
        add([_submission_to_entry(p) for p in posts])
        comments = _paginate_pullpush("comment", {"subreddit": sub}, max_items=200)
        add([_comment_to_entry(c) for c in comments])
        time.sleep(0.3)

    for query in REDDIT_SEARCH_QUERIES:
        posts = _paginate_pullpush("submission", {"q": query}, max_items=100)
        add([_submission_to_entry(p) for p in posts])
        time.sleep(0.3)

    truespotify_posts = _paginate_pullpush("submission", {"subreddit": "truespotify"}, max_items=300)
    add([_submission_to_entry(p) for p in truespotify_posts])

    return results
