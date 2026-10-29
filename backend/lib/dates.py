"""Server-side date helpers. The pod clock is UTC — anchor "today" here, never in the browser."""

import os
from datetime import date, datetime, timedelta, timezone
from zoneinfo import ZoneInfo


def today_iso(tz: str | None = None) -> str:
    """Today's date as YYYY-MM-DD in `tz` (default: APP_TZ env, else UTC)."""
    zone = tz or os.environ.get("APP_TZ", "UTC")
    return datetime.now(ZoneInfo(zone)).strftime("%Y-%m-%d")


def days_ago_iso(days: int, tz: str | None = None) -> str:
    """Date `days` days before today as YYYY-MM-DD in `tz` (inclusive window math)."""
    zone = tz or os.environ.get("APP_TZ", "UTC")
    now = datetime.now(ZoneInfo(zone))
    return (now - timedelta(days=max(days, 0))).strftime("%Y-%m-%d")


def utc(dt: datetime | None) -> datetime | None:
    """Motor returns naive datetimes (BSON stores UTC) — normalise on read so Pydantic
    serialises with offset and `new Date(...)` parses correctly."""
    if dt is not None and dt.tzinfo is None:
        return dt.replace(tzinfo=timezone.utc)
    return dt


def utc_deep(value):  # noqa: ANN001 - walks dicts/lists normalising every naive datetime
    if isinstance(value, datetime):
        return utc(value)
    if isinstance(value, dict):
        return {k: utc_deep(v) for k, v in value.items()}
    if isinstance(value, list):
        return [utc_deep(v) for v in value]
    return value


def cutoff_iso(days: int, tz: str | None = None) -> str:
    """Inclusive start date (today - days + 1) for dashboard windows."""
    zone = tz or os.environ.get("APP_TZ", "UTC")
    today = datetime.now(ZoneInfo(zone)).date()
    return (today - timedelta(days=max(days - 1, 0))).isoformat()

