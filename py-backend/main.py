"""
FleetFuel analytics service (Python / FastAPI).

Handles the compute-heavy read paths — dashboard rollups, per-vehicle monthly
analytics, calendar history and anomaly detection — using an asyncpg pool.
These are the queries that grow with fleet size, so moving them here keeps
throughput high under load while Next.js keeps owning auth, sessions and
rendering (no frontend changes required).

Run:  uvicorn main:app --host 0.0.0.0 --port 8000
"""

from __future__ import annotations

import os
from contextlib import asynccontextmanager
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

import asyncpg
from fastapi import Depends, FastAPI, Header, HTTPException, Query

from anomaly import detect_anomalies

DATABASE_URL = os.environ.get(
    "DATABASE_URL", "postgresql://postgres:postgres@127.0.0.1:5432/app_db"
)
SERVICE_TOKEN = os.environ.get("PY_SERVICE_TOKEN", "")

pool: Optional[asyncpg.Pool] = None


@asynccontextmanager
async def lifespan(_app: FastAPI):
    global pool
    pool = await asyncpg.create_pool(
        DATABASE_URL,
        min_size=2,
        max_size=int(os.environ.get("PY_POOL_MAX", "16")),
        command_timeout=15,
        statement_cache_size=256,
    )
    try:
        yield
    finally:
        if pool:
            await pool.close()


app = FastAPI(title="FleetFuel Analytics", version="1.0.0", lifespan=lifespan)


async def verify_token(x_service_token: str = Header(default="")) -> None:
    """Shared-secret guard so only the Next.js server can call this service."""
    if SERVICE_TOKEN and x_service_token != SERVICE_TOKEN:
        raise HTTPException(status_code=401, detail="unauthorized")


def month_range(offset: int) -> tuple[datetime, datetime]:
    now = datetime.now()
    year = now.year + (now.month - 1 + offset) // 12
    month = (now.month - 1 + offset) % 12 + 1
    start = datetime(year, month, 1)
    if month == 12:
        end = datetime(year + 1, 1, 1)
    else:
        end = datetime(year, month + 1, 1)
    return start, end


def days_in_month(start: datetime) -> int:
    if start.month == 12:
        nxt = datetime(start.year + 1, 1, 1)
    else:
        nxt = datetime(start.year, start.month + 1, 1)
    return (nxt - start).days


def iso(value: Any) -> Optional[str]:
    if value is None:
        return None
    if isinstance(value, datetime):
        if value.tzinfo is None:
            value = value.replace(tzinfo=timezone.utc)
        return value.isoformat()
    return str(value)


def entry_row(r: asyncpg.Record) -> Dict[str, Any]:
    return {
        "id": str(r["id"]),
        "vehicleId": str(r["vehicle_id"]),
        "driverId": str(r["driver_id"]),
        "companyId": str(r["company_id"]),
        "fuelRate": str(r["fuel_rate"]),
        "quantityLiters": str(r["quantity_liters"]),
        "totalAmount": str(r["total_amount"]),
        "odometerKm": r["odometer_km"],
        "beforePhotoUrl": r["before_photo_url"],
        "afterPhotoUrl": r["after_photo_url"],
        "pumpPhotoUrl": r["pump_photo_url"],
        "note": r["note"],
        "anomaly": r["anomaly"],
        "createdAt": iso(r["created_at"]),
        "vehicleName": r["vehicle_name"],
        "driverName": r["driver_name"],
    }


ENTRY_SELECT = """
    SELECT f.id, f.vehicle_id, f.driver_id, f.company_id, f.fuel_rate,
           f.quantity_liters, f.total_amount, f.odometer_km,
           f.before_photo_url, f.after_photo_url, f.pump_photo_url,
           f.note, f.anomaly, f.created_at,
           v.name AS vehicle_name, u.name AS driver_name
    FROM fuel_entries f
    JOIN vehicles v ON v.id = f.vehicle_id
    JOIN users u ON u.id = f.driver_id
"""


@app.get("/health")
async def health() -> Dict[str, Any]:
    assert pool is not None
    async with pool.acquire() as conn:
        await conn.fetchval("SELECT 1")
    return {"ok": True, "service": "fleetfuel-analytics", "runtime": "python"}


