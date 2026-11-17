---
date: 2026-10-18
status: CLOSED
feature: higherbits-ai
source_plan: /Users/clarencelloydgayo/Gayo Sphere/HigherBits.dev/process/features/higherbits-ai/active/higherbits-mcp-parity_17-10-26/higherbits-mcp-parity_PLAN_17-10-26.md
---

# HigherBits MCP AC6 Test-Building Backlog

## Gap

There is no authorized safe local Supabase procedure or authoritative RPC/grant evidence for testing repeated and concurrent source admission. Mocked RPC responses cannot prove quota, grant, or idempotency semantics.

## Work

- Identify the authoritative `issue_copy_grant` and `admit_copy_release` RPC/grant contracts.
- Establish a deterministic local-only Supabase fixture and test identities with no production credentials or database access.
- Add a Hybrid test for repeated and concurrent source requests, request-ID idempotency, and denial behavior using that fixture.
- Record exact fixture setup, cleanup, and evidence before changing AC6 from conditional.

## Acceptance

Close this note only when the local-only procedure is reproducible and authoritative RPC/grant semantics are verified. Do not state quota amounts, reset timing, concurrency guarantees, or duplicate-request guarantees before then.

## Verified Local Evidence

- A disposable Supabase/Postgres project `higherbits-mcp-ac6-goal-20261019-v2` was created under `/tmp/higherbits-mcp-ac6-goal-20261019-v2`; API, auth, and other services were disabled. Its only data was the synthetic `public.users(id text primary key)` fixture.
- The sandbox applied the exact tracked `supabase/migrations/20260928_copy_daily_allowance.sql` from the candidate checkout. `migration-verify.sql` and `rls-test.sql` both passed; RLS remained enabled, client roles lacked table/RPC access, and `service_role` retained the grants.
- `process/features/higherbits-ai/active/higherbits-mcp-parity_17-10-26/harness/ac6-admission-behavior.sql` passed via `docker exec -i supabase_db_higherbits-mcp-ac6-goal-20261019-v2 psql -X -v ON_ERROR_STOP=1 -U postgres -d postgres < process/features/higherbits-ai/active/higherbits-mcp-parity_17-10-26/harness/ac6-admission-behavior.sql`. It transactionally replaced the clock, then rolled all fixture changes back.
- Sequential assertions verified three same-request MCP releases succeed and the fourth is rejected; identical replays debit once; a changed response hash yields `request_conflict`; two distinct free admissions succeed and the third returns `copy_limit_reached` with the next UTC midnight reset; pro access does not debit the free counter; eight active grants succeed and the next is `grant_rate_limited` with `retryAfter: 60`; duplicate grant IDs conflict.
- Ten independent local `psql` sessions concurrently called `admit_copy_release` for one synthetic user and ten distinct UUIDs. Exactly two returned `ok`, eight returned `copy_limit_reached`, and the daily counter was exactly two. Test rows were deleted from this disposable database after the assertions.
- The concurrency command used distinct request UUIDs `00000000-0000-4000-8000-000000000001` through `...000000000010`, the same fixed action/target/closure/32-byte hash, and ten parallel `docker exec ... psql -c` sessions. The captured result was `8 copy_limit_reached`, `2 ok`, `Assertions passed: successful=2 denied=8 charged=2`.
- The bootstrap procedure below was rerun from scratch in `/tmp/higherbits-mcp-ac6-repro`: migration verification, RLS/grant checks, sequential SQL assertions, and the documented concurrency probe all passed. `supabase stop` reported `backup=true`; the data volume was preserved.

### Recreate the Disposable Fixture

