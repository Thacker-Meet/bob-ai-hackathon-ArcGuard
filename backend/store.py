"""MongoDB persistence. Every mutation and its audit event share one logical operation."""
import json
import base64
import hashlib
import hmac
import secrets
import sys
from datetime import timedelta
from contextlib import contextmanager
from datetime import datetime, timezone
from pathlib import Path
VENDOR_DIR = Path(__file__).resolve().parent.parent / '.vendor'
if VENDOR_DIR.exists() and str(VENDOR_DIR) not in sys.path: sys.path.insert(0, str(VENDOR_DIR))
from pymongo import MongoClient
from pymongo.errors import PyMongoError
from .seed import make_seed, PROTOCOL, SEED_CAPAS

MONGO_URI = "mongodb://localhost:27017"
DB_NAME   = "arcguard"
ADMIN_EMAIL = "admin@arcguard.local"
ADMIN_PASSWORD = "admin-password-123"


class Store:
    def __init__(self, uri=MONGO_URI, db_name=DB_NAME):
        self._client = MongoClient(uri, serverSelectionTimeoutMS=5000, tz_aware=True)
        db = self._client[db_name]
        self._state   = db["state"]
        self._reviews = db["reviews"]
        self._capas   = db["capas"]
        self._audit   = db["audit"]
        self._users   = db["users"]
        self._sessions = db["sessions"]

        # Normalize state documents written by the earlier MongoDB adapter.
        for document in self._state.find({"key": {"$exists": False}}):
            legacy_key = document.get("_id")
            if not isinstance(legacy_key, str) or not legacy_key:
                continue
            value = document.get("value")
            self._state.update_one(
                {"_id": document["_id"]},
                {"$set": {
                    "key": legacy_key,
                    "value": value if isinstance(value, str) else json.dumps(value),
                }},
            )
        for document in self._capas.find({"value": {"$exists": False}}):
            value = {key: item for key, item in document.items() if key != "_id"}
            self._capas.update_one(
                {"_id": document["_id"]},
                {"$set": {"value": json.dumps(value)}},
            )
        for document in self._audit.find({"seq": {"$exists": False}}):
            payload = document.get("payload", {})
            self._audit.update_one(
                {"_id": document["_id"]},
                {"$set": {
                    "seq": document.get("id"),
                    "payload": payload if isinstance(payload, str) else json.dumps(payload),
                }},
            )

        # Create indexes (idempotent)
        self._state.create_index("key",   unique=True)
        self._reviews.create_index("id",  unique=True)
        self._capas.create_index("id",    unique=True)
        self._audit.create_index("seq")
        self._users.create_index("email", unique=True)
        self._sessions.create_index("expiresAt", expireAfterSeconds=0)

        # Seed once if the state collection is empty
        if self._state.count_documents({}) == 0:
            batch = make_seed()
            self._state.insert_many([
                {"key": "batch",    "value": json.dumps(batch)},
                {"key": "protocol", "value": json.dumps(PROTOCOL)},
            ])
            for capa in SEED_CAPAS:
                self._capas.update_one(
                    {"id": capa["id"]},
                    {"$set": {"id": capa["id"], "value": json.dumps(capa)}},
                    upsert=True,
                )
            self._audit.insert_one({
                "seq":       self._next_seq(),
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "actor":     "System",
                "action":    "seed_created",
                "payload":   json.dumps({"synthetic": True, "sites": 204, "visits": 5304,
                                         "capas": len(SEED_CAPAS)}),
            })
        # Local mode intentionally has one account only. There is no public registration route.
        self._users.update_one(
            {'email': ADMIN_EMAIL},
            {'$set': {'name': 'ArcGuard Administrator', 'email': ADMIN_EMAIL, 'password': self.hash_password(ADMIN_PASSWORD)},
             '$setOnInsert': {'createdAt': datetime.now(timezone.utc).isoformat()}},
            upsert=True,
        )
        self._users.delete_many({'email': {'$ne': ADMIN_EMAIL}})
        self._sessions.delete_many({})

    @staticmethod
    def hash_password(password, salt=None):
        salt = salt or secrets.token_bytes(16)
        digest = hashlib.scrypt(password.encode(), salt=salt, n=2**14, r=8, p=1, dklen=32)
        return {'salt': base64.b64encode(salt).decode(), 'digest': base64.b64encode(digest).decode(), 'algorithm': 'scrypt'}

    @staticmethod
    def verify_password(password, record):
        try:
            encoded = record.get('password', record)
            salt = base64.b64decode(encoded['salt']); expected = base64.b64decode(encoded['digest'])
            actual = hashlib.scrypt(password.encode(), salt=salt, n=2**14, r=8, p=1, dklen=32)
            return hmac.compare_digest(actual, expected)
        except (KeyError, ValueError, TypeError): return False

    def find_user(self, email): return self._users.find_one({'email': email})

    def create_session(self, user):
        token, csrf = secrets.token_urlsafe(32), secrets.token_urlsafe(24)
        expires = datetime.now(timezone.utc) + timedelta(hours=8)
        self._sessions.insert_one({'_id': token, 'userId': user['_id'], 'csrf': csrf, 'expiresAt': expires})
        return token, csrf, expires

    def get_session(self, token): return self._sessions.find_one({'_id': token}) if token else None
    def delete_session(self, token):
        if token: self._sessions.delete_one({'_id': token})

    # ------------------------------------------------------------------
    # Internal helpers
    # ------------------------------------------------------------------

    def _next_seq(self):
        """Monotonically increasing integer for audit ordering."""
        last = self._audit.find_one(sort=[("seq", -1)])
        return (last["seq"] + 1) if last else 1

    # ------------------------------------------------------------------
    # Context manager – yields a lightweight "db" proxy used by server.py
    # ------------------------------------------------------------------

    @contextmanager
    def connect(self):
        """Yield a _Session that mimics the subset of the sqlite3 cursor API
        used by server.py (execute / fetchone / fetchall)."""
        session = _Session(self)
        try:
            yield session
        finally:
            pass  # MongoDB connections are pooled; nothing to close per-request.

    # ------------------------------------------------------------------
    # Mutations (called by server.py via the session, or directly)
    # ------------------------------------------------------------------

    @staticmethod
    def put(db, key, value):
        """Upsert a key/value pair into the state collection.
        `db` is a _Session (or anything with a store reference).
        """
        db._store._state.update_one(
            {"key": key},
            {"$set": {"value": json.dumps(value)}},
            upsert=True,
        )

    @staticmethod
    def audit(db, actor, action, payload):
        store = db._store
        store._audit.insert_one({
            "seq":       store._next_seq(),
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "actor":     actor,
            "action":    action,
            "payload":   json.dumps(payload),
        })

    # ------------------------------------------------------------------
    # Reads
    # ------------------------------------------------------------------

    def snapshot(self):
        state   = {doc["key"]: json.loads(doc["value"])
                   for doc in self._state.find()}
        reviews = {doc["id"]: json.loads(doc["value"])
                   for doc in self._reviews.find()}
        capas   = [json.loads(doc["value"])
                   for doc in self._capas.find()]
        return state, reviews, capas

    def events(self):
        return [
            {
                "id":        doc["seq"],
                "timestamp": doc["timestamp"],
                "actor":     doc["actor"],
                "action":    doc["action"],
                "payload":   json.loads(doc["payload"]),
            }
            for doc in self._audit.find(sort=[("seq", -1)], limit=500)
        ]