@app.get("/analytics/owner-overview", dependencies=[Depends(verify_token)])
async def owner_overview(company_id: str = Query(...)) -> Dict[str, Any]:
    """Dashboard rollup for an owner: month totals, trend, cards, recent."""
    assert pool is not None
    start, end = month_range(0)
    prev_start, prev_end = month_range(-1)

    async with pool.acquire() as conn:
        # Single round-trip for the three scalar rollups.
        totals = await conn.fetchrow(
            """
            SELECT
              COALESCE(SUM(f.total_amount) FILTER (WHERE f.created_at >= $2 AND f.created_at < $3), 0)::float8 AS spend,
              COALESCE(SUM(f.quantity_liters) FILTER (WHERE f.created_at >= $2 AND f.created_at < $3), 0)::float8 AS liters,
              COUNT(*) FILTER (WHERE f.created_at >= $2 AND f.created_at < $3)::int AS entries,
              COALESCE(SUM(f.total_amount) FILTER (WHERE f.created_at >= $4 AND f.created_at < $5), 0)::float8 AS prev_spend,
              COUNT(*) FILTER (WHERE f.created_at >= $2 AND f.anomaly IS NOT NULL)::int AS flagged
            FROM fuel_entries f
            WHERE f.company_id = $1
            """,
            company_id, start, end, prev_start, prev_end,
        )

        counts = await conn.fetchrow(
            """
            SELECT
              (SELECT COUNT(*)::int FROM vehicles WHERE company_id = $1) AS vehicles,
              (SELECT COUNT(*)::int FROM users WHERE company_id = $1 AND role = 'driver') AS drivers
            """,
            company_id,
        )

        cards = await conn.fetch(
            """
            SELECT v.id, v.company_id, v.owner_id, v.driver_id, v.name, v.type,
                   v.registration_number, v.fuel_type, v.created_at,
                   u.name AS driver_name,
                   COALESCE(m.spend, 0)::float8   AS spend,
                   COALESCE(m.liters, 0)::float8  AS liters,
                   COALESCE(m.entries, 0)::int    AS entries,
                   o.last_odometer
            FROM vehicles v
            LEFT JOIN users u ON u.id = v.driver_id
            LEFT JOIN LATERAL (
              SELECT SUM(total_amount) AS spend, SUM(quantity_liters) AS liters,
                     COUNT(*) AS entries
              FROM fuel_entries
              WHERE vehicle_id = v.id AND created_at >= $2 AND created_at < $3
            ) m ON TRUE
            LEFT JOIN LATERAL (
              SELECT MAX(odometer_km) AS last_odometer
              FROM fuel_entries WHERE vehicle_id = v.id
            ) o ON TRUE
            WHERE v.company_id = $1
            ORDER BY v.created_at DESC
            """,
            company_id, start, end,
        )

        recent = await conn.fetch(
            ENTRY_SELECT + " WHERE f.company_id = $1 ORDER BY f.created_at DESC LIMIT 6",
            company_id,
        )

    return {
        "spend": totals["spend"],
        "liters": totals["liters"],
        "entries": totals["entries"],
        "prevSpend": totals["prev_spend"],
        "flagged": totals["flagged"],
        "vehicleCount": counts["vehicles"],
        "driverCount": counts["drivers"],
        "cards": [
            {
                "id": str(c["id"]),
                "companyId": str(c["company_id"]),
                "ownerId": str(c["owner_id"]),
                "driverId": str(c["driver_id"]) if c["driver_id"] else None,
                "name": c["name"],
                "type": c["type"],
                "registrationNumber": c["registration_number"],
                "fuelType": c["fuel_type"],
                "createdAt": iso(c["created_at"]),
                "driverName": c["driver_name"],
                "month": {
                    "spend": c["spend"],
                    "liters": c["liters"],
                    "entries": c["entries"],
                },
                "lastOdometer": c["last_odometer"],
            }
            for c in cards
        ],
        "recent": [entry_row(r) for r in recent],
    }


@app.get("/analytics/vehicle", dependencies=[Depends(verify_token)])
async def vehicle_analytics(
    vehicle_id: str = Query(...), offset: int = Query(0)
) -> Dict[str, Any]:
    assert pool is not None
    start, end = month_range(offset)
    async with pool.acquire() as conn:
        rows = await conn.fetch(
            ENTRY_SELECT
            + " WHERE f.vehicle_id = $1 AND f.created_at >= $2 AND f.created_at < $3"
            + " ORDER BY f.created_at ASC",
            vehicle_id, start, end,
        )
        last_odo = await conn.fetchval(
            "SELECT MAX(odometer_km) FROM fuel_entries WHERE vehicle_id = $1",
            vehicle_id,
        )
    return {
        "entries": [entry_row(r) for r in rows],
        "lastOdometer": last_odo,
        "monthStart": iso(start),
        "monthEnd": iso(end),
    }


