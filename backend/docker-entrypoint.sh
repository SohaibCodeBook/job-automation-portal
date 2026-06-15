#!/bin/sh
set -e

# When running in Docker, Postgres on the host is not "localhost".
if [ -n "$DATABASE_URL" ]; then
  export DATABASE_URL="$(printf '%s' "$DATABASE_URL" | sed \
    -e 's/@localhost:/@host.docker.internal:/' \
    -e 's/@127.0.0.1:/@host.docker.internal:/')"
fi

echo "Waiting for database..."
python <<'PY'
import asyncio
import os
import re
import sys

import asyncpg

url = os.environ.get("DATABASE_URL", "")
match = re.match(
    r"postgresql\+asyncpg://([^:]+):([^@]+)@([^:/]+):(\d+)/([^?]+)",
    url,
)
if not match:
    print("Invalid or missing DATABASE_URL", file=sys.stderr)
    sys.exit(1)

user, password, host, port, database = match.groups()


async def wait_for_db() -> None:
    for attempt in range(1, 61):
        try:
            conn = await asyncpg.connect(
                user=user,
                password=password,
                host=host,
                port=int(port),
                database=database,
            )
            await conn.close()
            print("Database is ready.")
            return
        except Exception:
            print(f"Database not ready ({attempt}/60)...")
            await asyncio.sleep(2)
    print("Database not available after 120s.", file=sys.stderr)
    sys.exit(1)


asyncio.run(wait_for_db())
PY

echo "Running migrations..."
if ! alembic upgrade head 2>/tmp/alembic.log; then
  if grep -qi "already exists" /tmp/alembic.log; then
    echo "Schema already present; stamping Alembic head..."
    alembic stamp head
  else
    cat /tmp/alembic.log
    exit 1
  fi
fi

echo "Starting API server..."
exec uvicorn app.main:app --host 0.0.0.0 --port 8000
