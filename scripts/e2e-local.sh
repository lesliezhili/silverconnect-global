#!/usr/bin/env bash
# Isolated Release 1 E2E database: Docker Postgres on localhost:55432 with the
# app schema, migration 0015, the service catalogue and test fixtures.
# Never touches .env.local / production: DATABASE_URL is set explicitly.
set -euo pipefail
cd "$(dirname "$0")/.."

export DATABASE_URL="postgres://postgres:sc_e2e@localhost:55432/sc_e2e"
CONTAINER=sc-e2e-db

docker rm -f "$CONTAINER" >/dev/null 2>&1 || true
docker run -d --name "$CONTAINER" -e POSTGRES_PASSWORD=sc_e2e -e POSTGRES_DB=sc_e2e -p 55432:5432 postgres:16-alpine >/dev/null
until docker exec "$CONTAINER" pg_isready -U postgres >/dev/null 2>&1; do sleep 1; done
psql_() { docker exec -i "$CONTAINER" psql -U postgres -d sc_e2e -v ON_ERROR_STOP=1 -q "$@"; }

npx drizzle-kit push --force >/dev/null
# Created in production by an admin route, not in the drizzle schema.
psql_ <<'SQL'
CREATE TYPE cancellation_reason AS ENUM ('customer_request','provider_unavailable','emergency','duplicate','policy_violation','other');
CREATE TABLE cancellations (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), booking_id UUID NOT NULL REFERENCES bookings(id), cancelled_by UUID NOT NULL REFERENCES users(id), reason cancellation_reason DEFAULT 'customer_request', notes TEXT, refund_amount NUMERIC(10,2) DEFAULT 0, cancellation_fee NUMERIC(10,2) DEFAULT 0, refund_status TEXT DEFAULT 'pending', refund_transaction_id TEXT, payment_provider TEXT, policy_applied TEXT, created_at TIMESTAMPTZ DEFAULT NOW());
SQL
psql_ < drizzle/migrations/0015_release1-tiers-qc-quotes.sql 2>/dev/null
npm run -s db:seed >/dev/null
psql_ < e2e/fixtures/r1-seed.sql
echo "E2E database ready at $DATABASE_URL"
docker exec "$CONTAINER" psql -U postgres -d sc_e2e -Atc "select 'services', count(*) from services union all select 'users', count(*) from users"
