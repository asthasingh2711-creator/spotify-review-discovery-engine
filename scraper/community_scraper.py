from __future__ import annotations

import re
import time
from urllib.parse import urljoin

import requests
from bs4 import BeautifulSoup

from scraper.config import USER_AGENT
from scraper.utils import clean_text, entry, parse_date

BASE = "https://community.spotify.com"
SESSION = requests.Session()
SESSION.headers.update({"User-Agent": USER_AGENT})

DISCOVERY_QUERIES = [
    "site:community.spotify.com td-p spotify premium 2025",
    "site:community.spotify.com td-p spotify android bug",
    "site:community.spotify.com td-p spotify ios crash",
    "site:community.spotify.com td-p spotify ads premium",
    "site:community.spotify.com td-p spotify shuffle",
    "site:community.spotify.com td-p ongoing issues spotify",
    "site:community.spotify.com td-p spotify 2026",
]

SEED_TOPICS = [
    "/t5/Music-Discussion/AI-Music-Transparency-A-Subscribers-Demand-for-Honesty/td-p/7347820",
    "/t5/Subscriptions/I-see-ads-even-though-I-m-paying-for-Premium/td-p/5926731",
    "/t5/Content-Questions/blatant-advertisement-on-Home-page-of-desktop-Spotify/td-p/7428699",
    "/t5/Android/Spotify-free-Android-app-broken-after-recent-redesign-update/td-p/7433058",
    "/t5/iOS-iPhone-iPad/App-not-loading-on-iPhone/td-p/7464816",
    "/t5/iOS-iPhone-iPad/Spotify-app-constantly-crashing-breaking-audio-functionality-on/td-p/7323447",
    "/t5/Android/BUG-quot-Music-quot-feed-API-Timeout-Offline-Backup-Error-caused/td-p/7394663",
]


def _discover_topic_paths() -> set[str]:
    paths: set[str] = set(SEED_TOPICS)
    for query in DISCOVERY_QUERIES:
        try:
            resp = SESSION.post(
                "https://html.duckduckgo.com/html/",
                data={"q": query, "b": ""},
                timeout=30,
            )
            resp.raise_for_status()
            found = re.findall(r"community\.spotify\.com(/t5/[^\"'\s<>]+/td-p/\d+)", resp.text)
            paths.update(found)
        except requests.RequestException:
            pass
        time.sleep(1)
    return paths


def _extract_date_from_html(html: str):
    iso_matches = re.findall(
        r"(202[56]-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})?)",
        html,
    )
    for raw in iso_matches:
        dt = parse_date(raw)
        if dt:
            from scraper.utils import in_date_range
            if in_date_range(dt):
                return dt

    day_matches = re.findall(r"(202[56]-\d{2}-\d{2})", html)
    for raw in day_matches:
        dt = parse_date(raw)
        if dt:
            from scraper.utils import in_date_range
            if in_date_range(dt):
                return dt
    return None


def _parse_topic_page(path: str) -> dict | None:
    url = urljoin(BASE, path)
    try:
        resp = SESSION.get(url, timeout=30)
        resp.raise_for_status()
    except requests.RequestException:
        return None

    soup = BeautifulSoup(resp.text, "html.parser")
    title_el = soup.select_one("h1, .lia-message-subject, .MessageSubject")
    title = clean_text(title_el.get_text()) if title_el else path.split("/")[-2].replace("-", " ")

    body_el = soup.select_one(".lia-message-body-content, .message-body, .lia-component-message")
    text = clean_text(body_el.get_text()) if body_el else title

    author_el = soup.select_one(".UserName, .lia-user-name, .author .login-bold")
    author = clean_text(author_el.get_text()) if author_el else "Community member"

    date_el = soup.select_one("time[datetime]")
    dt = None
    if date_el:
        dt = parse_date(date_el.get("datetime"))
    if not dt:
        for meta in soup.select('meta[property="article:published_time"], meta[name="date"]'):
            dt = parse_date(meta.get("content"))
            if dt:
                break
    if not dt:
        dt = _extract_date_from_html(resp.text)

    return entry(
        source="Spotify Community",
        entry_type="discussion",
        title=title,
        text=text,
        author=author,
        date=dt,
        url=url,
        extra={"board": path.split("/")[2] if len(path.split("/")) > 2 else ""},
    )


def scrape_community() -> list[dict]:
    paths = _discover_topic_paths()
    results: list[dict] = []
    seen: set[str] = set()

    for path in sorted(paths):
        if path in seen:
            continue
        seen.add(path)
        record = _parse_topic_page(path)
        if record:
            results.append(record)
        time.sleep(0.6)

    return results
