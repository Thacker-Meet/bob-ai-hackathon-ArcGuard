"""One-shot helper: upsert the 6 seed Action Plan records into an existing
arcguard MongoDB database.  Safe to run multiple times (idempotent).

Usage:
    python -m backend.inject_seed_capas
"""
import json, sys
from pathlib import Path

VENDOR_DIR = Path(__file__).resolve().parent.parent / '.vendor'
if VENDOR_DIR.exists() and str(VENDOR_DIR) not in sys.path:
    sys.path.insert(0, str(VENDOR_DIR))

from pymongo import MongoClient
from .seed import SEED_CAPAS
from .store import MONGO_URI, DB_NAME

def main():
    client = MongoClient(MONGO_URI, serverSelectionTimeoutMS=5000)
    capas = client[DB_NAME]["capas"]
    inserted, updated = 0, 0
    for capa in SEED_CAPAS:
        result = capas.update_one(
            {"id": capa["id"]},
            {"$set": {"id": capa["id"], "value": json.dumps(capa)}},
            upsert=True,
        )
        if result.upserted_id:
            inserted += 1
            print(f"  + inserted  {capa['id']}  ({capa['status']})")
        else:
            updated += 1
            print(f"  ~ already exists  {capa['id']}  ({capa['status']})")
    print(f"\nDone – {inserted} inserted, {updated} already present.")

if __name__ == "__main__":
    main()
