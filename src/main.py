"""ArcGuardAI main application entry point.

Run this script to launch the local ArcGuardAI Clinical Risk Intelligence server.
Usage:
    python -m src.main
    or
    python src/main.py --port 8000
"""

import os
import sys
from pathlib import Path

# Add repository root to python path
ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))

from backend.server import make_server, AS_OF

if __name__ == '__main__':
    import argparse
    parser = argparse.ArgumentParser(description='ArcGuardAI Server')
    parser.add_argument('--port', type=int, default=8000, help='Port to bind (default: 8000)')
    args = parser.parse_args()

    print(f"Starting ArcGuardAI server on http://127.0.0.1:{args.port}")
    server = make_server(port=args.port)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nShutting down ArcGuardAI server.")
        server.server_close()
