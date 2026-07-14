# Backlog: Concurrency Testing for Clerk/Stripe Webhooks

**Priority:** Medium
**Context:** Phase 12 (Team / organization billing) implemented seat-based subscription checkout flow and Stripe webhook quantity sync.
**Problem / Gap:** The real-world duplicate handling of events with heavy concurrency is unverified. If a sudden burst of `organizationMembership.created` / `deleted` webhooks hit the endpoint, it may cause race conditions when querying Stripe for the existing subscription quantity before updating.
**Root Cause:** Idempotency keys verify singular duplicate events, but rapid sequential updates to the same Stripe subscription might interleave reads/writes.
**Fix Options:**
1. Implement a distributed lock or queue (e.g. BullMQ, Redis) for webhook processing per `clerkOrgId`.
2. Load test the endpoint using `k6` to observe failure rates and Stripe API rate limits, and adjust retry logic.