# ---------------------------------------------------------------------------
# Thin session proxy – keeps server.py changes minimal
# ---------------------------------------------------------------------------

class _Session:
    """Mimics the subset of the sqlite3 connection used in server.py.

    server.py patterns we need to support:
        with store.connect() as db:
            db.execute('BEGIN IMMEDIATE')                       # no-op
            state = {r['key']: ... for r in db.execute('SELECT * FROM state')}
            db.execute('INSERT INTO reviews ...',  (id, value))
            db.execute('INSERT INTO capas ...',    (id, value))
            row = db.execute('SELECT value FROM reviews WHERE id=?', (id,)).fetchone()
            rows = db.execute('SELECT payload FROM audit WHERE ...').fetchall()
    """

    def __init__(self, store: Store):
        self._store = store

    def execute(self, sql: str, params=()):
        sql_upper = sql.strip().upper()

        # --- no-ops ---
        if sql_upper.startswith("BEGIN"):
            return _Cursor([])

        # --- state reads ---
        if "FROM STATE" in sql_upper:
            docs = list(self._store._state.find({}, {"_id": 0}))
            return _Cursor(docs)

        # --- reviews reads ---
        if "FROM REVIEWS" in sql_upper and "WHERE" in sql_upper:
            doc = self._store._reviews.find_one({"id": params[0]}, {"_id": 0})
            return _Cursor([doc] if doc else [])

        if "FROM REVIEWS" in sql_upper:
            docs = list(self._store._reviews.find({}, {"_id": 0}))
            return _Cursor(docs)

        # --- capas reads ---
        if "FROM CAPAS" in sql_upper and "WHERE" in sql_upper:
            doc = self._store._capas.find_one({"id": params[0]}, {"_id": 0})
            return _Cursor([doc] if doc else [])

        if "FROM CAPAS" in sql_upper:
            docs = list(self._store._capas.find({}, {"_id": 0}))
            return _Cursor(docs)

        # --- audit reads ---
        if "FROM AUDIT" in sql_upper and "ACTION=" in sql_upper.replace(" ", ""):
            # e.g. "SELECT payload FROM audit WHERE action='protocol_updated'"
            action_val = sql.split("action='")[1].split("'")[0] if "action='" in sql else None
            query = {"action": action_val} if action_val else {}
            docs = list(self._store._audit.find(query, {"_id": 0}))
            return _Cursor(docs)

        # --- reviews insert/upsert ---
        if "INSERT INTO REVIEWS" in sql_upper:
            doc_id, value = params
            self._store._reviews.update_one(
                {"id": doc_id},
                {"$set": {"id": doc_id, "value": value}},
                upsert=True,
            )
            return _Cursor([])

        # --- capas insert/upsert ---
        if "INSERT INTO CAPAS" in sql_upper:
            doc_id, value = params
            self._store._capas.update_one(
                {"id": doc_id},
                {"$set": {"id": doc_id, "value": value}},
                upsert=True,
            )
            return _Cursor([])

        return _Cursor([])


class _Cursor:
    """Minimal cursor that supports .fetchone() and .fetchall() and iteration."""

    def __init__(self, docs):
        self._docs = docs

    def fetchone(self):
        return _Row(self._docs[0]) if self._docs else None

    def fetchall(self):
        return [_Row(d) for d in self._docs]

    def __iter__(self):
        return (_Row(d) for d in self._docs)


class _Row(dict):
    """Dict subclass that also supports attribute-style access (row['key'] or row.key)."""

    def __getattr__(self, item):
        try:
            return self[item]
        except KeyError:
            raise AttributeError(item)
