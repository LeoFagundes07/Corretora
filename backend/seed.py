"""Idempotent baseline seed: site settings + the realtor's known partners.
Run manually: cd /app/backend && python seed.py

Never creates properties, leads or testimonials — the real catalog is entered by the
realtor through the admin panel, so the site starts with honest empty states."""

import asyncio
from datetime import datetime, timezone
from uuid import uuid4

from lib.db import db, ensure_indexes
from models.settings import SiteSettings


async def main() -> None:
    await ensure_indexes()

    now = datetime.now(timezone.utc)
    settings_doc = await db.settings.find_one({"id": "site"})
    if not settings_doc:
        defaults = SiteSettings(updated_at=now).model_dump()
        await db.settings.insert_one(defaults)
        print("settings: created with brand defaults")
    else:
        print("settings: already present, untouched")

    yees = await db.developers.find_one({"name": {"$regex": "^Yees$", "$options": "i"}})
    if not yees:
        await db.developers.insert_one({
            "id": str(uuid4()),
            "name": "Yees",
            "city": "Sorocaba",
            "notes": "",
            "created_at": now,
        })
        print("developers: Yees created")
    else:
        print("developers: Yees already present")

    counts = {
        "properties": await db.properties.count_documents({}),
        "leads": await db.leads.count_documents({}),
        "testimonials": await db.testimonials.count_documents({}),
        "users": await db.users.count_documents({}),
    }
    print("collections (all start empty by design):", counts)


if __name__ == "__main__":
    asyncio.run(main())
