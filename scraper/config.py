from datetime import datetime, timezone
from pathlib import Path

APP_ID_IOS = "324684580"
APP_ID_ANDROID = "com.spotify.music"

DATE_START = datetime(2025, 1, 1, tzinfo=timezone.utc)
DATE_END = datetime(2026, 6, 19, 23, 59, 59, tzinfo=timezone.utc)

REDDIT_SUBREDDITS = ["spotify", "truespotify", "Music", "androidapps", "ios"]
REDDIT_SEARCH_QUERIES = ["spotify app", "spotify premium", "spotify bug", "spotify ads"]

COMMUNITY_BOARDS = [
    "https://community.spotify.com/t5/iOS-iPhone-iPad/bd-p/iOS",
    "https://community.spotify.com/t5/Android/bd-p/Android",
    "https://community.spotify.com/t5/Subscriptions/bd-p/Subscriptions",
    "https://community.spotify.com/t5/Music-Discussion/bd-p/Music",
    "https://community.spotify.com/t5/Ongoing-Issues/bd-p/spotifyongoingissues",
]

USER_AGENT = (
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
    "AppleWebKit/537.36 (KHTML, like Gecko) "
    "Chrome/120.0.0.0 Safari/537.36 NL-Spotify-Scraper/1.0"
)

PROJECT_ROOT = Path(__file__).resolve().parent.parent
DATA_DIR = PROJECT_ROOT / "data"
DATA_FILE = DATA_DIR / "reviews_discussions.json"
