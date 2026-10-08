# FleetFuel — Python analytics service

FastAPI + asyncpg service that owns the **compute-heavy read paths**:

| Endpoint | Purpose |
|---|---|
| `GET /health` | Liveness + DB ping |
| `GET /analytics/owner-overview` | Dashboard rollup (month totals, trend, cards, recent, flagged) |
| `GET /analytics/driver-overview` | Driver dashboard |
| `GET /analytics/vehicle` | Per-vehicle monthly analytics |
| `GET /analytics/calendar` | Calendar history for a month |
| `POST /fuel/check` | Anomaly detection against the vehicle's last entry |

Next.js keeps auth, sessions, uploads, chat writes and rendering. This split means
the queries that grow with fleet size run on an async connection pool tuned for
concurrency, while nothing about the frontend changes.

## Why these endpoints
These are the only routes that do multi-table aggregation over `fuel_entries`,
which is the table that grows fastest. Everything else is a single indexed
lookup and is cheaper to serve in-process from Next.js than over a network hop.

## Run locally

```bash
pip install -r requirements.txt
./run.sh                 # port 8000
```

Then in `.env`:

```
PY_API_URL=http://127.0.0.1:8000
PY_SERVICE_TOKEN=devtoken
```

## Safety: automatic fallback
`src/lib/py-client.ts` calls this service with a 2.5s timeout and a 30s circuit
breaker. If `PY_API_URL` is unset, or the service is slow/down, every caller
transparently falls back to the original TypeScript/Drizzle implementation.
**The app cannot break because of this service.**

## Production deployment
Vercel runs the Next.js app; deploy this service separately (Railway, Fly.io,
Render, or a Vercel Python function) and point `PY_API_URL` at it. Always set
`PY_SERVICE_TOKEN` so only your frontend can call it.

Scale with workers:

```bash
WORKERS=4 PORT=8000 ./run.sh
```