@app.get("/analytics/calendar", dependencies=[Depends(verify_token)])
async def calendar(
    offset: int = Query(0),
    company_id: Optional[str] = Query(None),
    driver_id: Optional[str] = Query(None),
) -> Dict[str, Any]:
    if not company_id and not driver_id:
        raise HTTPException(status_code=400, detail="scope_required")

    assert pool is not None
    start, end = month_range(offset)
    async with pool.acquire() as conn:
        if company_id:
            rows = await conn.fetch(
                ENTRY_SELECT
                + " WHERE f.company_id = $1 AND f.created_at >= $2 AND f.created_at < $3"
                + " ORDER BY f.created_at ASC",
                company_id, start, end,
            )
        else:
            rows = await conn.fetch(
                ENTRY_SELECT
                + " WHERE f.driver_id = $1 AND f.created_at >= $2 AND f.created_at < $3"
                + " ORDER BY f.created_at ASC",
                driver_id, start, end,
            )

    entries = [entry_row(r) for r in rows]
    spend = sum(float(e["totalAmount"]) for e in entries)
    liters = sum(float(e["quantityLiters"]) for e in entries)
    flagged = sum(1 for e in entries if e["anomaly"])

    return {
        "entries": entries,
        "monthStart": iso(start),
        "daysInMonth": days_in_month(start),
        "totals": {
            "spend": spend,
            "liters": liters,
            "count": len(entries),
            "flagged": flagged,
        },
    }


@app.get("/analytics/driver-overview", dependencies=[Depends(verify_token)])
async def driver_overview(driver_id: str = Query(...)) -> Dict[str, Any]:
    assert pool is not None
    start, end = month_range(0)
    async with pool.acquire() as conn:
        cards = await conn.fetch(
            """
            SELECT v.id, v.company_id, v.owner_id, v.driver_id, v.name, v.type,
                   v.registration_number, v.fuel_type, v.created_at,
                   u.name AS driver_name,
                   COALESCE(m.spend, 0)::float8  AS spend,
                   COALESCE(m.liters, 0)::float8 AS liters,
                   COALESCE(m.entries, 0)::int   AS entries,
                   o.last_odometer
            FROM vehicles v
            LEFT JOIN users u ON u.id = v.driver_id
            LEFT JOIN LATERAL (
              SELECT SUM(total_amount) AS spend, SUM(quantity_liters) AS liters,
                     COUNT(*) AS entries
              FROM fuel_entries
              WHERE vehicle_id = v.id AND created_at >= $2 AND created_at < $3
            ) m ON TRUE
            LEFT JOIN LATERAL (
              SELECT MAX(odometer_km) AS last_odometer
              FROM fuel_entries WHERE vehicle_id = v.id
            ) o ON TRUE
            WHERE v.driver_id = $1
            ORDER BY v.created_at DESC
            """,
            driver_id, start, end,
        )
        recent = await conn.fetch(
            ENTRY_SELECT
            + " WHERE f.driver_id = $1 AND f.created_at >= $2 AND f.created_at < $3"
            + " ORDER BY f.created_at DESC LIMIT 30",
            driver_id, start, end,
        )

    entries = [entry_row(r) for r in recent]
    return {
        "cards": [
            {
                "id": str(c["id"]),
                "companyId": str(c["company_id"]),
                "ownerId": str(c["owner_id"]),
                "driverId": str(c["driver_id"]) if c["driver_id"] else None,
                "name": c["name"],
                "type": c["type"],
                "registrationNumber": c["registration_number"],
                "fuelType": c["fuel_type"],
                "createdAt": iso(c["created_at"]),
                "driverName": c["driver_name"],
                "month": {
                    "spend": c["spend"],
                    "liters": c["liters"],
                    "entries": c["entries"],
                },
                "lastOdometer": c["last_odometer"],
            }
            for c in cards
        ],
        "recent": entries[:8],
        "monthSpend": sum(float(e["totalAmount"]) for e in entries),
        "monthLiters": sum(float(e["quantityLiters"]) for e in entries),
        "monthEntries": len(entries),
    }


@app.post("/fuel/check", dependencies=[Depends(verify_token)])
async def fuel_check(payload: Dict[str, Any]) -> Dict[str, Any]:
    """Runs anomaly detection against the vehicle's latest entry."""
    assert pool is not None
    vehicle_id = payload["vehicleId"]
    async with pool.acquire() as conn:
        last = await conn.fetchrow(
            """
            SELECT odometer_km, fuel_rate FROM fuel_entries
            WHERE vehicle_id = $1 ORDER BY created_at DESC LIMIT 1
            """,
            vehicle_id,
        )

    codes = detect_anomalies(
        fuel_rate=float(payload["fuelRate"]),
        quantity_liters=float(payload["quantityLiters"]),
        total_amount=float(payload["totalAmount"]),
        odometer_km=int(payload["odometerKm"]),
        last_rate=float(last["fuel_rate"]) if last else None,
        last_odometer_km=last["odometer_km"] if last else None,
    )
    return {
        "anomalies": codes,
        "lastOdometerKm": last["odometer_km"] if last else None,
    }