Use a fresh unique workdir/project ID and free local database port; the recorded run used PostgreSQL port 55432 and project ID higherbits-mcp-ac6-goal-20261019-v2.

    sandbox=/tmp/higherbits-mcp-ac6-repro
    mkdir -p "$sandbox/supabase/migrations" "$sandbox/checks"
    cat > "$sandbox/supabase/config.toml" <<'TOML'
    project_id = "higherbits-mcp-ac6-repro"
    [api]
    enabled = false
    port = 55431
    [db]
    port = 55432
    shadow_port = 55430
    major_version = 15
    [studio]
    enabled = false
    [inbucket]
    enabled = false
    [auth]
    enabled = false
    [realtime]
    enabled = false
    [storage]
    enabled = false
    [analytics]
    enabled = false
    [edge_runtime]
    enabled = false
    [db.seed]
    enabled = false
    TOML
    printf 'CREATE TABLE public.users (id text PRIMARY KEY);\n' > "$sandbox/supabase/migrations/20260927_ac6_test_fixture.sql"
    cp supabase/migrations/20260928_copy_daily_allowance.sql "$sandbox/supabase/migrations/"
    cp supabase/migrations/20260928_copy_daily_allowance.verify.sql "$sandbox/checks/migration-verify.sql"
    cp supabase/migrations/20260928_copy_daily_allowance.rls-test.sql "$sandbox/checks/rls-test.sql"
    mkdir -p /tmp/higherbits-mcp-ac6-home
    HOME=/tmp/higherbits-mcp-ac6-home SUPABASE_DISABLE_TELEMETRY=1 supabase start --workdir "$sandbox" --exclude gotrue,realtime,storage-api,imgproxy,kong,mailpit,postgrest,postgres-meta,studio,edge-runtime,logflare,vector,supavisor
    container=supabase_db_higherbits-mcp-ac6-repro
    docker exec -i "$container" psql -X -v ON_ERROR_STOP=1 -U postgres -d postgres < "$sandbox/checks/migration-verify.sql"
    docker exec -i "$container" psql -X -v ON_ERROR_STOP=1 -U postgres -d postgres < "$sandbox/checks/rls-test.sql"
    docker exec -i "$container" psql -X -v ON_ERROR_STOP=1 -U postgres -d postgres < process/features/higherbits-ai/active/higherbits-mcp-parity_17-10-26/harness/ac6-admission-behavior.sql

To repeat the concurrency probe in this disposable sandbox:

```bash
set -euo pipefail
container=supabase_db_higherbits-mcp-ac6-repro
sandbox=/tmp/higherbits-mcp-ac6-repro
test_user="ac6-concurrent-$$"
tmp="$(mktemp -d)"
cleanup() {
  docker exec "$container" psql -X -q -U postgres -d postgres -c "DELETE FROM public.copy_release_grants WHERE user_id='$test_user'; DELETE FROM public.copy_daily_usage WHERE user_id='$test_user'; DELETE FROM public.users WHERE id='$test_user';" >/dev/null
  rm -rf "$tmp"
}
trap cleanup EXIT
docker exec "$container" psql -X -v ON_ERROR_STOP=1 -U postgres -d postgres -c "INSERT INTO public.users(id) VALUES ('$test_user')"
for index in $(seq 1 10); do
  request_id="$(printf '00000000-0000-4000-8000-%012d' "$index")"
  cat > "$tmp/$index.sql" <<SQL
SELECT CASE WHEN result->>'ok'='true' THEN 'ok' ELSE result->>'error' END
FROM (SELECT public.admit_copy_release('$test_user','$request_id'::uuid,'mcp','component:concurrent','["fixture"]'::jsonb,decode(repeat('ef',32),'hex'),false) AS result) AS admission;
SQL
done
pids=()
for index in $(seq 1 10); do
  docker exec -i "$container" psql -X -A -t -q -v ON_ERROR_STOP=1 -U postgres -d postgres < "$tmp/$index.sql" > "$tmp/$index.out" &
  pids+=("$!")
done
for pid in "${pids[@]}"; do wait "$pid"; done
success="$(grep -lFx ok "$tmp"/*.out | wc -l | tr -d ' ')"
denied="$(grep -lFx copy_limit_reached "$tmp"/*.out | wc -l | tr -d ' ')"
charged="$(docker exec "$container" psql -X -A -t -q -U postgres -d postgres -c "SELECT consumed FROM public.copy_daily_usage WHERE user_id='$test_user' AND utc_day=(now() AT TIME ZONE 'UTC')::date")"
test "$success" -eq 2 && test "$denied" -eq 8 && test "$charged" -eq 2
printf 'PASS: admitted=%s denied=%s charged=%s\n' "$success" "$denied" "$charged"
cleanup
trap - EXIT
HOME=/tmp/higherbits-mcp-ac6-home SUPABASE_DISABLE_TELEMETRY=1 supabase stop --project-id higherbits-mcp-ac6-repro --workdir "$sandbox"
```

This closes the local authoritative RPC/grant test-building gap only. It does not verify deployed grants, production quota behavior, the Next route, or a complete MCP-client-to-database request.

Both recorded local test projects were stopped with the default backup behavior; their local data volumes were preserved, not deleted.
