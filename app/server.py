from __future__ import annotations

import asyncio
import threading
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional

from fastapi import FastAPI
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles

from scraper.config import DATA_FILE
from scraper.scrape_all import load_data, run_scrape

APP_DIR = Path(__file__).resolve().parent
STATIC_DIR = APP_DIR / "static"
DATA_DIR = DATA_FILE.parent

app = FastAPI(title="Spotify Reviews & Discussions")
app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")

_refresh_lock = threading.Lock()
_refresh_status = {
    "running": False,
    "started_at": None,
    "finished_at": None,
    "message": "No refresh run yet.",
    "log": [],
}


def _run_refresh_background():
    global _refresh_status
    with _refresh_lock:
        if _refresh_status["running"]:
            return
        _refresh_status = {
            "running": True,
            "started_at": datetime.now(timezone.utc).isoformat(),
            "finished_at": None,
            "message": "Refresh in progress...",
            "log": [],
        }

    def progress(msg: str):
        _refresh_status["log"].append(msg)
        _refresh_status["message"] = msg

    try:
        result = run_scrape(progress=progress)
        _refresh_status["message"] = f"Refresh complete — {result['total_entries']} entries."
    except Exception as exc:
        _refresh_status["message"] = f"Refresh failed: {exc}"
        _refresh_status["log"].append(str(exc))
    finally:
        _refresh_status["running"] = False
        _refresh_status["finished_at"] = datetime.now(timezone.utc).isoformat()


@app.get("/")
async def index():
    return FileResponse(STATIC_DIR / "index.html")


@app.get("/api/data")
async def get_data(
    source: Optional[str] = None,
    entry_type: Optional[str] = None,
    q: Optional[str] = None,
    page: int = 1,
    per_page: int = 50,
):
    data = load_data()
    entries = data.get("entries", [])

    if source:
        entries = [e for e in entries if e.get("source", "").lower() == source.lower()]
    if entry_type:
        entries = [e for e in entries if e.get("type", "").lower() == entry_type.lower()]
    if q:
        q_lower = q.lower()
        entries = [
            e
            for e in entries
            if q_lower in (e.get("title", "") + e.get("text", "") + e.get("author", "")).lower()
        ]

    total = len(entries)
    start = max(0, (page - 1) * per_page)
    end = start + per_page

    return {
        "scraped_at": data.get("scraped_at"),
        "date_range": data.get("date_range"),
        "sources": data.get("sources", {}),
        "errors": data.get("errors", []),
        "total_entries": data.get("total_entries", total),
        "filtered_total": total,
        "page": page,
        "per_page": per_page,
        "entries": entries[start:end],
    }


@app.post("/api/refresh")
async def refresh_data():
    if _refresh_status["running"]:
        return JSONResponse(
            {"ok": False, "message": "A refresh is already running.", "status": _refresh_status},
            status_code=409,
        )
    thread = threading.Thread(target=_run_refresh_background, daemon=True)
    thread.start()
    await asyncio.sleep(0.1)
    return {"ok": True, "message": "Refresh started.", "status": _refresh_status}


@app.get("/api/download/json")
async def download_json():
    if not DATA_FILE.exists():
        return JSONResponse({"error": "No data yet. Run refresh first."}, status_code=404)
    return FileResponse(DATA_FILE, filename="reviews_discussions.json", media_type="application/json")


@app.get("/api/download/csv")
async def download_csv():
    csv_path = DATA_DIR / "reviews_discussions.csv"
    if not csv_path.exists():
        from export_csv import export_csv
        export_csv(csv_path)
    return FileResponse(csv_path, filename="reviews_discussions.csv", media_type="text/csv")


@app.get("/api/refresh/status")
async def refresh_status():
    return _refresh_status
