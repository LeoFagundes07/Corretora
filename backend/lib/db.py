"""Shared Mongo handle — import `client`/`db` from here (server.py, routers, seed.py)."""

import logging
import os
from pathlib import Path

from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient
from pymongo import ASCENDING, DESCENDING, IndexModel

load_dotenv(Path(__file__).parent.parent / ".env")

mongo_url = os.environ["MONGO_URL"]
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ["DB_NAME"]]

logger = logging.getLogger(__name__)

# One entry per collection: every field a route filters, sorts, or dedupes on. Applied by ensure_indexes() at startup.
INDEXES: dict[str, list[IndexModel]] = {
    "users": [
        IndexModel([("id", ASCENDING)], name="id", unique=True),
        IndexModel([("email", ASCENDING)], name="email", unique=True),
    ],
    "settings": [IndexModel([("id", ASCENDING)], name="id", unique=True)],
    "developers": [IndexModel([("id", ASCENDING)], name="id", unique=True)],
    "testimonials": [
        IndexModel([("id", ASCENDING)], name="id", unique=True),
        IndexModel([("published", ASCENDING), ("created_at", DESCENDING)], name="published_created"),
    ],
    "properties": [
        IndexModel([("id", ASCENDING)], name="id", unique=True),
        IndexModel([("slug", ASCENDING)], name="slug", unique=True),
        IndexModel([("code", ASCENDING)], name="code", unique=True),
        IndexModel(
            [("kind", ASCENDING), ("status", ASCENDING), ("featured", DESCENDING), ("created_at", DESCENDING)],
            name="kind_status_featured_created",
        ),
        IndexModel([("status", ASCENDING), ("price_low", ASCENDING)], name="status_price_low"),
        IndexModel([("status", ASCENDING), ("city", ASCENDING)], name="status_city"),
    ],
    "leads": [
        IndexModel([("id", ASCENDING)], name="id", unique=True),
        IndexModel([("whatsapp", ASCENDING)], name="whatsapp"),
        IndexModel([("email", ASCENDING)], name="email"),
        IndexModel([("stage", ASCENDING), ("created_at", DESCENDING)], name="stage_created"),
        IndexModel([("day", ASCENDING)], name="day"),
    ],
    "events": [
        IndexModel([("type", ASCENDING), ("day", ASCENDING)], name="type_day"),
        IndexModel([("property_id", ASCENDING), ("created_at", DESCENDING)], name="property_created"),
    ],
}


async def ensure_indexes() -> None:
    for collection, models in INDEXES.items():
        for model in models:  # one at a time so a bad spec skips only itself
            try:
                await db[collection].create_indexes([model])
            except Exception as exc:  # never block boot on an index; the log line names what to fix
                logger.error("ensure_indexes(%s.%s): %s", collection, model.document["name"], exc)
