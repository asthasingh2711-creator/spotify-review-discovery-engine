#!/usr/bin/env bash
set -e
cd "$(dirname "$0")"

if [ ! -d ".venv" ]; then
  python3 -m venv .venv
fi
source .venv/bin/activate
pip install -q -r requirements.txt

echo "Starting Spotify Reviews & Discussions viewer at http://127.0.0.1:8765"
python -m uvicorn app.server:app --host 127.0.0.1 --port 8765 --reload
